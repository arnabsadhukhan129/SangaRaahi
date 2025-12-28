const Services = require('../services');

module.exports = {
    Query: {
        async getCornByEvent(root, args, context, info) {
            const result = await Services.EventImmediateCronService.getCronByEvent(args.data);
            const crons = Lib.reconstructObjectKeys(result.data,
                ["notificationDate", "notificationTime", "createdAt"],
                function (value, key) {
                    if (key === "notificationDate") {
                        return Lib.convertIsoDate(value);
                    } else if (key === "notificationTime") {
                        if (!value) return null;
                        return new Date(value).toISOString();
                    } else if (key === "createdAt") {
                        return Lib.convertIsoDate(value);
                    }
                    else {
                        return value;
                    }
                }
            )
            const cronDatab = {
                total: result.total,
                from: result.from,
                to: result.to,
                crons: crons
            }
            return Lib.resSuccess(cronDatab);
        }
    },
    Mutation: {
        async eventImmediateRemember(root, args, context, info) {
            const eventId = args.data.eventId;
            const userId = context.user.id
            const result = await Services.EventImmediateCronService.createEventImmediateCron(args.data, eventId, userId);
            return Lib.sendResponse(result);
        },
        async deleteEventCron(root, args, context, info) {
            const cronId = args.data.cronId;
            const result = await Services.EventImmediateCronService.deleteEventCron(cronId);
            return Lib.sendResponse(result);
        }
    }
}