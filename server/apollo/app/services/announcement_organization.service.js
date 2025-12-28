const Announcement = Lib.Model('Announcements');
const Group = Lib.Model('Groups');
const Communities = Lib.Model('Communities');
const DatabaseError = require('../errors/database.error');
const ErrorModules = require('../errors');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const ActivityLogService = require('./activity_log.service')
const NotificationSettings = Lib.Model('NotificationSettings');
const notificationHelper = require('../library/notifiaction.helper')
const CommunityService = require('./community.service');
const notificationServices = require('../services/notification.service');
const helperService = require('./helper.service');
module.exports = {
    createAnnouncementOrganization: async function (user, params, id) {
        // let endDate = new Date(Date.parse(params.endDate)).toISOString();
        let endDate = new Date(params.endDate); // Convert the endDate string to a Date object
        endDate.setHours(23, 59, 59, 999);
        // new Date().toLocaleDateString();
        const announcement = new Announcement({
            user_id: user.id,
            community_id: id,
            title: params.title,
            description: params.description,
            end_date: endDate,
            to_whom: params.type
        });

        let res = await announcement.save();

        const community = await Communities.findOne({ _id: new ObjectId(id) });
        const member = community.members.find(
            (m) => m.member_id.toString() === user.id.toString()
        );
        const userRole = member.roles;

        // Add Activity Log
        await ActivityLogService.activityLogActiion({
            communityId: id,
            userId: user.id,
            module: "ANNOUNCEMENT",
            action: "CREATE",
            platForm: "web",
            memberRole: userRole,
            oldData: null,
            newData: {
                title: res.title,
                description: res.description,
                end_date: endDate,
                to_whom: res.type,
            }
        })

        return ({ error: false, message: "announcementCreatedSuccessfully", data: { id: (res._id).toString(), title: res.title } });
    },
    getAllAnnouncementOrganization: async function (id, params) {
        let page;
        if (params && params.page) {
            page = parseInt(params.page);
        } else {
            page = 1;
        }

        const limit = params.limit ? params.limit : 10;
        const skip = (page - 1) * limit;

        let sortObject = {};
        let key = "created_at";
        let sort = -1;
        if (params && params.columnName && params.sort) {
            if (params.columnName === 'AnnouncementName') {
                key = 'title';
            } else if (params.columnName === 'DateSort') {
                key = 'end_date';
            }
            if (params.sort === 'asc') {
                sort = 1; //sort ato z
            } else if (params.sort === 'desc') {
                sort = -1 //sort z to a
            }
        }
        sortObject[key] = sort;
        announcementAggregate = [
            {
                '$match': {
                    'is_deleted': false,
                    community_id: new ObjectId(id)
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
            {
                '$addFields': {
                    'is_active': {
                        $cond: [
                            { $lt: ["$end_date", new Date()] },
                            'past',
                            {
                                $cond: [
                                    { $eq: ["$is_active", true] },
                                    'active',
                                    'inactive'
                                ]
                            }
                        ]
                    },
                }
            }
        ];
        if (params && params.announcementType) {
            announcementAggregate[0]['$match']['to_whom'] = (params.announcementType == 'Public') ? 'Public' : 'Member'
        }
        if (params && params.search) {
            announcementAggregate[0]['$match']['title'] = {
                $regex: `.*${params.search}.*`,
                $options: 'i'
            };
        }

        // if (params && typeof params.isActive === 'boolean') {
        //     announcementAggregate[0]['$match']['is_active'] = params.isActive
        // }
        if (params && params.isActive) {
            if (params.isActive === 'past') {
                announcementAggregate[0]['$match']['end_date'] = { '$lt': new Date() };
            } else if (params.isActive === 'active') {
                announcementAggregate[0]['$match']['is_active'] = true;
                announcementAggregate[0]['$match']['end_date'] = { '$gt': new Date() };
            } else if (params.isActive === 'inactive') {
                announcementAggregate[0]['$match']['is_active'] = false;
                announcementAggregate[0]['$match']['end_date'] = { '$gt': new Date() };
            }
        }

        const announcement = await Announcement.aggregate(announcementAggregate).collation({ 'locale': 'en' }).sort(sortObject).skip(skip).limit(limit);
        const total = await Announcement.aggregate(announcementAggregate);
        let from = 0;
        let to = 0;
        // const of = total;
        if (announcement.length > 0) { // after query in db with pagination at least 1 data found
            from = ((page - 1) * limit) + 1;
            //console.log(from,"from");
            to = (announcement.length <= limit) ? (from + announcement.length - 1) : (page * limit);
            //console.log(to,"tooooo");
        }
        // if (announcement.length === 0) {
        //     return ({ error: true, message: "noAnnouncementFound", ErrorClass: ErrorModules.API404Error });
        // }
        return ({
            error: false,
            message: "generalSuccess",
            total: total.length,
            from: from,
            to: to,
            data: announcement
        });
    },
    myCommunityAnnouncementStatusChange: async function (eventId) {
        const announcement = await Announcement.findOne({
            _id: ObjectId(eventId)
        });
        if (Lib.isEmpty(announcement)) {
            return { error: true, message: "No announcement found", ErrorClass: ErrorModules.Api404Error };
        }
        // Store old status
        const oldData = { is_active: announcement.is_active };
        if (announcement.is_active == true) {
            announcement.is_active = false;
        } else {
            announcement.is_active = true;
        }

        await announcement.save();

        const id = announcement.community_id;

        const community = await Communities.findOne({ _id: new ObjectId(id) });
        const member = community.members.find(
            (m) => m.member_id.toString() === announcement.user_id.toString()
        );
        const userRole = member.roles;

        // Log the changes
        await ActivityLogService.activityLogActiion({
            communityId: announcement.community_id,
            userId: announcement.user_id,
            module: "ANNOUNCEMENT",
            action: "STATUS_CHANGE",
            platForm: "web",
            memberRole: userRole,
            oldData,
            newData: { is_active: announcement.is_active }
        })
        return { error: false, message: "statusChangedSuccess" };
    },
    updateMyCommunityAnnouncement: async function (id, params, UserId) {
        try {
            let GroupObj = {};
            if (params.title) {
                let title = { "title": params.title };
                GroupObj = { ...GroupObj, ...title };
            }
            if (params.description) {
                let description = { "description": params.description };
                GroupObj = { ...GroupObj, ...description };
            }
            if (params.toWhom) {
                let toWhom = { "to_whom": params.toWhom };
                GroupObj = { ...GroupObj, ...toWhom };
            }
            // if(params.endDate){
            //     var endDate = new Date(Date.parse(params.endDate)).toISOString();
            //     let endDateob = { "end_date": endDate};
            //     GroupObj = { ...GroupObj, ...endDateob };
            // }
            if (params.endDate) {
                // Convert endDate to a standard format and zero out UTC hours and minutes
                const endDate = new Date(Date.parse(params.endDate));
                endDate.setUTCHours(23, 59, 59, 59);
                GroupObj.end_date = endDate.toISOString();
            }
            const oldAnnouncement = await Announcement.findOne({
                _id: ObjectId(id),
                user_id: ObjectId(UserId),
                is_deleted: false
            }).lean();
            let announcement = await Announcement.update({ _id: ObjectId(id), user_id: UserId }, { "$set": GroupObj });

            // fetch new Announcement
            const newAnnouncement = await Announcement.findOne({ _id: ObjectId(id) }).lean();

            // find only changed fields
            let oldData = {};
            let newData = {};
            Object.keys(GroupObj).forEach(key => {
                const oldVal = oldAnnouncement[key]?.toString() ?? null;
                const newVal = newAnnouncement[key]?.toString() ?? null;
                if (oldVal !== newVal) {
                    oldData[key] = oldAnnouncement[key] ?? null;
                    newData[key] = newAnnouncement[key] ?? null;
                }
            });

            const id = oldAnnouncement.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === UserId.toString()
            );
            const userRole = member.roles;

            // log only if something changed
            if (Object.keys(newData).length > 0) {
                await ActivityLogService.activityLogActiion({
                    communityId: oldAnnouncement.community_id,
                    userId: UserId,
                    module: "ANNOUNCEMENT",
                    action: "UPDATE",
                    oldData,
                    newData,
                    platForm: "web",
                    memberRole: userRole
                });
            }
            return ({ error: false, message: "generalSuccess", data: announcement });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Announcement find error");
        }
    },
    async sendSmsEmailForAnnouncement(data, result, dataObj, user, userData) {
        const memberList = await CommunityService.communityMemberList(dataObj, user, userData.data.role);
        const AnnouncementName = result.data.title;
        const communityName = userData?.data?.community?.community_name;
        const communityId = dataObj.communityId;
        const community = await Communities.findOne({ _id: new ObjectId(communityId) });
        if (!community) {
            throw new ErrorModules.Api404Error("noCommunityFound");
        }
        // Check if SMS and email settings are enabled
        const { sms_settings, email_settings } = community.sms_email_global_settings;
        let userName = user.name;
        if (result && !result.error) {
            if (data.type === "Public") {
                const usersCount = memberList.data.length;
                await helperService.validateCreditsRemaining(community, usersCount, usersCount);

                for (const member of memberList.data) {
                    const memberId = member.members.user._id;
                    const memberName = member.members.user.name;
                    const memberEmail = member.members.user.contact.email.address;
                    const memberPhoneCode = member.members.user.contact.phone.phone_code;
                    const memberPhoneNo = member.members.user.contact.phone.number;
                    const phoneNo = memberPhoneCode + memberPhoneNo

                    const ios = await NotificationSettings.findOne({ "user_id": memberId, "community_id": communityId, "device_type": "ios", });
                    const android = await NotificationSettings.findOne({ "user_id": memberId, "community_id": communityId, "device_type": "android", });
                    const web = await NotificationSettings.findOne({ "user_id": memberId, "community_id": communityId, "device_type": "web", });

                    // Fetching user device token 
                    let webToken = [];
                    const deviceToken = member.members.user.device_details;
                    if (deviceToken) {
                        if (ios) {
                            fcmToken = deviceToken.filter(device => device.is_active === true && device.device_type == "ios").map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                            webToken = [...webToken, ...fcmToken];
                        }
                        if (android) {
                            fcmToken = deviceToken.filter(device => device.is_active === true && device.device_type == "android").map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                            webToken = [...webToken, ...fcmToken];
                        }
                        if (web) {
                            webToken = deviceToken.filter(device => device.is_active === true && device.device_type == "web").map(device => device.web_token).filter(token => token !== null && token !== undefined);
                            webToken = [...webToken, ...fcmToken];
                        }
                        // webToken = deviceToken.filter(device => device.is_active === true).map(device => device.web_token).filter(token => token !== null && token !== undefined);
                        // fcmToken = deviceToken.filter(device => device.is_active === true).map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                        // webToken = [...webToken, ...fcmToken];
                    }
                    //SMS Send
                    const smspayload = {
                        recipient:
                        {
                            phone: phoneNo,
                        },
                        template: {
                            type: "SMS",
                            slug: "CREATEANNOUNCEMENT",
                            lang: "en"
                        },
                        contents: {
                            MEMBERNAME: memberName,
                            ANNOUNCEMENTNAME: AnnouncementName,
                            USERNAME: userName,
                            COMMUNITYNAME: communityName
                        }
                    }
                    //EMAIL Send
                    const emailpayload = {
                        recipient:
                        {
                            email: memberEmail,
                        },
                        template: {
                            type: "Email",
                            slug: "CREATEANNOUNCEMENTEMAIL",
                            lang: "en"
                        },
                        contents: {
                            MEMBERNAME: memberName,
                            ANNOUNCEMENTNAME: AnnouncementName,
                            USERNAME: userName,
                            COMMUNITYNAME: communityName
                        }
                    }
                    // Push Notifications
                    const payload = {
                        recipient: {
                            user_id: memberId,
                            fcmToken: webToken
                        },
                        template: {
                            type: "Push",
                            slug: "new-announcement",
                            lang: "en"
                        },
                        image: `${process.env.AWS_PATH}/mike-img-02.png`
                    };
                    const notiSettings = await NotificationSettings.findOne({ user_id: memberId, community_id: communityId });
                    let smsAnnouncement, emailAnnouncement, communityAnnouncement;
                    // If notiSettings exists, extract sms_announcement and email_announcement, else set to true to ensure SMS is sent
                    if (notiSettings) {
                        smsAnnouncement = notiSettings.sms_announcement;
                        emailAnnouncement = notiSettings.email_announcement;
                        communityAnnouncement = notiSettings.community_announcement;
                    } else {
                        smsAnnouncement = true; // Default to true if no settings found
                        emailAnnouncement = true; // Default to true if no settings found
                        communityAnnouncement = true; // Default to true if no settings found
                    }
                    if (sms_settings && smsAnnouncement) {
                        await notificationServices.notifyService(smspayload);
                    }
                    if (email_settings && emailAnnouncement) {
                        await notificationServices.notifyService(emailpayload);
                    }
                    if (communityAnnouncement) {
                        await notificationServices.notifyService(payload);
                    }
                }
            } else if (data.type === "Member") {
                const usersCount = memberList.data.length;
                await helperService.validateCreditsRemaining(community, usersCount, usersCount);
                for (const member of memberList.data) {
                    if (["board_member", "executive_member", "member"].includes(member.members.roles[0])) {
                        const memberId = member.members.user._id;
                        const memberName = member.members.user.name;
                        const memberEmail = member.members.user.contact.email.address;
                        const memberPhoneCode = member.members.user.contact.phone.phone_code;
                        const memberPhoneNo = member.members.user.contact.phone.number;
                        const phoneNo = memberPhoneCode + memberPhoneNo

                        const ios = await NotificationSettings.findOne({ "user_id": memberId, "community_id": communityId, "device_type": "ios", });
                        const android = await NotificationSettings.findOne({ "user_id": memberId, "community_id": communityId, "device_type": "android", });
                        const web = await NotificationSettings.findOne({ "user_id": memberId, "community_id": communityId, "device_type": "web", });

                        // Fetching user device token 
                        let webToken = [];
                        const deviceToken = member.members.user.device_details;
                        if (deviceToken) {
                            if (ios) {
                                fcmToken = deviceToken.filter(device => device.is_active === true && device.device_type == "ios").map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                                webToken = [...webToken, ...fcmToken];
                            }
                            if (android) {
                                fcmToken = deviceToken.filter(device => device.is_active === true && device.device_type == "android").map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                                webToken = [...webToken, ...fcmToken];
                            }
                            if (web) {
                                webToken = deviceToken.filter(device => device.is_active === true && device.device_type == "web").map(device => device.web_token).filter(token => token !== null && token !== undefined);
                                webToken = [...webToken, ...fcmToken];
                            }
                            // webToken = deviceToken.filter(device => device.is_active === true).map(device => device.web_token).filter(token => token !== null && token !== undefined);
                            // fcmToken = deviceToken.filter(device => device.is_active === true).map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                            // webToken = [...webToken, ...fcmToken];
                        }
                        //SMS Send
                        const smspayload = {
                            recipient:
                            {
                                phone: phoneNo,
                            },
                            template: {
                                type: "SMS",
                                slug: "CREATEANNOUNCEMENT",
                                lang: "en"
                            },
                            contents: {
                                MEMBERNAME: memberName,
                                ANNOUNCEMENTNAME: AnnouncementName,
                                USERNAME: userName,
                                COMMUNITYNAME: communityName
                            }
                        }
                        //EMAIL Send
                        const emailpayload = {
                            recipient:
                            {
                                email: memberEmail,
                            },
                            template: {
                                type: "Email",
                                slug: "CREATEANNOUNCEMENTEMAIL",
                                lang: "en"
                            },
                            contents: {
                                MEMBERNAME: memberName,
                                ANNOUNCEMENTNAME: AnnouncementName,
                                USERNAME: userName,
                                COMMUNITYNAME: communityName
                            }
                        }
                        //Push notifications
                        const payload = {
                            recipient: {
                                user_id: memberId,
                                fcmToken: webToken
                            },
                            template: {
                                type: "Push",
                                slug: "new-announcement",
                                lang: "en"
                            },
                            image: `${process.env.AWS_PATH}/mike-img-02.png`
                        };
                        const notiSettings = await NotificationSettings.findOne({ user_id: memberId, community_id: communityId });
                        let smsAnnouncement, emailAnnouncement, communityAnnouncement;
                        // If notiSettings exists, extract sms_event and email_event, else set to true to ensure SMS is sent
                        if (notiSettings) {
                            smsAnnouncement = notiSettings.sms_announcement;
                            emailAnnouncement = notiSettings.email_announcement;
                            communityAnnouncement = notiSettings.community_announcement
                        } else {
                            smsAnnouncement = true; // Default to true if no settings found
                            emailAnnouncement = true; // Default to true if no settings found
                            communityAnnouncement = true; // Default to true if no settings found
                        }
                        if (sms_settings && smsAnnouncement) {
                            await notificationServices.notifyService(smspayload);
                        }
                        if (email_settings && emailAnnouncement) {
                            await notificationServices.notifyService(emailpayload);
                        }
                        if (communityAnnouncement) {
                            await notificationServices.notifyService(payload);
                        }
                    }
                }
            }
        }
    },
}