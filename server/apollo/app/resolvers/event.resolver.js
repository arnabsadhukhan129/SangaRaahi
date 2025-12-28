const Services = require("../services");
const ErrorModules = require("../errors");
module.exports = {
  Query: { 

    async getAllEvents(root, args, context, info) { 
      const events = await Services.EventService.getAllEvents(args.data); 
      const result = Lib.reconstructObjectKeys(events.data, ["rsvp_end_time","to","from"], Lib.convertDate); 
      if(result.error) {
        return Lib.sendResponse(result);
      }
      let allEvents = {
        total:events.total,
        events:result,
        loggeduser:context.user.id
      }
      return Lib.resSuccess("",allEvents);
    }, 

    async getEventDetails(root, args,context) { 
      let id = args.data.id;
      const userId = context.user.id;
      const eventD = await Services.EventService.getEventByID(id);
      if(eventD.error) {
        return Lib.sendResponse(eventD);
      }
      
      const event = eventD.data;
      let role = 'user';
      if(event.community_id && context.user.userType !== "admin") {
        const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), event.community_id);
        if (!userCommunity.error) {
          role = userCommunity.data.role;
        }
        const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
        
        if(role === ROLES_ENUM.fan && event.invitation_type === "Members") {
          return Lib.sendResponse({
            error:true,
            message:"permissionDenied",
            ErrorClass:ErrorModules.AuthError,
            statusCode:Lib.getHttpErrors('FORBIDDEN')
          });
        }else if(event.invitation_type === "Private") {
          let isRsvp = await Services.EventService.isRsvpOfEvent(id,userId);
          if(isRsvp.error) {
            return Lib.sendResponse(isRsvp);
          }
        }
      }
      const eventDetails = await Services.EventService.getEventDetails(id,userId,role); 
      return Lib.sendResponse(eventDetails); 
    },
      
    async getEventDetailsForApp(root, args,context) { 
      let id = args.data.id;
      const userId = context.user.id;
      const eventD = await Services.EventService.getEventByID(id);
      if(eventD.error) {
        return Lib.sendResponse(eventD);
      }
      
      const event = eventD.data;
      if(event.community_id && context.user.userType !== "admin") {
        const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), event.community_id);
        const role = userCommunity.data.role;
        const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
        
        if(role === ROLES_ENUM.fan && event.invitation_type === "Members") {
          return Lib.sendResponse({
            error:true,
            message:"permissionDenied",
            ErrorClass:ErrorModules.AuthError,
            statusCode:Lib.getHttpErrors('FORBIDDEN')
          });
        }else if(event.invitation_type === "Private") {
          let isRsvp = await Services.EventService.isRsvpOfEvent(id,userId);
          if(isRsvp.error) {
            return Lib.sendResponse(isRsvp);
          }
        }
      }
      const eventDetails = await Services.EventService.getEventDetailsForApp(id,userId);
      return Lib.sendResponse(eventDetails); 
    },
    async getEventDetailsForPublic(root, args,context) { 
      let id = args.data.id;
      const userId = context.user.id;
      const eventD = await Services.EventService.getEventByID(id);
      if(eventD.error) {
        return Lib.sendResponse(eventD);
      }
      
      const event = eventD.data;
      let role = 'user';
      if(event.community_id && context.user.userType !== "admin") {
        const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), event.community_id);
        if (!userCommunity.error) {
          role = userCommunity.data.role;
        }
        const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
        
        if(role === ROLES_ENUM.fan && event.invitation_type === "Members") {
          return Lib.sendResponse({
            error:true,
            message:"permissionDenied",
            ErrorClass:ErrorModules.AuthError,
            statusCode:Lib.getHttpErrors('FORBIDDEN')
          });
        }else if(event.invitation_type === "Private") {
          let isRsvp = await Services.EventService.isRsvpOfEvent(id,userId);
          if(isRsvp.error) {
            return Lib.sendResponse(isRsvp);
          }
        }
      }
      const eventDetails = await Services.EventService.getEventDetailsForPublic(id,userId,role); 
      return Lib.sendResponse(eventDetails); 
    },
    async getEventByID(root, {id}) { 
      const event = await Services.EventService.getEventByID(id); 
      if(event.error) {
        return Lib.sendResponse(event);
      }
      let result = Lib.reconstructObjectKeys(event.data,["rsvp_end_time","to","from"], Lib.convertDate); 
      return Lib.resSuccess("", result); 
    },

    async getAdminEventByID(root, {id}) { 
      const event = await Services.EventService.getAdminEventByID(id); 
      if(event.error) {
        return Lib.sendResponse(event);
      }
      let result = Lib.reconstructObjectKeys(event.data,["rsvp_end_time","to","from"], Lib.convertIsoDate); 
      return Lib.resSuccess("", result); 
    },
    
    async getViewEvents(root, args, context, info) {
      const userId = context.user.id;
      let role = 'user';
      const search = args.data && args.data.search ? args.data.search : '';
      const filter = args.data && args.data.filter ? args.data.filter : '';
      const Invitetype = args.data && args.data.Invitetype ? args.data.Invitetype : [];
      const paymentStatus = args.data && args.data.paymentStatus ? args.data.paymentStatus : '';
      const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), '');
      let communityId;
      if(userCommunity.error) {
        if (Lib.isEmpty(args.data.communityId)) {
          throw new ErrorModules.ValidationError(Lib.translate("fieldIDRequired"));
        }
        communityId = args.data.communityId;
      } else {
        communityId = userCommunity.data.community._id;
        role = userCommunity.data.role;
      }
      const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
      // const role = userCommunity.data.role;
      let type
      if(role === ROLES_ENUM.fan) {
        type = ["Public","Members"]
      }else {
        type = ["Public", "Members"]
      }

      const events = await Services.EventService.getViewEvents(context,userId, communityId, type, search, filter,Invitetype,paymentStatus);
      if(events.error) {
        return Lib.sendResponse(events);
      }
      const result = Lib.reconstructObjectKeys(events.data, ["rsvp_end_time","to","from"], Lib.convertIsoDate);
      
      return Lib.resSuccess("", result);
    },

    async getRsvpList(root, args, context, info) {
      const params = args.data;
      const userId = context.user.id;
      const event = await Services.EventService.getEventByID(params.eventId); 
      if(event.error) {
        return Lib.sendResponse(event);
      }
      
      const isRsvp = await Services.EventService.isRsvpOfEvent(params.eventId,userId,true); 
      if(isRsvp.error) {
        return Lib.sendResponse(isRsvp);
      }
      
      
      const rsvp = await Services.EventService.getRsvpList(params); 
      if(rsvp.error) {
        return Lib.sendResponse(rsvp);
      }
      let isHost;
      if(event.data.host_id.toString() === userId) {
        isHost = true;
      }else{
        isHost = false;
      }
      
      const result = {
        isHost:isHost,
        loginId:userId,
        rsvps:  Lib.reconstructObjectKeys(rsvp.data)
      };
      return Lib.resSuccess("", result);
    },
    
    async getRsvpMemberList(root, args, context, info) {
      const params = args.data;
      const userId = context.user.id;
      const event = await Services.EventService.getEventByID(params.eventId); 
      if(event.error) {
        return Lib.sendResponse(event);
      }
      
      const rsvp = await Services.EventService.getRsvpList(params); 
      if(rsvp.error) {
        return Lib.sendResponse(rsvp);
      }
      let isHost;
      if(event.data.host_id.toString() === userId) {
        isHost = true;
      }else{
        isHost = false;
      }
      
      const result = {
        isHost:isHost,
        loginId:userId,
        rsvps:  Lib.reconstructObjectKeys(rsvp.data)
      };
      return Lib.resSuccess("", result);
    },

    async getEventPhotos(root, args, context, info) {
      const id = args.data.id;
      const result = await Services.EventService.getEventPhotos(id);
      return Lib.sendResponse(result);
    },
    async getAvalibleUsersForEvent(root, args, context, info) {
      const member = await Services.EventService.getAvalibleUsersForEvent(args.data);
      // console.log(member,"member........");
      let result = Lib.reconstructObjectKeys(member.data);
      return Lib.resSuccess("", result);
    },

  }, 
  Mutation: { 
    /** 
     * ==> CRUD Operation of Event 
     */ 
    async createEvent(root, args, context, info) { 
      let user = context.user; 
      const data = args.data;
      const invitationType = data.invitationType;
      let communityId;
      let eligbleRoles = [];

      const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');

      if(invitationType === "Private") {
        eligbleRoles = [ROLES_ENUM.fan];
      }else{
        eligbleRoles = [ROLES_ENUM.fan, ROLES_ENUM.member];
      }
      
      if(context.user.userType !== "admin") {
        const userCommunity = await Services.UserService.getUserCommunityPortalDetails(context.getAuthUserInfo(), '');
        if(userCommunity.error) {
            return Lib.sendResponse(userCommunity);
        }
        // Now check if the role is allowed to fetch the details
        
        if(eligbleRoles.includes(userCommunity.data.role)) {
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
      let result;
      if(data.recurringEvent) {
        result = await Services.EventService.createRecurringEvent(user, data, communityId); 
      }else{
        result = await Services.EventService.createEvent(user, data, communityId); 
      }
      return Lib.sendResponse(result);
        
    },

    async updateEvent(root, args, context, info) { 
      const id = args.data.id; 
      const event = await Services.EventService.getAdminEventByID(id); 
      if(event.error === true) {
        return Lib.sendResponse(event);
      }
      if(context.user.userType !== "admin") {
        if(event.data.host_id.toString() !== context.user.id) {
          return Lib.sendResponse({error: true, message: "Only event host can perform this action.", ErrorClass: ErrorModules.AuthError});
        }
      }
      let result = await Services.EventService.updateEvent( 
        id, 
        args.data, 
        context 
      ); 
      return Lib.sendResponse(result); 
    }, 
      
    async deleteEvent(root, args, context, info) { 
      const id = args.id; 
        const UserId = context.user.id; 
        let result = await Services.EventService.deleteEvent(id,UserId); 
        return Lib.resSuccess("eventDeleteSuccess"); 
    }, 

    async respondOrEditRSVP(root, args, context, info) {
      const params = args.data;
      let userId = params.userId;
      if(Lib.isEmpty(userId)) {
        userId = context.user.id;
      }else{
        const event = await Services.EventService.getEventByID(params.eventId); 
        if(event.error === true) {
          return Lib.sendResponse(event);
        }
        if(event.data.host_id.toString() !== context.user.id) {
          return Lib.sendResponse({error: true, message: "Only event host can perform this action.", ErrorClass: ErrorModules.AuthError});
        }
      }

      const result = await Services.EventService.respondOrEditRSVP(params, userId); 
      return Lib.sendResponse(result);
    },
    
    async privateEventInvite(root, args, context, info) {
      const params = args.data;
      let userId = context.user.id;
      const ids = params.userIds;
      const event = await Services.EventService.getEventByID(params.eventId); 
      if(event.error) {
        return Lib.sendResponse(event);
      }
      if(event.data.host_id.toString() !== userId) {
        return Lib.sendResponse({error: true, message: "Only event host can perform this action.", ErrorClass: ErrorModules.AuthError});
      }
      
      const result = await Services.EventService.privateEventInvite(params); 
      return Lib.sendResponse(result);
    },

    
    async cancelEvent(root, args, context, info) {
      const params = args.data;
      let userId = context.user.id;
      const id = params.id;
      const userCommunity = await Services.UserService.getUserCommunityPortalDetails(context.getAuthUserInfo(), '');
      if(userCommunity.error) {
          return Lib.sendResponse(userCommunity);
      }
      communityId = userCommunity.data.community._id;
      
      const result = await Services.EventService.cancelEvent(id,communityId,userId); 
      return Lib.sendResponse(result);
    },

    async eventStatusChange(root, args, context, info) {
      const userId = context.user.id;
      if(context.user.userType === "admin") {
        const result = await Services.EventService.eventStatusChange( args.id, userId );
        return Lib.sendResponse(result);
      }else {
        return Lib.sendResponse({
          error:true,
          message:"permissionDenied",
          ErrorClass:ErrorModules.AuthError,
          statusCode:Lib.getHttpErrors('FORBIDDEN')
        });
      }
    },

    async acceptOrRejectEvent(root,args,context,info) {
      const data = args.data;
      const userId = context.user.id;
      const eventId = data.eventId;
      let force_join = false;

      const eventD = await Services.EventService.getEventByID(eventId);
      if(eventD.error) {
        return Lib.sendResponse(eventD);
      }
      const event = eventD.data;

      const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), event.community_id);
      if(userCommunity.error) {
        return Lib.sendResponse(userCommunity);
      }

      data.role = userCommunity.data.role;

      data.force_join = force_join;

      let result = await Services.EventService.acceptOrRejectEvent(userId,data);
      return Lib.sendResponse(result);
    },

    async updateUserRsvp(root, args, context, info) {
      const data = args.data;
      const userId = data.userId;
      const eventId = data.eventId;
      const userType = data.userType;
      
      const eventCheck = await Services.EventService.getEventByID(eventId);
      if(eventCheck.error) {
        return Lib.sendResponse(eventCheck);
      }

      const event = eventCheck.data;

      const userCommunity = await Services.UserService.getUserCommunityPortalDetails(context.getAuthUserInfo(), event.community_id);
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
          ErrorClass:ErrorModules.AuthError,
          statusCode:Lib.getHttpErrors('FORBIDDEN')
        });
      }

      data.role = userCommunity.data.role;

      // Condition based on userType
      let result;
      if (userType === 'activeuser' || userType === 'passiveuser') {
          // Logic for registered users
          result = await Services.EventService.acceptOrRejectEvent(userId, data);
      } else if (userType === 'webvisitor') {
          // Logic for web visitors
          result = await Services.EventOrganizationService.acceptOrRejectOrgEvent(data);
      } else {
          return Lib.sendResponse({
              error: true,
              message: "Invalid userType",
              ErrorClass: ErrorModules.ValidationError,
              statusCode: Lib.getHttpErrors('BAD_REQUEST')
          });
      }
      return Lib.sendResponse(result);
    },
    
    async removeGroupOrMemberEvent(root,args,context,info) {
      const data = args.data;
      const eventId = args.data.eventId;
      const event = await Services.EventService.getAdminEventByID(eventId); 
      if(event.error === true) {
        return Lib.sendResponse(event);
      }
      if(context.user.userType !== "admin") {
        if(event.data.host_id.toString() !== context.user.id) {
          return Lib.sendResponse({error: true, message: "Only event host can perform this action.", ErrorClass: ErrorModules.AuthError});
        }
      }
      let result = await Services.EventService.removeGroupOrMemberEvent(eventId,data,context);
      return Lib.sendResponse(result);
    },

    async eventAttendingAlert(root,args,context,info) {
      const data = args.data;
      const userId = context.user.id;
      const eventId = data.id;
      
      const otherEventCheck = await Services.EventService.eventAttendingAlert(userId,eventId);
      if(otherEventCheck.error) {
        return Lib.sendResponse(otherEventCheck);
      } else {
        return otherEventCheck;
      }
    },
    
    async cancelRsvp(root,args,context,info) {
      const data = args.data;
      const userId = context.user.id;
      
      const otherEventCheck = await Services.EventService.cancelRsvp(userId,data);
      return Lib.sendResponse(otherEventCheck);
    },

    async editRecurringEvent(root, args, context, info) { 
      let user = context.user; 
      const data = args.data;
      const invitationType = data.invitationType;
      let communityId;
      let eligbleRoles = [];

      const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');

      if(invitationType === "Private") {
        eligbleRoles = [ROLES_ENUM.fan];
      }else{
        eligbleRoles = [ROLES_ENUM.fan, ROLES_ENUM.member];
      }
      
      if(context.user.userType !== "admin") {
        const userCommunity = await Services.UserService.getUserCommunityPortalDetails(context.getAuthUserInfo(), '');
        if(userCommunity.error) {
            return Lib.sendResponse(userCommunity);
        }
        // Now check if the role is allowed to fetch the details
        
        if(eligbleRoles.includes(userCommunity.data.role)) {
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
      const result = await Services.EventService.editRecurringEvent(user, data, communityId); 
      
      return Lib.sendResponse(result);
    },
  }  
}; 
