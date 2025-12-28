const ErrorModules = require('../errors');
module.exports = {
    onlyAccessByAdmin: function(resolve, root, args, context, info) {
        const adminPermissionRequests = Lib.getAppConfig('ADMIN_PERMISSION_ROUTES', []);
        const userType = Lib.getAppConfig('USER_TYPE', {})['admin'] || 'admin';
        if(adminPermissionRequests.includes(info.fieldName)) {
            if(context.user.userType === userType) {
                return resolve(root, args, context, info);
            }
            // Error no permission denied. Not admin
            // For now only admin concept are done. If there is any sub-admin concept added then will add more logic here
            throw new ErrorModules.AuthError(Lib.translate("permissionDenied"), 403);
        }
        // The request does not need admin permission
        return resolve(root, args, context, info);
    }
}