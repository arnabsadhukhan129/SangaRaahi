const _ = require("lodash");
const User = Lib.Model('Users');
const Communities = Lib.Model('Communities');
const Group = Lib.Model('Groups');
const Events = Lib.Model('Events');
const Feedback = Lib.Model('Feedbacks');
const Announcement = Lib.Model('Announcements');
const NotificationLog = Lib.Model('NotificationLog');
const UsersLog = Lib.Model('UsersLog');
const DatabaseError = require('../errors/database.error');
const ErrorModules = require('../errors');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const notificationServices = require('./notification.service');
const communityServices = require('./community.service');
const crypto = require('crypto');
require('dotenv').config();
const axios = require("axios");
const jwt = Lib.getModules("jwt");
const State = require('../../states.json');
const CountryCode = require('../../CountryCodes.json');
const ActivityLogService = require('./activity_log.service')

module.exports = {
    createUser: async function (params) {
        // try {
        if (params.email && params.phone) {
            let userEmailExist = await User.find({
                $or: [
                    { 'contact.email.address': params.email },
                    {
                        $and: [
                            { 'contact.phone.number': params.phone },
                            { 'contact.phone.phone_code': params.phoneCode },
                            { 'contact.phone.country_code': params.countryCode }
                        ]
                    }
                ], "is_deleted": false
            });
            // let userPhoneExist = await User.find({'contact.phone.number':params.phone});
            if (userEmailExist && userEmailExist.length > 0) {
                const existUser = userEmailExist[0].toJSON();
                if (existUser.contact && existUser.contact.email.address === params.email) {
                    throw new DatabaseError("Email already exist");
                }
                if (existUser.contact && existUser.contact.phone.number === params.phone) {
                    throw new DatabaseError("Phone no already exist");
                }
            }
            /*if(userPhoneExist.length > 0){
                throw new DatabaseError("Phone no already exist");
            }*/
        } else {
            throw new DatabaseError("Email & Phone no is required");
        }
        let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let password = '';
        let length = 8;
        for (var i = length; i > 0; --i) password += chars[Math.floor(Math.random() * chars.length)];
        const hashPassword = crypto.createHash('sha256').update(password).digest('hex');
        let latitude = '';
        let longitude = '';
        if (params.firstAddressLine && params.city) {
            let address = params.firstAddressLine + ',' + params.city;
            const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.GEOCODE_KEY}`;


            const response = await axios({
                url: endpoint,
                method: 'get'
            });
            if (response.data.status == 'OK') {
                latitude = response.data.results[0].geometry.location.lat;
                longitude = response.data.results[0].geometry.location.lng;
            }
        }
        if (Lib.containsNumbers(params.name)) {
            return { error: true, message: "nameNotNumeric" };
        }
        const user = new User({
            name: `${params.name}`,
            contact: {
                email: {
                    address: params.email,
                    is_verfied: false
                },
                phone: {
                    number: params.phone,
                    is_verfied: false,
                    country_code: params.countryCode || "IN",
                    phone_code: params.phoneCode || "+91"
                },
                first_address_line: params.firstAddressLine ? params.firstAddressLine : "",
                city: params.city ? params.city : "",
                zipcode: params.zipcode ? params.zipcode : "",
                latitude: latitude,
                longitude: longitude
            },
            password: hashPassword,
            code: "586589",
            user_type: params.userType ? params.userType : "user",
            profile_image: params.profileImage ? params.profileImage : "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80",
            date_of_birth: {
                value: params.dateOfBirth ? new Date(Date.parse(params.dateOfBirth)).toISOString() : "",
                is_masked: false
            },
            gender: params.gender ? params.gender : "male",
            hobbies: [
                "Cycling",
                "Singing",
                "Drawing"
            ],
            area_of_work: [
                "IT"
            ],
            profession: [
                "IT Service"
            ],
            about_yourself: "Hello world",
            family_members: []
        });
        let res = await user.save();
        // let subject = "Welcome to SangaRaahi "+params.name;
        // let body = "<h1>Welcome from Sangaraahi</h1><div><p>Email: <b>"+params.email+"</b></p><br><p>Password: <b>"+password+"</b> </p></div>"
        /**
         * Send mail with link
         * sendMail parameters 
         * 1st param - Email
         * 2nd param - Subject
         * 3rd param - HTML Body
         */
        // const mail = notificationServices.sendMail(params.email,subject,body);
        return res._id;
        // } catch(e) {
        //     throw new DatabaseError("Cannot create the user.");
        // }
    },
    getUsers: async function (params) {
        try {
            const page = params.page || 1;
            const limit = params.limit || 10;
            let condition = {
                "is_deleted": false,
            }
            if (params && params.search) {
                condition.name = {
                    $regex: `.*${params.search}.*`,
                    $options: 'i'
                };
            }

            let sortObject = {};
            let key = "created_at";
            let sort = -1;
            if (params.columnName && params.sort) {
                if (params.columnName == 'Name') {
                    key = 'name';
                }
                if (params.columnName == 'Email') {
                    key = 'contact.email.address';
                }
                if (params.sort == 'asc') {
                    sort = 1;
                }

            }
            sortObject[key] = sort;

            const aggregationPipeline = [
                {

                    $unwind: {
                        path: "$members",
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $addFields: {
                        communityMemberId:
                            "$members.community_member_id"
                    }
                },
                {
                    $lookup: {
                        from: "sr_users",
                        localField: "members.member_id",
                        foreignField: "_id",
                        as: "user_master"
                    }
                },
                {
                    $unwind: {
                        path: "$user_master",
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $addFields: {
                        "user_master.communityMemberId": "$communityMemberId"
                    }
                },
                {
                    $project: {
                        user_master: 1,
                    }
                },
                {
                    $project: {
                        _id: 0
                    }
                },
                { $replaceRoot: { newRoot: "$user_master" } },
                {
                    $group: {
                        _id: "$_id",
                        doc: { $first: "$$ROOT" }
                    }
                },
                { $replaceRoot: { newRoot: "$doc" } },
                { $match: condition }
            ];
            const paginationPipeline = [
                { $sort: sortObject },
                { $skip: (page - 1) * limit },
                { $limit: limit },
            ];

            const user = await Communities.aggregate([
                ...aggregationPipeline,
                ...paginationPipeline
            ]);
            // For total count
            const totalResult = await Communities.aggregate([
                ...aggregationPipeline,
                { $count: "total" }
            ]);

            const total = totalResult[0]?.total || 0;
            const from = (page - 1) * limit + 1;
            const to = Math.min(page * limit, total);
            return ({
                error: false,
                message: "generalSuccess",
                total: total,
                from: from,
                to: to,
                data: user
            });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("User find error");
        }
    },

    getLoggedInUsers: async function (data) {
        try {
            const searchName = data.search?.trim();
            const page = data.page || 1;
            const limit = data.limit || 10;
            const communityId = data.communityId;

            let aggregate = [
                {
                    $match: {
                        _id: new ObjectId(communityId),
                    },
                },
                {
                    $unwind: {
                        path: "$members",
                    },
                },
                {
                    $match: {
                        "members.is_rejected": false,
                        "members.is_leaved": false,
                        "members.is_deleted": false,
                    },
                },
                {
                    $lookup: {
                        from: "sr_users",
                        localField: "members.member_id",
                        foreignField: "_id",
                        as: "members.user",
                    },
                },
                {
                    $unwind: {
                        path: "$members.user",
                    },
                },
                // {
                //     $match: {
                //         "members.user.is_deleted": false,
                //         "members.user.is_loggedIn": true,
                //         ...(searchName && {
                //             "members.user.name": {
                //                 $regex: searchName,
                //                 $options: "i"
                //             }
                //         }),
                //     }
                // },
                {
                    $match: {
                        "members.user.is_deleted": false,
                        "members.user.is_loggedIn": true,
                        "members.user.device_details": {
                            $elemMatch: {
                                device_type: 'web',
                                is_active: true
                            }
                        },
                        ...(searchName && {
                            "members.user.name": {
                                $regex: searchName,
                                $options: "i"
                            }
                        })
                    }
                },
                {
                    $sort: {
                        "members.user.created_at": -1,
                    },
                },
                {
                    $project: {
                        community_name: 1,
                        "members.member_id": 1,
                        "members.community_member_id": 1,
                        "members.roles": 1,
                        "members.is_active": 1,
                        "members.joined_at": 1,
                        "members.user._id": 1,
                        "members.user.name": 1,
                        "members.user.contact.email.address": 1,
                        "members.user.contact.phone.number": 1,
                        "members.user.profile_image": 1,
                        "members.user.created_at": 1,
                        "members.user.last_activity_at": 1,
                    },
                }
            ];

            const countPipeline = [...aggregate, { $count: 'total' }];
            const countResult = await Communities.aggregate(countPipeline);
            const total = countResult[0]?.total || 0;

            let activeUsers = await Communities.aggregate([
                ...aggregate,
                { $skip: (page - 1) * limit },
                { $limit: limit }
            ]).collation({ locale: 'en' });

            let from = 0;
            let to = 0;
            if (total > 0) {
                from = ((page - 1) * limit) + 1;
                to = from + activeUsers.length - 1;
            }

            return {
                error: false,
                message: "generalSuccess",
                total,
                from,
                to,
                data: activeUsers
            };

        } catch (error) {
            console.log(error);

        }
    },
    getMyProfileDetails: async function (userId) {
        try {
            // Getting logged-in user profile details
            const profileData = await User.findOne({ _id: new ObjectId(userId) });

            // Checking if the logged-in user exist or not
            if (Lib.isEmpty(profileData)) {
                return { error: true, message: "userNotFound", ErrorClass: ErrorModules.Api404Error };
            }
            // Filter out family members with is_deleted: false
            const filteredFamilyMembers = profileData.family_members.filter(member => !member.is_deleted);

            // Update profile data with filtered family members
            profileData.family_members = filteredFamilyMembers;
            // Checking if there is any selected community under the user
            /*if(Lib.isEmpty(profileData.selected_community)) {
                return {error:true, message:"noSelectedCommunity", ErrorClass:ErrorModules.Api404Error};
            }*/

            // Converting Country and state name from code
            let stateData = Lib.cloneObject(State);
            let countryData = Lib.cloneObject(CountryCode);

            let country = countryData.filter((country) => country.code === profileData.contact.country);
            let state = stateData.filter((state) => state.state_code === profileData.contact.state && state.country_code === profileData.contact.country);
            if (!Lib.isEmpty(country)) {
                profileData.contact.country = country[0].name;
            }
            if (!Lib.isEmpty(state)) {
                profileData.contact.state = state[0].name;
            }

            // Extract subLanguage from future_language
            if (Array.isArray(profileData.future_language) && profileData.future_language.length > 0) {
                profileData.subLanguage = profileData.future_language[0].sub_language || null;
            } else {
                profileData.subLanguage = null;
            }

            let role = '';
            let roleKey = '';
            let communityName = '';
            let communityMemberId = '';
            if (profileData.selected_community) {
                // Getting role of the user from the default community
                let aggregate = [
                    {
                        '$match': {
                            '_id': profileData.selected_community
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$members'
                        }
                    },
                    {
                        '$match': {
                            'members.member_id': new ObjectId(userId),
                            'members.is_approved': true,
                            'members.is_active': true,
                            'members.is_deleted': false,
                            'members.is_leaved': false
                        }
                    },
                    {
                        '$project': {
                            'community_name': 1,
                            'members.roles': 1,
                            'members.community_member_id': 1
                        }
                    }
                ];

                const community = await Communities.aggregate(aggregate);

                // Checking community exist or not
                if (community.length !== 0) {
                    // toTitleCase function is for the default role value convert to the Title Case
                    role = Lib.toTitleCase(community[0].members.roles[0], '_', false, ' ');
                    roleKey = community[0].members.roles[0];
                    communityName = community[0].community_name;
                    communityMemberId = community[0].members.community_member_id
                }
            }

            return {
                error: false,
                message: "generalSuccess",
                data: {
                    user: Lib.reconstructObjectKeys(Lib.generalizeUser(profileData.toJSON()), "value", Lib.convertDate),
                    role: role,
                    roleKey: roleKey,
                    communityName: communityName,
                    communityMemberId: communityMemberId
                },
            }
        } catch (error) {
            console.log(error)
            return { error: true, message: "internalServerError", stack: error, ErrorClass: ErrorModules.FatalError };
        }
    },
    getPublicProfile: async function (groupId, communityId, userId, id, context) {
        // Getting user profile details
        const profileData = await User.findOne({ _id: new ObjectId(userId), is_deleted: false });
        if (Lib.isEmpty(profileData)) {
            return { error: true, message: "userNotFound", ErrorClass: ErrorModules.Api404Error };
        }
        // Checking if user is in contact list of the logged-in user
        const isFamily = await User.findOne({
            _id: new ObjectId(id),
            family_members:
            {
                $elemMatch:
                {
                    user_id: new ObjectId(userId)
                }
            }
        });
        const isContact = await User.findOne({
            _id: new ObjectId(id),
            contacts:
            {
                $elemMatch:
                {
                    user_id: new ObjectId(userId),
                    is_deleted: false
                }
            }
        });
        // Getting mutual communities
        let mutualCommunities = await Communities.find({
            is_active: true,
            is_deleted: false,
            members: {
                $all: [
                    {
                        "$elemMatch": {
                            member_id: new ObjectId(userId),
                            is_active: true,
                            is_deleted: false,
                            is_approved: true,
                            is_leaved: false
                        }
                    },
                    {
                        "$elemMatch": {
                            member_id: new ObjectId(id),
                            is_active: true,
                            is_deleted: false,
                            is_approved: true,
                            is_leaved: false
                        }
                    }
                ]

            }
        }, '_id community_name banner_image');
        if (!Lib.isEmpty(mutualCommunities)) {
            mutualCommunities = Lib.reconstructObjectKeys(mutualCommunities);
        }
        // Getting mutual groups
        let mutualGroups = await Group.find({
            is_active: true,
            is_deleted: false,
            members: {
                $all: [
                    {
                        "$elemMatch": {
                            member_id: new ObjectId(userId),
                            is_active: true,
                            is_deleted: false,
                            is_approved: true,
                            is_leaved: false
                        }
                    },
                    {
                        "$elemMatch": {
                            member_id: new ObjectId(id),
                            is_active: true,
                            is_deleted: false,
                            is_approved: true,
                            is_leaved: false
                        }
                    }
                ]

            }
        });
        // Getting role depending on Community
        let role = "";
        if (!Lib.isEmpty(communityId)) {
            const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
            const currentCommunity = await Communities.aggregate(
                [
                    {
                        '$match': {
                            '_id': new ObjectId(communityId),
                            'is_active': true,
                            'is_deleted': false,
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
                            'members.is_deleted': false,
                            'members.is_leaved': false,
                            'members.member_id': new ObjectId(userId)
                        }
                    },
                    {
                        '$project': {
                            'members.roles': 1,
                        }
                    }
                ]);
            // Checking if the community is exist or not
            if (Lib.isEmpty(currentCommunity)) {
                return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
            } else {
                // toTitleCase function is for the default role value convert to the Title Case
                role = Lib.toTitleCase(currentCommunity[0].members.roles[0], '_', false, ' ');
            }
            if (currentCommunity[0].members.roles[0] !== ROLES_ENUM.fan) {
                const userCommunity = await this.getUserCommunityDetails(context.getAuthUserInfo(), communityId);
                if (userCommunity.error) {
                    return Lib.sendResponse(userCommunity);
                }
                // Now check if the role is allowed to fetch the details

                if ([ROLES_ENUM.fan].includes(userCommunity.data.role)) {
                    // Not allowed as fan or member
                    return Lib.sendResponse({
                        error: true,
                        message: "permissionDenied",
                        ErrorClass: ErrorModules.AuthError,
                        statusCode: Lib.getHttpErrors('FORBIDDEN')
                    });
                }
            }

        }
        // Getting role depending on Group
        if (!Lib.isEmpty(groupId)) {
            const currentGroup = await Group.aggregate(
                [
                    {
                        '$match': {
                            '_id': new ObjectId(groupId),
                            'is_active': true,
                            'is_deleted': false,
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
                            'members.is_deleted': false,
                            'members.is_leaved': false,
                            'members.member_id': new ObjectId(userId)
                        }
                    },
                    {
                        '$project': {
                            'members.roles': 1,
                        }
                    }
                ]);
            // Checking if the group is exist or not
            if (Lib.isEmpty(currentGroup)) {
                return { error: true, message: "nogroupFound", ErrorClass: ErrorModules.Api404Error };
            } else {
                // toTitleCase function is for the default role value convert to the Title Case
                role = Lib.toTitleCase(currentGroup[0].members.roles[0]);
            }
        }

        //Getting family member details
        let aggregate = [
            {
                '$match': {
                    '_id': new ObjectId(userId)
                }
            },
            {
                '$unwind': {
                    'path': '$family_members'
                }
            },
            {
                '$lookup': {
                    'from': 'sr_users',
                    'localField': 'family_members.user_id',
                    'foreignField': '_id',
                    'as': 'family_members.user'
                }
            }, {
                '$unwind': {
                    'path': '$family_members.user',
                    'preserveNullAndEmptyArrays': true
                }
            },
            {
                '$project': {
                    'family_members.user_id': 1,
                    'family_members.member_image': 1,
                    'family_members.member_name': 1,
                    'family_members.relation_type': 1,
                    'family_members.user': 1,
                }
            }
        ];

        let userFamilyMember = await User.aggregate(aggregate);

        if (!Lib.isEmpty(userFamilyMember)) {
            userFamilyMember = Lib.reconstructObjectKeys(userFamilyMember);
        }

        return {
            error: false,
            message: "generalSuccess",
            data: {
                user: Lib.reconstructObjectKeys(Lib.generalizeUser(profileData.toJSON()), "value", Lib.convertDate),
                role: role,
                loggedUser: id,
                isContact: isContact ? true : false,
                isFamily: isFamily ? true : false,
                mutualCommunitiesCount: mutualCommunities.length,
                mutualCommunities: mutualCommunities,
                mutualGroupsCount: mutualGroups.length,
                familyMemberCount: profileData.family_members.length,
                familyMemberDetails: userFamilyMember
            }
        };

    },
    getUserCommunityDetails: async function (_user, communityId) {
        if (!communityId) {
            if (!_user['selected_community'] && !_user['selectedCommunity']) {
                const userCommunity = await Communities.aggregate([
                    {
                        $match: {
                            "is_active": true,
                            "is_deleted": false
                        }
                    },
                    {
                        $unwind: {
                            path: "$members"
                        }
                    },
                    {
                        $match: {
                            "members.member_id": new ObjectId(_user._id || _user.id),
                            'members.is_deleted': false,
                            'members.is_active': true,
                            'members.is_approved': true,
                            'members.is_leaved': false,
                        }
                    }
                ]);

                if (!Lib.isEmpty(userCommunity)) {
                    let userDetails = await User.findOne({ _id: new ObjectId(_user._id) });
                    userDetails.selected_community = userCommunity[0]._id;
                    userDetails.save();
                }
                // Don't have any community
                return { error: true, message: "userNoDefaultCommunity", ErrorClass: ErrorModules.GeneralApiError };
            }
            communityId = _user['selected_community'] || _user['selectedCommunity'];
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
                    "members.member_id": new ObjectId(_user._id || _user.id),
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
    getUserCommunityPortalDetails: async function (_user, communityId) {
        if (!communityId) {
            if (!_user['selected_organization_portal'] && !_user['selectedOrganizationPortal']) {
                return { error: true, message: "userNoDefaultCommunityPortal", ErrorClass: ErrorModules.GeneralApiError };
            }
            communityId = _user['selected_organization_portal'] || _user['selectedOrganizationPortal'];
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
                    "members.member_id": new ObjectId(_user._id || _user.id),
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
        const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
        const currentMemberRoleCount = community[0].members['roles'].length;

        if (currentMemberRoleCount > 1) {
            const currentMemberRole = community[0].members['roles'][1];
            return {
                error: false,
                message: "generalSuccess",
                data: {
                    community: community[0],
                    role: currentMemberRole
                }
            };
        } else {
            const currentMemberRole = community[0].members['roles'][0];
            if ([ROLES_ENUM.fan, ROLES_ENUM.member].includes(currentMemberRole)) {
                // Not allowed as fan or member
                return {
                    error: true,
                    message: "permissionDenied",
                    ErrorClass: ErrorModules.AuthError,
                    statusCode: Lib.getHttpErrors('FORBIDDEN')
                };
            } else {
                return {
                    error: false,
                    message: "generalSuccess",
                    data: {
                        community: community[0],
                        role: currentMemberRole
                    }
                };
            }
        }

    },
    getUserGroupDetails: async function (_user, groupId) {
        const group = await Group.aggregate([
            {
                $match: {
                    _id: groupId
                }
            },
            {
                $unwind: {
                    path: "$members"
                }
            },
            {
                $match: {
                    "members.member_id": new ObjectId(_user._id || _user.id),
                    'members.is_deleted': false,
                    'members.is_active': true,
                    'members.is_approved': true,
                    'members.is_leaved': false,
                }
            }
        ]);
        if (Lib.isEmpty(group)) {
            return { error: true, message: "noGroupFound", ErrorClass: ErrorModules.Api404Error };
        }
        if (Lib.isEmpty(group[0].members)) {
            return { error: true, message: "notAGroupMember", ErrorClass: ErrorModules.Api404Error };
        }
        const currentMemberRole = group[0].members['roles'][0];
        return {
            error: false,
            message: "generalSuccess",
            data: {
                group: group[0],
                role: currentMemberRole
            }
        };
    },
    getUserGroupDetails: async function (_user, groupId) {
        const group = await Group.aggregate([
            {
                $match: {
                    _id: new ObjectId(groupId)
                }
            },
            {
                $unwind: {
                    path: "$members"
                }
            },
            {
                $match: {
                    "members.member_id": new ObjectId(_user._id || _user.id)
                }
            }
        ]);
        if (Lib.isEmpty(group)) {
            return { error: true, message: "noGroupFound", ErrorClass: ErrorModules.Api404Error };
        }
        if (Lib.isEmpty(group[0].members)) {
            return { error: true, message: "notAGroupMember", ErrorClass: ErrorModules.Api404Error };
        }
        const currentMemberRole = group[0].members['roles'][0];
        return {
            error: false,
            message: "generalSuccess",
            data: {
                group: group[0],
                role: currentMemberRole
            }
        };
    },
    getUserCommunityRoles: async function (userId) {
        /**
         * Databse work
         */
        const com = await Communities.aggregate([
            {
                $match: {
                    is_deleted: false,
                    is_active: true
                }
            },
            {
                $unwind: {
                    path: "$members"
                }
            },
            {
                $match: {
                    members: {
                        $elemMatch: {
                            member_id: new ObjectId(userId)
                        }
                    }
                }
            },
            {
                $project: {
                    "members.roles": 1
                }
            }
        ]);
        return { error: false, message: "generalSuccess", data: com };
    },
    /**
     *
     * @param _user the Auth user object
     * @param {string} groupId the group id
     * @param {Array<string>} notPermitGroupRole The array of group role that needs to be prevented from performing the task
     * @param {Array<string>} notPermitCommunityRole The array of community role that needs to be prevented from performing the task
     * @return {Promise<{error: boolean}|{ErrorClass: *, error: boolean, message: string}|{ErrorClass: *, error: boolean, message: string}|{ErrorClass: *, error: boolean, message: string}|{data: {role: *, community: any}, error: boolean, message: string}|{error: boolean, message: string, statusCode: {statusCode: string, code: number}}|{ErrorClass: *, error: boolean, message: string}|{ErrorClass: *, error: boolean, message: string}|{data: {role: *, group: any}, error: boolean, message: string}|undefined>}
     */
    checkUserGroupPermission: async function ({ _user, groupId, notPermitGroupRole, notPermitCommunityRole }) {
        const userGroup = await this.getUserGroupDetails(_user, groupId);
        if (userGroup.error) {
            return userGroup;
        }
        const communityId = userGroup.data.group.community_id;
        const userCommunity = await this.getUserCommunityDetails(_user, null);
        if (userCommunity.error) {
            return userCommunity;
        }
        // Check if the group belongs to the same community
        if (communityId.toString() !== userCommunity.data.community._id.toString()) {
            return {
                error: true,
                message: "groupDoesNotBelongToSelectedCommunity",
                statusCode: Lib.getHttpErrors('BAD_REQUEST')
            };
        }
        if ((!notPermitCommunityRole && !notPermitGroupRole) ||
            (!Array.isArray(notPermitGroupRole) && !Array.isArray(notPermitCommunityRole))
            || (!notPermitGroupRole.length && !notPermitCommunityRole.length)) {
            throw new Error("Roles not defined properly to check the permission");
        }
        // Now check if the role is allowed to fetch the details
        if (notPermitCommunityRole && Array.isArray(notPermitCommunityRole) && notPermitCommunityRole.length) {
            if (notPermitCommunityRole.includes(userCommunity.data.role)) {
                // Not allowed as role
                return Lib.sendResponse({
                    error: true,
                    message: "permissionDenied",
                    ErrorClass: ErrorModules.DenialError,
                    statusCode: Lib.getHttpErrors('FORBIDDEN')
                });
            }
        }
        if (notPermitGroupRole && Array.isArray(notPermitGroupRole) && notPermitGroupRole.length) {
            if (notPermitGroupRole.includes(userGroup.data.role)) {
                // Not allowed as role
                return Lib.sendResponse({
                    error: true,
                    message: "permissionDenied",
                    ErrorClass: ErrorModules.DenialError,
                    statusCode: Lib.getHttpErrors('FORBIDDEN')
                });
            }
        }
        return {
            error: false, data: {
                group: userGroup.data.group,
                groupRole: userGroup.data.role,
                community: userCommunity.data.community,
                communityRole: userCommunity.data.role
            }
        };
    },
    getFamilyMembers: async function (userId, search, page, limit = 10) {
        try {
            const aggregation = [
                {
                    '$match': {
                        '_id': new ObjectId(userId)
                    }
                }, {
                    '$unwind': {
                        'path': '$family_members'
                    }
                }, {
                    '$match': {
                        'family_members.is_deleted': false
                    }
                },
                {
                    '$lookup': {
                        'from': 'sr_users',
                        'localField': 'family_members.user_id',
                        'foreignField': '_id',
                        'as': 'userData'
                    }
                },/* {
                    '$unwind': {
                        'path': '$userData'
                    }
                },*/ {
                    '$project': {
                        'family_members': 1,
                        'userData': 1
                    }
                }
            ];
            if (search) {
                aggregation.push({
                    $match: {
                        $or: [
                            { "family_members.member_name": new RegExp(`.*${search.trim()}.*`, 'i') },
                            { "userData.name": new RegExp(`.*${search.trim()}.*`, 'i') }
                        ]
                    }
                });
            }
            let pagination = null;
            if (page && limit) {
                let skip = ((page - 1) * limit);
                // Get the total
                let totalFamilyMembers = 0;
                if (search) {
                    const userFamilyMemberDetails = await User.aggregate(aggregation);
                    totalFamilyMembers = userFamilyMemberDetails.length;
                } else {
                    totalFamilyMembers = (await User.findOne({ _id: new ObjectId(userId) }, { family_members: 1 })).family_members.length;
                }
                pagination = Lib.getPaginationInfo(totalFamilyMembers, page, limit);
                aggregation.push({ $skip: skip }, { $limit: limit });
            }
            const userFamilyMembers = await User.aggregate(aggregation);
            return {
                error: false, message: "generalSuccess", data: {
                    familyMembers: userFamilyMembers.map(u => {
                        // Reassign the name and other details
                        if (u.family_members.user_id) {
                            u.userData = u.userData[0];
                            u.family_members.member_name = u.userData ? u.userData.name : '';
                            u.family_members.member_image = u.userData ? u.userData.profile_image : '';
                            u.family_members.phone = u.userData ? u.userData.contact.phone.number : '';
                            u.family_members.phone_code = u.userData ? u.userData.contact.phone.phone_code : '';
                            u.family_members.country_code = u.userData ? u.userData.contact.phone.country_code : '';
                            u.family_members.email = u.userData ? u.userData.contact.email.address : '';
                            u.family_members.gender = u.userData ? u.userData.gender : '';
                            u.family_members.year_of_birth = u.userData ? u.userData.year_of_birth : '';
                            u.family_members.first_address_line = u.userData ? u.userData.contact.first_address_line : '';
                            u.family_members.second_address_line = u.userData ? u.userData.contact.second_address_line : '';
                            u.family_members.zipcode = u.userData ? u.userData.contact.zipcode : '';
                            u.family_members.city = u.userData ? u.userData.contact.city : '';
                            u.family_members.state = u.userData ? u.userData.contact.state : '';
                            u.family_members.country = u.userData ? u.userData.contact.country : '';
                        }
                        return Lib.reconstructObjectKeys(u.family_members);
                    }),
                    pagination: pagination
                }
            }
        } catch (e) {
            clog(e)
            return { error: true, message: "internalServerError", stack: e, ErrorClass: ErrorModules.FatalError }
        }
    },
    getFamilyMemberDetails: async function (userId, familyMemberId) {
        try {

            // Check if both userId and familyMemberId are provided
            if (!userId || !familyMemberId) {
                return {
                    error: true,
                    systemCode: 'USER_OR_FAMILY_MEMBER_ID_MISSING',
                    code: 400,
                    message: 'User ID and Family Member ID are required.',
                    data: null
                };
            }

            // Query the database to find the user with family members
            const user = await User.findById(userId)
                .lean();

            // Check if the user exists
            if (!user || !user.family_members) {
                return {
                    error: true,
                    systemCode: 'USER_OR_FAMILY_MEMBER_NOT_FOUND',
                    code: 404,
                    message: 'User or family members not found.',
                    data: null
                };
            }

            // Filter the family members array to find the specific family member with given ID and is_deleted: false
            const familyMemberDetails = user.family_members.find(
                (member) => member._id.toString() === familyMemberId && member.is_deleted === false
            );

            // Check if the specific family member exists and is not deleted
            if (!familyMemberDetails) {
                return {
                    error: true,
                    systemCode: 'FAMILY_MEMBER_NOT_FOUND',
                    code: 404,
                    message: 'Family member not found.',
                    data: null
                };
            }

            // Format the response
            return {
                error: false,
                systemCode: 'FAMILY_MEMBER_DETAILS_RETRIEVED',
                code: 200,
                message: 'Family member details retrieved successfully.',
                data: {
                    id: familyMemberDetails._id,
                    userId: userId,
                    communityMemberId: familyMemberDetails.community_member_id,
                    ageOfMinority: familyMemberDetails.age_of_minority,
                    relationType: familyMemberDetails.relation_type,
                    memberName: familyMemberDetails.member_name,
                    memberImage: familyMemberDetails.member_image,
                    phone: familyMemberDetails.phone,
                    email: familyMemberDetails.email,
                    gender: familyMemberDetails.gender,
                    phoneCode: familyMemberDetails.phone_code,
                    countryCode: familyMemberDetails.country_code,
                    yearOfBirth: familyMemberDetails.year_of_birth,
                    firstAddressLine: familyMemberDetails.first_address_line,
                    secondAddressLine: familyMemberDetails.second_address_line,
                    zipcode: familyMemberDetails.zipcode,
                    city: familyMemberDetails.city,
                    state: familyMemberDetails.state,
                    country: familyMemberDetails.country
                }
            };
        } catch (error) {
            console.error('Error fetching family member details:', error);
            return {
                error: true,
                systemCode: 'INTERNAL_SERVER_ERROR',
                code: 500,
                message: 'An error occurred while retrieving family member details.',
                data: null
            };
        }
    },

    getUserFamilyMembers: async function (userId, search, page, limit = 10) {
        try {
            const aggregation = [
                {
                    '$match': {
                        '_id': new ObjectId(userId)
                    }
                }, {
                    '$unwind': {
                        'path': '$family_members'
                    }
                }, {
                    '$match': {
                        'family_members.is_deleted': false
                    }
                },
                {
                    '$lookup': {
                        'from': 'sr_users',
                        'localField': 'family_members.user_id',
                        'foreignField': '_id',
                        'as': 'userData'
                    }
                },/* {
                    '$unwind': {
                        'path': '$userData'
                    }
                },*/ {
                    '$project': {
                        'family_members': 1,
                        'userData': 1
                    }
                }
            ];
            if (search) {
                aggregation.push({
                    $match: {
                        $or: [
                            { "family_members.member_name": new RegExp(`.*${search.trim()}.*`, 'i') },
                            { "userData.name": new RegExp(`.*${search.trim()}.*`, 'i') }
                        ]
                    }
                });
            }
            let pagination = null;
            if (page && limit) {
                let skip = ((page - 1) * limit);
                // Get the total
                let totalFamilyMembers = 0;
                if (search) {
                    const userFamilyMemberDetails = await User.aggregate(aggregation);
                    totalFamilyMembers = userFamilyMemberDetails.length;
                } else {
                    totalFamilyMembers = (await User.findOne({ _id: new ObjectId(userId) }, { family_members: 1 })).family_members.length;
                }
                pagination = Lib.getPaginationInfo(totalFamilyMembers, page, limit);
                aggregation.push({ $skip: skip }, { $limit: limit });
            }
            const userFamilyMembers = await User.aggregate(aggregation);

            return {
                error: false, message: "generalSuccess", data: {
                    familyMembers: userFamilyMembers.map(u => {
                        // Reassign the name and other details
                        if (u.family_members.user_id) {
                            u.userData = u.userData[0];
                            u.family_members.member_name = u.userData ? u.userData.name : '';
                            u.family_members.member_image = u.userData ? u.userData.profile_image : '';
                            u.family_members.phone = u.userData ? u.userData.contact.phone.number : '';
                            u.family_members.phone_code = u.userData ? u.userData.contact.phone.phone_code : '';
                            u.family_members.country_code = u.userData ? u.userData.contact.phone.country_code : '';
                            u.family_members.email = u.userData ? u.userData.contact.email.address : '';
                            u.family_members.gender = u.userData ? u.userData.gender : '';
                            u.family_members.year_of_birth = u.userData ? u.userData.year_of_birth : '';
                            u.family_members.first_address_line = u.userData ? u.userData.contact.first_address_line : '';
                            u.family_members.second_address_line = u.userData ? u.userData.contact.second_address_line : '';
                            u.family_members.zipcode = u.userData ? u.userData.contact.zipcode : '';
                            u.family_members.city = u.userData ? u.userData.contact.city : '';
                            u.family_members.state = u.userData ? u.userData.contact.state : '';
                            u.family_members.country = u.userData ? u.userData.contact.country : '';
                        }
                        return Lib.reconstructObjectKeys(u.family_members);
                    }),
                    pagination: pagination
                }
            }
        } catch (e) {
            clog(e)
            return { error: true, message: "internalServerError", stack: e, ErrorClass: ErrorModules.FatalError }
        }
    },

    getFamilyMembersByMemberIds: async function (communityId, memberIds) {
        try {
            const aggregate = [
                { $match: { _id: new ObjectId(communityId) } },
                { $unwind: { path: '$members' } },
                {
                    $match: {
                        'members.is_rejected': false,
                        'members.is_leaved': false,
                        'members.is_deleted': false,
                        'members.member_id': { $in: memberIds.map(id => new ObjectId(id)) },
                    },
                },
                {
                    $lookup: {
                        from: 'sr_users',
                        localField: 'members.member_id',
                        foreignField: 'family_members.user_id',
                        as: 'members.user',
                    },
                },
                {
                    $unwind: {
                        path: '$members.user'
                    }
                },
                {
                    $match: {
                        'members.user.is_deleted': false,
                        // 'members.user.is_active': true,
                    },
                },
                { $unwind: { path: '$members.roles' } },
                { $sort: { 'members.user.created_at': -1 } },
                {
                    $project: {
                        community_name: 1,
                        'members.user.member_id': 1,
                        'members.user.family_members.member_name': 1,
                        'members.user.family_members.member_image': 1,
                        'members.user.family_members._id': 1,
                        'members.user.family_members.is_active': 1,
                        'members.user.family_members.joined_at': 1,
                        'members.user.family_members.contact': 1,
                        'members.user.family_members.created_at': 1,
                        'members.user.family_members.last_activity_at': 1,
                        'members.user.family_members.acknowledgement_status': 1,
                        'members.user.family_members.acknowledgement_date': 1,
                        'members.user.family_members.invitation_date': 1,
                    },
                },
            ];

            const familyMembers = await Communities.aggregate(aggregate);
            const structureData = familyMembers[0]?.members?.user;

            return {
                error: false,
                message: 'generalSuccess',
                data: structureData,
            };
        } catch (error) {
            console.error('Error in getFamilyMembersByMemberIds:', error.message);
            return {
                error: true,
                message: 'An error occurred while fetching family members.',
            };
        }
    },

    addFamilyMember: async function (loginId, args, communityId) {
        const community = await Communities.findOne({
            _id: ObjectId(communityId),
            is_active: true,
            is_deleted: false
        });
        const userMember = community.members.find(member => member.member_id.toString() === loginId.toString());
        const loginUserCommunityMemberId = userMember.community_member_id;

        const loggedinUser = await User.findOne({ _id: loginId });
        if (Lib.isEmpty(loggedinUser)) {
            return { error: true, message: "userNotFound", ErrorClass: ErrorModules.API404Error };
        }
        const familyMemberCount = loggedinUser.family_members.length
        const familyMemberUniqueId = `${loginUserCommunityMemberId}FM${(familyMemberCount + 1).toString().padStart(3, '0')}`;
        let memberPayload = {
            age_of_minority: '',
            relation_type: '',
            member_name: '',
            member_image: '',
            phone: ''
        }

        if (args.id) {
            const memberUser = await User.findOne({ _id: args.id });
            if (Lib.isEmpty(memberUser)) {
                throw new ErrorModules.DatabaseError("Member is not an user");
            }

            if (loggedinUser.family_members && loggedinUser.family_members.length !== 0) {
                //Checking if the user is already a member or not
                let isMember = await loggedinUser.family_members.find(member => member.user_id && member.user_id.toString() === args.id && !member.is_deleted);
                if (Lib.isEmpty(isMember)) {
                    memberPayload.user_id = args.id;
                } else {
                    throw new ErrorModules.DatabaseError("Already a member");
                }
            } else {
                memberPayload.user_id = args.id;
            }

            memberPayload.member_name = memberUser.name ? memberUser.name : '';
            memberPayload.member_image = memberUser.profile_image ? memberUser.profile_image : '';
            memberPayload.phone = memberUser.contact && memberUser.contact.phone && memberUser.contact.phone.number ? memberUser.contact.phone.number : '';
            memberPayload.email = memberUser.contact && memberUser.contact.email && memberUser.contact.email.address ? memberUser.contact.email.address : '';

        } else {
            memberPayload.community_member_id = familyMemberUniqueId;
            memberPayload.member_name = `${args.firstName}${args.middleName ? ' ' + args.middleName : ''} ${args.lastName}`;
            memberPayload.member_image = args.memberImage ? args.memberImage : '';
            memberPayload.phone = args.phone ? args.phone : '';
            memberPayload.year_of_birth = args.yearOfBirth ? args.yearOfBirth : '';
            memberPayload.email = args.email ? args.email : '';
            memberPayload.first_address_line = args.address1 ? args.address1 : '';
            memberPayload.second_address_line = args.address2 ? args.address2 : '';
            memberPayload.country_code = args.countryCode ? args.countryCode : '';
            memberPayload.phone_code = args.phoneCode ? args.phoneCode : '';
            memberPayload.zipcode = args.zipcode ? args.zipcode : '';
            memberPayload.city = args.city ? args.city : '';
            memberPayload.state = args.state ? args.state : '';
            memberPayload.country = args.country ? args.country : '';
            memberPayload.gender = args.gender ? args.gender : '';
        }

        memberPayload.age_of_minority = args.memberType ? args.memberType : 'minor';
        memberPayload.relation_type = args.relationType ? args.relationType : '';


        loggedinUser.family_members.push(memberPayload);
        const res = await loggedinUser.save();

        const member = community.members.find(
            (m) => m.member_id.toString() === loginId.toString()
        );
        const userRole = member.roles;

        await ActivityLogService.activityLogActiion({
            communityId: communityId,
            userId: loginId,
            module: "USER",
            action: "ADD_FAMILYMEMBER",
            platForm: "app",
            memberRole: userRole,
            oldData: null,
            newData: res
        })
        return ({ error: false, message: "addFamilyMemberSuccess" });


    },
    updateProfileData: async function (logUser, args, admin) {
        // try {
        const findProfileData = await User.findOne({ _id: logUser });
        if (findProfileData.length > 0) {
            throw new ErrorModules.DatabaseError("User not found");
        }
        // Take a snapshot of old data before updates
        const originalData = findProfileData.toObject();

        const name = args.data.name ? args.data.name : findProfileData.name;
        if (Lib.containsNumbers(name)) {
            return { error: true, message: "nameNotNumeric" };
        }
        findProfileData.name = name;

        if (findProfileData.contact.email.address !== args.data.email) {
            let userEmailExist = await User.findOne({
                'contact.email.address': args.data.email,
                "is_deleted": false
            });

            if (userEmailExist) {
                throw new ErrorModules.DatabaseError("Email already exist");
            }
            findProfileData.contact.email.address = args.data.email ? args.data.email : findProfileData.contact.email.address;
            findProfileData.contact.email.is_verified = false;
        }
        findProfileData.profile_image = args.data.profileImage ? args.data.profileImage : findProfileData.profile_image;
        //---- PHONE NO EDIT IS CURRENTLY DISABLED
        if (admin) {
            findProfileData.contact.phone.number = args.data.phone ? args.data.phone : findProfileData.contact.phone.number;
        }
        // findProfileData.contact.phone.country_code = args.data.countryCode ? args.data.countryCode : findProfileData.contact.phone.country_code;
        // findProfileData.contact.phone.phone_code = args.data.phoneCode ? args.data.phoneCode : findProfileData.contact.phone.phone_code;
        if (findProfileData.contact.secondary_phone && findProfileData.contact.secondary_phone.number !== args.data.secondaryPhone) {
            if (args.data.secondaryPhone && args.data.secondaryCountryCode && args.data.secondaryPhoneCode) {
                findProfileData.contact.secondary_phone = {
                    number: args.data.secondaryPhone,
                    country_code: args.data.secondaryCountryCode,
                    phone_code: args.data.secondaryPhoneCode,
                    is_verfied: false,
                }
            }
        }

        //Address edit
        const first_address_line = args.data.firstAddressLine ? args.data.firstAddressLine : findProfileData.contact.first_address_line;
        const city = args.data.city ? args.data.city : findProfileData.contact.city;
        const state = args.data.state ? args.data.state : findProfileData.contact.state;
        const country = args.data.country ? args.data.country : findProfileData.contact.country;
        const zipcode = args.data.zipcode ? args.data.zipcode : findProfileData.contact.zipcode;
        findProfileData.contact.first_address_line = first_address_line;
        // findProfileData.contact.second_address_line = args.data.secondAddressLine ? args.data.secondAddressLine : findProfileData.contact.second_address_line;
        findProfileData.contact.second_address_line = args.data.secondAddressLine !== undefined && args.data.secondAddressLine !== null ? args.data.secondAddressLine : findProfileData.contact.second_address_line;
        findProfileData.contact.city = city;
        findProfileData.contact.state = state;
        findProfileData.contact.country = country;
        findProfileData.contact.zipcode = zipcode;
        let mainAddress = first_address_line + ',' + city + ',' + state + ',' + zipcode + ',' + country;
        let latitude = '';
        let longitude = '';
        if (mainAddress) {
            const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${mainAddress}&key=${process.env.GEOCODE_KEY}`;


            const response = await axios({
                url: endpoint,
                method: 'get'
            });
            if (response.data.status == 'OK') {
                latitude = response.data.results[0].geometry.location.lat;
                longitude = response.data.results[0].geometry.location.lng;
            }
        }
        findProfileData.contact.latitude = latitude;
        findProfileData.contact.longitude = longitude;

        //
        if (args.data.dateOfBirth) {
            const dob = new Date(Date.parse(args.data.dateOfBirth)).toISOString();
            const date = new Date(dob);
            findProfileData.date_of_birth = {
                value: date,
                is_masked: args.data.isMasked || false
            }
        };
        findProfileData.gender = args.data.gender ? args.data.gender : findProfileData.gender;
        findProfileData.hobbies = args.data.hobbies ? args.data.hobbies : findProfileData.hobbies;
        findProfileData.area_of_work = args.data.areaOfWork ? args.data.areaOfWork : findProfileData.area_of_work;
        findProfileData.year_of_birth = args.data.yearOfBirth ? args.data.yearOfBirth : findProfileData.year_of_birth;
        findProfileData.profession = args.data.profession ? args.data.profession : findProfileData.profession;
        if (args.data.aboutYourself) {
            findProfileData.about_yourself = args.data.aboutYourself ? args.data.aboutYourself : findProfileData.about_yourself;
        }
        const updateProfileData = await findProfileData.save();
        // Check if this user is listed as a family member in any other user profile
        const familyMemberUser = await User.findOne({
            "family_members.user_id": logUser
        });
        if (familyMemberUser) {
            let updated = false;
            for (let member of familyMemberUser.family_members) {
                if (member.user_id && member.user_id.toString() === logUser.toString()) {
                    member.member_name = findProfileData.name;
                    member.member_image = findProfileData.profile_image || null;
                    member.email = findProfileData.contact.email.address || null;
                    member.phone = findProfileData.contact.phone?.number || null;
                    member.phone_code = findProfileData.contact.phone?.phone_code || null;
                    member.first_address_line = findProfileData.contact.first_address_line || null;
                    member.second_address_line = findProfileData.contact.second_address_line || null;
                    member.zipcode = findProfileData.contact.zipcode || null;
                    member.city = findProfileData.contact.city || null;
                    member.state = findProfileData.contact.state || null;
                    member.country = findProfileData.contact.country || null;
                    member.country_code = findProfileData.contact.phone?.country_code || null;
                    member.year_of_birth = findProfileData.year_of_birth || null;
                    member.gender = findProfileData.gender || null;
                    updated = true;
                }
            }
            if (updated) {
                await familyMemberUser.save();
            }
        }

        const updatedData = updateProfileData.toObject();
        const differences = {};
        const oldData = {};
        const newData = {};

        Object.keys(updatedData).forEach(key => {
            if (!_.isEqual(originalData[key], updatedData[key])) {
                differences[key] = true;
                oldData[key] = originalData[key];
                newData[key] = updatedData[key];
            }
        });

        const isAdminUpdate = !!args.data.id;
        const isAppPortal = args.data.isAppPortal === true;

        const platform = isAppPortal ? "app" : "web";
        const action = isAdminUpdate ? "UPDATE" : "PROFILE_UPDATE";

        const id = args.data.communityId;
        const community = await Communities.findOne({ _id: new ObjectId(id) });
        const member = community.members.find(
            (m) => m.member_id.toString() === logUser.toString()
        );
        const userRole = member.roles;
        await ActivityLogService.activityLogActiion({
            communityId: args.data.communityId,
            userId: logUser,
            module: "USER",
            action: action,
            platForm: platform,
            memberRole: userRole,
            oldData: oldData,
            newData: newData,
        })
        return ({ error: false, message: "userUpdateSuccess", data: updateProfileData });
        // } catch (error) {
        //     console.log(error);
        //     return { error: true, message: "User edit error found", ErrorClass: ErrorModules.GeneralApiError };
        // }

    },
    maskDob: async function (logUser, args) {
        try {
            const findLoginData = await User.findOne({ _id: logUser });
            if (findLoginData.date_of_birth.is_masked === false) {
                findLoginData.date_of_birth = {
                    is_masked: true
                }
            }
            else {
                findLoginData.date_of_birth = {
                    is_masked: true
                }
            }
            const updateMask = await findLoginData.save();
            return updateMask;
        } catch (error) {
            console.log(error);
            throw new ErrorModules.DatabaseError("User not found");
        }
    },
    searchUserByMobile: async function (args, userId) {
        try {
            const user = await User.findOne({
                "contact.phone.country_code": args.data.countryCode,
                "contact.phone.phone_code": args.data.phoneCode,
                "contact.phone.number": args.data.phone,
            });
            let isAFamilyMember = false;
            if (Lib.isEmpty(user)) {
                return { error: false, message: "noUserFound", ErrorClass: ErrorModules.Api404Error };
            }
            if (userId) {
                // Check if the user belong to the current logged in user family member
                const currentUser = await User.findOne({ _id: new ObjectId(userId), "family_members.user_id": user._id });
                if (currentUser) {
                    isAFamilyMember = true;
                }
            }
            return {
                data: {
                    user: Lib.generalizeUser(user.toJSON()),
                    isAFamilyMember: isAFamilyMember,
                    loggedUser: userId
                },
                message: "generalSuccess",
                error: false
            };
        } catch (error) {
            return { error: true, message: "internalServerError", ErrorClass: ErrorModules.FatalError, stack: error };
        }
    },
    userStatusChange: async function (userId) {
        const user = await User.findOne({
            _id: new ObjectId(userId)
        });
        if (Lib.isEmpty(user)) {
            return { error: true, message: "nouserFound", ErrorClass: ErrorModules.API404Error };
        }
        if (user.is_active == true) {
            user.is_active = false;
        } else {
            user.is_active = true;
        }

        await user.save();
        return { error: false, message: "generalSuccess" };
    },
    deleteUser: async function (id, adminId) {
        const DeleteObj = {
            "is_deleted": true
        }
        const admin = await User.findOne({ _id: adminId });
        const user = await User.findOne({ _id: id });
        if (user) {
            if (admin.user_type == 'admin') {
                let deleteUser = await User.findOneAndUpdate({ _id: new ObjectId(id) }, { "$set": DeleteObj });
                return ({ error: false, message: "generalSuccess", data: deleteUser });
            } else {
                throw new ErrorModules.DatabaseError("User does not have the permission to delete.");
            }
        } else {
            throw new ErrorModules.DatabaseError("No user found.");
        }

    },
    getUserByID: async function (id, user) {
        try {
            const user = await User.findOne({ is_deleted: false, _id: id });
            return ({ error: false, message: "generalSuccess", data: user });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("User find error");
        }
    },
    resetUserPassword: async function (id, adminId) {
        const admin = await User.findOne({ _id: adminId });
        const user = await User.findOne({ _id: id });
        if (user) {
            if (admin.user_type == 'admin') {
                const email = user.contact.email.address;

                let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
                let password = '';
                let length = 8;
                for (var i = length; i > 0; --i) password += chars[Math.floor(Math.random() * chars.length)];
                const hashPassword = crypto.createHash('sha256').update(password).digest('hex');
                user.password = hashPassword;
                let res = await user.save();

                // let subject = "Passord Reset";
                // let body = "<h1></h1><div><p>Email: <b>"+email+"</b></p><br><p>Password: <b>"+password+"</b> </p></div>"
                /**
                 * Send mail with link
                 * sendMail parameters 
                 * 1st param - Email
                 * 2nd param - Subject
                 * 3rd param - HTML Body
                 */
                // try{
                //     const mail = notificationServices.sendMail(email,subject,body);
                // }catch(error){
                //     console.log(error);
                //     throw new error;
                // }
                return ({ error: false, message: "passwordResetSuccess" });
            } else {
                throw new ErrorModules.DatabaseError("User does not have the permission to delete.");
            }
        } else {
            throw new ErrorModules.DatabaseError("No user found.");
        }

    },
    removeFamilyMember: async function (userId, familyMemberId) {
        try {
            const user = await User.findOne({ _id: new ObjectId(userId) }, { family_members: 1 });
            if (Lib.isEmpty(user)) {
                return { error: true, message: "noUserFound", ErrorClass: ErrorModules.Api404Error };
            }

            if (!user.family_members) {
                return { error: true, message: "noFamilyMemberFound", ErrorClass: ErrorModules.Api404Error };
            }
            let foundIndex;
            const familyMember = user.family_members.find((f, index) => {
                if ((f._id).toString() === familyMemberId) {
                    foundIndex = index;
                    return true;
                }
            });
            if (Lib.isEmpty(familyMember)) {
                return { error: true, message: "noFamilyMemberFound", ErrorClass: ErrorModules.Api404Error };
            }

            familyMember.is_deleted = true;
            // user.family_members[foundIndex] = familyMember;
            await user.save();

            const id = user.selected_community;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;
            // Call activity log
            await ActivityLogService.activityLogActiion({
                communityId: user.selected_community || null,
                userId: userId,
                module: "USER",
                action: "REMOVE_FAMILYMEMBER",
                platForm: "app",
                memberRole: userRole,
                oldData: null,
                newData: null
            });
            return Lib.resSuccess("familyMemberRemoveSuccess");
        } catch (e) {
            clog(e);
            return { error: true, message: "internalServerError", ErrorClass: ErrorModules.FatalError, stack: e };
        }
    },

    addToMyContact: async function (userId, contactId) {
        const loggedinUser = await User.findOne({ _id: new ObjectId(userId), is_deleted: false });
        if (Lib.isEmpty(loggedinUser)) {
            return { error: true, message: "userNotFound", ErrorClass: ErrorModules.API404Error };
        }
        // sote old data
        const oldData = loggedinUser.contacts ? JSON.parse(JSON.stringify(loggedinUser.contacts)) : [];

        let memberPayload = {
            contact_name: "",
            contact_image: "",
            contact_phone: "",
        }
        if (userId.toString() === contactId.toString()) {
            return { error: true, message: "Can't add yourself into your own contact." };
        }

        const memberUser = await User.findOne({ _id: new ObjectId(contactId), is_deleted: false });
        if (Lib.isEmpty(memberUser)) {
            // throw new ErrorModules.DatabaseError("Contact is not an user");
            return { error: true, message: "Contact is not an user", ErrorClass: ErrorModules.API404Error };
        }
        let contacts = loggedinUser.toJSON()['contacts'];
        if (!Lib.isEmpty(contacts)) {
            //Checking if the user is already a member or not
            let isMember = await contacts.find(member => member.user_id && member.user_id.toString() === contactId && !member.is_deleted);
            if (Lib.isEmpty(isMember)) {
                memberPayload.user_id = contactId;
            } else {
                // throw new ErrorModules.DatabaseError("This user is already in your contacts");
                return { error: true, message: "This user is already in your contacts", ErrorClass: ErrorModules.GeneralApiError };
            }
        } else {
            contacts = [];
            memberPayload.user_id = contactId;
        }

        memberPayload.contact_name = memberUser.name ? memberUser.name : '';
        memberPayload.contact_image = memberUser.profile_image ? memberUser.profile_image : '';
        memberPayload.contact_phone = memberUser.contact && memberUser.contact.phone && memberUser.contact.phone.number ? memberUser.contact.phone.number : '';
        contacts.push(memberPayload);
        loggedinUser.contacts = contacts;
        const res = await loggedinUser.save();
        // store new Data
        const newData = JSON.parse(JSON.stringify(loggedinUser.contacts));

        const id = loggedinUser.selected_community;
        const community = await Communities.findOne({ _id: new ObjectId(id) });
        const member = community.members.find(
            (m) => m.member_id.toString() === userId.toString()
        );
        const userRole = member.roles;

        await ActivityLogService.activityLogActiion({
            communityId: loggedinUser.selected_community || null,
            userId: userId,
            module: "CONTACT",
            action: "ADD",
            platForm: "app",
            memberRole: userRole,
            oldData: oldData,
            newData: newData
        })

        return ({ error: false, message: "addContactSuccessfully" });


    },

    removeMyContact: async function (userId, contactId) {
        const loggedinUser = await User.findOne({ _id: new ObjectId(userId), is_deleted: false });
        if (Lib.isEmpty(loggedinUser)) {
            return { error: true, message: "userNotFound", ErrorClass: ErrorModules.API404Error };
        }

        const memberUser = await User.findOne({ _id: new ObjectId(contactId), is_deleted: false });
        if (Lib.isEmpty(memberUser)) {
            return { error: true, message: "Contact is not an user", ErrorClass: ErrorModules.API404Error };
        }

        if (!Lib.isEmpty(loggedinUser.contacts)) {
            //Checking if the user is already a member or not
            let isMember = false;
            await loggedinUser.contacts.map(member => {
                if (member.user_id && member.user_id.toString() === contactId && !member.is_deleted) {
                    member.is_deleted = true;
                    isMember = true;
                }
            });

            if (!isMember) {
                return { error: true, message: "No contact found", ErrorClass: ErrorModules.API404Error };
            }
        } else {
            return { error: true, message: "No contacts found", ErrorClass: ErrorModules.API404Error };
        }
        const res = await loggedinUser.save();

        const id = loggedinUser.selected_community;
        const community = await Communities.findOne({ _id: new ObjectId(id) });
        const member = community.members.find(
            (m) => m.member_id.toString() === userId.toString()
        );
        const userRole = member.roles;

        // Call activity log
        await ActivityLogService.activityLogActiion({
            communityId: loggedinUser.selected_community || null,
            userId: userId,
            module: "CONTACT",
            action: "DELETE",
            platForm: "app",
            memberRole: userRole,
            oldData: null,
            newData: null
        });

        return ({ error: false, message: "removeContactSuccess" });
    },

    getContacts: async function (userId, search, page, filter, isFavourite, communityId, eventId, limit = 10) {
        let userContactMembers
        if (filter !== "community") {
            let sort;
            if (filter === "alphabetical") {
                sort = { "contacts.user.name": 1 };
            } else if (filter === "newest") {
                sort = { "contacts.created_at": -1 };
            } else if (filter === "revalphabetical") {
                sort = { "contacts.user.name": -1 };
            }
            const aggregation = [
                {
                    '$match': {
                        '_id': new ObjectId(userId)
                    }
                }, {
                    '$unwind': {
                        'path': '$contacts'
                    }
                }, {
                    '$match': {
                        'contacts.is_deleted': false
                    }
                }, {
                    '$lookup': {
                        'from': 'sr_users',
                        'localField': 'contacts.user_id',
                        'foreignField': '_id',
                        'as': 'contacts.user'
                    }
                }, {
                    '$unwind': {
                        'path': '$contacts.user'
                    }
                },
                {
                    '$project': {
                        'contacts': 1
                    }
                }
            ];
            if (search) {
                aggregation.push({
                    $match: {
                        $or: [
                            { "contacts.user.name": new RegExp(`.*${search.trim()}.*`, 'i') }
                        ]
                    }
                });
            }
            if (isFavourite) {
                aggregation.push({
                    $match: {
                        "contacts.is_favourite": true
                    }
                });
            }
            userContactMembers = await User.aggregate(aggregation).collation({ 'locale': 'en' }).sort(sort);
            if (!Lib.isEmpty(eventId)) {
                const event = await Events.findOne({
                    _id: ObjectId(eventId),
                    is_deleted: false,
                    is_active: true
                });
                let rsvpList = []
                if (!Lib.isEmpty(event)) {
                    event.rsvp.forEach(elem => {
                        rsvpList.push(elem.user_id.toString())
                    });
                }
                await Promise.all(userContactMembers.map(async elem => {
                    if (rsvpList.includes(elem.contacts.user_id.toString())) {
                        elem.is_joined_event = true;
                    } else {
                        elem.is_joined_event = false;
                    }
                }));
            }

        } else {
            if (Lib.isEmpty(communityId)) {
                return Lib.sendResponse({
                    error: true,
                    message: "fieldCommunityIdRequired",
                    ErrorClass: ErrorModules.ValidationError
                });
            }

            let aggregate = [
                {
                    '$match': {
                        '_id': new ObjectId(communityId),
                        'is_deleted': false,
                        'is_active': true
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
                            '$in': ["fan", "member", "executive_member", "board_member"]
                        }
                    }
                },
                {
                    '$project': {
                        'members.member_id': 1
                    }
                }
            ];
            let memberIds = []
            const communityMembers = await Communities.aggregate(aggregate);
            if (communityMembers.length === 0) {
                return { error: true, message: "noCommunityOrMemberFound", ErrorClass: ErrorModules.Api404Error };
            }
            await communityMembers.forEach(element => {
                memberIds.push(element.members.member_id);
            });


            const aggregation = [
                {
                    '$match': {
                        '_id': new ObjectId(userId)
                    }
                }, {
                    '$unwind': {
                        'path': '$contacts'
                    }
                }, {
                    '$match': {
                        'contacts.user_id': {
                            '$in': memberIds
                        },
                        'contacts.is_deleted': false
                    }
                }, {
                    '$lookup': {
                        'from': 'sr_users',
                        'localField': 'contacts.user_id',
                        'foreignField': '_id',
                        'as': 'contacts.user'
                    }
                }, {
                    '$unwind': {
                        'path': '$contacts.user'
                    }
                },
                {
                    '$project': {
                        'contacts': 1
                    }
                }
            ];
            if (search) {
                aggregation.push({
                    $match: {
                        $or: [
                            { "contacts.user.name": new RegExp(`.*${search.trim()}.*`, 'i') }
                        ]
                    }
                });
            }

            userContactMembers = await User.aggregate(aggregation).collation({ 'locale': 'en' }).sort({ "contacts.user.name": 1 });
        }

        // let pagination = null;
        // if (page && limit) {
        //     let skip = ((page - 1) * limit);
        //     // Get the total
        //     let totalContactMembers = 0;
        //     if(search) {
        //         const userContactMemberDetails = await User.aggregate(aggregation);
        //         totalContactMembers = userContactMemberDetails.length;
        //     } else {
        //         totalContactMembers = (await User.findOne( {_id: new ObjectId(userId)}, {contacts: 1})).contacts.length;
        //     }
        //     pagination = Lib.getPaginationInfo(totalContactMembers, page, limit);
        //     aggregation.push({$skip: skip}, {$limit: limit});
        // }

        await Promise.all(userContactMembers.map(async elem => {
            Lib.generalizeUser(elem.contacts.user);
        }));

        return {
            error: false, message: "generalSuccess", data: {
                contacts: userContactMembers,
                // pagination: pagination
            }
        }
    },

    getContactsMapList: async function (userId, search) {
        const aggregation = [
            {
                '$match': {
                    '_id': new ObjectId(userId)
                }
            }, {
                '$unwind': {
                    'path': '$contacts'
                }
            }, {
                '$match': {
                    'contacts.is_deleted': false
                }
            }, {
                '$lookup': {
                    'from': 'sr_users',
                    'localField': 'contacts.user_id',
                    'foreignField': '_id',
                    'as': 'contacts.user'
                }
            }, {
                '$unwind': {
                    'path': '$contacts.user'
                }
            },
            {
                '$project': {
                    'contacts': 1
                }
            }
        ];
        if (search) {
            aggregation.push({
                $match: {
                    $or: [
                        { "contacts.user.name": new RegExp(`.*${search.trim()}.*`, 'i') }
                    ]
                }
            });
        }
        let userContactMembers = await User.aggregate(aggregation);

        await Promise.all(userContactMembers.map(async elem => {
            Lib.generalizeUser(elem.contacts.user);
        }));

        return { error: false, message: "generalSuccess", data: { contacts: userContactMembers } };
    },

    getHomeDetails: async function (context, userId) {
        try {
            const userCommunity = await this.getUserCommunityDetails(context.getAuthUserInfo(), '');
            var gtDay = new Date();
            gtDay.setDate(gtDay.getDate());
            gtDay = gtDay.toISOString();
            let gteDay = new Date(gtDay);

            var ltDay = new Date();
            ltDay.setDate(ltDay.getDate() + 3);
            ltDay = ltDay.toISOString();
            let lteDay = new Date(ltDay);

            //Getting Non private events
            let nonPrivateEventAggregate = [
                {
                    '$match': {
                        is_deleted: false,
                        is_active: true,
                        invitation_type: { $in: ["Members", "Public"] }
                    }
                },
                {
                    '$match': {
                        'time.to': {
                            '$gte': gteDay,
                        }
                    }
                },
                {
                    '$unwind': {
                        path: '$rsvp'
                    }
                },
                {
                    '$match': {
                        "rsvp.user_id": new ObjectId(userId)
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
                    '$lookup': {
                        'from': 'sr_users',
                        'localField': 'host_id',
                        'foreignField': '_id',
                        'as': 'user'
                    }
                },
                {
                    '$unwind': {
                        'path': '$user'
                    },
                }
            ];

            nonPrivateEvent = await Events.aggregate(nonPrivateEventAggregate);

            await Promise.all(nonPrivateEvent.map(async elem => {
                let role = '';
                const userCommunity = await this.getUserCommunityDetails(context.getAuthUserInfo(), elem.community_id);
                if (!userCommunity.error) {
                    role = userCommunity.data.role;
                }
                elem.role = Lib.toTitleCase(role, '_', false, ' ');
                if (elem.rsvp.status === 'Attending') {
                    elem.is_joined = true;
                } else {
                    elem.is_joined = false;
                }
            }));

            //Getting private events
            let privateEventAggregate = [
                {
                    '$match': {
                        is_deleted: false,
                        is_active: true,
                        invitation_type: { $in: ["Private"] }
                    }
                },
                {
                    '$match': {
                        'time.to': {
                            '$gte': gteDay,
                        }
                    }
                },
                {
                    '$unwind': {
                        path: '$rsvp'
                    }
                },
                {
                    '$match': {
                        "rsvp.user_id": ObjectId(userId)
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
                    '$lookup': {
                        'from': 'sr_users',
                        'localField': 'host_id',
                        'foreignField': '_id',
                        'as': 'user'
                    }
                },
                {
                    '$unwind': {
                        'path': '$user'
                    },
                }
            ];

            privateEvent = await Events.aggregate(privateEventAggregate);

            await Promise.all(privateEvent.map(async elem => {
                let role = '';
                const userCommunity = await this.getUserCommunityDetails(context.getAuthUserInfo(), elem.community_id);
                if (!userCommunity.error) {
                    role = userCommunity.data.role;
                }
                elem.role = Lib.toTitleCase(role, '_', false, ' ');
                if (elem.rsvp.status === 'Attending') {
                    elem.is_joined = true;
                } else {
                    elem.is_joined = false;
                }
            }));

            let myCommunities = await Communities.aggregate([
                {
                    '$match': {
                        'is_active': true,
                        'is_deleted': false,
                        "members": {
                            $elemMatch: {
                                "member_id": new ObjectId(userId),
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
            let communityIds = []
            myCommunities.forEach(comm =>
                communityIds.push(comm._id)
            )

            const announcement = await Announcement.aggregate([
                {
                    '$match': {
                        is_deleted: false,
                        is_active: true,
                        community_id: { '$in': communityIds },
                        end_date: {
                            '$gte': gteDay,
                        }
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

            ]);

            //Selected community 
            const loggedinUser = await User.aggregate([
                {
                    '$match': {
                        "_id": new ObjectId(userId),
                        "is_deleted": false,
                        "is_active": true
                    }
                },
                {
                    '$lookup': {
                        'from': 'sr_communities',
                        'localField': 'selected_community',
                        'foreignField': '_id',
                        'as': 'community'
                    }
                },
                {
                    '$unwind': {
                        'path': '$community',
                        preserveNullAndEmptyArrays: true
                    },
                },

            ]);
            if (loggedinUser.length === 0) {
                return { error: true, message: "userNotFound", ErrorClass: ErrorModules.API404Error };
            }
            let selectedCommunity = "";
            if (loggedinUser[0].selected_community) {
                selectedCommunity = loggedinUser[0].community.community_name ? loggedinUser[0].community.community_name : "";
            }

            return ({
                error: false,
                message: "generalSuccess",
                data: {
                    selectedCommunity: selectedCommunity,
                    nonPrivateEvent: Lib.reconstructObjectKeys(nonPrivateEvent, ["rsvp_end_time", "to", "from"], Lib.convertIsoDate),
                    privateEvent: Lib.reconstructObjectKeys(privateEvent, ["rsvp_end_time", "to", "from"], Lib.convertIsoDate),
                    announcement: Lib.reconstructObjectKeys(announcement, "end_date", Lib.convertIsoDate)
                }
            });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Event find error");
        }
    },

    getAdminDashboardDetails: async function () {
        //User details
        const totalUser = await User.find({ "is_deleted": false }).count();
        const activelUser = await User.find({
            "is_deleted": false,
            "is_active": true
        }).count();
        const inactiveUser = await User.find({
            "is_deleted": false,
            "is_active": false
        }).count();
        const userArray = [totalUser, activelUser, inactiveUser];

        //Community Details
        const totalCommunities = await Communities.find({ "is_deleted": false }).count();
        const activelCommunities = await Communities.find({
            "is_deleted": false,
            "is_active": true
        }).count();
        const inactiveCommunities = await Communities.find({
            "is_deleted": false,
            "is_active": false
        }).count();
        const communitiesArray = [totalCommunities, activelCommunities, inactiveCommunities];

        //Group Details
        const totalGroup = await Group.find({ "is_deleted": false }).count();
        const activelGroup = await Group.find({
            "is_deleted": false,
            "is_active": true
        }).count();
        const inactiveGroup = await Group.find({
            "is_deleted": false,
            "is_active": false
        }).count();
        const groupsArray = [totalGroup, activelGroup, inactiveGroup];

        //Events Details
        const totalEvents = await Events.find({ "is_deleted": false }).count();
        const activelEvents = await Events.find({
            "is_deleted": false,
            "is_active": true
        }).count();
        const inactiveEvents = await Events.find({
            "is_deleted": false,
            "is_active": false
        }).count();
        const eventArray = [totalEvents, activelEvents, inactiveEvents];

        //Feedback Details
        const totalFeedback = await Feedback.find({ "is_deleted": false }).count();
        const activelFeedback = await Feedback.find({
            "is_deleted": false,
            "is_replied": true
        }).count();
        const inactiveFeedback = await Feedback.find({
            "is_deleted": false,
            "is_replied": false
        }).count();

        const feedbackArray = [totalFeedback, activelFeedback, inactiveFeedback];

        return ({
            error: false,
            message: "generalSuccess",
            data: {
                userData: userArray,
                communityData: communitiesArray,
                groupData: groupsArray,
                eventData: eventArray,
                messageData: feedbackArray
            }
        });
    },

    // getAllNotificationService: async function (user, params) {
    //     console.log(user.id, params,`line 80 service file`)
    //     let page;
    //     const limit = 10;
    //     let sortObject = {}

    //     if(params && params.page){
    //         page = parseInt(params.page);
    //     } else {
    //         page = 1;
    //     }
    //     const skip = (page - 1) * limit;
    //     let key="created_at";
    //     let sort = -1;
    //     if(params && params.sort){
    //         if(params.sort === 'asc'){
    //             sort = 1;
    //         }
    //     }

    //     sortObject[key] = sort;

    //     const notification = await NotificationLog.aggregate([
    //         {
    //             '$match':{
    //                 'user_id': new ObjectId(user.id),
    //                 'type':"Push"
    //             }
    //         },
    //     ]).collation({'locale':'en'}).sort(sortObject).skip(skip).limit(limit);
    //     // console.log(notification,`line 1508`)
    //     const total = await NotificationLog.find({user_id:new ObjectId(user.id),type:"Push",is_deleted: false}).count();
    //     if( notification.length === 0 ) {
    //         return ({error: true, message: "noAnnouncementFound", ErrorClass:ErrorModules.API404Error});
    //     }
    //     return ({
    //         error: false, 
    //         message: "generalSuccess",
    //         data:{
    //             total:total,  
    //             notifications: Lib.reconstructObjectKeys(notification, ["sent_at"], Lib.convertIsoDate)
    //         }
    //     });
    // },


    getAllNotificationService: async function (user, params) {
        let page;
        const limit = 10;
        let sortObject = {}

        if (params && params.page) {
            page = parseInt(params.page);
        } else {
            page = 1;
        }
        const skip = (page - 1) * limit;
        let key = "createdAt";
        let sort = -1;
        if (params && params.sort) {
            if (params.sort === 'asc') {
                sort = 1;
            }
        }

        sortObject[key] = sort;
        const aggregate = [
            {
                '$match': {
                    'user_id': new ObjectId(user.id),
                    'type': { $in: ["Push", "All"] }
                }
            },
        ]
        if (params.deviceType) {
            aggregate[0]['$match']['device_type'] = { $elemMatch: { $eq: params.deviceType } };
        }
        if (params.deviceType === 'web' && params.domains) {
            aggregate[0]['$match']['domains'] = { $elemMatch: { $eq: params.domains } };
        }
        if (params.type) { // Filter by type if provided
            aggregate[0]['$match']['type'] = params.type;
        }
        const notification = await NotificationLog.aggregate(aggregate).collation({ 'locale': 'en' }).sort(sortObject).skip(skip).limit(limit);


        // If domains is provided, include in matchQuery

        const total = await NotificationLog.find({ user_id: new ObjectId(user.id), type: { $in: ["Push", "All"] }, is_deleted: false }).count();
        if (notification.length === 0) {
            return ({ error: true, message: "noNotificationFound", ErrorClass: ErrorModules.API404Error });
        }
        return ({
            error: false,
            message: "generalSuccess",
            data: {
                total: total,
                notifications: Lib.reconstructObjectKeys(notification, ["sent_at"], Lib.convertIsoDate)
            }
        });
    },
    getAllNotificationsForDotComService: async function (userId, params) {
        try {
            let page = params && params.page ? parseInt(params.page) : 1;
            const limit = params.limit;
            const skip = (page - 1) * limit;
            const sort = params && params.sort === 'asc' ? 1 : -1;
            const sortObject = { createdAt: sort };

            const user = await User.findById(userId);

            if (!user) {
                return { error: true, message: 'User not found' };
            }

            const matchQuery = {
                type: { $in: ['Push'] },
                is_deleted: false,
                is_dotcom: true // Always filter notifications where is_dotcom is true
            };
            if (params.deviceType) {
                matchQuery.device_type = { $elemMatch: { $eq: params.deviceType } };
            }

            if (params.deviceType === 'web' && params.domains) {
                matchQuery.domains = { $elemMatch: { $eq: params.domains } };
            }

            if (params.type) {
                matchQuery.type = params.type;
            }

            const aggregate = [
                { $match: matchQuery },
                {
                    '$lookup': {
                        'from': 'sr_community_settings',
                        'localField': 'community_id',
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
            ];
            let notifications;
            // if(params.page && params.limit){
            //     notifications = await NotificationLog.aggregate(aggregate).sort(sortObject).skip(skip).limit(limit);
            // } else {
            //     notifications = await NotificationLog.aggregate(aggregate).sort(sortObject);
            // }
            //     const total = await NotificationLog.countDocuments(matchQuery);
            let total;

            if (params.page && params.limit) {
                notifications = await NotificationLog.aggregate(aggregate).sort(sortObject).skip(skip).limit(limit);
                total = await NotificationLog.countDocuments(matchQuery);
            } else {
                notifications = await NotificationLog.aggregate(aggregate).sort(sortObject);
                total = notifications.length;
            }

            const from = (page - 1) * limit + 1;
            const to = Math.min(from + limit - 1, total);
            return {
                error: false,
                message: 'Success',
                data: {
                    total,
                    from,
                    to,
                    notifications: notifications.map(notification => ({
                        id: notification._id.toString(),
                        subject: notification.subject,
                        image: notification.image,
                        text: notification.text,
                        type: notification.type,
                        sentAt: notification.sent_at.toISOString(),
                        deviceType: notification.device_type,
                        domains: notification.domains,
                        section: notification.section,
                        isViewed: notification.is_viewed ? true : false,
                        communityId: notification.community_id ? notification.community_id : null,
                        slug: notification.community_settings ? notification.community_settings.slug : null
                    }))
                }
            };
        } catch (error) {
            console.error('Error retrieving notifications:', error);
            return { error: true, message: 'Internal server error' };
        }
    },

    sendOtp: async function (userId, phone, phoneCode) {
        const user = await User.findOne({
            _id: new ObjectId(userId)
        });
        if (Lib.isEmpty(user)) {
            return { error: true, message: "nouserFound", ErrorClass: ErrorModules.API404Error };
        }

        if (user.contact.phone.number !== phone) {
            return { error: true, message: "pleaseEnterValidPhoneNo", ErrorClass: ErrorModules.GeneralApiError };
        }

        const otp = Lib.generateRandomNumber(100000, 999999);
        user.code = Lib.generateOtpToken(otp, Lib.getEnum("OTP_CAUSE._delete_user"));

        await user.save();
        // TODO send OTP SMS
        let to = phoneCode + phone;
        const payload = {
            recipient: {
                phone: to,
                user_id: user._id
            },
            template: {
                type: "SMS",
                slug: "SIGNIN",
                lang: "en"
            },
            contents: {
                TOKEN: otp,
                NAME: user.name
            }
        }
        //Sending SMS 
        await notificationServices.notifyService(payload);
        return { error: false, message: "otpSendSuccess" };
    },

    deleteOwnAccount: async function (userId) {
        try {
            const user = await User.findOne({
                _id: new ObjectId(userId)
            });
            if (Lib.isEmpty(user)) {
                return { error: true, message: "userNotFound", ErrorClass: ErrorModules.API404Error };
            }

            let myCommunities = await Communities.aggregate([
                {
                    '$match': {
                        "members": {
                            $elemMatch: {
                                "member_id": new ObjectId(user.id)
                            }
                        }
                    }
                }
            ]);
            let deletedCommunities = [];
            await Promise.all(myCommunities.map(async (community) => {
                //Remove member details from communtiy member list

                await Communities.update(
                    { '_id': new ObjectId(community._id) },
                    { $pull: { "members": { "member_id": new ObjectId(userId) } } }
                );

                if (community.owner_id.toString() === userId) {
                    const communityDetails = await Communities.findOne({
                        _id: new ObjectId(community._id)
                    });
                    //Get board member details
                    let boardMembers = await Communities.aggregate([
                        {
                            '$match': {
                                "_id": new ObjectId(community._id)
                            }
                        },
                        {
                            '$unwind': {
                                'path': '$members'
                            },
                        },
                        {
                            '$match': {
                                'members.roles': ["board_member"],
                                'members.is_approved': true,
                                'members.is_active': true,
                                'members.is_rejected': false,
                                'members.is_leaved': false,
                                'members.is_deleted': false
                            }
                        }

                    ]);

                    //Get executive member details
                    let executiveMembers = await Communities.aggregate([
                        {
                            '$match': {
                                "_id": new ObjectId(community._id)
                            }
                        },
                        {
                            '$unwind': {
                                'path': '$members'
                            },
                        },
                        {
                            '$match': {
                                'members.roles': ["executive_member"],
                                'members.is_approved': true,
                                'members.is_active': true,
                                'members.is_rejected': false,
                                'members.is_leaved': false,
                                'members.is_deleted': false
                            }
                        }

                    ]);

                    if (boardMembers.length > 0) {
                        //If other board member exist, promote to owner
                        communityDetails.owner_id = boardMembers[0].members.member_id;
                        communityDetails.save();
                    } else if (executiveMembers.length > 0) {
                        // If no board member make a executive member to owner and board member
                        communityDetails.owner_id = executiveMembers[0].members.member_id;
                        await Communities.updateOne({
                            "_id": new ObjectId(community._id),
                            'members.member_id': new ObjectId(executiveMembers[0].members.member_id)
                        }, {
                            '$set': {
                                'members.$.roles': ["board_member"]
                            }
                        });
                        communityDetails.save();
                    } else if (boardMembers.length === 0 && executiveMembers.length === 0) {
                        // If no board member and executive member exist then deleting the community
                        await Communities.deleteOne({
                            _id: new ObjectId(community._id)
                        });
                        deletedCommunities.push(new ObjectId(community._id));
                    }
                }
            }));

            //Delete group what this user created and belongs to the deleted community
            await Group.deleteMany({
                $or: [{
                    created_by: new ObjectId(userId)
                }, {
                    community_id: { $in: deletedCommunities }
                }]
            });

            //Delete Event what this user created and belongs to the deleted community
            await Events.deleteMany({
                $or: [{
                    host_id: new ObjectId(userId)
                }, {
                    community_id: { $in: deletedCommunities }
                }]
            });

            //Delete announcement what this user created and belongs to the deleted community
            await Announcement.deleteMany({
                $or: [{
                    user_id: new ObjectId(userId)
                }, {
                    community_id: { $in: deletedCommunities }
                }]
            });

            // Get Users which is under the deleted community
            const selectedCommunityUsers = await User.find({
                selected_community: { $in: deletedCommunities }
            });

            await Promise.all(selectedCommunityUsers.map(async (user) => {
                const cuserDetails = await User.findOne({ _id: new ObjectId(user._id) });
                cuserDetails.selected_community = null;
                cuserDetails.save();
            }));

            //Delete user details from group member
            await Group.update(
                { $pull: { "members": { "member_id": new ObjectId(userId) } } }
            );

            //Delete user details from other user's family member
            await User.update(
                { $pull: { "family_members": { "user_id": new ObjectId(userId) } } }
            );

            //Delete user
            await User.deleteOne({
                _id: new ObjectId(userId)
            });

            let usersLogpayload = {
                user_id: new ObjectId(userId),
                name: user.name,
                email: user.contact.email.address,
                phone: user.contact.phone.number
            }
            const usersLog = new UsersLog(usersLogpayload);
            let res = await usersLog.save();

            await ActivityLogService.activityLogActiion({
                communityId: null,
                userId: userId,
                module: "PROFILE",
                action: "DELETE_OWN_ACCOUNT",
                platForm: "app",
                oldData: null,
                newData: null
            })

            return { error: false, message: "userDeleteSuccess" };
        } catch (err) {
            console.log(err);
            return { error: true, message: "There is some error found.", ErrorClass: ErrorModules.GeneralApiError };
        }

    },

    isContact: async function (loggedId, userId) {
        const isContact = await User.findOne({
            _id: new ObjectId(loggedId),
            contacts:
            {
                $elemMatch:
                {
                    user_id: new ObjectId(userId),
                    is_deleted: false
                }
            }
        });

        return isContact ? true : false;
    },

    verifySecondaryPhone: async function (params, userId) {
        const phone = params.phone;
        const phoneCode = params.phoneCode;
        const user = await User.findOne({ _id: new ObjectId(userId), is_deleted: false });
        if (!user) {
            return { error: true, message: "userNotFound", ErrorClass: ErrorModules.API404Error };
        }
        if (user.contact.secondary_phone.number !== phone || user.contact.secondary_phone.phone_code !== phoneCode) {
            return { error: true, message: "pleaseEnterValidPhoneNo", ErrorClass: ErrorModules.GeneralApiError };
        }
        // const otp = Lib.generateRandomNumber(100000, 999999);
        const otp = 700091;
        const code = Lib.generateOtpToken(otp, Lib.getEnum("OTP_CAUSE._verification"));

        user.code = code;
        user.save();
        /**
          * Send SMS with OTP
        */
        const to = phoneCode + phone;
        const payload = {
            recipient:
            {
                phone: to,
                user_id: user._id
            },
            template: {
                type: "SMS",
                slug: "PHONEVERIFICATION",
                lang: "en"
            },
            contents: {
                OTP: otp,
                NAME: user.name
            }
        }
        //Sending SMS 
        await notificationServices.notifyService(payload);
        return {
            error: false,
            systemCode: "SUCCESS",
            code: 200,
            message: "otpSendSuccess",
        };
    },

    verifySecondaryPhoneOTP: async function (otp, userId) {
        const user = await User.findOne({ _id: new ObjectId(userId), is_deleted: false });
        if (!user) {
            return { error: true, message: "userNotFound", ErrorClass: ErrorModules.API404Error };
        }
        const code = user.code;
        if (!code) return { error: true, message: "notAllowed", ErrorClass: ErrorModules.GeneralApiError };
        const data = jwt.verify(code, Lib.ENV('GENERAL_SECRET_KEY'));
        if (data.otp === otp) {
            user.contact.secondary_phone.is_verified = true;
            user.contact.secondary_phone.verified_at = new Date();
            user.code = null;
            await user.save();
            return { error: false, systemCode: "SUCCESS", code: 200, message: "success" };
        }
        return ({ error: true, message: "wrongOTP" });
    },

    deleteSecondaryPhone: async function (userId) {
        const user = await User.findOne({ _id: new ObjectId(userId), is_deleted: false });
        if (!user) {
            return { error: true, message: "userNotFound", ErrorClass: ErrorModules.API404Error };
        }

        user.contact.secondary_phone.is_verified = null;
        user.contact.secondary_phone.verified_at = null;
        user.contact.secondary_phone.number = null;
        user.contact.secondary_phone.phone_code = null;
        user.contact.secondary_phone.country_code = null;
        await user.save();
        return { error: false, systemCode: "SUCCESS", code: 200, message: "success" };
    },

    verifyUserEmail: async function (email, userId) {
        const user = await User.findOne({ _id: new ObjectId(userId), is_deleted: false });
        if (!user) {
            throw new ErrorModules.Api404Error("userNotFound");
        }
        if (user.contact.email.is_verified) {
            return { error: true, message: "emailAlreadyApproved", ErrorClass: ErrorModules.GeneralApiError };
        }
        if (user.contact.email.address !== email) {
            return { error: true, message: "Provided E-mail doesn't match.", ErrorClass: ErrorModules.GeneralApiError };
        }
        // const token = Lib.generateRandomNumber(100000, 999999);
        const token = 700091;
        const code = Lib.generateOtpToken(token, Lib.getEnum("OTP_CAUSE._verification"));

        user.code = code;
        user.save();
        /**
          * Send mail with OTP
        */
        const payload = {
            recipient:
            {
                email: email,
                user_id: new ObjectId(userId)
            },
            template: {
                type: "Email",
                slug: "EMAILVERIFICATION",
                lang: "en"
            },
            contents: {
                OTP: token,
                EMAIL: email
            }
        }
        //Sending Email 
        await notificationServices.notifyService(payload);
        return {
            error: false,
            systemCode: "SUCCESS",
            code: 200,
            message: "success",
        };
    },

    verifyUserEmailOTP: async function (otp, userId) {
        const user = await User.findOne({ _id: new ObjectId(userId), is_deleted: false });
        if (!user) {
            throw new ErrorModules.Api404Error("userNotFound");
        }
        if (user.contact.email.is_verified) {
            return { error: true, message: "emailAlreadyApproved", ErrorClass: ErrorModules.GeneralApiError };
        }
        const code = user.code;
        if (!code) return { error: true, message: "notAllowed", ErrorClass: ErrorModules.GeneralApiError };
        const data = jwt.verify(code, Lib.ENV('GENERAL_SECRET_KEY'));
        if (data.otp === otp) {
            user.contact.email.is_verified = true;
            user.code = null;
            await user.save();
            return { error: false, systemCode: "SUCCESS", code: 200, message: "success" };
        }
        return ({ error: true, message: "wrongOTP" });

    },

    secondaryContactAsDefault: async function (userId) {
        const user = await User.findOne({ _id: new ObjectId(userId), is_deleted: false });
        if (!user) {
            throw new ErrorModules.Api404Error("userNotFound");
        }
        const contact = user.contact;
        if (contact.secondary_phone.number) {
            if (!contact.secondary_phone.is_verified) {
                return ({ error: true, message: "Secondary phone number needs to be verified." });
            }
            const existUser = await User.findOne({
                "contact.phone.number": contact.secondary_phone.number,
                "contact.phone.phone_code": contact.secondary_phone.phone_code,
                user_type: Lib.getEnum("USER_TYPE.user")
            });
            if (existUser) {
                return { error: true, message: "Phone no. already linked with another user.", ErrorClass: ErrorModules.ValidationError };
            }

            let phone = contact.phone.number;
            let phoneCode = contact.phone.phone_code;
            let countryCode = contact.phone.country_code;

            user.contact.phone.number = contact.secondary_phone.number;
            user.contact.phone.phone_code = contact.secondary_phone.phone_code;
            user.contact.phone.country_code = contact.secondary_phone.country_code;

            user.contact.secondary_phone.number = phone;
            user.contact.secondary_phone.phone_code = phoneCode;
            user.contact.secondary_phone.country_code = countryCode;

            await user.save();
        } else {
            return ({ error: true, message: "No secondary phone number found." });
        }
        return ({ error: false, message: "generalSuccess" });
    },

    editFamilyMember: async function (userId, params) {
        const member = await User.findOne({ '_id': ObjectId(userId) });
        if (!member || member.family_members.length === 0) {
            throw new ErrorModules.Api404Error("userNotFound");
        }
        await Promise.all(member.family_members.map(elem => {
            if (elem._id.toString() === params.id) {
                if (elem.age_of_minority !== 'spouse' && Lib.isEmpty(elem.user_id)) {
                    elem.age_of_minority = params.memberType ? params.memberType : elem.age_of_minority;
                    elem.relation_type = params.relationType ? params.relationType : elem.relation_type;
                    elem.member_name = `${params.firstName}${params.middleName ? ' ' + params.middleName : ''} ${params.lastName ? params.lastName : ''}`;
                    elem.year_of_birth = params.yearOfBirth ? params.yearOfBirth : elem.year_of_birth;
                    elem.email = params.email ? params.email : elem.email;
                    elem.first_address_line = params.address1 ? params.address1 : elem.first_address_line;
                    elem.second_address_line = params.address2 ? params.address2 : elem.second_address_line;
                    elem.country_code = params.countryCode ? params.countryCode : elem.country_code;
                    elem.phone_code = params.phoneCode ? params.phoneCode : elem.phone_code;
                    elem.zipcode = params.zipcode ? params.zipcode : elem.zipcode;
                    elem.city = params.city ? params.city : elem.city;
                    elem.state = params.state ? params.state : elem.state;
                    elem.country = params.country ? params.country : elem.country;
                    elem.phone = params.phone ? params.phone : elem.phone;
                    elem.gender = params.gender ? params.gender : elem.gender;
                    elem.member_image = params.memberImage ? params.memberImage : elem.member_image;
                } else {
                    elem.relation_type = params.relationType ? params.relationType : elem.relation_type;
                    elem.age_of_minority = params.memberType ? params.memberType : elem.age_of_minority;
                }
            }
        }));
        await member.save();
        return ({ error: false, message: "generalSuccess" });
    },

    adminUpdateFamilyMember: async function (userId, params) {
        const member = await User.findOne({ '_id': ObjectId(userId) });


        await Promise.all(member.family_members.map(elem => {
            if (elem._id.toString() === params.id) {
                if (elem.age_of_minority !== 'spouse' && Lib.isEmpty(elem.user_id)) {
                    elem.age_of_minority = params.memberType ? params.memberType : elem.age_of_minority;
                    elem.relation_type = params.relationType ? params.relationType : elem.relation_type;
                    elem.member_name = `${params.firstName}${params.middleName ? ' ' + params.middleName : ''} ${params.lastName ? params.lastName : ''}`;
                    elem.year_of_birth = params.yearOfBirth ? params.yearOfBirth : elem.year_of_birth;
                    elem.email = params.email ? params.email : elem.email;
                    elem.first_address_line = params.address1 ? params.address1 : elem.first_address_line;
                    elem.second_address_line = params.address2 ? params.address2 : elem.second_address_line;
                    elem.country_code = params.countryCode ? params.countryCode : elem.country_code;
                    elem.phone_code = params.phoneCode ? params.phoneCode : elem.phone_code;
                    elem.zipcode = params.zipcode ? params.zipcode : elem.zipcode;
                    elem.city = params.city ? params.city : elem.city;
                    elem.state = params.state ? params.state : elem.state;
                    elem.country = params.country ? params.country : elem.country;
                    elem.phone = params.phone ? params.phone : elem.phone;
                    elem.gender = params.gender ? params.gender : elem.gender;
                    elem.member_image = params.memberImage ? params.memberImage : elem.member_image;
                } else {
                    elem.relation_type = params.relationType ? params.relationType : elem.relation_type;
                    elem.age_of_minority = params.memberType ? params.memberType : elem.age_of_minority;
                }
            }
        }));
        await member.save();
        return ({ error: false, message: "generalSuccess" });
    },

    addOrRemoveFavouriteContact: async function (userId, params) {
        try {
            const contactId = params.userId;
            const isAdd = params.isAdd;
            await User.updateOne({
                '_id': ObjectId(userId),
                'is_deleted': false,
                'contacts.user_id': new ObjectId(contactId)
            }, { $set: { 'contacts.$[xxx].is_favourite': isAdd } },
                {
                    arrayFilters: [
                        { "xxx.user_id": new ObjectId(contactId) }
                    ]
                });

            const actionType = isAdd ? "ADDTOFAVOURITE" : "REMOVETOFAVOURITE";

            const id = loggedinUser.selected_community;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;
            // Call activity log
            await ActivityLogService.activityLogActiion({
                communityId: loggedinUser.selected_community || null,
                userId: userId,
                module: "CONTACT",
                action: actionType,
                platForm: "app",
                memberRole: userRole,
                oldData: null,
                newData: null
            });

            return ({ error: false, message: "generalSuccess" });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Contact adding error found.");
        }
    },

    bulkContactImport: async function (userId, communityId) {
        try {
            const loggedinUser = await User.findOne({ _id: new ObjectId(userId), is_deleted: false });
            if (Lib.isEmpty(loggedinUser)) {
                return { error: true, message: "userNotFound", ErrorClass: ErrorModules.API404Error };
            }

            const community = await Communities.findOne({
                _id: ObjectId(communityId),
                is_deleted: false,
                is_active: true
            });
            if (!community) {
                return ({ error: true, message: "Community not found", data: null });
            }

            const communityMemberIdstring = community.members.filter(member => !member.is_rejected && !member.is_leaved && !member.is_deleted && member.is_active && member.is_approved).map(member => member.member_id.toString());

            let contacts = loggedinUser.contacts;
            if (!Lib.isEmpty(communityMemberIdstring)) {
                await Promise.all(communityMemberIdstring.map(async member => {
                    if (userId !== member) {
                        const isContact = await this.isContact(userId, member);

                        if (!isContact) {
                            contacts.push({
                                user_id: ObjectId(member)
                            });
                        }
                    }
                }));
            }
            loggedinUser.contacts = contacts;
            await loggedinUser.save();

            return ({ error: false, message: "generalSuccess" });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Contact adding error found.");
        }
    },

    updateFutureLanguage: async function (data) {
        const { userId, isIndian, isEuropean, subLanguage } = data;

        try {
            // Find and update the user's future language preferences
            const user = await User.findOneAndUpdate(
                { _id: userId },
                {
                    $set: {
                        'future_language': {
                            is_indian: isIndian,
                            is_european: isEuropean,
                            sub_language: subLanguage
                        }
                    }
                },
                { new: true } // Return the updated document
            );

            // If the user does not exist, return an error response
            if (!user) {
                return {
                    error: true,
                    systemCode: 'ERROR_USER_NOT_FOUND',
                    code: 404,
                    message: 'User not found',
                    data: null
                };
            }

            // Return success response with the updated future language details
            return {
                error: false,
                systemCode: 'SUCCESS',
                code: 200,
                message: 'Future language updated successfully',
                data: {
                    userId: user._id,
                    isIndian: user.future_language.is_indian,
                    isEuropean: user.future_language.is_european,
                    subLanguage: user.future_language.sub_language
                }
            };
        } catch (error) {
            // Return error response if an exception occurs
            return {
                error: true,
                systemCode: 'ERROR_UPDATING_FUTURE_LANGUAGE',
                code: 500,
                message: error.message,
            };
        }
    },

    async getSubLanguage(data, context) {
        try {
            // Find the user by the provided ID
            const user = await User.findById(data.id, { future_language: 1 });

            if (!user) {
                return { error: true, message: "User not found" };
            }

            // Extract the subLanguage from the future_language field
            let subLanguage = null;
            if (user.future_language && user.future_language.length > 0) {
                subLanguage = user.future_language[0].sub_language;
            }

            // Construct the user data response
            const result = {
                id: user._id,
                subLanguage: subLanguage || null
            };

            return { error: false, message: "generalSuccess", data: result };
        } catch (error) {
            console.error(error);
            return { error: true, message: "internalServerError", stack: error };
        }
    },
}