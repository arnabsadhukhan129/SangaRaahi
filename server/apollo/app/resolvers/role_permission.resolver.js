const Services = require('../services');

module.exports = {
    Query : {
        async getRolePermissions(root,args,context,info) {
            const result = await Services.RolePermissionService.getRolePermissions(args.data);
            return Lib.sendResponse(result);
        },
        
        async getCommunityCreatedRoles(root,args,context,info) {
            const communityId = context.user.selectedOrganizationPortal;
            const result = await Services.RolePermissionService.getCommunityCreatedRoles(args.data, communityId);
            if(result.error) {
                return Lib.sendResponse(result);
            }
            let Allresult = {
                total:result.total,
                from:result.from,
                to:result.to,
                roles:result.data
            }
            
            return Lib.resSuccess("", Allresult);
        },

        async getUnAssignedMembers(root,args,context,info) {
            const communityId = context.user.selectedOrganizationPortal;
            const result = await Services.RolePermissionService.getUnAssignedMembers(communityId);
            return Lib.sendResponse(result);            
        },
        
        async getUsherAssignedMembers(root,args,context,info) {
            const communityId = context.user.selectedOrganizationPortal;
            const result = await Services.RolePermissionService.getUsherAssignedMembers(args.data, communityId);
            return Lib.sendResponse(result);            
        },
    },
    Mutation : {
        async updateRolePermissions(root,args,context,info) {
            const result = await Services.RolePermissionService.updateRolePermissions(args.data);
            return Lib.sendResponse(result);
        },
        
        async addCommunityRole(root,args,context,info) {
            const communityId = context.user.selectedOrganizationPortal;            
            const result = await Services.RolePermissionService.addCommunityRole(args.data, communityId);
            return Lib.sendResponse(result);
        },
        async assignUsherRole(root,args,context,info) {
            const communityId = context.user.selectedOrganizationPortal;            
            const result = await Services.RolePermissionService.assignUsherRole(args.data, communityId);
            return Lib.sendResponse(result);
        }
    }
}