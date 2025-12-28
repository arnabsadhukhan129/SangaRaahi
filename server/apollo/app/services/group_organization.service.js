const User = Lib.Model('Users');
const Events = Lib.Model('Events');
const Communities = Lib.Model('Communities');
const Group = Lib.Model('Groups');
const DatabaseError = require('../errors/database.error');
const ErrorModules = require('../errors');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const crypto = require('crypto');
require('dotenv').config();
const axios = require("axios");
const notificationServices = require('../services/notification.service');
const Services = require('../services');
const ActivityLogService = require('./activity_log.service')


module.exports = {
    getMyCommunityDetails: async function (id, user) {
        let communityId = id;
        if (!communityId) {
            if (!user['selected_organization_portal'] && !user['selectedOrganizationPortal']) {
                const userCommunity = await Communities.aggregate([
                    {
                        "$match": {
                            "_id": new ObjectId(id),
                            "is_deleted": false,
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$members'
                        },
                    },
                    {
                        '$match': {
                            "members.member_id": new ObjectId(user._id || user.id),
                            'members.is_deleted': false,
                            'members.is_active': true,
                            'members.is_approved': true,
                            'members.is_leaved': false,
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sr_users',
                            'localField': 'owner_id',
                            'foreignField': '_id',
                            'as': 'owner_details'
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$owner_details'
                        },
                    },
                ]);
                if (userCommunity && userCommunity.length > 0) {
                    let userDetails = await User.findOne({ _id: new ObjectId(user._id) });
                    userDetails.selected_organization_portal = userCommunity[0]._id;
                    userDetails.save();
                } else {
                    // Don't have any community
                    return { error: true, message: "userNoDefaultCommunity", ErrorClass: ErrorModules.GeneralApiError };
                }
            }
            communityId = user['selected_organization_portal'] || user['selectedOrganizationPortal'];
        } else {
            communityId = new ObjectId(communityId);
        }
        const community = await Communities.aggregate([
            {
                $match: {
                    _id: communityId,
                    is_active: true,
                    is_deleted: false
                }
            },
            {
                $unwind: {
                    path: "$members"
                }
            },
            {
                $match: {
                    "members.member_id": new ObjectId(user._id || user.id),
                    'members.is_deleted': false,
                    'members.is_active': true,
                    'members.is_approved': true,
                    'members.is_leaved': false,
                }
            }
        ]);

        if (Lib.isEmpty(community)) {
            return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
        }
        if (Lib.isEmpty(community[0].members)) {
            return { error: true, message: "notACommunityMember", ErrorClass: ErrorModules.Api404Error };
        }
        const currentMemberRole = community[0].members['roles'][0];
        return {
            error: false,
            message: "generalSuccess",
            data: {
                community: community[0],
                role: currentMemberRole
            }
        };
    },

    getCommunityGroupsList: async function (data) {
        try {
            const page = data.page || 1;
            const limit = data.limit || 10;
            const communityId = data.communityId;
            let sortObject = {};
            let key = "created_at";
            let sort = -1;
            if (data && data.columnName && data.sort) {
                if (data.columnName === 'GroupName') {
                    key = 'name';
                }
                if (data.sort === 'asc') {
                    sort = 1;
                }
            }
            sortObject[key] = sort;

            let filter = { is_deleted: false };
            if (communityId) filter.community_id = ObjectId(communityId);

            groupAggregate = [
                { $match: filter },
                {
                    $sort: { created_at: -1 }
                },
                {
                    '$lookup': {
                        'from': 'sr_users',
                        'localField': 'created_by',
                        'foreignField': '_id',
                        'as': 'user'
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
                        'path': '$user'
                    },
                },
                {
                    '$unwind': {
                        'path': '$members'
                    },
                },
                {
                    '$match': {
                        'members.is_deleted': false,
                        'members.is_active': true,
                        'members.is_approved': true,
                        'members.is_leaved': false,
                    }
                },
                // {
                //     '$addFields': {
                //         'created_by': '$user.name',
                //         'memberCount': { '$size': '$members' }
                //     }
                // },
                {
                    '$unwind': {
                        'path': '$community'
                    },
                },
                {
                    '$group': {
                        '_id': '$_id',
                        'name': { '$first': '$name' },
                        'description': { '$first': '$description' },
                        'image': { '$first': '$image' },
                        'created_by': { '$first': '$user.name' },
                        'created_at': { '$first': '$created_at' },
                        'community': { '$first': '$community' },
                        'community_id': { '$first': '$community_id' },
                        'user': { '$first': '$user' },
                        'is_active': { '$first': '$is_active' },
                        'type': { '$first': '$type' },
                        'members': { '$push': '$members' },
                        'memberCount': { '$sum': 1 }
                    }
                },
                { $sort: { created_at: -1 } },
                { $skip: (page - 1) * limit },
                { $limit: limit }
            ];
            if (data && data.search) {
                groupAggregate[0]['$match']['name'] = {
                    $regex: `.*${data.search}.*`,
                    $options: 'i'
                };
            }
            if (data && data.groupType) {
                groupAggregate[0]['$match']['type'] = (data.groupType == 'Public') ? 'Public' : 'Restricted';
            }

            if (data && typeof data.isActive === 'boolean') {
                groupAggregate[0]['$match']['is_active'] = data.isActive
            }

            const group = await Group.aggregate(groupAggregate).collation({ 'locale': 'en' }).sort(sortObject);
            const total = await Group.countDocuments(filter);
            // Calculate the "from" and "to" values based on page and limit
            const from = (page - 1) * limit + 1;
            const to = Math.min(page * limit, total);
            return ({
                error: false,
                message: "generalSuccess",
                total: total,
                from: from,
                to: to,
                data: group
            });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Group find error");
        }
    },
    getCommunityGroupsListing: async function (data) {
        try {
            const communityId = data.communityId;
            let sortObject = {};
            let key = "created_at";
            let sort = -1;
            if (data && data.columnName && data.sort) {
                if (data.columnName === 'GroupName') {
                    key = 'name';
                }
                if (data.sort === 'asc') {
                    sort = 1;
                }
            }
            sortObject[key] = sort;

            let filter = { is_deleted: false };
            if (communityId) filter.community_id = ObjectId(communityId);

            groupAggregate = [
                { $match: filter },
                {
                    $sort: { created_at: -1 }
                },
                {
                    '$lookup': {
                        'from': 'sr_users',
                        'localField': 'created_by',
                        'foreignField': '_id',
                        'as': 'user'
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
                        'path': '$user'
                    },
                },
                {
                    '$unwind': {
                        'path': '$members'
                    },
                },
                {
                    '$match': {
                        'members.is_deleted': false,
                        'members.is_active': true,
                        'members.is_approved': true,
                        'members.is_leaved': false,
                    }
                },
                // {
                //     '$addFields': {
                //         'created_by': '$user.name',
                //         'memberCount': { '$size': '$members' }
                //     }
                // },
                {
                    '$unwind': {
                        'path': '$community'
                    },
                },
                {
                    '$group': {
                        '_id': '$_id',
                        'name': { '$first': '$name' },
                        'description': { '$first': '$description' },
                        'image': { '$first': '$image' },
                        'created_by': { '$first': '$user.name' },
                        'created_at': { '$first': '$created_at' },
                        'community': { '$first': '$community' },
                        'community_id': { '$first': '$community_id' },
                        'user': { '$first': '$user' },
                        'is_active': { '$first': '$is_active' },
                        'type': { '$first': '$type' },
                        'members': { '$push': '$members' },
                        'memberCount': { '$sum': 1 }
                    }
                },
                { $sort: { created_at: -1 } },
            ];
            if (data && data.search) {
                groupAggregate[0]['$match']['name'] = {
                    $regex: `.*${data.search}.*`,
                    $options: 'i'
                };
            }
            if (data && data.groupType) {
                groupAggregate[0]['$match']['type'] = (data.groupType == 'Public') ? 'Public' : 'Restricted';
            }

            if (data && typeof data.isActive === 'boolean') {
                groupAggregate[0]['$match']['is_active'] = data.isActive
            }

            const group = await Group.aggregate(groupAggregate).collation({ 'locale': 'en' }).sort(sortObject);
            const total = await Group.countDocuments(filter);
            return ({
                error: false,
                message: "generalSuccess",
                total: total,
                data: group
            });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Group find error");
        }
    },
    groupOrgStatusChange: async function (groupId) {
        const group = await Group.findOne({
            _id: ObjectId(groupId)
        });
        if (Lib.isEmpty(group)) {
            return { error: true, message: "nogroupFound", ErrorClass: ErrorModules.Api404Error };
        }
        if (group.is_active == true) {
            group.is_active = false;
        } else {
            group.is_active = true;
        }

        await group.save();
        return { error: false, message: "generalSuccess" };
    },
    updateMyCommunityGroup: async function (id, params, userId) {
        try {
            const group = await Group.findOne({
                _id: ObjectId(id)
            });
            if (Lib.isEmpty(group)) {
                return { error: true, message: "nogroupFound", ErrorClass: ErrorModules.Api404Error };
            }
            // store old data
            const oldData = group.toObject();
            const member = params.members;
            let GroupObj = {};
            if (params.name) {
                let name = { "name": params.name };
                GroupObj = { ...GroupObj, ...name };
            }
            if (params.description) {
                let description = { "description": params.description };
                GroupObj = { ...GroupObj, ...description };
            }
            // if (params.image) {
            //     let image = { "image": params.image };
            //     GroupObj = { ...GroupObj, ...image };
            // }
            if (params.image !== '') {
                let image = { image: params.image };
                GroupObj = { ...GroupObj, ...image };
            } else {
                let image = { image: null };
                GroupObj = { ...GroupObj, ...image };
            }
            if (params.type) {
                let type = { "type": params.type };
                GroupObj = { ...GroupObj, ...type };
            }
            await Group.update({ _id: ObjectId(id) }, { "$set": GroupObj });
            // Updating members
            const groupMemberIdstring = group.members
                .filter(member => !member.is_rejected && !member.is_leaved && !member.is_deleted && member.is_active && member.is_approved)
                .map(member => member.member_id.toString());
            const roleEnum = Lib.getEnum('ROLES_ENUM');
            await Promise.all(member.map(member => {
                if (groupMemberIdstring.includes(member) === false) {
                    group.members.push({
                        member_id: member,
                        roles: [roleEnum.member],
                        is_approved: true,
                        is_active: true
                    });
                }
            }));
            await group.save();
            const updatedGroup = await Group.findOne({ _id: id })
            // store new data
            const newData = updatedGroup.toObject();

            // compute changed fields only
            const changeOldData = {};
            const changeNewData = {};

            Object.keys(GroupObj).forEach((key) => {
                if (String(oldData[key]) !== String(newData[key])) {
                    changeOldData[key] = oldData[key];
                    changeNewData[key] = newData[key];
                }
            });

            const id = group.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const memberRole = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = memberRole.roles;

            // Add activity log
            await ActivityLogService.activityLogActiion({
                communityId: group.community_id,
                userId: userId,
                module: "GROUP",
                action: "UPDATE",
                platForm: "web",
                memberRole: userRole,
                oldData: changeOldData,
                newData: changeNewData
            })
            return ({ error: false, message: "groupUpdateSuccess" });

        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Group find error");
        }
    },
    myCommunityCreateGroup: async function (data, userId, members) {
        const name = data.name;
        const { id, ...groupData } = data;
        const communityId = data.id;
        // Check if group with the same name already exists in the community
        const existingGroup = await Group.findOne({
            name: name,
            community_id: communityId,
            is_deleted: false
        });

        if (existingGroup) {
            return {
                error: true,
                message: "groupAlreadyExists",
                ErrorClass: ErrorModules.Api400Error
            };
        }
        // Create new group
        const newGroup = new Group({
            name: name,
            ...groupData,
            created_by: userId,
            community_id: communityId,
        });

        try {
            const roleEnum = Lib.getEnum('ROLES_ENUM');
            let memberPayload = [];

            memberPayload = [{
                member_id: userId,
                roles: [roleEnum.group_owner],
                is_approved: true,
                is_active: true
            }];
            members.map(member => {
                if (member !== userId.toString()) {
                    memberPayload.push({
                        member_id: member,
                        roles: [roleEnum.member],
                        is_approved: true,
                        is_active: true
                    });
                }

            })
            newGroup['members'] = memberPayload;
            const savedGroup = await newGroup.save();

            const community = await Communities.findOne({ _id: new ObjectId(communityId) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: communityId,
                userId: userId,
                module: "GROUP",
                action: "CREATE",
                platForm: "web",
                memberRole: userRole,
                oldData: null,
                newData: savedGroup.toObject()
            });
            return {
                error: false,
                message: "generalSuccess",
                data: savedGroup
            };
        } catch (error) {
            throw new ErrorModules.DatabaseError("Group creation failed");
        }

    },
    getMyCommunityGroupByID: async function (id, user) {
        try {
            const groupagg = await Group.aggregate([
                {
                    '$match': {
                        '_id': ObjectId(id),
                        'is_deleted': false,
                        'community_id': ObjectId(user.selectedOrganizationPortal)
                    }
                },
                {
                    '$unwind': {
                        'path': '$members'
                    },
                },
                {
                    '$match': {
                        'members.is_deleted': false,
                        'members.is_active': true,
                        'members.is_approved': true,
                        'members.is_leaved': false,
                    }
                },
                {
                    '$lookup': {
                        'from': 'sr_users',
                        'localField': 'members.member_id',
                        'foreignField': '_id',
                        'as': 'members.user'
                    }
                },
                {
                    '$unwind': {
                        'path': '$members.user'
                    },
                },
                {
                    '$group': {
                        '_id': '$_id',
                        'name': { '$first': '$name' },
                        'description': { '$first': '$description' },
                        'image': { '$first': '$image' },
                        'created_by': { '$first': '$created_by' },
                        'community_id': { '$first': '$community_id' },
                        'type': { '$first': '$type' },
                        'members': { '$push': '$members' },
                        'memberCount': { '$sum': 1 }
                    }
                }
            ]);

            if (!groupagg[0]) {
                return Lib.returnError(Errors.invalidGroupId);
            }
            const group = groupagg[0];

            const community = await Communities.findOne({
                '_id': group.community_id,
                'is_deleted': false
            });
            const events = await Events.aggregate([
                {
                    '$match': {
                        'is_deleted': false,
                        'is_active': true,
                        'community_id': ObjectId(user.selectedOrganizationPortal)
                    }
                },
                {
                    '$unwind': {
                        'path': '$groups'
                    },
                },
                {
                    '$match': {
                        'groups.group_id': ObjectId(id),
                        'is_deleted': false
                    }
                },
            ]);
            const communityMembers = Lib.reconstructObjectKeys(group.members, ["user"], function (value, key) {
                return Lib.generalizeUser(value);
            });
            const result = {
                id: group._id,
                name: group.name,
                description: group.description,
                image: group.image,
                type: group.type,
                members: communityMembers,
                memberCount: group.memberCount,
                events,
                myCommunity: Lib.reconstructObjectKeys(community, "value", Lib.convertDate),
            };
            return ({ error: false, message: "generalSuccess", data: result });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Group find error");
        }
    },
    deleteMyCommunityGroup: async function (id, UserId) {
        try {
            const GroupObj = {
                "is_deleted": true
            }
            // const user = await User.findOne({_id : UserId});
            let group = await Group.findOneAndUpdate({ _id: ObjectId(id) }, { "$set": GroupObj });

            const id = group.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === UserId.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: group.community_id,
                userId: UserId,
                module: "GROUP",
                action: "DELETE",
                platForm: "web",
                memberRole: userRole,
                oldData: null,
                newData: null
            })
            return ({ error: false, message: "generalSuccess", data: group });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Group find error");
        }
    },
    getAvailableGroups: async function (data) {
        const eventId = data.eventId;
        const type = data.type;
        const search = data.search;
        const page = data.page || 1;
        const limit = data.limit || 10;

        try {
            const event = await Events.findOne({
                _id: ObjectId(eventId),
                is_deleted: false,
                is_active: true
            });

            if (!event) {
                return ({ error: true, message: "Event not found", data: null });
            }

            const communityId = event.community_id;
            const groupIds = event.groups.map(x => x.group_id);

            const query = {
                _id: { $nin: groupIds },
                community_id: communityId,
                is_deleted: false,
                is_active: true,
                type: { $in: type }
            };

            if (search) {
                query.name = { $regex: new RegExp(search, 'i') };
            }

            const availableGroups = await Group.find(query).skip((page - 1) * limit).limit(limit);

            return {
                error: false,
                message: "generalSuccess",
                data: availableGroups
            };

        } catch (e) {
            throw new DatabaseError("There was an error fetching available groups.");
        }
    }


}