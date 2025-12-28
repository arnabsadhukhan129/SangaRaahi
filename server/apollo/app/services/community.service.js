const userServices = require("../services");
const Communities = Lib.Model('Communities');
const CommunitySettings = Lib.Model('CommunitySettings');
const CommunityAdminApprovalSettings = Lib.Model('CommunityAdminApprovalSettings');
const Roles = Lib.Model('Roles');
const User = Lib.Model('Users');
const Group = Lib.Model('Groups');
const Events = Lib.Model('Events');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const jwt = Lib.getModules('jwt');
const ErrorModules = require('../errors');
const axios = require("axios");
const notificationServices = require('./notification.service');
const ActivityLogService = require('./activity_log.service')
const Distance = Lib.Model('Distance');
//const userServices = require('./user.service');
require('dotenv').config();

async function isPhoneNumberUniqueAcrossAll(phoneNumber) {
    if (!phoneNumber) return true;

    const [user, event, community] = await Promise.all([
        User.findOne({ "contact.phone.number": phoneNumber }),
        Events.findOne({ "venue_details.phone_no": phoneNumber }),
        Communities.findOne({ community_number: phoneNumber })
    ]);

    return !user && !event && !community; // true if unique
}

module.exports = {

    // Query

    getCommunityRoles: async function () {
        let communityRoles = await Roles.find({ type: "community" }).sort({ 'access_level': -1 });
        let rolesArray = [];
        communityRoles.forEach(elem =>
            rolesArray.push(elem.name)
        )
        return rolesArray;
    },
    getAllCommunities: async function (params, user) {
        try {
            let communities;
            let communitiesFindAggregate = [{
                $match: {
                    is_deleted: false
                }
            },
            {
                '$lookup': {
                    'from': 'sr_community_settings',
                    'localField': '_id',
                    'foreignField': 'community_id',
                    'as': 'community_settings'
                }
            },
            {
                '$unwind': {
                    path: "$community_settings",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                '$lookup': {
                    'from': 'sr_community_payments',
                    'localField': '_id',
                    'foreignField': 'community_id',
                    'as': 'community_payments'
                }
            },
            {
                '$unwind': {
                    path: "$community_payments",
                    preserveNullAndEmptyArrays: true
                }
            }];
            let page;

            if (params && params.page) {
                page = parseInt(params.page);
            }
            else {
                page = 1;
            }

            var sortObject = {};
            var key = "created_at";
            let sort = -1;
            if (params.columnName && params.sort) {
                if (params.columnName === 'CommunityType') {
                    key = 'community_type';
                }
                if (params.columnName === 'CommunityName') {
                    key = 'community_name';
                }
                if (params.sort === 'asc') {
                    sort = 1;
                }
            }
            sortObject[key] = sort;

            // define limit per page
            const limit = 10;
            const skip = (page - 1) * limit;

            if (params) {
                if (typeof params.isActive === 'boolean') {
                    communitiesFindAggregate[0]['$match'].is_active = params.isActive;
                }

                if (params.search) {
                    communitiesFindAggregate[0]['$match']['community_name'] = {
                        $regex: `.*${params.search}.*`,
                        $options: 'i'
                    };
                }
                // Filter by community type
                if (params.communityType) {
                    communitiesFindAggregate[0]['$match']['community_type'] = params.communityType;
                }
                // Filter by bank check status
                if (params.bankcheckStatus) {
                    // communitiesFindAggregate[0]['$match']['community_payments.bankcheck_status'] = params.bankcheckStatus;
                    communitiesFindAggregate.push({
                        '$match': {
                            'community_payments.bankcheck_status': params.bankcheckStatus
                        }
                    });
                }
                if (params.webpageApprovalStatus) {
                    communitiesFindAggregate.push({
                        $match: { 'community_settings.webpage_approval_status': params.webpageApprovalStatus }
                    });
                }
            }
            if (user.userType !== Lib.getEnum('USER_TYPE.admin')) {
                // get only those that the user has created
                communitiesFindAggregate[0]['$match'].owner_id = ObjectId(user.id);
            } else {
                // Vieweing by admin. Show the owner details
                communitiesFindAggregate.push({
                    '$lookup': {
                        from: "sr_users",
                        let: { "user_id": "$owner_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$user_id"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    name: 1
                                }
                            }
                        ],
                        as: "owner_details"
                    }
                });
                communitiesFindAggregate.push({
                    $unwind: {
                        path: "$owner_details"
                    }
                })
            }
            communities = await Communities.aggregate(communitiesFindAggregate).collation({ 'locale': 'en' }).sort(sortObject).skip(skip).limit(limit);
            const total = await Communities.aggregate(communitiesFindAggregate);
            // await Promise.all(communities.map(async (comm,i) => {
            //     const communityApprovalLog = await CommunityApprovalLog.find({ community_id: ObjectId(comm._id), is_acknowledged: false });
            //     comm.webpage_approval_status = Lib.isEmpty(communityApprovalLog) ? "active" : "not_approved";

            // }));
            // await Promise.all(communities.map(async (comm, i) => {
            //     if (comm.community_settings.slug === null || comm.community_settings.slug === "" || comm.community_settings.slug === undefined) { 
            //         comm.webpage_approval_status = "inactive";
            //     } else {
            //         const communityApprovalLog = await CommunityApprovalLog.find({ community_id: ObjectId(comm._id), is_acknowledged: false });

            //         if (Lib.isEmpty(communityApprovalLog)) {
            //             comm.webpage_approval_status = "active";
            //         } else {
            //             comm.webpage_approval_status = "not_approved";
            //         }
            //     }
            // }));

            // if (params.webpageApprovalStatus) {
            //     if (params.webpageApprovalStatus === "active") {
            //         communities = communities.filter(comm => comm.community_settings.slug !== null && comm.webpage_approval_status === params.webpageApprovalStatus);
            //     } else {
            //         communities = communities.filter(comm => comm.webpage_approval_status === params.webpageApprovalStatus);
            //     }
            // }


            return ({
                error: false,
                message: "generalSuccess",
                total: total.length,
                data: communities
            });


        } catch (e) {
            clog(e);
            throw new ErrorModules.DatabaseError("Communities find error");
        }
    },

    getCommunityByID: async function (id) {
        let community = await Communities.findOne({ is_deleted: false, _id: new ObjectId(id) });
        if (Lib.isEmpty(community)) {
            return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
        }
        return ({ error: false, message: "generalSuccess", data: community });
    },

    communityViewDetails: async function (id, context) {
        try {
            const isJoinRequestSent = await this.isJoinRequestSent(id, context.user.id);
            let community = await Communities.aggregate([
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

            const communityDetails = community[0];
            if (Lib.isEmpty(communityDetails)) {
                return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
            }
            if (!communityDetails.is_active) {
                return { error: true, message: "communityNotActive", ErrorClass: ErrorModules.Api404Error };
            }
            const communityData = await Communities.findOne({ _id: ObjectId(id) });
            let member = communityData.members.find(elem => elem.member_id.toString() === context.user.id && elem.is_deleted === false && elem.is_active === true && elem.is_approved === true && elem.is_leaved === false);
            let isJoined;
            let role = "";
            let roleKey = "";
            if (Lib.isEmpty(member)) {
                isJoined = false;
            } else {
                isJoined = true;
                role = Lib.toTitleCase(member.roles[0], "_", false, " ");
                roleKey = member.roles[0];
            }

            communityDetails.members = community.map(elem => elem.members);
            let memberCount = community.length;
            return ({
                error: false,
                message: "generalSuccess",
                data: {
                    community: Lib.reconstructObjectKeys(
                        communityDetails,
                        ["created_at", "updated_at", "expired_at", "owner_details"],
                        function (data, key) {
                            if (["created_at", "updated_at", "expired_at"].includes(key)) {
                                return Lib.convertDate(data);
                            } else if (key === "owner_details") {
                                return {
                                    id: data._id,
                                    name: data.name,
                                    email: data.contact.email.address,
                                    phone: data.contact?.phone?.number,
                                }
                            }
                        }
                    ),
                    memberCount: memberCount,
                    isJoined: isJoined,
                    role: role,
                    roleKey: roleKey,
                    isJoinRequestSent: isJoinRequestSent
                }
            });
        } catch (e) {
            clog(e);
            return { error: true, message: "internalServerError", ErrorClass: ErrorModules.FatalError, stack: e };
        }
    },

    getMyRelatedCommunities: async function (params, user) {
        /*let myCreatedCommunitiesApproved = await Communities.find({
            owner_id:ObjectId(user.id),
            is_active:true,
            is_deleted:false
        }, '_id owner_id community_type banner_image community_name community_location non_profit non_profit_tax_id');*/
        //For my created unapproved communities
        let myCreatedCommunitiesUnApproved = await Communities.aggregate([
            {
                '$match': {
                    'owner_id': new ObjectId(user.id),
                    'is_active': false,
                    'is_deleted': false,
                }
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
                    'members.is_deleted': false
                }
            },
            {
                '$group': {
                    '_id': '$_id',
                    'owner_id': { '$first': '$owner_id' },
                    'community_type': { '$first': '$community_type' },
                    'banner_image': { '$first': '$banner_image' },
                    'logo_image': { '$first': '$logo_image' },
                    'community_name': { '$first': '$community_name' },
                    'community_description': { '$first': '$community_description' },
                    'community_location': { '$first': '$community_location' },
                    'address': { '$first': '$address' },
                    'non_profit': { '$first': '$non_profit' },
                    'non_profit_tax_id': { '$first': '$non_profit_tax_id' },
                    'is_active': { '$first': '$is_active' },
                    'is_deleted': { '$first': '$is_deleted' },
                    'expired_at': { '$first': '$expired_at' },
                    'created_at': { '$first': '$created_at' },
                    'updated_at': { '$first': '$updated_at' },
                    'members': { '$push': '$members' },
                    'memberCount': { '$sum': 1 }
                }
            },

        ]);
        //For All Approved communities -> That i belong to as member as well as as owner
        let myCommunitiesBelongsToApproved = await Communities.aggregate([
            {
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
                    'members.is_deleted': false
                }
            },
            {
                '$group': {
                    '_id': '$_id',
                    'owner_id': { '$first': '$owner_id' },
                    'community_type': { '$first': '$community_type' },
                    'banner_image': { '$first': '$banner_image' },
                    'logo_image': { '$first': '$logo_image' },
                    'community_name': { '$first': '$community_name' },
                    'community_description': { '$first': '$community_description' },
                    'community_location': { '$first': '$community_location' },
                    'address': { '$first': '$address' },
                    'non_profit': { '$first': '$non_profit' },
                    'non_profit_tax_id': { '$first': '$non_profit_tax_id' },
                    'is_active': { '$first': '$is_active' },
                    'is_deleted': { '$first': '$is_deleted' },
                    'expired_at': { '$first': '$expired_at' },
                    'created_at': { '$first': '$created_at' },
                    'updated_at': { '$first': '$updated_at' },
                    'members': { '$push': '$members' },
                    'memberCount': { '$sum': 1 }
                }
            },
            {
                '$unwind': {
                    'path': '$members'
                },
            },
            {
                '$match': {
                    "members.member_id": new ObjectId(user.id),
                    'members.is_approved': true,
                    'members.is_active': true,
                    'members.is_rejected': false,
                    'members.is_leaved': false,
                    'members.is_deleted': false
                }
            },
            {
                '$unwind': {
                    'path': '$members.roles'
                },
            },
            { $sort: { created_at: -1 } },
        ]);
        //For Unapproved Fan Communities
        let myCommunitiesUnApprovedAsFan = await Communities.aggregate([
            {
                '$match': {
                    'is_active': true,
                    'is_deleted': false,
                    "members": {
                        $elemMatch: {
                            "member_id": new ObjectId(user.id),
                            'roles': "fan",
                            'is_approved': false,
                            'is_active': true,
                            'is_rejected': false,
                            'is_leaved': false,
                            'is_deleted': false,
                        }
                    }
                }
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
                    'members.is_deleted': false
                }
            },
            {
                '$group': {
                    '_id': '$_id',
                    'owner_id': { '$first': '$owner_id' },
                    'community_type': { '$first': '$community_type' },
                    'banner_image': { '$first': '$banner_image' },
                    'logo_image': { '$first': '$logo_image' },
                    'community_name': { '$first': '$community_name' },
                    'community_description': { '$first': '$community_description' },

                    'community_location': { '$first': '$community_location' },
                    'address': { '$first': '$address' },
                    'non_profit': { '$first': '$non_profit' },
                    'non_profit_tax_id': { '$first': '$non_profit_tax_id' },
                    'is_active': { '$first': '$is_active' },
                    'is_deleted': { '$first': '$is_deleted' },
                    'expired_at': { '$first': '$expired_at' },
                    'created_at': { '$first': '$created_at' },
                    'updated_at': { '$first': '$updated_at' },
                    'members': { '$push': '$members' },
                    'memberCount': { '$sum': 1 }
                }
            },

        ]);
        //For Unapproved Member Communities
        let myCommunitiesUnApprovedAsMember = await Communities.aggregate(
            [
                {
                    '$match': {
                        'is_active': true,
                        'is_deleted': false,
                        "members": {
                            $elemMatch: {
                                "member_id": new ObjectId(user.id),
                                // 'roles': "member",
                                'is_approved': true,
                                'is_active': true,
                                'is_rejected': false,
                                'is_leaved': false,
                                'is_deleted': false,
                                'is_promotion_request': true,
                                // member_promotions:{
                                //     $elemMatch:{
                                //         'type': "Promotion",
                                //         'status': "Pending",
                                //         'path.to': "member",
                                //         'path.from': "fan",
                                //     }
                                // }
                            }
                        }
                    }
                },
                /*{
                    '$match': {
                        "members.member_id": ObjectId(user.id),
                        'members.roles': "member",
                        'members.is_approved': true,
                        'members.is_active': true,
                        'members.is_rejected': false,
                        'members.is_leaved': false,
                        'members.is_deleted': false,
                        'members.member_promotions.type': "Promotion", 
                        'members.member_promotions.status': "Pending", 
                        'members.member_promotions.path.to': "member", 
                        'members.member_promotions.path.from': "fan", 
                    }
                },*/
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
                        'members.is_deleted': false
                    }
                },
                {
                    '$group': {
                        '_id': '$_id',
                        'owner_id': { '$first': '$owner_id' },
                        'community_type': { '$first': '$community_type' },
                        'banner_image': { '$first': '$banner_image' },
                        'logo_image': { '$first': '$logo_image' },
                        'community_name': { '$first': '$community_name' },
                        'community_description': { '$first': '$community_description' },

                        'community_location': { '$first': '$community_location' },
                        'address': { '$first': '$address' },
                        'non_profit': { '$first': '$non_profit' },
                        'non_profit_tax_id': { '$first': '$non_profit_tax_id' },
                        'is_active': { '$first': '$is_active' },
                        'is_deleted': { '$first': '$is_deleted' },
                        'expired_at': { '$first': '$expired_at' },
                        'created_at': { '$first': '$created_at' },
                        'updated_at': { '$first': '$updated_at' },
                        'members': { '$push': '$members' },
                        'memberCount': { '$sum': 1 }
                    }
                },

            ]);

        let nearbyCommunities = [];
        if (params && params.latitude && params.longitude) {

            /*Fliters : 
                1. Coumminites which are not created by logged in user.
                2. Logged in user not under those communities.
            */
            let nearByCommunitiesRes = await Communities.aggregate(
                [
                    {
                        '$match': {
                            'is_active': true,
                            'is_deleted': false,
                            members: {
                                $elemMatch: {
                                    /**
                                     * This one misses one thing
                                     * If a community has one member who is different from the current member
                                     * Then the community will be returned. Even if the current member is a legit member or just sent join request
                                     * Need to resolve this.
                                     */
                                    $or: [
                                        {
                                            'member_id': new ObjectId(user.id),
                                            '$or': [
                                                // {
                                                //     'is_approved': true
                                                // },
                                                {
                                                    'is_rejected': true
                                                }, {
                                                    'is_leaved': true
                                                }, {
                                                    'is_deleted': true
                                                }, {
                                                    'is_active': false
                                                }
                                            ],
                                        },
                                        {
                                            'member_id': {
                                                '$ne': new ObjectId(user.id),
                                            },
                                        }
                                    ]
                                }
                            },
                            /*'$or': [
                                {
                                    'members.member_id':new ObjectId(user.id),
                                    '$or':[{
                                        'members.is_rejected':true
                                    },{
                                        'members.is_leaved':true
                                    },{
                                        'members.is_deleted':true
                                    },{
                                        'members.is_active':false
                                    }],
                                },
                                {
                                    'members.member_id': {
                                        '$ne': new ObjectId(user.id),
                                    },
                                }
                            ]*/
                        }
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
                            'members.is_deleted': false
                        }
                    },
                    {
                        '$group': {
                            '_id': '$_id',
                            'owner_id': { '$first': '$owner_id' },
                            'community_type': { '$first': '$community_type' },
                            'banner_image': { '$first': '$banner_image' },
                            'logo_image': { '$first': '$logo_image' },
                            'community_name': { '$first': '$community_name' },
                            'community_description': { '$first': '$community_description' },

                            'community_location': { '$first': '$community_location' },
                            'address': { '$first': '$address' },
                            'non_profit': { '$first': '$non_profit' },
                            'non_profit_tax_id': { '$first': '$non_profit_tax_id' },
                            'is_active': { '$first': '$is_active' },
                            'is_deleted': { '$first': '$is_deleted' },
                            'expired_at': { '$first': '$expired_at' },
                            'created_at': { '$first': '$created_at' },
                            'updated_at': { '$first': '$updated_at' },
                            'members': { '$push': '$members' },
                            'memberCount': { '$sum': 1 }
                        }
                    },

                ]);
            const poslat = params.latitude;
            const poslng = params.longitude;
            const distanceData = await Distance.findOne();
            const distance = distanceData.distance;
            for (let i = 0; i < nearByCommunitiesRes.length; i++) {
                const notMyCommunities = nearByCommunitiesRes[i];
                // if this location is within 100KM, add it to the list
                if (notMyCommunities.community_location && notMyCommunities.community_location.latitude && notMyCommunities.community_location.longitude) {
                    if (notMyCommunities.community_location.latitude && notMyCommunities.community_location.longitude) {
                        if (Lib.distance(poslat, poslng, notMyCommunities.community_location.latitude, notMyCommunities.community_location.longitude) <= distance) {
                            nearbyCommunities.push(notMyCommunities);
                        }
                    }
                }
            }
        }

        // My communities under roles -> Board member and Executive member
        let myTopRoleCommunities = await Communities.aggregate([
            {
                '$match': {
                    'is_active': true,
                    'is_deleted': false,
                    "members": {
                        $elemMatch: {
                            "member_id": new ObjectId(user.id),
                            "roles": { $in: ['board_member', "executive_member"] },
                            'is_approved': true,
                            'is_active': true,
                            'is_rejected': false,
                            'is_leaved': false,
                            'is_deleted': false,
                        }
                    }

                }
            }
        ]);

        return {
            error: false,
            message: "generalSuccess",
            data: {
                myCommunities: Lib.reconstructObjectKeys(myCommunitiesBelongsToApproved, 'roles', Lib.toTitleCaseForResponse),
                // myCommunities: {
                //     total: myCommunitiesBelongsToApproved.length,
                //     CommunityLogMembers: myCommunitiesBelongsToApproved
                // },
                underApprovalCommunities: Lib.reconstructObjectKeys(myCreatedCommunitiesUnApproved),
                underApprovalFan: Lib.reconstructObjectKeys(myCommunitiesUnApprovedAsFan),
                underApprovalMembership: Lib.reconstructObjectKeys(myCommunitiesUnApprovedAsMember),
                nearbyCommunities: Lib.reconstructObjectKeys(nearbyCommunities),
                myTopRoleCommunities: Lib.reconstructObjectKeys(myTopRoleCommunities)
            }
        };
    },

    getMyCommunities: async function (userId) {
        let communities = await Communities.aggregate([
            {
                '$match': {
                    'is_active': true,
                    'is_deleted': false,
                    members: {
                        $elemMatch: {
                            "member_id": ObjectId(userId),
                            'is_approved': true,
                            'is_active': true,
                            'is_rejected': false,
                            'is_leaved': false,
                            'is_deleted': false,
                        }
                    }
                }
            },
            /*{
                '$match': {
                    "members.member_id": ObjectId(userId),
                    'members.is_approved': true,
                    'members.is_active': true,
                    'members.is_rejected': false,
                    'members.is_leaved': false,
                    'members.is_deleted': false,
                }
            },*/
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
                    'members.is_deleted': false
                }
            },
            {
                '$group': {
                    '_id': '$_id',
                    'owner_id': { '$first': '$owner_id' },
                    'community_type': { '$first': '$community_type' },
                    'banner_image': { '$first': '$banner_image' },
                    'logo_image': { '$first': '$logo_image' },
                    'community_name': { '$first': '$community_name' },
                    'community_description': { '$first': '$community_description' },

                    'community_email': { '$first': '$community_email' },
                    'community_phone_code': { '$first': '$community_phone_code' },
                    'community_number': { '$first': '$community_number' },

                    'community_location': { '$first': '$community_location' },
                    'address': { '$first': '$address' },
                    'payment_category': { '$first': '$payment_category' },
                    'non_profit': { '$first': '$non_profit' },
                    'non_profit_tax_id': { '$first': '$non_profit_tax_id' },
                    'is_active': { '$first': '$is_active' },
                    'is_deleted': { '$first': '$is_deleted' },
                    'expired_at': { '$first': '$expired_at' },
                    'created_at': { '$first': '$created_at' },
                    'updated_at': { '$first': '$updated_at' },
                    'members': { '$push': '$members' },
                    'memberCount': { '$sum': 1 }
                }
            },

        ]);

        const user = await User.findOne({
            _id: ObjectId(userId)
        }, '_id selected_community');
        const selected_community = user.selected_community;
        const myCommunities = communities.map(c => {
            // c = c.toJSON();
            c.currently_selected = (selected_community && (c._id).toString() === (selected_community).toString());
            const userMember = c.members.find(member => member.member_id.toString() === userId.toString());
            if (userMember) {
                c.community_member_id = userMember.community_member_id;
            }
            return c;
        });
        return {
            error: false, message: "generalSuccess", data: {
                my_communities: Lib.reconstructObjectKeys(myCommunities)
            }
        };
    },

    memberList: async function (data) {
        const { communityId, approveType, user } = data;
        const communityMembers = await Communities.findOne({
            _id: ObjectId(communityId),
            members: {
                $elemMatch: { is_approved: approveType, $ne: { member_id: user.id } }
            }
        }, ['members']);
        return { error: false, data: communityMembers.members };
    },

    communityMemberList: async function (data, _user, role) {
        let { communityId, memberType, search, groupId } = data;
        let searchName = "";
        if (search) {
            searchName = search;
        }

        const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
        if (role === ROLES_ENUM.fan && memberType.indexOf(ROLES_ENUM.member) !== -1) {
            memberType = memberType.filter(e => e !== ROLES_ENUM.member);
        }

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
                '$unwind': {
                    'path': '$members.user'
                },
            },
            {
                '$match': {
                    'members.user.name': new RegExp(`.*${searchName}.*`, 'i')
                }
            },
            // {
            //     '$unwind': {
            //         'path': '$members.roles'
            //     }
            // },
            {
                '$project': {
                    'community_name': 1,
                    'members.member_id': 1,
                    'members.roles': 1,
                    'members.joined_at': 1,
                    'members.is_admin_approved': 1,
                    'members.user._id': 1,
                    'members.user.name': 1,
                    'members.user.contact': 1,
                    'members.user.profile_image': 1,
                    'members.user.device_details': 1
                }
            }
        ];

        const communityMembers = await Communities.aggregate(aggregate);
        return { error: false, message: "generalSuccess", data: communityMembers };
    },
    // communityMemberList: async function (data, _user, role) {
    //     let { communityId, memberType, search, groupId } = data;

    //     let searchName = search || "";
    //     const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');

    //     // Ensure array
    //     if (!Array.isArray(memberType)) {
    //         memberType = [];
    //     }

    //     // fan restrictions
    //     if (role === ROLES_ENUM.fan && memberType.includes(ROLES_ENUM.member)) {
    //         memberType = memberType.filter(e => e !== ROLES_ENUM.member);
    //     }

    //     let aggregate = [
    //         {
    //             $match: {
    //                 _id: new ObjectId(communityId)
    //             }
    //         },
    //         { $unwind: "$members" },
    //         {
    //             $match: {
    //                 "members.is_approved": true,
    //                 "members.is_active": true,
    //                 "members.is_rejected": false,
    //                 "members.is_leaved": false,
    //                 "members.is_deleted": false,
    //                 ...(memberType.length > 0 && {
    //                     "members.roles": { $in: memberType }
    //                 })
    //             }
    //         },
    //         {
    //             $lookup: {
    //                 from: "sr_users",
    //                 localField: "members.member_id",
    //                 foreignField: "_id",
    //                 as: "members.user"
    //             }
    //         },
    //         { $unwind: "$members.user" },
    //         {
    //             $match: {
    //                 "members.user.name": new RegExp(`.*${searchName}.*`, 'i')
    //             }
    //         },
    //         {
    //             $project: {
    //                 community_name: 1,
    //                 "members.member_id": 1,
    //                 "members.roles": 1,
    //                 "members.joined_at": 1,
    //                 "members.is_admin_approved": 1,
    //                 "members.user._id": 1,
    //                 "members.user.name": 1,
    //                 "members.user.contact": 1,
    //                 "members.user.profile_image": 1,
    //                 "members.user.device_details": 1
    //             }
    //         }
    //     ];

    //     const communityMembers = await Communities.aggregate(aggregate);
    //     return { error: false, message: "generalSuccess", data: communityMembers };
    // },

    getCommunityMembers: async function (data) {
        let { communityId, search } = data;

        let searchName = "";
        if (search) {
            searchName = search;
        }

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
                    'members.is_deleted': false
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
                '$match': {
                    'members.user.name': new RegExp(`.*${searchName}.*`, 'i')
                }
            },
            {
                $project: {
                    community_name: 1,
                    "members.member_id": 1,
                    "members.user.id": {
                        $ifNull: ["$members.user._id", ""]
                    },
                    "members.user.name": 1,
                    "members.user.phone": {
                        $ifNull: ["$members.user.contact.phone.number", ""]
                    },
                    "members.user.phoneCode": {
                        $ifNull: ["$members.user.contact.phone.phone_code", ""]
                    },
                    "members.user.profileImage": "$members.user.profile_image"
                }
            }

        ];
        const communityMembers = await Communities.aggregate(aggregate);
        console.log(communityMembers, "communityMembers....................")
        return { error: false, message: "generalSuccess", data: communityMembers };
    },

    getNearByCommunities: async function () {
        let communities = await Communities.find({ is_active: true, is_deleted: false });

        return {
            error: false, message: "generalSuccess", data: Lib.reconstructObjectKeys(communities)
        };
    },

    findCommunities: async function (params, user) {
        const userId = user.id;
        let communities = [];
        if (params && params.search) {
            let communitiesFindAggregate = [
                {
                    '$match': {
                        'is_active': true,
                        'is_deleted': false,
                        // 'members': {
                        //     '$elemMatch': {
                        // $or:[
                        //     {
                        //         "member_id": new ObjectId(user.id),
                        //         'is_active': false,
                        //     },
                        //     {
                        //         "member_id": new ObjectId(user.id),
                        //         'is_rejected': true,
                        //     },
                        //     {
                        //         "member_id": new ObjectId(user.id),
                        //         'is_leaved': true,
                        //     },
                        //     {
                        //         "member_id": new ObjectId(user.id),
                        //         'is_deleted': true,
                        //     },
                        //     {
                        // 'member_id': {
                        //     '$nin': [new ObjectId(user.id)],
                        // },
                        //     }
                        // ]

                        //     }
                        // }   
                    }
                },
                // {
                //     '$unwind': {
                //         'path': '$members'
                //     },
                // },
                // {
                //     '$match': {
                //         'members.is_approved': true,
                //         'members.is_active': true,
                //         'members.is_rejected': false,
                //         'members.is_leaved': false,
                //         'members.is_deleted': false
                //     }
                // },
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
                {
                    '$group': {
                        '_id': '$_id',
                        'owner_id': { '$first': '$owner_id' },
                        'community_type': { '$first': '$community_type' },
                        'banner_image': { '$first': '$banner_image' },
                        'community_name': { '$first': '$community_name' },
                        'community_description': { '$first': '$community_description' },
                        'community_phone_code': { '$first': '$community_phone_code' },
                        'community_number': { '$first': '$community_number' },
                        'community_email': { '$first': '$community_email' },
                        'community_location': { '$first': '$community_location' },
                        'address': { '$first': '$address' },
                        'non_profit': { '$first': '$non_profit' },
                        'non_profit_tax_id': { '$first': '$non_profit_tax_id' },
                        'is_active': { '$first': '$is_active' },
                        'is_deleted': { '$first': '$is_deleted' },
                        'expired_at': { '$first': '$expired_at' },
                        'created_at': { '$first': '$created_at' },
                        'updated_at': { '$first': '$updated_at' },
                        'members': { '$first': '$members' },
                        // 'members': { '$push': '$members' },
                        // 'memberCount': { '$sum': 1 },
                        'owner_details': { '$first': '$owner_details' },
                    }
                },
                {
                    '$lookup': {
                        'from': 'sr_groups',
                        'localField': '_id',
                        'foreignField': 'community_id',
                        'as': 'groups'
                    }
                },
                {
                    '$unwind': {
                        'path': '$groups',
                        preserveNullAndEmptyArrays: true
                    },
                },
                {
                    '$match': {
                        $or: [
                            {
                                groups: { $exists: false }
                            },
                            {
                                "groups.is_active": true,
                                "groups.is_deleted": false
                            }
                        ]
                    }
                }, {
                    '$group': {
                        '_id': '$_id',
                        'owner_id': { '$first': '$owner_id' },
                        'community_type': { '$first': '$community_type' },
                        'banner_image': { '$first': '$banner_image' },
                        'community_name': { '$first': '$community_name' },
                        'community_description': { '$first': '$community_description' },
                        'community_phone_code': { '$first': '$community_phone_code' },
                        'community_number': { '$first': '$community_number' },
                        'community_email': { '$first': '$community_email' },
                        'community_location': { '$first': '$community_location' },
                        'address': { '$first': '$address' },
                        'non_profit': { '$first': '$non_profit' },
                        'non_profit_tax_id': { '$first': '$non_profit_tax_id' },
                        'is_active': { '$first': '$is_active' },
                        'is_deleted': { '$first': '$is_deleted' },
                        'expired_at': { '$first': '$expired_at' },
                        'created_at': { '$first': '$created_at' },
                        'updated_at': { '$first': '$updated_at' },
                        // 'memberCount': { '$first': '$memberCount' },
                        'members': { '$first': '$members' },
                        'owner_details': { '$first': '$owner_details' },
                        'groups': { '$push': '$groups' },
                        'groupCount': { '$sum': 1 }
                    }
                }

            ];
            communitiesFindAggregate[0]['$match']['community_name'] = {
                $regex: `.*${params.search}.*`,
                $options: 'i'
            };
            communities = await Communities.aggregate(communitiesFindAggregate).collation({ 'locale': 'en' }).sort({ 'created_at': -1 });
        } else if (params && params.latitude && params.longitude) {
            let allCommunities = await Communities.aggregate([
                {
                    '$match': {
                        'is_active': true,
                        'is_deleted': false,
                        // $or: [
                        //     {
                        //         'members.member_id': {
                        //             $ne: new ObjectId(user.id)
                        //         }
                        //     }, {
                        //         'members.member_id': new ObjectId(user.id),
                        //         'members.is_leaved': true
                        //     }, {
                        //         'members.member_id': new ObjectId(user.id),
                        //         'members.is_rejected': true
                        //     }
                        // ]
                    }
                },
                // {
                //     '$unwind': {
                //         'path': '$members'
                //     },
                // },
                // {
                //     '$match': {
                //         'members.is_approved': true,
                //         'members.is_active': true,
                //         'members.is_rejected': false,
                //         'members.is_leaved': false,
                //         'members.is_deleted': false
                //     }
                // },
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
                {
                    '$group': {
                        '_id': '$_id',
                        'owner_id': { '$first': '$owner_id' },
                        'community_type': { '$first': '$community_type' },
                        'banner_image': { '$first': '$banner_image' },
                        'logo_image': { '$first': '$logo_image' },
                        'community_name': { '$first': '$community_name' },
                        'community_description': { '$first': '$community_description' },
                        'community_phone_code': { '$first': '$community_phone_code' },
                        'community_number': { '$first': '$community_number' },
                        'community_email': { '$first': '$community_email' },
                        'community_location': { '$first': '$community_location' },
                        'address': { '$first': '$address' },
                        'non_profit': { '$first': '$non_profit' },
                        'non_profit_tax_id': { '$first': '$non_profit_tax_id' },
                        'is_active': { '$first': '$is_active' },
                        'is_deleted': { '$first': '$is_deleted' },
                        'expired_at': { '$first': '$expired_at' },
                        'created_at': { '$first': '$created_at' },
                        'updated_at': { '$first': '$updated_at' },
                        'members': { '$first': '$members' },
                        // 'members': { '$push': '$members' },
                        // 'memberCount': { '$sum': 1 },
                        'owner_details': { '$first': '$owner_details' }
                    }
                }, {
                    '$lookup': {
                        'from': 'sr_groups',
                        'localField': '_id',
                        'foreignField': 'community_id',
                        'as': 'groups'
                    }
                },
                {
                    '$unwind': {
                        'path': '$groups',
                        preserveNullAndEmptyArrays: true
                    },
                },
                {
                    '$match': {
                        $or: [
                            {
                                groups: { $exists: false }
                            },
                            {
                                "groups.is_active": true,
                                "groups.is_deleted": false
                            }
                        ]
                    }
                },
                {
                    '$group': {
                        '_id': '$_id',
                        'owner_id': { '$first': '$owner_id' },
                        'community_type': { '$first': '$community_type' },
                        'banner_image': { '$first': '$banner_image' },
                        'logo_image': { '$first': '$logo_image' },
                        'community_name': { '$first': '$community_name' },
                        'community_description': { '$first': '$community_description' },
                        'community_phone_code': { '$first': '$community_phone_code' },
                        'community_number': { '$first': '$community_number' },
                        'community_email': { '$first': '$community_email' },
                        'community_location': { '$first': '$community_location' },
                        'address': { '$first': '$address' },
                        'non_profit': { '$first': '$non_profit' },
                        'non_profit_tax_id': { '$first': '$non_profit_tax_id' },
                        'is_active': { '$first': '$is_active' },
                        'is_deleted': { '$first': '$is_deleted' },
                        'expired_at': { '$first': '$expired_at' },
                        'created_at': { '$first': '$created_at' },
                        'updated_at': { '$first': '$updated_at' },
                        // 'memberCount': { '$first': '$memberCount' },
                        'members': { '$first': '$members' },
                        'owner_details': { '$first': '$owner_details' },
                        'groups': { '$push': '$groups' },
                        'groupCount': { '$sum': 1 }
                    }
                },
                {
                    '$sort': { 'created_at': -1 }
                }
            ]);
            var poslat = params.latitude;
            var poslng = params.longitude;
            const distanceData = await Distance.findOne();
            const distance = distanceData.distance;
            for (var i = 0; i < allCommunities.length; i++) {
                const nearCommunities = allCommunities[i];
                // if this location is within 100KM, add it to the list
                if (nearCommunities.community_location && nearCommunities.community_location.latitude && nearCommunities.community_location.longitude) {
                    if (Lib.distance(poslat, poslng, nearCommunities.community_location.latitude, nearCommunities.community_location.longitude) <= distance) {
                        communities.push(nearCommunities);
                    }
                }
                const findCommunities = allCommunities.map(c => {
                    const userMember = c.members.find(member => member.member_id.toString() === userId.toString());
                    if (userMember) {
                        c.community_member_id = userMember.community_member_id;
                    }
                })
            }
        }

        return {
            error: false, message: "generalSuccess", data: Lib.reconstructObjectKeys(
                communities,
                ["created_at", "updated_at", "expired_at", "owner_details"],
                function (data, key) {
                    if (["created_at", "updated_at", "expired_at"].includes(key)) {
                        return Lib.convertDate(data);
                    } else if (key === "owner_details") {
                        return {
                            id: data._id,
                            name: data.name,
                            email: data.contact.email.address,
                            phone: data.contact?.phone?.number,
                            image: data?.profile_image,
                        }
                    }
                }
            )
        };
    },

    communityRequestList: async function (user, search, communityId, page) {
        if (!page) {
            page = 1;
        }

        // define limit per page
        const limit = 10;
        const skip = (page - 1) * limit;

        const userId = user.id;
        let searchName = "";
        if (search) {
            searchName = search;
        }
        // Get all communities where logged in user is as a Board member or a Executive member
        let communityAggregate = {
            is_active: true,
            is_deleted: false,
        };
        if (user.userType !== Lib.getEnum('USER_TYPE.admin')) {
            communityAggregate = {
                ...communityAggregate,
                members:
                {
                    $elemMatch:
                    {
                        member_id: ObjectId(userId),
                        is_approved: true,
                        is_active: true,
                        is_deleted: false,
                        is_leaved: false,
                        roles: { $in: ['board_member', 'executive_member'] }
                    }
                }
            };
        }
        if (communityId) {
            communityAggregate['_id'] = new ObjectId(communityId);
        }
        let myCommunities = await Communities.find(communityAggregate, '_id');
        let coummunityIdArray = [];
        // Getting array of community ids
        await Promise.all(myCommunities.map(async (community) => {
            coummunityIdArray.push(community._id);
        }));

        if (Lib.isEmpty(coummunityIdArray)) {
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
                        '$in': coummunityIdArray
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
                    $or: [
                        {
                            'members.member_id': { $ne: new ObjectId(userId) },
                            'members.is_approved': false,
                            'members.is_rejected': false,
                            'members.is_active': true,
                            'members.is_leaved': false,
                            'members.is_deleted': false,
                        },
                        {
                            'members.member_id': { $ne: new ObjectId(userId) },
                            'members.is_promotion_request': true,
                            'members.is_active': true,
                            'members.is_leaved': false,
                            'members.is_deleted': false,
                        }
                    ]
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
            },
            {
                '$match': {
                    'members.user.name': new RegExp(`.*${searchName}.*`, 'i')
                }
            },
            {
                '$unwind': {
                    'path': '$members.member_promotions'
                }
            }, {
                '$match': {
                    'members.member_promotions.status': 'Pending'
                }
            },
            {
                '$project': {
                    'community_name': 1,
                    'members.member_id': 1,
                    'members.roles': 1,
                    'members.joined_at': 1,
                    'members.member_promotions': 1,
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
            //     '$sort': {
            //         'community_name': 1
            //     }
            // }
        ];
        const communityRequest = await Communities.aggregate(aggregate).skip(skip).limit(limit);
        const total = await Communities.aggregate(aggregate);
        const data = Lib.reconstructObjectKeys(communityRequest, "joined_at", Lib.convertDate);
        let from = 0;
        let to = 0;

        if (communityRequest.length > 0) {
            from = ((page - 1) * limit) + 1;
            to = (communityRequest.length <= limit) ? (from + communityRequest.length - 1) : (page * limit);
        }
        return {
            error: false,
            message: "generalSuccess",
            total: total.length,
            from,
            to,
            data: Lib.reconstructObjectKeys(data, ["to", "from"], Lib.toTitleCaseForResponse)
        };
    },

    // Mutations
    createCommunity: async function (user, params) {
        const typeEnum = Lib.getEnum('COMMUNITY_TYPE');
        let types = [typeEnum.Social, typeEnum.Cultural, typeEnum.Religious, typeEnum.Others]
        if (!types.includes(params.communityType)) {
            return { error: true, message: "invalidType", ErrorClass: ErrorModules.GeneralApiError };
        }
        const phoneNumber = params.communityNumber;
        const isUnique = await isPhoneNumberUniqueAcrossAll(phoneNumber);

        if (!isUnique) {
            return {
                error: true,
                message: "Phone number already exists in User, Event, or Community.",
                ErrorClass: ErrorModules.GeneralApiError
            };
        }

        const communityPayload = {
            owner_id: user.id,
            community_type: params.communityType,
            community_name: params.communityName,
            community_description: params.communityDescription,
            org_community_description: params.communityDescription,
            banner_image: params.bannerImage ? params.bannerImage : "https://cdn.memiah.co.uk/blog/wp-content/uploads/counselling-directory.org.uk/2019/04/shutterstock_1464234134-1024x684.jpg",
            org_banner_image: params.bannerImage ? params.bannerImage : "https://cdn.memiah.co.uk/blog/wp-content/uploads/counselling-directory.org.uk/2019/04/shutterstock_1464234134-1024x684.jpg",
            logo_image: params.logoImage ? params.logoImage : "https://cdn.memiah.co.uk/blog/wp-content/uploads/counselling-directory.org.uk/2019/04/shutterstock_1464234134-1024x684.jpg",
            org_logo_image: params.logoImage ? params.logoImage : "https://cdn.memiah.co.uk/blog/wp-content/uploads/counselling-directory.org.uk/2019/04/shutterstock_1464234134-1024x684.jpg",

            community_email: params.communityEmail ? params.communityEmail : "",
            org_community_email: params.communityEmail ? params.communityEmail : "",
            community_phone_code: params.communityPhoneCode ? params.communityPhoneCode : "",
            community_number: phoneNumber ? phoneNumber : "",
            org_community_number: phoneNumber ? phoneNumber : "",
            payment_category: params.paymentCategory,
            non_profit: params.paymentCategory === "NonProfit"
        };

        // Conditionally add non_profit_tax_id if paymentCategory is "NonProfit"
        if (params.paymentCategory === "NonProfit" && params.nonProfitTaxId) {
            communityPayload.non_profit_tax_id = params.nonProfitTaxId;
        }
        const communityTypeEnum = Lib.getEnum('COMMUNITY_TYPE');
        const roleEnum = Lib.getEnum('ROLES_ENUM');
        const addressPayload = {
            city: params.city ? params.city : '',
            state: params.state ? params.state : '',
            country: params.country ? params.country : '',
            zipcode: params.zipcode ? params.zipcode : '',
            first_address_line: params.firstAddressLine ? params.firstAddressLine : '',
            second_address_line: params.secondAddressLine ? params.secondAddressLine : ''
        };

        // Currency set using country region
        let country = params.country ? params.country : '';
        let currency;
        switch (country) {
            case 'India':
                currency = 'INR';
                break;
            case 'Canada':
                currency = 'CAD';
                break;
            case 'United States':
                currency = 'USD';
                break;
            case 'United Kingdom':
                currency = 'GBP';
                break;
        }
        communityPayload.currency = currency;

        let first_address_line = params.firstAddressLine ? params.firstAddressLine : '';
        let city = params.city ? params.city : '';
        let state = params.state ? params.state : '';
        // let country = params.country ? params.country : '';
        let zipcode = params.zipcode ? params.zipcode : '';
        let mainAddress = first_address_line + ',' + city + ',' + state + ',' + zipcode + ',' + country;

        const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${mainAddress}&key=${process.env.GEOCODE_KEY}`;

        const response = await axios({
            url: endpoint,
            method: 'get'
        });
        let latitude = '';
        let longitude = '';
        let location = '';
        if (response.data.status == 'OK') {
            latitude = response.data.results[0].geometry.location.lat;
            longitude = response.data.results[0].geometry.location.lng;

            location = response.data.results[0].formatted_address;
        }

        const locationPayload = {
            location: location,
            org_location: location,
            latitude: latitude,
            longitude: longitude,
        };
        // Function to generate unique ID
        const generateUniqueId = (communityAbbreviation, yearOfJoining, count) => {
            return `${communityAbbreviation}${yearOfJoining}${count.toString().padStart(4, '0')}`;
        };

        // Generate unique_id for the main member
        const communityAbbreviation = communityPayload.community_name.match(/\b\w/g).join('').toUpperCase();
        const yearOfJoining = new Date().getFullYear().toString();
        let memberCount = 1;
        const uniqueId = generateUniqueId(communityAbbreviation, yearOfJoining, memberCount);

        const memberPayload = {
            member_id: ObjectId(user.id),
            community_member_id: uniqueId,
            roles: [roleEnum.board_member],
            is_approved: true
        };
        communityPayload['members'] = [memberPayload];
        communityPayload['address'] = addressPayload;
        communityPayload['community_location'] = locationPayload;
        const community = new Communities(communityPayload);
        const res = await community.save();

        //create default community settings
        const communityId = res._id;
        await CommunitySettings.create({
            community_id: new ObjectId(communityId)
        });
        //create default community admin settings
        await CommunityAdminApprovalSettings.create({
            community_id: new ObjectId(communityId)
        });

        return { error: false, message: "generalSuccess", data: { community: res.toJSON() } };
    },

    approveCommunity: async function (communityId) {
        const community = await Communities.findOne({
            _id: ObjectId(communityId)
        });
        if (Lib.isEmpty(community)) {
            return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
        }
        community.is_active = true;
        await community.save();
        const userData = await User.findOne({ _id: community.owner_id });
        if (userData && !userData.selected_community) {
            userData.selected_community = new Object(communityId);
            await userData.save();
        }
        return { error: false, message: "generalSuccess" };
    },

    communityStatusChange: async function (communityId) {
        const community = await Communities.findOne({
            _id: ObjectId(communityId)
        });
        if (Lib.isEmpty(community)) {
            return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
        }
        if (community.is_active == true) {
            community.is_active = false;
        } else {
            community.is_active = true;
            const user = await User.findOne({
                _id: ObjectId(community.owner_id),
                is_deleted: false,
                is_active: true
            });
            if (Lib.isEmpty(user)) {
                return { error: true, message: "noUserFound", ErrorClass: ErrorModules.Api404Error };
            }
            if (Lib.isEmpty(user.selected_organization_portal) || Lib.isEmpty(user.selected_community)) {
                user.selected_organization_portal = new ObjectId(communityId);
                user.selected_community = new ObjectId(communityId);
                await user.save();
            }
        }

        await community.save();
        return { error: false, message: "generalSuccess" };
    },

    joinOrPromoteCommunity: async function (params, _user, authUser) {
        const { communityId, promotionType, role } = params;
        // At first any request to the community join will be taken as fan
        let memberRole = role ? role.toLowerCase() : "fan";
        const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
        const community = await Communities.findOne({
            _id: ObjectId(communityId),
            is_active: true,
            is_deleted: false
        }, '_id community_name expired_at is_active members');
        if (Lib.isEmpty(community)) {
            return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
        }
        const communityData = community.toJSON();

        let currentMember, index;
        if (communityData.members && communityData.members.length > 0) {
            currentMember = communityData.members.find((member, i) => {
                if (member.member_id.toString() === _user.id && !member.is_deleted && member.is_active && !member.is_leaved) {
                    index = i;
                    return true;
                }
            });
        }

        if (currentMember) {
            // Found a member cannot join request
            if (!currentMember.is_approved && !currentMember.is_rejected) {
                return { error: true, message: "joinRequestAlreadySend", ErrorClass: ErrorModules.UniqueConstraintError };
            }
            if (currentMember.is_promotion_request) {
                return { error: true, message: "PromotionRequestAlreadySend", ErrorClass: ErrorModules.UniqueConstraintError };
            }
            memberRole = currentMember.roles[0]
            // If rejected then again sent a join request
            if (currentMember.is_rejected) {
                currentMember.is_rejected = false;
            } else {
                currentMember.is_approved = true;
                currentMember.is_promotion_request = true;
                //Assign the new role to the existing user
                const lastRole = currentMember.roles[0];
                switch (lastRole) {
                    case ROLES_ENUM['fan']:
                        memberRole = ROLES_ENUM.member;
                        break;
                    case ROLES_ENUM['member']:
                        memberRole = ROLES_ENUM.executive_member;
                        break;
                    case ROLES_ENUM['executive_member']:
                        memberRole = ROLES_ENUM.board_member;
                        break;
                }
            }


            if (currentMember.member_promotions && currentMember.member_promotions.length > 0) {
                currentMember.member_promotions.push({
                    type: promotionType,
                    path: {
                        // Old role
                        from: currentMember.roles[0],
                        to: memberRole
                    }
                });
            } else {
                currentMember.member_promotions = [];
                currentMember.member_promotions.push({
                    type: promotionType,
                    path: {
                        // Old role
                        from: currentMember.roles[0],
                        to: memberRole
                    }
                });
            }
        } else {
            // console.log(community,"community.............");
            // Generate unique_id
            const communityAbbreviation = community.community_name.match(/\b\w/g).join('').toUpperCase();
            const yearOfJoining = new Date().getFullYear().toString();
            const memberCount = (community.members || []).length + 1;
            const uniqueId = `${communityAbbreviation}${yearOfJoining}${memberCount.toString().padStart(4, '0')}`;
            // Not found any member -> So add a new member as a fan
            currentMember = {
                member_id: new ObjectId(_user.id),
                community_member_id: uniqueId,
                roles: [memberRole],
                is_approved: memberRole === "fan" ? true : false, // Autmatically fan join
                member_promotions: [{
                    type: promotionType,
                    path: {
                        // Old role
                        from: memberRole,
                        to: memberRole
                    },
                    status: memberRole === "fan" ? "Approved" : "Pending"
                }]
            };
        }
        if (communityData.members && communityData.members.length > 0) {
            if (typeof index !== 'undefined' && index > 0) {
                community.members[index] = currentMember;
            } else {
                community.members.push(currentMember);
            }
        } else {
            community.members = [currentMember];
        }
        // Update the community
        await community.save();
        if (currentMember.is_approved === true) {

            const events = await Events.find({
                community_id: new ObjectId(communityId),
                is_active: true,
                is_deleted: false,
                is_cancelled: false,
                invitation_type: "Public",
                rsvp_end_time: { $gte: new Date() }
            });

            for (const event of events) {
                const alreadyRsvped = event.rsvp?.some(
                    r => r.user_id && r.user_id.toString() === _user.id
                );

                if (!alreadyRsvped) {
                    event.rsvp.push({
                        user_id: new ObjectId(_user.id),
                        type: "user",
                        status: "No_Reply",
                        is_new: true,
                        invited_by: new ObjectId(event.host_id),
                        created_at: new Date()
                    });

                    await event.save();
                }
            }
        }
        return { error: false, message: "requestSentSuccess" };
    },

    addExpiryDateToCommunity: async function (id, expirydate, userId) {
        // try {
        let expiryDate = new Date(Date.parse(expirydate)).toISOString();
        let GroupObj = { "expired_at": expiryDate };
        const user = await User.findOne({ _id: userId });
        if (user.user_type == 'admin') {
            const community = await Communities.findOne({
                _id: ObjectId(id)
            });
            if (Lib.isEmpty(community)) {
                throw new ErrorModules.Api404Error("noCommunityFound");
            }
            await Communities.update({ _id: ObjectId(id) }, { "$set": GroupObj });
        } else {
            throw new ErrorModules.DatabaseError("UserIsNotAdmin");
        }
        return ({ error: false, message: "communityExpirySuccess" });
        // } catch (e) {
        //     clog(e);
        //     throw new ErrorModules.DatabaseError("500Error");
        // }
    },

    updateCommunity: async function (id, params, UserId) {
        const community = await Communities.findOne({
            _id: ObjectId(id)
        });

        if (Lib.isEmpty(community)) {
            throw new ErrorModules.Api404Error("noCommunityFound");
        }

        // take snapshot of old values
        const oldCommunity = community.toObject();

        if (params.communityType) {
            community.community_type = params.communityType;
        }
        if (params.bannerImage) {
            community.banner_image = params.bannerImage;
            community.org_banner_image = params.bannerImage;
        }
        if (params.logoImage) {
            community.logo_image = params.logoImage;
            community.org_logo_image = params.logoImage;
        }
        if (params.communityName) {
            community.community_name = params.communityName;
        }
        if (params.communityDescription) {
            community.community_description = params.communityDescription;
            community.org_community_description = params.communityDescription;
        }
        if (params.paymentCategory) {
            community.payment_category = params.paymentCategory;
            community.non_profit = params.paymentCategory === "NonProfit";
        }

        if (community.non_profit && params.nonProfitTaxId) {
            community.non_profit_tax_id = params.nonProfitTaxId;
        } else if (!community.non_profit) {
            community.non_profit_tax_id = "";
        }
        //     community.non_profit = params.nonProfit;

        // if (params.nonProfit && params.nonProfitTaxId) {
        //     community.non_profit_tax_id = params.nonProfitTaxId;
        // } else {
        //     community.non_profit_tax_id = "";
        // }
        community.address.city = params.city ? params.city : community.address.city;
        community.address.state = params.state ? params.state : community.address.state;
        community.address.country = params.country ? params.country : community.address.country;
        community.address.zipcode = params.zipcode ? params.zipcode : community.address.zipcode;
        community.address.first_address_line = params.firstAddressLine ? params.firstAddressLine : community.address.first_address_line;
        community.address.second_address_line = params.secondAddressLine ? params.secondAddressLine : community.address.second_address_line;

        let first_address_line = community.address.first_address_line;
        let city = community.address.city;
        let state = community.address.state;
        let country = community.address.country;
        let mainAddress = first_address_line + ',' + city + ',' + state + ',' + country;

        const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${mainAddress}&key=${process.env.GEOCODE_KEY}`;


        const response = await axios({
            url: endpoint,
            method: 'get'
        });
        let latitude = '';
        let longitude = '';
        let location = '';
        if (response.data.status == 'OK') {
            latitude = response.data.results[0].geometry.location.lat;
            longitude = response.data.results[0].geometry.location.lng;

            location = response.data.results[0].formatted_address;
        } else {
            location = mainAddress;
        }

        community.community_location.location = location;
        community.community_location.org_location = location;
        community.community_location.latitude = latitude;
        community.community_location.longitude = longitude;

        await community.save();
        // fetch new values
        const newCommunity = community.toObject();

        // compare old vs new → only changed fields
        let updatedOld = {};
        let updatedNew = {};

        [
            "community_type", "banner_image", "logo_image", "community_name",
            "community_description", "payment_category", "non_profit_tax_id",
            "address", "community_location"
        ].forEach(field => {
            if (JSON.stringify(oldCommunity[field]) !== JSON.stringify(newCommunity[field])) {
                updatedOld[field] = oldCommunity[field];
                updatedNew[field] = newCommunity[field];
            }
        });
        const member = community.members.find(
            (m) => m.member_id.toString() === UserId.toString()
        );
        const userRole = member.roles;
        if (Object.keys(updatedNew).length > 0) {
            await ActivityLogService.activityLogActiion({
                communityId: community._id,
                communityName: community.community_name,
                userId: UserId,
                module: "COMMUNITY",
                action: "UPDATE",
                oldData: updatedOld,
                newData: updatedNew,
                platForm: "web",
                memberRole: userRole
            });
        }
        return ({ error: false, message: "community Update Successfully", data: community });
    },

    deleteCommunity: async function (id, UserId) {
        try {
            const CommunityObj = {
                "is_deleted": true
            }
            const user = await User.findOne({ _id: UserId });
            const community = await Communities.findOne({ _id: id });
            if (user.user_type == 'admin' || community.owner_id == UserId) {
                let updateCommunity = await Communities.findOneAndUpdate({ _id: ObjectId(id) }, { "$set": CommunityObj });
                return ({ error: false, message: "generalSuccess", data: updateCommunity });
            } else {
                throw new ErrorModules.DatabaseError("User does not have the permission to delete.");
            }

        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Community find error");
        }
    },

    approveOrRejectMemberRequest: async function (data) {
        const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
        const { communityId, memberId, approveStatus, user } = data;
        const memberDetails = await User.findOne({ _id: new ObjectId(memberId) });
        if (Lib.isEmpty(memberDetails)) return {
            error: true,
            message: "memberDetailsNotValid",
            ErrorClass: ErrorModules.Api404Error
        };
        const community = await Communities.findOne({
            _id: ObjectId(communityId),
            is_approved: true,
            is_deleted: false,
            members: {
                $elemMatch: {
                    member_id: ObjectId(memberId)
                }
            }
        });
        const { sms_credits_remaining, email_credits_remaining } = community;
        // Fetching user device token 
        let webToken = [];
        if (memberDetails) {
            webToken = memberDetails.device_details.filter(device => device.is_active === true).map(device => device.web_token).filter(token => token !== null && token !== undefined);
            const fcmToken = memberDetails.device_details.filter(device => device.is_active === true).map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
            webToken = [...webToken, ...fcmToken];
        }
        if (Lib.isEmpty(community)) return {
            error: true,
            message: "noCommunityFound",
            ErrorClass: ErrorModules.Api404Error
        };
        let memberIndex = -1;
        let message;
        const member = community.members.find((m, i) => {
            if ((m.member_id).toString() === memberId && m.is_leaved === false && m.is_deleted === false) {
                memberIndex = i;
                return true;
            }
        });
        if (memberIndex >= 0) {
            //If membber not request for promoton the it will approve or reject member
            if (!member.is_promotion_request) {
                // Approve or reject a member
                member.is_approved = approveStatus;
                member.is_rejected = !approveStatus;
            }
            //If promotion request approved then promote the role
            if (approveStatus && member.is_promotion_request) {
                let memberRole;
                const lastRole = member.roles[0];
                switch (lastRole) {
                    case ROLES_ENUM['fan']:
                        memberRole = ROLES_ENUM.member;
                        break;
                    case ROLES_ENUM['member']:
                        memberRole = ROLES_ENUM.executive_member;
                        break;
                    case ROLES_ENUM['executive_member']:
                        memberRole = ROLES_ENUM.board_member;
                        break;
                }
                member.roles[0] = memberRole;

            }
            // promotion operation done so make it default false
            member.is_promotion_request = false;

            if (member.member_promotions.length > 0) {
                member.member_promotions.slice(-1)[0].status = approveStatus ? "Approved" : "Rejected";
            }
            community.members[memberIndex] = member;
            await community.save();
            //Get member details for sending mail
            if (memberDetails.contact && memberDetails.contact.email && memberDetails.contact.email.address) {
                let action = approveStatus ? "Approved" : "Rejected";
                /**
                 * Sending request approval/rejection mail
                 */

                const emailpayload = {
                    recipient:
                    {
                        email: memberDetails.contact.email.address,
                        user_id: memberId
                    },
                    template: {
                        type: "Email",
                        slug: "COMMEMAPP",
                        lang: "en"
                    },
                    contents: {
                        NAME: memberDetails.name,
                        COMMUNITYNAME: community.community_name,
                        ACTION: action
                    }
                }
                const payload = {
                    recipient:
                    {
                        // email: memberDetails.contact.email.address,
                        user_id: memberId,
                        fcmToken: webToken
                    },
                    template: {
                        type: "Push",
                        slug: "member-accept-reject",
                        lang: "en"
                    },
                    contents: {
                        NAME: memberDetails.name,
                        COMMUNITYNAME: community.community_name,
                        ACTION: action
                    }
                }
                //Sending Email
                notificationServices.notifyService(emailpayload).then(result => { }).catch(err => { clog(err, "approved reject community mail error") });
                //Push Notification
                await notificationServices.notifyService(payload);

                // Send notification if smsemailpayload is defined
                if (email_credits_remaining > 0 && emailpayload) {
                    await notificationServices.notifyService(emailpayload);
                    if (email_credits_remaining > 0) {
                        community.email_credits_remaining = email_credits_remaining - 1;
                        await community.save();
                    }
                }
            }
            message = approveStatus ? "memberApproved" : "memberRejected";
            // Check if this member belongs to any other community if not then select this as main community
            if (approveStatus) {
                // Change the
                const currentMemberDetailsJson = memberDetails.toJSON();
                if (!currentMemberDetailsJson['selected_community']) {
                    // No selected community selected
                    // Updating the selected community
                    memberDetails.selected_community = community._id;
                    await memberDetails.save();
                }
            }

            // 🔹 Activity Log
            let oldData = {};
            let newData = {};
            if (oldApprovalStatus !== member.is_approved) {
                oldData.is_approved = oldApprovalStatus;
                newData.is_approved = member.is_approved;
            }
            if (JSON.stringify(oldRoles) !== JSON.stringify(member.roles)) {
                oldData.roles = oldRoles;
                newData.roles = member.roles;
            }

            const userId = memberDetails?._id;
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;
            if (Object.keys(newData).length > 0) {
                await ActivityLogService.activityLogActiion({
                    communityId: community._id,
                    userId: memberDetails?._id,
                    module: "MEMBERS",
                    action: "MEMBER_REQUEST",
                    oldData,
                    newData,
                    platForm: "web",
                    memberRole: userRole
                });
            }
            return { error: false, message: message };
        } else {
            return { error: true, message: "noCommunityMemberFound", ErrorClass: ErrorModules.Api404Error };
        }

    },

    switchCommunity: async function (data) {
        const { communityId, userId } = data;
        const communities = await Communities.findOne({
            _id: ObjectId(communityId),
            is_active: true,
            is_deleted: false,
            members:
            {
                $elemMatch:
                {
                    member_id: ObjectId(userId),
                    is_approved: true,
                    is_deleted: false,
                    is_active: true,
                    is_approved: true,
                    is_leaved: false
                }
            }
        }, '_id');

        if (Lib.isEmpty(communities)) {
            return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
        }
        let logoImage;
        let role;
        let roleKey;
        let communityName;
        if (communities._id) {
            const community = await Communities.findOne({ _id: ObjectId(communities._id) });
            let member = community.members.find(elem => elem.member_id.toString() === userId);
            role = Lib.toTitleCase(member.roles[0], "_", false, " ");
            roleKey = member.roles[0];
            communityName = community.community_name;
            logoImage = community.logo_image;
        }

        // Original switching
        const user = await User.findOne({
            _id: ObjectId(userId),
            is_active: true,
            is_deleted: false
        }, '_id selected_community');
        const oldData = {
            selected_community_id: user.selected_community,
            selected_community_name: communityName
        };
        user.selected_community = ObjectId(communityId);
        await user.save();
        const newCommunity = await Communities.findOne(
            { _id: ObjectId(communityId) },
            { name: 1 }
        );
        const newData = {
            selected_community_id: user.selected_community,
            selected_community_name: newCommunity ? newCommunity.name : null
        };

        const community = await Communities.findOne({ _id: new ObjectId(communityId) });
        const member = community.members.find(
            (m) => m.member_id.toString() === userId.toString()
        );
        const userRole = member.roles;

        await ActivityLogService.activityLogActiion({
            communityId: communityId,
            userId: userId,
            module: "COMMUNITY",
            action: "SWITCH_COMMUNITY",
            platForm: "app",
            oldData: oldData,
            newData: newData,
            memberRole: userRole
        })

        return {
            error: false,
            message: "communitySwitchSuccess",
            data: {
                id: communityId,
                role: role,
                roleKey: roleKey,
                communityName: communityName,
                logoImage: logoImage,
            }
        };
    },

    removeCommunityMember: async function (communityId, memberId, userId) {
        try {
            const community = await Communities.findOne({
                _id: ObjectId(communityId),
                is_active: true,
                is_deleted: false
            });
            if (!community) {
                return {
                    error: true,
                    message: "noCommunityFound",
                    code: "API404Error",
                };
            }
            community.members.map(member => {
                let isMember = memberId.includes(member.member_id.toString());
                if (isMember) {
                    member.is_deleted = true;
                }
            });
            community.save();

            //Delete user details from group member
            await Group.updateMany({
                'community_id': ObjectId(communityId),
                'members.member_id': new ObjectId(memberId[0])
            }, { $set: { 'members.$[xxx].is_deleted': true } },
                {
                    arrayFilters: [
                        { "xxx.member_id": new ObjectId(memberId[0]) }
                    ]
                });

            const user = await User.findOne({ _id: new ObjectId(memberId[0]), is_deleted: false, is_active: true });

            if (user.selected_community && communityId.toString() === user.selected_community.toString()) {
                user.selected_community = null;
                user.save();
            }
            if (user.selected_organization_portal && communityId.toString() === user.selected_organization_portal.toString()) {
                user.selected_organization_portal = null;
                user.save();
            }

            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;
            // Call activity log
            await ActivityLogService.activityLogActiion({
                communityId: community._id,
                userId: userId,
                module: "MEMBERS",
                action: "DELETE",
                platForm: "web",
                memberRole: userRole,
                oldData: {
                    userName: user.name,
                    phoneNo: user.contact.phone.number,
                    email: user.contact.email.address
                },
                newData: null
            });
            return ({ error: false, message: "memberRemovedSuccess" });
        } catch (e) {
            console.log(e, 'eee');
            return ({ error: true, message: "Cannot delete the member" });
        }
    },
    async communityMemberStatusChange(communityId, memberId, userId) {
        const community = await Communities.findOne({
            _id: ObjectId(communityId),
            is_active: true,
            is_deleted: false
        });
        if (!community) {
            return {
                error: true,
                message: "noCommunityFound",
                code: "API404Error",
            };
        }
        let oldData = {};
        let newData = {};
        await Promise.all(community.members.map(async (member) => {
            let isMember = memberId.includes(member.member_id.toString());
            if (isMember && !member.is_deleted && !member.is_leaved) {
                if (member.is_active) {
                    const user = await User.findOne({ _id: new ObjectId(memberId[0]), is_deleted: false, is_active: true });
                    if (user.selected_community && communityId.toString() === user.selected_community.toString()) {
                        user.selected_community = null;
                        user.save();
                    }
                    if (user.selected_organization_portal && communityId.toString() === user.selected_organization_portal.toString()) {
                        user.selected_organization_portal = null;
                        user.save();
                    }
                }
                oldData = { is_active: member.is_active };
                member.is_active = member.is_active ? false : true;
                newData = { is_active: member.is_active };

            }
        }));
        community.save();

        const member = community.members.find(
            (m) => m.member_id.toString() === userId.toString()
        );
        const userRole = member.roles;

        await ActivityLogService.activityLogActiion({
            communityId: community._id,
            userId: userId,
            module: "MEMBERS",
            action: "STATUS_CHANGE",
            platForm: "web",
            memberRole: userRole,
            oldData: oldData,
            newData: newData,
        });

        return { error: false, message: "statusChangedSuccess" };
    },

    leaveCommunity: async function (communityId, memberId, selectedCommunityId, isAppPortal) {
        try {
            const community = await Communities.findOne({
                _id: new ObjectId(communityId)
            });
            if (Lib.isEmpty(community)) {
                return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
            }
            let index = -1;
            const currMember = community.members.find((m, i) => {
                if (m.member_id.toString() === memberId && m.is_leaved === false) {
                    index = i;
                    return true;
                }
            });
            if (!currMember) {
                return { error: true, message: "noMemberFound", ErrorClass: ErrorModules.Api404Error };
            }
            if (!currMember.is_approved) {
                return { error: true, message: "memberIsNotApproved", ErrorClass: ErrorModules.AuthError };
            }
            if (currMember.is_leaved) {
                return { error: true, message: "memberAlreadyLeft", ErrorClass: ErrorModules.UniqueConstraintError };
            }
            if (currMember.is_deleted) {
                return { error: true, message: "noMemberFound", ErrorClass: ErrorModules.Api404Error };
            }
            const boardMemberRole = Lib.getEnum('ROLES_ENUM.board_member');
            const executiveMemberRole = Lib.getEnum('ROLES_ENUM.executive_member');
            const memberRole = Lib.getEnum('ROLES_ENUM.member');
            if (isAppPortal && currMember.roles[0] === memberRole) {
                return { error: true, message: "Member needs to be demoted to fan before leave the community." };
            }
            if (isAppPortal && (currMember.roles[0] === executiveMemberRole || currMember.roles[0] === boardMemberRole)) {
                return { error: true, message: "Cannot leave the community with this role." };
            }
            if (currMember.roles[0] === boardMemberRole) {
                const otherBoardMember = community.members.filter(m => m.roles[0] === boardMemberRole && m.member_id.toString() !== memberId && !m.is_deleted && m.is_active && !m.is_leaved && m.is_approved);
                if (!otherBoardMember.length) {
                    // No other board member is found
                    // only one
                    // show error
                    return { error: true, message: "noOtherBoardMemberForCommunityFound", ErrorClass: ErrorModules.AuthError };
                } else if (otherBoardMember.length === 1) {
                    community.owner_id = otherBoardMember[0].member_id;
                }
            }
            currMember.is_leaved = true;
            currMember.leave_at = new Date();
            community.members[index] = currMember;
            await community.save();
            if ((selectedCommunityId).toString() === (community._id).toString()) {
                const otherCommunity = await Communities.findOne({
                    _id: {
                        $ne: community._id
                    },
                    "members.member_id": new ObjectId(memberId),
                    "members.is_approved": true,
                    "members.is_rejected": false,
                    "members.is_active": true,
                    "members.is_leaved": false
                });
                if (otherCommunity) {
                    await User.updateOne({ _id: new ObjectId(memberId) }, {
                        selected_community: otherCommunity._id
                    });
                } else {
                    await User.updateOne({ _id: new ObjectId(memberId) }, { selected_community: null });
                }
            }
            //Delete user details from group member
            await Group.updateMany({
                'community_id': ObjectId(selectedCommunityId),
                'members.member_id': new ObjectId(memberId)
            }, { $set: { 'members.$[xxx].is_deleted': true } },
                {
                    arrayFilters: [
                        { "xxx.member_id": new ObjectId(memberId) }
                    ]
                });

            const member = community.members.find(
                (m) => m.member_id.toString() === memberId.toString()
            );
            const userRole = member.roles;
            // Call Activity Log
            await ActivityLogService.activityLogActiion({
                communityId: community._id,
                userId: memberId,
                module: "COMMUNITY",
                action: "LEAVE",
                platForm: "app",
                memberRole: userRole,
                oldData: null,
                newData: null,
            });
            return ({ error: false, message: "leaveCommunitySuccess" });
        } catch (e) {
            console.log(e);
            return ({ error: true, message: "Cannot leave the community" });
        }
    },

    promoteOrDemoteCommunityMember: async function (communityId, memberId, promote, userId) {
        const roleEnum = Lib.getEnum('ROLES_ENUM');
        let roles = [roleEnum.fan, roleEnum.member, roleEnum.executive_member, roleEnum.board_member]
        const muser = await User.findOne({ _id: ObjectId(memberId) });
        let webToken = [];
        if (muser) {
            webToken = muser.device_details.filter(device => device.is_active === true).map(device => device.web_token).filter(token => token !== null && token !== undefined);
            fcmToken = muser.device_details.filter(device => device.is_active === true).map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
            webToken = [...webToken, ...fcmToken];
        }
        const community = await Communities.aggregate([
            {
                "$match": {
                    "_id": new ObjectId(communityId),
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
                    'members.member_id': new ObjectId(memberId),
                    'members.is_deleted': false,
                    'members.is_active': true,
                    'members.is_approved': true,
                    'members.is_leaved': false,
                }
            }
        ]);
        const communityName = community[0].community_name;
        let oldRole;
        let newRole;

        if (community.length !== 0) {
            //Getting the member current role
            oldRole = community[0].members.roles[0];
            //Checking lowest role demote check
            if (oldRole === roleEnum.fan && promote === false) {
                return { error: true, message: "canNotDemoteMember", ErrorClass: ErrorModules.Api404Error };
            }
            //Checking higest role prmote check
            if (oldRole === roleEnum.board_member && promote === true) {
                return { error: true, message: "canNotPromoteMember", ErrorClass: ErrorModules.Api404Error };
            }
            //Checking higest role prmote check
            if (oldRole === roleEnum.board_member && promote === false) {
                const community = await Communities.aggregate([
                    {
                        "$match": {
                            "_id": new ObjectId(communityId),
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
                            'members.roles': ['board_member'],
                            'members.is_deleted': false,
                            'members.is_active': true,
                            'members.is_approved': true,
                            'members.is_leaved': false,
                        }
                    }
                ]);
                if (community.length === 1) {
                    return { error: true, message: "NoOtherBoardMember", ErrorClass: ErrorModules.Api404Error };

                }
            }

            //Getting the index in the "roles" array above
            let index = roles.indexOf(oldRole);
            let promoteIndex;
            // Getting the new role index according the promotion value
            let type = '';
            if (promote) {
                promoteIndex = (index + 1);
                type = "Promotion";

            } else {
                promoteIndex = (index - 1);
                type = "Demotion";
            }
            //Getting new role
            newRole = roles[promoteIndex];
            if (newRole === roleEnum.executive_member || newRole === roleEnum.board_member) {
                // Send SMS for the .NET access promotion
                // ....
            }
            //Saving new role to member roles (**If there is any promotion or demotion on extreme value, it will keep the role unchanged.)
            const memberPromotionPayload = {
                type: type,
                status: "Approved",
                path: {
                    from: oldRole,
                    to: newRole
                },
                authorize_person_id: new ObjectId(userId)
            }
            await Communities.updateOne({
                "_id": new ObjectId(communityId),
                "members": {
                    $elemMatch: {
                        "member_id": new ObjectId(memberId),
                        'is_approved': true,
                        'is_active': true,
                        'is_rejected': false,
                        'is_leaved': false,
                        'is_deleted': false,
                    }
                }
            }, {
                '$set': {
                    'members.$.roles': [newRole]
                },
                '$push': {
                    'members.$.member_promotions': memberPromotionPayload
                }
            });

            const community = await Communities.findOne({ _id: new ObjectId(communityId) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;
            await ActivityLogService.activityLogActiion({
                communityId: communityId,
                userId: userId,
                module: "MEMBERS",
                action: type.toUpperCase(),
                platForm: "web",
                memberRole: userRole,
                oldData: {
                    name: muser.name,
                    phoneno: muser.contact.phone.number,
                    email: muser.contact.email.address,
                    oldRole: oldRole
                },
                newData: {
                    name: muser.name,
                    phoneno: muser.contact.phone.number,
                    email: muser.contact.email.address,
                    newRole: newRole
                }
            });
        } else {
            return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
        }

        if (promote) {
            const payload = {
                recipient:
                {
                    user_id: memberId,
                    fcmToken: webToken
                },
                template: {
                    type: "Push",
                    slug: "promote",
                    lang: "en"
                },
                contents: {
                    NEWROLE: newRole,
                    COMMUNITYNAME: communityName
                },
            }
            //Push notification send
            await notificationServices.notifyService(payload);
            return ({ error: false, message: "memberPromoteSuccess", data: { oldRole: oldRole, newRole: newRole } });
        } else {
            const payload = {
                recipient:
                {
                    user_id: memberId
                },
                template: {
                    type: "Push",
                    slug: "demote",
                    lang: "en"
                },
                contents: {
                    NEWROLE: newRole,
                    COMMUNITYNAME: communityName
                },
            }
            //Push notification send
            await notificationServices.notifyService(payload);
            return ({ error: false, message: "memberDemoteSuccess", data: { oldRole: oldRole, newRole: newRole } });
        }
    },
    communityMemberRollPermission: async function (communityId, memberId, userId) {
        const roleEnum = Lib.getEnum('ROLES_ENUM');
        const community = await Communities.aggregate([
            {
                '$match': {
                    '_id': new ObjectId(communityId),
                    'is_deleted': false,
                    'is_active': true
                },
            },
            {
                '$unwind': {
                    'path': '$members',
                },
            },
            {
                '$match': {
                    'members.member_id': new ObjectId(memberId[0]),
                    // 'members.is_deleted': false,
                    // 'members.is_active': true,
                    'members.is_approved': true,
                    'members.is_leaved': false,
                },
            },
        ]);
        let memberRole;
        if (community.length !== 0) {
            //Getting the member current role
            memberRole = community[0].members.roles[0];
            if (community[0].members.is_deleted) {
                return { error: true, message: "Member Already Deleted." };
            }
        }

        const communityy = await Communities.aggregate([
            {
                '$match': {
                    '_id': new ObjectId(communityId),
                    'is_deleted': false,
                    'is_active': true
                },
            },
            {
                '$unwind': {
                    'path': '$members',
                },
            },
            {
                '$match': {
                    'members.member_id': new ObjectId(userId),
                    'members.is_deleted': false,
                    'members.is_active': true,
                    'members.is_approved': true,
                    'members.is_leaved': false,
                },
            },
        ]);
        let userRole;
        if (communityy.length !== 0) {
            //Getting the member current role
            userRole = communityy[0].members.roles[0];
        }

        if (userRole === roleEnum.executive_member) {
            if (memberRole === roleEnum.fan || memberRole === roleEnum.member) {
                return { error: false };
            }
        } else if (userRole === roleEnum.board_member) {
            if (memberRole === roleEnum.fan || memberRole === roleEnum.member || memberRole === roleEnum.executive_member) {
                return { error: false };
            }
        }

        return { error: true };

    },
    publicityPageStatusChange: async function (communityId, userId) {
        let communitySettings = await CommunitySettings.findOne({ community_id: new ObjectId(communityId) });
        let oldStatus, newStatus;
        if (Lib.isEmpty(communitySettings)) {
            await CommunitySettings.create({
                community_id: new ObjectId(communityId)
            })
        } else {
            const community = await Communities.findOne({
                _id: ObjectId(communityId)
            });
            if (Lib.isEmpty(community)) {
                throw new ErrorModules.Api404Error("noCommunityFound");
            }
            oldStatus = communitySettings.publicity_page
            communitySettings.publicity_page = communitySettings.publicity_page ? false : true;
            newStatus = communitySettings.publicity_page
            await communitySettings.save();

            if (!communitySettings.publicity_page) {
                community.is_featured = false;
                await community.save();
            }

        }

        const community = await Communities.findOne({ _id: new ObjectId(communityId) });
        const member = community.members.find(
            (m) => m.member_id.toString() === userId.toString()
        );
        const userRole = member.roles;
        // ✅ Log the change
        await ActivityLogService.activityLogActiion({
            communityId: communityId,
            userId: userId,
            module: "COMMUNITY_SETTINGS",
            action: "PUBLICITY_PAGE_STATUS_CHANGE",
            platForm: "web",
            memberRole: userRole,
            oldData: { publicity_page: oldStatus },
            newData: { publicity_page: newStatus }
        });
        return { error: false, message: "statusChangedSuccess" };
    },
    isJoinRequestSent: async function (communityId, userId) {
        let isJoinRequest = false;
        const community = await Communities.findOne({
            _id: ObjectId(communityId),
            is_active: true,
            is_deleted: false
        }, '_id name expired_at is_active members');
        const communityData = community.toJSON();

        let currentMember, index;
        if (communityData.members && communityData.members.length > 0) {
            currentMember = communityData.members.find((member, i) => {
                if (member.member_id.toString() === userId && !member.is_deleted && member.is_active && !member.is_leaved) {
                    index = i;
                    return true;
                }
            });
        }

        if (currentMember) {
            // Found a member cannot join request
            if (!currentMember.is_approved && !currentMember.is_rejected) {
                isJoinRequest = true;
            }
            if (currentMember.is_promotion_request) {
                isJoinRequest = true;
            }
        }
        return isJoinRequest;
    }

}
