const Communities = Lib.Model("Communities");
const CommunitySettings = Lib.Model('CommunitySettings');
const User = Lib.Model("Users");
const Group = Lib.Model('Groups');
const Events = Lib.Model('Events');
const Announcement = Lib.Model('Announcements');
const CommunityFeedback = Lib.Model('CommunityFeedback');
const Videos = Lib.Model('Videos');
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const jwt = Lib.getModules("jwt");
const ErrorModules = require("../errors");
const axios = require("axios");
const xlsx = require('xlsx');
const notificationServices = require("./notification.service");
const communityWebpageServices = require("./community_webpage.service");
const userServices = require("./user.service");
const rolePermissionServices = require("./role_permission.service");
const CommunityAdminApprovalSettings = Lib.Model('CommunityAdminApprovalSettings');
const CommunityApprovalLog = Lib.Model('CommunityApprovalLog');
const CommunityPayment = Lib.Model('CommunityPayment');
const notificationHelper = require('../library/notifiaction.helper');
const { uploadFileToS3 } = require("./s3.service");
const ActivityLogService = require("./activity_log.service");
require("dotenv").config();
module.exports = {
  // Query
  switchOrganizationList: async function (userId) {
    const allRoles = await rolePermissionServices.getAllCreatedDotNetRole();
    let myTopRoleCommunities = await Communities.aggregate([
      {
        $match: {
          is_active: true,
          is_deleted: false,
        }
      },
      {
        $unwind: {
          path: "$members",
        },
      },
      {
        $match: {
          "members.member_id": new ObjectId(userId),
          "members.roles": { $in: allRoles.data },
          "members.is_approved": true,
          "members.is_rejected": false,
          "members.is_leaved": false,
          "members.is_deleted": false,
          "members.is_active": true,
        },
      },
    ]);

    if (myTopRoleCommunities.length === 0) {
      return {
        error: true,
        message: "noActiveOrgFound",
        ErrorClass: ErrorModules.Api404Error,
      };
    }

    return {
      error: false,
      message: "generalSuccess",
      data: Lib.reconstructObjectKeys(myTopRoleCommunities),
    };
  },

  getActivePassiveMemberList: async function (
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
    params,
    filter
  ) {
    let searchName = "";
    let searchEmail = "";
    let searchPhoneNo = "";

    if (search) {
      searchName = search;
      searchEmail = search;
      searchPhoneNo = search;
    }
    // define limit per page
    const page = params.page || 1;
    const limit = params.limit || 10;
    let sortObject = {};
    let key = "members.user.created_at";
    let sort = -1;
    if (params && params.columnName && params.sort) {
      if (params.columnName === 'name') {
        key = 'members.user.name';
      }
      if (params.sort === 'asc') {
        sort = 1; //sort a to z
      } else if (params.sort === 'desc') {
        sort = -1; // Sort z to a
      }
    }
    sortObject[key] = sort;
    let aggregate = [
      {
        $match: {
          _id: new ObjectId(communityId),
        },
      },
      {
        $unwind: {
          path: "$members",
        },
      },
      {
        $match: {
          // "members.roles":{ $in: ["board_member", "executive_member"] },
          // "members.is_approved": true,
          "members.is_rejected": false,
          "members.is_leaved": false,
          "members.is_deleted": false,
        },
      },
      {
        $lookup: {
          from: "sr_users",
          localField: "members.member_id",
          foreignField: "_id",
          as: "members.user",
        },
      },
      {
        $unwind: {
          path: "$members.user",
        },
      },
      {
        $match: {
          "members.user.is_deleted": false,
          // "members.user.is_active": true,
        }
      },
      {
        $match: {
          $or: [
            { "members.user.name": new RegExp(`.*${searchName}.*`, "i") },
            {
              "members.user.contact.email.address": new RegExp(
                `.*${searchEmail}.*`,
                "i"
              ),
            },
            {
              "members.user.contact.phone.number": new RegExp(
                `.*${searchPhoneNo}.*`,
                "i"
              ),
            },
          ],
        },
      },
      // {
      //   $unwind: {
      //     path: "$members.roles",
      //   },
      // },
      {
        $sort: {
          "members.user.created_at": -1,
        },
      },
      {
        $project: {
          community_name: 1,
          "members.member_id": 1,
          "members.community_member_id": 1,
          "members.roles": 1,
          "members.is_active": 1,
          "members.joined_at": 1,
          "members.user._id": 1,
          "members.user.name": 1,
          "members.user.contact": 1,
          "members.user.profile_image": 1,
          "members.user.created_at": 1,
          "members.user.last_activity_at": 1,
          "members.acknowledgement_status": 1,
          "members.acknowledgement_date": 1,
          "members.invitation_date": 1,
          "members.group": 1,
          "isResend": {
            $cond: [
              {
                $lt: [
                  "$members.invitation_date",
                  {
                    $subtract: [new Date(), 1 * 60 * 60 * 1000], // 1 h ago
                  },
                ],
              },
              true,
              false,
            ],
          },
        },
      },
    ];
    if (typeof isActiveMember === "boolean") {
      let obj = {
        $match: {
          "members.is_active": isActiveMember,
        },
      };

      aggregate.splice(2, 0, obj);
    }


    if (startDate && endDate) {
      let startDateNew = new Date(startDate).toISOString();
      let isoStartDate = new Date(startDateNew);

      let endDateNew = new Date(endDate).toISOString();
      let isoEndDate = new Date(endDateNew);

      let obj = {
        $match: {
          "members.joined_at": {
            $gte: isoStartDate,
            $lte: isoEndDate,
          },
        },
      };

      aggregate.splice(6, 0, obj);
    }

    if (typeof isAcknowladgeUser === "boolean") {
      let objUser = {
        $match: {
          "members.acknowledgement_status": isAcknowladgeUser,
        },
      };

      aggregate.splice(6, 0, objUser);
    }
    if (Array.isArray(roles) && (roles.includes("board_member") || roles.includes("executive_member") || roles.includes("fan") || roles.includes("member"))) {
      let objUser = {
        $match: {
          "members.roles": { $in: roles },
        },
      };

      aggregate.splice(6, 0, objUser);
    }
    if (Array.isArray(acknowladgementStatus) && (acknowladgementStatus.includes("NoReply") || acknowladgementStatus.includes("Accepted") || acknowladgementStatus.includes("Rejected") || acknowladgementStatus.includes("Blocked"))) {
      let objUser = {
        $match: {
          "members.acknowledgement_status": { $in: acknowladgementStatus },
        },
      };
      aggregate.splice(6, 0, objUser);
    }

    if (isTrack) {
      let objUser = {
        $match: {
          "members.is_approved": false,
          "members.is_rejected": false,
          "members.is_leaved": false,
          "members.is_deleted": false,
          "members.is_active": false,
          "members.acknowledgement_status": { $in: ["Rejected", "Blocked", "NoReply"] }
        }
      };

      aggregate.splice(6, 0, objUser);
    } else {
      let objUser = {
        $match: {
          "members.is_approved": true,
          "members.is_rejected": false,
          "members.is_leaved": false,
          "members.is_deleted": false,
          // $or: [
          //   { "members.acknowledgement_status": "Accepted" },
          //   { "members.acknowledgement_status": { $exists: false } },
          //   { "members.is_acknowledged": true },
          // ]
        }
      };
      aggregate.splice(6, 0, objUser);
    }

    if (AcknowladgementDateStart && AcknowladgementDateEnd) {
      let AcknowladgementstartDate = new Date(AcknowladgementDateStart).toISOString();
      let isoStartDate = new Date(AcknowladgementstartDate);

      let AcknowladgementendDate = new Date(AcknowladgementDateEnd).toISOString();
      let isoEndDate = new Date(AcknowladgementendDate);

      let obj = {
        $match: {
          "members.acknowledgement_date": {
            $gte: isoStartDate,
            $lte: isoEndDate,
          },
        },
      };

      aggregate.splice(6, 0, obj);
    }
    if (nameWiseFilter === "alphabetical") {
      aggregate.push({
        $sort: {
          "members.user.name": 1 // Sort members alphabetically by name
        }
      });
    }
    let communityActiveMembers;

    if (params.page && params.limit && filter !== "GroupWise") {
      communityActiveMembers = await Communities.aggregate(aggregate).collation({ 'locale': 'en' }).sort(sortObject).skip((page - 1) * limit).limit(limit);
    } else {
      communityActiveMembers = await Communities.aggregate(aggregate).collation({ 'locale': 'en' }).sort(sortObject);
    }

    if (eventId) {
      // Fetch the event from the database
      const event = await Events.findOne({ _id: eventId, is_deleted: false });

      // Check if event is found
      if (event) {
        // Iterate through each member and check if they have joined the specific event
        communityActiveMembers.forEach(member => {
          const hasJoinedEvent = event.rsvp.some(rsvp => rsvp.user_id && rsvp.user_id.toString() === member.members.member_id.toString());
          member.members.rsvpJoined = hasJoinedEvent;
        });
      } else {
        // If event is not found, set 'rsvpJoined' to false for all members
        communityActiveMembers.forEach(member => {
          member.members.rsvpJoined = false;
        });
      }
    } else {
      // If eventId is not provided, set 'rsvpJoined' to false for all members
      communityActiveMembers.forEach(member => {
        member.members.rsvpJoined = false;
      });
    }

    const total = await Communities.aggregate(aggregate);

    let from = 0;
    let to = 0;

    if (communityActiveMembers.length > 0) { // after query in db with pagination at least 1 data found
      from = ((page - 1) * limit) + 1;
      to = ((page - 1) * limit) + communityActiveMembers.length;
      // to = (communityActiveMembers.length <= total.length) ? (page * limit) : total.length;
      // to = (communityActiveMembers.length <= limit) ? (from + communityActiveMembers.length - 1) : (page * limit);
    }
    return {
      error: false,
      message: "generalSuccess",
      total: total.length,
      from: from,
      to: to,
      data: communityActiveMembers
    };
  },

  ActivePassiveMemberDetailsByID: async function (
    id,
    communityId,
    context = { lang: "en" },
    page,
    ageOfMinority
  ) {
    const ROLES_LANG_ENUM = Lib.getEnum("ROLES_LANG_ENUM");
    try {
      const user = await User.findOne({ is_deleted: false, _id: id });
      let community = await Communities.aggregate([
        {
          $match: {
            _id: new ObjectId(communityId),
            is_active: true,
            is_deleted: false,
          }
        },
        {
          $unwind: {
            path: "$members",
          },
        },
        {
          $match: {
            "members.member_id": new ObjectId(id),
            "members.is_approved": true,
            "members.is_rejected": false,
            "members.is_leaved": false,
            "members.is_deleted": false,
          },
        },
      ]);
      // error handling of community
      if (!community || community.length === 0) {
        return {
          error: true,
          message: 'Community not found'
        };
      }

      // Human readable role
      const role = community[0].members.roles[0];
      const humanReadble = ROLES_LANG_ENUM[role][context.lang];

      //pagination
      if (page) {
        page = parseInt(page);
      } else {
        page = 1;
      }
      // define limit per page
      const limit = 10;
      const skip = (page - 1) * limit;

      // family member aggration
      const totalFamilyMembers = ([
        {
          '$match': {
            '_id': new ObjectId(id),
            'is_deleted': false,
          },
        },
        {
          '$unwind': {
            'path': '$family_members',
          },
        },
        {
          '$match': {
            'family_members.is_deleted': false,
          },
        },
        ...(ageOfMinority ? [{
          $match: {
            "family_members.age_of_minority": ageOfMinority
          }
        }] : []),
        {
          $project: {
            "family_members._id": 1,
            "family_members.member_name": 1,
            "family_members.age_of_minority": 1,
            "family_members.gender": 1,
            "family_members.year_of_birth": 1,
            "family_members.email": 1,
            "family_members.phone": 1,
            "family_members.relation_type": 1,
            "family_members.first_address_line": 1,
            "family_members.second_address_line": 1,
            "family_members.city": 1,
            "family_members.state": 1,
            "family_members.country_code": 1,
            "family_members.phone_code": 1,
            "family_members.member_image": 1,
            "family_members.created_at": 1,
          },
        },
        {
          $sort: {
            "family_members.created_at": -1,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);
      const familyMembers = await User.aggregate(totalFamilyMembers);

      const familyMembersObj = familyMembers.map((value) => {
        key = {
          id: value.family_members._id,
          userId: value.family_members.user_id,
          ageOfMinority: value.family_members.age_of_minority,
          relationType: value.family_members.relation_type,
          memberName: value.family_members.member_name,
          memberImage: value.family_members.member_image,
          phone: value.family_members.phone,
          email: value.family_members.email,
          gender: value.family_members.gender,
          phoneCode: value.family_members.phone_code,
          countryCode: value.family_members.country_code,
          yearOfBirth: value.family_members.year_of_birth,
          firstAddressLine: value.family_members.first_address_line,
          secondAddressLine: value.family_members.second_address_line
        };
        return key;
      });


      const total = await User.aggregate(totalFamilyMembers);
      let userDetails = user;
      if (user.date_of_birth && user.date_of_birth.value != null) {
        userDetails = Lib.reconstructObjectKeys(Lib.generalizeUser(user.toJSON()), "value", Lib.convertDate);
      } else {
        userDetails = Lib.reconstructObjectKeys(Lib.generalizeUser(user.toJSON()));
      }

      if (ageOfMinority) {
        if (userDetails.familyMembers) {
          userDetails.familyMembers = userDetails.familyMembers.filter(
            fm => fm.ageOfMinority === ageOfMinority
          );
        }
      }

      return {
        error: false,
        message: "generalSuccess",
        data: {
          totalFamilyMembers: total.length,
          user: userDetails,
          role: humanReadble,
          filterFamilymembers: familyMembersObj
        }
      };
    } catch (e) {
      console.log(e);
      throw new ErrorModules.DatabaseError("User find error");
    }
  },

  myCommunityDashboardList: async function (id) {
    let aggregate = [
      {
        $match: {
          _id: new ObjectId(id),
        },
      },
      {
        $unwind: {
          path: "$members",
        },
      },
      {
        $match: {
          "members.is_leaved": false,
          "members.is_deleted": false,
          "members.is_approved": true,
          // "members.is_active": true,
          "members.is_rejected": false
        }
      },
      {
        $lookup: {
          from: "sr_users",
          localField: "members.member_id",
          foreignField: "_id",
          as: "members.user",
        },
      },
      {
        $unwind: {
          path: "$members.user",
        },
      },

      {
        $group: {
          _id: new ObjectId(id),
          count: { $sum: 1 },
        },
      },
    ];

    let eventAggregate = [
      {
        $match: {
          is_deleted: false,
          community_id: mongoose.Types.ObjectId(id),
          is_active: true,
          'time.to': { $gt: new Date() },
        },
      },
      {
        '$lookup': {
          'from': 'sr_users',
          'localField': 'host_id',
          'foreignField': '_id',
          'as': 'user'
        }
      },
      {
        '$lookup': {
          'from': 'sr_communities',
          'localField': 'community_id',
          'foreignField': '_id',
          'as': 'community'
        }
      },
      {
        '$unwind': {
          'path': '$user'
        },
      },
      {
        '$addFields': {
          'host_id': '$user.name',
        }
      },
      {
        '$unwind': {
          'path': '$community'
        },
      },
      {
        $sort: {
          'created_at': -1,
        },
      },
      {
        $limit: 2,
      },
    ];

    announcementAggregate = [
      {
        '$match': {
          'is_deleted': false,
          community_id: new ObjectId(id),
          is_active: true,
          'end_date': { $gt: new Date() },
        }
      },
      {
        '$lookup': {
          'from': 'sr_communities',
          'localField': 'community_id',
          'foreignField': '_id',
          'as': 'community'
        }
      },
      {
        '$unwind': {
          'path': '$community'
        },
      },
      {
        $sort: {
          'created_at': -1,
        },
      },
      {
        $limit: 3,
      },
    ];
    const [peopleCount, groupCount, eventCount, announcementCount, events, announcement] = await Promise.all([
      Communities.aggregate(aggregate),
      Group.countDocuments({ community_id: id, is_deleted: false }),
      Events.countDocuments({ community_id: id, is_deleted: false }),
      Announcement.countDocuments({ community_id: id, is_deleted: false }),
      Events.aggregate(eventAggregate),
      Announcement.aggregate(announcementAggregate),
    ]);
    const result = Lib.reconstructObjectKeys(events, ["rsvp_end_time", "to", "from"], Lib.convertIsoDate);
    const announcementResult = Lib.reconstructObjectKeys(announcement, "end_date", Lib.convertDate);
    return {
      error: false,
      message: "respondSuccess",
      data: {
        myCommunitieDasboard: {
          peopleCount: peopleCount[0] ? peopleCount[0].count : 0,
          groupCount: groupCount,
          eventCount: eventCount,
          announcementCount: announcementCount,
        },
        events: result,
        announcements: announcementResult
      },
    };
  },

  updateCommunityViewService: async function (id, params) {
    const community = await Communities.findOne({
      _id: ObjectId(id)
    });
    const communityName = community.community_name;
    if (Lib.isEmpty(community)) {
      throw new ErrorModules.Api404Error("noCommunityFound");
    }
    const communitySettings = await CommunitySettings.findOne({ community_id: ObjectId(id) });

    if (!communitySettings) {
      return { error: true, code: 404, message: 'communitySettingsNotFound' };
    }

    const freezePane = communitySettings.freeze_pane;
    let isChangeRequestNotify = false;

    if (params.logoImage && params.logoImage.startsWith('data:')) {
      // Extract base64 data and mime type
      const matches = params.logoImage.match(/^data:(.+);base64,(.+)$/);
      if (!matches) throw new Error("Invalid base64 image format");

      const mimeType = matches[1];
      const base64Data = matches[2];
      const fileBuffer = Buffer.from(base64Data, 'base64');
      const extension = mimeType.split('/')[1];
      const fileName = `community-logo.${extension}`;

      // Upload to S3
      const s3Url = await uploadFileToS3(fileBuffer, fileName, mimeType, 'community/logo');

      // Replace logoImage param with uploaded S3 URL
      params.logoImage = s3Url;
    }

    if (params.logoImage !== undefined) {
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
          // communityApprovalLog.content = params.logoImage;
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
    if (params.communityName !== undefined) {
      community.community_name = params.communityName;
    }
    if (params.communityDescription !== undefined) {
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
          // communityApprovalLog.content = params.communityDescription;
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

    if (params.communityEmail !== undefined) {
      const communityApprovalLog = await CommunityApprovalLog.findOne({ community_id: ObjectId(id), field: "community_email", is_approved: false, is_acknowledged: false });
      // Check if the community_email is different from the existing one
      if (!Lib.stringCompare(community.community_email, params.communityEmail)) {
        community.community_email_approval = false; // Set community_email_approval to false
      }

      if (freezePane) {
        if (!communityApprovalLog) {
          community.org_community_email = community.community_email;
        }
      } else {
        community.org_community_email = params.communityEmail;
      }
      // Creating log for new email change
      if (freezePane && !Lib.stringCompare(community.community_email, params.communityEmail)) {
        if (communityApprovalLog) {
          // communityApprovalLog.content = params.communityEmail;
          communityApprovalLog.is_acknowledged = true;
          await communityApprovalLog.save();
        }
        await CommunityApprovalLog.create({
          community_id: new ObjectId(id),
          type: "About",
          field: "community_email",
          fieldname: "community email",
          content: params.communityEmail
        });
        isChangeRequestNotify = true;
        communitySettings.webpage_approval_status = "not_approved";
        await communitySettings.save();
      }
      community.org_community_email = !freezePane ? params.communityEmail : community.community_email;
      community.community_email = params.communityEmail;
    }

    if (params.communityNumber !== undefined) {
      const communityApprovalLog = await CommunityApprovalLog.findOne({ community_id: ObjectId(id), field: "community_number", is_approved: false, is_acknowledged: false });
      if (freezePane) {
        if (!communityApprovalLog) {
          community.org_community_number = community.community_number;
        }
      } else {
        community.org_community_number = params.communityNumber;
      }
      // Creating log for new number change
      if (freezePane && !Lib.stringCompare(community.community_number, params.communityNumber)) {
        if (communityApprovalLog) {
          // communityApprovalLog.content = params.communityNumber;
          communityApprovalLog.is_acknowledged = true;
          await communityApprovalLog.save();
        }
        await CommunityApprovalLog.create({
          community_id: new ObjectId(id),
          type: "About",
          field: "community_number",
          fieldname: "community number",
          content: params.communityNumber
        });
        isChangeRequestNotify = true;
        communitySettings.webpage_approval_status = "not_approved";
        await communitySettings.save();
      }
      community.org_community_number = !freezePane ? params.communityNumber : community.community_number;
      community.community_number = params.communityNumber;
    }
    if (params.communityPhoneCode !== undefined) {
      community.community_phone_code = params.communityPhoneCode;
    }
    if (params.paymentCategory) {
      community.payment_category = params.paymentCategory;
      community.non_profit = params.paymentCategory === "NonProfit";
    }

    if (community.non_profit && params.nonProfitTaxId) {
      community.non_profit_tax_id = params.nonProfitTaxId;
    } else if (!community.non_profit) {
      community.non_profit_tax_id = "";
    }
    // Handle SMS App number update & verification reset
    let smsNumberChanged = false;

    if (params.phoneCode !== undefined && params.phoneCode !== community.sms_app_number.phone_code) {
      community.sms_app_number.phone_code = params.phoneCode;
      smsNumberChanged = true;
    }

    if (params.number !== undefined && params.number !== community.sms_app_number.number) {
      community.sms_app_number.number = params.number;
      smsNumberChanged = true;
    }

    // If any change, mark sms_app_number as unverified
    if (smsNumberChanged) {
      community.sms_app_number.is_verified = false;
    }

    // community.sms_app_number.phone_code = params.phoneCode !== undefined ? params.phoneCode : community.sms_app_number.phone_code;
    // community.sms_app_number.number = params.number !== undefined ? params.number : community.sms_app_number.number;
    community.address.city = params.city !== undefined ? params.city : community.address.city;
    community.address.state = params.state !== undefined ? params.state : community.address.state;
    community.address.country = params.country !== undefined ? params.country : community.address.country;
    community.address.zipcode = params.zipcode !== undefined ? params.zipcode : community.address.zipcode;
    community.address.first_address_line = params.firstAddressLine !== undefined ? params.firstAddressLine : community.address.first_address_line;
    community.address.second_address_line = params.secondAddressLine !== undefined ? params.secondAddressLine : community.address.second_address_line;

    let first_address_line = community.address.first_address_line;
    let city = community.address.city;
    let state = community.address.state;
    let country = community.address.country;
    let mainAddress = first_address_line + ',' + city + ',' + state + ',' + country;

    const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${mainAddress}&key=${process.env.GEOCODE_KEY}`;


    const response = await axios({
      url: endpoint,
      method: 'get'
    });
    let latitude = '';
    let longitude = '';
    let location = '';
    if (response.data.status == 'OK') {
      latitude = response.data.results[0].geometry.location.lat;
      longitude = response.data.results[0].geometry.location.lng;

      location = response.data.results[0].formatted_address;
    } else {
      location = mainAddress;
    }
    // Freeze pane log for community addtress
    const communityApprovalLog = await CommunityApprovalLog.findOne({ community_id: ObjectId(id), field: "address", is_approved: false, is_acknowledged: false });
    if (freezePane) {
      if (!communityApprovalLog) {
        community.community_location.org_location = community.community_location.location;
      }
    } else {
      community.community_location.org_location = location;
    }
    // Creating log for new address change
    if (freezePane && !Lib.stringCompare(community.community_location.location, location)) {
      if (communityApprovalLog) {
        communityApprovalLog.is_acknowledged = true;
        await communityApprovalLog.save();
      }
      await CommunityApprovalLog.create({
        community_id: new ObjectId(id),
        type: "About",
        field: "address",
        fieldname: "community address",
        content: location
      });
      isChangeRequestNotify = true;
      communitySettings.webpage_approval_status = "not_approved";
      await communitySettings.save();
    }
    community.community_location.org_location = !freezePane ? location : community.community_location.location;
    community.community_location.location = location;

    community.community_location.latitude = latitude;
    community.community_location.longitude = longitude;
    await community.save();
    // await community.save();
    if (isChangeRequestNotify) {
      // Getting admin details
      const admin = await User.findOne({ "user_type": "admin" });
      // Fetching admin device token 
      let webToken = [];
      if (admin) {
        webToken = admin.device_details.filter(device => device.is_active === true).map(device => device.web_token);
      }
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
          SECTION: "About Us Page"
        },
        isDotCom: true,
        section: "about",
        communityId: new ObjectId(id)
      }
      await notificationServices.notifyService(payload);
    }
    return ({ error: false, message: "communityUpdateSuccess", data: community });
  },
  switchOrganiztionPortal: async function (data, context) {
    const allRoles = await rolePermissionServices.getAllCreatedDotNetRole();
    const { communityId, userId } = data;
    let aggregate = [
      {
        $match: {
          _id: new ObjectId(communityId),
          is_active: true,
          is_deleted: false,
        },
      },
      {
        $unwind: {
          path: "$members",
        },
      },
      {
        $match: {
          "members.member_id": ObjectId(userId),
          "members.roles": { $in: allRoles.data },
          "members.is_approved": true,
          "members.is_rejected": false,
          "members.is_leaved": false,
          "members.is_deleted": false,
        },
      },
    ];
    let communities = await Communities.aggregate(aggregate);

    if (Lib.isEmpty(communities)) {
      return {
        error: true,
        message: "noCommunityFound",
        ErrorClass: ErrorModules.Api404Error,
      };
    }
    communities = communities[0];

    // Original switching
    const user = await User.findOne(
      {
        _id: ObjectId(userId),
        is_active: true,
        is_deleted: false,
      },
      "_id selected_organization_portal"
    );

    // const oldData = { selected_community: user.selected_organization_portal };
    let oldCommunity = null;
    if (user.selected_organization_portal) {
      oldCommunity = await Communities.findOne(
        { _id: ObjectId(user.selected_organization_portal) },
        { community_name: 1 }
      );
    }

    const oldData = {
      selected_community_id: user.selected_organization_portal || null,
      selected_community_name: oldCommunity.community_name,
    };

    user.selected_organization_portal = ObjectId(communityId);
    await user.save();
    // const newData = { selected_community: user.selected_organization_portal };
    const newCommunity = await Communities.findOne(
      { _id: ObjectId(communityId) },
      { community_name: 1 }
    );

    const newData = {
      selected_community_id: user.selected_organization_portal,
      selected_community_name: newCommunity ? newCommunity.community_name : null,
    };

    const community = await Communities.findOne({ _id: new ObjectId(communityId) });
    const member = community.members.find(
      (m) => m.member_id.toString() === userId.toString()
    );
    const userRole = member.roles;

    await ActivityLogService.activityLogActiion({
      communityId: communityId,
      userId: userId,
      module: "COMMUNITY",
      action: "SWITCH_COMMUNITY",
      platForm: "web",
      memberRole: userRole,
      oldData: oldData,
      newData: newData
    })
    if (communities.members.roles[0] === "board_member") {
      // notificationHelper.getFcmTokens(context.user.id, 'BOARDMEMBERSIGNIN', 'en');
      payload = {
        recipient:
        {
          user_id: context.user.id,
        },
        template: {
          type: "Push",
          slug: "BOARDMEMBERSIGNIN",
          lang: "en"
        },
        image: `${process.env.AWS_PATH}/image_2024_03_19T13_57_20_167Z.png`
      }
      await notificationServices.notifyService(payload);
    }
    if (communities.members.roles[0] === 'executive_member') {
      // notificationHelper.getFcmTokens(context.user.id, 'EXECUTIVEMEMBER', 'en');
      payload = {
        recipient:
        {
          user_id: context.user.id,
        },
        template: {
          type: "Push",
          slug: "EXECUTIVEMEMBER",
          lang: "en"
        },
        image: `${process.env.AWS_PATH}/image_2024_03_19T13_57_20_167Z.png`
      }
    }
    return { error: false, message: "organizationSwitchSuccess", data: { role: communities.members.roles[0] } };
  },

  currentUserRole: async function (communityId, userId) {
    let aggregate = [
      {
        $match: {
          _id: new ObjectId(communityId),
          is_active: true,
          is_deleted: false,
        },
      },
      {
        $unwind: {
          path: "$members",
        },
      },
      {
        $match: {
          "members.member_id": ObjectId(userId),
          "members.roles": { $in: ["board_member", "executive_member"] },
          "members.is_approved": true,
          "members.is_rejected": false,
          "members.is_leaved": false,
          "members.is_deleted": false,
        },
      },
    ];
    let communities = await Communities.aggregate(aggregate);

    if (Lib.isEmpty(communities)) {
      return {
        error: true,
        message: "noCommunityFound",
        ErrorClass: ErrorModules.Api404Error,
      };
    }
    communities = communities[0];

    return { error: false, message: "generalSuccess", data: { role: communities.members.roles[0] } };
  },

  addOrgGlobalSettings: async function (communityId, params, userId) {
    let communitySettings = await CommunitySettings.findOne({ community_id: new ObjectId(communityId) });
    let slug = '';
    if (params.lebel) {
      slug = await this.titleToSlug(params.lebel);
      if (slug.toLowerCase().includes("sangaraahi")) {
        return { error: true, message: 'Label can not contains "SangaRaahi" in it.' };
      }
      if (communitySettings && communitySettings.slug !== slug) {
        let sameSlug = await CommunitySettings.findOne({ slug: slug });
        if (sameSlug) {
          return { error: true, message: "Label is already used." };
        }
      } else if (Lib.isEmpty(communitySettings)) {
        let sameSlug = await CommunitySettings.findOne({ slug: slug });
        if (sameSlug) {
          return { error: true, message: "Label is already used." };
        }
      }
    }
    // store old data
    let oldData = null;
    if (!Lib.isEmpty(communitySettings)) {
      oldData = communitySettings.toObject();
    }
    if (Lib.isEmpty(communitySettings)) {
      await CommunitySettings.create({
        community_id: new ObjectId(communityId),
        announcement_page: params.announcementPage ? params.announcementPage : false,
        video_page: params.videoPage ? params.videoPage : false,
        payment_page: params.paymentPage ? params.paymentPage : false,
        about_page: params.aboutPage ? params.aboutPage : false,
        lebel: params.lebel ? params.lebel : '',
        slug: slug,
        webpage_approval_status: 'active',
        watermark: params.watermark ? params.watermark : '',
        header_font: params.headerFont ? params.headerFont : '',
        header_font_size: params.headerFontSize ? params.headerFontSize : null,
        body_font: params.bodyFont ? params.bodyFont : '',
        body_font_size: params.bodyFontSize ? params.bodyFontSize : null,
        text_color: params.textColor ? params.textColor : '',
        backgroup_color: params.backgroupColor ? params.backgroupColor : '',
      })
    } else {
      if (communitySettings.slug === undefined) {
        communitySettings.webpage_approval_status = 'active';
      }
      communitySettings.announcement_page = params.announcementPage ? params.announcementPage : false,
        communitySettings.video_page = params.videoPage ? params.videoPage : false,
        communitySettings.payment_page = params.paymentPage ? params.paymentPage : false,
        communitySettings.about_page = params.aboutPage ? params.aboutPage : false,
        communitySettings.lebel = params.lebel ? params.lebel : '',
        communitySettings.slug = slug,
        communitySettings.watermark = params.watermark ? params.watermark : '',
        communitySettings.header_font = params.headerFont ? params.headerFont : '',
        communitySettings.header_font_size = params.headerFontSize ? params.headerFontSize : null,
        communitySettings.body_font = params.bodyFont ? params.bodyFont : '',
        communitySettings.body_font_size = params.bodyFontSize ? params.bodyFontSize : null,
        communitySettings.text_color = params.textColor ? params.textColor : '',
        communitySettings.backgroup_color = params.backgroupColor ? params.backgroupColor : '',
        await communitySettings.save();
    }
    // store new data
    const newData = communitySettings.toObject();

    const community = await Communities.findOne({ _id: new ObjectId(communityId) });
    const member = community.members.find(
      (m) => m.member_id.toString() === userId.toString()
    );
    const userRole = member.roles;

    // save log
    await ActivityLogService.activityLogActiion({
      communityId: communityId,
      userId: userId,
      module: "COMMUNITY_MANAGEMENT",
      action: "UPDATE_COMMUNITY_SETTINGS",
      platForm: "web",
      memberRole: userRole,
      oldData: oldData,
      newData: newData
    })
    return { error: false, message: "communitySettingsUpdateSuccess" };
  },
  titleToSlug: async function (title) {
    let slug;

    // convert to lower case
    slug = title.toLowerCase();
    // remove special characters
    slug = slug.replace(/\`|\~|\!|\@|\#|\||\$|\%|\^|\&|\*|\(|\)|\+|\=|\,|\.|\/|\?|\>|\<|\'|\"|\:|\;|/gi, '');
    // The /gi modifier is used to do a case insensitive search of all occurrences of a regular expression in a string

    // replace spaces with dash symbols
    slug = slug.replace(/ /gi, "-");

    // remove consecutive dash symbols 
    slug = slug.replace(/\-\-\-\-\-/gi, '-');
    slug = slug.replace(/\-\-\-\-/gi, '-');
    slug = slug.replace(/\-\-\-/gi, '-');
    slug = slug.replace(/\-\-/gi, '-');

    // remove the unwanted dash symbols at the beginning and the end of the slug
    slug = '@' + slug + '@';
    slug = slug.replace(/\@\-|\-\@|\@/gi, '');
    return slug;
  },

  // getMyCommunitiesSettingsView: async function (params) {
  //   let query = {};
  //   if (params.communityId) {
  //     query = { community_id: new ObjectId(params.communityId) };
  //   } else if (params.slug) {
  //     query = { slug: params.slug };
  //   }
  //   // Retrieve the community settings view based on the provided ID or Slug
  //   const communitySetting = await CommunitySettings.findOne(query);
  //   // if (!communitySetting) {
  //   //   return {
  //   //     error: true,
  //   //     systemCode: "NOT_FOUND",
  //   //     code: 404,
  //   //     message: "Community Settings is not found",
  //   //   };
  //   // }
  //   // Fetch the community's name
  //   if (communitySetting && communitySetting.community_id) {
  //     const community = await Communities.findOne({ _id: communitySetting.community_id }).lean();
  //     console.log(community,"community............");
  //     communitySetting.communityName = community ? community.community_name : '';
  //   }
  //   return {
  //     error: false,
  //     systemCode: "SUCCESS",
  //     code: 200,
  //     message: "Community retrieved successfully",
  //     data: Lib.reconstructObjectKeys(communitySetting)
  //   };
  // },

  getMyCommunitiesSettingsView: async function (params) {
    let query = {};

    if (params.communityId) {
      query = { community_id: new ObjectId(params.communityId) };
    } else if (params.slug) {
      query = { slug: params.slug };
    }

    // Retrieve the community settings view based on the provided ID or Slug
    const communitySetting = await CommunitySettings.findOne(query).lean(); // Convert it to a plain JavaScript object directly
    if (!communitySetting) {
      return {
        error: true,
        systemCode: "NOT_FOUND",
        code: 404,
        message: "Community Settings is not found",
      };
    }

    // Fetch the community's name
    if (communitySetting.community_id) {
      const community = await Communities.findOne({ _id: communitySetting.community_id });
      communitySetting.communityName = community ? community.community_name : '';
    }

    return {
      error: false,
      systemCode: "SUCCESS",
      code: 200,
      message: "Community retrieved successfully",
      data: Lib.reconstructObjectKeys(communitySetting)
    };
  },


  // Admin Home page settings update
  orgHomePageAdminApproval: async function (params) {
    const communityId = params.communityId;
    const communityAdminApprovalSettings = await CommunityAdminApprovalSettings.findOne({ community_id: new ObjectId(communityId) });
    if (Lib.isEmpty(communityAdminApprovalSettings)) {
      await CommunityAdminApprovalSettings.create({
        community_id: new ObjectId(communityId),
        is_approve_community_banner_image: params.bannerImageApproval ? true : false,
        is_approve_community_logo_image: params.logoImageApproval ? true : false,
        is_approve_community_description: params.communityDescriptionApproval ? true : false
      })
    } else {
      communityAdminApprovalSettings.is_approve_community_banner_image = params.bannerImageApproval ? true : false;
      communityAdminApprovalSettings.is_approve_community_logo_image = params.logoImageApproval ? true : false;
      communityAdminApprovalSettings.is_approve_community_description = params.communityDescriptionApproval ? true : false;
      await communityAdminApprovalSettings.save();
    }

    return {
      error: false,
      systemCode: "SUCCESS",
      code: 200,
      message: "homeSettingsSaveSuccess"
    };
  },

  // Get Home & About page admin Settings
  getOrgPageAdminApproval: async function (communityId) {
    const communityAdminSettings = await communityWebpageServices.communityAdminApprovalCheck(communityId);
    return { error: false, systemCode: "SUCCESS", code: 200, message: "generalSuccess", data: Lib.reconstructObjectKeys(communityAdminSettings) };
  },

  // Admin About page settings update
  aboutPageAdminApproval: async function (params) {
    const communityId = params.communityId;
    const community = await Communities.findOne({ _id: new ObjectId(communityId), is_deleted: false });
    if (Lib.isEmpty(community)) {
      return {
        error: true,
        message: "noCommunityFound",
        ErrorClass: ErrorModules.Api404Error,
      };
    }
    const communityAdminApprovalSettings = await CommunityAdminApprovalSettings.findOne({ community_id: new ObjectId(communityId) });
    if (Lib.isEmpty(communityAdminApprovalSettings)) {
      await CommunityAdminApprovalSettings.create({
        community_id: new ObjectId(communityId),
        is_approve_community_address: params.communityLocationApproval ? true : false,
        is_approve_community_email_address: params.communityEmailApproval ? true : false,
        is_approve_community_phone_number: params.communityNumberApproval ? true : false
      })
    } else {
      communityAdminApprovalSettings.is_approve_community_address = params.communityLocationApproval ? true : false;
      communityAdminApprovalSettings.is_approve_community_email_address = params.communityEmailApproval ? true : false;
      communityAdminApprovalSettings.is_approve_community_phone_number = params.communityNumberApproval ? true : false;
      await communityAdminApprovalSettings.save();
    }

    const members = params.communityMemberApproval;
    await Promise.all(members.map(async element => {
      community.members.map((member) => {
        if (element.memberId === member.member_id.toString() && !member.is_deleted && !member.is_leaved) {
          member.is_admin_approved = element.isApprove ? true : false;
        }
      });
    }));
    await community.save();
    return {
      error: false,
      systemCode: "SUCCESS",
      code: 200,
      message: "aboutSettingsSaveSuccess"
    };
  },

  getCommunityIdFromSlug: async function (slug) {
    const communitySettingsDetails = await CommunitySettings.findOne({ slug: slug });

    if (Lib.isEmpty(communitySettingsDetails)) {
      return {
        error: true,
        message: "noCommunitySettingsFound",
        ErrorClass: ErrorModules.Api404Error,
      };
    } else {
      return {
        error: false,
        systemCode: "SUCCESS",
        code: 200,
        message: "success",
        data: Lib.reconstructObjectKeys(communitySettingsDetails)
      };
    }
  },
  viewSmsEmailGlobalSettings: async function (data) {
    try {
      const { communityId } = data;

      // Find the community by its ID
      const community = await Communities.findById(communityId);

      if (!community) {
        return {
          code: 404,
          error: true,
          systemCode: "NOT_FOUND",
          message: "Community not found",
          data: null
        };
      }

      // Extract SMS and email settings from the community
      const { sms_settings, email_settings } = community.sms_email_global_settings;

      return {
        code: 200,
        error: false,
        systemCode: "SUCCESS",
        message: "Sms and email settings retrieved successfully",
        data: {
          sms: sms_settings,
          email: email_settings
        }
      };
    } catch (error) {
      console.error("Error viewing SMS and email global settings:", error);
      return {
        code: 500,
        error: true,
        systemCode: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while viewing SMS and email global settings",
        data: null
      };
    }
  },
  myCommunityDotNetGlobalSearch: async (search, communityId) => {
    try {
      // const announcements = await Announcement.find({
      //   title: { $regex: search, $options: "i" },
      //   community_id: communityId,
      //   is_deleted: false,
      // });
      function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
      }

      let searchString = escapeRegExp(search);

      const announcements = await Announcement.aggregate([
        {
          '$match': {
            'is_deleted': false,
            community_id: new ObjectId(communityId)
          }
        },
        {
          '$lookup': {
            'from': 'sr_communities',
            'localField': 'community_id',
            'foreignField': '_id',
            'as': 'community'
          }
        },
        {
          '$unwind': {
            'path': '$community'
          },
        },
        {
          $match: {
            $or: [
              { "title": { $regex: searchString, $options: "i" } },
            ],
          },
        },
      ]);

      const communityfeedbacks = await CommunityFeedback.find({
        email: { $regex: searchString, $options: "i" },
        community_id: communityId,
        is_deleted: false,
      });

      // const events = await Events.find({
      //   title: { $regex: search, $options: "i" },
      //   community_id: communityId,
      //   is_deleted: false,
      // });

      const events = await Events.aggregate([
        {
          '$match': {
            'is_deleted': false,
            'community_id': mongoose.Types.ObjectId(communityId) // filter for the desired community ID
          }
        },
        {
          '$lookup': {
            'from': 'sr_users',
            'localField': 'host_id',
            'foreignField': '_id',
            'as': 'user'
          }
        },
        {
          '$lookup': {
            'from': 'sr_communities',
            'localField': 'community_id',
            'foreignField': '_id',
            'as': 'community'
          }
        },
        {
          '$unwind': {
            'path': '$user'
          },
        },
        {
          '$addFields': {
            'host_id': '$user.name',
          }
        },
        {
          '$unwind': {
            'path': '$community'
          },
        },
        {
          $match: {
            $or: [
              { "title": { $regex: searchString, $options: "i" } },
            ],
          },
        },
      ]);

      // const groups = await Group.find({
      //   name: { $regex: search, $options: "i" },
      //   community_id: communityId,
      //   is_deleted: false,
      // });
      const groups = await Group.aggregate([
        {
          '$match': {
            'is_deleted': false,
            'community_id': mongoose.Types.ObjectId(communityId) // filter for the desired community ID
          }
        },
        {
          '$lookup': {
            'from': 'sr_users',
            'localField': 'created_by',
            'foreignField': '_id',
            'as': 'user'
          }
        },
        {
          '$lookup': {
            'from': 'sr_communities',
            'localField': 'community_id',
            'foreignField': '_id',
            'as': 'community'
          }
        },
        {
          '$unwind': {
            'path': '$user'
          },
        },
        {
          '$addFields': {
            'created_by': '$user.name',
            'memberCount': { '$size': '$members' }
            // total: { $size: "$members" },
          }
        },
        {
          '$unwind': {
            'path': '$community'
          },
        },
        {
          $match: {
            $or: [
              { "name": { $regex: searchString, $options: "i" } },
            ],
          },
        },
      ]);
      let total = 0;
      groups.forEach((group) => {
        total += group.memberCount;
      });



      const members = await Communities.aggregate([

        {
          $match: {
            _id: new ObjectId(communityId),
          },
        },
        {
          $unwind: {
            path: "$members",
          },
        },
        {
          $match: {
            "members.is_rejected": false,
            "members.is_leaved": false,
            "members.is_deleted": false,
          },
        },
        {
          $lookup: {
            from: "sr_users",
            localField: "members.member_id",
            foreignField: "_id",
            as: "members.user",
          },
        },
        {
          $unwind: {
            path: "$members.user",
          },
        },
        {
          $match: {
            "members.user.is_deleted": false,
            "members.user.is_active": true,
          }
        },
        {
          $match: {
            $or: [
              { "members.user.name": { $regex: searchString, $options: "i" } },
              {
                "members.user.contact.email.address": { $regex: searchString, $options: "i" }
              },
              {
                "members.user.contact.phone.number": { $regex: searchString, $options: "i" }
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$members.roles",
          },
        },
        {
          $sort: {
            "members.user.created_at": -1,
          },
        },
        {
          $project: {
            community_name: 1,
            "members.member_id": 1,
            "members.roles": 1,
            "members.is_active": 1,
            "members.joined_at": 1,
            "members.user._id": 1,
            "members.user.name": 1,
            "members.user.email": "$members.user.contact.email.address", // Access the email field from the 'contact' object
            "members.user.phone": "$members.user.contact.phone.number", // Access the phone field from the 'contact' object
            "members.user.profile_image": 1,
            "members.user.created_at": 1,
            "members.user.last_activity_at": 1,
            "members.acknowledgement_status": 1,
            "members.acknowledgement_date": 1,
            "members.invitation_date": 1,
          },
        },

      ]);
      const announcementsResult = Lib.reconstructObjectKeys(announcements, ["end_date"], Lib.convertIsoDate);
      const communityfeedbacksResult = Lib.reconstructObjectKeys(communityfeedbacks, ["created_at"], Lib.convertIsoDate);
      const eventsResult = Lib.reconstructObjectKeys(events);
      const groupssResult = Lib.reconstructObjectKeys(groups);
      const membersResult = Lib.reconstructObjectKeys(members, ["acknowledgement_date", "invitation_date", "joined_at"], Lib.convertIsoDate);

      const globalSearchData = {
        announcements: announcementsResult,
        communityfeedbacks: communityfeedbacksResult,
        events: eventsResult,
        groups: {
          total: total,
          groupList: groupssResult,
        },
        members: membersResult,
      };

      return {
        error: false,
        systemCode: "SUCCESS",
        code: 200,
        message: "success",
        data: globalSearchData
      };
    } catch (error) {
      return {
        error: true,
        systemCode: "ERROR",
        code: 500,
        message: "An error occurred during global search",
        data: null,
      };
    }
  },


  // myCommunityOrgGlobalSearch: async (search, id) => {
  //     const community = await Communities.findOne({ _id: ObjectId(id) });
  //     if (!community) {
  //       throw new ErrorModules.Api404Error("noCommunityFound");
  //     }

  //     const getCommunitySettings = await CommunitySettings.findOne({ community_id: ObjectId(id) });
  //     let announcements = [];
  //     let events = [];
  //     let videos = [];
  //     if (getCommunitySettings.announcement_page) {
  //        announcements = await Announcement.find({
  //         title: { $regex: search, $options: "i" },
  //         community_id: id,
  //         is_active:true,
  //         is_deleted: false,
  //       });
  //        events = await Events.find({
  //         title: { $regex: search, $options: "i" },
  //         community_id: id,
  //         is_active:true,
  //         is_deleted: false,
  //       });
  //     }
  //     if (getCommunitySettings.video_page) {
  //        videos = await Videos.find({
  //         title: { $regex: search, $options: "i" },
  //         community_id: id,
  //         is_active:true,
  //         is_deleted: false,
  //       });
  //     }

  // const groups = await Group.find({
  //   name: { $regex: search, $options: "i" },
  //   community_id: id,
  //   is_active:true,
  //   is_deleted: false,
  // });
  //     const OrgGlobalSearchData = {
  //       announcements,
  //       events,
  //       groups,
  //       videos,
  //     };

  //     return {
  //       error: false,
  //       systemCode: "SUCCESS",
  //       code: 200,
  //       message: "success",
  //       data: Lib.reconstructObjectKeys(OrgGlobalSearchData)
  //     };
  //   }

  myCommunityOrgGlobalSearch: async (search, id) => {
    const community = await Communities.findOne({ _id: ObjectId(id) });
    if (!community) {
      throw new ErrorModules.Api404Error("noCommunityFound");
    }

    const getCommunitySettings = await CommunitySettings.findOne({ community_id: ObjectId(id) });
    let publicAnnouncement = [];
    let memberAnnouncement = [];
    let publicEvents = [];
    let pastEvents = [];
    let membersOnlyEvents = [];
    let videos = [];

    if (getCommunitySettings.announcement_page) {
      const announcements = await Announcement.find({
        title: { $regex: search, $options: "i" },
        community_id: id,
        is_active: true,
        is_deleted: false,
      });

      announcements.forEach(announcement => {
        if (announcement.to_whom === "Public") {
          publicAnnouncement.push(announcement);
        } else if (announcement.to_whom === "Member") {
          memberAnnouncement.push(announcement);
        }
      });

      const events = await Events.find({
        title: { $regex: search, $options: "i" },
        community_id: id,
        is_active: true,
        is_deleted: false,
      });

      events.forEach(event => {
        if (event.invitation_type === "Public") {
          publicEvents.push(event);
        } else if (event.invitation_type === "Members") {
          membersOnlyEvents.push(event);
        }

        // Check if event is a past event based on current date/time
        const currentDate = new Date();
        if (event.date.to < currentDate) {
          pastEvents.push(event);
        }
      });
    }

    if (getCommunitySettings.video_page) {
      videos = await Videos.find({
        title: { $regex: search, $options: "i" },
        community_id: id,
        is_active: true,
        is_deleted: false,
      });
    }

    const groups = await Group.find({
      name: { $regex: search, $options: "i" },
      community_id: id,
      is_active: true,
      is_deleted: false,
    });
    const publicAnnouncementResult = Lib.reconstructObjectKeys(publicAnnouncement, ["end_date"], Lib.convertIsoDate);
    const memberAnnouncementResult = Lib.reconstructObjectKeys(memberAnnouncement, ["end_date"], Lib.convertIsoDate);
    const pastEventsResult = Lib.reconstructObjectKeys(pastEvents, ["rsvp_end_time", "to", "from"], Lib.convertIsoDate);
    const publicEventsResult = Lib.reconstructObjectKeys(publicEvents, ["rsvp_end_time", "to", "from"], Lib.convertIsoDate);
    const membersOnlyEventsResult = Lib.reconstructObjectKeys(membersOnlyEvents, ["rsvp_end_time", "to", "from"], Lib.convertIsoDate);
    const groupsResult = Lib.reconstructObjectKeys(groups);
    const videosResult = Lib.reconstructObjectKeys(videos, ["created_at"], Lib.convertIsoDate);
    const OrgGlobalSearchData = {
      announcements: {
        publicAnnouncement: publicAnnouncementResult,
        memberAnnouncement: memberAnnouncementResult
      },
      events: {
        publicEvents: publicEventsResult,
        pastEvents: pastEventsResult,
        membersOnlyEvents: membersOnlyEventsResult,
      },
      groups: groupsResult,
      videos: videosResult,
    };

    return {
      error: false,
      systemCode: "SUCCESS",
      code: 200,
      message: "success",
      data: OrgGlobalSearchData,
    };
  },


  adminLogApproval: async function (params) {
    const id = params.id;
    const isApprove = params.isApprove;

    const communityApprovalLog = await CommunityApprovalLog.findOne({ _id: ObjectId(id) });

    if (Lib.isEmpty(communityApprovalLog)) {
      return {
        error: true,
        message: "noLogFound",
        ErrorClass: ErrorModules.Api404Error,
      };
    }

    // Logo image approval
    if (communityApprovalLog.field === "logo_image") {
      const community = await Communities.findOne({ _id: ObjectId(communityApprovalLog.community_id), is_deleted: false });

      if (!community) {
        throw new ErrorModules.Api404Error("noCommunityFound");
      }
      if (isApprove) {
        community.org_logo_image = communityApprovalLog.content;
        await community.save();

        communityApprovalLog.is_acknowledged = true;
        communityApprovalLog.is_approved = true;
      } else {
        communityApprovalLog.is_acknowledged = true;
        communityApprovalLog.is_approved = false;
      }
      await communityApprovalLog.save();
    }

    // Banner image approval
    if (communityApprovalLog.field === "banner_image") {
      const community = await Communities.findOne({ _id: ObjectId(communityApprovalLog.community_id), is_deleted: false });

      if (!community) {
        throw new ErrorModules.Api404Error("noCommunityFound");
      }
      if (isApprove) {
        community.org_banner_image = communityApprovalLog.content;
        await community.save();

        communityApprovalLog.is_acknowledged = true;
        communityApprovalLog.is_approved = true;
      } else {
        communityApprovalLog.is_acknowledged = true;
        communityApprovalLog.is_approved = false;
      }
      await communityApprovalLog.save();
    }

    // Community description approval
    if (communityApprovalLog.field === "community_description") {
      const community = await Communities.findOne({ _id: ObjectId(communityApprovalLog.community_id), is_deleted: false });

      if (!community) {
        throw new ErrorModules.Api404Error("noCommunityFound");
      }
      if (isApprove) {
        community.org_community_description = communityApprovalLog.content;
        await community.save();

        communityApprovalLog.is_acknowledged = true;
        communityApprovalLog.is_approved = true;
      } else {
        communityApprovalLog.is_acknowledged = true;
        communityApprovalLog.is_approved = false;
      }
      await communityApprovalLog.save();
    }

    // Video approval
    if (communityApprovalLog.field === "video") {
      const video = await Videos.findOne({ _id: ObjectId(communityApprovalLog.content_id), is_deleted: false });

      if (!video) {
        throw new ErrorModules.Api404Error("noVideoFound");
      }

      if (isApprove) {
        if (Lib.stringCompare(video.link, video.org_link)) {
          video.is_approved = true;
        } else {
          video.org_title = video.title;
          video.org_description = video.description;
          video.org_thumbnail_image = video.thumbnailImage;
          video.org_link = video.link;
          video.org_order_no = video.orderNo;
          video.org_type = video.type;
          video.org_duration = video.duration;
        }
      }
      await video.save();

      communityApprovalLog.is_acknowledged = true;
      communityApprovalLog.is_approved = isApprove;
      await communityApprovalLog.save();
    }

    // QR image approval
    if (communityApprovalLog.field === "qrcode_image") {
      const communityPayment = await CommunityPayment.findOne({ community_id: ObjectId(communityApprovalLog.community_id) });

      if (!communityPayment) {
        throw new ErrorModules.Api404Error("noVideoFound");
      }

      if (isApprove) {
        communityPayment.org_qrcode_image = communityApprovalLog.content;
        await communityPayment.save();
      }
      communityApprovalLog.is_acknowledged = true;
      communityApprovalLog.is_approved = isApprove;
      await communityApprovalLog.save();
    }

    // Payment Description approval
    if (communityApprovalLog.field === "payment_description") {
      const communityPayment = await CommunityPayment.findOne({ community_id: ObjectId(communityApprovalLog.community_id) });

      if (!communityPayment) {
        throw new ErrorModules.Api404Error("noVideoFound");
      }

      if (isApprove) {
        communityPayment.org_payment_description = communityApprovalLog.content;
        await communityPayment.save();
      }
      communityApprovalLog.is_acknowledged = true;
      communityApprovalLog.is_approved = isApprove;
      await communityApprovalLog.save();
    }

    // Authority Name approval
    if (communityApprovalLog.field === "authority_name") {
      const communityPayment = await CommunityPayment.findOne({ community_id: ObjectId(communityApprovalLog.community_id) });

      if (!communityPayment) {
        throw new ErrorModules.Api404Error("noVideoFound");
      }

      if (isApprove) {
        communityPayment.org_authority_name = communityApprovalLog.content;
        await communityPayment.save();
      }
      communityApprovalLog.is_acknowledged = true;
      communityApprovalLog.is_approved = isApprove;
      await communityApprovalLog.save();
    }

    // Payment link approval
    if (communityApprovalLog.field === "link") {
      const communityPayment = await CommunityPayment.findOne({ community_id: ObjectId(communityApprovalLog.community_id) });

      if (!communityPayment) {
        throw new ErrorModules.Api404Error("noVideoFound");
      }

      if (isApprove) {
        communityPayment.org_link = communityApprovalLog.content;
        await communityPayment.save();
      }
      communityApprovalLog.is_acknowledged = true;
      communityApprovalLog.is_approved = isApprove;
      await communityApprovalLog.save();
    }

    // Community email approval
    if (communityApprovalLog.field === "community_email") {
      const community = await Communities.findOne({ _id: ObjectId(communityApprovalLog.community_id), is_deleted: false });

      if (!community) {
        throw new ErrorModules.Api404Error("noCommunityFound");
      }
      if (isApprove) {
        community.org_community_email = communityApprovalLog.content;
        await community.save();
      }
      communityApprovalLog.is_acknowledged = true;
      communityApprovalLog.is_approved = isApprove;
      await communityApprovalLog.save();
    }

    // Community number approval
    if (communityApprovalLog.field === "community_number") {
      const community = await Communities.findOne({ _id: ObjectId(communityApprovalLog.community_id), is_deleted: false });

      if (!community) {
        throw new ErrorModules.Api404Error("noCommunityFound");
      }
      if (isApprove) {
        community.community_location.org_location = communityApprovalLog.content;
        await community.save();
      }
      communityApprovalLog.is_acknowledged = true;
      communityApprovalLog.is_approved = isApprove;
      await communityApprovalLog.save();
    }

    // Community address approval
    if (communityApprovalLog.field === "address") {
      const community = await Communities.findOne({ _id: ObjectId(communityApprovalLog.community_id), is_deleted: false });

      if (!community) {
        throw new ErrorModules.Api404Error("noCommunityFound");
      }
      if (isApprove) {
        community.community_location.org_location = communityApprovalLog.content;
        await community.save();
      }
      communityApprovalLog.is_acknowledged = true;
      communityApprovalLog.is_approved = isApprove;
      await communityApprovalLog.save();
    }
    const communityId = communityApprovalLog.community_id;
    const statusCheck = await CommunityApprovalLog.find({ community_id: ObjectId(communityId), is_acknowledged: false });
    const communitySettings = await CommunitySettings.findOne({ community_id: ObjectId(communityId) });
    if (Lib.isEmpty(statusCheck)) {
      communitySettings.webpage_approval_status = "active";
      await communitySettings.save();
    }

    return {
      error: false,
      systemCode: "SUCCESS",
      code: 200,
      message: "success"
    };
  },


  adminLogApprovalList: async function (communityId, type) {
    const communityApprovalLog = await CommunityApprovalLog.find({ community_id: new ObjectId(communityId), type: type, is_acknowledged: false });
    return {
      error: false,
      systemCode: "SUCCESS",
      code: 200,
      message: "success",
      data: Lib.reconstructObjectKeys(communityApprovalLog),
    };
  },

  editCurrency: async function ({ communityId, currency }) {
    const community = await Communities.findOne({ _id: new ObjectId(communityId) });
    if (!community) {
      throw new ErrorModules.Api404Error("noCommunityFound");
    }
    community.currency = currency;
    community.currency_restriction = true;

    community.save();
    return {
      error: false,
      systemCode: "SUCCESS",
      code: 200,
      message: "success",
    };
  },

  verifyCommunityEmail: async function (email, communityId, userId) {
    const community = await Communities.findOne({ _id: new ObjectId(communityId) });
    if (!community) {
      throw new ErrorModules.Api404Error("noCommunityFound");
    }
    if (community.community_email_approval) {
      return { error: true, message: "emailAlreadyApproved", ErrorClass: ErrorModules.GeneralApiError };
    }
    // const token = Lib.generateRandomNumber(100000, 999999);
    const token = 700091;
    const code = Lib.generateOtpToken(token, Lib.getEnum("OTP_CAUSE._verification"));

    community.code = code;
    community.save();
    /**
      * Send mail with OTP
    */
    const payload = {
      recipient:
      {
        email: email,
        user_id: new ObjectId(userId)
      },
      template: {
        type: "Email",
        slug: "EMAILVERIFICATION",
        lang: "en"
      },
      contents: {
        OTP: token,
        EMAIL: email
      }
    }
    //Sending Email 
    await notificationServices.notifyService(payload);
    return {
      error: false,
      systemCode: "SUCCESS",
      code: 200,
      message: "success",
    };
  },

  verifyCommunityOTP: async function (otp, communityId) {
    const community = await Communities.findOne({ _id: new ObjectId(communityId) });
    if (!community) {
      throw new ErrorModules.Api404Error("noCommunityFound");
    }
    if (community.community_email_approval) {
      return { error: true, message: "emailAlreadyApproved", ErrorClass: ErrorModules.GeneralApiError };
    }
    const code = community.code;
    if (!code) return { error: true, message: "notAllowed", ErrorClass: ErrorModules.GeneralApiError };
    const data = jwt.verify(code, Lib.ENV('GENERAL_SECRET_KEY'));
    if (data.otp === otp) {
      community.community_email_approval = true;
      community.code = null;
      await community.save();
      return { error: false, systemCode: "SUCCESS", code: 200, message: "success" };
    }
    return ({ error: true, message: "wrongOTP" });

  },
  generateExcelMemberList: async function (communityId, userId) {
    try {
      let aggregate = [
        {
          $match: {
            _id: new ObjectId(communityId),
          },
        },
        {
          $unwind: {
            path: "$members",
          },
        },
        {
          $match: {
            "members.is_approved": true,
            "members.is_rejected": false,
            "members.is_leaved": false,
            "members.is_deleted": false,
          },
        },
        {
          $lookup: {
            from: "sr_users",
            localField: "members.member_id",
            foreignField: "_id",
            as: "members.user",
          },
        },
        {
          $unwind: {
            path: "$members.user",
          },
        },
        {
          $match: {
            "members.user.is_deleted": false,
            // "members.user.is_active": true,
          }
        },
        {
          $unwind: {
            path: "$members.roles",
          },
        },
        {
          $sort: {
            "members.user.created_at": -1,
          },
        },
        {
          $lookup: {
            from: "sr_groups",
            localField: "members.member_id",
            foreignField: "members.member_id",
            as: "groups",
          },
        },
        {
          $project: {
            community_name: 1,
            "members.member_id": 1,
            "members.roles": 1,
            "members.is_active": 1,
            "members.joined_at": 1,
            "members.user._id": 1,
            "members.user.name": 1,
            "members.user.contact": 1,
            "members.user.profile_image": 1,
            "members.user.created_at": 1,
            "members.user.last_activity_at": 1,
            "members.acknowledgement_status": 1,
            "members.acknowledgement_date": 1,
            "members.invitation_date": 1,
            "isResend": {
              $cond: [
                {
                  $lt: [
                    "$members.invitation_date",
                    {
                      $subtract: [new Date(), 30 * 24 * 60 * 60 * 1000], // 30 days ago
                    },
                  ],
                },
                true,
                false,
              ],
            },
            "groups.name": 1,
            "groups.is_deleted": 1,
            "groups.community_id": 1,
            "groups.member_id": 1,
          },
        },
      ];
      const communityActiveMembers = await Communities.aggregate(aggregate);
      const table = [['Sl.No', 'Name', 'Email', 'Phone No.', 'User Type', 'Groups', 'Last Activity On', 'Status']];
      for (let i = 0; i < communityActiveMembers.length; i++) {
        const app = communityActiveMembers[i];
        const formattedDate = new Date(app.members.joined_at).toLocaleDateString();
        // Use a ternary operator to set the status based on members.is_active
        const status = app.members.is_active ? 'Active' : 'Inactive';
        const groups = app.groups.length > 0 ?
          app.groups.filter(group => {
            return !group.is_deleted && group.community_id.toString() === communityId;
          }).map(group => group.name).join(', ') :
          'N/A';
        const value = [
          (i + 1),
          app.members.user.name,
          app.members.user.contact.email.address,
          app.members.user.contact.phone.number,
          app.members.roles,
          groups,
          formattedDate,
          status
        ];
        table.push(value);
      }
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.aoa_to_sheet(table);
      xlsx.utils.book_append_sheet(wb, ws, 'Member List');

      // write options
      const wopts = { bookType: 'xlsx', bookSST: false, type: 'base64' };
      const buffer = xlsx.write(wb, wopts);

      const community = await Communities.findOne({ _id: new ObjectId(communityId) });
      const member = community.members.find(
        (m) => m.member_id.toString() === userId.toString()
      );
      const userRole = member.roles;
      // Call Activity log
      await ActivityLogService.activityLogActiion({
        communityId: communityId,
        userId: userId,
        module: "MEMBERS",
        action: "EXPORT",
        platForm: "web",
        memberRole: userRole,
        oldData: null,
        newData: null
      })

      return buffer;
    } catch (error) {

    }
  },
  generateExcelFamilyMemberwiseList: async function (communityId, userId) {
    try {
      let aggregate = [
        {
          $match: {
            _id: new ObjectId(communityId),
          },
        },
        {
          $unwind: {
            path: "$members",
          },
        },
        {
          $match: {
            "members.is_approved": true,
            "members.is_rejected": false,
            "members.is_leaved": false,
            "members.is_deleted": false,
          },
        },
        {
          $lookup: {
            from: "sr_users",
            localField: "members.member_id",
            foreignField: "_id",
            as: "members.user",
          },
        },
        {
          $unwind: {
            path: "$members.user",
          },
        },
        {
          $match: {
            "members.user.is_deleted": false,
            // "members.user.is_active": true,
          }
        },
        {
          $unwind: {
            path: "$members.roles",
          },
        },
        {
          $sort: {
            "members.user.created_at": -1,
          },
        },
        {
          $lookup: {
            from: "sr_groups",
            localField: "members.member_id",
            foreignField: "members.member_id",
            as: "groups",
          },
        },
        {
          $project: {
            community_name: 1,
            "members.member_id": 1,
            "members.roles": 1,
            "members.is_active": 1,
            "members.joined_at": 1,
            "members.user._id": 1,
            "members.user.name": 1,
            "members.user.family_members": 1,
            "members.user.contact": 1,
            "members.user.profile_image": 1,
            "members.user.created_at": 1,
            "members.user.last_activity_at": 1,
            "members.acknowledgement_status": 1,
            "members.acknowledgement_date": 1,
            "members.invitation_date": 1,
            "isResend": {
              $cond: [
                {
                  $lt: [
                    "$members.invitation_date",
                    {
                      $subtract: [new Date(), 30 * 24 * 60 * 60 * 1000], // 30 days ago
                    },
                  ],
                },
                true,
                false,
              ],
            },
            "groups.name": 1,
            "groups.is_deleted": 1,
            "groups.community_id": 1,
            "groups.member_id": 1,
          },
        },
      ];
      const communityActiveMembers = await Communities.aggregate(aggregate);
      const table = [['Sl.No', 'Name', 'Email', 'Phone No.', 'User Type', 'Groups Name', 'Last Activity On', 'Status', 'Family Members Name', 'Relation']];

      for (let i = 0; i < communityActiveMembers.length; i++) {
        const app = communityActiveMembers[i];
        const formattedDate = new Date(app.members.joined_at).toLocaleDateString();

        // Use a ternary operator to set the status based on members.is_active
        const status = app.members.is_active ? 'Active' : 'Inactive';
        const groups = app.groups.length > 0 ?
          app.groups.filter(group => {
            return !group.is_deleted && group.community_id.toString() === communityId;
          }).map(group => group.name).join(', ') :
          'N/A';
        const familyMembers = app.members.user.family_members;
        if (familyMembers.length > 0) {
          // Iterate through family members and add them to the table
          familyMembers.forEach((familyMember, index) => {
            const value = [
              (i + 1),
              app.members.user.name,
              app.members.user.contact.email.address,
              app.members.user.contact.phone.number,
              app.members.roles,
              groups,
              formattedDate,
              status,
              familyMember.member_name,
              familyMember.relation_type
            ];
            table.push(value);
          });
        }
      }

      // Now, 'Family Members Name' and 'Relation' should be populated in the table array
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.aoa_to_sheet(table);
      xlsx.utils.book_append_sheet(wb, ws, 'Family Wise Member List');

      // write options
      const wopts = { bookType: 'xlsx', bookSST: false, type: 'base64' };
      const buffer = xlsx.write(wb, wopts);

      const community = await Communities.findOne({ _id: new ObjectId(communityId) });
      const member = community.members.find(
        (m) => m.member_id.toString() === userId.toString()
      );
      const userRole = member.roles;

      // Call Activity log
      await ActivityLogService.activityLogActiion({
        communityId: communityId,
        userId: userId,
        module: "MEMBERS",
        action: "EXPORT_FAMILY_WISE",
        platForm: "web",
        memberRole: userRole,
        oldData: null,
        newData: null
      })
      return buffer;
    } catch (error) {

    }
  },
  generateExcelGroupwiseList: async function (communityId, userId) {
    try {
      let aggregate = [
        {
          $match: {
            _id: new ObjectId(communityId),
          },
        },
        {
          $unwind: {
            path: "$members",
          },
        },
        {
          $match: {
            // "members.roles":{ $in: ["board_member", "executive_member"] },
            "members.is_approved": true,
            "members.is_rejected": false,
            "members.is_leaved": false,
            "members.is_deleted": false,
          },
        },
        {
          $lookup: {
            from: "sr_users",
            localField: "members.member_id",
            foreignField: "_id",
            as: "members.user",
          },
        },
        {
          $unwind: {
            path: "$members.user",
          },
        },
        {
          $match: {
            "members.user.is_deleted": false,
            // "members.user.is_active": true,
          }
        },
        {
          $unwind: {
            path: "$members.roles",
          },
        },
        {
          $sort: {
            "members.user.created_at": -1,
          },
        },
        {
          $lookup: {
            from: "sr_groups",
            localField: "members.member_id",
            foreignField: "members.member_id",
            as: "groups",
          },
        },
        {
          $match: {
            "groups.is_deleted": false,
          },
        },
        {
          $project: {
            community_name: 1,
            "members.member_id": 1,
            "members.roles": 1,
            "members.is_active": 1,
            "members.joined_at": 1,
            "members.user._id": 1,
            "members.user.name": 1,
            "members.user.contact": 1,
            "members.user.profile_image": 1,
            "members.user.created_at": 1,
            "members.user.last_activity_at": 1,
            "members.acknowledgement_status": 1,
            "members.acknowledgement_date": 1,
            "members.invitation_date": 1,
            "isResend": {
              $cond: [
                {
                  $lt: [
                    "$members.invitation_date",
                    {
                      $subtract: [new Date(), 30 * 24 * 60 * 60 * 1000], // 30 days ago
                    },
                  ],
                },
                true,
                false,
              ],
            },
            "groups.name": 1,
            "groups.is_deleted": 1,
            "groups.community_id": 1,
            "groups.member_id": 1,
          },
        },
      ];
      const communityActiveMembers = await Communities.aggregate(aggregate);
      const table = [['Sl.No', 'Name', 'Email', 'Phone No.', 'User Type', 'Groups', 'Last Activity On', 'Status']];
      for (let i = 0; i < communityActiveMembers.length; i++) {
        const app = communityActiveMembers[i];
        const formattedDate = new Date(app.members.joined_at).toLocaleDateString();
        // Use a ternary operator to set the status based on members.is_active
        const status = app.members.is_active ? 'Active' : 'Inactive';
        // const groups = app.groups.filter(group => group.is_deleted === false).map(group => group.name).join(', ');
        const groups = app.groups.length > 0 ?
          app.groups.filter(group => {
            return !group.is_deleted && group.community_id.toString() === communityId;
          }).map(group => group.name).join(', ') :
          'N/A';
        const value = [
          (i + 1),
          app.members.user.name,
          app.members.user.contact.email.address,
          app.members.user.contact.phone.number,
          app.members.roles,
          groups,
          formattedDate,
          status
        ];
        table.push(value);
      }
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.aoa_to_sheet(table);
      xlsx.utils.book_append_sheet(wb, ws, 'Group Wise Member List');

      // write options
      const wopts = { bookType: 'xlsx', bookSST: false, type: 'base64' };
      const buffer = xlsx.write(wb, wopts);

      const community = await Communities.findOne({ _id: new ObjectId(communityId) });
      const member = community.members.find(
        (m) => m.member_id.toString() === userId.toString()
      );
      const userRole = member.roles;

      // Call Activity log
      await ActivityLogService.activityLogActiion({
        communityId: communityId,
        userId: userId,
        module: "MEMBERS",
        action: "EXPORT_GROUP_WISE",
        platForm: "web",
        memberRole: userRole,
        oldData: null,
        newData: null
      })

      return buffer;
    } catch (error) {

    }
  },
  getGroupNamesByMemberIds: async function (memberIds, communityId) {

    const groups = await Group.find({
      'members.member_id': { $in: memberIds },
      community_id: communityId,
      is_deleted: false
    });
    const groupNamesMap = {};

    groups.forEach(group => {
      group.members.forEach(member => {
        if (member.is_approved && !member.is_rejected && member.is_active && !member.is_deleted && !member.is_leaved) {
          const memberId = member.member_id.toString();
          if (memberId in groupNamesMap) {
            groupNamesMap[memberId].push(group.name);
          } else {
            groupNamesMap[memberId] = [group.name];
          }
        }
      });
    });
    return groupNamesMap;
  },
  getFamilyMemberNamesByMemberIds: async function (memberIds) {
    try {
      const familymembers = await User.find({
        'family_members.user_id': { $in: memberIds },
        is_deleted: false
      });
      const familymemberNamesMap = {};

      familymembers.forEach(familymember => {
        familymember.family_members.forEach(member => {
          const memberId = member.member_id.toString();
          if (memberId in familymemberNamesMap) {
            familymemberNamesMap[memberId].push(familymember.name);
          } else {
            familymemberNamesMap[memberId] = [familymember.name];
          }
        });
      });

      return familymemberNamesMap;
    } catch (error) {
      console.error('Error fetching family member names:', error);
      return {};
    }
  },
  updateSmsEmailGlobalSettings: async function (data, userId) {
    try {
      const { communityId, sms, email } = data;

      // Find the community by its ID
      const community = await Communities.findById(communityId);
      if (!community) {
        return {
          success: false,
          message: "Community not found"
        };
      }

      // store old values before update
      const oldData = {
        sms_settings: community.sms_email_global_settings.sms_settings,
        email_settings: community.sms_email_global_settings.email_settings
      };

      // Update SMS and email settings
      if (sms !== undefined) {
        community.sms_email_global_settings.sms_settings = sms;
      }
      if (email !== undefined) {
        community.sms_email_global_settings.email_settings = email;
      }

      // Save the updated community
      await community.save();

      // Capture new values after update
      const newData = {
        sms_settings: community.sms_email_global_settings.sms_settings,
        email_settings: community.sms_email_global_settings.email_settings
      };
      const member = community.members.find(
        (m) => m.member_id.toString() === userId.toString()
      );
      const userRole = member.roles;

      await ActivityLogService.activityLogActiion({
        communityId: community._id,
        userId: userId,
        module: "COMMUNITY_MANAGEMENT",
        action: "SMS_EMAIL_UPDATE",
        platForm: "web",
        memberRole: userRole,
        oldData: oldData,
        newData: newData
      })

      return {
        success: true,
        message: "SMS and email settings updated successfully"
      };
    } catch (error) {
      console.error("Error updating SMS and email settings:", error);
      return {
        success: false,
        message: "An error occurred while updating SMS and email settings"
      };
    }
  },
  communityMemberListRollWise: async (communityId, search) => {
    let searchName = "";

    if (search) {
      searchName = search;
    }
    let aggregate = [
      {
        $match: {
          _id: new ObjectId(communityId),
        },
      },
      {
        $unwind: {
          path: "$members",
        },
      },
      {
        $match: {
          // "members.roles":{ $in: ["board_member", "executive_member"] },
          // "members.is_approved": true,
          "members.is_rejected": false,
          "members.is_leaved": false,
          "members.is_deleted": false,
        },
      },
      {
        $lookup: {
          from: "sr_users",
          localField: "members.member_id",
          foreignField: "_id",
          as: "members.user",
        },
      },
      {
        $unwind: {
          path: "$members.user",
        },
      },
      {
        $match: {
          "members.user.is_deleted": false,
          // "members.user.is_active": true,
        }
      },
      {
        $match: {
          "members.user.name": new RegExp(`.*${searchName}.*`, "i"),
        },
      },
      {
        $unwind: {
          path: "$members.roles",
        },
      },
      {
        $sort: {
          "members.user.name": 1,
        },
      },
      {
        $group: {
          _id: '$members.roles',
          member: {
            $push: {
              id: '$_id',
              roles: '$members.roles',
              id: '$members.user._id',
              name: '$members.user.name',
              phone: '$members.user.contact.phone.number',
              phoneCode: '$members.user.contact.phone.phone_code',
              profileImage: '$members.user.profile_image',
              email: '$members.user.contact.email.address',
            }
          }
        }
      },
      {
        $project: {
          roll: '$_id',
          _id: 0,
          member: 1,
        }
      }
    ];
    const communityActiveMembers = await Communities.aggregate(aggregate).collation({ 'locale': 'en' });
    return {
      error: false,
      message: "generalSuccess",
      data: communityActiveMembers
    };
  },

  communityStripeDetails: async (communityId) => {
    let communityPayment = {};
    communityPayment = await CommunityPayment.findOne({ community_id: new ObjectId(communityId) });
    if (Lib.isEmpty(communityPayment)) {
      communityPayment =
      {
        stripe_account_id: "",
        stripe_account_approval: true,
        stripe_account_dashboard: "",
      }
    }
    return {
      error: false,
      message: "generalSuccess",
      data: Lib.reconstructObjectKeys(communityPayment)
    };
  },

};
