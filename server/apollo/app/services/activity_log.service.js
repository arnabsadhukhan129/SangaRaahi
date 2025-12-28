const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_PORT, process.env.REDIS_HOST);
const ActivityLogs = Lib.Model('ActivityLog');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const ErrorModules = require('../errors');

module.exports = {
    getAllActivityLog: async (data) => {
        const search = data.search;
        const page = data.page || 1;
        const limit = data.limit || 10;
        const sort = data.sort || "desc";
        const action = data.action;
        const module = data.module;
        const platForm = data.platForm;
        const memberRole = data.memberRole;
        const communityId = data.communityId;
        const userId = data.userId;
        let filter = { is_deleted: false };
        if (communityId) filter.community_id = ObjectId(communityId);
        if (userId) filter.user_id = ObjectId(userId);
        if (action) filter.action = action.toUpperCase();
        if (module) filter.module = module.toUpperCase();
        if (platForm) filter.plat_form = platForm;
        // if (memberRole) filter.member_role = memberRole;
        const sortOrder = sort === "asc" ? 1 : -1;

        const pipeline = [
            {
                $match: filter
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
                $lookup: {
                    from: "sr_users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: {
                    path: "$community"
                }
            },
            {
                $unwind: {
                    path: "$user"
                }
            },
            {
                $addFields: {
                    member_data: {
                        $filter: {
                            input: "$community.members",
                            as: "member",
                            cond: { $eq: ["$$member.member_id", "$user._id"] }
                        }
                    }
                }
            },
            // {
            //     $addFields: {
            //         member_role: {
            //             $arrayElemAt: ["$member_data.roles", 0]
            //         }
            //     }
            // },
            ...(memberRole
                ? [{
                    $match: {
                        member_role: memberRole
                    }
                }]
                : []),
            {
                $project: {
                    community_id: 1,
                    user_id: 1,
                    module: 1,
                    action: 1,
                    old_data: 1,
                    new_data: 1,
                    plat_form: 1,
                    created_at: 1,
                    community_name: "$community.community_name",
                    user_name: "$user.name",
                    member_role: 1
                }
            },
            { $sort: { created_at: sortOrder } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ]
        try {
            const activityLog = await ActivityLogs.aggregate(pipeline).collation({ 'locale': 'en' });
            const totalPipeline = [...pipeline];
            totalPipeline.pop();
            totalPipeline.pop();
            totalPipeline.push({ $count: "total" });
            const totalResult = await ActivityLogs.aggregate(totalPipeline);
            const total = totalResult[0]?.total || 0;
            const from = (page - 1) * limit + 1;
            const to = Math.min(page * limit, total);
            return {
                error: false,
                message: "generalSuccess",
                total: total,
                from: from,
                to: to,
                data: activityLog
            };
        } catch (err) {
            console.log(err)
        }
    },
    // activityLogActiion: async ({ communityId, userId, module, action, oldData, newData, platForm }) => {
    //     return ActivityLogs.create({
    //         community_id: communityId,
    //         user_id: userId,
    //         module,
    //         action,
    //         old_data: oldData,
    //         new_data: newData,
    //         plat_form: platForm
    //     });
    // }

    activityLogActiion: async ({ communityId, userId, module, action, oldData, newData, platForm, memberRole }) => {
        const log = {
            community_id: communityId,
            user_id: userId,
            module,
            action,
            old_data: oldData,
            new_data: newData,
            plat_form: platForm,
            member_role: memberRole,
            created_at: new Date(),
            updated_at: new Date()
        }

        await redis.rpush("audit_logs", JSON.stringify(log));
    }
}