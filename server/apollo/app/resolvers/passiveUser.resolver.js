const UserData = require('../../data.json');
const Services = require('../services');
const ErrorModules = require('../errors');
const CountryCode = require('../../CountryCodes.json');
const notificationHelper = require('../library/notifiaction.helper')
const Communities = Lib.Model('Communities');

/**
 * Here write your main logic
 */
module.exports = {
  Query: {
    async findUserByPhoneMail(root, args, context, info) {
      const params = args.data;
      const communityId = context.user.selectedOrganizationPortal ? context.user.selectedOrganizationPortal : false;
      const result = await Services.PassiveUserService.findUserByPhoneMail(params, communityId);
      return Lib.sendResponse(result);
    },
    async passiveUserInvitationDetails(root, args, context, info) {
      const ROLES_LANG_ENUM = Lib.getEnum("ROLES_LANG_ENUM");
      // const communityId = args.data.communityId;
      // const userId = args.data.userId;
      // const adminorgId = args.data.adminorgId;
      const token = args.data.token;
      const User = await Services.PassiveUserService.passiveUserInvitationDetails(token);
      if (User.error) {
        return Lib.sendResponse(User);
      }
      let result = User.communityDetails;
      let userResult =User.userDetails;
      let orgAdminresult = User.orgAdminDetails;
      let totalFamilyMembers = User.totalFamilyMembers;
      let emailSmsPreferences = User.emailSmsPreferences;
      let invitationType = User.invitationType;
      await Promise.all(
        result.map(async (member) => {
          var communityRole = member.members.roles[0]
          member.members.roleName= ROLES_LANG_ENUM[communityRole][context.lang];
        })
      );
      const data = {
        error: false,
        message: "generalSuccess",
        statusCode: 200,
        data: {
          communityDetails: result,
          userDetails:userResult,
          orgAdminDetails: orgAdminresult,
          totalFamilyMembers: totalFamilyMembers,
          emailSmsPreferences : emailSmsPreferences,
          invitationType : invitationType
        }
      }
      return Lib.sendResponse(data);
    },
    async userSmsEmailSettingsView(root, args, context, info) {
      const data = args.data;
      const result = await Services.PassiveUserService.userSmsEmailSettingsView(data);
      return Lib.sendResponse(result);
    }
  },
Mutation:{
    async onboardPassiveMember(root, args, context, info) {
      const params = args.data;
      let user = context.user;
      
    //   const community = await Communities.findOne({
    //     _id: new ObjectId(communityId),
    //     is_active: true,
    //     is_deleted: false
    // }, '_id community_name expired_at is_active members');
    // if (Lib.isEmpty(community)) {
    //     return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
    // }
      const result = await Services.PassiveUserService.onboardPassiveMember(params,user);
      // if(result && !result.error){
      //   const payload = {
      //     recipient:
      //     {
      //         user_id: user._id
      //     },
      //     template: {
      //         type: "All",
      //         slug: "PSSVUSERINVT",
      //         lang: "en"
      //     },
      //     contents: {
      //         USERNAME:  user.name,
      //         ORGADMINNAME: _user.name,
      //         ORGNAME: community.community_name,
      //         ELINK: elink,
      //         SLINK: slink
      //     }
      // }
      // //Sending notification
      // await notificationServices.notifyService(payload);
      // }
      return Lib.sendResponse(result);
    },
  //   async onboardPassiveMember(root, args, context, info) {
  //     const params = args.data;
  //     const user = context.user;
  
  //     // Onboard the passive member
  //     const result = await Services.PassiveUserService.onboardPassiveMember(params, user);
  
  //     // If onboarding is successful, send a notification
  //     if (result && !result.error) {
  //         const slug = 'PSSVUSERINVT';
  //         const languages = 'en'; // Add 'bn' or 'hi' if you want to send in those languages too
  
  //         for (const lang of languages) {
  //             await notificationHelper.getFcmTokens(user.id, slug, lang);
  //         }
  //     }
  
  //     return Lib.sendResponse(result);
  // },  
    
    async resendOnboardingInvitation(root, args, context, info) {
      const passiveUserId = args.data.id;
      const result = await Services.PassiveUserService.resendOnboardingInvitation(passiveUserId,context);
      return Lib.sendResponse(result);
    },

    async invitationResponse(root, args, context, info) {
      const data = args.data;
      const result = await Services.PassiveUserService.invitationResponse(data);
      return Lib.sendResponse(result);
    },

    async userSmsEmailSettings(root, args, context, info) {
      const data = args.data;
      const result = await Services.PassiveUserService.userSmsEmailSettings(data);
  
      // response
      const response = {
          ...result,
          data: {
              id: result.data
          }
      };
  
      return Lib.sendResponse(response);
  },  

    async onboardExistUser(root, args, context, info) {
      const params = args.data;
      const result = await Services.PassiveUserService.onboardExistUser(params,context.user);
      return Lib.sendResponse(result);
    },

    async updatePassiveUserInvitationDetails(root, args, context, info) {
      const data = args.data;
      //console.log(data,"dataa");
      // const id = args.data.id;
      const UserId = data.id;
      // console.log(UserId,"userId")
      let result = await Services.PassiveUserService.updatePassiveUserInvitationDetails(data,UserId);
      
      if(result.error) {
        throw new ErrorModules.GeneralApiError(Lib.translate(result.message));
      }else{
        return Lib.resSuccess(result.message);
      }
    },
  }
}