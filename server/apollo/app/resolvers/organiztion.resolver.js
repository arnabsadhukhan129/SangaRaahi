const Services = require("../services");
const ErrorModules = require("../errors");
const notificationHelper = require('../library/notifiaction.helper')
const notificationServices = require('../services/notification.service');
const CommunityRoles = Lib.Model('CommunityRoles');
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

module.exports = {
  Query: {
    async switchOrganizationList(root, args, context, info) {
      const ROLES_LANG_ENUM = Lib.getEnum("ROLES_LANG_ENUM");
      const userId = context.user.id;
      const result = await Services.OrganizationService.switchOrganizationList(
        userId
      );
      if (result.error) {
        return Lib.sendResponse(result);
      }
      await Promise.all(result.data.map(async community => {        
        if(community.members.roles.length > 1) {
          const existRole = await CommunityRoles.findOne({
            community_id: new ObjectId(community.id),
            slug : community.members.roles[1]
          });
          if (existRole) {
            community.role = existRole.slug;
            community.roleName = existRole.name;
          } else {
            community.role = ROLES_LANG_ENUM[community.members.roles[0]][context.lang];
            community.roleName = ROLES_LANG_ENUM[community.members.roles[0]][context.lang];
          }
        } else {
          community.role = ROLES_LANG_ENUM[community.members.roles[0]][context.lang];
          community.roleName = ROLES_LANG_ENUM[community.members.roles[0]][context.lang];
        }
      }))

      return Lib.sendResponse(result);
    },

    async communityActivePassiveMemberList(root, args, context, info) {
      const ROLES_LANG_ENUM = Lib.getEnum("ROLES_LANG_ENUM");

      let communityId = args.data.communityId;
      let eventId = args.data.eventId;
      const search = args.data.search;
      const page = args.data.page;
      const isActiveMember = args.data.isActiveMember;
      const startDate = args.data.startDate;
      const endDate = args.data.endDate;
      const isAcknowladgeUser = args.data.isAcknowladgeUser;
      const isTrack = args.data.isTrack;
      const roles = args.data.roles;
      const acknowladgementStatus = args.data.acknowladgementStatus;
      const AcknowladgementDateStart = args.data.AcknowladgementDateStart;
      const AcknowladgementDateEnd = args.data.AcknowladgementDateEnd;
      const filter = args.data.filter;
      const nameWiseFilter = args.data.nameWiseFilter;

      // Checking if the user is executive member or board member of the community
      const userCommunityPortal =
        await Services.UserService.getUserCommunityPortalDetails(
          context.getAuthUserInfo(),
          communityId
        );
      if (userCommunityPortal.error) {
        return Lib.sendResponse(userCommunityPortal);
      }
      let userRole;
      userRole = userCommunityPortal.data.community.members.roles[0];

      const result =
        await Services.OrganizationService.getActivePassiveMemberList(
          communityId,
          eventId,
          search,
          isActiveMember,
          startDate,
          endDate,
          isAcknowladgeUser,
          isTrack,
          roles,
          acknowladgementStatus,
          AcknowladgementDateStart,
          AcknowladgementDateEnd,
          nameWiseFilter,
          args.data,
          filter
        );
      // Get the member_ids of the result
      const memberIds = result.data.map(member => member.members.member_id.toString());

      // Use the member_ids to find the group names
      const groupNames = await Services.OrganizationService.getGroupNamesByMemberIds(memberIds, communityId);
      
      // Merge the group names into the result data
      result.data.forEach(member => {
        member.groupNames = groupNames[member.members.member_id.toString()] || [];
      });

      await Promise.all(
        result.data.map(async (member) => {
          let communityRole = member.members.roles[0];
          member.members.roles = ROLES_LANG_ENUM[communityRole][context.lang];
          if (member.members.member_id.toString() === context.user.id) {
            member.members.isActiveDeletePermission = false;
          } else if (userRole === "executive_member" && communityRole === "board_member") {
            member.members.isActiveDeletePermission = false;
          }
          else {
            member.members.isActiveDeletePermission = true;
          }
          
          if (member.members.acknowledgement_status === "Accepted" || member.members.acknowledgement_status === "Blocked") {
            member.isResend = false;
          }
          const isContact = await Services.UserService.isContact(context.user.id, member.members.member_id)
          member.is_contact = isContact;
        })
      );
      // Recalculate the total based on the filtered data
      let total = result.total;
      // Filter out users with null or empty group when filter is set to "GroupWise"
      if (filter === "GroupWise") {
        result.data = result.data.filter(member => member.groupNames && member.groupNames.length > 0);
        total = result.data.length;
      }
      
      const communityMembers = Lib.reconstructObjectKeys(
        result.data,
        ["joined_at", "user", "acknowledgement_date", "invitation_date"],
        function (value, key) {
          if (key === "joined_at") {
            return Lib.convertDate(value);
          } else if (key === "user") {
            const user = Lib.reconstructObjectKeys(Lib.generalizeUser(value), "lastActivityAt", Lib.convertIsoDate);
            return user;
          } else if (key === "acknowledgement_date") {
            return Lib.convertDate(value);
          } else if (key === "invitation_date") {
            return Lib.convertDate(value);
          }
          else {
            return value;
          }
        }
      );
      const membersData = {
        total: total,
        from: result.from,
        to: result.to,
        members: communityMembers
      }

      return Lib.resSuccess(membersData);
    },

    async communityActivePassiveMemberDetails(root, args, context, info) {
      const userId = args.data.id;
      const page = args.data.page;
      const ageOfMinority = args.data.ageOfMinority;
      // Checking if the user is executive member or board member of the community
      const userCommunityPortal = await Services.UserService.getUserCommunityPortalDetails(context.getAuthUserInfo());
      if (userCommunityPortal.error) {
        return Lib.sendResponse(userCommunityPortal);
      }
      const communityId = userCommunityPortal.data.community._id;

      const user = await Services.OrganizationService.ActivePassiveMemberDetailsByID(userId, communityId, context, page, ageOfMinority);

      return Lib.sendResponse(user);
    },
    async getMyCommunitiesView(root, args, context, info) {
      const id = context.user.selectedOrganizationPortal;
      const result = await Services.CommunityService.communityViewDetails(id, context);
      if (result.error) {
        return Lib.sendResponse(result);
      }
      return Lib.resSuccess(result.message, {
        myCommunities: result.data.community
      });
    },
    async getMyCommunitiesSettingsView(root, args, context, info) {
      const data = args.data;
      const result = await Services.OrganizationService.getMyCommunitiesSettingsView(data);
      return Lib.sendResponse(result);
    },
    async communityMemberRoleFilter(root, args, context, info) {
      const ROLES_LANG_ENUM = Lib.getEnum('ROLES_LANG_ENUM');
      let communityId = args.data.communityId;
      const memberType = args.data.memberType;
      const search = args.data.search;
      const isOrgPortal = args.data.isOrgPortal;
      let userRole = '';
      if (!communityId) {
        return Lib.sendResponse({ error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error });
      }
      const result = await Services.CommunityService.communityMemberList({ communityId, memberType, search, groupId: '' }, '', '');

      await Promise.all(result.data.map(async (member, index) => {
        if (isOrgPortal) {
          if (!member.members.is_admin_approved) {
            result.data.splice(index);
          }
        }

        let communityRole = member.members.roles[0];
        member.members.roles = ROLES_LANG_ENUM[communityRole][context.lang];
      }));
      const communityMembers = Lib.reconstructObjectKeys(result.data, ["user"], function (value, key) {
        return Lib.generalizeUser(value);
      });

      return Lib.resSuccess(communityMembers);
    },
    async getOrgPageAdminApproval(root, args, context, info) {
      const communityId = args.data.id;
      let result = await Services.OrganizationService.getOrgPageAdminApproval(communityId);
      return Lib.sendResponse(result);
    },
    async getCommunityIdFromSlug(root, args, context, info) {
      const slug = args.data.slug;
      let result = await Services.OrganizationService.getCommunityIdFromSlug(slug);
      return Lib.sendResponse(result);
    },
    async getmyCommunityDashboardList(root, args, context, info) {
      try {
        const id = args.data.id;
        // const userData = await Services.GroupOrganizationService.getMyCommunityDetails(id, context.user);

        // if (Lib.isEmpty(userData?.data?.community?._id?.toString())) {
        //   return Lib.sendResponse({
        //     error: true,
        //     message: "noDefaultCommunitySelected",
        //     ErrorClass: ErrorModules.Api404Error
        //   });
        // }

        const dashboardData = await Services.OrganizationService.myCommunityDashboardList(id);
        return Lib.sendResponse(dashboardData);
      } catch (error) {
        console.error(error);
        // throw new ErrorModules.GeneralApiError("An error occurred while fetching the community dashboard");
      }
    },
    myCommunityDotNetGlobalSearch: async (root, args, context, info) => {
      const search = args.data.search;
      const communityId = context.user.selectedOrganizationPortal;
      const result = await Services.OrganizationService.myCommunityDotNetGlobalSearch(search, communityId);
      // console.log(result,"globalserach......................");
      return result;
    },
    myCommunityOrgGlobalSearch: async (root, args, context, info) => {
      const search = args.data.search;
      const communityId = args.data.communityId;
      const result = await Services.OrganizationService.myCommunityOrgGlobalSearch(search, communityId);
      // console.log(result,"globalserach......................");
      return result;
    },

    adminLogApprovalList: async (root, args, context, info) => {
      const communityId = args.data.communityId;
      const type = args.data.type;
      const result = await Services.OrganizationService.adminLogApprovalList(communityId, type);
      return Lib.sendResponse(result);
    },

    async currentUserRole(root, args, context, info) {
      const result = await Services.OrganizationService.currentUserRole(args.data.id, context.user.id);
      return Lib.sendResponse(result);
    },
    async viewSmsEmailGlobalSettings(root, args, context, info) {
      const data = args.data;
      const result = await Services.OrganizationService.viewSmsEmailGlobalSettings(data);
      return Lib.sendResponse(result);
    },
    async communityStripeDetails(root, args, context, info) {
      const communityId = context.user.selectedOrganizationPortal;
      const result = await Services.OrganizationService.communityStripeDetails(communityId);
      return Lib.sendResponse(result);
    },
    communityMemberListRollWise: async (root, args, context, info) => {
      try {
        const ROLES_LANG_ENUM = Lib.getEnum("ROLES_LANG_ENUM");

        let communityId = args.data.communityId;
        const search = args.data.search

        // Checking if the user is executive member or board member of the community
        const userCommunityPortal = await Services.UserService.getUserCommunityDetails(
          context.getAuthUserInfo(),
          communityId
        );
        if (userCommunityPortal.error) {
          return Lib.sendResponse(userCommunityPortal);
        }

        const result = await Services.OrganizationService.communityMemberListRollWise(
          communityId,
          search
        );

        // Fetching isContact status for each member
        await Promise.all(result.data.map(async (item) => {
          await Promise.all(item.member.map(async (memberItem) => {
            memberItem.isContact = await Services.UserService.isContact(context.user.id, memberItem.id);
          }));
        }));

        // Reorder communities array based on title serial
        let reorderedCommunities = ['board_member', 'executive_member', 'member', 'fan'].map(title => {
          const foundCommunity = result.data.find(item => item.roll === title);
          return {
            title: title,
            data: foundCommunity ? foundCommunity.member.map(memberItem => ({
              memberId: memberItem.id,
              roles: memberItem.roles,
              user: {
                id: memberItem.id,
                name: memberItem.name,
                phone: memberItem.phone,
                phoneCode: memberItem.phoneCode,
                profileImage: memberItem.profileImage,
                email: memberItem.email,
                isContact: memberItem.isContact
              },
            })) : [],
          };
        });
        // Filter out title with no data
        reorderedCommunities = reorderedCommunities.filter(community => community.data.length > 0);
        // If the user's role is "fan," filter out other roles
        if (userCommunityPortal.data.role === 'fan') {
          reorderedCommunities = reorderedCommunities.filter(
            (community) => community.title === 'fan'
          );
        }

        return Lib.resSuccess({ communities: reorderedCommunities });
      } catch (error) {
        console.error('Error in resolver:', error);
        return {
          error: true,
          code: 500,
          systemCode: 'RESOLVER_ERROR',
          message: error.message,
          data: null,
        };
      }
    },

  },

  Mutation: {
    /**
     * ==> CRUD Operation of Organiztion
     */

    async switchOrganiztionPortal(root, args, context, info) {
      const result = await Services.OrganizationService.switchOrganiztionPortal(
        { communityId: args.data.id, userId: context.user.id }, context
      );
      return Lib.sendResponse(result);
    },

    async updateCommunityView(root, args, context, info) {
      try {
        const id = context.user.selectedOrganizationPortal;
        const result = await Services.OrganizationService.updateCommunityViewService(id, args.data);
        if (result.error) {
          return Lib.sendResponse(result);
        } else {
          // All ok
          return Lib.resSuccess("communityUpdateSucces", {
            id: result.data.community,
          });
        }

      } catch (e) {
        clog(e);
        throw e;
      }
    },

    async addOrgGlobalSettings(root, args, context, info) {
      const communityId = context.user.selectedOrganizationPortal;
      let user = context.user;
      const userId = context.user.id;
      const result = await Services.OrganizationService.addOrgGlobalSettings(communityId, args.data, userId);
      const userCommunityPortal =
        await Services.UserService.getUserCommunityPortalDetails(
          context.getAuthUserInfo(),
          communityId
        );
      const useFind =
        await Services.UserService.getUserByID(
          context.getAuthUserInfo(),
          communityId
        );
      // let lang;
      // slug = 'website-ready';

      // lang = 'en';
      // await notificationHelper.getFcmTokens(user.id, slug, lang);

      if (result && !result.error) {
        const payload = {
          recipient:
          {
            user_id: user.id,
            fcmToken: useFind.data.device_details.map(device => device.web_token).filter(Boolean)

          },
          template: {
            type: "All",
            slug: "website-ready",
            lang: "en"
          },
          contents: {
            USERNAME: user.name,
            ORGADMINNAME: userCommunityPortal.data.community.community_name,
            WEBLINK: "https://sangaraahi.org/"
          }
        }
        await notificationServices.notifyService(payload);
      }

      return Lib.sendResponse(result);
    },

    async orgHomePageAdminApproval(root, args, context, info) {
      const data = args.data;
      const result = await Services.OrganizationService.orgHomePageAdminApproval(data);
      return Lib.sendResponse(result);
    },

    async aboutPageAdminApproval(root, args, context, info) {
      const data = args.data;
      const result = await Services.OrganizationService.aboutPageAdminApproval(data);
      return Lib.sendResponse(result);
    },

    async adminLogApproval(root, args, context, info) {
      const data = args.data;
      const result = await Services.OrganizationService.adminLogApproval(data);
      return Lib.sendResponse(result);
    },

    async editCurrency(root, args, context, info) {
      const data = args.data;
      const result = await Services.OrganizationService.editCurrency(data);
      return Lib.sendResponse(result);
    },

    async verifyCommunityEmail(root, args, context, info) {
      const email = args.data.email;
      const communityId = context.user.selectedOrganizationPortal;
      const userId = context.user.id;
      const result = await Services.OrganizationService.verifyCommunityEmail(email, communityId, userId);
      return Lib.sendResponse(result);
    },

    async verifyCommunityOTP(root, args, context, info) {
      const otp = args.data.otp;
      const communityId = context.user.selectedOrganizationPortal;
      const result = await Services.OrganizationService.verifyCommunityOTP(otp, communityId);
      return Lib.sendResponse(result);
    },
    async updateSmsEmailGlobalSettings(root, args, context, info) {
      const data = args.data;
      const userId = context.user.id;
      const result = await Services.OrganizationService.updateSmsEmailGlobalSettings(data, userId);
      return Lib.sendResponse(result);
    },
  },
};
