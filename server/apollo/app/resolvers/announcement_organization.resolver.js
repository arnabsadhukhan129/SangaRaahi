const BookData = require('../../books.json');
const Services = require('../services');
const ErrorModules = require('../errors');
const notificationHelper = require('../library/notifiaction.helper')
const notificationServices = require('../services/notification.service');
const NotificationSettings = Lib.Model('NotificationSettings');
const {sendSmsEmailForAnnouncement} = require('../services/announcement_organization.service')
/**
 * Here write your main logic
 */
module.exports = {
    Query: {
        async getAllAnnouncementOrganization(root, args, context, info) {
            let communityId = args.data.communityId;
            const announcement = await Services.AnnouncementOrganization.getAllAnnouncementOrganization(communityId, args.data);
            if (announcement.error) {
                return Lib.sendResponse(announcement);
            }
            const result = Lib.reconstructObjectKeys(announcement.data, "end_date", Lib.convertDate);
            let AllAnnouncement = {
                total: announcement.total,
                from: announcement.from,
                to: announcement.to,
                announcements: result
            }

            return Lib.resSuccess("", AllAnnouncement);
        },
        async getAnnouncementOrganizationByID(root, { id }) {
            const announcement = await Services.AnnouncementService.getAnnouncementByID(id);
            if (announcement.error) {
                return Lib.sendResponse(announcement);
            }
            let result = Lib.reconstructObjectKeys(announcement.data, "end_date", Lib.convertDate);
            return Lib.resSuccess("", result);
        },
    },
    Mutation: {
        // async createAnnouncementOrganization(root, args, context, info) {
        //     const data = args.data;
        //     let id = context.user.selectedOrganizationPortal;
        //     let user = context.user;
        //     const userData = await Services.GroupOrganizationService.getMyCommunityDetails(id, context.user);
        //     if (Lib.isEmpty(userData?.data?.community?._id?.toString())) {
        //         return Lib.sendResponse({
        //             error: true,
        //             message: "noDefaultCommunitySelected",
        //             ErrorClass: ErrorModules.Api404Error
        //         });
        //     }
        //     const communityId = userData?.data?.community?._id?.toString();
        //     const dataObj = {
        //         communityId,
        //         memberType: ['fan', 'member', 'board_member', 'executive_member']
        //     }
        //     let result = await Services.AnnouncementOrganization.createAnnouncementOrganization(context.user, data, id);
        //     const memberList = await Services.CommunityService.communityMemberList(dataObj, user, userData.data.role);
        //     const AnnouncementName = result.data.title;
        //     const communityName = userData?.data?.community?.community_name;
        //     let userName = user.name;
        //     if (result && !result.error) {
        //         if (data.type === "Public") {
        //             for (const member of memberList.data) {
        //                 const memberId = member.members.user._id;
        //                 const memberName = member.members.user.name;
        //                 const memberEmail = member.members.user.contact.email.address;
        //                 const memberPhoneCode = member.members.user.contact.phone.phone_code;
        //                 const memberPhoneNo = member.members.user.contact.phone.number;
        //                 const phoneNo = memberPhoneCode + memberPhoneNo
        //                 // Fetching user device token 
        //                 let webToken = [];
        //                 const deviceToken = member.members.user.device_details;
        //                 if (deviceToken) {
        //                     webToken = deviceToken.filter(device => device.is_active === true).map(device => device.web_token).filter(token => token !== null && token !== undefined);
        //                     fcmToken = deviceToken.filter(device => device.is_active === true).map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
        //                     webToken = [...webToken, ...fcmToken];
        //                 }
        //                 //SMS Send
        //                 const smspayload = {
        //                     recipient:
        //                     {
        //                         phone: phoneNo,
        //                     },
        //                     template: {
        //                         type: "SMS",
        //                         slug: "CREATEANNOUNCEMENT",
        //                         lang: "en"
        //                     },
        //                     contents: {
        //                         MEMBERNAME: memberName,
        //                         ANNOUNCEMENTNAME: AnnouncementName,
        //                         USERNAME: userName,
        //                         COMMUNITYNAME: communityName
        //                     }
        //                 }
        //                 //EMAIL Send
        //                 const emailpayload = {
        //                     recipient:
        //                     {
        //                         email: memberEmail,
        //                     },
        //                     template: {
        //                         type: "Email",
        //                         slug: "CREATEANNOUNCEMENTEMAIL",
        //                         lang: "en"
        //                     },
        //                     contents: {
        //                         MEMBERNAME: memberName,
        //                         ANNOUNCEMENTNAME: AnnouncementName,
        //                         USERNAME: userName,
        //                         COMMUNITYNAME: communityName
        //                     }
        //                 }
        //                 // Push Notifications
        //                 const payload = {
        //                     recipient: {
        //                         user_id: memberId,
        //                         fcmToken: webToken
        //                     },
        //                     template: {
        //                         type: "Push",
        //                         slug: "new-announcement",
        //                         lang: "en"
        //                     },
        //                     image: "https://developmentmatrix.s3.ap-south-1.amazonaws.com/mike-img-02.png"
        //                 };
        //                 const notiSettings = await NotificationSettings.findOne({ user_id: memberId });
        //                 let smsEvent, emailEvent;
        //                 // If notiSettings exists, extract sms_event and email_event, else set to true to ensure SMS is sent
        //                 if (notiSettings) {
        //                     smsEvent = notiSettings.sms_event;
        //                     emailEvent = notiSettings.email_event;
        //                 } else {
        //                     smsEvent = true; // Default to true if no settings found
        //                     emailEvent = true; // Default to true if no settings found
        //                 }
        //                 if (smsEvent) {
        //                     await notificationServices.notifyService(smspayload);
        //                 }
        //                 if (emailEvent) {
        //                     await notificationServices.notifyService(emailpayload);
        //                 }
        //                 await notificationServices.notifyService(payload);
        //             }
        //         } else if (data.type === "Member") {
        //             for (const member of memberList.data) {
        //                 if (["board_member", "executive_member", "member"].includes(member.members.roles)) {
        //                     const memberId = member.members.user._id;
        //                     const memberName = member.members.user.name;
        //                     const memberEmail = member.members.user.contact.email.address;
        //                     const memberPhoneCode = member.members.user.contact.phone.phone_code;
        //                     const memberPhoneNo = member.members.user.contact.phone.number;
        //                     const phoneNo = memberPhoneCode + memberPhoneNo
        //                     // Fetching user device token 
        //                     let webToken = [];
        //                     const deviceToken = member.members.user.device_details;
        //                     if (deviceToken) {
        //                         webToken = deviceToken.filter(device => device.is_active === true).map(device => device.web_token).filter(token => token !== null && token !== undefined);
        //                         fcmToken = deviceToken.filter(device => device.is_active === true).map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
        //                         webToken = [...webToken, ...fcmToken];
        //                     }
        //                     //SMS Send
        //                     const smspayload = {
        //                         recipient:
        //                         {
        //                             phone: phoneNo,
        //                         },
        //                         template: {
        //                             type: "SMS",
        //                             slug: "CREATEANNOUNCEMENT",
        //                             lang: "en"
        //                         },
        //                         contents: {
        //                             MEMBERNAME: memberName,
        //                             ANNOUNCEMENTNAME: AnnouncementName,
        //                             USERNAME: userName,
        //                             COMMUNITYNAME: communityName
        //                         }
        //                     }
        //                      //EMAIL Send
        //                     const emailpayload = {
        //                         recipient:
        //                         {
        //                             email: memberEmail,
        //                         },
        //                         template: {
        //                             type: "Email",
        //                             slug: "CREATEANNOUNCEMENTEMAIL",
        //                             lang: "en"
        //                         },
        //                         contents: {
        //                             MEMBERNAME: memberName,
        //                             ANNOUNCEMENTNAME: AnnouncementName,
        //                             USERNAME: userName,
        //                             COMMUNITYNAME: communityName
        //                         }
        //                     }
        //                     console.log(smspayload,"smspayload....");
        //                     console.log(emailpayload,"emailpayload.......");
        //                     //Push notifications
        //                     const payload = {
        //                         recipient: {
        //                             user_id: memberId,
        //                             fcmToken: webToken
        //                         },
        //                         template: {
        //                             type: "Push",
        //                             slug: "new-announcement",
        //                             lang: "en"
        //                         },
        //                         image: "https://developmentmatrix.s3.ap-south-1.amazonaws.com/mike-img-02.png"
        //                     };
        //                     const notiSettings = await NotificationSettings.findOne({ user_id: memberId });
        //                     let smsEvent, emailEvent;
        //                     // If notiSettings exists, extract sms_event and email_event, else set to true to ensure SMS is sent
        //                     if (notiSettings) {
        //                         smsEvent = notiSettings.sms_event;
        //                         emailEvent = notiSettings.email_event;
        //                     } else {
        //                         smsEvent = true; // Default to true if no settings found
        //                         emailEvent = true; // Default to true if no settings found
        //                     }
        //                     if (smsEvent) {
        //                         await notificationServices.notifyService(smspayload);
        //                     }
        //                     if (emailEvent) {
        //                         await notificationServices.notifyService(emailpayload);
        //                     }
        //                     await notificationServices.notifyService(payload);
        //                 }
        //             }
        //         }
        //     }
        //     return Lib.sendResponse(result);
        // },


        async createAnnouncementOrganization(root, args, context, info) {
            const data = args.data;
            let id = context.user.selectedOrganizationPortal;
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
            let result = await Services.AnnouncementOrganization.createAnnouncementOrganization(context.user, data, id);
            setTimeout(() =>{
                sendSmsEmailForAnnouncement(data,result, dataObj, user, userData)
            }, 0)

            return Lib.sendResponse(result);
        },

        async myCommunityAnnouncementStatusChange(root, args, context, info) {
            const result = await Services.AnnouncementOrganization.myCommunityAnnouncementStatusChange(args.id);
            return Lib.sendResponse(result);
        },
        async deleteAnnouncementOrganizaztion(root, args, context, info) {
            const id = args.id;
            const UserId = context.user.id;
            let result = await Services.AnnouncementService.DeleteAnnouncement(id, UserId);
            return Lib.resSuccess("announcementDeleteSuccess");

        },
        async updateMyCommunityAnnouncement(root, args, context, info) {
            const data = args.data;
            const id = args.id;
            const UserId = context.user.id;
            let result = await Services.AnnouncementOrganization.updateMyCommunityAnnouncement(id, data, UserId);
            return Lib.resSuccess("announcementUpdateSuccess");
        },
    }
}