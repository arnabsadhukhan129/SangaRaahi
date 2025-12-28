const Services = require('../services');
const ErrorModules = require('../errors');
const Group = Lib.Model('Groups');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
/**
 * Here write your main logic
 */
module.exports = {
    Query:{
        async getAllGroup(root, args, context, info) {
            if( context.user.userType !== 'admin' ) {
                const userData = await Services.UserService.getUserCommunityDetails(context.user);
                if(userData.error) {
                    return Lib.sendResponse(userData);
                }
                if(Lib.isEmpty(userData.data.community) || Lib.isEmpty(userData.data.community._id.toString())) {
                    return Lib.sendResponse({error:true, message:"noDefaultCommunitySelected", ErrorClass:ErrorModules.Api404Error});
                }
            }
            
            // const community = await Services.CommunityService.getCommunityByID(userData.data.user.community._id.toString());
            // if(community.error) {
            //     return Lib.sendResponse(community);
            // }
            // Now check the role
            
            const Group = await Services.GroupService.getGroups(args.data,context.user);
            let result = Lib.reconstructObjectKeys(Group.data);
            let allGroups = {
                total:Group.total,
                groups:result,
                loggeduser:context.user.id
            }
            return Lib.resSuccess("",allGroups);
        },

        async getGroupByID(root, {id}, context) {

            const Group = await Services.GroupService.getGroupByID(id, context.user);
            let result = Lib.reconstructObjectKeys(Group.data);
            return Lib.resSuccess("",result);
        },
        
        async getAdminGroupByID(root, {id}, context) {
            const Group = await Services.GroupService.getAdminGroupByID(id, context.user);
            let result = Lib.reconstructObjectKeys(Group.data);
            return Lib.resSuccess("",result);
        },

        async groupViewDetails(root, args, context, info) {
            const groupId = args.data.id;
            const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), '');
            if(userCommunity.error) {
                return Lib.sendResponse(userCommunity);
            }
            // Now check if the role is allowed to fetch the details
            const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
            if([ROLES_ENUM.fan].includes(userCommunity.data.role)) {
                // Not allowed as fan or member
                return Lib.sendResponse({
                error:true,
                message:"permissionDenied",
                ErrorClass:ErrorModules.DenialError,
                statusCode:Lib.getHttpErrors('FORBIDDEN')
                });
            }
            const communityId = userCommunity.data.community._id;

            const userId = context.user.id;

            const groupData = await Services.GroupService.getGroupByID(groupId, context.user);
            if(groupData.error) {
                return Lib.sendResponse(groupData);
            }
            const groupType = groupData.data['type'];
            let group;
            if(groupType === Lib.getEnum("GROUP_TYPE.Stealth")) {
                // Stealth
                group = await Services.GroupService.getStealthGroupInfo(groupId,communityId,userId);
            } else {
                // Non-Stealth
                group = await Services.GroupService.getNonStealthGroupInfo( groupId, communityId, userId );
            }

            let result = Lib.reconstructObjectKeys(group.data);
            let isJoined = groupType === Lib.getEnum("GROUP_TYPE.Stealth");
            if(!Lib.isEmpty(group.groupRole) && groupType !== Lib.getEnum("GROUP_TYPE.Stealth")) {
                isJoined = true;
            }
            // @Deprecated
            // const group = await Services.GroupService.groupViewDetails(groupId,communityId);
            // let result = Lib.reconstructObjectKeys(group.data);

            return Lib.resSuccess("",{
                group : result,
                communityRole : Lib.toTitleCase(userCommunity.data.role, "_", false, " ") ,
                communityRoleKey : userCommunity.data.role,
                groupRole : group.groupRole ? Lib.toTitleCase(group.groupRole, "_", false, " ") : "",
                groupRoleKey : group.groupRole ? group.groupRole : "",
                isJoined : isJoined
            });
        },

        async getMembersById(root, {id}) {
            const member = await Services.GroupService.getMembersById(id);
            let result = Lib.reconstructObjectKeys(member.data);
            return Lib.resSuccess("",result);
        },

        async getAvailableUser(root, {id}) {
            const member = await Services.GroupService.getAvailableUser(id);
            let result = Lib.reconstructObjectKeys(member.data);
            return Lib.resSuccess("",result);
        },

        async getAvailableCommunityUser(root, {id}) {
            const member = await Services.GroupService.getAvailableCommunityUser(id);
            let result = Lib.reconstructObjectKeys(member.data);
            return Lib.resSuccess("",result);
        },

        async getNonStealthGroup(root, args, context, info) {
            const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), '');
            if(userCommunity.error) {
                return Lib.sendResponse(userCommunity);
            }
            // Now check if the role is allowed to fetch the details
            const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
            if([ROLES_ENUM.fan].includes(userCommunity.data.role)) {
                // Not allowed as fan or member
                return Lib.sendResponse({
                error:true,
                message:"permissionDenied",
                ErrorClass:ErrorModules.DenialError,
                statusCode:Lib.getHttpErrors('FORBIDDEN')
                });
            }
            const communityId = userCommunity.data.community._id;
            const userId = context.user.id;
            const group = await Services.GroupService.getNonStealthGroup(userId,args.data,communityId);
            let result = Lib.reconstructObjectKeys(
                group.data,
                ["created_at", "updated_at", "expired_at","owner_details"],
                function(data,key) {
                    if(["created_at", "updated_at", "expired_at"].includes(key)) {
                        return Lib.convertDate(data);
                    }else if (key === "owner_details") {
                        return {
                            id:data._id,
                            name:data.name,
                            email:data.contact.email.address,
                            phone:data.contact?.phone?.number,
                            image:data?.profile_image,
                        }
                    }
                }
              );
            return Lib.resSuccess("",result);
        },

        async getStealthGroup(root, args, context, info) {
            const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), '');
            if(userCommunity.error) {
                return Lib.sendResponse(userCommunity);
            }
            // Now check if the role is allowed to fetch the details
            const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
            if([ROLES_ENUM.fan].includes(userCommunity.data.role)) {
                // Not allowed as fan or member
                return Lib.sendResponse({
                error:true,
                message:"permissionDenied",
                ErrorClass:ErrorModules.DenialError,
                statusCode:Lib.getHttpErrors('FORBIDDEN')
                });
            }
            const communityId = userCommunity.data.community._id;
            const group = await Services.GroupService.getStealthGroup(args.data,communityId,context.user);
            let result = Lib.reconstructObjectKeys(group.data);
            return Lib.resSuccess("",result);
        },
        
        async discoverGroupList(root, args, context, info) {
            /**
             * ===> Get the groups that the user does not belongs to & are in the same community as the user belongs and now currently selected
             * 1. Get the user current community details
             * 2. Check the details
             * 3. Get the groups list.
             * 4. Check for any error
             * 5. Return the response according to it or with group data.
             */
            try {
                const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), args.data ? args.data.communityId : null);
                if(userCommunity.error) {
                    return Lib.sendResponse(userCommunity);
                }
                if(Lib.isEmpty(userCommunity.data.community)) {
                    return Lib.sendResponse({error:true, ErrorClass:ErrorModules.Api404Error, message:"noDefaultCommunitySelected"});
                }
                const groups = await Services.GroupService.discoverGroupList(userCommunity.data.community._id.toString(), context.user.id,
                    args.data.search, args,data.page, args.data.limit || 10);
                return Lib.sendResponse(groups);
            } catch (e) {
                // any unknown error occurred
                // Send the fatal error
                return Lib.sendResponse({
                    error:true,
                    statusCode: Lib.getHttpErrors('SERVER_ERROR'),
                    e
                });
            }
        },
        
        async getMyGroups(root, args, context, info) {
            const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), '');
            if(userCommunity.error) {
                return Lib.sendResponse(userCommunity);
            }
            // Now check if the role is allowed to fetch the details
            const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
            if([ROLES_ENUM.fan].includes(userCommunity.data.role)) {
                // Not allowed as fan or member
                return Lib.sendResponse({
                error:true,
                message:"permissionDenied",
                ErrorClass:ErrorModules.DenialError,
                statusCode:Lib.getHttpErrors('FORBIDDEN')
                });
            }
            const communityId = userCommunity.data.community._id;
            const group = await Services.GroupService.getMyGroups(args.data,communityId,context.user);
            let result = Lib.reconstructObjectKeys(group.data);
            return Lib.resSuccess("",result);
        },

        async getNonStealthGroupInfo(root, args, context, info) {
            try {
                const groupId = args.data.id;
                const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), '');
                if(userCommunity.error) {
                    return Lib.sendResponse(userCommunity);
                }
                // Now check if the role is allowed to fetch the details
                const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
                if([ROLES_ENUM.fan].includes(userCommunity.data.role)) {
                    // Not allowed as fan or member
                    return Lib.sendResponse({
                    error:true,
                    message:"permissionDenied",
                    ErrorClass:ErrorModules.DenialError,
                    statusCode:Lib.getHttpErrors('FORBIDDEN')
                    });
                }
                const communityId = userCommunity.data.community._id;
                const userId = context.user.id;
                const group = await Services.GroupService.getNonStealthGroupInfo( groupId, communityId, userId );
                let result = Lib.reconstructObjectKeys(group.data);
                let groupRole = '';
                let groupRoleKey = '';
                let isJoined = false;
                if(!Lib.isEmpty(group.groupRole)) {
                    groupRole = Lib.toTitleCase(group.groupRole, "_", false, " ");
                    groupRoleKey = group.groupRole;
                    isJoined = true;
                }
                return Lib.resSuccess("",
                {
                    group : result, 
                    communityRole : Lib.toTitleCase(userCommunity.data.role, "_", false, " ") ,
                    communityRoleKey : userCommunity.data.role,
                    groupRole : groupRole, 
                    groupRoleKey : groupRoleKey, 
                    isJoined : isJoined
                });
            } catch (e) {
              return e;
            }
        },
        
        async getStealthGroupInfo(root, args, context, info) {
            try {
                const groupId = args.data.id;
                const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), '');
                if(userCommunity.error) {
                    return Lib.sendResponse(userCommunity);
                }
                // Now check if the role is allowed to fetch the details
                const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
                if([ROLES_ENUM.fan].includes(userCommunity.data.role)) {
                    // Not allowed as fan or member
                    return Lib.sendResponse({
                        error:true,
                        message:"permissionDenied",
                        ErrorClass:ErrorModules.DenialError,
                        statusCode:Lib.getHttpErrors('FORBIDDEN')
                    });
                }
                const communityId = userCommunity.data.community._id;
                const userId = context.user.id;
                const group = await Services.GroupService.getStealthGroupInfo(groupId,communityId,userId);
                let result = Lib.reconstructObjectKeys(group.data);
                return Lib.resSuccess("",
                {
                    group : result, 
                    communityRole : Lib.toTitleCase(userCommunity.data.role, "_", false, " "),
                    communityRoleKey : userCommunity.data.role,
                    groupRole : Lib.toTitleCase(group.groupRole, "_", false, " "), 
                    groupRoleKey : group.groupRole, 
                    isJoined: true
                });
            }catch (e) {
              return e;
            }
        },

        async groupMemberList(root, args, context, info) {
            let groupId = args.data.groupId;
            const memberType = args.data.memberType;
            const search = args.data.search;
            const result = await Services.GroupService.groupMemberList({groupId, memberType, search}, context.user, context.lang);
            const groupMembers = Lib.reconstructObjectKeys(result.data,["joined_at", "user"],function(value, key) {
              if(key === "joined_at") {
                return Lib.convertDate(value);
              } else if(key === "user") {
                return Lib.generalizeUser(value);
              }
            });
            
            return Lib.resSuccess(groupMembers);
        },

        async groupRequestList(root, args, context, info) {
            let search = args.data.search;
            let groupId = args.data.groupId;
            const result = await Services.GroupService.groupRequestList(context.user, search, groupId);
            return Lib.sendResponse(result);
        },

        async groupUserRole(root, args, context, info) {
            let groupId = args.data.id;
            const result = await Services.UserService.getUserGroupDetails(context.getAuthUserInfo(), groupId);
            return Lib.sendResponse(result);
        },
    },
    Mutation:{
        async createGroup(root, args, context, info) {
            const data = args.data;
            let id = context.user.id;
            let communityId = data.communityId;
            if(context.user.userType !== "admin") {
                const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), communityId);
                if(userCommunity.error) {
                    return Lib.sendResponse(userCommunity);
                }
                // Now check if the role is allowed to fetch the details
                const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
                if([ROLES_ENUM.fan].includes(userCommunity.data.role)) {
                    // Not allowed as fan or member
                    return Lib.sendResponse({
                        error:true,
                        message:"permissionDenied",
                        ErrorClass:ErrorModules.DenialError,
                        statusCode:Lib.getHttpErrors('FORBIDDEN')
                    });
                }
                communityId = userCommunity.data.community._id;
            }else{
                id = data.userId;
            }
            
            let result = await Services.GroupService.createGroupService({...data, communityId},id);
            return Lib.sendResponse(result);
        },

        async updateGroup(root, args, context, info) {
            const data = args.data;
            const id = args.id;
            const UserId = context.user.id;
            let result = await Services.GroupService.updateGroup(id,data,UserId);
            return Lib.sendResponse(result);
        },

        async deleteGroup(root, args, context, info) {
            const id = args.data.id;
            const UserId = context.user.id;
            const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
            if(context.user.userType !== "admin") {
                const permissionCheck = await Services.UserService.checkUserGroupPermission({
                    _user: context.getAuthUserInfo(),
                    groupId: id,
                    notPermitGroupRole:[ROLES_ENUM.member],
                    notPermitCommunityRole:[ROLES_ENUM.fan]
                });
                if(permissionCheck.error) {
                    return Lib.sendResponse(permissionCheck);
                }
            }
            
            let result = await Services.GroupService.deleteGroup(id,UserId);
            if(result.error) {
                return Lib.sendResponse(result);
            }
            return Lib.resSuccess("groupDeleteSuccess");
            
        },
        /**
         * For admin
         */
        async groupStatusChange(root, args, context, info) {
            const result = await Services.GroupService.groupStatusChange(args.id);
            if (result.error) {
              throw new result.ErrorClass(result.message);
            }
            return Lib.resSuccess("statusChangedSuccess", null);
        },
        
        async addGroupMember(root, args, context, info) {
            /**
             * 1. Get the user group info based on the group id
             * 2. Check for any group find error
             * 3. Get the community id from the group
             * 4. Get the user default community
             * 5. Check for any community related error.
             * 6. Check if the group that the user trying to add a member is part of the community that the user currently selected
             * 7. Check if the user meets the roles specified for the add member task.
             *  a. Community role must not be fan, should be above
             *  b. Group role must be owner
             * 8. Add member to the group
             */
            const data = args.data;
            const userId = context.user.id;
            const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
            if(context.user.userType !== "admin") {
                const permissionCheck = await Services.UserService.checkUserGroupPermission({
                    _user: context.getAuthUserInfo(),
                    groupId: data.id,
                    notPermitGroupRole:[ROLES_ENUM.member],
                    notPermitCommunityRole:[ROLES_ENUM.fan]
                });
                if(permissionCheck.error) {
                    return Lib.sendResponse(permissionCheck);
                }
            }
            
            let result = await Services.GroupService.addGroupMember(data, userId);
            return Lib.sendResponse(result);
        },
        
        async removeGroupMember(root, args, context, info) {
            const data = args.data;
            const id = data.groupId;
            const userId = context.user.id;
            const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
            if(context.user.userType !== "admin") {
                const permissionCheck = await Services.UserService.checkUserGroupPermission({
                    _user: context.getAuthUserInfo(),
                    groupId: id,
                    notPermitGroupRole:[ROLES_ENUM.member],
                    notPermitCommunityRole:[ROLES_ENUM.fan]
                });
                if(permissionCheck.error) {
                    return Lib.sendResponse(permissionCheck);
                }
            }
            const result = await Services.GroupService.removeGroupMember(data, userId);
            return Lib.sendResponse(result);
        },

        async groupJoinRequest(root, args, context, info) {
            const groupId = args.data.groupId;
            const UserId = context.user.id;
            // Now check if the role is allowed to fetch the details
            const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), '');
            if(userCommunity.error) {
                return Lib.sendResponse(userCommunity);
            }
            // Now check if the role is allowed to fetch the details
            const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
            if([ROLES_ENUM.fan].includes(userCommunity.data.role)) {
                // Not allowed as fan or member
                return Lib.sendResponse({
                    error:true,
                    message:"permissionDenied",
                    ErrorClass:ErrorModules.DenialError,
                    statusCode:Lib.getHttpErrors('FORBIDDEN')
                });
            }
            const result = await Services.GroupService.groupJoinRequest(groupId,UserId);
            return Lib.sendResponse(result);
        },

        async approveOrRejectGroupMemberRequest(root, args, context, info) {
            try {
              const data = args.data;
              data.user = context.user;
              const result = await Services.GroupService.approveOrRejectMemberRequest(data);
              return Lib.sendResponse(result);
            }catch (e) {
              return e;
            }
        },

        async leaveGroup(root, args, context, info) {
            const id = args.data.id;
            const UserId = context.user.id;
            const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
            const permissionCheck = await Services.UserService.checkUserGroupPermission({
                _user: context.getAuthUserInfo(),
                groupId: id,
                //Owner can't leave
                notPermitGroupRole:[ROLES_ENUM.group_owner],
                notPermitCommunityRole:[ROLES_ENUM.fan]
            });
            if(permissionCheck.error) {
                return Lib.sendResponse(permissionCheck);
            }
            let result = await Services.GroupService.leaveGroup(id,UserId);
            return Lib.sendResponse(result);
        },
        

    }
}