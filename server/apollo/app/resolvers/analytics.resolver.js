const Services = require("../services");
const ErrorModules = require("../errors");

module.exports = {
    Query: {
        getParticipationByEventTpe: async (root, args, context, info) => {
            try {
                const data = args.data;
                const logInId = context.user.id;

                const result = await Services.AnalyticsService.getParticipationByEventTpe(data, logInId);

                const eventTypeData = {
                    allEventTypeAnalytics: Array.isArray(result.data) ? result.data : []
                };
                return Lib.resSuccess(eventTypeData);

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
        },
        getEventParticipationByUser: async (root, args, context, info) => {
            try {
                const data = args.data;
                const logInUserId = context.user.id;

                const result = await Services.AnalyticsService.getEventParticipationByUser(data, logInUserId);

                const eventData = {
                    allEventByUserAnalytics: Array.isArray(result.data) ? result.data : []
                };
                return Lib.resSuccess(eventData);

            } catch (error) {
                console.log("Error in resolver:", error);
                return {
                    error: true,
                    code: 500,
                    systemCode: 'RESOLVER_ERROR',
                    message: error.message,
                    data: null
                }
            }
        },
        getCommunityContribution: async (root, args, context) => {
            try {
                const data = args.data || {};
                const logInUserId = context.user.id;

                const result = await Services.AnalyticsService.getCommunityContribution(data, logInUserId);

                const responseData = {
                    communityContributionAnalytics: result.data || [],
                    totalContribution: result.totalContribution || 0,
                    currency: result.currency || null
                };

                return Lib.resSuccess(responseData);

            } catch (error) {
                console.error("Error in resolver:", error);

                return {
                    error: true,
                    code: 500,
                    systemCode: "RESOLVER_ERROR",
                    message: error.message,
                    data: null
                };
            }
        },
        getCurrentCommunityContribution: async (root, args, context) => {
            try {
                const data = args.data || {};
                const logInUserId = context.user.id;

                const result = await Services.AnalyticsService.getCurrentCommunityContribution(data, logInUserId);

                const responseData = {
                    communityContributionAnalytics: result.data || [],
                    totalContribution: result.totalContribution || 0,
                    currency: result.currency || null
                };

                return Lib.resSuccess(responseData);

            } catch (error) {
                console.error("Error in resolver:", error);

                return {
                    error: true,
                    code: 500,
                    systemCode: "RESOLVER_ERROR",
                    message: error.message,
                    data: null
                };
            }
        },
        mySpentAmmountVsTimeLine: async (root, args, context) => {
            try {
                const data = args.data || {};
                const logInUserId = context.user.id;

                const result = await Services.AnalyticsService.getMySpentAmountByMonth(
                    data,
                    logInUserId
                );

                const correctMapped = (result.data || []).map(item => ({
                    month: item.month,
                    totalSpentAmmount: item.totalSpentAmmount,
                    currency: item.currency
                }));

                const responseData = {
                    spentAmmountVsTimeLine: correctMapped
                };

                return Lib.resSuccess(responseData);

            } catch (error) {
                console.error("Error in resolver:", error);

                return {
                    error: true,
                    code: 500,
                    systemCode: "RESOLVER_ERROR",
                    message: error.message,
                    data: null
                };
            }
        }
    }
}