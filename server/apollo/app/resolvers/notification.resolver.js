const Services = require('../services')
const ErrorModules =require('../errors')

module.exports = {
    Query:{
        async getAllNotifications(root, args, context, info){
            let user = context.user
            const allNotifications = await Services.UserService.getAllNotificationService(user,args.data)
            return Lib.sendResponse(allNotifications);
              
        },
        async getAllNotificationsForDotCom(root, args, context, info){
            let userId = context.user.id;
            if(context.user.userType !== "admin") {
                return Lib.sendResponse({
                    error:true,
                    message:"permissionDenied",
                    ErrorClass:ErrorModules.DenialError,
                    statusCode:Lib.getHttpErrors('FORBIDDEN')
                });
            }
            const allNotifications = await Services.UserService.getAllNotificationsForDotComService(userId,args.data)
            return Lib.sendResponse(allNotifications);
              
        },

        async getNotificationSettings(root, args, context, info){
            const userId = context.user.id;
            const deviceType = args.data.deviceType.toLowerCase();
            const allNotifications = await Services.NotificationService.getNotificationSettings(userId,deviceType);
            return Lib.sendResponse(allNotifications);
              
        }
    },
    Mutation:{
        async notificationSettings(root, args, context, info){
            let userId = context.user.id;
            const notificationSettings = await Services.NotificationService.notificationSettings(userId, args.data);
            return Lib.sendResponse(notificationSettings);
        },
        async testNotification(root, args, context, info) {
            try {
                const { token, body, title } = args.data;
                
                const payload = {
                    notification: {
                        title: title,
                        body: body
                    }
                };

            const abc = await Services.NotificationService.pushNotification(token, payload);
                return {
                    error: !abc.staus,
                    systemCode: "SUCCESS",
                    code: 200,
                    message: abc.err.toString(),
                };

            } catch (err) {
                console.error(err);
                return {
                    error: true,
                    systemCode: "ERROR_SENDING_NOTIFICATION",
                    code: 500,
                    message: err.message || "Error occurred while sending the notification."
                };
            }
        },
        async dotComNotificationSeen(root, args, context, info) {
            if(context.user.userType !== "admin") {
                return Lib.sendResponse({
                    error:true,
                    message:"permissionDenied",
                    ErrorClass:ErrorModules.DenialError,
                    statusCode:Lib.getHttpErrors('FORBIDDEN')
                });
            }
            const result = await Services.NotificationService.dotComNotificationSeen();
            return Lib.sendResponse(result);
        }
    }
}