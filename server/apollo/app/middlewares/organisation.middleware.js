const ErrorModules = require('../errors');
const User = Lib.Model('Users');
const Communities = Lib.Model('Communities');
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
module.exports = {
    organisationPermissionCheck: async function(resolve, root, args, context, info) {
        const organisationPermissionRequests = Lib.getAppConfig('SELECTED_ORGANIZATION_PERMISSION_ROUTES', []);
        if(organisationPermissionRequests.includes(info.fieldName) && context.user.userType !== "admin") {
            const user = await User.findOne({ "_id": ObjectId(context.user.id) ,"is_active":true,"is_deleted":false});
            if(!user.selected_organization_portal){
                throw new ErrorModules.AuthError(Lib.translate("userNoDefaultCommunityPortal"), 403);
                
            }else{
                const community = await Communities.aggregate([
                    {
                        $match:{
                            _id: new ObjectId(user.selected_organization_portal),
                            is_active: true,
                            is_deleted:false
                        }
                    },
                    {
                        $unwind:{
                            path:"$members"
                        }
                    },
                    {
                        $match:{
                            "members.member_id": new ObjectId(context.user.id),
                            'members.is_deleted' : false,
                            'members.is_active' : true,
                            'members.is_approved' : true,
                            'members.is_leaved' : false,
                        }
                    }
                ]);

                if(Lib.isEmpty(community)) {
                    throw new ErrorModules.AuthError(Lib.translate("noCommunityFound"), 403);
                }
                if(Lib.isEmpty(community[0].members)) {
                    throw new ErrorModules.AuthError(Lib.translate("notACommunityMember"), 403);
                }
                const currentMemberRoleCount = community[0].members['roles'].length;
                
                const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
                if (currentMemberRoleCount > 1) {
                    context.user.selectedOrganizationPortal = user.selected_organization_portal.toString();
                    return resolve(root, args, context, info);
                } else {
                    const currentMemberRole = community[0].members['roles'][0];
                    
                    if([ROLES_ENUM.fan, ROLES_ENUM.member].includes(currentMemberRole)) {
                        throw new ErrorModules.AuthError(Lib.translate("permissionDenied"), 403);
                    }else{
                        context.user.selectedOrganizationPortal = user.selected_organization_portal.toString();
                        return resolve(root, args, context, info);
                    }
                }
            }
        }
        return resolve(root, args, context, info);
    }
}