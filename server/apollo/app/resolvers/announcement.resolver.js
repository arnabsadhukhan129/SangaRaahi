const BookData = require('../../books.json');
const Services = require('../services');
const ErrorModules = require('../errors');
/**
 * Here write your main logic
 */
module.exports = {
    Query:{
        async getAllAnnouncement(root, args, context, info) {
            if(context.user.userType !== "admin") {
                return Lib.sendResponse({
                    error:true,
                    message:"permissionDenied",
                    ErrorClass:ErrorModules.DenialError,
                    statusCode:Lib.getHttpErrors('FORBIDDEN')
                });
            }
            const announcement = await Services.AnnouncementService.getAnnouncements(args.data);
            if(announcement.error) {
                return Lib.sendResponse(announcement);
            }
            const result = Lib.reconstructObjectKeys(announcement.data, "end_date", Lib.convertDate);
            let AllAnnouncement = {
                total:announcement.total,
                announcements:result
              }
            
            return Lib.resSuccess("", AllAnnouncement);
        },
        async getAnnouncementByID(root, {id}) {
            const announcement = await Services.AnnouncementService.getAnnouncementByID(id);
            if(announcement.error) {
                return Lib.sendResponse(announcement);
            }
            let result = Lib.reconstructObjectKeys(announcement.data, "end_date", Lib.convertDate);
            return Lib.resSuccess("", result);
        },
        async getViewAnnouncements(root, args, context, info) {
            const userId = context.user.id;

            const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), '');
            if(userCommunity.error) {
                return Lib.sendResponse(userCommunity);
            }
            const role = userCommunity.data.role;
            const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
            let type;
            if(role === ROLES_ENUM.fan) {
                type = ["Public"];
            }else {
                type = ["Public","Member"];
            }
            const communityId = userCommunity.data.community._id;

            const announcement = await Services.AnnouncementService.getViewAnnouncements(userId, communityId, type);
            
            let result = Lib.reconstructObjectKeys(announcement.data, "end_date", Lib.convertDate);
            return Lib.resSuccess("", result);
        }

    },
    Mutation:{
        async createAnnouncement(root, args, context, info) {
            const data = args.data;
            const id = context.user.id;
            let communityId;
            // User-based announcement creation with role permission 
            if(context.user.userType !== "admin") {
                const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), '');
                if(userCommunity.error) {
                    return Lib.sendResponse(userCommunity);
                }
                // Now check if the role is allowed to fetch the details
                const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
                if([ROLES_ENUM.fan, ROLES_ENUM.member].includes(userCommunity.data.role)) {
                    // Not allowed as fan or member
                    return Lib.sendResponse({
                    error:true,
                    message:"permissionDenied",
                    ErrorClass:ErrorModules.DenialError,
                    statusCode:Lib.getHttpErrors('FORBIDDEN')
                    });
                }
                communityId = userCommunity.data.community._id;
                
            }else {
                if(Lib.isEmpty(data.communityId)) {
                     return Lib.sendResponse({error: true, message: "fieldCommunityIdRequired",ErrorClass: ErrorModules.Api404Error});
                }else {
                    const community = await Services.CommunityService.getCommunityByID(data.communityId);
                    if(Lib.isEmpty(community.data)) {
                        return Lib.sendResponse({error: true, message: "noCommunityFound",ErrorClass: ErrorModules.Api404Error});
                    }
                    communityId = data.communityId;
                }
            }

            if(!Lib.isEmpty(data.groupId)) {
                const group = await Services.GroupService.getGroupByID(data.groupId);
                if(group.data) {
                    if(group.data.community_id.toString() === communityId.toString()) {
                    } else {
                         return Lib.sendResponse({error: true, message: "groupDoesNotBelongToSelectedCommunity",ErrorClass: ErrorModules.Api404Error});
                    }
                }else{
                     return Lib.sendResponse({error: true, message: "No group found.",ErrorClass: ErrorModules.Api404Error});
                }
            }
            
            let result = await Services.AnnouncementService.createAnnouncement( data, id, communityId);
            return Lib.sendResponse(result);
        },

        async updateAnnouncement(root, args, context, info) {
            const data = args.data;
            const id = args.id;
            const user = context.user;
            let result = await Services.AnnouncementService.updateAnnouncement(id,data,user);
            return Lib.resSuccess("announcementUpdateSuccess");
        },

        async deleteAnnouncement(root, args, context, info) {
            if(context.user.userType !== "admin") {
                return Lib.sendResponse({
                    error:true,
                    message:"permissionDenied",
                    ErrorClass:ErrorModules.DenialError,
                    statusCode:Lib.getHttpErrors('FORBIDDEN')
                });
            }
            const id = args.id;
            const UserId = context.user.id;
            let result = await Services.AnnouncementService.DeleteAnnouncement(id,UserId);
            return Lib.resSuccess("announcementDeleteSuccess");
            
        },

        async announcementStatusChange(root, args, context, info) {
            if(context.user.userType !== "admin") {
                return Lib.sendResponse({
                    error:true,
                    message:"permissionDenied",
                    ErrorClass:ErrorModules.DenialError,
                    statusCode:Lib.getHttpErrors('FORBIDDEN')
                });
            }
            const result = await Services.AnnouncementService.announcementStatusChange(args.id);
            return Lib.sendResponse(result);
        },

    }
}