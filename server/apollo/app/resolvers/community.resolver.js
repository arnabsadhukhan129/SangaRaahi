const Services = require("../services");
const ErrorModules = require("../errors");
const Communities = Lib.Model('Communities');
const notificationHelper = require('../library/notifiaction.helper')


module.exports = {
  Query: {
    async getAllCommunities(root, args, context, info) {
      const community = await Services.CommunityService.getAllCommunities(
        args.data,
        context.user
      );
      let result = Lib.reconstructObjectKeys(
        community.data,
        ["created_at", "updated_at", "expired_at"],
        Lib.convertDate
      );
      let communityData = {
        total: community.total,
        communities: result
      }
      return Lib.resSuccess("", communityData);
    },

    async getCommunityByID(root, { id }) {
      const community = await Services.CommunityService.getCommunityByID(id);
      let result = Lib.reconstructObjectKeys(
        community.data,
        ["created_at", "updated_at", "expired_at"],
        Lib.convertDate
      );
      return Lib.resSuccess("", result);
    },

    /**
     * Community list of Approved, unapproved, and nearby
     * The unapproved consists of as a fan, as a member and own created community (not approved by the admin yet),
     * The approved list consist of fan, member, and own created community
     */
    async getMyRelatedCommunities(root, args, context, info) {
      /**
       * 1. Community -> My communities
       */
      try {
        const result = await Services.CommunityService.getMyRelatedCommunities(
          args.data,
          context.user
        );

        return Lib.resSuccess("", result.data);
      } catch (e) {
        console.log(e)
      }
    },
    //   async getMyRelatedCommunities(root, args, context, info) {
    //     try {
    //         const result = await Services.CommunityService.getMyRelatedCommunities(
    //             args.data,
    //             context.user
    //         );

    //         // Check if data is retrieved properly
    //         console.log(result.data);

    //         // Reformat and process the retrieved data
    //         const myCommunities = result.data.myCommunities.CommunityLogMembers.map(community => ({
    //             id: community._id,
    //             ownerId: community.owner_id,
    //             communityType: community.community_type,
    //             bannerImage: community.banner_image,
    //             logoImage: community.logo_image,
    //             communityName: community.community_name,
    //             communityDescription: community.community_description,
    //             communityLocation: community.community_location,
    //             address: community.address,
    //             nonProfit: community.non_profit,
    //             paymentCategory: community.payment_category,
    //             nonProfitTaxId: community.non_profit_tax_id,
    //             members: community.members,
    //             currentlySelected: community.currently_selected,
    //             isActive: community.is_active,
    //             isDeleted: community.is_deleted,
    //             expiredAt: community.expired_at,
    //             createdAt: community.created_at,
    //             updatedAt: community.updated_at,
    //             ownerDetails: community.ownerDetails,
    //             memberCount: community.memberCount
    //         }));

    //         return Lib.resSuccess("", {
    //             myCommunities: {
    //                 total: result.data.myCommunities.total,
    //                 CommunityLogMembers: myCommunities
    //             },
    //             underApprovalCommunities: result.data.underApprovalCommunities,
    //             underApprovalFan: result.data.underApprovalFan,
    //             underApprovalMembership: result.data.underApprovalMembership,
    //             nearbyCommunities: result.data.nearbyCommunities,
    //             myTopRoleCommunities: result.data.myTopRoleCommunities
    //         });
    //     } catch (e) {
    //         console.log(e);
    //         // Handle error appropriately
    //         return Lib.resError("An error occurred while fetching related communities.");
    //     }
    // },  
    /**
     * Listing for the my communities that i belong to as approved member/fan/owner
     */
    async getMyCommunities(root, args, context, info) {
      const result = await Services.CommunityService.getMyCommunities(context.user.id);
      return Lib.resSuccess(result.message, {
        myCommunities: result.data.my_communities
      });
    },

    async memberList(root, args, context, info) {
      const communityId = args.data.communityId;
      const approveType = args.data.approveType;

      const result = await Services.CommunityService.memberList({ communityId, approveType, user: context.user });
      const communityMembers = Lib.reconstructObjectKeys(result.data, "joined_at", Lib.convertDate);
      return Lib.resSuccess(communityMembers);
    },

    async communityMemberList(root, args, context, info) {
      const ROLES_LANG_ENUM = Lib.getEnum('ROLES_LANG_ENUM');
      const communityRoles = await Services.CommunityService.getCommunityRoles();
      let communityId = args.data.communityId;
      const memberType = args.data.memberType;
      const search = args.data.search;
      const groupId = args.data.groupId;
      let userRole = '';
      if (context.user.userType !== Lib.getEnum('USER_TYPE.admin')) {
        const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), communityId);
        if (userCommunity.error) {
          return Lib.sendResponse(userCommunity);
        }
        // Now check if the role is allowed to fetch the details
        // const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
        userRole = userCommunity.data.role;
        // if([ROLES_ENUM.fan, ROLES_ENUM.member].includes(userCommunity.data.role)) {
        //   // Not allowed as fan or member
        //   return Lib.sendResponse({
        //     error:true,
        //     message:"permissionDenied",
        //     ErrorClass:ErrorModules.AuthError,
        //     statusCode:Lib.getHttpErrors('FORBIDDEN')
        //   });
        // }
        communityId = userCommunity.data.community._id;
      } else {
        if (!communityId) {
          return Lib.sendResponse({ error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error });
        }
      }
      const result = await Services.CommunityService.communityMemberList({ communityId, memberType, search, groupId }, context.user, userRole);
      let groupMemberId = [];
      if (groupId) {
        const groupMemberList = await Services.GroupService.groupMemberList({ groupId, memberType: ['member', 'group_owner'] }, context.user);
        groupMemberList.data.forEach(member => {
          groupMemberId.push(member.members.member_id.toString());
        });
      }
      await Promise.all(result.data.map(async member => {
        let communityRole = member.members.roles[0];
        member.members.roles = ROLES_LANG_ENUM[communityRole][context.lang];
        //Getting the index in the "roles" array above
        let index = communityRoles.indexOf(communityRole);
        let promoteIndex = (index + 1);
        let demoteIndex = (index - 1);
        //Getting rpote demote role
        if (communityRoles[promoteIndex] !== undefined) {
          member.promote_role = ROLES_LANG_ENUM[communityRoles[promoteIndex]][context.lang];
        }
        if (communityRoles[demoteIndex] !== undefined) {
          member.demote_role = ROLES_LANG_ENUM[communityRoles[demoteIndex]][context.lang];
        }
        const isContact = await Services.UserService.isContact(context.user.id, member.members.member_id)
        member.is_contact = isContact;
        if (groupMemberId.includes(member.members.member_id.toString())) {
          member.is_joined_to_group = true;
        } else {
          member.is_joined_to_group = false;
        }
        member.community_role = userRole;
      }));

      const communityMembers = Lib.reconstructObjectKeys(result.data, ["joined_at", "user"], function (value, key) {
        if (key === "joined_at") {
          return Lib.convertDate(value);
        } else if (key === "user") {
          return Lib.generalizeUser(value);
        }
      });

      return Lib.resSuccess(communityMembers);
    },

    async getCommunityMembers(root, args, context, info) {
      let data = args.data;
      const result = await Services.CommunityService.getCommunityMembers(data);
      return Lib.resSuccess(result.data)
    },

    async getNearByCommunities(root, args, context, info) {
      const result = await Services.CommunityService.getNearByCommunities();
      return Lib.resSuccess(result.message, result.data);
    },

    // Community list for front-end users
    async findCommunities(root, args, context, info) {
      const result = await Services.CommunityService.findCommunities(args.data, context.user);
      const userId = context.user.id;

      await Promise.all(result.data.map(async (elem, index) => {
        const member = elem.members.filter(member => member.memberId.toString() === userId && member.isDeleted === false && member.isLeaved === false && member.isActive === true && member.isRejected === false);
        if (!Lib.isEmpty(member) && member[0].isApproved) {
          elem.isJoined = true;
          elem.isJoinRequestSent = false;
        } else if (!Lib.isEmpty(member) && !member[0].isApproved) {
          elem.isJoined = false;
          elem.isJoinRequestSent = true;
        } else if (Lib.isEmpty(member)) {
          elem.isJoined = false;
          elem.isJoinRequestSent = false;
        }
      }));
      return Lib.sendResponse(result);
    },

    async communityRequestList(root, args, context, info) {
      try {
        let search = args.data ? args.data.search : args.search;
        let communityId = args.data ? args.data.communityId : args.communityId;
        let page = args.data.page;
        const result = await Services.CommunityService.communityRequestList(context.user, search, communityId, page);
        if (result.error) {
          return Lib.sendResponse(result);
        } else {
          let communityData = {
            total: result.total,
            to: result.to,
            from: result.from,
            communities: result.data
          }
          return Lib.resSuccess("", communityData);
        }
      } catch (e) {
        console.log(e);
        return Lib.sendResponse({
          error: true,
          message: "internalServerError",
          statusCode: Lib.getHttpErrors('SERVER_ERROR'),
          stack: e
        });
      }
    },

    async communityViewDetails(root, args, context, info) {
      let communityId = args.data.id;
      const result = await Services.CommunityService.communityViewDetails(communityId, context);
      return Lib.sendResponse(result);
    },

    async communityUserRole(root, args, context, info) {
      let communityId = args.data.id;
      const result = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), communityId);
      return Lib.sendResponse(result);
    },

  },
  Mutation: {
    /**
     * ==> CRUD Operation of community
     */
    async createCommunity(root, args, context, info) {
      try {
        let user = context.user;
        user.selectedCommunity = context.getAuthUserInfo().selected_community;
        /**
         * FIELDS
         * -------------------
         * communityType,
         * bannerImage,
         * communityName,
         * communityDescription,
         * communityLocation,
         * nonProfit,
         * nonProfitTaxId
         */
        const result = await Services.CommunityService.createCommunity(
          user,
          args.data
        );

        if (result.error) {
          throw new ErrorModules.GeneralApiError(Lib.translate(result.message));
        } else {
          // All ok
          return Lib.resSuccess("communityCreatedSucces", {
            id: result.data.community._id,
          });
        }

      } catch (e) {
        clog(e);
        throw e;
      }
    },
    /**
     * Only accessible by admin
     * Who can approve the community
     */
    async approveCommunity(root, args, context, info) {
      const result = await Services.CommunityService.approveCommunity(
        args.data.communityId
      );
      if (result.error) {
        throw new result.ErrorClass(result.message);
      } else
        return Lib.resSuccess("CommunityApproved");
    },

    async communityStatusChange(root, args, context, info) {
      const result = await Services.CommunityService.communityStatusChange(args.id);
      if (result.error) {
        throw new result.ErrorClass(result.message);
      }
      return Lib.resSuccess("statusChangedSuccess", null);
    },

    async joinOrPromoteCommunity(root, args, context, info) {
      const data = args.data;
      if (!['Promotion', 'Demotion'].includes(data.promotionType)) {
        return Lib.sendResponse({
          error: true,
          statusCode: Lib.getHttpErrors('MALFORMED_ERROR'),
          message: "promotionTypeInvalid",
          ErrorClass: ErrorModules.ValidationError
        });
      }
      const result = await Services.CommunityService.joinOrPromoteCommunity(
        data,
        context.user,
        context.getAuthUserInfo()
      );
      return Lib.sendResponse(result);
    },

    async addExpiryDateToCommunity(root, args, context, info) {
      const expiryDate = args.data.expiryDate;
      const id = args.data.id;
      const userId = context.user.id;
      let result = await Services.CommunityService.addExpiryDateToCommunity(
        id,
        expiryDate,
        userId
      );
      return Lib.resSuccess(result.message);
    },

    async updateCommunity(root, args, context, info) {
      const data = args.data;
      const id = args.data.id;
      const UserId = context.user.id;
      let result = await Services.CommunityService.updateCommunity(id, data, UserId);

      if (result.error) {
        throw new ErrorModules.GeneralApiError(Lib.translate(result.message));
      } else {
        return Lib.resSuccess(result.message);
      }
    },

    async deleteCommunity(root, args, context, info) {
      const id = args.id;
      const UserId = context.user.id;
      let result = await Services.CommunityService.deleteCommunity(id, UserId);
      return Lib.resSuccess("communityDeleteSuccess");
    },
    async approveOrRejectMemberRequest(root, args, context, info) {
      try {
        const data = args.data;
        data.user = context.user;
        let communityId = data.communityId;
        const userCommunity = await Services.UserService.getUserCommunityPortalDetails(context.getAuthUserInfo(), communityId);
        if (userCommunity.error) {
          return Lib.sendResponse(userCommunity);
        }
        // Now check if the role is allowed to fetch the details
        const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
        if ([ROLES_ENUM.fan, ROLES_ENUM.member].includes(userCommunity.data.role)) {
          // Not allowed as fan or member
          return Lib.sendResponse({
            error: true,
            message: "permissionDenied",
            ErrorClass: ErrorModules.AuthError,
            statusCode: Lib.getHttpErrors('FORBIDDEN')
          });
        }
        communityId = userCommunity.data.community._id;
        const result = await Services.CommunityService.approveOrRejectMemberRequest({ ...data, communityId });
        if (result.error) {
          throw new result.ErrorClass(result.message);
        }
        return Lib.resSuccess(result.message);
      } catch (e) {
        return e;
      }
    },

    async switchCommunity(root, args, context, info) {
      const result = await Services.CommunityService.switchCommunity({ communityId: args.data.id, userId: context.user.id });
      // if(result.error) {
      //   throw new result.ErrorClass(result.message);
      // }
      // return Lib.resSuccess(result.message);
      return Lib.sendResponse(result);
    },

    //   async switchCommunity(root, args, context, info) {
    //         const result = await Services.CommunityService.switchCommunity({
    //             communityId: args.data.id,
    //             userId: context.user.id
    //         });

    //         console.log(result.data.roleKey, "Result of switchCommunity");

    //         if (result.data.roleKey === "board_member") {
    //           notificationHelper.getFcmTokens(context.user.id, 'BOARDMEMBERSIGNIN', 'en');
    //         }
    //         if (result.data.roleKey ==='executive_member') {
    //           notificationHelper.getFcmTokens(context.user.id, 'EXECUTIVEMEMBER', 'en');
    //       }
    //         return Lib.sendResponse(result);
    // },
    async removeCommunityMember(root, args, context, info) {
      let communityId = args.data.communityId;
      let memberId = args.data.memberId;
      const userId = context.user.id;
      const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), communityId, userId);
      if (userCommunity.error) {
        return Lib.sendResponse(userCommunity);
      }
      // Now check if the role is allowed to fetch the details
      const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
      if ([ROLES_ENUM.fan, ROLES_ENUM.member].includes(userCommunity.data.role)) {
        // Not allowed as fan or member
        return Lib.sendResponse({
          error: true,
          message: "permissionDenied",
          ErrorClass: ErrorModules.AuthError,
          statusCode: Lib.getHttpErrors('FORBIDDEN')
        });
      }
      communityId = userCommunity.data.community._id;
      const result = await Services.CommunityService.removeCommunityMember(communityId, memberId);
      if (result.error) {
        return Lib.sendResponse(result);
      }
      // Check if the member can be removed by the current user

      return Lib.resSuccess(result.message);
    },

    // Delete community member from org admin portal
    async deleteCommunityMember(root, args, context, info) {
      let communityId = args.data.communityId;
      let memberId = args.data.memberId;
      const userId = context.user.id;
      if (memberId[0] === context.user.id) {
        return Lib.sendResponse({
          error: true,
          message: "permissionDenied",
          ErrorClass: ErrorModules.AuthError,
          statusCode: Lib.getHttpErrors('FORBIDDEN')
        });
      }
      // Checking if the user is executive member or board member of the community
      const validationResult = await Services.CommunityService.communityMemberRollPermission(communityId, memberId, context.user.id);
      if (!validationResult || validationResult.error) {
        return Lib.sendResponse({
          error: true,
          message: validationResult.message ? validationResult.message : "permissionDenied",
          ErrorClass: ErrorModules.AuthError,
          statusCode: Lib.getHttpErrors('FORBIDDEN')
        });
      }
      const userCommunityPortal = await Services.UserService.getUserCommunityPortalDetails(context.getAuthUserInfo(), communityId);
      if (userCommunityPortal.error) {
        return Lib.sendResponse(userCommunityPortal);
      }

      const result = await Services.CommunityService.removeCommunityMember(communityId, memberId, userId);
      return Lib.sendResponse(result);
    },
    async leaveCommunity(root, args, context, info) {
      const id = args.data.id;
      const isAppPortal = args.data.isAppPortal;
      const UserId = context.user.id;
      const authUser = context.getAuthUserInfo();
      let result = await Services.CommunityService.leaveCommunity(id, UserId, authUser['selected_community'] || authUser['selectedCommunity'], isAppPortal);
      return Lib.sendResponse(result);
    },

    async promoteOrDemoteCommunityMember(root, args, context, info) {
      let communityId = args.data.communityId;
      let memberId = args.data.memberId;
      let promote = args.data.promote;
      const userCommunity = await Services.UserService.getUserCommunityPortalDetails(context.getAuthUserInfo(), communityId);
      if (userCommunity.error) {
        return Lib.sendResponse(userCommunity);
      }
      // Can't request to cahnge own role
      if (memberId === context.user.id && promote) {
        return Lib.sendResponse({
          error: true,
          message: "permissionDenied",
          ErrorClass: ErrorModules.AuthError,
          statusCode: Lib.getHttpErrors('FORBIDDEN')
        });
      }
      // Now check if the role is allowed to fetch the details
      const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
      if ([memberId !== context.user.id && ROLES_ENUM.fan, ROLES_ENUM.member].includes(userCommunity.data.role)) {
        // Not allowed as fan or member
        return Lib.sendResponse({
          error: true,
          message: "permissionDenied",
          ErrorClass: ErrorModules.AuthError,
          statusCode: Lib.getHttpErrors('FORBIDDEN')
        });
      }
      if (memberId !== context.user.id) {
        // Check if the user role have the permission to promote or demote the exact member 
        const validationResult = await Services.CommunityService.communityMemberRollPermission(communityId, [memberId], context.user.id);

        if (!validationResult || validationResult.error) {
          return Lib.sendResponse({
            error: true,
            message: "permissionDenied",
            ErrorClass: ErrorModules.AuthError,
            statusCode: Lib.getHttpErrors('FORBIDDEN')
          });
        }
      }
      communityId = userCommunity.data.community._id;
      const result = await Services.CommunityService.promoteOrDemoteCommunityMember(communityId, memberId, promote, context.user.id);
      return Lib.sendResponse(result);
    },
    // Active/Inactive community member from org admin portal
    async communityMemberStatusChange(root, args, context, info) {
      let communityId = args.data.communityId;
      let memberId = args.data.memberId;
      const userId = context.user.id;
      if (memberId[0] === context.user.id) {
        return Lib.sendResponse({
          error: true,
          message: "permissionDenied",
          ErrorClass: ErrorModules.AuthError,
          statusCode: Lib.getHttpErrors('FORBIDDEN')
        });
      }
      // Checking if the user is executive member or board member of the community
      const userCommunityPortal = await Services.UserService.getUserCommunityPortalDetails(context.getAuthUserInfo(), communityId);
      if (userCommunityPortal.error) {
        return Lib.sendResponse(userCommunityPortal);
      }
      const validationResult = await Services.CommunityService.communityMemberRollPermission(communityId, memberId, context.user.id);

      if (!validationResult || validationResult.error) {
        return Lib.sendResponse({
          error: true,
          message: "permissionDenied",
          ErrorClass: ErrorModules.AuthError,
          statusCode: Lib.getHttpErrors('FORBIDDEN')
        });
      }

      const result = await Services.CommunityService.communityMemberStatusChange(communityId, memberId, userId);
      return Lib.sendResponse(result);
    },
    //
    async publicityPageStatusChange(root, args, context, info) {
      let communityId = args.data.id;
      const userId = context.user.id;

      const result = await Services.CommunityService.publicityPageStatusChange(communityId, userId);

      return Lib.sendResponse(result);
    },
    async promoteOrDemoteAppMember(root, args, context, info) {
      let communityId = args.data.communityId;
      let memberId = args.data.memberId;
      let promote = args.data.promote;

      const userCommunity = await Services.UserService.getUserCommunityDetails(context.getAuthUserInfo(), communityId);
      if (userCommunity.error) {
        return Lib.sendResponse(userCommunity);
      }

      // Check if the user has permission to promote or demote
      if (memberId !== context.user.id && promote) {
        return Lib.sendResponse({
          error: true,
          message: "permissionDenied",
          ErrorClass: ErrorModules.AuthError,
          statusCode: Lib.getHttpErrors('FORBIDDEN')
        });
      }

      // Now check if the role is allowed to fetch the details
      const ROLES_ENUM = Lib.getEnum('ROLES_ENUM');
      if (memberId !== context.user.id && ROLES_ENUM[userCommunity.data.role] === ROLES_ENUM.fan && promote) {
        // Not allowed as fan to demote others
        return Lib.sendResponse({
          error: true,
          message: "permissionDenied",
          ErrorClass: ErrorModules.AuthError,
          statusCode: Lib.getHttpErrors('FORBIDDEN')
        });
      }

      communityId = userCommunity.data.community._id;
      const result = await Services.CommunityService.promoteOrDemoteCommunityMember(communityId, memberId, promote, context.user.id);
      if (result.error) {
        return Lib.sendResponse({
          error: true,
          message: "An error occurred while promoting or demoting member.",
          statusCode: Lib.getHttpErrors('INTERNAL_SERVER_ERROR')
        });
      }
      return Lib.sendResponse(result);
    }
  }
};
