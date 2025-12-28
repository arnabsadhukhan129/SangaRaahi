const Services = require('../services');
const ErrorModules = require('../errors');
const Group = Lib.Model('Groups');
const mongoose = require('mongoose');
const notificationServices = require('../services/notification.service');

module.exports = {
    Query: {
        async getMyCommunityGroup(root, args, context, info) {
            const result = await Services.GroupOrganizationService.getCommunityGroupsList(args.data);
            let group = Lib.reconstructObjectKeys(
                result.data,
                ["created_at"],
                function (value, key) {
                    if (key === "created_at") {
                        return Lib.convertDate(value);
                    }
                    else {
                        return value;
                    }
                }
            );
            let allGroups = {
                total: result.total,
                from: result.from,
                to: result.to,
                groups: group,
            }
            return Lib.resSuccess(allGroups);
        },
        async getMyCommunityGroupList(root, args, context, info) {
            const result = await Services.GroupOrganizationService.getCommunityGroupsListing(args.data);
            let group = Lib.reconstructObjectKeys(
                result.data,
                ["created_at"],
                function (value, key) {
                    if (key === "created_at") {
                        return Lib.convertDate(value);
                    }
                    else {
                        return value;
                    }
                }
            );
            let allGroups = {
                total: result.total,
                groups: group,
            }
            return Lib.resSuccess(allGroups);
        },
        async getMyCommunityGroupByID(root, { id }, context) {
            const Group = await Services.GroupOrganizationService.getMyCommunityGroupByID(id, context.user);
            let result = Lib.reconstructObjectKeys(Group.data);
            return Lib.resSuccess("", result);
        },
        async getAvailableGroups(root, args, context, info) {
            const data = args.data
            const group = await Services.GroupOrganizationService.getAvailableGroups(data);
            let result = Lib.reconstructObjectKeys(group.data);
            return Lib.resSuccess("", result);
        },

    },

    Mutation: {
        async groupOrgStatusChange(root, args, context, info) {
            const result = await Services.GroupOrganizationService.groupOrgStatusChange(args.id);
            if (result.error) {
                throw new result.ErrorClass(result.message);
            }
            return Lib.resSuccess("statusChangedSuccess", null);
        },
        async updateMyCommunityGroup(root, args, context, info) {
            const data = args.data;
            const id = args.id;
            const userId = context.user.id;
            let result = await Services.GroupOrganizationService.updateMyCommunityGroup(id, data, userId);
            if (result.error) {
                throw new result.ErrorClass(result.message);
            }
            return Lib.sendResponse(result);
        },
        async myCommunityCreateGroup(root, args, context, info) {
            const data = args.data;
            const members = args.data.members;
            let id = context.user.selectedOrganizationPortal;
            let userId = context.user.id;
            let user = context.user;
            const userData = await Services.GroupOrganizationService.getMyCommunityDetails(id, context.user);
            if (Lib.isEmpty(userData?.data?.community?._id?.toString())) {
                return Lib.sendResponse({
                    error: true,
                    message: "noDefaultCommunitySelected",
                    ErrorClass: ErrorModules.Api404Error
                });
            }
            const communityId = userData?.data?.community?._id?.toString();
            const dataObj = {
                communityId,
                memberType: ['fan', 'member', 'board_member', 'executive_member']
            }
            let result = await Services.GroupOrganizationService.myCommunityCreateGroup({ ...data, id }, userId, members);
            const memberList = await Services.CommunityService.communityMemberList(dataObj, user, userData.data.role);
            if (result && !result.error) {
                if (data.type === "Public") {
                    for (const member of memberList.data) {
                        // Fetching user device token 
                        let webToken = [];
                        if (member.device_details) {
                            webToken = member.device_details.filter(device => device.is_active === true).map(device => device.web_token).filter(token => token !== null && token !== undefined);
                            fcmToken = member.device_details.filter(device => device.is_active === true).map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                            webToken = [...webToken, ...fcmToken];
                        }
                        const memberId = member.members.user._id;
                        const payload = {
                            recipient: {
                                user_id: memberId,
                                fcmToken: webToken
                            },
                            template: {
                                type: "Push",
                                slug: "new-group",
                                lang: "en"
                            },
                            image: data.image
                        };
                        await notificationServices.notifyService(payload);
                    }
                } else if (data.type === "Restricted" && "Stealth") {
                    for (const memberId of members) {
                        // const memberIds = members.map(memberId => mongoose.Types.ObjectId(memberId)); 
                        const payload = {
                            recipient: {
                                user_id: mongoose.Types.ObjectId(memberId),
                            },
                            template: {
                                type: "Push",
                                slug: "added-group",
                                lang: "en"
                            },
                            image: data.image
                        };
                        await notificationServices.notifyService(payload);
                    }
                }
            }
            return Lib.sendResponse(result);
        },
        async deleteMyCommunityGroup(root, args, context, info) {
            const id = args.data.id;
            const UserId = context.user.id;
            let result = await Services.GroupOrganizationService.deleteMyCommunityGroup(id, UserId);
            if (result.error) {
                return Lib.sendResponse(result);
            }
            return Lib.resSuccess("groupDeleteSuccess");

        },

        async removeOrgGroupMember(root, args, context, info) {
            const data = args.data;
            const result = await Services.GroupService.removeGroupMember(data);
            return Lib.sendResponse(result);
        },
    },
}