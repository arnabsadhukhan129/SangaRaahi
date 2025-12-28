const Services = require('../services');
const ErrorModules = require('../errors')

module. exports = {
    Mutation : {
        async addOrUpdateDistance(root, args, context, info) {
            const userId = context.user.id;
            const data = args.data;
            // if(context.user.userType !== "admin") {
            //     return Lib.sendResponse({
            //         error:true,
            //         message:"permissionDenied",
            //         ErrorClass:ErrorModules.DenialError,
            //         statusCode:Lib.getHttpErrors('FORBIDDEN')
            //     });
            // }
            const result = await Services.DistanceService.addOrUpdateDistance(data, userId);
            return Lib.sendResponse(result);
        }
    }
}