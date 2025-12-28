const Events = Lib.Model('Events');
const EventSupplierManagement = Lib.Model('EventSupplierManagement');
const Communities = Lib.Model('Communities');
const User = Lib.Model('Users');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const ErrorModules = require('../errors');
const xlsx = require('xlsx');
const notificationServices = require('./notification.service');
const helperService = require('./helper.service');
const ActivityLogService = require("./activity_log.service")

module.exports = {
    //Query
    getAllEventSupplierManagement: async (data) => {
        const search = data.search;
        const page = data.page || 1;
        const limit = data.limit || 10;
        const communityId = data.communityId;
        const eventId = data.eventId;
        const userId = data.userId;
        const isDone = data.isDone;
        let sortObject = {};
        let key = "created_at";
        let sort = -1;
        if (data && data.columnName && data.sort) {
            if (data.columnName === 'SupplierName') {
                key = 'supply_item';
            } else if (data.columnName === 'DateSort') {
                key = 'required_date';
            }
            if (data.sort === 'asc') {
                sort = 1; //sort a to z
            } else if (data.sort === 'desc') {
                sort = -1; //sort z to a
            }
        }
        sortObject[key] = sort;

        const filter = { is_deleted: false };
        if (communityId) filter.community_id = ObjectId(communityId);
        if (eventId) filter.event_id = ObjectId(eventId);
        if (userId) filter['assigned_members.user_id'] = ObjectId(userId);
        if (search) filter.supply_item = new RegExp(search, 'i');
        if (isDone !== undefined) filter.is_done = isDone; // Filter by isDone status
        // Exclude tasks with status 'Accepted' or 'Rejected'
        // filter['assigned_members.status'] = { $nin: ['Accepted', 'Rejected'] };
        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: "sr_users",
                    localField: "assigned_members.user_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $lookup: {
                    from: "sr_events",
                    localField: "event_id",
                    foreignField: "_id",
                    as: "eventDetails"
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
                $addFields: {
                    communityName: { $arrayElemAt: ['$community.community_name', 0] }
                }
            },
            {
                $addFields: {
                    eventName: {
                        $arrayElemAt: ['$eventDetails.title', 0]
                    },
                    invitationType: {
                        $arrayElemAt: ['$eventDetails.invitation_type', 0]
                    }
                },
            },
            {
                $addFields: {
                    assignedMembers: {
                        $reduce: {
                            input: {
                                $map: {
                                    input: "$assigned_members",
                                    as: "member",
                                    in: {
                                        userId: "$$member.user_id",
                                        name: {
                                            $arrayElemAt: [
                                                "$userDetails.name",
                                                { $indexOfArray: ["$userDetails._id", "$$member.user_id"] }
                                            ]
                                        },
                                        type: "$$member.type",
                                        invitedBy: "$$member.invited_by",
                                        isDeleted: "$$member.is_deleted",
                                        status: "$$member.status",
                                        userQuantity: "$$member.user_quantity",
                                        profileImage: {
                                            $arrayElemAt: [
                                                "$userDetails.profile_image",
                                                { $indexOfArray: ["$userDetails._id", "$$member.user_id"] }
                                            ]
                                        }
                                    }
                                }
                            },
                            initialValue: [],
                            in: {
                                $cond: [
                                    {
                                        $in: ["$$this.userId", "$$value.userId"]
                                    },
                                    "$$value",
                                    { $concatArrays: ["$$value", ["$$this"]] }
                                ]
                            }
                        }
                    },
                    assignedMembersCount: {
                        $size: {
                            $reduce: {
                                input: {
                                    $map: {
                                        input: "$assigned_members",
                                        as: "member",
                                        in: "$$member.user_id"
                                    }
                                },
                                initialValue: [],
                                in: {
                                    $cond: [
                                        { $in: ["$$this", "$$value"] },
                                        "$$value",
                                        { $concatArrays: ["$$value", ["$$this"]] }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    community_id: 1,
                    communityName: 1,
                    invitationType: 1,
                    event_id: 1,
                    supply_item: 1,
                    quantity: 1,
                    already_taken: 1,
                    remainingQuantity: { $subtract: ["$quantity", "$already_taken"] },
                    eventName: 1,
                    is_done: 1,
                    supply_item_description: 1,
                    needed_for: 1,
                    required_date: 1,
                    time: 1,
                    volunteered: 1,
                    team_size: 1,
                    assignedMembers: 1,
                    assignedMembersCount: 1,
                    is_cancelled: 1,
                    created_at: 1
                }
            },
            { $sort: { created_at: -1 } }, // Sort by "created_at" in descending order
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];

        try {

            const orders = await EventSupplierManagement.aggregate(pipeline).collation({ 'locale': 'en' }).sort(sortObject);
            const total = await EventSupplierManagement.countDocuments(filter);
            const from = (page - 1) * limit + 1;
            const to = Math.min(page * limit, total);
            return {
                error: false,
                message: "generalSuccess",
                total: total,
                from: from,
                to: to,
                data: orders
            };
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_FETCHING_TASKS',
                message: error.message,
                data: null
            };
        }
    },
    getAllEventSupplierManagementForApp: async (authId, data) => {
        const search = data.search;
        const page = data.page || 1;
        const limit = data.limit || 10;
        const communityId = data.communityId;
        const eventId = data.eventId;
        const userId = data.userId;
        const isDone = data.isDone;
        let sortObject = {};
        let key = "created_at";
        let sort = -1;
        if (data && data.columnName && data.sort) {
            if (data.columnName === 'SupplierName') {
                key = 'supply_item';
            } else if (data.columnName === 'DateSort') {
                key = 'required_date';
            }
            if (data.sort === 'asc') {
                sort = 1; //sort a to z
            } else if (data.sort === 'desc') {
                sort = -1; //sort z to a
            }
        }
        sortObject[key] = sort;

        const filter = { is_deleted: false };
        if (communityId) filter.community_id = ObjectId(communityId);
        if (eventId) filter.event_id = ObjectId(eventId);
        if (userId) filter['assigned_members.user_id'] = ObjectId(userId);
        if (search) filter.supply_item = new RegExp(search, 'i');
        if (isDone !== undefined) filter.is_done = isDone; // Filter by isDone status
        // Exclude tasks with status 'Accepted' or 'Rejected'
        // filter['assigned_members.status'] = { $nin: ['Accepted', 'Rejected'] };
        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: "sr_users",
                    localField: "assigned_members.user_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $lookup: {
                    from: "sr_events",
                    localField: "event_id",
                    foreignField: "_id",
                    as: "eventDetails"
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
                $addFields: {
                    communityName: { $arrayElemAt: ['$community.community_name', 0] }
                }
            },
            {
                $addFields: {
                    eventName: {
                        $arrayElemAt: ['$eventDetails.title', 0]
                    },
                    invitationType: {
                        $arrayElemAt: ['$eventDetails.invitation_type', 0]
                    }
                },
            },
            {
                $addFields: {
                    assignedMembers: {
                        $map: {
                            input: "$assigned_members",
                            as: "member",
                            in: {
                                userId: "$$member.user_id",
                                name:
                                {
                                    $arrayElemAt: [
                                        "$userDetails.name",
                                        {
                                            $indexOfArray: ["$userDetails._id", "$$member.user_id"]
                                        }
                                    ]
                                }
                                ,
                                type: "$$member.type",
                                invitedBy: "$$member.invited_by",
                                isDeleted: "$$member.is_deleted",
                                status: "$$member.status",
                                userQuantity: "$$member.user_quantity",
                                profileImage:
                                {
                                    $arrayElemAt: [
                                        "$userDetails.profile_image",
                                        {
                                            $indexOfArray: ["$userDetails._id", "$$member.user_id"]
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    // Compute the count of assignedMembers
                    assignedMembersCount: { $size: "$assigned_members" }
                }
            },
            {
                $project: {
                    community_id: 1,
                    communityName: 1,
                    invitationType: 1,
                    event_id: 1,
                    supply_item: 1,
                    quantity: 1,
                    already_taken: 1,
                    remainingQuantity: { $subtract: ["$quantity", "$already_taken"] },
                    eventName: 1,
                    is_done: 1,
                    supply_item_description: 1,
                    needed_for: 1,
                    required_date: 1,
                    time: 1,
                    volunteered: 1,
                    team_size: 1,
                    assignedMembers: 1,
                    assignedMembersCount: 1,
                    is_cancelled: 1,
                    created_at: 1
                }
            },
            { $sort: { created_at: -1 } }, // Sort by "created_at" in descending order
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];

        try {

            const orders = await EventSupplierManagement.aggregate(pipeline).collation({ 'locale': 'en' }).sort(sortObject);
            const total = await EventSupplierManagement.countDocuments(filter);
            orders.forEach(supplier => {
                supplier.assignedMembers = supplier.assignedMembers.filter(member => member.userId.toString() === authId);
            });
            const from = (page - 1) * limit + 1;
            const to = Math.min(page * limit, total);
            return {
                error: false,
                message: "generalSuccess",
                total: total,
                from: from,
                to: to,
                data: orders
            };
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_FETCHING_TASKS',
                message: error.message,
                data: null
            };
        }
    },
    getEventSupplierById: async (data) => {
        try {
            const supplier = await EventSupplierManagement.findOne({
                _id: ObjectId(data.supplierId),
                is_deleted: false
            }).lean();  // Using .lean() to get a plain JS object for easy modification

            if (!supplier) {
                return {
                    error: true,
                    systemCode: "Supplier_NOT_FOUND",
                    code: 404,
                    message: "Supplier not found",
                    data: null
                };
            }

            // Reconstruct the response object
            const modifiedTask = {
                id: supplier._id.toString(),
                eventId: supplier.event_id.toString(),
                supplyItem: supplier.supply_item,
                quantity: supplier.quantity,
                supplyItemDescription: supplier.supply_item_description,
                neededFor: supplier.needed_for,
                priority: supplier.priority,
                assignedMembers: supplier.assigned_members,
                requiredDate: new Date(supplier.required_date).toISOString(),
                time: supplier.time,
                volunteered: supplier.volunteered,
                teamSize: supplier.team_size,
                isDone: supplier.is_deleted
            };

            return {
                error: false,
                systemCode: 'SUCCESS',
                code: 200,
                message: "Supplier details fetched successfully",
                data: modifiedTask
            };

        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_FETCHING_TASK',
                message: error.message,
                data: null
            };
        }
    },
    getSupplierStatusCounting: async function (data) {
        try {
            const eventId = data.eventId;
            const filter = { event_id: eventId, is_deleted: false };

            // Count open orders (future required_date)
            const openOrdersCount = await EventSupplierManagement.countDocuments({
                ...filter,
                required_date: { $gt: new Date() },
            });

            // Count closed orders (past required_date)

            // const closedOrdersCount = await EventSupplierManagement.countDocuments({
            //     ...filter,
            //     $or: [
            //         { required_date: { $lt: new Date() } },
            //         { is_done: true }
            //     ]
            // });

            // Count closed orders (past required_date)
            const closedOrdersCount = await EventSupplierManagement.countDocuments({
                ...filter,
                required_date: { $lt: new Date() },
            });

            // Count assigned orders (orders with assigned members)
            const assignedOrdersCount = await EventSupplierManagement.countDocuments({
                ...filter,
                'assigned_members.0': { $exists: true },
            });
            // Count closed orders (past required_date)
            const fulfilledOrdersCount = await EventSupplierManagement.countDocuments({
                ...filter,
                is_done: true,
            });

            return {
                error: false,
                systemCode: "SUCCESS",
                code: 200,
                message: "Counts fetched successfully",
                data: {
                    openOrders: openOrdersCount,
                    closedOrders: closedOrdersCount,
                    assignedOrders: assignedOrdersCount,
                    fulfilledOrders: fulfilledOrdersCount
                }
            };
        } catch (error) {
            return {
                error: true,
                systemCode: 'ERROR_FETCHING_SUPPLIER_COUNTS',
                message: error.message,
                data: null,
                code: 500
            };
        }
    },
    acceptOrRejectSupplierUserList: async function (data) {
        try {
            const { supplierId, page = 1, limit = 10, status } = data;

            // Check if the supplier exists
            const supplier = await EventSupplierManagement.findById(supplierId);
            if (!supplier) {
                return {
                    error: true,
                    systemCode: "TASK_NOT_FOUND",
                    code: 404,
                    message: "supplier not found",
                    data: null
                };
            }

            const pipeline = [
                {
                    $match: {
                        _id: ObjectId(supplierId),
                        is_deleted: false,
                    }
                },
                {
                    $unwind: "$assigned_members"
                },
                // Filter by status if status is provided
                ...(status ? [{
                    $match: {
                        "assigned_members.status": status
                    }
                }] : []),
                {
                    $lookup: {
                        from: `${Lib.ENV('DB_PREFIX')}users`,
                        localField: "assigned_members.user_id",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                {
                    $unwind: "$userDetails"
                },
                // Calculate age
                {
                    $addFields: {
                        age: {
                            $subtract: [new Date().getFullYear(), { $toInt: "$userDetails.year_of_birth" }]
                        }
                    }
                },
                // Categorize based on age
                {
                    $addFields: {
                        type: {
                            $switch: {
                                branches: [
                                    { case: { $lt: ["$age", 13] }, then: "children" },
                                    { case: { $and: [{ $gte: ["$age", 13] }, { $lt: ["$age", 18] }] }, then: "teenager" },
                                    { case: { $gte: ["$age", 18] }, then: "adult" }
                                ],
                                default: "unknown"
                            }
                        }
                    }
                },
                // Select the required fields
                {
                    $project: {
                        _id: "$userDetails._id",
                        name: "$userDetails.name",
                        number: "$userDetails.contact.phone.number",
                        age: 1,
                        type: 1,
                        status: "$assigned_members.status",
                        accepted_date: "$assigned_members.accepted_date",
                        accepted_time: "$assigned_members.accepted_time",
                    }
                },
                {
                    $skip: (page - 1) * limit
                },
                {
                    $limit: limit
                }
            ];

            const usersData = await EventSupplierManagement.aggregate(pipeline);
            return {
                error: false,
                systemCode: 'SUCCESS',
                code: 200,
                message: 'generalSuccess',
                data: usersData
            };
        } catch (error) {
            return {
                error: true,
                systemCode: 'ERROR_FETCHING_DATA',
                code: 500,
                message: error.message,
                data: null
            };
        }
    },
    getSupplierLogHistory: async function (data) {
        try {
            const { supplierId, page = 1, limit = 10, status } = data;
            const findSupplier = await EventSupplierManagement.findById(supplierId)
            if (!findSupplier) {
                return {
                    error: true,
                    systemCode: 'SUPPLIER_NOT_FOUND',
                    code: 404,
                    data: null
                }
            }
            const pipeline = [
                {
                    $match: {
                        _id: ObjectId(supplierId),
                        is_deleted: false,
                    }
                },
                {
                    $unwind: "$assigned_members"
                },
                // Filter by status if status is provided
                {
                    $match: status ? {
                        "assigned_members.status": status
                    } : {
                        "assigned_members.status": { $in: ["Accepted", "Rejected", "added by Admin"] }
                    }
                },
                {
                    $lookup: {
                        from: `${Lib.ENV('DB_PREFIX')}users`,
                        localField: "assigned_members.user_id",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                {
                    $unwind: "$userDetails"
                },
                // Calculate age
                {
                    $addFields: {
                        age: {
                            $subtract: [new Date().getFullYear(), { $toInt: "$userDetails.year_of_birth" }]
                        }
                    }
                },
                // Categorize based on age
                {
                    $addFields: {
                        type: {
                            $switch: {
                                branches: [
                                    { case: { $lt: ["$age", 13] }, then: "children" },
                                    { case: { $and: [{ $gte: ["$age", 13] }, { $lt: ["$age", 18] }] }, then: "teenager" },
                                    { case: { $gte: ["$age", 18] }, then: "adult" }
                                ],
                                default: "unknown"
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: "$assigned_members._id",
                        name: "$userDetails.name",
                        number: "$userDetails.contact.phone.number",
                        age: 1,
                        type: 1,
                        status: "$assigned_members.status",
                        userQuantity: "$assigned_members.user_quantity",
                        portal: "$assigned_members.portal",
                        acceptedDate: "$assigned_members.accepted_date",
                        acceptedTime: "$assigned_members.accepted_time",
                        isActive: "$assigned_members.is_active",
                    }
                },
                {
                    $skip: (page - 1) * limit
                },
                {
                    $limit: limit
                }
            ];
            const userData = await EventSupplierManagement.aggregate(pipeline);
            return {
                error: false,
                systemCode: "SUCCESS",
                code: 200,
                message: "genralSuccess",
                data: userData
            }
        } catch (error) {
            console.error("error from service:", error)
            return {
                error: true,
                systemCode: 'ERROR_FETCHING_DATA',
                code: 500,
                data: null
            }
        }
    },
    //Mutation
    createEventSupplierManagement: async (userName, data, userId) => {
        // Convert input dates to UTC
        const fromTimeDate = new Date(Date.parse(data.requiredDate));
        const toTimeDate = new Date(Date.parse(data.requiredDate));
        try {
            const community = await Communities.findOne({
                _id: ObjectId(data.communityId)
            });
            if (!community) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'COMUNITY_NOT_FOUND',
                    message: 'Community not found'
                };
            }
            // Check if SMS and email settings are enabled
            const { sms_settings, email_settings } = community.sms_email_global_settings;
            // const { sms_credits_remaining, email_credits_remaining } = community;
            const event = await Events.findOne({
                _id: ObjectId(data.eventId),
                is_deleted: false
            });

            if (!event) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'EVENT_NOT_FOUND',
                    message: 'Event not found'
                };
            }
            // Check if assignedMembers is an array
            if (!Array.isArray(data.assignedMembers)) {
                return {
                    error: true,
                    message: "assignedMembers should be an array",
                    code: 400,
                    systemCode: "INVALID_INPUT_FORMAT",
                    data: null
                };
            }
            // Count each member type in assignedMembers
            let memberTypeCounts = {
                adult: 0,
                teenager: 0,
                children: 0
            };

            data.assignedMembers.forEach(member => {
                if (member.type in memberTypeCounts) {
                    memberTypeCounts[member.type]++;
                }
            });

            // Check if any count from assignedMembers exceeds its corresponding count in teamSize
            for (let type in memberTypeCounts) {
                if (memberTypeCounts[type] > data.teamSize[type]) {
                    return {
                        error: true,
                        message: `Too many members of type ${type}. Maximum allowed is ${data.teamSize[type]}.`,
                        code: 400,
                        systemCode: "OVER_ASSIGNED_MEMBERS",
                        data: null
                    };
                }
            }
            // Extract unique user IDs from the assignedMembers
            const uniqueAssignedMembers = data.assignedMembers.filter((member, index, self) =>
                index === self.findIndex((m) => m.UserId === member.UserId)
            );

            // Construct the assignedMembersList
            const assignedMembersList = uniqueAssignedMembers.map(member => {
                return {
                    user_id: ObjectId(member.UserId),
                    type: member.type,
                    invited_by: userName
                };
            });
            const usersCount = uniqueAssignedMembers.length;
            const requiredDate = toTimeDate.toISOString();
            // Convert data.time.from and data.time.to to the desired format
            const toArray = data.time.to.split(":");
            const fromArray = data.time.from.split(":");

            toTimeDate.setUTCHours(toArray[0]);
            toTimeDate.setUTCMinutes(toArray[1]);

            fromTimeDate.setUTCHours(fromArray[0]);
            fromTimeDate.setUTCMinutes(fromArray[1]);

            // Validate that the task time is within the event time range
            if (fromTimeDate < event.created_at || toTimeDate > event.time.to) {
                return {
                    error: true,
                    message: "Task dates should be within the event date range.",
                    code: 400,
                    systemCode: "INVALID_TASK_DATES",
                    data: null
                };
            }
            const newEventOrder = new EventSupplierManagement({
                community_id: ObjectId(data.communityId),
                event_id: ObjectId(data.eventId),
                supply_item: data.supplyItem,
                quantity: data.quantity,
                supply_item_description: data.supplyItemDescription,
                needed_for: data.neededFor,
                required_date: requiredDate,
                time: {
                    from: fromTimeDate.toISOString(),
                    to: toTimeDate.toISOString(),
                    timezone: data.time.timezone
                },
                volunteered: data.volunteered,
                team_size: data.teamSize,
                assigned_members: assignedMembersList
            });
            await helperService.validateCreditsRemaining(community, usersCount, usersCount);
            const savedOrder = await newEventOrder.save();

            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            // call Activity log
            await ActivityLogService.activityLogActiion({
                communityId: savedOrder.community_id,
                userId: userId,
                module: "EVENT_SUPPLIER",
                action: "CREATE",
                platForm: "web",
                memberRole: userRole,
                oldData: null,
                newData: newEventOrder
            })
            const userAggregate = [
                {
                    $match: {
                        _id: { $in: uniqueAssignedMembers.map(member => mongoose.Types.ObjectId(member.UserId)) }
                    }
                },
                {
                    $project: {
                        name: "$name",
                        email: "$contact.email.address",
                        phone: "$contact.phone.number",
                        phoneCode: "$contact.phone.phone_code",
                        deviceDetails: "$device_details"
                    }
                }
            ];

            const users = await User.aggregate(userAggregate);
            await Promise.all(users.map(async (user) => {
                const userId = user._id;
                const userName = user.name;
                const userEmail = user.email;
                const userPhone = user.phone;
                const userphoneCode = user.phoneCode;
                const deviceDetails = user.deviceDetails;

                let to = userphoneCode + userPhone;

                // Fetching user device token 
                let webToken = [];
                if (deviceDetails) {
                    webToken = deviceDetails.filter(device => device.is_active === true).map(device => device.web_token).filter(token => token !== null && token !== undefined);
                    fcmToken = deviceDetails.filter(device => device.is_active === true).map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                    webToken = [...webToken, ...fcmToken];
                }
                const smspayload = {
                    recipient:
                    {
                        phone: to,
                    },
                    template: {
                        type: "SMS",
                        slug: "SUPPLIERSMS",
                        lang: "en"
                    },
                    contents: {
                        SUPPLIERNAME: data.supplyItem,
                        MEMBERNAME: userName,
                        EVENTNAME: event.title,
                        ORGNAME: community.community_name
                    }
                }
                const emailpayload = {
                    recipient:
                    {
                        email: userEmail
                    },
                    template: {
                        type: "Email",
                        slug: "SUPPLIEREMAIL",
                        lang: "en"
                    },
                    contents: {
                        SUPPLIERNAME: data.supplyItem,
                        MEMBERNAME: userName,
                        EVENTNAME: event.title,
                        ORGNAME: community.community_name
                    }
                }
                const payload = {
                    recipient:
                    {
                        user_id: userId,
                        fcmToken: webToken
                    },
                    template: {
                        type: "Push",
                        slug: "new-supplier",
                        lang: "en"
                    },
                    contents: {
                        USERNAME: userName,
                        SUPPLIERITEM: data.supplyItem,
                        EVENTNAME: event.title
                    },
                }
                // Send notifications based on community settings
                if (sms_settings) {
                    // Send SMS
                    await notificationServices.notifyService(smspayload);
                }
                if (email_settings) {
                    // Send Email
                    await notificationServices.notifyService(emailpayload);
                }
                await notificationServices.notifyService(payload);
            }));
            // Deduct credits based on the number of users processed
            if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining >= usersCount) {
                community.sms_credits_remaining -= usersCount;
                await community.save();
            }

            if (community.sms_email_global_settings.email_settings && community.email_credits_remaining >= usersCount) {
                community.email_credits_remaining -= usersCount;
                await community.save();
            }

            return {
                error: false,
                message: "Supply item added successfully",
                data: savedOrder
            };

        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_CREATING_EVENT_TASK',
                message: error.message
            };
        }
    },
    updateEventSupplierManagement: async (id, params, context, communityId) => {
        const community = await Communities.findOne({ _id: new ObjectId(communityId) });
        if (!community) {
            throw new ErrorModules.Api404Error("noCommunityFound");
        }
        // Check if SMS and email settings are enabled
        const { sms_settings, email_settings } = community.sms_email_global_settings;
        // const { sms_credits_remaining, email_credits_remaining } = community;
        // Convert input dates to UTC
        const fromTimeDate = new Date(Date.parse(params.requiredDate));
        const toTimeDate = new Date(Date.parse(params.requiredDate));
        try {
            const eventOrder = await EventSupplierManagement.findOne({ _id: id, is_deleted: false });
            if (!eventOrder) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'EVENT_TASK_NOT_FOUND',
                    message: 'Event task not found'
                };
            }
            // store old data
            const oldData = eventOrder.toObject();

            const event = await Events.findOne({
                _id: ObjectId(params.eventId),
                is_deleted: false
            });

            if (!event) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'EVENT_NOT_FOUND',
                    message: 'Event not found'
                };
            }
            // Convert data.time.from and data.time.to to the desired format
            // if (params.time) {
            const toArray = params.time.to.split(":");
            const fromArray = params.time.from.split(":");

            toTimeDate.setUTCHours(toArray[0]);
            toTimeDate.setUTCMinutes(toArray[1]);

            fromTimeDate.setUTCHours(fromArray[0]);
            fromTimeDate.setUTCMinutes(fromArray[1]);
            // }
            // Validate that the task time is within the event time range
            if (fromTimeDate < event.created_at || toTimeDate > event.time.to) {
                return {
                    error: true,
                    message: "Supplier dates should be within the event date range.",
                    code: 400,
                    systemCode: "INVALID_TASK_DATES",
                    data: null
                };
            }
            // Validate if already_taken exceeds quantity
            if (params.alreadyTaken !== undefined && params.alreadyTaken > eventOrder.quantity) {
                return {
                    error: true,
                    code: 400,
                    systemCode: 'QUANTITY_EXCEEDED',
                    message: 'Already taken quantity cannot exceed the total quantity.'
                };
            }
            eventOrder.supply_item = params.supplyItem ? params.supplyItem : eventOrder.supply_item;
            eventOrder.quantity = params.quantity ? params.quantity : eventOrder.quantity;
            // eventOrder.already_taken = params.alreadyTaken !== undefined ? params.alreadyTaken : eventOrder.already_taken;
            eventOrder.supply_item_description = params.supplyItemDescription ? params.supplyItemDescription : eventOrder.supply_item_description;
            eventOrder.needed_for = params.neededFor ? params.neededFor : eventOrder.needed_for;
            eventOrder.volunteered = params.volunteered ? params.volunteered : eventOrder.volunteered;
            eventOrder.required_date = params.requiredDate ? new Date(Date.parse(params.requiredDate)) : eventOrder.required_date;
            // Handle assignedMembers
            // if (Array.isArray(params.assignedMembers) && params.assignedMembers.length > 0) {
            if (Array.isArray(params.assignedMembers)) {
                // Count each member type in assignedMembers
                let memberTypeCounts = {
                    adult: 0,
                    teenager: 0,
                    children: 0
                };

                params.assignedMembers.forEach(member => {
                    if (member.type in memberTypeCounts) {
                        memberTypeCounts[member.type]++;
                    }
                });

                // Check if any count from assignedMembers exceeds its corresponding count in teamSize
                for (let type in memberTypeCounts) {
                    if (params.teamSize && memberTypeCounts[type] > params.teamSize[type]) {
                        return {
                            error: true,
                            message: `Too many members of type ${type}. Maximum allowed is ${params.teamSize[type]}.`,
                            code: 400,
                            systemCode: "OVER_ASSIGNED_MEMBERS",
                            data: null
                        };
                    }
                }
                const existingUserIds = eventOrder.assigned_members.map(member => member.user_id.toString());
                const newUsers = params.assignedMembers.filter(member => !existingUserIds.includes(member.UserId));
                const usersCount = newUsers.length;
                const newUsersContactInfo = await User.aggregate([
                    {
                        $match: {
                            _id: { $in: newUsers.map(member => mongoose.Types.ObjectId(member.UserId)) }
                        }
                    },
                    {
                        $project: {
                            name: "$name",
                            email: "$contact.email.address",
                            phone: "$contact.phone.number",
                            phoneCode: "$contact.phone.phone_code",
                            deviceDetails: "$device_details"
                        }
                    }
                ]);
                // const uniqueAssignedMembers = params.assignedMembers.filter((member, index, self) =>
                //     index === self.findIndex((m) => m.UserId === member.UserId)
                // );

                // const assignedMembersList = uniqueAssignedMembers.map(member => ({
                //     user_id: ObjectId(member.UserId),
                //     type: member.type,
                //     invited_by: member.invitedBy || context.user.name, // Assuming context has the username
                // }));

                // eventOrder.assigned_members = assignedMembersList;
                // Add only new users to assigned_members, keep existing ones intact
                // Create a Set of existing user IDs for quick lookup
                const existingUserIdsSet = new Set(eventOrder.assigned_members.map(m => m.user_id.toString()));

                // Filter only new members
                const newAssignedMembers = params.assignedMembers
                    .filter(member => !existingUserIdsSet.has(member.UserId))
                    .map(member => ({
                        user_id: ObjectId(member.UserId),
                        type: member.type,
                        invited_by: member.invitedBy || context.user.name
                    }));

                // Append new members without altering the existing array
                eventOrder.assigned_members.push(...newAssignedMembers);

                await helperService.validateCreditsRemaining(community, usersCount, usersCount);
                // Send SMS and email notifications to new users
                await Promise.all(newUsersContactInfo.map(async (user) => {
                    const userId = user._id;
                    const userName = user.name;
                    const userEmail = user.email;
                    const userPhone = user.phone;
                    const userphoneCode = user.phoneCode;
                    const deviceDetails = user.deviceDetails;

                    let to = userphoneCode + userPhone;

                    // Fetching user device token 
                    let webToken = [];
                    if (deviceDetails) {
                        webToken = deviceDetails.filter(device => device.is_active === true).map(device => device.web_token).filter(token => token !== null && token !== undefined);
                        fcmToken = deviceDetails.filter(device => device.is_active === true).map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                        webToken = [...webToken, ...fcmToken];
                    }
                    // Construct SMS and email payloads
                    const smspayload = {
                        recipient: { phone: to },
                        template: {
                            type: "SMS",
                            slug: "SUPPLIERSMS",
                            lang: "en"
                        },
                        contents: {
                            SUPPLIERNAME: eventOrder.supply_item,
                            MEMBERNAME: userName,
                            EVENTNAME: event.title,
                            ORGNAME: community.community_name
                        }
                    };

                    const emailpayload = {
                        recipient: { email: userEmail },
                        template: {
                            type: "Email",
                            slug: "SUPPLIEREMAIL",
                            lang: "en"
                        },
                        contents: {
                            SUPPLIERNAME: eventOrder.supply_item,
                            MEMBERNAME: userName,
                            EVENTNAME: event.title,
                            ORGNAME: community.community_name
                        }
                    };
                    const payload = {
                        recipient:
                        {
                            user_id: userId,
                            fcmToken: webToken,
                        },
                        template: {
                            type: "Push",
                            slug: "new-supplier",
                            lang: "en"
                        },
                        contents: {
                            USERNAME: userName,
                            SUPPLIERITEM: eventOrder.supply_item,
                            EVENTNAME: event.title
                        },
                    }
                    if (sms_settings) {
                        // Send SMS
                        await notificationServices.notifyService(smspayload);
                    }
                    if (email_settings) {
                        // Send Email
                        await notificationServices.notifyService(emailpayload);
                    }
                    await notificationServices.notifyService(payload);
                }));
                // Deduct credits based on the number of users processed
                if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining >= usersCount) {
                    community.sms_credits_remaining -= usersCount;
                    await community.save();
                }

                if (community.sms_email_global_settings.email_settings && community.email_credits_remaining >= usersCount) {
                    community.email_credits_remaining -= usersCount;
                    await community.save();
                }

            }
            // // Set is_done to true if volunteered is equal to quantity
            // if (eventOrder.already_taken === eventOrder.quantity) {
            //     eventOrder.is_done = true;
            // }
            // Handle teamSize
            if (params.teamSize) {
                eventOrder.team_size.adult = params.teamSize.adult;
                eventOrder.team_size.teenager = params.teamSize.teenager;
                eventOrder.team_size.children = params.teamSize.children;
            }
            // Handle the time field
            if (params.time) {
                eventOrder.time = {
                    from: fromTimeDate.toISOString(),
                    to: toTimeDate.toISOString(),
                };
            }
            const updateEventSupplier = await eventOrder.save();
            // store new data
            const newData = updateEventSupplier.toObject();

            const changes = {};
            const getChangedFields = (oldObj, newObj, prefix = "") => {
                Object.keys(newObj).forEach(key => {
                    if (typeof newObj[key] === "object" && newObj[key] !== null && !Array.isArray(newObj[key])) {
                        getChangedFields(oldObj[key] || {}, newObj[key], `${prefix}${key}.`);
                    } else if (JSON.stringify(oldObj?.[key]) !== JSON.stringify(newObj[key])) {
                        changes[`${prefix}${key}`] = {
                            old: oldObj?.[key],
                            new: newObj[key]
                        };
                    }
                });
            };
            getChangedFields(oldData, newData);

            const userId = context.user.id;
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            // call activity log
            if (Object.keys(changes).length > 0) {
                await ActivityLogService.activityLogActiion({
                    communityId: communityId,
                    userId: userId,
                    module: "EVENT_SUPPLIER",
                    action: "UPDATE",
                    oldData: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.old])),
                    newData: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.new])),
                    platForm: "web",
                    memberRole: userRole
                });
            }

            return ({ error: false, message: "eventUpdateSuccess", data: updateEventSupplier });
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_CREATING_EVENT_TASK',
                message: error.message
            };
        }
    },
    updateEventSupplierManagementQuantity: async (id, params, context, communityId, userId) => {
        const community = await Communities.findOne({ _id: new ObjectId(communityId) });
        if (!community) {
            throw new ErrorModules.Api404Error("noCommunityFound");
        }
        try {
            const eventOrder = await EventSupplierManagement.findOne({ _id: id, is_deleted: false });
            if (!eventOrder) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'EVENT_SUPPLIER_NOT_FOUND',
                    message: 'Event Supplier not found'
                };
            }
            // Check if the user is already assigned to this task
            const alreadyAssigned = eventOrder.assigned_members.find(member => member.user_id.toString() === userId);
            // Retrieve user's age from the database
            const currentTime = new Date();
            const timeString = currentTime.toISOString().split('T')[1].split('.')[0];
            // if (alreadyAssigned) {
            //     // Update user quantity and timestamps
            //     alreadyAssigned.user_quantity = params.userQuantity,
            //     alreadyAssigned.accepted_date = currentTime;
            //     alreadyAssigned.accepted_time = timeString;
            //     eventOrder.already_taken += params.userQuantity;

            //      // Validate if already_taken exceeds quantity
            // if (eventOrder.already_taken > eventOrder.quantity) {
            //     return {
            //         error: true,
            //         code: 400,
            //         systemCode: 'QUANTITY_EXCEEDED',
            //         message: 'Quantity exceeded.'
            //     };
            // }

            //     if (eventOrder.already_taken === eventOrder.quantity) {
            //         eventOrder.is_done = true;
            //     }
            //     const updatedEvent = await eventOrder.save();
            //     return {
            //         error: false,
            //         message: "eventUpdateSuccess",
            //         params: updatedEvent
            //     };
            // }
            const user = await User.findById(userId);
            if (!user) {
                return {
                    success: false,
                    message: "User not found."
                };
            }

            // Calculate user's age
            const birthYear = parseInt(user.year_of_birth);
            const age = new Date().getFullYear() - birthYear;

            // Determine type based on age
            let userType;
            if (age < 13) {
                userType = "children";
            } else if (age < 18) {
                userType = "teenager";
            } else {
                userType = "adult";
            }
            // Count current number of team members for each type
            let adultCount = 0;
            let teenagerCount = 0;
            let childrenCount = 0;
            eventOrder.assigned_members.forEach(member => {
                if (member.type === "adult") {
                    adultCount++;
                } else if (member.type === "teenager") {
                    teenagerCount++;
                } else if (member.type === "children") {
                    childrenCount++;
                }
            });

            // Check if adding this member exceeds the team size limit
            // if (userType === "adult" && adultCount >= eventOrder.team_size.adult) {
            //     return {
            //         success: false,
            //         message: "The team size limit for adults has been reached for this Supplier."
            //     };
            // }
            // if (userType === "teenager" && teenagerCount >= eventOrder.team_size.teenager) {
            //     return {
            //         success: false,
            //         message: "The team size limit for teenagers has been reached for this Supplier."
            //     };
            // }
            // if (userType === "children" && childrenCount >= eventOrder.team_size.children) {
            //     return {
            //         success: false,
            //         message: "The team size limit for children has been reached for this Supplier."
            //     };
            // }
            // Add the user to assigned_members array with calculated type
            eventOrder.assigned_members.push({
                user_id: userId,
                type: userType,
                status: "added by Admin",
                user_quantity: params.userQuantity,
                portal: "web",
                accepted_date: currentTime,
                accepted_time: timeString
            });
            // Update already_taken
            eventOrder.already_taken += params.userQuantity;
            // Validate if already_taken exceeds quantity
            if (eventOrder.already_taken > eventOrder.quantity) {
                return {
                    error: true,
                    code: 400,
                    systemCode: 'QUANTITY_EXCEEDED',
                    message: 'Quantity exceeded.'
                };
            }
            // eventOrder.already_taken = params.alreadyTaken !== undefined ? params.alreadyTaken : eventOrder.already_taken;
            // Set is_done to true if volunteered is equal to quantity
            if (eventOrder.already_taken === eventOrder.quantity) {
                eventOrder.is_done = true;
            }
            const updateEventSupplier = await eventOrder.save();

            const newData = {
                supplier_name: eventOrder.supply_item,
                quantity: params.userQuantity
            }

            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: communityId,
                userId: userId,
                module: "EVENT_SUPPLIER",
                action: "UPDATE_QUANTITY",
                platForm: "web",
                oldData: null,
                newData: newData,
                memberRole: userRole
            })
            return ({ error: false, message: "Submitted quantity added successfully", params: updateEventSupplier });
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_CREATING_EVENT_TASK',
                message: error.message
            };
        }
    },
    deleteEventSupplierManagement: async function (data, userId) {
        try {
            const EventSupplierObj = {
                "is_deleted": true
            }
            const eventSupplier = await EventSupplierManagement.findOne({ _id: data.EventSupplierId });
            let updateEventSupplier = await EventSupplierManagement.findOneAndUpdate({ _id: ObjectId(data.EventSupplierId) }, { "$set": EventSupplierObj });

            const newData = {
                supplier_name: updateEventSupplier.supply_item
            }

            const id = updateEventSupplier.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;
            // Call activity log
            await ActivityLogService.activityLogActiion({
                communityId: updateEventSupplier.community_id,
                userId: userId,
                module: "EVENT_SUPPLIER",
                action: "DELETE",
                platForm: "web",
                oldData: null,
                newData: newData,
                memberRole: userRole
            });
            return ({ error: false, message: "Supply item deleted successfully", data: updateEventSupplier });

        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Event find error");
        }
    },
    assignSupplierMembers: async function (data, logInUser) {
        const { supplierId, UserId, type } = data;
        try {
            const supplier = await EventSupplierManagement.findById(supplierId);

            if (!supplier) {
                return {
                    error: true,
                    message: "Order not found",
                    code: 404,
                    systemCode: "ORDER_NOT_FOUND",
                    data: null
                };
            }

            const memberExists = supplier.assigned_members.find(member => member.user_id.toString() === UserId);

            if (memberExists) {
                return {
                    error: true,
                    message: "Member already assigned to this supplier Mnagement",
                    code: 409,
                    systemCode: "MEMBER_ALREADY_ASSIGNED",
                    data: null
                };
            }

            // Validate against teamSize limit
            const currentCount = supplier.assigned_members.filter(member => member.type === type).length;
            const maxAllowed = supplier.team_size?.[type] || 0;

            if (currentCount + 1 > maxAllowed) {
                return {
                    error: true,
                    message: `Too many members of type ${type}. Maximum allowed is ${maxAllowed}.`,
                    code: 400,
                    systemCode: "OVER_ASSIGNED_MEMBERS",
                    data: null
                };
            }

            // Verify the user has RSVP status 'Attending' for the event
            const event = await Events.findById(supplier.event_id);
            if (!event) {
                return {
                    error: true,
                    message: "Event not found for the Supplier management",
                    code: 404,
                    systemCode: "Supplier_NOT_FOUND",
                    data: null
                };
            }

            const oldAssignMember = [...supplier.assigned_members];

            // --- Fetch user info for all old members ---
            const oldMemberUserIds = oldAssignMember.map(m => m.user_id);
            const oldMemberUsers = await User.find(
                { _id: { $in: oldMemberUserIds } },
                { name: 1, "contact.email.address": 1 }
            );

            // Map user names into oldData for logging
            const oldData = {
                assigned_members: oldAssignMember.map(member => {
                    const user = oldMemberUsers.find(u => u._id.toString() === member.user_id.toString());
                    return {
                        user_id: member.user_id,
                        supplier_name: supplier.supply_item,
                        name: user ? user.name : "Unknown",
                        email: user?.contact?.email?.address || null,
                        type: member.type
                    };
                })
            };

            const assignedUser = await User.findOne(
                { _id: UserId },
                { name: 1, "contact.email.address": 1 }
            );

            const userRsvp = event.rsvp.find(r => r.user_id.toString() === UserId);
            // if (!userRsvp || userRsvp.status !== 'Attending') {
            //     return {
            //         error: true,
            //         message: "User hasn't RSVP'd with 'Attending' status",
            //         code: 403,
            //         systemCode: "USER_NOT_ATTENDING",
            //         data: null
            //     };
            // }

            supplier.assigned_members.push({ user_id: UserId, type });
            await supplier.save();

            const allMemberUserIds = supplier.assigned_members.map(m => m.user_id);
            const allUsers = await User.find(
                { _id: { $in: allMemberUserIds } },
                { name: 1, "contact.email.address": 1 }
            );

            const newData = {
                assigned_members: supplier.assigned_members.map(member => {
                    const user = allUsers.find(u => u._id.toString() === member.user_id.toString());
                    return {
                        user_id: member.user_id,
                        supplier_name: supplier.supply_item,
                        name: user ? user.name : "Unknown",
                        email: user?.contact?.email?.address || "N/A",
                        type: member.type
                    };
                }),
                newly_assigned: {
                    user_id: UserId,
                    supplier_name: supplier.supply_item,
                    name: assignedUser ? assignedUser.name : "Unknown",
                    email: assignedUser?.contact?.email?.address || "N/A",
                    type
                }
            };

            const id = supplier.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === logInUser.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: supplier.community_id,
                userId: logInUser,
                module: "EVENT_SUPPLIER",
                action: "ASSIGNMEMBER",
                platForm: "web",
                memberRole: userRole,
                oldData: oldData,
                newData: newData
            })

            return {
                error: false,
                message: "Member assigned successfully",
                code: 200,
                systemCode: "SUCCESS",
                data: { id: UserId }
            };

        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_CREATING_Members',
                message: error.message
            };
        }
    },
    deleteAssignSupplierMembers: async function (data) {
        const { UserId, supplierId } = data;

        try {
            const updatedSupplier = await EventSupplierManagement.updateOne(
                { _id: supplierId },
                {
                    $pull: { assigned_members: { user_id: UserId } }
                }
            );

            if (updatedSupplier.nModified === 0) {
                return {
                    error: true,
                    systemCode: "MEMBER_NOT_FOUND",
                    code: 404,
                    message: "Assigned member not found or not removed"
                };
            }

            const user = await User.findOne(
                { _id: UserId },
                { name: 1, "contact.email.address": 1 }
            );

            const newData = {
                supplier_name: {
                    supplier_name: updatedSupplier.supply_item
                },
                deleted_User: {
                    user_id: UserId,
                    name: user ? user.name : "Unknown",
                    email: user?.contact?.email?.address || "N/A"
                }
            }

            const id = updatedSupplier.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === logInUser.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: updatedSupplier.community_id,
                userId: logInUser,
                module: "EVENT_SUPPLIER",
                action: "DELETE_ASSIGN_MEMBER",
                platForm: "web",
                memberRole: userRole,
                oldData: null,
                newData: newData
            })

            return {
                error: false,
                systemCode: "SUCCESS",
                code: 200,
                message: "Assigned member deleted successfully"
            };
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_DELETING_MEMBER',
                message: error.message
            };
        }
    },

    //For App End 
    acceptOrRejectSupplierManagement: async (userId, data) => {
        try {
            // Fetch the specific supplier management by its ID.
            const supplierManagement = await EventSupplierManagement.findOne({
                _id: ObjectId(data.supplierId),
                is_deleted: false
            });

            // Check if the supplier management exists.
            if (!supplierManagement) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'SUPPLIER_MANAGEMENT_NOT_FOUND',
                    message: 'Supplier management not found'
                };
            }

            // Ensure that users can't accept or reject after the required_date.
            if (new Date() > new Date(supplierManagement.required_date)) {
                return {
                    error: true,
                    code: 400,
                    systemCode: 'TIME_EXPIRED',
                    message: 'Cannot accept or reject after the deadline.'
                };
            }

            // Locate the user in the assigned_members list.
            const memberIndex = supplierManagement.assigned_members.findIndex(member =>
                member.user_id.toString() === userId
            );

            if (memberIndex === -1) {
                return {
                    error: true,
                    code: 403,
                    systemCode: 'USER_NOT_IN_ASSIGNED_MEMBERS',
                    message: 'User is not in the assigned members list'
                };
            }

            // Prevent changing status after already setting to "Accepted" or "Rejected".
            const currentStatus = supplierManagement.assigned_members[memberIndex].status;
            if (currentStatus === "Accepted" || currentStatus === "Rejected") {
                return {
                    error: true,
                    code: 403,
                    systemCode: 'STATUS_ALREADY_SET',
                    message: `User has already ${currentStatus}. Cannot modify status further.`
                };
            }

            // Update the user's status.
            if (data.status === "Accepted" && supplierManagement.assigned_members[memberIndex].status !== "Accepted") {
                supplierManagement.assigned_members[memberIndex].user_quantity = data.userQuantity;
                supplierManagement.already_taken += data.userQuantity;
            }

            supplierManagement.assigned_members[memberIndex].status = data.status;
            supplierManagement.assigned_members[memberIndex].portal = "app";
            if (supplierManagement.already_taken > supplierManagement.quantity) {
                return {
                    error: true,
                    code: 400,
                    systemCode: 'QUANTITY_EXCEEDED',
                    message: 'Quantity exceeded.'
                };
            }

            // Set the accepted_date and accepted_time only when the status is "Accepted" or "Rejected"
            if (data.status === "Accepted" || data.status === "Rejected") {
                const now = new Date();
                const timeString = now.toISOString().split('T')[1].split('.')[0];

                supplierManagement.assigned_members[memberIndex].accepted_date = now;
                supplierManagement.assigned_members[memberIndex].accepted_time = timeString;
            }
            // Check if quantity and already_taken are equal, set is_done to true.
            if (supplierManagement.quantity === supplierManagement.already_taken) {
                supplierManagement.is_done = true;
            }

            // Save the updated supplier management to the database.
            await supplierManagement.save();

            const newData = {
                Supplier_Name: supplierManagement.supply_item,
                quantity: data.user_quantity
            }

            const id = supplierManagement.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: supplierManagement.community_id,
                userId: userId,
                module: "EVENT_SUPPLIER",
                action: data.status.toUpperCase(),
                platForm: "app",
                memberRole: userRole,
                oldData: null,
                newData: newData
            })

            // For the purpose of the response, convert the saved supplier management to the desired response format.
            // const responseSupplierManagement = {
            //     id: supplierManagement._id.toString(),
            //     eventId: supplierManagement.event_id.toString(),
            //     supplyItem: supplierManagement.supply_item,
            //     quantity: supplierManagement.quantity,
            //     supplyItemDescription: supplierManagement.supply_item_description,
            //     neededFor: supplierManagement.needed_for,
            //     requiredDate: supplierManagement.required_date.toISOString(),
            //     volunteered: supplierManagement.volunteered,
            // };

            return {
                error: false,
                code: 200,
                systemCode: 'SUCCESS',
                message: `Supplier status updated to ${data.status}.`
            };

        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_UPDATING_SUPPLIER_MANAGEMENT',
                message: error.message,
                data: null
            };
        }
    },
    generateExcelSupplierList: async function (eventId, userId) {
        try {
            const pipeline = [
                {
                    '$match': {
                        'is_deleted': false,
                        'event_id': mongoose.Types.ObjectId(eventId)
                    }
                },
                {
                    $lookup: {
                        from: "sr_users",
                        localField: "assigned_members.user_id",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                {
                    $lookup: {
                        from: "sr_events",
                        localField: "event_id",
                        foreignField: "_id",
                        as: "eventDetails"
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
                    $addFields: {
                        communityName: { $arrayElemAt: ['$community.community_name', 0] }
                    }
                },
                {
                    $addFields: {
                        eventName: {
                            $arrayElemAt: ['$eventDetails.title', 0]
                        }
                    },
                },
                {
                    $addFields: {
                        assignedMembers: {
                            $map: {
                                input: "$assigned_members",
                                as: "member",
                                in: {
                                    userId: "$$member.user_id",
                                    name: {
                                        $arrayElemAt: [
                                            "$userDetails.name",
                                            { $indexOfArray: ["$userDetails._id", "$$member.user_id"] }
                                        ]
                                    },
                                    type: "$$member.type",
                                    invitedBy: "$$member.invited_by",
                                    isDeleted: "$$member.is_deleted",
                                    status: "$$member.status",
                                    profileImage: {
                                        $arrayElemAt: [
                                            "$userDetails.profile_image",
                                            { $indexOfArray: ["$userDetails._id", "$$member.user_id"] }
                                        ]
                                    },
                                    acceptedDate: "$$member.accepted_date",
                                    isActive: "$$member.is_active",
                                    userQuantity: "$$member.user_quantity",
                                    portal: "$$member.portal"
                                }
                            }
                        },
                        assignedMembersCount: { $size: "$assigned_members" }
                    }
                },
                {
                    $project: {
                        community_id: 1,
                        communityName: 1,
                        event_id: 1,
                        supply_item: 1,
                        quantity: 1,
                        already_taken: 1,
                        remainingQuantity: { $subtract: ["$quantity", "$already_taken"] },
                        eventName: 1,
                        is_done: 1,
                        supply_item_description: 1,
                        needed_for: 1,
                        required_date: 1,
                        time: 1,
                        volunteered: 1,
                        team_size: 1,
                        assignedMembers: 1,
                        assignedMembersCount: 1,
                        created_at: 1
                    }
                },
                {
                    $sort: { created_at: -1 }
                }
            ];

            const orders = await EventSupplierManagement.aggregate(pipeline);

            const communityId = orders.length > 0 ? orders[0].community_id : null;

            // ----------------- Sheet 1 -------------------
            const mainTable = [['Sl.No', 'Supply Item', 'Quantity', 'Needed for', 'Required within', 'Assigned Members', 'Already Volunteered', 'History']];

            for (let i = 0; i < orders.length; i++) {
                const app = orders[i];
                const formattedDate = new Date(app.required_date).toLocaleDateString();
                const assignedMembersInfo = app.assignedMembers.map(member => ({
                    name: member.name,
                    type: member.type,
                    status: member.status
                }));

                const history = assignedMembersInfo.map(member => {
                    if (["Accepted", "Rejected"].includes(member.status)) {
                        return `${member.name} (${member.type}) - ${member.status}`;
                    }
                    return null;
                }).filter(Boolean).join(', ');

                const value = [
                    i + 1,
                    app.supply_item,
                    app.quantity,
                    app.needed_for,
                    formattedDate,
                    assignedMembersInfo.map(member => `${member.name} (${member.type})`).join(', '),
                    app.already_taken,
                    history
                ];
                mainTable.push(value);
            }

            const wb = xlsx.utils.book_new();
            const ws1 = xlsx.utils.aoa_to_sheet(mainTable);
            xlsx.utils.book_append_sheet(wb, ws1, 'Event Supplier Management');

            // ----------------- Sheet 2 -------------------
            const assignedTable = [['Sl.No', "Supplier Name", "Event Name", "Community Name", "User Name", "Quantity Provided", "Active Status", "Status", "Accepted Date", "Access Platform"]];
            let slNo = 1;

            for (let i = 0; i < orders.length; i++) {
                const app = orders[i];
                const assignedMembersInfo = app.assignedMembers.filter(member => member.status);

                for (const member of assignedMembersInfo) {
                    const formattedDate = member.acceptedDate ? new Date(member.acceptedDate).toLocaleDateString() : '';
                    assignedTable.push([
                        slNo++,
                        app.supply_item || '',
                        app.eventName || '',
                        app.communityName || '',
                        member.name || '',
                        member.userQuantity || 0,
                        member.isActive ? 'Active' : 'Inactive',
                        member.status || '',
                        formattedDate,
                        member.portal || ''
                    ]);
                }
            }

            const ws2 = xlsx.utils.aoa_to_sheet(assignedTable);
            xlsx.utils.book_append_sheet(wb, ws2, 'Assigned Members');

            // ------------- Export as base64 buffer --------------
            const wopts = { bookType: 'xlsx', bookSST: false, type: 'base64' };
            const buffer = xlsx.write(wb, wopts);

            const community = await Communities.findOne({ _id: new ObjectId(communityId) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: communityId,
                userId: userId,
                module: "EVENT_SUPPLIER",
                action: "EXPORT",
                platForm: "web",
                memberRole: userRole,
                oldData: null,
                newData: null
            })

            return buffer;
        } catch (error) {
            throw error;
        }
    },
    generateExcelSupplierLogList: async function (supplierId, userId) {
        try {
            const pipeline = [
                {
                    '$match': {
                        'is_deleted': false,
                        '_id': mongoose.Types.ObjectId(supplierId)
                    }
                },
                {
                    $lookup: {
                        from: "sr_users",
                        localField: "assigned_members.user_id",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                {
                    $lookup: {
                        from: "sr_events",
                        localField: "event_id",
                        foreignField: "_id",
                        as: "eventDetails"
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
                    $addFields: {
                        communityName: { $arrayElemAt: ['$community.community_name', 0] }
                    }
                },
                {
                    $addFields: {
                        eventName: {
                            $arrayElemAt: ['$eventDetails.title', 0]
                        }
                    },
                },
                {
                    $addFields: {
                        assignedMembers: {
                            $map: {
                                input: "$assigned_members",
                                as: "member",
                                in: {
                                    userId: "$$member.user_id",
                                    name:
                                    {
                                        $arrayElemAt: [
                                            "$userDetails.name",
                                            {
                                                $indexOfArray: ["$userDetails._id", "$$member.user_id"]
                                            }
                                        ]
                                    }
                                    ,
                                    type: "$$member.type",
                                    invitedBy: "$$member.invited_by",
                                    isDeleted: "$$member.is_deleted",
                                    isActive: "$$member.is_active",
                                    status: "$$member.status",
                                    userQuantity: "$$member.user_quantity",
                                    portal: "$$member.portal",
                                    acceptedDate: "$$member.accepted_date",
                                    profileImage:
                                    {
                                        $arrayElemAt: [
                                            "$userDetails.profile_image",
                                            {
                                                $indexOfArray: ["$userDetails._id", "$$member.user_id"]
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        // Compute the count of assignedMembers
                        assignedMembersCount: { $size: "$assigned_members" }
                    }
                },
                {
                    $project: {
                        community_id: 1,
                        communityName: 1,
                        event_id: 1,
                        supply_item: 1,
                        quantity: 1,
                        already_taken: 1,
                        remainingQuantity: { $subtract: ["$quantity", "$already_taken"] },
                        eventName: 1,
                        is_done: 1,
                        supply_item_description: 1,
                        needed_for: 1,
                        required_date: 1,
                        time: 1,
                        volunteered: 1,
                        team_size: 1,
                        assignedMembers: 1,
                        assignedMembersCount: 1,
                        created_at: 1
                    }
                },
            ];
            const orders = await EventSupplierManagement.aggregate(pipeline);
            const communityId = orders.length > 0 ? orders[0].community_id : null;

            const table = [['Sl.No', "Supplier Name", "Event Name", "Community Name", "User Name", "Quantity Provided", "Active Status", "Status", "Accepted Date", "Access Platform"]];
            let slNo = 1;

            for (let i = 0; i < orders.length; i++) {
                const app = orders[i];
                // Extracting information from assignedMembers array
                const assignedMembersInfo = app.assignedMembers.filter(member => member.status);

                for (const member of assignedMembersInfo) {
                    const formattedDate = new Date(member.acceptedDate).toLocaleDateString();
                    const value = [
                        slNo++,
                        app.supply_item || '',
                        app.eventName || '',
                        app.communityName || '',
                        member.name || '',
                        member.userQuantity || 0,
                        member.isActive ? 'Active' : 'Inactive',
                        member.status || '',
                        formattedDate,
                        member.portal || ''
                    ];
                    table.push(value);
                }
            }

            const wb = xlsx.utils.book_new();
            const ws = xlsx.utils.aoa_to_sheet(table);
            xlsx.utils.book_append_sheet(wb, ws, 'Event Supplier Management');

            // write options
            const wopts = { bookType: 'xlsx', bookSST: false, type: 'base64' };
            const buffer = xlsx.write(wb, wopts);

            const newData = {
                supplier_name: orders.supply_item
            }

            const community = await Communities.findOne({ _id: new ObjectId(communityId) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            // Call Activity log
            await ActivityLogService.activityLogActiion({
                communityId: communityId,
                userId: userId,
                module: "EVENT_SUPPLIER_LOG",
                action: "EXPORT",
                platForm: "web",
                memberRole: userRole,
                oldData: null,
                newData: newData
            })

            return buffer;
        } catch (error) {
            throw error;
        }
    },
    selfVolunteerSupplier: async function (userId, data) {
        try {
            const { supplierId, alreadyTaken } = data;

            // Find the event task by ID
            const eventSupplier = await EventSupplierManagement.findById(supplierId);
            if (!eventSupplier) {
                return {
                    success: false,
                    message: "Event Supplier not found."
                };
            }
            // Check if the user is already assigned to this task
            const alreadyAssigned = eventSupplier.assigned_members.find(member => member.user_id.toString() === userId);
            if (alreadyAssigned) {
                return {
                    success: false,
                    message: "You are already assigned to this Supplier.",
                    code: 409,
                    systemCode: "YOU_ALREADY_ASSIGNED",
                    data: null
                };
            }

            // Retrieve user's age from the database
            const user = await User.findById(userId);
            if (!user) {
                return {
                    success: false,
                    message: "User not found."
                };
            }

            // Calculate user's age
            const birthYear = parseInt(user.year_of_birth);
            const age = new Date().getFullYear() - birthYear;

            // Determine type based on age
            let userType;
            if (age < 13) {
                userType = "children";
            } else if (age < 18) {
                userType = "teenager";
            } else {
                userType = "adult";
            }
            // Count current number of team members for each type
            let adultCount = 0;
            let teenagerCount = 0;
            let childrenCount = 0;
            eventSupplier.assigned_members.forEach(member => {
                if (member.type === "adult") {
                    adultCount++;
                } else if (member.type === "teenager") {
                    teenagerCount++;
                } else if (member.type === "children") {
                    childrenCount++;
                }
            });

            // Check if adding this member exceeds the team size limit
            if (userType === "adult" && adultCount >= eventSupplier.team_size.adult) {
                return {
                    success: false,
                    message: "The team size limit for adults has been reached for this Supplier."
                };
            }
            if (userType === "teenager" && teenagerCount >= eventSupplier.team_size.teenager) {
                return {
                    success: false,
                    message: "The team size limit for teenagers has been reached for this Supplier."
                };
            }
            if (userType === "children" && childrenCount >= eventSupplier.team_size.children) {
                return {
                    success: false,
                    message: "The team size limit for children has been reached for this Supplier."
                };
            }
            const currentTime = new Date();
            const timeString = currentTime.toISOString().split('T')[1].split('.')[0];
            // Add the user to assigned_members array with calculated type
            eventSupplier.assigned_members.push({
                user_id: userId,
                type: userType,
                status: "Accepted",
                user_quantity: data.userQuantity,
                portal: "app",
                accepted_date: currentTime,
                accepted_time: timeString
            });
            // Update already_taken
            eventSupplier.already_taken += data.userQuantity;
            // Check if alreadyTaken exceeds quantity
            if (eventSupplier.already_taken > eventSupplier.quantity) {
                return {
                    error: true,
                    code: 400,
                    systemCode: 'QUANTITY_EXCEEDED',
                    message: 'Quantity exceeded.'
                };
            }
            // Save the updated event task
            await eventSupplier.save();

            const newData = {
                supplier_name: eventSupplier.supply_item,
                quantity: data.userQuantity
            }

            const id = eventSupplier.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: eventSupplier.community_id,
                userId: userId,
                module: "EVENT_SUPPLIER",
                action: "SELF_VOLUNTEER",
                platForm: "app",
                memberRole: userRole,
                oldData: null,
                newData: newData
            })
            return {
                success: true,
                message: "You have successfully self-volunteered for this Supplier."
            };
        } catch (error) {
            console.error("Error in selfVolunteer service:", error);
            return {
                success: false,
                message: "An error occurred while self-volunteering for this Supplier."
            };
        }
    },
    adminQuantityStatusChange: async function (data, logInUser) {
        try {
            const supplierId = data.supplierId;
            const Id = data.id;
            const isActive = data.isActive;
            const supplier = await EventSupplierManagement.findOne({
                _id: ObjectId(supplierId),
                is_deleted: false,
            });
            if (!supplier) {
                throw new Error("Suppier not found.")
            }
            const quantityId = supplier.assigned_members.find(
                m => m._id.equals(Id)
            );
            if (!quantityId) {
                throw new Error("Id not found")
            }
            if (quantityId.status !== "added by Admin") {
                throw new Error("Cannot update member. Status is not 'added by Admin'.");
            }

            let userQuantity = quantityId.user_quantity || 0;
            let alreadyTaken = supplier.already_taken || 0;

            if (!isActive && quantityId.is_active) {
                // deactivating -> subtract from already_taken
                alreadyTaken -= userQuantity;
            }

            // update Active value
            await EventSupplierManagement.updateOne({
                _id: ObjectId(supplierId),
                "assigned_members._id": ObjectId(Id)
            },
                {
                    $set: {
                        "assigned_members.$.is_active": isActive,
                        "already_taken": alreadyTaken,
                        "is_done": false
                    }
                }
            );

            const oldData = {
                supplier_name: supplier.supply_item,
                quantity: userQuantity

            }

            const id = supplier.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === logInUser.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: supplier.community_id,
                userId: logInUser,
                module: "EVENT_SUPPLIER",
                action: "LOG_STATUS_CHANGE",
                platForm: "web",
                memberRole: userRole,
                oldData: oldData,
                newData: null
            })
            return {
                error: false,
                code: 200,
                systemCode: 'SUCCESS',
                message: `status updated Successfull.`
            }
        } catch (err) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_CHANGE_STATUS',
                message: err.message,
                data: null
            };
        }
    }
}