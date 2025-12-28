const Announcement = Lib.Model('Announcements');
const Group = Lib.Model('Groups');
const Communities = Lib.Model('Communities');
const ActivityLogService = require('./activity_log.service')
const DatabaseError = require('../errors/database.error');
const ErrorModules = require('../errors');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const NotificationSettings = Lib.Model('NotificationSettings');
const notificationHelper = require('../library/notifiaction.helper')
module.exports = {
    createAnnouncement: async function (params, id, communityId) {
        let endDate = new Date(Date.parse(params.endDate)).toISOString();

        const announcement = new Announcement({
            user_id: new ObjectId(id),
            community_id: communityId,
            title: params.title,
            description: params.description,
            end_date: endDate,
            to_whom: params.type
        });
        if (!Lib.isEmpty(params.groupId)) {
            announcement.group_id = new ObjectId(params.groupId)
        }
        let res = await announcement.save();

        let members = [];
        if (params.type === "Member") {
            members = ["member", "executive_member", "board_member"]
        } else {
            members = ["fan", "member", "executive_member", "board_member"]
        }
        // Push notification for all community members\
        let slug = "new-announcement";
        let lang = 'en';

        // Getting RSVP members from community members
        let aggregate = [
            {
                '$match': {
                    '_id': new ObjectId(communityId)
                }
            },
            {
                '$unwind': {
                    'path': '$members'
                }
            },
            {
                '$match': {
                    'members.is_approved': true,
                    'members.is_active': true,
                    'members.is_rejected': false,
                    'members.is_leaved': false,
                    'members.is_deleted': false,
                    'members.roles': {
                        '$in': members
                    }
                }
            },
            {
                '$project': {
                    'members.member_id': 1
                }
            }
        ];

        const communityMembers = await Communities.aggregate(aggregate);

        communityMembers.forEach(async element => {
            const notiSettings = await NotificationSettings.findOne({ user_id: new ObjectId(element.members.member_id) });
            if (!Lib.isEmpty(notiSettings)) {
                //check the community announcement notification settings
                if (notiSettings.community_announcement) {
                    //Push notification send
                    await notificationHelper.getFcmTokens(element.members.member_id, slug, lang);
                }
            }
        });

        // ✅ Add activity
        await ActivityLogService.activityLogActiion({
            communityId: communityId,
            userId: id,
            module: "ANNOUNCEMENT",
            action: "CREATE",
            platForm: "web",
            oldData: null,
            newData: {
                title: params.title,
                description: params.description,
                end_date: endDate,
                to_whom: params.type,
                group_id: params.groupId || null
            }
        });
        return ({ error: false, message: "announcementCreatedSuccessfully", data: { id: (res._id).toString() } });
    },
    getAnnouncements: async function (params) {
        let page;
        if (params && params.page) {
            page = parseInt(params.page);
        } else {
            page = 1;
        }

        const limit = 10;
        const skip = (page - 1) * limit;

        let sortObject = {};
        let key = "created_at";
        let sort = -1;
        if (params && params.columnName && params.sort) {
            if (params.columnName === 'AnnouncementName') {
                key = 'title';
            }
            if (params.sort === 'asc') {
                sort = 1;
            }
        }
        sortObject[key] = sort;
        announcementAggregate = [
            {
                '$match': {
                    'is_deleted': false
                }
            },
            {
                '$lookup': {
                    'from': 'sr_communities',
                    'localField': 'community_id',
                    'foreignField': '_id',
                    'as': 'community'
                }
            },
            {
                '$unwind': {
                    'path': '$community'
                },
            },
        ];
        if (params && params.search) {
            announcementAggregate[0]['$match']['title'] = {
                $regex: `.*${params.search}.*`,
                $options: 'i'
            };
        }
        const announcement = await Announcement.aggregate(announcementAggregate).collation({ 'locale': 'en' }).sort(sortObject).skip(skip).limit(limit);
        const total = await Announcement.aggregate(announcementAggregate);
        if (announcement.length === 0) {
            return ({ error: true, message: "noAnnouncementFound", ErrorClass: ErrorModules.API404Error });
        }
        return ({ error: false, message: "generalSuccess", total: total.length, data: announcement });
    },
    getAnnouncementByID: async function (id) {
        const announcement = await Announcement.aggregate([
            {
                '$match': {
                    is_deleted: false,
                    _id: new ObjectId(id)
                }

            },
            {
                '$lookup': {
                    'from': 'sr_communities',
                    'localField': 'community_id',
                    'foreignField': '_id',
                    'as': 'community'
                }
            },
            {
                '$lookup': {
                    'from': 'sr_users',
                    'localField': 'user_id',
                    'foreignField': '_id',
                    'as': 'user'
                }
            },
            {
                '$unwind': {
                    'path': '$community'
                },
            },
            {
                '$unwind': {
                    'path': '$user'
                },
            }
        ]);
        if (announcement.length === 0) {
            return ({ error: true, message: "noAnnouncementFound", ErrorClass: ErrorModules.API404Error });
        }
        return ({ error: false, message: "generalSuccess", data: announcement[0] });

    },
    updateAnnouncement: async function (id, params, user) {
        try {
            let AnnouncementObj = {};
            if (params.title) {
                let title = { "title": params.title };
                AnnouncementObj = { ...AnnouncementObj, ...title };
            }
            if (params.description) {
                let description = { "description": params.description };
                AnnouncementObj = { ...AnnouncementObj, ...description };
            }
            if (params.endDate) {
                var endDate = new Date(Date.parse(params.endDate)).toISOString();
                let endDateob = { "end_date": endDate };
                AnnouncementObj = { ...AnnouncementObj, ...endDateob };
            }
            let obj;
            if (user.userType === "admin") {
                obj = { _id: ObjectId(id) }
            } else {
                obj = { _id: ObjectId(id), user_id: ObjectId(user.id) }
            }
            // ✅ Fetch old announcement
            const oldAnnouncement = await Announcement.findOne(obj);

            let announcement = await Announcement.updateOne(obj, { "$set": AnnouncementObj }, { new: true });
            // ✅ Add activity log 
            await ActivityLogService.activityLogActiion({
                communityId: updatedAnnouncement.community_id,
                userId: user.id,
                module: "ANNOUNCEMENT",
                action: "UPDATE",
                platForm: "web",
                oldData: oldAnnouncement,
                newData: announcement
            });
            return ({ error: false, message: "generalSuccess", data: announcement });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Announcement find error");
        }
    },
    DeleteAnnouncement: async function (id, UserId) {
        try {
            const announcementObj = {
                "is_deleted": true
            }
            let announcement = await Announcement.findOneAndUpdate({ _id: ObjectId(id) }, { "$set": announcementObj });
            // Call activity log
            await ActivityLogService.activityLogActiion({
                communityId: announcement.community_id,
                userId: announcement.user_id,
                module: "ANNOUNCEMENT",
                action: "DELETE",
                platForm: "web",
                oldData: null,
                newData: null
            });
            return ({ error: false, message: "generalSuccess", data: announcement });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Announcement find error");
        }
    },
    getViewAnnouncements: async function (userId, communityId, type) {
        try {

            const announcement = await Announcement.find({
                is_deleted: false,
                is_active: true,
                community_id: new ObjectId(communityId),
                to_whom: { $in: type }
            });
            return ({ error: false, message: "generalSuccess", data: announcement });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Announcement find error");
        }
    },

    announcementStatusChange: async function (announcementId) {
        const announcement = await Announcement.findOne({
            _id: ObjectId(announcementId),
            is_deleted: false
        });
        if (Lib.isEmpty(announcement)) {
            return { error: true, message: "noAnnouncementFound", ErrorClass: ErrorModules.API404Error };
        }

        // Store old status
        const oldData = { is_active: announcement.is_active };
        if (announcement.is_active == true) {
            announcement.is_active = false;
        } else {
            announcement.is_active = true;
        }

        await announcement.save();
        // Log the change
        await ActivityLogService.activityLogActiion({
            communityId: announcement.community_id,
            userId: announcement.user_id,
            module: "ANNOUNCEMENT",
            action: "STATUS_CHANGE",
            oldData,
            newData: { is_active: announcement.is_active }
        });
        return { error: false, message: "announcementStatusChange" };
    },

}