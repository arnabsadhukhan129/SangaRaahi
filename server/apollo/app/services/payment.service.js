const User = Lib.Model('Users');
const Communities = Lib.Model('Communities');
const CommunitySettings = Lib.Model('CommunitySettings');
const CommunityPayment = Lib.Model('CommunityPayment');
const DatabaseError = require('../errors/database.error');
const ErrorModules = require('../errors');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const CommunityApprovalLog = Lib.Model('CommunityApprovalLog');
const notificationServices = require('./notification.service');
const ActivityLogService = require('./activity_log.service')

require('dotenv').config();
module.exports = {
  addOrUpdatepayment: async function (paymentData, communityId, userId) {
    const payment = await CommunityPayment.findOne({ community_id: communityId });
    const communitySettings = await CommunitySettings.findOne({ community_id: ObjectId(communityId) });
    const community = await Communities.findOne({
      _id: ObjectId(communityId)
    });
    const communityName = community.community_name;

    if (!communitySettings) {
      return { error: true, code: 404, message: 'communitySettingsNotFound' };
    }
    const freezePane = communitySettings.freeze_pane;
    let isChangeRequestNotify = false;
    let paymentInformation = false;

    const changeOldData = {};
    const changeNewData = {};

    if (payment) {
      // payment.qrcode_image = paymentData.qrcodeImage;


      // QR image change on freeze pane logic
      if (paymentData.qrcodeImage) {
        changeOldData.qrcode_image = payment.qrcode_image;
        changeNewData.qrcode_image = paymentData.qrcodeImage;
        const communityApprovalLog = await CommunityApprovalLog.findOne({ community_id: ObjectId(communityId), field: "qrcode_image", is_approved: false, is_acknowledged: false });
        // Creating log for new QR change 
        if (freezePane && !Lib.stringCompare(payment.qrcode_image, paymentData.qrcodeImage)) {
          if (communityApprovalLog) {
            communityApprovalLog.is_acknowledged = true;
            await communityApprovalLog.save();
          }
          await CommunityApprovalLog.create({
            community_id: new ObjectId(communityId),
            type: "Payment",
            field: "qrcode_image",
            fieldname: "QR code image",
            content: paymentData.qrcodeImage
          });
          isChangeRequestNotify = true;
          communitySettings.webpage_approval_status = "not_approved";
          await communitySettings.save();
        }
        if (!freezePane) {
          payment.org_qrcode_image = payment.qrcode_image;
        }
        payment.qrcode_image = paymentData.qrcodeImage;
      }

      // Payment description change on freeze pane logic
      if (paymentData.paymentDescription) {
        changeOldData.payment_description = payment.payment_description;
        changeNewData.payment_description = paymentData.paymentDescription;

        const communityApprovalLog = await CommunityApprovalLog.findOne({ community_id: ObjectId(communityId), field: "payment_description", is_approved: false, is_acknowledged: false });
        // Creating log for new description change 
        if (freezePane && !Lib.stringCompare(payment.payment_description, paymentData.paymentDescription)) {
          if (communityApprovalLog) {
            communityApprovalLog.is_acknowledged = true;
            await communityApprovalLog.save();
          }
          await CommunityApprovalLog.create({
            community_id: new ObjectId(communityId),
            type: "Payment",
            field: "payment_description",
            fieldname: "payment description",
            content: paymentData.paymentDescription
          });
          isChangeRequestNotify = true;
          communitySettings.webpage_approval_status = "not_approved";
          await communitySettings.save();
        }
        if (!freezePane) {
          payment.org_payment_description = payment.payment_description;
        }
        payment.payment_description = paymentData.paymentDescription;
      }

      // Payment authority change on freeze pane logic
      if (paymentData.authorityName) {
        changeOldData.authority_name = payment.authority_name;
        changeNewData.authority_name = paymentData.authorityName;
        const communityApprovalLog = await CommunityApprovalLog.findOne({ community_id: ObjectId(communityId), field: "authority_name", is_approved: false, is_acknowledged: false });
        // Creating log for new authority change 
        if (freezePane && !Lib.stringCompare(payment.authority_name, paymentData.authorityName)) {
          if (communityApprovalLog) {
            communityApprovalLog.is_acknowledged = true;
            await communityApprovalLog.save();
          }
          await CommunityApprovalLog.create({
            community_id: new ObjectId(communityId),
            type: "Payment",
            field: "authority_name",
            fieldname: "authority name",
            content: paymentData.authorityName
          });
          isChangeRequestNotify = true;
          communitySettings.webpage_approval_status = "not_approved";
          await communitySettings.save();
        }
        if (!freezePane) {
          payment.org_authority_name = payment.authority_name;
        }
        payment.authority_name = paymentData.authorityName;
      }

      // Payment link change on freeze pane logic
      if (paymentData.link) {
        changeOldData.link = payment.link;
        changeNewData.link = paymentData.link;

        const communityApprovalLog = await CommunityApprovalLog.findOne({ community_id: ObjectId(communityId), field: "link", is_approved: false, is_acknowledged: false });
        // Creating log for new link change 
        if (freezePane && !Lib.stringCompare(payment.link, paymentData.link)) {
          if (communityApprovalLog) {
            communityApprovalLog.is_acknowledged = true;
            await communityApprovalLog.save();
          }
          await CommunityApprovalLog.create({
            community_id: new ObjectId(communityId),
            type: "Payment",
            field: "link",
            fieldname: "link",
            content: paymentData.link
          });
          isChangeRequestNotify = true;
          communitySettings.webpage_approval_status = "not_approved";
          await communitySettings.save();
        }
        if (!freezePane) {
          payment.org_link = payment.link;
        }
        payment.link = paymentData.link;
      }

      // If bank KYC changed then the KYC status will be not reviewed

      if (paymentData.bankcheckImage && !Lib.stringCompare(payment.bankcheck_image, paymentData.bankcheckImage)) {
        changeOldData.bankcheck_image = payment.bankcheck_image;
        changeNewData.bankcheck_image = paymentData.bankcheckImage;
        payment.bankcheck_status = "Not Reviewed";
      }
      // bank Image name change on freeze pane logic
      if (paymentData.bankcheckImageName && !Lib.stringCompare(payment.bankcheck_image_name, paymentData.bankcheckImageName)) {
        changeOldData.bankcheck_image_name = payment.bankcheck_image_name;
        changeNewData.bankcheck_image_name = paymentData.bankcheckImageName;
        paymentInformation = true;
      }

      payment.bankcheck_image = paymentData.bankcheckImage;
      payment.bankcheck_image_name = paymentData.bankcheckImageName;
      payment.otherpayment_link = paymentData.otherpaymentLink;
      await payment.save();

      const member = community.members.find(
        (m) => m.member_id.toString() === userId.toString()
      );
      const userRole = member.roles;

      if (Object.keys(changeNewData).length > 0) {
        await ActivityLogService.activityLogActiion({
          communityId: communityId,
          userId: userId,
          module: "COMMUNITY_MANAGEMENT",
          action: "PAYMENT_UPDATE",
          oldData: changeOldData,
          newData: changeNewData,
          platForm: "web",
          memberRole: userRole
        });
      }
    }
    else {
      const org_qrcode_image = freezePane ? null : paymentData.qrcodeImage;
      if (freezePane && paymentData.qrcodeImage) {
        await CommunityApprovalLog.create({
          community_id: new ObjectId(communityId),
          type: "Payment",
          field: "qrcode_image",
          fieldname: "QR code image",
          content: paymentData.qrcodeImage
        });
        isChangeRequestNotify = true;
        communitySettings.webpage_approval_status = "not_approved";
        await communitySettings.save();
      }

      const org_payment_description = freezePane ? null : paymentData.paymentDescription;
      if (freezePane && paymentData.paymentDescription) {
        await CommunityApprovalLog.create({
          community_id: new ObjectId(communityId),
          type: "Payment",
          field: "payment_description",
          fieldname: "payment description",
          content: paymentData.paymentDescription
        });
        isChangeRequestNotify = true;
        communitySettings.webpage_approval_status = "not_approved";
        await communitySettings.save();
      }

      const org_authority_name = freezePane ? null : paymentData.authorityName;
      if (freezePane && paymentData.authorityName) {
        await CommunityApprovalLog.create({
          community_id: new ObjectId(communityId),
          type: "Payment",
          field: "authority_name",
          fieldname: "authority name",
          content: paymentData.authorityName
        });
        isChangeRequestNotify = true;
        communitySettings.webpage_approval_status = "not_approved";
        await communitySettings.save();
      }

      const org_link = freezePane ? null : paymentData.link;
      if (freezePane && paymentData.link) {
        await CommunityApprovalLog.create({
          community_id: new ObjectId(communityId),
          type: "Payment",
          field: "link",
          fieldname: "link",
          content: paymentData.link
        });
        isChangeRequestNotify = true;
        communitySettings.webpage_approval_status = "not_approved";
        await communitySettings.save();
      }
      await CommunityPayment.create({
        community_id: new ObjectId(communityId),
        qrcode_image: paymentData.qrcodeImage,
        org_qrcode_image: org_qrcode_image,
        bankcheck_image: paymentData.bankcheckImage,
        bankcheck_image_name: paymentData.bankcheckImageName,
        payment_description: paymentData.paymentDescription,
        org_payment_description: org_payment_description,
        authority_name: paymentData.authorityName,
        org_authority_name: org_authority_name,
        link: paymentData.link,
        org_link: org_link,
        otherpayment_link: paymentData.otherpaymentLink,
      });

      const community = await Communities.findOne({ _id: new ObjectId(communityId) });
      const member = community.members.find(
        (m) => m.member_id.toString() === userId.toString()
      );
      const userRole = member.roles;

      // log new creation
      await ActivityLogService.activityLogActiion({
        communityId: communityId,
        userId: userId,
        module: "COMMUNITY_MANAGEMENT",
        action: "PAYMENT_CREATE",
        oldData: null,
        newData: CommunityPayment,
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
          SECTION: "Payment Page"
        },
        isDotCom: true,
        section: "payment",
        communityId: new ObjectId(communityId)
      }
      await notificationServices.notifyService(payload);
    }
    if (paymentInformation) {
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
          SECTION: "Payment Information",
        },
        isDotCom: true,
        section: "payment",
        communityId: new ObjectId(communityId)
      }
      await notificationServices.notifyService(payload);
    }
    return { error: false, message: "paymentSavedSuccess" };
  },

  // getCommunityPayments: async function (communityId) {
  //     const payment = await CommunityPayment.find({community_id : new ObjectId(communityId), is_deleted : false});
  //     return { error: false, message: "generalSuccess", data: Lib.reconstructObjectKeys(payment[0]) };
  // },
  getCommunityPayments: async function (communityId, isOrgPortal) {
    const communityPayment = await CommunityPayment.findOne({ community_id: new ObjectId(communityId) });
    if (!communityPayment) {
      return { error: false, data: [] };
    }
    const communitySettings = await CommunitySettings.findOne({ community_id: new ObjectId(communityId) });

    if (!communitySettings) {
      return { error: true, systemCode: 'communitySettingsNotFound', code: 404, message: 'Community settings not found' };
    }

    let paymentData = {
      id: communityPayment._id,
      communityId: communityPayment.community_id,
      qrcodeImage: isOrgPortal ? communityPayment.org_qrcode_image : communityPayment.qrcode_image,
      bankcheckImage: communityPayment.bankcheck_image,
      bankcheckImageName: communityPayment.bankcheck_image_name,
      paymentDescription: isOrgPortal ? communityPayment.org_payment_description : communityPayment.payment_description,
      authorityName: isOrgPortal ? communityPayment.org_authority_name : communityPayment.authority_name,
      link: isOrgPortal ? communityPayment.org_link : communityPayment.link,
      otherpaymentLink: communityPayment.otherpayment_link
    };

    if (isOrgPortal) {
      if (!communityPayment.qrcode_isApproved || communityPayment.bankcheck_status === "Not Reviewed" || communityPayment.bankcheck_status === "Rejected") paymentData.qrcodeImage = null;
      if (!communityPayment.payment_description_isApproved || communityPayment.bankcheck_status === "Not Reviewed" || communityPayment.bankcheck_status === "Rejected") paymentData.paymentDescription = null;
      if (!communityPayment.authority_name_isApproved || communityPayment.bankcheck_status === "Not Reviewed" || communityPayment.bankcheck_status === "Rejected") paymentData.authorityName = null;
      if (!communityPayment.otherpayment_link_isApproved || communityPayment.bankcheck_status === "Not Reviewed" || communityPayment.bankcheck_status === "Rejected") paymentData.link = null;
      if (communityPayment.bankcheck_status === "Not Reviewed" || communityPayment.bankcheck_status === "Rejected") paymentData.bankcheckImage = null;
      if (communityPayment.bankcheck_status === "Not Reviewed" || communityPayment.bankcheck_status === "Rejected") paymentData.bankcheckImageName = null;
    }

    return { error: false, message: "Community payment found", data: paymentData };
  },

  //   getOrgPaymentPageAdminApproval: async function(communityId) {
  //     const communityPayment = await CommunityPayment.findOne({community_id: new ObjectId(communityId),is_deleted: false},
  //     'qrcode_isApproved payment_description_isApproved authority_name_isApproved otherpayment_link_isApproved');
  // console.log(communityPayment,"communityPayment");
  //     if (Lib.isEmpty(communityPayment)) {
  //       return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
  //     }

  //     return { error: false,systemCode: "SUCCESS",code: 200,message: "generalSuccess",data: communityPayment };
  //   },
  getOrgPaymentPageAdminApproval: async function (communityId) {
    const communityPayment = await CommunityPayment.findOne(
      { community_id: new ObjectId(communityId) },
      'qrcode_isApproved org_qrcode_image payment_description_isApproved org_payment_description authority_name_isApproved org_authority_name otherpayment_link_isApproved org_link'
    );

    if (Lib.isEmpty(communityPayment)) {
      return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error, };
    }

    // const {
    //   _id,
    //   qrcode_isApproved,
    //   authority_name_isApproved,
    //   otherpayment_link_isApproved,
    //   payment_description_isApproved,
    // } = communityPayment;

    return {
      error: false,
      systemCode: "SUCCESS",
      code: 200,
      message: "Response Success",
      data: {
        id: communityPayment._id.toString(),
        qrcodeIsApproved: communityPayment.qrcode_isApproved,
        authorityNameIsApproved: communityPayment.authority_name_isApproved,
        otherpaymentLinkIsApproved: communityPayment.otherpayment_link_isApproved,
        paymentDescriptionIsApproved: communityPayment.payment_description_isApproved,
        orgQrcodeImage: communityPayment.org_qrcode_image,
        orgPaymentDescription: communityPayment.org_payment_description,
        orgAuthorityName: communityPayment.org_authority_name,
        orgLink: communityPayment.org_link
      },
    };
  },
  orgPaymentPageAdminApproval: async function (params) {
    const communityId = params.communityId;
    const communityPayment = await CommunityPayment.findOne(
      { community_id: new ObjectId(communityId) });
    // console.log(communityPayment,"communityPayment");
    if (Lib.isEmpty(communityPayment)) {
      return {
        error: true,
        message: "noCommunityFound",
        ErrorClass: ErrorModules.Api404Error,
      };
    }
    communityPayment.qrcode_isApproved = params.qrcodeIsApproved ? true : false;
    communityPayment.authority_name_isApproved = params.authorityNameIsApproved ? true : false;
    communityPayment.otherpayment_link_isApproved = params.otherpaymentLinkIsApproved ? true : false;
    communityPayment.payment_description_isApproved = params.paymentDescriptionIsApproved ? true : false;
    communityPayment.save();
    return {
      error: false,
      systemCode: "SUCCESS",
      code: 200,
      message: "PaymentSettingsSaveSuccess"
    };
  },
  bankDetailsAdminStatusChange: async function (params) {
    const communityId = params.id;
    const isApprove = params.isApprove;
    const communityPayment = await CommunityPayment.findOne({ community_id: new ObjectId(communityId) });

    if (Lib.isEmpty(communityPayment)) {
      return {
        error: true,
        message: "noCommunityFound",
        ErrorClass: ErrorModules.Api404Error,
      };
    }
    communityPayment.bankcheck_status = isApprove ? "Approved" : "Rejected";
    communityPayment.save();
    return {
      error: false,
      systemCode: "SUCCESS",
      code: 200,
      message: "PaymentSettingsSaveSuccess"
    };
  },
}