const Communities = Lib.Model('Communities');
const User = Lib.Model('Users');
const CommunitySettings = Lib.Model('CommunitySettings');
const CommunityAdminApprovalSettings = Lib.Model('CommunityAdminApprovalSettings');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const ErrorModules = require('../errors');
const ActivityLogService = require('./activity_log.service')
require('dotenv').config();
const CommunityApprovalLog = Lib.Model('CommunityApprovalLog');
const notificationServices = require('./notification.service');

module.exports = {
    // Mutations
    updateHomePageOverview: async function (id, params, userId) {
        const community = await Communities.findOne({
            _id: ObjectId(id)
        });
        const communityName = community.community_name;
        if (Lib.isEmpty(community)) {
            throw new ErrorModules.Api404Error("noCommunityFound");
        }
        // community.banner_image = params.bannerImage;
        // community.logo_image = params.logoImage;
        // community.community_description = params.communityDescription;

        const communitySettings = await CommunitySettings.findOne({ community_id: ObjectId(id) });

        if (!communitySettings) {
            return { error: true, code: 404, message: 'communitySettingsNotFound' };
        }

        // fetch old values
        const oldCommunity = community.toObject();

        const freezePane = communitySettings.freeze_pane;
        let isChangeRequestNotify = false;

        if (params.logoImage) {
            const communityApprovalLog = await CommunityApprovalLog.findOne({ community_id: ObjectId(id), field: "logo_image", is_approved: false, is_acknowledged: false });
            if (freezePane) {
                if (!communityApprovalLog) {
                    community.org_logo_image = community.logo_image;
                }
            } else {
                community.org_logo_image = params.logoImage;
            }
            // Creating log for new logo change 
            if (freezePane && !Lib.stringCompare(community.logo_image, params.logoImage)) {
                if (communityApprovalLog) {
                    communityApprovalLog.is_acknowledged = true;
                    await communityApprovalLog.save();
                }
                await CommunityApprovalLog.create({
                    community_id: new ObjectId(id),
                    type: "Home",
                    field: "logo_image",
                    fieldname: "logo image",
                    content: params.logoImage
                });
                isChangeRequestNotify = true;
                communitySettings.webpage_approval_status = "not_approved";
                await communitySettings.save();
            }

            community.logo_image = params.logoImage;
        }

        if (params.bannerImage) {
            const communityApprovalLog = await CommunityApprovalLog.findOne({ community_id: ObjectId(id), field: "banner_image", is_approved: false, is_acknowledged: false });
            if (freezePane) {
                if (!communityApprovalLog) {
                    community.org_banner_image = community.banner_image;
                }
            } else {
                community.org_banner_image = params.bannerImage;
            }
            // Creating log for new logo change 
            if (freezePane && !Lib.stringCompare(community.banner_image, params.bannerImage)) {
                if (communityApprovalLog) {
                    communityApprovalLog.is_acknowledged = true;
                    await communityApprovalLog.save();
                }
                await CommunityApprovalLog.create({
                    community_id: new ObjectId(id),
                    type: "Home",
                    field: "banner_image",
                    fieldname: "banner image",
                    content: params.bannerImage
                });
                isChangeRequestNotify = true;
                communitySettings.webpage_approval_status = "not_approved";
                await communitySettings.save();
            }

            community.banner_image = params.bannerImage;
        }

        if (params.communityDescription) {
            const communityApprovalLog = await CommunityApprovalLog.findOne({ community_id: ObjectId(id), field: "community_description", is_approved: false, is_acknowledged: false });
            if (freezePane) {
                if (!communityApprovalLog) {
                    community.org_community_description = community.community_description;
                }
            } else {
                community.org_community_description = params.communityDescription;
            }
            // Creating log for new description change
            if (freezePane && !Lib.stringCompare(community.community_description, params.communityDescription)) {
                if (communityApprovalLog) {
                    communityApprovalLog.is_acknowledged = true;
                    await communityApprovalLog.save();
                }
                await CommunityApprovalLog.create({
                    community_id: new ObjectId(id),
                    type: "Home",
                    field: "community_description",
                    fieldname: "community description",
                    content: params.communityDescription
                });
                isChangeRequestNotify = true;
                communitySettings.webpage_approval_status = "not_approved";
                await communitySettings.save();
            }
            community.org_community_description = !freezePane ? params.communityDescription : community.community_description;
            community.community_description = params.communityDescription;
        }
        // --- Activity Log (compare old vs new) ---
        const updatedFields = {};
        const newCommunity = community.toObject();

        ["logo_image", "banner_image", "community_description"].forEach(key => {
            if (oldCommunity[key] !== newCommunity[key]) {
                updatedFields[key] = {
                    old: oldCommunity[key] || null,
                    new: newCommunity[key] || null
                };
            }
        });

        const member = community.members.find(
            (m) => m.member_id.toString() === userId.toString()
        );
        const userRole = member.roles;

        if (Object.keys(updatedFields).length > 0) {
            await ActivityLogService.activityLogActiion({
                communityId: community._id,
                userId: userId,
                module: "COMMUNITY",
                action: "UPDATE",
                oldData: Object.fromEntries(Object.entries(updatedFields).map(([k, v]) => [k, v.old])),
                newData: Object.fromEntries(Object.entries(updatedFields).map(([k, v]) => [k, v.new])),
                platForm: "web",
                memberRole: userRole
            });
        }
        if (isChangeRequestNotify) {
            // Getting admin details
            const admin = await User.findOne({ "user_type": "admin" });
            // Fetching admin device token 
            let webToken = [];
            if (admin) {
                webToken = admin.device_details.filter(device => device.is_active === true).map(device => device.web_token);
            }
            await community.save();
            // sending notification to admin
            const payload = {
                recipient:
                {
                    user_id: '',
                    fcmToken: webToken
                },
                template: {
                    type: "Push",
                    slug: "comunity-changes",
                    lang: "en"
                },
                contents: {
                    COMMUNITYNAME: communityName,
                    SECTION: "Home Page"
                },
                isDotCom: true,
                section: "home",
                communityId: ObjectId(id)
            }
            await notificationServices.notifyService(payload);
        }

        return ({ error: false, message: "communityUpdateSuccess", data: community });
    },
    updateCommunityFeaturedStatus: async function (id, userId) {
        const community = await Communities.findOne({
            _id: ObjectId(id)
        });
        if (Lib.isEmpty(community)) {
            throw new ErrorModules.Api404Error("noCommunityFound");
        }
        const getCommunitySettings = await CommunitySettings.findOne({
            community_id: ObjectId(id)
        });
        if (Lib.isEmpty(getCommunitySettings)) {
            throw new ErrorModules.Api404Error("noFeaturedCommunityGlobalSettingsFound");
        }
        // Store old value
        const oldStatus = community.is_featured;
        community.is_featured = community.is_featured ? false : true;
        await community.save();

        const member = community.members.find(
            (m) => m.member_id.toString() === userId.toString()
        );
        const userRole = member.roles;
        // Log only if status changed
        if (oldStatus !== community.is_featured) {
            await ActivityLogService.activityLogActiion({
                communityId: community._id,
                userId: userId,
                module: "COMMUNITY",
                action: "FEATURE_STATUS_CHANGE",
                oldData: { is_featured: oldStatus },
                newData: { is_featured: community.is_featured },
                platForm: "web",
                memberRole: userRole
            });
        }
        return ({ error: false, message: "communityUpdateSuccess", data: community });
    },
    updatefreezePaneStatus: async (id, userId) => {
        const communitySettings = await CommunitySettings.findOne({ community_id: id });

        if (!communitySettings) {
            return { error: true, code: 404, message: 'Community settings not found' };
        }

        const communityApprovalLog = await CommunityApprovalLog.findOne({ community_id: ObjectId(id), is_acknowledged: false });
        if (communityApprovalLog) {
            return { error: true, code: 403, message: 'approvalLogPending' };
        }

        // Store old value
        const oldStatus = communitySettings.freeze_pane;

        communitySettings.freeze_pane = !communitySettings.freeze_pane;
        communitySettings.updated_at = new Date();
        await communitySettings.save();

        const community = await Communities.findOne({ _id: new ObjectId(id) });
        const member = community.members.find(
            (m) => m.member_id.toString() === userId.toString()
        );
        const userRole = member.roles;

        // Log only if status changed
        if (oldStatus !== communitySettings.freeze_pane) {
            await ActivityLogService.activityLogActiion({
                communityId: id,
                userId: userId,
                module: "COMMUNITY_SETTINGS",
                action: "FREEZEPANE_STATUS_CHANGE",
                oldData: { freeze_pane: oldStatus },
                newData: { freeze_pane: communitySettings.freeze_pane },
                platForm: "web",
                memberRole: userRole
            });
        }

        return { error: false, systemCode: 'success', code: 200, message: 'Freeze pane status updated successfully' };
    },
    updateEventPaymentStatus: async (id, userId) => {
        const communitySettings = await CommunitySettings.findOne({ community_id: id });

        if (!communitySettings) {
            return { error: true, code: 404, message: 'Community settings not found' };
        }

        const communityApprovalLog = await CommunityApprovalLog.findOne({ community_id: ObjectId(id), is_acknowledged: false });
        if (communityApprovalLog) {
            return { error: true, code: 403, message: 'approvalLogPending' };
        }

        // Store old value
        const oldStatus = communitySettings.event_payment_settings;

        communitySettings.event_payment_settings = !communitySettings.event_payment_settings;
        communitySettings.updated_at = new Date();
        await communitySettings.save();

        const community = await Communities.findOne({ _id: new ObjectId(id) });
        const member = community.members.find(
            (m) => m.member_id.toString() === userId.toString()
        );
        const userRole = member.roles;

        // Log only if status changed
        if (oldStatus !== communitySettings.event_payment_settings) {
            await ActivityLogService.activityLogActiion({
                communityId: id,
                userId: userId,
                module: "COMMUNITY SETTINGS",
                action: "PAYMENT_STATUS_CHANGE",
                oldData: { event_payment_settings: oldStatus },
                newData: { event_payment_settings: communitySettings.event_payment_settings },
                platForm: "web",
                memberRole: userRole
            });
        }

        return { error: false, systemCode: 'success', code: 200, message: 'Event payment status updated successfully' };
    },
    updateCommunityAnnouncementSettings: async function (id, params, userId) {
        const community = await Communities.findOne({
            _id: ObjectId(id)
        });
        if (Lib.isEmpty(community)) {
            throw new ErrorModules.Api404Error("noCommunityFound");
        }
        const getCommunitySettings = await CommunitySettings.findOne({
            community_id: ObjectId(id)
        });
        if (Lib.isEmpty(getCommunitySettings)) {
            throw new ErrorModules.Api404Error("noCommunityGlobalSettingsFound");
        }
        // store old data
        const oldData = { ...getCommunitySettings.announcement_settings };

        getCommunitySettings.announcement_settings.show_public_announcement = (params.showPublicAnnouncement == true) ? true : false;
        getCommunitySettings.announcement_settings.show_member_announcement = (params.showMemberAnnouncement == true) ? true : false;
        getCommunitySettings.announcement_settings.show_public_events = (params.showPublicEvents == true) ? true : false;
        getCommunitySettings.announcement_settings.show_past_events = (params.showPastEvents == true) ? true : false;
        getCommunitySettings.announcement_settings.show_members_only_events = (params.showMembersOnlyEvents == true) ? true : false;
        await getCommunitySettings.save();

        // after save, fetch new snapshot
        const newData = getCommunitySettings.announcement_settings;

        // collect only updated fields
        let updatedOld = {};
        let updatedNew = {};
        Object.keys(newData).forEach(key => {
            if (oldData[key] !== newData[key]) {
                updatedOld[key] = oldData[key];
                updatedNew[key] = newData[key];
            }
        });

        const member = community.members.find(
            (m) => m.member_id.toString() === userId.toString()
        );
        const userRole = member.roles;
        // log only if something changed
        if (Object.keys(updatedNew).length > 0) {
            await ActivityLogService.activityLogActiion({
                communityId: community._id,
                userId: userId,
                module: "COMMUNITY SETTINGS",
                action: "UPDATE_ANNOUNCEMENT_SETTINGS",
                oldData: updatedOld,
                newData: updatedNew,
                platForm: "web",
                memberRole: userRole
            });
        }
        return ({ error: false, message: "communityUpdateSuccess", data: getCommunitySettings });
    },
    // updateCommunityAboutUsSettings: async function (id, params) {
    //     const community = await Communities.findOne({
    //         _id: ObjectId(id)
    //     });
    //     console.log(community,"........>>>>>>>>>>>>>>>>>>............");
    //     if (Lib.isEmpty(community)) {
    //         throw new ErrorModules.Api404Error("noCommunityFound");
    //     }
    //     const getCommunitySettings = await CommunitySettings.findOne({
    //         community_id: ObjectId(id)
    //     });
    //     if (Lib.isEmpty(getCommunitySettings)) {
    //         throw new ErrorModules.Api404Error("noCommunityGlobalSettingsFound");
    //     }
    //     getCommunitySettings.about_us_settings.show_organization_description = (params.showOrganizationDescription == true) ? true : false;
    //     getCommunitySettings.about_us_settings.show_organization_address = (params.showOrganizationAddress == true) ? true : false;
    //     getCommunitySettings.about_us_settings.show_board_members = (params.showBoardMembers == true) ? true : false;
    //     getCommunitySettings.about_us_settings.show_executive_members = (params.showExecutiveMembers == true) ? true : false;
    //     getCommunitySettings.about_us_settings.show_contact_email_publicly = (params.showContactEmailPublicly == true) ? true : false;
    //     getCommunitySettings.about_us_settings.show_contact_phone_publicly = (params.showContactPhonePublicly == true) ? true : false;
    //     community.non_profit = (params.nonProfit == true) ? true : false;
    //     community.community_type = params.communityType;
    //     getCommunitySettings.about_us_settings.board_members_label_name = params.boardMembersLabelName;
    //     getCommunitySettings.about_us_settings.executive_members_label_name = params.executiveMembersLabelName;
    //     await getCommunitySettings.save();
    //     return ({ error: false, message: "communityUpdateSuccess", data: getCommunitySettings });
    // },
    updateCommunityAboutUsSettings: async function (id, params, userId) {
        try {
            const community = await Communities.findOne({ _id: ObjectId(id) });

            if (!community) {
                throw new ErrorModules.Api404Error("noCommunityFound");
            }

            const getCommunitySettings = await CommunitySettings.findOne({ community_id: ObjectId(id) });

            if (!getCommunitySettings) {
                throw new ErrorModules.Api404Error("noCommunityGlobalSettingsFound");
            }

            // store old data
            const oldData = { ...getCommunitySettings.about_us_settings };

            getCommunitySettings.about_us_settings.show_organization_description = !!params.showOrganizationDescription;
            getCommunitySettings.about_us_settings.show_organization_address = !!params.showOrganizationAddress;
            getCommunitySettings.about_us_settings.show_board_members = !!params.showBoardMembers;
            getCommunitySettings.about_us_settings.show_executive_members = !!params.showExecutiveMembers;
            getCommunitySettings.about_us_settings.show_contact_email_publicly = !!params.showContactEmailPublicly;
            getCommunitySettings.about_us_settings.show_contact_phone_publicly = !!params.showContactPhonePublicly;
            community.non_profit = params.nonProfit;
            community.payment_category = params.paymentCategory;
            // community.non_profit = params.paymentCategory === "NonProfit";
            // community.community_type = params.communityType;
            getCommunitySettings.about_us_settings.board_members_label_name = params.boardMembersLabelName;
            getCommunitySettings.about_us_settings.executive_members_label_name = params.executiveMembersLabelName;

            await getCommunitySettings.save();
            await community.save();

            // after save, fetch new 
            const newData = getCommunitySettings.about_us_settings;

            // collect only updated fields
            let updatedOld = {};
            let updatedNew = {};
            Object.keys(newData).forEach(key => {
                if (oldData[key] !== newData[key]) {
                    updatedOld[key] = oldData[key];
                    updatedNew[key] = newData[key];
                }
            });

            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            // log only if something changed
            if (Object.keys(updatedNew).length > 0) {
                await ActivityLogService.activityLogActiion({
                    communityId: community._id,
                    userId: userId,
                    module: "COMMUNITY_MANAGEMENT",
                    action: "UPDATE_ABOUT_SETTINGS",
                    oldData: updatedOld,
                    newData: updatedNew,
                    platForm: "web",
                    memberRole: userRole
                });
            }

            return {
                error: false,
                message: "communityUpdateSuccess",
                data: getCommunitySettings
            };
        } catch (error) {
            console.error(error);
            throw new ErrorModules.DatabaseError("An error occurred while updating the community settings");
        }
    },
    getCommunityHomePageOverviewByID: async function (id) {
        let community = await Communities.findOne({
            is_deleted: false,
            _id: new ObjectId(id)
        }, 'community_name community_type non_profit banner_image org_banner_image logo_image org_logo_image community_description org_community_description logo_image_approval banner_image_approval');
        if (Lib.isEmpty(community)) {
            throw new ErrorModules.Api404Error("noCommunityFound");
        }
        const communitySettings = await CommunitySettings.findOne({ community_id: ObjectId(id) });
        if (Lib.isEmpty(communitySettings)) {
            throw new ErrorModules.Api404Error("noCommunityGlobalSettingsFound");
        }
        const communityAdminSettings = await this.communityAdminApprovalCheck(id);
        return ({
            error: false,
            message: "generalSuccess",
            data: community,
            isDescription: communitySettings.about_us_settings.show_organization_description,
            backgroupColor: communitySettings.backgroup_color,
            communityAdminSettings: communityAdminSettings,
            communitySettings: communitySettings
        });
    },
    getCommunityBasicDetails: async function (id, keyNames, isOrgPortal) {
        let project = { _id: 1, community_name: 1, logo_image: 1 }
        console.log(project, "project..........")
        if (keyNames.includes('description')) {
            project.community_type = 1;
            project.community_description = 1;
            project.org_community_description = 1;
            project.community_description_approval = 1;
        }
        if (keyNames.includes('address')) {
            project.community_location = 1;
        }
        if (keyNames.includes('email')) {
            project.community_email = 1;
            project.org_community_email = 1;
            project.community_email_approval = 1;
        }
        if (keyNames.includes('phone')) {
            project.community_phone_code = 1;
            project.non_profit = 1;
            project.payment_category = 1;
            project.community_number = 1;
            project.org_community_number = 1;
            project.community_number_approval = 1;
        }
        let community = await Communities.findOne({ is_deleted: false, _id: new ObjectId(id) }).select(project);
        community = JSON.parse(JSON.stringify(community));
        // console.log(community,"community............")
        if (Lib.isEmpty(community)) {
            throw new ErrorModules.Api404Error("noCommunityFound");
        }
        // Get .net community settings premission
        const communitySettings = await CommunitySettings.findOne({ community_id: ObjectId(id) });
        if (Lib.isEmpty(communitySettings)) {
            throw new ErrorModules.Api404Error("noCommunityGlobalSettingsFound");
        }

        // Get admin community settings premission
        const communityAdminSettings = await this.communityAdminApprovalCheck(id);

        community.location_approval = communitySettings.about_us_settings.show_organization_address;
        community.community_description_approval = communitySettings.about_us_settings.show_organization_description;
        community.community_email_approval = communitySettings.about_us_settings.show_contact_email_publicly;
        community.community_number_approval = communitySettings.about_us_settings.show_contact_phone_publicly;
        if (isOrgPortal) {
            // if(communitySettings.freeze_pane) {
            community.community_location = !communityAdminSettings.is_approve_community_address || !communitySettings.about_us_settings.show_organization_address ? null : community.community_location.org_location;
            community.community_description = !communityAdminSettings.is_approve_community_description || !communitySettings.about_us_settings.show_organization_description ? null : community.org_community_description;
            community.community_email = !communityAdminSettings.is_approve_community_email_address || !communitySettings.about_us_settings.show_contact_email_publicly ? null : community.org_community_email;
            community.community_number = !communityAdminSettings.is_approve_community_phone_number || !communitySettings.about_us_settings.show_contact_phone_publicly ? null : community.org_community_number;
            community.community_phone_code = !communityAdminSettings.is_approve_community_phone_number || !communitySettings.about_us_settings.show_contact_phone_publicly ? null : community.community_phone_code;
            // }else {
            //     community.community_location = communitySettings.about_us_settings.show_organization_address ? community.community_location.location : null;
            //     community.community_description = communitySettings.about_us_settings.show_organization_description ? community.org_community_description : null;
            //     community.community_email = communitySettings.about_us_settings.show_contact_email_publicly ? community.community_email : null;
            //     community.community_number = communitySettings.about_us_settings.show_contact_phone_publicly ? community.community_number : null;
            //     community.community_phone_code = communitySettings.about_us_settings.show_contact_phone_publicly ? community.community_phone_code : null;
            // }
            console.log({
                isOrgPortal,
                adminApproval: communityAdminSettings,
                globalSettings: communitySettings.about_us_settings
            });


        } else if (community.community_location) {
            community.community_location = community.community_location.location;
        }

        return ({ error: false, message: "generalSuccess", data: community });
    },
    getFeaturedCommunities: async function (params) {
        const limit = parseInt(params.limit);
        const skip = (parseInt(params.page) - 1) * parseInt(params.limit);
        let communitiesFindAggregate = [
            {
                '$match': {
                    'is_featured': true,
                    'is_deleted': false
                }
            },
            {
                '$lookup': {
                    'from': 'sr_users',
                    'localField': 'owner_id',
                    'foreignField': '_id',
                    'as': 'owner_details'
                }
            },
            {
                '$unwind': {
                    'path': '$owner_details'
                }
            },
            {
                '$project': {
                    '_id': 1,
                    'community_name': 1,
                    'community_type': 1,
                    'org_banner_image': 1,
                    'org_logo_image': 1,
                    'created_at': 1,
                    'owner_name': '$owner_details.name',
                    'banner_image': '$org_banner_image',
                    'logo_image': '$org_logo_image',
                }
            },
            { "$sort": { "created_at": -1 } },
            // { "$skip": skip },
            // { "$limit": limit },
        ];
        if (params && params.search) {
            communitiesFindAggregate[0]['$match']['community_name'] = {
                $regex: `.*${params.search}.*`,
                $options: 'i'
            };
        }
        const allFeaturedCommunities = await Communities.aggregate(communitiesFindAggregate);
        communitiesFindAggregate.push({ "$skip": skip });
        communitiesFindAggregate.push({ "$limit": limit });
        const featuredCommunities = await Communities.aggregate(communitiesFindAggregate);
        const totalCount = allFeaturedCommunities.length;
        return {
            error: false,
            message: "generalSuccess",
            total: totalCount,
            data: featuredCommunities
        };
    },

    getSangaraahiCommunity: async function (params) {
        const limit = 10;
        const skip = 0;
        let communitiesFindAggregate = [
            {
                '$match': {
                    'is_deleted': false,
                    'is_sangaraahi': true
                }
            },
            {
                '$lookup': {
                    'from': 'sr_users',
                    'localField': 'owner_id',
                    'foreignField': '_id',
                    'as': 'owner_details'
                }
            },
            {
                '$unwind': {
                    'path': '$owner_details'
                }
            },
            {
                '$project': {
                    '_id': 1,
                    'community_name': 1,
                    'community_type': 1,
                    'org_banner_image': 1,
                    'org_logo_image': 1,
                    'created_at': 1,
                    'owner_name': '$owner_details.name',
                    'banner_image': '$org_banner_image',
                    'logo_image': '$org_logo_image',
                }
            },
            { "$sort": { "created_at": -1 } },
            // { "$skip": skip },
            // { "$limit": limit },
        ];
        if (params && params.search) {
            communitiesFindAggregate[0]['$match']['community_name'] = {
                $regex: `.*${params.search}.*`,
                $options: 'i'
            };
        }
        const allFeaturedCommunities = await Communities.aggregate(communitiesFindAggregate);
        communitiesFindAggregate.push({ "$skip": skip });
        communitiesFindAggregate.push({ "$limit": limit });
        const featuredCommunities = await Communities.aggregate(communitiesFindAggregate);
        const totalCount = allFeaturedCommunities.length;
        return {
            error: false,
            message: "generalSuccess",
            total: totalCount,
            data: featuredCommunities
        };
    },

    //If no admin approval found create a new one
    // communityAdminApprovalCheck: async function (communityId) {
    //     const communityAdminSettings = await CommunityAdminApprovalSettings.findOne({ community_id: ObjectId(communityId) });
    //     if (Lib.isEmpty(communityAdminSettings)) {
    //         await CommunityAdminApprovalSettings.create({
    //             community_id: new ObjectId(communityId)
    //         })
    //     }
    //     let res = await CommunityAdminApprovalSettings.findOne({ community_id: ObjectId(communityId) });
    //     return res;
    // }

    communityAdminApprovalCheck: async function (communityId) {
        const communityAdminSettings = await CommunityAdminApprovalSettings.findOne({ community_id: ObjectId(communityId) });
        if (Lib.isEmpty(communityAdminSettings)) {
            await CommunityAdminApprovalSettings.create({
                community_id: new ObjectId(communityId)
            });
        }

        let res = await CommunityAdminApprovalSettings.findOne({ community_id: ObjectId(communityId) });
        const community = await Communities.findOne({ _id: ObjectId(communityId) });

        res = res.toObject();
        res.orgBannerImage = community.org_banner_image;
        res.orgLogoImage = community.org_logo_image;
        res.orgCommunityDescription = community.org_community_description;
        // res.orgLocation = community.org_location;
        res.orgLocation = community.community_location.org_location;
        res.orgCommunityEmail = community.org_community_email;
        res.orgCommunityNumber = community.org_community_number;

        return res;
    },

    getEventPaymentStatus: async (id) => {
        const communitySettings = await CommunitySettings.findOne({ community_id: id });

        if (!communitySettings) {
            return { error: true, code: 404, message: 'Community settings not found' };
        }
        return { error: false, message: 'success', data: { eventPaymentSettings: communitySettings.event_payment_settings } };
    },

}
