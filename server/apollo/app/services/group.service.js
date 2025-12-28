const Group = Lib.Model('Groups');
const User = Lib.Model('Users');
const Communities = Lib.Model('Communities');
const DatabaseError = require('../errors/database.error');
const ErrorModules = require('../errors');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const notificationServices = require('./notification.service');
const logger = require('../library/logger');

const NotificationSettings = Lib.Model('NotificationSettings');
const notificationHelper = require('../library/notifiaction.helper')
const ActivityLogService = require('./activity_log.service')
module.exports = {
    // Query
    getGroups: async function (params, user) {
        try {
            let page;
            if (params && params.page) {
                page = parseInt(params.page);
            } else {
                page = 1;
            }
            // define limit per page
            const limit = 10;
            const skip = (page - 1) * limit;

            let sortObject = {};
            let key = "created_at";
            let sort = -1;
            if (params && params.columnName && params.sort) {
                if (params.columnName === 'GroupName') {
                    key = 'name';
                }
                if (params.sort === 'asc') {
                    sort = 1; // sort a to z
                } else if (params.sort === 'desc') {
                    sort = -1; //sort z to a
                }
            }
            sortObject[key] = sort;
            const Userid = user.id;

            groupAggregate = [
                {
                    '$match': {
                        'is_deleted': false,
                    }
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
                        'path': '$community'
                    },
                }];
            if (params && params.search) {
                groupAggregate[0]['$match']['name'] = {
                    $regex: `.*${params.search}.*`,
                    $options: 'i'
                };
            }

            const group = await Group.aggregate(groupAggregate).collation({ 'locale': 'en' }).sort(sortObject).skip(skip).limit(limit);
            const total = await Group.aggregate(groupAggregate);
            return ({ error: false, message: "generalSuccess", total: total.length, data: group });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Group find error");
        }
    },

    getGroupByID: async function (id, user) {
        try {
            const group = await Group.findOne({ is_deleted: false, is_active: true, _id: new ObjectId(id) });
            return ({ error: false, message: "generalSuccess", data: group });
        } catch (e) {
            clog(e);
            return { error: true, message: "internalServerError", stack: e };
        }
    },
    getAdminGroupByID: async function (id, user) {
        try {
            const group = await Group.findOne({ is_deleted: false, _id: new ObjectId(id) });
            return ({ error: false, message: "generalSuccess", data: group });
        } catch (e) {
            clog(e);
            return { error: true, message: "internalServerError", stack: e };
        }
    },
    groupViewDetails: async function (groupId, communityId) {
        try {
            const group = await Group.aggregate(
                [
                    {
                        "$match": {
                            "_id": ObjectId(groupId),
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
                            'members.is_deleted': false,
                            'members.is_active': true,
                            'members.is_approved': true,
                            'members.is_leaved': false,
                        }
                    },
                ]);

            const groupDetails = group[0];

            if (Lib.isEmpty(groupDetails)) {
                return ({ error: true, message: "No group found.", ErrorClass: ErrorModules.Api404Error });
            }

            if (groupDetails.is_active == false) {
                return { error: true, message: "groupNotActive", ErrorClass: ErrorModules.Api404Error };
            }

            if (groupDetails.community_id.toString() !== communityId.toString()) {
                return { error: true, message: "noUnderYourCommunity", ErrorClass: ErrorModules.Api404Error };
            }

            let groupData = {
                id: groupDetails._id,
                name: groupDetails.name,
                description: groupDetails.description,
                image: groupDetails.image,
                memberCount: group.length
            }
            return ({ error: false, message: "generalSuccess", data: groupData });
        } catch (e) {
            clog(e);
            throw new ErrorModules.DatabaseError("Group find error");
        }
    },
    getMembersById: async function (id) {
        try {
            const result = await Group.aggregate([
                { "$match": { "_id": ObjectId(id) } },
                {
                    $lookup: {
                        from: "sr_users",
                        localField: "members.member_id",
                        foreignField: "_id",
                        as: "userInfo"
                    }
                }
            ]);
            if (result) {
                let userInfo = result[0].userInfo;
                let resultArray = [];
                result[0].members.forEach(member => {
                    if (member.is_deleted == false) {
                        const user = userInfo.find(element => (element._id).toString() == (member.member_id).toString());

                        if (user) {
                            let newObj = {
                                user_id: user._id,
                                name: user.name,
                                email: user.contact.email.address,
                                roles: member.roles
                            }
                            resultArray.push(newObj);
                        }
                    }
                });
                return ({ error: false, message: "generalSuccess", data: resultArray });
            } else {
                throw new ErrorModules.DatabaseError("No Member found");
            }

        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Member find error");
        }
    },
    getAvailableUser: async function (id) {
        try {
            const group = await Group.findOne({
                _id: ObjectId(id),
                is_deleted: false
            });
            if (!group) {
                return ({ error: true, message: "Group not found", data: null });
            }
            const result = group.members.map(x => x.member_id)
            const user = await User.find({
                _id: { $nin: result },
                is_deleted: false
            });
            return ({ error: false, message: "generalSuccess", data: user });
        } catch (e) {
            throw new DatabaseError("There is some error.");
        }
    },
    getAvailableCommunityUser: async function (id) {
        try {
            const group = await Group.findOne({
                _id: ObjectId(id),
                is_deleted: false
            });
            if (!group) {
                return ({ error: true, message: "Group not found", data: null });
            }
            const communityId = group.community_id;
            const community = await Communities.findOne({
                _id: ObjectId(communityId)
            });
            const groupMember = [];
            group.members.map(x => {
                if (x.is_approved && x.is_active && !x.is_deleted) {
                    groupMember.push(x.member_id.toString());
                }
            });
            let communityMember = [];
            community.members.map(x => {
                if (x.is_approved && x.is_active && !x.is_deleted) {
                    communityMember.push(x.member_id.toString());
                }
            });
            const leftMembers = Lib.distinctArray(communityMember, groupMember).map(id => ObjectId(id));
            if (leftMembers.length === 0) return { error: false, message: "generalSuccess", data: [] };
            const user = await User.find({
                _id: { $in: leftMembers },
                is_deleted: false,
                is_active: true
            });
            return ({ error: false, message: "generalSuccess", data: user });
        } catch (e) {
            clog(e);
            throw new ErrorModules.FatalError("internalServerError");
        }
    },
    removeGroupMember: async function (params) {
        try {
            const members = params.memberIds;
            const id = params.groupId;
            const group = await Group.findOne({
                _id: ObjectId(id)
            });
            if (Lib.isEmpty(group)) {
                return { error: true, message: "nogroupFound", ErrorClass: ErrorModules.Api404Error };
            }
            group.members.map(member => {
                let isMember = members.includes(member.member_id.toString());
                if (isMember) {
                    member.is_deleted = true;
                }
            });
            group.save();
            return ({ error: false, message: "memberRemovedSuccess" });
        } catch (e) {
            logger.error(e);
            clog(e);
            return { error: true, message: "internalServerError", ErrorClass: ErrorModules.FatalError };
        }
    },
    groupJoinRequest: async function (groupId, UserId) {
        const group = await Group.findOne({ _id: ObjectId(groupId), is_deleted: false, is_active: true });
        if (Lib.isEmpty(group)) {
            return ({ error: true, message: "No group found." });
        }

        if (group.members) {
            let message = "";
            const existMember = group.members.find(member => {
                if (member.member_id.toString() === UserId) {
                    if (member.is_approved && !member.is_rejected && !member.is_deleted) {
                        message = "alreadyAGroupMember";
                        return true;
                    } else if (!member.is_approved && !member.is_deleted && !member.is_rejected) {
                        message = "alreadySendGroupJoinRequest";
                        return true;
                    }
                    return false;
                }
                return false;
            });
            if (existMember) {
                return { error: true, message: message, ErrorClass: ErrorModules.GeneralApiError };
            }
        }
        if (group.community_id) {
            const isMemberInCommunity = await Communities.findOne({
                _id: ObjectId(group.community_id),
                members: {
                    $elemMatch: { member_id: UserId, is_active: true, is_deleted: false, is_approved: true }
                }
            }, ['members']);

            if (Lib.isEmpty(isMemberInCommunity)) {
                return { error: true, message: "notACommunityMember", ErrorClass: ErrorModules.GeneralApiError };
            }
        }
        const roleEnum = Lib.getEnum('ROLES_ENUM');
        let memberPayload = {
            member_id: UserId,
            roles: [roleEnum.member],
            is_active: false
        };
        group.members.push(memberPayload);
        await group.save();
        return { error: false, message: "groupJoinRequestSuccess" };

    },
    getNonStealthGroup: async function (userId, params, communityId) {
        try {
            // Non stealth groups list where user hasn't joined yet
            let nonStealthGroupFindAggregateUsernotIn = [{
                '$match': {
                    'is_deleted': false,
                    'is_active': true,
                    'type': { '$in': ['Public', 'Restricted'] },
                    'community_id': new ObjectId(communityId),
                    'members.member_id': { '$ne': new ObjectId(userId) }
                }
            },
            {
                '$lookup': {
                    'from': 'sr_users',
                    'localField': 'created_by',
                    'foreignField': '_id',
                    'as': 'owner_details'
                }
            },
            {
                '$unwind': {
                    'path': '$owner_details'
                },
            },
            {
                '$unwind': {
                    'path': '$members'
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
                    'is_active': { '$first': '$is_active' },
                    'is_deleted': { '$first': '$is_deleted' },
                    'created_at': { '$first': '$created_at' },
                    'updated_at': { '$first': '$updated_at' },
                    'owner_details': { '$first': '$owner_details' },
                    'members': { '$push': '$members' },
                    'memberCount': { '$sum': 1 }
                }
            }];

            if (params) {
                if (params.search) {
                    nonStealthGroupFindAggregateUsernotIn[0]['$match']['name'] = {
                        $regex: `.*${params.search}.*`,
                        $options: 'i'
                    };
                }
            }

            let groupNotIn = await Group.aggregate(nonStealthGroupFindAggregateUsernotIn).sort({ created_at: -1 });

            let nonStealthGroupFindAggregateUsernotActive = [{
                '$match': {
                    'is_deleted': false,
                    'is_active': true,
                    'type': { '$in': ['Public', 'Restricted'] },
                    'community_id': new ObjectId(communityId),
                    'members': {
                        '$elemMatch': {
                            "member_id": new ObjectId(userId),
                            '$or': [{
                                'is_active': false
                            }, {
                                'is_deleted': true
                            }, {
                                'is_rejected': true
                            }, {
                                'is_approved': false
                            }, {
                                'is_leaved': true
                            }]
                        }
                    },
                }
            },
            {
                '$lookup': {
                    'from': 'sr_users',
                    'localField': 'created_by',
                    'foreignField': '_id',
                    'as': 'owner_details'
                }
            },
            {
                '$unwind': {
                    'path': '$owner_details'
                },
            },
            {
                '$unwind': {
                    'path': '$members'
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
                    'is_active': { '$first': '$is_active' },
                    'is_deleted': { '$first': '$is_deleted' },
                    'created_at': { '$first': '$created_at' },
                    'updated_at': { '$first': '$updated_at' },
                    'owner_details': { '$first': '$owner_details' },
                    'members': { '$push': '$members' },
                    'memberCount': { '$sum': 1 }
                }
            }];
            if (params) {
                if (params.search) {
                    nonStealthGroupFindAggregateUsernotActive[0]['$match']['name'] = {
                        $regex: `.*${params.search}.*`,
                        $options: 'i'
                    };
                }
            }
            let groupNotActive = await Group.aggregate(nonStealthGroupFindAggregateUsernotActive).sort({ created_at: -1 });

            groupNotIn.forEach(elem => {
                groupNotActive.push(elem);
            });

            return ({ error: false, message: "generalSuccess", data: groupNotActive });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Group find error");
        }
    },
    getStealthGroup: async function (params, communityId, user) {
        try {
            // Stealth groups list where user hasn't joined yet
            let stealthGroupFindAggregate = [{
                $match: {
                    is_deleted: false,
                    is_active: true,
                    type: "Stealth",
                    'members.member_id': { '$ne': new ObjectId(user.id) }
                    // '$or':[{
                    //     'members.member_id':new ObjectId(user.id),
                    //     '$or':[{
                    //         'members.is_rejected':true
                    //     },{
                    //         'members.is_leaved':true
                    //     },{
                    //         'members.is_deleted':true
                    //     },{
                    //         'members.is_approved':false
                    //     },{
                    //         'members.is_active':false
                    //     }],

                    // }, 
                    // {
                    //     'members.member_id': {
                    //         '$ne': new ObjectId(user.id),
                    //     },

                    // }]
                    // $or:[{
                    //     'created_by':ObjectId(user.id)
                    // }, 
                    // {
                    //     'members.member_id':ObjectId(user.id),
                    //     'members.is_deleted':false,
                    //     'members.is_active':true,
                    //     'members.is_approved':true,
                    // }]
                }
            }];
            if (params) {
                if (params.search) {
                    stealthGroupFindAggregate[0]['$match']['name'] = {
                        $regex: `.*${params.search}.*`,
                        $options: 'i'
                    };
                }
            }
            // get only those that the user has created
            stealthGroupFindAggregate[0]['$match'].community_id = ObjectId(communityId);
            const groupNotIn = await Group.aggregate(stealthGroupFindAggregate).sort({ created_at: -1 });

            let nonStealthGroupFindAggregateUsernotActive = [{
                '$match': {
                    'is_deleted': false,
                    'is_active': true,
                    'type': "Stealth",
                    'community_id': new ObjectId(communityId),
                    'members': {
                        '$elemMatch': {
                            "member_id": new ObjectId(user.id),
                            '$or': [{
                                'is_active': false
                            }, {
                                'is_deleted': true
                            }, {
                                'is_rejected': true
                            }, {
                                'is_approved': false
                            }, {
                                'is_leaved': true
                            }]
                        }
                    },
                    // '$or':[{
                    //     '$and':[
                    //         {'members.member_id':new ObjectId(userId)},{
                    //             '$or':[{
                    //             'members.is_rejected':true
                    //         },{
                    //             'members.is_leaved':true
                    //         },{
                    //             'members.is_deleted':true
                    //         },{
                    //             'members.is_approved':false
                    //         },{
                    //             'members.is_active':false
                    //         }]}
                    //     ],
                    // }, 
                    // {
                    //     'members.member_id': {
                    //         '$ne': new ObjectId(userId),
                    //     },

                    // }]
                }
            },
            {
                '$lookup': {
                    'from': 'sr_users',
                    'localField': 'created_by',
                    'foreignField': '_id',
                    'as': 'owner_details'
                }
            },
            {
                '$unwind': {
                    'path': '$owner_details'
                },
            }];
            if (params) {
                if (params.search) {
                    nonStealthGroupFindAggregateUsernotActive[0]['$match']['name'] = {
                        $regex: `.*${params.search}.*`,
                        $options: 'i'
                    };
                }
            }
            let groupNotActive = await Group.aggregate(nonStealthGroupFindAggregateUsernotActive).sort({ created_at: -1 });

            groupNotIn.forEach(elem => {
                groupNotActive.push(elem);
            });

            return ({ error: false, message: "generalSuccess", data: groupNotActive });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Group find error");
        }
    },
    discoverGroupList: async function (communityId, userId, search = null, page = 1, limit = 10) {
        const groupAggregate = [
            {
                "community_id": new ObjectId(communityId),
                "members.member_id": {
                    "$ne": new ObjectId(userId)
                },
                "type": {
                    "$ne": Lib.getEnum('GROUP_TYPE.Stealth')
                }
            }
        ];
        if (search) {
            groupAggregate[0]['name'] = new RegExp(`.*${search}.*`, 'i');
        }
        const pagination = Lib.initPagination();
        if (page && limit) {
            // TODO pagination code
        }
        const groups = await Group.aggregate(groupAggregate);
        return {
            error: false, message: "generalSuccess", data: {
                groups: Lib.reconstructObjectKeys(groups),
                pagination: pagination // For now pagination data for model requirements send empty
            }
        }
    },
    getMyGroups: async function (params, communityId, user) {
        try {
            let stealthGroupFindAggregate = [{
                '$match': {
                    'is_active': true,
                    'is_deleted': false,
                    "members": {
                        $elemMatch: {
                            "member_id": new ObjectId(user.id),
                            'is_approved': true,
                            'is_active': true,
                            'is_rejected': false,
                            'is_leaved': false,
                            'is_deleted': false,
                        }
                    }
                }
            },
            {
                '$lookup': {
                    'from': 'sr_users',
                    'localField': 'created_by',
                    'foreignField': '_id',
                    'as': 'owner_details'
                }
            },
            {
                '$unwind': {
                    'path': '$owner_details'
                },
            },
            {
                '$unwind': {
                    'path': '$members'
                },
            },
            {
                '$match': {
                    'members.is_approved': true,
                    'members.is_active': true,
                    'members.is_rejected': false,
                    'members.is_leaved': false,
                    'members.is_deleted': false,

                }
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
                    'is_active': { '$first': '$is_active' },
                    'is_deleted': { '$first': '$is_deleted' },
                    'created_at': { '$first': '$created_at' },
                    'updated_at': { '$first': '$updated_at' },
                    'owner_details': { '$first': '$owner_details' },
                    'members': { '$push': '$members' },
                    'memberCount': { '$sum': 1 }
                }
            }];
            if (params) {
                if (params.search) {
                    stealthGroupFindAggregate[0]['$match']['name'] = {
                        $regex: `.*${params.search}.*`,
                        $options: 'i'
                    };
                }
            }
            // get only those that the user has created
            stealthGroupFindAggregate[0]['$match'].community_id = ObjectId(communityId);
            const group = await Group.aggregate(stealthGroupFindAggregate).sort({ created_at: -1 });
            return ({ error: false, message: "generalSuccess", data: group });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Group find error");
        }
    },
    getNonStealthGroupInfo: async function (groupId, communityId, userId) {
        try {
            let nonStealthGroupFind = {
                _id: new ObjectId(groupId),
                community_id: new ObjectId(communityId),
                is_deleted: false,
                is_active: true,
                type: { $in: ['Public', 'Restricted'] }
            };
            let group = await Group.findOne(nonStealthGroupFind);
            if (Lib.isEmpty(group)) {
                return { error: true, message: "No group found.", ErrorClass: ErrorModules.GeneralApiError };
            }
            group = group.toJSON();
            let myMember = group.members.find(elem => elem.member_id.toString() === userId && elem.is_deleted === false);
            let groupRole = '';
            if (myMember) {
                groupRole = myMember.roles[0];
            }
            // For now. Will be filter from the server later
            group.members = group.members.filter(m => m.is_active && m.is_approved && !m.is_deleted && !m.is_leaved);

            return ({ error: false, message: "generalSuccess", data: group, groupRole: groupRole });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Group find error");
        }
    },
    getStealthGroupInfo: async function (groupId, communityId, userId) {
        try {
            let StealthGroupFind = {
                _id: new ObjectId(groupId),
                community_id: new ObjectId(communityId),
                is_deleted: false,
                is_active: true,
                type: 'Stealth',
                members: {
                    $elemMatch: {
                        member_id: new ObjectId(userId),
                        is_approved: true,
                        is_active: true,
                        is_deleted: false
                    }
                }
            };
            // get only those that the user has created
            let group = await Group.findOne(StealthGroupFind);

            if (Lib.isEmpty(group)) {
                return { error: true, message: "No group found.", ErrorClass: ErrorModules.GeneralApiError };
            }
            group = group.toJSON();
            let myMember = group.members.find(elem => elem.member_id.toString() === userId);
            let groupRole = '';
            if (myMember) {
                groupRole = myMember.roles[0];
            }
            // For now. Will be filter from the server later
            group.members = group.members.filter(m => m.is_active && m.is_approved && !m.is_deleted && !m.is_leaved);

            return ({ error: false, message: "generalSuccess", data: group, groupRole: groupRole });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Group find error");
        }
    },
    groupMemberList: async function (data, _user, lang) {
        const ROLES_LANG_ENUM = Lib.getEnum('ROLES_LANG_ENUM');
        let { groupId, memberType, search } = data;
        let searchName = "";
        if (search) {
            searchName = search;
        }
        const groupMembers = await Group.aggregate([
            {
                '$match': {
                    '_id': new ObjectId(groupId),
                    "is_deleted": false,
                    // "is_active": true,
                }
            }, {
                '$unwind': {
                    'path': '$members'
                }
            }, {
                '$match': {
                    'members.is_approved': true,
                    'members.is_active': true,
                    'members.is_rejected': false,
                    'members.is_deleted': false,
                    'members.is_leaved': false,
                    'members.roles': {
                        '$in': memberType
                    }
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
                '$lookup': {
                    'from': 'sr_communities',
                    'localField': 'community_id',
                    'foreignField': '_id',
                    'as': 'members.community'
                }
            },
            {
                '$lookup': {
                    'from': 'sr_users',
                    'localField': 'created_by',
                    'foreignField': '_id',
                    'as': 'createdUser'
                }
            },
            {
                '$unwind': {
                    'path': '$createdUser'
                }
            },
            {
                '$unwind': {
                    'path': '$members.community'
                }
            },
            {
                '$unwind': {
                    'path': '$members.user'
                }
            },
            {
                '$match': {
                    'members.user.name': new RegExp(`.*${searchName}.*`, 'i')
                }
            },
            {
                '$unwind': {
                    'path': '$members.roles'
                }
            },
            {
                '$project': {
                    'name': 1,
                    'community_id': 1,
                    'created_by': 1,
                    'members.member_id': 1,
                    'members.roles': 1,
                    'members.joined_at': 1,
                    'members.user._id': 1,
                    'members.user.name': 1,
                    'members.user.contact': 1,
                    'members.user.profile_image': 1,
                    'members.community.members.member_id': 1,
                    'members.community.members.roles': 1,
                    'createdUser.name': 1
                }
            }
        ]);

        await Promise.all(groupMembers.map(async (member) => {
            let communityMembers = member.members.community.members;
            let groupRole = member.members.roles;
            member.members.roles = ROLES_LANG_ENUM[groupRole][lang];
            const found = communityMembers.find(element => element.member_id.toString() === member.members.member_id.toString());
            let role = found.roles[0];
            member.community_role = ROLES_LANG_ENUM[role][lang];
            member.community_role_key = role;
            member.logged_user = _user.id;
        }));
        return { error: false, message: "generalSuccess", data: groupMembers };
    },
    groupRequestList: async function (user, search, groupId) {
        const userId = user.id;
        let searchName = "";
        if (search) {
            searchName = search;
        }
        // Get all groups created by logged in user
        let groupAggregate = {
            // is_active: true,
            is_deleted: false,
            created_by: new ObjectId(userId)
        };
        if (groupId) {
            groupAggregate['_id'] = new ObjectId(groupId);
        }
        let myGroup = await Group.find(groupAggregate, '_id');
        let groupIdArray = [];
        // Getting array of group ids
        await Promise.all(myGroup.map(async (group) => {
            groupIdArray.push(group._id);
        }));
        if (Lib.isEmpty(groupIdArray)) {
            return {
                error: false,
                message: "generalSuccess",
                data: []
            };
        }

        let aggregate = [
            {
                '$match': {
                    '_id': {
                        '$in': groupIdArray
                    }
                }
            },
            {
                '$unwind': {
                    'path': '$members'
                }
            },
            {
                '$match': {
                    // 'members.member_id': {
                    //   '$ne': new ObjectId('62b02d8b094010d08651d42c')
                    // }, 
                    'members.is_approved': false,
                    'members.is_rejected': false
                }
            }, {
                '$lookup': {
                    'from': 'sr_users',
                    'localField': 'members.member_id',
                    'foreignField': '_id',
                    'as': 'members.user'
                }
            }, {
                '$unwind': {
                    'path': '$members.user'
                }
            }, {
                '$match': {
                    'members.user.name': new RegExp(`.*${searchName}.*`, 'i')
                }
            },
            {
                '$project': {
                    'name': 1,
                    'members.member_id': 1,
                    'members.roles': 1,
                    'members.joined_at': 1,
                    'members.user._id': 1,
                    'members.user.name': 1,
                    'members.user.contact': 1,
                    'members.user.profile_image': 1
                }
            },
            {
                '$sort': {
                    'members.joined_at': -1
                }
            },
            // {
            //   '$sort': {
            //     'name': 1
            //   }
            // }
        ];

        const groupRequest = await Group.aggregate(aggregate);
        return {
            error: false,
            message: "generalSuccess",
            data: Lib.reconstructObjectKeys(
                groupRequest,
                "joined_at",
                Lib.convertDate)
        };
    },


    // Mutations
    createGroupService: async function (params, id) {
        try {
            const GROUP_TYPE = Lib.getEnum('GROUP_TYPE');
            const communityId = params.communityId;
            // Check if the user can actually create group
            const community = await Communities.findOne({
                _id: ObjectId(communityId),
                members: {
                    $elemMatch: { member_id: ObjectId(id) }
                }
            });
            if (Lib.isEmpty(community)) {
                return { error: true, message: "invalidCommunity", ErrorClass: ErrorModules.Api404Error };
            }
            if (Lib.isEmpty(community.members)) {
                return { error: true, message: "notACommunityMember", ErrorClass: ErrorModules.Api404Error };
            }
            if (community.members) {
                // Check if the member has appropriate role
                const role = community.members[0]['roles'][0];
                // Only member, board_member or executive member can create stealth or non-stealth group
                // In one work fan does not have the authority to create the group
                if (role === Lib.getEnum('ROLES_ENUM.fan')) {
                    return { error: true, message: "notACommunityMember", ErrorClass: ErrorModules.AuthError, statusCode: Lib.getHttpErrors('FORBIDDEN') };
                }
            }

            const group = new Group({
                name: params.name,
                description: params.description,
                image: params.image ? params.image : "https://cdn.memiah.co.uk/blog/wp-content/uploads/counselling-directory.org.uk/2019/04/shutterstock_1464234134-1024x684.jpg",
                created_by: id,
                community_id: params.communityId,
                type: GROUP_TYPE[params.type]
            });
            const roleEnum = Lib.getEnum('ROLES_ENUM');
            const memberPayload = {
                member_id: id,
                roles: [roleEnum.group_owner],
                is_approved: true,
                is_active: true
            };
            group['members'] = [memberPayload];
            const groupMember = new Group(group);
            let res = await groupMember.save();

            const result = await Communities.findOne({ _id: new ObjectId(communityId) });
            const member = result.members.find(
                (m) => m.member_id.toString() === id.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: communityId,
                userId: id,
                module: "GROUP",
                action: "CREATE",
                platForm: "web",
                memberRole: userRole,
                oldData: null,
                newData: res.toObject()
            });
            return ({ error: false, message: "groupCreateSuccess", data: { id: (res._id).toString() } });
        } catch (e) {
            console.log(e);
            throw new DatabaseError("Cannot create the Group.");
        }
    },
    updateGroup: async function (id, params, UserId) {
        try {
            let GroupObj = {};
            if (params.name) {
                let name = { "name": params.name };
                GroupObj = { ...GroupObj, ...name };
            }
            if (params.description) {
                let description = { "description": params.description };
                GroupObj = { ...GroupObj, ...description };
            }
            if (params.image) {
                let image = { "image": params.image };
                GroupObj = { ...GroupObj, ...image };
            }
            if (params.communityId) {
                let communityId = { "community_id": params.communityId };
                GroupObj = { ...GroupObj, ...communityId };
            }
            const user = await User.findOne({ _id: UserId });
            const groupDetails = await Group.findOne({ _id: id });
            if (user.user_type == 'admin' || groupDetails.created_by == UserId) {
                // store old data
                const oldData = groupDetails.toObject();
                await Group.update({ _id: ObjectId(id) }, { "$set": GroupObj });
                const updatedGroup = await Group.findOne({ _id: id })
                // store new Data
                const newData = updatedGroup.toObject();
                // show just changes field
                const changedOld = {};
                const changedNew = {};
                Object.keys(GroupObj).forEach((key) => {
                    if (String(oldData[key]) !== String(updatedGroup[key])) {
                        changedOld[key] = oldData[key];
                        changedNew[key] = newData[key];
                    }
                });

                const id = updatedGroup.community_id;
                const logInUserId = updatedGroup.created_by;
                const community = await Communities.findOne({ _id: new ObjectId(id) });
                const member = community.members.find(
                    (m) => m.member_id.toString() === logInUserId.toString()
                );
                const userRole = member.roles;

                await ActivityLogService.activityLogActiion({
                    communityId: updatedGroup.community_id,
                    userId: updatedGroup.created_by,
                    module: "GROUP",
                    action: "UPDATE",
                    platForm: "web",
                    memberRole: userRole,
                    oldData: changedOld,
                    newData: changedNew
                })
                return ({ error: false, message: "groupUpdateSuccess", data: updatedGroup });
            } else {
                throw new ErrorModules.DatabaseError("User does not have the permission to delete.");
            }

        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Group find error");
        }
    },
    deleteGroup: async function (id, UserId) {
        try {
            const GroupObj = {
                "is_deleted": true
            }
            const user = await User.findOne({ _id: UserId });
            const groupDetails = await Group.findOne({ _id: id });
            if (user.user_type == 'admin' || groupDetails.created_by == UserId) {
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
            } else {
                throw new ErrorModules.DatabaseError("User does not have the permission to delete.");
            }

        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Group find error");
        }
    },
    groupStatusChange: async function (groupId) {
        const group = await Group.findOne({
            _id: ObjectId(groupId)
        });
        if (Lib.isEmpty(group)) {
            return { error: true, message: "nogroupFound", ErrorClass: ErrorModules.API404Error };
        }
        // store old data
        const oldData = { is_active: group.is_active };

        if (group.is_active == true) {
            group.is_active = false;
        } else {
            group.is_active = true;
        }

        await group.save();

        const id = group.community_id;
        const userId = group.created_by;
        const community = await Communities.findOne({ _id: new ObjectId(id) });
        const member = community.members.find(
            (m) => m.member_id.toString() === userId.toString()
        );
        const userRole = member.roles;

        await ActivityLogService.activityLogActiion({
            communityId: group.community_id,
            userId: group.created_by,
            module: "GROUP",
            action: "STATUS_CHANGE",
            platForm: "web",
            memberRole: userRole,
            oldData: oldData,
            newData: { is_active: group.is_active }
        })
        return { error: false, message: "generalSuccess" };
    },
    addGroupMember: async function (params, userId) {
        // try {
        const members = params.memberId;
        const id = params.id;
        const group = await Group.findOne({
            _id: ObjectId(id)
        });
        if (Lib.isEmpty(group)) {
            return { error: true, message: "nogroupFound", ErrorClass: ErrorModules.Api404Error };
        }
        // store old member
        const oldMembers = [...group.members.map(m => m.member_id.toString())];

        //Getting community Id
        const communityId = group.community_id;
        const community = await Communities.findOne({ _id: ObjectId(communityId), is_deleted: false, is_active: true });

        if (Lib.isEmpty(community)) {
            return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
        }
        const communityMember = community.members;
        let commMembers = [];
        communityMember.forEach(member => {
            commMembers.push((member.member_id).toString());
        });

        const leftMembers = Lib.distinctArray(members, commMembers);

        if (leftMembers.length > 0) {
            return ({ error: true, message: "Cannot add members, as the community the group belongs is different than some of the member", ErrorClass: ErrorModules.Api404Error });
        }
        const roleEnum = Lib.getEnum('ROLES_ENUM');
        let slug = "new-member-added";
        let lang = 'en';
        await members.forEach(async member => {
            let memberPayload = {
                member_id: member,
                roles: [roleEnum.member],
                is_approved: true
            };
            group.members.push(memberPayload);

        });

        let res = await group.save();

        // Updated members list
        const updatedMembers = group.members.map(m => m.member_id.toString());
        const newAddedMembers = updatedMembers.filter(m => !oldMembers.includes(m));

        await group.members.forEach(async member => {
            const notiSettings = await NotificationSettings.findOne({ user_id: new ObjectId(member.member_id) });
            if (!Lib.isEmpty(notiSettings)) {
                //check the community announcement notification settings
                if (notiSettings.community_group_ativities) {
                    //Push notification send
                    await notificationHelper.getFcmTokens(member.member_id, slug, lang);
                }
            }
        });

        const member = community.members.find(
            (m) => m.member_id.toString() === userId.toString()
        );
        const userRole = member.roles;

        // Activity log
        await ActivityLogService.activityLogActiion({
            communityId: communityId,
            userId: userId,
            module: "GROUP",
            action: "ADD_MEMBER",
            platForm: "web",
            memberRole: userRole,
            oldData: oldMembers,
            newData: newAddedMembers
        })

        return ({ error: false, message: "addMemeberSuccess" });
        // } catch(e) {
        //     console.log(e)
        //     throw new DatabaseError("Cannot add member to the Group.");
        // }
    },
    groupJoinRequest: async function (groupId, UserId) {
        const group = await Group.findOne({ _id: ObjectId(groupId), is_deleted: false, is_active: true });
        if (Lib.isEmpty(group)) {
            return ({ error: true, message: "No group found." });
        }

        if (group.members) {
            let message = "";
            const existMember = group.members.find(member => {
                if (member.member_id.toString() === UserId) {
                    if (member.is_approved && !member.is_rejected && !member.is_deleted && !member.is_leaved) {
                        message = "alreadyAGroupMember";
                        return true;
                    } else if (!member.is_approved && !member.is_deleted && !member.is_rejected) {
                        message = "alreadySendGroupJoinRequest";
                        return true;
                    }
                    return false;
                }
                return false;
            });
            if (existMember) {
                return { error: true, message: message, ErrorClass: ErrorModules.GeneralApiError };
            }
        }
        if (group.community_id) {
            const isMemberInCommunity = await Communities.findOne({
                _id: ObjectId(group.community_id),
                members: {
                    $elemMatch: { member_id: UserId, is_active: true, is_deleted: false, is_approved: true, is_leaved: false }
                }
            }, ['members']);

            if (Lib.isEmpty(isMemberInCommunity)) {
                return { error: true, message: "notACommunityMember", ErrorClass: ErrorModules.GeneralApiError };
            }
        }
        const roleEnum = Lib.getEnum('ROLES_ENUM');
        let memberPayload = {
            member_id: UserId,
            roles: [roleEnum.member],
            is_active: true
        };
        group.members.push(memberPayload);
        await group.save();
        return { error: false, message: "requestSentSuccess" };

    },
    approveOrRejectMemberRequest: async function (data) {
        const { groupId, memberId, approveStatus, user } = data;
        const group = await Group.findOne({
            _id: ObjectId(groupId),
            created_by: user.id,
            is_active: true,
            is_deleted: false,
            members: {
                $elemMatch: {
                    member_id: ObjectId(memberId)
                }
            }
        });

        if (Lib.isEmpty(group)) return {
            error: false,
            message: "noGroupFound",
            ErrorClass: ErrorModules.Api404Error
        }
        let memberIndex;
        let message;
        const member = group.members.find((m, i) => {
            if ((m.member_id).toString() === memberId) {
                memberIndex = i;
                return true;
            }
        });
        if (memberIndex) {
            member.is_approved = approveStatus;
            member.is_rejected = !approveStatus;
            group.members[memberIndex] = member;
            await group.save();

            //Get member details for sending mail
            const memberDetails = await User.findOne({ _id: memberId });
            if (Lib.isEmpty(memberDetails)) return {
                error: true,
                message: "noUserFound",
                ErrorClass: ErrorModules.Api404Error
            };
            let action = approveStatus ? "Approved" : "Rejected";
            /**
             * Sending request approval/rejection mail
             */

            const payload = {
                recipient:
                {
                    email: memberDetails.contact.email.address,
                    user_id: memberId
                },
                template: {
                    type: "Email",
                    slug: "GRPMEMAPP",
                    lang: "en"
                },
                contents: {
                    NAME: memberDetails.name,
                    COMMUNITYNAME: group.name,
                    ACTION: action
                }
            }
            //Sending Email
            await notificationServices.notifyService(payload);

            message = approveStatus ? "memberApproved" : "memberRejected";

            return { error: false, message: message };
        } else {
            return { error: true, message: "noGroupMemberFound", ErrorClass: ErrorModules.Api404Error };
        }

    },
    removeGroupMember: async function (params, userId) {
        // try {
        const members = params.memberIds;
        const id = params.groupId;
        const group = await Group.findOne({
            _id: ObjectId(id)
        });
        if (group.created_by.toString() === members[0]) {
            return ({ error: true, message: "canNotDeleteGroupOwner", ErrorClass: ErrorModules.GeneralApiError });
        }
        // Old members snapshot
        const oldMembers = [...group.members.map(m => m.member_id.toString())];

        group.members.map(member => {
            let isMember = members.includes(member.member_id.toString());
            if (isMember) {
                member.is_deleted = true;
            }
        });
        await group.save();

        const communityId = group.community_id;
        const community = await Communities.findOne({ _id: new ObjectId(communityId) });
        const member = community.members.find(
            (m) => m.member_id.toString() === userId.toString()
        );
        const userRole = member.roles;

        await ActivityLogService.activityLogActiion({
            communityId: group.community_id,
            userId: userId,
            module: "GROUP",
            action: "REMOVE_MEMBER",
            platForm: "web",
            memberRole: userRole,
            oldData: oldMembers,
            newData: members
        })
        return ({ error: false, message: "memberRemovedSuccess" });
        // } catch(e) {
        //     logger.error(e);
        //     clog(e);
        //     return {error:true, message:"internalServerError", ErrorClass:ErrorModules.FatalError};
        // }
    },
    leaveGroup: async function (groupId, memberId) {
        try {
            const group = await Group.findOne({
                _id: new ObjectId(groupId)
            });
            group.members.map(member => {
                let isMember = memberId.includes(member.member_id.toString());
                if (isMember) {
                    member.is_leaved = true;
                    member.leave_at = new Date();
                }
            });

            const id = group.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === memberId.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: group.community_id,
                userId: memberId,
                module: "GROUP",
                action: "LEAVE_GROUP",
                platForm: "web",
                memberRole: userRole,
                newData: null,
                oldData: null
            })
            group.save();
            // let slug="otp-verified";
            // let lang='en';

            // const notiSettings = await NotificationSettings.findOne({user_id : new ObjectId(memberId)});
            // if(!Lib.isEmpty(notiSettings)) {
            //     //check the community announcement notification settings
            //     if(notiSettings.community_group_ativities) {
            //         //Push notification send
            //         await notificationHelper.getFcmTokens(memberId,slug,lang);
            //     }
            // }
            return ({ error: false, message: "leaveGroupSuccess" });
        } catch (e) {
            console.log(e);
            return ({ error: true, message: "Cannot leave the group" });
        }
    },
}