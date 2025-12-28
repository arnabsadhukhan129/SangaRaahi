const Events = Lib.Model('Events');
const EventTask = Lib.Model('EventTask');
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

function convertToISOFormat(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
}
module.exports = {
    //Qurey....
    // getAllEventTasks: async (data) => {
    //     const search = data.search;
    //     const page = data.page || 1;
    //     const limit = data.limit || 10;
    //     const eventId = data.eventId

    //     const filter = { is_deleted: false };
    //     if (eventId) filter.event_id = eventId;
    //     if (search) filter.task_name = new RegExp(search, 'i'); // Simple text search on taskName

    //     try {
    //         const tasks = await EventTask.find(filter).skip((page - 1) * limit).limit(limit);
    //         const total = await EventTask.countDocuments(filter);

    //         return {
    //             error: false,
    //             message: "generalSuccess",
    //             total: total,
    //             data: tasks
    //         };
    //     } catch (error) {
    //         return {
    //             error: true,
    //             code: 500,
    //             systemCode: 'ERROR_FETCHING_TASKS',
    //             message: error.message,
    //             data: null
    //         };
    //     }
    // },

    getAllEventTasks: async (data) => {
        const search = data.search;
        const page = data.page || 1;
        const limit = data.limit || 10;
        const communityId = data.communityId;
        const eventId = data.eventId;
        const userId = data.userId;
        const status = data.status;
        const priority = data.priority;
        const isDone = data.isDone;
        const taskDeadline = data.taskDeadline;
        let sortObject = {};
        let key = "created_at";
        let sort = -1;
        if (data && data.columnName && data.sort) {
            if (data.columnName === 'TaskName') {
                key = 'task_name';
            } else if (data.columnName === 'DateSort') {
                key = 'task_deadline';
            }
            if (data.sort === 'asc') {
                sort = 1; // sort a to z
            } else if (data.sort === 'desc') {
                sort = -1;  //sort z to a
            }
        }
        sortObject[key] = sort;

        let filter = { is_deleted: false };
        if (communityId) filter.community_id = ObjectId(communityId);
        if (eventId) filter.event_id = ObjectId(eventId);
        if (userId) filter['assigned_members.user_id'] = ObjectId(userId);
        if (status) filter['assigned_members.status'] = status;
        if (search) filter.task_name = new RegExp(search, 'i');
        if (priority) filter.priority = priority; // Filter by priority
        if (isDone !== undefined) filter.is_done = isDone; // Filter by isDone status
        // Handle taskDeadline condition
        if (taskDeadline == 'Past') {
            filter.task_deadline = { '$lt': new Date() };
        }
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
                $addFields: {
                    profileImage: {
                        $arrayElemAt: [
                            "$userDetails.profile_image",
                            0  // Replace with the index if multiple profiles are found
                        ]
                    }
                }
            },
            {
                $project: {
                    community_id: 1,
                    communityName: 1,
                    event_id: 1,
                    eventName: 1,
                    invitationType: 1,
                    task_name: 1,
                    require_team: 1,
                    task_description: 1,
                    team_size: 1,
                    priority: 1,
                    task_start_date: 1,
                    task_deadline: 1,
                    time: 1,
                    is_done: 1,
                    is_cancelled: 1,
                    assignedMembers: 1,
                    assignedMembersCount: 1,
                    created_at: 1
                }
            },
            { $sort: { created_at: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];

        try {
            const tasks = await EventTask.aggregate(pipeline).collation({ 'locale': 'en' }).sort(sortObject);
            const total = await EventTask.countDocuments(filter);
            // console.log(tasks,"tasks............");
            // Convert time format to ISO string in the result
            // tasks.forEach(task => {
            //     task.time.from = task.time.from.toISOString();
            //     task.time.to = task.time.to.toISOString();
            // });
            tasks.forEach(task => {
                if (task.time && task.time.from instanceof Date) {
                    task.time.from = task.time.from.toISOString();
                }
                if (task.time && task.time.to instanceof Date) {
                    task.time.to = task.time.to.toISOString();
                }
            });
            // Calculate the "from" and "to" values based on page and limit
            const from = (page - 1) * limit + 1;
            const to = Math.min(page * limit, total);
            return {
                error: false,
                message: "generalSuccess",
                total: total,
                from: from,
                to: to,
                data: tasks
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
    getAllEventTaskForApp: async (authId, data) => {
        const search = data.search;
        const page = data.page || 1;
        const limit = data.limit || 10;
        const communityId = data.communityId;
        const eventId = data.eventId;
        const userId = data.userId;
        const status = data.status;
        const priority = data.priority;
        const isDone = data.isDone;
        const taskDeadline = data.taskDeadline;
        let sortObject = {};
        let key = "created_at";
        let sort = -1;
        if (data && data.columnName && data.sort) {
            if (data.columnName === 'TaskName') {
                key = 'task_name';
            } else if (data.columnName === 'DateSort') {
                key = 'task_deadline';
            }
            if (data.sort === 'asc') {
                sort = 1; // sort a to z
            } else if (data.sort === 'desc') {
                sort = -1;  //sort z to a
            }
        }
        sortObject[key] = sort;

        let filter = { is_deleted: false };
        if (communityId) filter.community_id = ObjectId(communityId);
        if (eventId) filter.event_id = ObjectId(eventId);
        if (userId) filter['assigned_members.user_id'] = ObjectId(userId);
        // if (authId) filter['assigned_members.user_id'] = ObjectId(authId);
        if (status) filter['assigned_members.status'] = status;
        if (search) filter.task_name = new RegExp(search, 'i');
        if (priority) filter.priority = priority; // Filter by priority
        if (isDone !== undefined) filter.is_done = isDone; // Filter by isDone status
        // Handle taskDeadline condition
        if (taskDeadline == 'Past') {
            filter.task_deadline = { '$lt': new Date() };
        }
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
                $addFields: {
                    profileImage: {
                        $arrayElemAt: [
                            "$userDetails.profile_image",
                            0  // Replace with the index if multiple profiles are found
                        ]
                    }
                }
            },
            {
                $project: {
                    community_id: 1,
                    communityName: 1,
                    event_id: 1,
                    eventName: 1,
                    invitationType: 1,
                    task_name: 1,
                    require_team: 1,
                    task_description: 1,
                    team_size: 1,
                    priority: 1,
                    task_start_date: 1,
                    task_deadline: 1,
                    time: 1,
                    is_done: 1,
                    is_cancelled: 1,
                    assignedMembers: 1,
                    assignedMembersCount: 1,
                    created_at: 1
                }
            },
            { $sort: { created_at: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];

        try {
            const tasks = await EventTask.aggregate(pipeline).collation({ 'locale': 'en' }).sort(sortObject);
            const total = await EventTask.countDocuments(filter);
            // Filter assignedMembers for the authenticated user
            tasks.forEach(task => {
                task.assignedMembers = task.assignedMembers.filter(member => member.userId.toString() === authId);
            });
            // console.log(tasks,"tasks............");
            // Convert time format to ISO string in the result
            // tasks.forEach(task => {
            //     task.time.from = task.time.from.toISOString();
            //     task.time.to = task.time.to.toISOString();
            // });
            tasks.forEach(task => {
                if (task.time && task.time.from instanceof Date) {
                    task.time.from = task.time.from.toISOString();
                }
                if (task.time && task.time.to instanceof Date) {
                    task.time.to = task.time.to.toISOString();
                }
            });
            // Calculate the "from" and "to" values based on page and limit
            const from = (page - 1) * limit + 1;
            const to = Math.min(page * limit, total);
            return {
                error: false,
                message: "generalSuccess",
                total: total,
                from: from,
                to: to,
                data: tasks
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
    getEventTaskById: async (data) => {
        try {
            const pipeline = [
                { $match: { _id: ObjectId(data.taskId), is_deleted: false } },
                {
                    $lookup: {
                        from: `${Lib.ENV('DB_PREFIX')}events`,
                        localField: "event_id",
                        foreignField: "_id",
                        as: "eventData"
                    }
                },
                { $unwind: "$eventData" }  // destructure the eventData array to get a single object
            ];

            const taskData = await EventTask.aggregate(pipeline);

            if (!taskData || taskData.length === 0) {
                return {
                    error: true,
                    systemCode: "TASK_NOT_FOUND",
                    code: 404,
                    message: "Task not found",
                    data: null
                };
            }

            const task = taskData[0];

            const modifiedTask = {
                id: task._id.toString(),
                eventId: task.event_id.toString(),
                eventName: task.eventData.title,
                taskName: task.task_name,
                requireTeam: task.require_team,
                taskDescription: task.task_description,
                teamSize: task.team_size,
                priority: task.priority,
                assignedMembers: task.assigned_members,
                // taskStartDate: Lib.convertDate(task.task_start_date),
                // taskDeadline: Lib.convertDate(task.task_deadline),
                taskStartDate: new Date(task.task_start_date).toISOString(),
                taskDeadline: new Date(task.task_deadline).toISOString(),
                time: {
                    from: new Date(task.time.from).toISOString(),
                    to: new Date(task.time.to).toISOString()
                },
                isDone: task.is_done,
            };

            return {
                error: false,
                systemCode: 'SUCCESS',
                code: 200,
                message: "Task details fetched successfully",
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
    // Get the event RSVP users list whom are attending the event
    getUserVisibility: async function (data) {
        const { eventId, supplierId, taskId, age, type } = data;
        const pipeline = [
            {
                $match: {
                    _id: ObjectId(eventId),
                    is_deleted: false,
                }
            },
            {
                $unwind: "$rsvp"
            },
            // {
            //     $match: {
            //         'rsvp.status': 'Attending'
            //     }
            // },
            {
                $lookup: {
                    from: "sr_users",
                    localField: "rsvp.user_id",
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
                    birthYear: {
                        $toInt: "$userDetails.year_of_birth"
                    }
                }
            },
            {
                $addFields: {
                    age: {
                        $subtract: [new Date().getFullYear(), "$birthYear"]
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
                                { case: { $lt: ["$age", 18] }, then: "teenager" },
                                { case: { $gte: ["$age", 18] }, then: "adult" }
                            ],
                            default: "unknown"
                        }
                    }
                }
            },
        ];

        let assignedObjectIds = [];

        if (taskId) {
            const task = await EventTask.findById(taskId);
            if (!task) {
                return {
                    error: true,
                    message: "Task not found",
                    data: null
                };
            }
            if (task.event_id.toString() !== eventId) {
                return {
                    error: true,
                    message: "Event ID does not match with the Task's Event ID",
                    data: null
                };
            }
            assignedObjectIds = task.assigned_members.map(member => ObjectId(member.user_id));
        } else if (supplierId) {
            const supplier = await EventSupplierManagement.findById(supplierId);
            if (!supplier) {
                return {
                    error: true,
                    message: "Supplier not found",
                    data: null
                };
            }
            assignedObjectIds = supplier.assigned_members.map(member => ObjectId(member.user_id));
        }

        if (assignedObjectIds.length > 0) {
            pipeline.push({
                $addFields: {
                    isAssigned: {
                        $in: ["$userDetails._id", assignedObjectIds]
                    }
                }
            });
        }

        pipeline.push({
            $project: {
                _id: "$userDetails._id",
                name: "$userDetails.name",
                profileImage: "$userDetails.profile_image",
                number: "$userDetails.contact.phone.number",
                age: 1,
                type: 1,
                rsvpStatus: "$rsvp.status",
                ...((taskId || supplierId) && { isAssigned: 1 })
            }
        });

        // pipeline.push({
        //     $skip: (page - 1) * limit
        // });
        // pipeline.push({
        //     $limit: limit
        // });

        if (age) {
            pipeline.push({ $match: { age: age } });
        }

        if (type) {
            pipeline.push({ $match: { type: type } });
        }

        const usersData = await Events.aggregate(pipeline);
        return {
            error: false,
            message: "generalSuccess",
            data: usersData
        };
    },
    acceptOrRejectUserList: async function (data) {
        try {
            const { taskId, page = 1, limit = 10, status } = data;

            // Check if the task exists
            const task = await EventTask.findById(taskId);
            if (!task) {
                return {
                    error: true,
                    systemCode: "TASK_NOT_FOUND",
                    code: 404,
                    message: "Task not found",
                    data: null
                };
            }

            const pipeline = [
                {
                    $match: {
                        _id: ObjectId(taskId),
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
                        profileImage: "$userDetails.profile_image",
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

            const usersData = await EventTask.aggregate(pipeline);
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
    getTaskStatusCounting: async function (data) {
        try {
            const eventId = data.eventId;
            const filter = { event_id: eventId, is_deleted: false };

            // Count open tasks
            const openTaskCount = await EventTask.countDocuments({
                ...filter,
                task_deadline: { $gt: new Date() },
                is_done: false,
            });
            // Count closed tasks
            const closedTaskCount = await EventTask.countDocuments({
                ...filter,
                is_done: true,
            });

            // Count assigned tasks
            const assignedTaskCount = await EventTask.countDocuments({
                ...filter,
                'assigned_members.0': { $exists: true },
            });

            // Count past tasks
            const pastTaskCount = await EventTask.countDocuments({
                ...filter,
                task_deadline: { $lt: new Date() },
            });

            return {
                error: false,
                systemCode: "SUCCESS",
                code: 200,
                message: "Counts fetched successfully",
                data: {
                    openTask: openTaskCount,
                    closedTask: closedTaskCount,
                    assignedTask: assignedTaskCount,
                    pastTask: pastTaskCount
                }
            };
        } catch (error) {
            return {
                error: true,
                systemCode: 'ERROR_FETCHING_TASK_COUNTS',
                message: error.message,
                data: null,
                code: 500
            };
        }
    },
    //Mutation

    // createEventTask: async (userId, userName, data) => {
    //     try {
    //         // Convert input dates to UTC
    //         // const fromTimeDate = new Date(Date.parse(data.taskStartDate + " UTC"));
    //         // const toTimeDate = new Date(Date.parse(data.taskDeadline + " UTC"));
    //         const fromTimeDate = new Date(Date.parse(data.taskStartDate));
    //         const toTimeDate = new Date(Date.parse(data.taskDeadline));

    //         const community = await Communities.findOne({
    //             _id: ObjectId(data.communityId),
    //             is_deleted: false,
    //         });
    //         if (!community) {
    //             return {
    //                 error: true,
    //                 code: 404,
    //                 systemCode: 'COMMUNITY_NOT_FOUND',
    //                 message: 'Community not found'
    //             };
    //         }
    //         // Check if SMS and email settings are enabled
    // const { sms_settings, email_settings } = community.sms_email_global_settings;
    // const { sms_credits_remaining, email_credits_remaining } = community;

    //         const event = await Events.findOne({
    //             _id: ObjectId(data.eventId),
    //             is_deleted: false
    //         });

    //         if (!event) {
    //             return {
    //                 error: true,
    //                 code: 404,
    //                 systemCode: 'EVENT_NOT_FOUND',
    //                 message: 'Event not found'
    //             };
    //         }
    //         // let userCount = 0;
    //         // Check if assignedMembers is an array
    //         if (!Array.isArray(data.assignedMembers)) {
    //             return {
    //                 error: true,
    //                 message: "assignedMembers should be an array",
    //                 code: 400,
    //                 systemCode: "INVALID_INPUT_FORMAT",
    //                 data: null
    //             };
    //         }

    //         // Count each member type in assignedMembers
    //         let memberTypeCounts = {
    //             adult: 0,
    //             teenager: 0,
    //             children: 0
    //         };

    //         data.assignedMembers.forEach(member => {
    //             if (member.type in memberTypeCounts) {
    //                 memberTypeCounts[member.type]++;
    //             }
    //         });

    //         // Check if any count from assignedMembers exceeds its corresponding count in teamSize
    //         for (let type in memberTypeCounts) {
    //             if (memberTypeCounts[type] > data.teamSize[type]) {
    //                 return {
    //                     error: true,
    //                     message: `Too many members of type ${type}. Maximum allowed is ${data.teamSize[type]}.`,
    //                     code: 400,
    //                     systemCode: "OVER_ASSIGNED_MEMBERS",
    //                     data: null
    //                 };
    //             }
    //         }

    //         // Extract unique user IDs from the assignedMembers
    //         const uniqueAssignedMembers = data.assignedMembers.filter((member, index, self) =>
    //             index === self.findIndex((m) => m.UserId === member.UserId)
    //         );
    //         // console.log(uniqueAssignedMembers,"uniqueAssignedMembers..........");
    //         // Construct the assignedMembersList
    //         const assignedMembersList = uniqueAssignedMembers.map(member => ({
    //             user_id: ObjectId(member.UserId),
    //             type: member.type,
    //             invited_by: userName
    //         }));
    //         // Calculate total required team members
    //         const requiredTeam = data.teamSize.adult + data.teamSize.teenager + data.teamSize.children;

    //         const taskStartDate = fromTimeDate.toISOString();
    //         const taskEndDate = toTimeDate.toISOString();
    //         // Convert data.time.from and data.time.to to the desired format
    //         const toArray = data.time.to.split(":");
    //         const fromArray = data.time.from.split(":");

    //         toTimeDate.setUTCHours(toArray[0]);
    //         toTimeDate.setUTCMinutes(toArray[1]);

    //         fromTimeDate.setUTCHours(fromArray[0]);
    //         fromTimeDate.setUTCMinutes(fromArray[1]);
    //         // Validate that the task time is within the event time range
    //         if (fromTimeDate < event.created_at || toTimeDate > event.time.to) {
    //             return {
    //                 error: true,
    //                 message: "Task dates should be within the event date range.",
    //                 code: 400,
    //                 systemCode: "INVALID_TASK_DATES",
    //                 data: null
    //             };
    //         }
    //         const newEventTask = new EventTask({
    //             community_id: ObjectId(data.communityId),
    //             event_id: ObjectId(data.eventId),
    //             task_name: data.taskName,
    //             require_team: requiredTeam,
    //             task_description: data.taskDescription,
    //             team_size: data.teamSize,
    //             priority: data.priority,
    //             task_start_date: taskStartDate,
    //             task_deadline: taskEndDate,
    //             // task_start_date: new Date(fromTimeDate.toISOString().split('T')[0]),
    //             // task_deadline: new Date(toTimeDate.toISOString().split('T')[0]),
    //             time: {
    //                 from: fromTimeDate.toISOString(),
    //                 to: toTimeDate.toISOString()
    //             },
    //             is_done: data.isDone || false,
    //             assigned_members: assignedMembersList
    //         });
    //         const savedTask = await newEventTask.save();

    //         // Calculate the number of users
    //         const usersCount = uniqueAssignedMembers.length;
    //         console.log(usersCount, "usersCount...................");
    //         const userAggregate = [
    //             {
    //                 $match: {
    //                     _id: { $in: uniqueAssignedMembers.map(member => mongoose.Types.ObjectId(member.UserId)) }
    //                 }
    //             },
    //             {
    //                 $project: {
    //                     name: "$name",
    //                     email: "$contact.email.address",
    //                     phone: "$contact.phone.number",
    //                     phoneCode: "$contact.phone.phone_code"
    //                 }
    //             }
    //         ];

    //         const users = await User.aggregate(userAggregate);
    //         await Promise.all(users.map(async (user) => {
    //             const userId = user._id;
    //             const userName = user.name;
    //             const userEmail = user.email;
    //             const userPhone = user.phone;
    //             const userphoneCode = user.phoneCode;

    //             // console.log(userEmail, "userEmails.....");
    //             let to = userphoneCode + userPhone;
    //             const smspayload = {
    //                 recipient:
    //                 {
    //                     phone: to,
    //                 },
    //                 template: {
    //                     type: "SMS",
    //                     slug: "TASKSMS",
    //                     lang: "en"
    //                 },
    //                 contents: {
    //                     TASKNAME: data.taskName
    //                 }
    //             }
    //             const emailpayload = {
    //                 recipient:
    //                 {
    //                     email: userEmail
    //                 },
    //                 template: {
    //                     type: "Email",
    //                     slug: "TASKEMAIL",
    //                     lang: "en"
    //                 },
    //                 contents: {
    //                     TASKNAME: data.taskName
    //                 }
    //             }
    //             const payload = {
    //                 recipient:
    //                 {
    //                     user_id: userId
    //                 },
    //                 template: {
    //                     type: "Push",
    //                     slug: "new-task",
    //                     lang: "en"
    //                 },
    //                 contents: {
    //                     USERNAME: userName,
    //                     TASKNAME: data.taskName,
    //                     EVENTNAME: event.title
    //                 },
    //             }
    //             // Send notifications based on community settings
    //             if (sms_settings && sms_credits_remaining >= usersCount) {
    //                 // Send SMS
    //                 await notificationServices.notifyService(smspayload);
    //             }
    //             if (email_settings && email_credits_remaining >= usersCount) {
    //                 // Send Email
    //                 await notificationServices.notifyService(emailpayload);
    //             }
    //             await notificationServices.notifyService(payload);
    //         }))
    //         // Deduct credits based on the number of users processed
    //         // community.sms_credits_remaining -= usersCount;
    //         // community.email_credits_remaining -= usersCount;
    //         // await community.save();
    //          // Deduct credits based on the number of users processed
    //          if (sms_settings && sms_credits_remaining >= usersCount) {
    //             community.sms_credits_remaining -= usersCount;
    //             await community.save();
    //         }

    //         if (email_settings && email_credits_remaining >= usersCount) {
    //             community.email_credits_remaining -= usersCount;
    //             await community.save();
    //         }
    //         return {
    //             error: false,
    //             message: "generalSuccess",
    //             data: savedTask
    //         };

    //     } catch (error) {
    //         return {
    //             error: true,
    //             code: 500,
    //             systemCode: 'ERROR_CREATING_EVENT_TASK',
    //             message: error.message
    //         };
    //     }
    // },
    createEventTask: async (userId, userName, data) => {
        try {
            // Convert input dates to UTC
            const fromTimeDate = new Date(Date.parse(data.taskStartDate));
            const toTimeDate = new Date(Date.parse(data.taskDeadline));

            if (toTimeDate < fromTimeDate) {
                return {
                    error: true,
                    code: 400,
                    systemCode: "INVALID_TASK_DATE_RANGE",
                    message: "Task end date cannot be earlier than task start date.",
                };
            }

            const community = await Communities.findOne({
                _id: ObjectId(data.communityId),
                is_deleted: false,
            });
            if (!community) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'COMMUNITY_NOT_FOUND',
                    message: 'Community not found'
                };
            }

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

            if (!Array.isArray(data.assignedMembers)) {
                return {
                    error: true,
                    message: "assignedMembers should be an array",
                    code: 400,
                    systemCode: "INVALID_INPUT_FORMAT",
                    data: null
                };
            }

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

            const uniqueAssignedMembers = data.assignedMembers.filter((member, index, self) =>
                index === self.findIndex((m) => m.UserId === member.UserId)
            );

            const assignedMembersList = uniqueAssignedMembers.map(member => ({
                user_id: ObjectId(member.UserId),
                type: member.type,
                invited_by: userName
            }));

            const requiredTeam = data.teamSize.adult + data.teamSize.teenager + data.teamSize.children;
            const usersCount = uniqueAssignedMembers.length;
            const taskStartDate = fromTimeDate.toISOString();
            const taskEndDate = toTimeDate.toISOString();

            const toArray = data.time.to.split(":");
            const fromArray = data.time.from.split(":");

            toTimeDate.setUTCHours(toArray[0]);
            toTimeDate.setUTCMinutes(toArray[1]);

            fromTimeDate.setUTCHours(fromArray[0]);
            fromTimeDate.setUTCMinutes(fromArray[1]);

            if (fromTimeDate < event.created_at || toTimeDate > event.time.to) {
                return {
                    error: true,
                    message: "Task dates should be within the event date range.",
                    code: 400,
                    systemCode: "INVALID_TASK_DATES",
                    data: null
                };
            }
            const newEventTask = new EventTask({
                community_id: ObjectId(data.communityId),
                event_id: ObjectId(data.eventId),
                task_name: data.taskName,
                require_team: requiredTeam,
                task_description: data.taskDescription,
                team_size: data.teamSize,
                priority: data.priority,
                task_start_date: taskStartDate,
                task_deadline: taskEndDate,
                time: {
                    from: fromTimeDate.toISOString(),
                    to: toTimeDate.toISOString(),
                    timezone: data.time.timezone
                },
                is_done: data.isDone || false,
                assigned_members: assignedMembersList
            });
            await helperService.validateCreditsRemaining(community, usersCount, usersCount);
            const savedTask = await newEventTask.save();

            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: savedTask.community_id,
                userId: userId,
                module: "EVENT_TASK",
                action: "CREATE",
                platForm: "web",
                memberRole: userRole,
                oldData: null,
                newData: newEventTask
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
                    recipient: {
                        phone: to,
                    },
                    template: {
                        type: "SMS",
                        slug: "TASKSMS",
                        lang: "en"
                    },
                    contents: {
                        TASKNAME: data.taskName,
                        MEMBERNAME: userName,
                        EVENTNAME: event.title
                    }
                };

                const emailpayload = {
                    recipient: {
                        email: userEmail
                    },
                    template: {
                        type: "Email",
                        slug: "TASKEMAIL",
                        lang: "en"
                    },
                    contents: {
                        TASKNAME: data.taskName,
                        MEMBERNAME: userName,
                        EVENTNAME: event.title
                    }
                };

                const payload = {
                    recipient: {
                        user_id: userId,
                        fcmToken: webToken
                    },
                    template: {
                        type: "Push",
                        slug: "new-task",
                        lang: "en"
                    },
                    contents: {
                        USERNAME: userName,
                        TASKNAME: data.taskName,
                        EVENTNAME: event.title
                    },
                };

                if (sms_settings) {
                    await notificationServices.notifyService(smspayload);
                }

                if (email_settings) {
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
                message: "generalSuccess",
                data: savedTask
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

    updateEventTask: async (params, context, communityId) => {
        try {
            const { taskId, eventId, taskName, requireTeam, taskDescription, priority, taskStartDate, taskDeadline, teamSize, assignedMembers, time } = params;
            const community = await Communities.findOne({ _id: new ObjectId(communityId) });
            if (!community) {
                throw new ErrorModules.Api404Error("noCommunityFound");
            }
            // Check if SMS and email settings are enabled
            const { sms_settings, email_settings } = community.sms_email_global_settings;
            // const { sms_credits_remaining, email_credits_remaining } = community;
            // Convert input dates to UTC
            // const fromTimeDate = new Date(Date.parse(taskStartDate + " UTC"));
            // const toTimeDate = new Date(Date.parse(taskDeadline + " UTC"));
            const fromTimeDate = new Date(Date.parse(taskStartDate));
            const toTimeDate = new Date(Date.parse(taskDeadline));

            if (toTimeDate < fromTimeDate) {
                return {
                    error: true,
                    code: 400,
                    systemCode: "INVALID_TASK_DATE_RANGE",
                    message: "Task end date cannot be earlier than task start date.",
                };
            }

            // Validate that the provided "taskId" belongs to the specified "eventId"
            const eventTask = await EventTask.findOne({
                _id: ObjectId(taskId),
                event_id: ObjectId(eventId), // Check if the task belongs to the specified event
                is_deleted: false
            });


            if (!eventTask) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'EVENT_TASK_NOT_FOUND',
                    message: 'Event task not found for the specified event'
                };
            }

            // store old data
            const oldData = eventTask.toObject();

            const event = await Events.findOne({
                _id: ObjectId(eventId),
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
            let updates = {};

            // Handle task properties
            if (taskName) updates.task_name = taskName;
            if (requireTeam) updates.require_team = requireTeam;
            if (taskDescription) updates.task_description = taskDescription;
            if (priority) updates.priority = priority;
            if (taskStartDate) {
                const startDate = new Date(taskStartDate);
                updates.task_start_date = startDate.toISOString();
            }

            if (taskDeadline) {
                const deadlineDate = new Date(taskDeadline);
                updates.task_deadline = deadlineDate.toISOString();
            }



            // Handle team size
            updates.team_size = {
                adult: teamSize?.adult || 0,
                teenager: teamSize?.teenager || 0,
                children: teamSize?.children || 0
            };

            updates.require_team = updates.team_size.adult + updates.team_size.teenager + updates.team_size.children;

            // Validate assigned members
            const memberTypeCounts = {
                adult: 0,
                teenager: 0,
                children: 0
            };

            assignedMembers.forEach(member => {
                if (member.type in memberTypeCounts) {
                    memberTypeCounts[member.type]++;
                }
            });

            for (const type in memberTypeCounts) {
                if (memberTypeCounts[type] > (teamSize && teamSize[type])) {
                    return {
                        error: true,
                        message: `Too many members of type ${type}. Maximum allowed is ${teamSize && teamSize[type]}.`,
                        code: 400,
                        systemCode: "OVER_ASSIGNED_MEMBERS",
                        data: null
                    };
                }
            }
            // Handle assigned members
            const existingUserIds = eventTask.assigned_members.map(member => member.user_id.toString());
            const newUsers = assignedMembers.filter(member => !existingUserIds.includes(member.UserId));
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

            // Handle assigned members
            const uniqueAssignedMembers = assignedMembers.filter((member, index, self) =>
                index === self.findIndex((m) => m.UserId === member.UserId)
            );

            const assignedMembersList = uniqueAssignedMembers.map(member => ({
                user_id: ObjectId(member.UserId),
                type: member.type,
                invited_by: member.invitedBy || context.user.name,
                status: member.status
            }));

            updates.assigned_members = assignedMembersList;

            const fromArray = time.from.split(":");
            const toArray = time.to.split(":");

            fromTimeDate.setUTCHours(fromArray[0]);
            fromTimeDate.setUTCMinutes(fromArray[1]);

            toTimeDate.setUTCHours(toArray[0]);
            toTimeDate.setUTCMinutes(toArray[1]);

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
            // Convert time to the desired format
            if (time && time.from && time.to) {
                updates.time = {
                    from: fromTimeDate.toISOString(),
                    to: toTimeDate.toISOString(),
                };
            }
            await helperService.validateCreditsRemaining(community, usersCount, usersCount);
            const updatedEventTask = await EventTask.findOneAndUpdate(
                { _id: ObjectId(taskId), is_deleted: false },
                { $set: updates },
                { new: true }  // Returns the updated document
            );

            // store new data
            const newData = updatedEventTask.toObject();
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

            const user = context.user;
            const member = community.members.find(
                (m) => m.member_id.toString() === user.id.toString()
            );
            const userRole = member.roles;


            // Activity Log
            if (Object.keys(changes).length > 0) {
                await ActivityLogService.activityLogActiion({
                    communityId: communityId,
                    userId: context.user.id,
                    module: "EVENT_TASK",
                    action: "UPDATE",
                    oldData: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.old])),
                    newData: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.new])),
                    platForm: "web",
                    memberRole: userRole
                });
            }

            if (!updatedEventTask) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'EVENT_TASK_NOT_FOUND',
                    message: 'Event task not found'
                };
            }

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
                const smspayload = {
                    recipient:
                    {
                        phone: to,
                    },
                    template: {
                        type: "SMS",
                        slug: "TASKSMS",
                        lang: "en"
                    },
                    contents: {
                        TASKNAME: taskName
                    }
                }
                const emailpayload = {
                    recipient:
                    {
                        email: userEmail
                    },
                    template: {
                        type: "Email",
                        slug: "TASKEMAIL",
                        lang: "en"
                    },
                    contents: {
                        TASKNAME: taskName
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
                        slug: "new-task",
                        lang: "en"
                    },
                    contents: {
                        USERNAME: userName,
                        TASKNAME: taskName,
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
            }))
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
                message: "eventUpdateSuccess",
                data: updatedEventTask
            };

        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_UPDATING_EVENT_TASK',
                message: error.message
            };
        }
    },
    eventTaskStatusChange: async function (eventTaskId, userId) {
        const eventTask = await EventTask.findOne({
            _id: ObjectId(eventTaskId),
            is_deleted: false
        });
        if (Lib.isEmpty(eventTask)) {
            return { error: true, message: "No eventTask found", ErrorClass: ErrorModules.Api404Error };
        }
        const eventId = eventTask.event_id;
        const event = await Events.findOne({ _id: ObjectId(eventId) });
        // store old data
        const oldData = { is_done: eventTask.is_done };

        if (eventTask.is_done == true) {
            eventTask.is_done = false;
        } else {
            eventTask.is_done = true;
        }

        await eventTask.save();

        const id = event.community_id;
        const community = await Communities.findOne({ _id: new ObjectId(id) });
        const member = community.members.find(
            (m) => m.member_id.toString() === userId.toString()
        );
        const userRole = member.roles;
        // activity Log
        await ActivityLogService.activityLogActiion({
            communityId: event.community_id,
            userId: userId,
            module: "EVENT_TASK",
            action: "STATUS_CHANGE",
            platForm: "web",
            memberRole: userRole,
            oldData: oldData,
            newData: { is_done: eventTask.is_done }
        });
        return { error: false, message: "statusChangedSuccess" };
    },
    deleteEventTask: async function (id, userId) {
        try {
            const EventTaskObj = {
                "is_deleted": true
            }
            const eventTask = await EventTask.findOne({ _id: id });
            const eventId = eventTask.event_id;
            const event = await Events.findOne({ _id: ObjectId(eventId) });

            let updateEventTask = await EventTask.findOneAndUpdate({ _id: ObjectId(id) }, { "$set": EventTaskObj });

            const id = event.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;
            // Call Activity log
            await ActivityLogService.activityLogActiion({
                communityId: event.community_id,
                userId: userId,
                module: "EVENT_TASK",
                action: "DELETE",
                platForm: "web",
                memberRole: userRole,
                oldData: null,
                newData: null
            });
            return ({ error: false, message: "generalSuccess", data: updateEventTask });

        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Event find error");
        }
    },
    assignMember: async function (data, logInUser) {
        const { taskId, UserId, type } = data;
        try {
            const task = await EventTask.findById(taskId);

            if (!task) {
                return {
                    error: true,
                    message: "Task not found",
                    code: 404,
                    systemCode: "TASK_NOT_FOUND",
                    data: null
                };
            }

            const memberExists = task.assigned_members.find(member => member.user_id.toString() === UserId);

            if (memberExists) {
                return {
                    error: true,
                    message: "Member already assigned to this task",
                    code: 409,
                    systemCode: "MEMBER_ALREADY_ASSIGNED",
                    data: null
                };
            }

            // Verify the user has RSVP status 'Attending' for the event
            const event = await Events.findById(task.event_id);  // assuming your event model is named 'Event'
            if (!event) {
                return {
                    error: true,
                    message: "Event not found for the task",
                    code: 404,
                    systemCode: "EVENT_NOT_FOUND",
                    data: null
                };
            }
            const oldAssignMember = [...task.assigned_members];

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
                        task_name: task.task_name,
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
            // Update the team_size based on the member type

            if (type === 'adult') {
                task.team_size.adult += 1;
            } else if (type === 'teenager') {
                task.team_size.teenager += 1;
            } else if (type === 'children') {
                task.team_size.children += 1;
            }
            task.assigned_members.push({ user_id: UserId, type });
            await task.save();

            const allMemberUserIds = task.assigned_members.map(m => m.user_id);
            const allUsers = await User.find(
                { _id: { $in: allMemberUserIds } },
                { name: 1, "contact.email.address": 1 }
            );

            const newData = {
                assigned_members: task.assigned_members.map(member => {
                    const user = allUsers.find(u => u._id.toString() === member.user_id.toString());
                    return {
                        user_id: member.user_id,
                        task_name: task.task_name,
                        name: user ? user.name : "Unknown",
                        email: user?.contact?.email?.address || "N/A",
                        type: member.type
                    };
                }),
                newly_assigned: {
                    user_id: UserId,
                    task_name: task.task_name,
                    name: assignedUser ? assignedUser.name : "Unknown",
                    email: assignedUser?.contact?.email?.address || "N/A",
                    type
                }
            };

            const id = task.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === logInUser.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: task.community_id,
                userId: logInUser,
                module: "EVENT_TASK",
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
    deleteAssignMember: async function (data, logInUser) {
        const { UserId, taskId } = data;

        try {
            const task = await EventTask.findById(taskId);

            if (!task) {
                return {
                    error: true,
                    systemCode: "TASK_NOT_FOUND",
                    code: 404,
                    message: "Task not found"
                };
            }

            const member = task.assigned_members.find(member => member.user_id.toString() === UserId);

            if (!member) {
                return {
                    error: true,
                    systemCode: "MEMBER_NOT_FOUND",
                    code: 404,
                    message: "Assigned member not found"
                };
            }

            const user = await User.findOne(
                { _id: UserId },
                { name: 1, "contact.email.address": 1 }
            );

            // Decrement the team_size based on the member type
            if (member.type === 'adult') {
                task.team_size.adult -= 1;
            } else if (member.type === 'teenager') {
                task.team_size.teenager -= 1;
            } else if (member.type === 'children') {
                task.team_size.children -= 1;
            }

            // Pull out the member from the assigned_members array
            task.assigned_members.pull({ _id: member._id });

            await task.save();

            const newData = {
                task_name: {
                    task_name: task.task_name
                },
                deleted_User: {
                    user_id: UserId,
                    name: user ? user.name : "Unknown",
                    email: user?.contact?.email?.address || "N/A"
                }
            }

            const id = task.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const memberRole = community.members.find(
                (m) => m.member_id.toString() === logInUser.toString()
            );
            const userRole = memberRole.roles;

            await ActivityLogService.activityLogActiion({
                communityId: task.community_id,
                userId: logInUser,
                module: "EVENT_TASK",
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
    acceptOrRejectTask: async function (userId, data) {
        try {
            const task = await EventTask.findOne({
                _id: ObjectId(data.taskId),
                is_deleted: false
            });

            if (!task) {
                return {
                    error: true,
                    systemCode: "TASK_NOT_FOUND",
                    code: 404,
                    message: "Task not found"
                };
            }

            // Ensure that users can't accept or reject after the required_date.
            if (new Date() > new Date(task.task_deadline)) {
                return {
                    error: true,
                    code: 400,
                    systemCode: 'TIME_EXPIRED',
                    message: 'Cannot accept or reject after the deadline.'
                };
            }

            // Locate the user in the assigned_members list.
            const memberIndex = task.assigned_members.findIndex(member =>
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
            const currentStatus = task.assigned_members[memberIndex].status;
            if (currentStatus === "Accepted" || currentStatus === "Rejected") {
                return {
                    error: true,
                    code: 403,
                    systemCode: 'STATUS_ALREADY_SET',
                    message: `User has already ${currentStatus}. Cannot modify status further.`
                };
            }

            // Update status and save
            task.assigned_members[memberIndex].status = data.status;
            // Set the accepted_date and accepted_time only when the status is "Accepted" or "Rejected"
            if (data.status === "Accepted" || data.status === "Rejected") {
                const now = new Date();
                const timeString = now.toISOString().split('T')[1].split('.')[0];

                task.assigned_members[memberIndex].accepted_date = now;
                task.assigned_members[memberIndex].accepted_time = timeString;
            }
            await task.save();

            const id = task.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: task.community_id,
                userId: userId,
                module: "EVENT_TASK",
                action: data.status.toUpperCase(),
                platForm: "app",
                memberRole: userRole,
                oldData: null,
                newData: null
            })

            return {
                error: false,
                systemCode: 'SUCCESS',
                code: 200,
                message: `Task status updated to ${data.status}.`
            };

        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_UPDATING_STATUS',
                message: error.message
            };
        }
    },
    generateExcelTaskList: async function (eventId, userId) {
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
                    $addFields: {
                        profileImage: {
                            $arrayElemAt: [
                                "$userDetails.profile_image",
                                0  // Replace with the index if multiple profiles are found
                            ]
                        }
                    }
                },
                {
                    $project: {
                        community_id: 1,
                        communityName: 1,
                        event_id: 1,
                        eventName: 1,
                        task_name: 1,
                        require_team: 1,
                        task_description: 1,
                        team_size: {
                            adult: "$team_size.adult",
                            teenager: "$team_size.teenager",
                            children: "$team_size.children"
                        },
                        priority: 1,
                        task_start_date: 1,
                        task_deadline: 1,
                        time: 1,
                        is_done: 1,
                        assignedMembers: 1,
                        assignedMembersCount: 1,
                        created_at: 1
                    }
                },
            ];
            const tasks = await EventTask.aggregate(pipeline);
            const communityId = tasks.length > 0 ? tasks[0].community_id : null;
            const table = [['Sl.No', 'Task Name', 'Required Team', 'Team Size', 'Priority', 'Task Deadline', 'Assigned Members', 'Status', 'History']];

            for (let i = 0; i < tasks.length; i++) {
                const app = tasks[i];
                const formattedDate = new Date(app.task_deadline).toLocaleDateString();
                // Extracting information from assignedMembers array
                const assignedMembersInfo = app.assignedMembers.map(member => ({
                    userId: member.userId,
                    name: member.name,
                    type: member.type,
                    invitedBy: member.invitedBy,
                    isDeleted: member.isDeleted,
                    status: member.status,
                    profileImage: member.profileImage,
                }));
                const status = app.is_done ? 'Done' : 'Not Done';
                const history = assignedMembersInfo.map(member => {
                    if (["Accepted", "Rejected"].includes(member.status)) {
                        return `${member.name} (${member.type}) - ${member.status}`;
                    }
                    return null;
                }).filter(item => item).join(', ');
                const value = [
                    i + 1,
                    app.task_name,
                    app.require_team,
                    `${app.team_size.adult} adults, ${app.team_size.teenager} teenagers, ${app.team_size.children} children`,
                    app.priority,
                    formattedDate,
                    assignedMembersInfo.map(member => `${member.name} (${member.type})`).join(', '),
                    status,
                    history
                ];
                table.push(value);
            }

            const wb = xlsx.utils.book_new();
            const ws = xlsx.utils.aoa_to_sheet(table);
            xlsx.utils.book_append_sheet(wb, ws, 'Event Tasks');

            // write options
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
                module: "EVENT_TASK",
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
    selfVolunteer: async function (userId, data) {
        try {
            const { taskId, type } = data;

            // Find the event task by ID
            const eventTask = await EventTask.findById(taskId);
            if (!eventTask) {
                return {
                    success: false,
                    message: "Event task not found."
                };
            }
            // Check if the user is already assigned to this task
            const alreadyAssigned = eventTask.assigned_members.find(member => member.user_id.toString() === userId);
            if (alreadyAssigned) {
                return {
                    success: false,
                    message: "You are already assigned to this task.",
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
            eventTask.assigned_members.forEach(member => {
                if (member.type === "adult") {
                    adultCount++;
                } else if (member.type === "teenager") {
                    teenagerCount++;
                } else if (member.type === "children") {
                    childrenCount++;
                }
            });

            // Check if adding this member exceeds the team size limit
            if (userType === "adult" && adultCount >= eventTask.team_size.adult) {
                return {
                    success: false,
                    message: "The team size limit for adults has been reached for this task."
                };
            }
            if (userType === "teenager" && teenagerCount >= eventTask.team_size.teenager) {
                return {
                    success: false,
                    message: "The team size limit for teenagers has been reached for this task."
                };
            }
            if (userType === "children" && childrenCount >= eventTask.team_size.children) {
                return {
                    success: false,
                    message: "The team size limit for children has been reached for this task."
                };
            }
            const currentTime = new Date();
            const timeString = currentTime.toISOString().split('T')[1].split('.')[0];
            // Add the user to assigned_members array with calculated type
            eventTask.assigned_members.push({
                user_id: userId,
                type: userType,
                status: "Accepted",
                accepted_date: currentTime,
                accepted_time: timeString
            });
            // Save the updated event task
            await eventTask.save();

            const id = eventTask.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: eventTask.community_id,
                userId: userId,
                module: "EVENT_TASK",
                action: "SELF_VOLUNTEER",
                platForm: "app",
                memberRole: userRole,
                oldData: null,
                newData: null
            })
            return {
                success: true,
                message: "You have successfully self-volunteered for this task."
            };
        } catch (error) {
            console.error("Error in selfVolunteer service:", error);
            return {
                success: false,
                message: "An error occurred while self-volunteering for this task."
            };
        }
    }
}