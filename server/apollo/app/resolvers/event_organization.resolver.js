const Services = require("../services");
const ErrorModules = require("../errors");
const notificationHelper = require('../library/notifiaction.helper')
module.exports = {
  Query: {
    async getMyCommunityEvents(root, args, context, info) {
      let communityId;
      let role = 'user';
      if (args.data.communityId) {
        communityId = args.data.communityId;
      } else {
        communityId = context.user.selectedOrganizationPortal;
      }
      if(args.data.isAppPortal) {
        const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), communityId);
        if (!userCommunity.error) {
          role = userCommunity.data.role;
        }
        args.data.eventType = ['Public','Members'];
      }
      
      const events = await Services.EventOrganizationService.getMyCommunityEvents(args.data, communityId);
      const result = Lib.reconstructObjectKeys(events.data, ["rsvp_end_time", "to", "from", "created_at"], Lib.convertIsoDate);
      if (result.error) {
        return Lib.sendResponse(result);
      }
      let allEvents = {
        total: events.total,
        from: events.from,
        to: events.to,
        events: result,
        loggeduserRole: role
      }
      return Lib.resSuccess("", allEvents);
    },
    async getMyCommunityEventsList(root, args, context, info) {
      let communityId;
      let role = 'user';
      if (args.data.communityId) {
        communityId = args.data.communityId;
      } else {
        communityId = context.user.selectedOrganizationPortal;
      }
      if(args.data.isAppPortal) {
        const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), communityId);
        if (!userCommunity.error) {
          role = userCommunity.data.role;
        }
        args.data.eventType = ['Public','Members'];
      }
      
      const events = await Services.EventOrganizationService.getMyCommunityEventsList(args.data, communityId);
      const result = Lib.reconstructObjectKeys(events.data, ["rsvp_end_time", "to", "from", "created_at"], Lib.convertIsoDate);
      if (result.error) {
        return Lib.sendResponse(result);
      }
      let allEvents = {
        total: events.total,
        from: events.from,
        to: events.to,
        events: result,
        loggeduserRole: role
      }
      return Lib.resSuccess("", allEvents);
    },
    async getMyCommunityEventsForBlog(root, args, context, info) {
      const communityId = args.data.communityId;
      const events = await Services.EventOrganizationService.getMyCommunityEventsForBlog(args.data, communityId);
      const result = Lib.reconstructObjectKeys(events.data, ["rsvp_end_time", "to", "from", "created_at"], Lib.convertIsoDate);
      if (result.error) {
        return Lib.sendResponse(result);
      }
      let allEvents = {
        events: result
      }
      return Lib.resSuccess("", allEvents);
    },
    async getMyCommunityEventByID(root, { id }) {
      const event = await Services.EventService.getEventByID(id);
      if (event.error) {
        return Lib.sendResponse(event);
      }
      let result = Lib.reconstructObjectKeys(event.data, ["rsvp_end_time", "to", "from", "created_at"], Lib.convertIsoDate);
      return Lib.resSuccess("", result);
    },
    
    async getchildEventDetails(root, { id }) {
      const isChildEvent = true;
      const event = await Services.EventService.getEventByID(id,isChildEvent);
      if (event.error) {
        return Lib.sendResponse(event);
      }
      let result = Lib.reconstructObjectKeys(event.data, ["rsvp_end_time", "to", "from", "created_at"], Lib.convertIsoDate);
      return Lib.resSuccess("", result);
    },
    async getAvailableEventUser(root, { id }) {
      const member = await Services.EventOrganizationService.getAvailableEventUser(id);
      let result = Lib.reconstructObjectKeys(member.data);
      return Lib.resSuccess("", result);
    },
    async getEventsCardDetails(root, args, context, info) {
      const communityId = context.user.selectedOrganizationPortal;
      const result = await Services.EventOrganizationService.getEventsCardDetails(communityId);
      return Lib.sendResponse(result);
    },
    async getEventPaymentCardDetails(root, args, context, info) {
      const eventId = args.data.id;
      const result = await Services.EventOrganizationService.getEventPaymentCardDetails(eventId);
      return Lib.sendResponse(result);
    },
    async getAllRsvpAdminControll(root, args, context, info) {
      const id = args.data.id;
      const result = await Services.EventOrganizationService.getAllRsvpAdminControll(id);
      return Lib.sendResponse(result);
    },
    async getUpcomingRecurringEvent(root, args, context, info) {
      const id = args.data.id;
      const result = await Services.EventOrganizationService.getUpcomingRecurringEvent(id);
      return Lib.sendResponse(result);
    },
  },
  Mutation: {
    async createMyCommunityEvent(root, args, context, info) {
      let id = context.user.selectedOrganizationPortal;
      const data = args.data;
      let user = context.user;
      const userData = await Services.GroupOrganizationService.getMyCommunityDetails(id, context.user);
      if (Lib.isEmpty(userData?.data?.community?._id?.toString())) {
        return Lib.sendResponse({
          error: true,
          message: "noDefaultCommunitySelected",
          ErrorClass: ErrorModules.Api404Error
        });
      }
      const result = await Services.EventService.createEvent(context.user, data, id);
      // // await notificationHelper.getFcmTokens(user1)
      // const slug = 'new-event-invite'; 
      // const lang = 'en'; 

      // await notificationHelper.getFcmTokens(user.id, slug, lang);
      // Check if the event creation was successful
      if (result && !result.error) {
        // If event is created successfully, send the notification
        const slug = 'new-event-invite';
        const lang = 'en';
        await notificationHelper.getFcmTokens(user.id, slug, lang);
      }
      return Lib.sendResponse(result);

    },

    async myCommunityEventStatusChange(root, args, context, info) {
      const logInUser = context.user.id;
      const result = await Services.EventService.eventStatusChange(args.id, logInUser);
      return Lib.sendResponse(result);
    },
    async myCommunitydeleteEvent(root, args, context, info) {
      const id = args.id;
      const UserId = context.user.id;
      let result = await Services.EventOrganizationService.myCommunitydeleteEvent(id, UserId);
      return Lib.resSuccess("eventDeleteSuccess");
    },
    async myCommunityupdateEvent(root, args, context, info) {
      const id = args.data.id;
      let result = await Services.EventOrganizationService.myCommunityupdateEvent(
        id,
        args.data,
        context
      );
      return Lib.sendResponse(result);
    },

    async acceptOrRejectOrgEvent(root, args, context, info) {
      const data = args.data;
      const eventId = data.eventId;
      let force_join = false;

      const eventD = await Services.EventService.getEventByID(eventId);
      if (eventD.error) {
        return Lib.sendResponse(eventD);
      }
      data.force_join = force_join;
      let result = await Services.EventOrganizationService.acceptOrRejectOrgEvent(data);
      return Lib.sendResponse(result);
    },

    async webVisitorPhoneVerify(root, args, context, info) {
      const data = args.data;
      const result = await Services.EventOrganizationService.webVisitorPhoneVerify(data);
      return Lib.sendResponse(result);
    },

    async webVisitorPhoneOTPVerify(root, args, context, info) {
      const otp = args.data.otp;
      const token = args.data.token;
      const result = await Services.EventOrganizationService.webVisitorPhoneOTPVerify(otp, token);
      return Lib.sendResponse(result);
    },

    async acceptOrRejectRecurringEvent(root, args, context, info) {
      const data = args.data;
      const userId = context.user.id;
      const eventId = data.eventId;

      const eventD = await Services.EventService.getEventByID(eventId);
      if (eventD.error) {
        return Lib.sendResponse(eventD);
      }
      const event = eventD.data;

      const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), event.community_id);
      if (userCommunity.error) {
        return Lib.sendResponse(userCommunity);
      }

      data.role = userCommunity.data.role;

      let result = await Services.EventOrganizationService.acceptOrRejectRecurringEvent(userId, data);
      return Lib.sendResponse(result);
    },
    async setRemainderStatusChange(root, args, context, info) {
      const result = await Services.EventService.setRemainderStatusChange(args.id);
      return Lib.sendResponse(result);
    },
    async updateRsvpAdminControll(root, args, context, info) {
      const id = args.data.id;
      const event = await Services.EventService.getAdminEventByID(id);
      
      if (event.error === true) {
          return Lib.sendResponse(event);
      }
      
      if (context.user.userType !== "admin") {
          if (event.data.host_id.toString() !== context.user.id) {
              return Lib.sendResponse({ error: true, message: "Only event host can perform this action.", ErrorClass: ErrorModules.AuthError });
          }
      }
      
      let result = await Services.EventService.updateRsvpAdminControll(id, args.data, context);
      console.log(result, "result....................");
      
      // Check if result.data exists and is an array
      let rsvpControllData = result.data || []; // Default to an empty array if data is not present
      
      // Transform rsvpControllData if necessary
      let RsvpAdminControll = {
          rsvpControll: rsvpControllData.map(item => ({
              id: item._id.toString(),
              rsvpType: item.rsvp_type,
              emailContent: item.email_content,
              smsContent: item.sms_content,
              deepLink: item.deep_link,
              isDelete: item.is_deleted
          }))
      };
  
      console.log(RsvpAdminControll, "RsvpAdminControll..............");
      
      return Lib.resSuccess("", RsvpAdminControll);
  },  
    async removeRemainderSettingsEvent(root, args, context, info) {
      const id = args.data.id;
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
      const result = await Services.EventOrganizationService.removeRemainderSettingsEvent(eventId,id,context);
      return Lib.sendResponse(result);
    },
  },
};