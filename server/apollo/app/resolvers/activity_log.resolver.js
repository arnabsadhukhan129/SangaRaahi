const Services = require("../services");
const ErrorModules = require("../errors");

module.exports = {
    Query: {
        getAllActivityLogs: async (root, args, context, info) => {
            try {
                let user = context;
                console.log(user,"user...............")
                const result = await Services.ActivityLogService.getAllActivityLog(args.data);

                // Transform raw MongoDB docs into GraphQL schema shape
                const mappedLogs = result.data.map(log => ({
                    id: log._id ? log._id.toString() : null,
                    communityId: log.community_id ? log.community_id.toString() : null,
                    userId: log.user_id ? log.user_id.toString() : null,
                    module: log.module,
                    action: log.action,
                    oldData: log.old_data || null,
                    newData: log.new_data || null,
                    platForm: log.plat_form || null,
                    userName: log.user_name || null,
                    communityName: log.community_name || null,
                    memberRole: log.member_role || [],
                    createdAt: log.created_at ? log.created_at.toISOString() : null,
                    updatedAt: log.updated_at ? log.updated_at.toISOString() : null
                }));

                const activityLogData = {
                    total: result.total,
                    from: result.from,
                    to: result.to,
                    alllogs: mappedLogs
                };

                return Lib.resSuccess(activityLogData);
            } catch (error) {
                console.error("Error in resolver:", error);
                return {
                    error: true,
                    code: 500,
                    systemCode: 'RESOLVER_ERROR',
                    message: error.message,
                    data: null
                };
            }
        }
    }
};
