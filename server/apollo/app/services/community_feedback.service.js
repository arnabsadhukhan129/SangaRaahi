const CommunityFeedback = Lib.Model('CommunityFeedback');
const DatabaseError = require('../errors/database.error');
const ErrorModules = require('../errors');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const notificationServices = require('./notification.service');
const Notificationlog = Lib.Model('NotificationLog');
const CommunitySettings = Lib.Model('CommunitySettings');

module.exports = {
  createCommunityFeedback: async function (data, communityId) {
    try {
      let communitySettings = await CommunitySettings.findOne({ community_id: new ObjectId(communityId) });
      let from = communitySettings && communitySettings.slug ? 'no-reply-'+communitySettings.slug+'@sangaraahi.com <donotreply@bar.com>' : null;
      const feedbackPayload = {};
      let email;
      let message = data.message;

      email = data.email;

      feedbackPayload['email'] = email;

      if (message.length > 500) {
        return { error: true, message: "moreThan500Characters" };
      }

      feedbackPayload['message'] = message;
      feedbackPayload['community_id'] = communityId;  // Set the community_id field

      const feedback = new CommunityFeedback(feedbackPayload);
      let res = await feedback.save();

      let body = "<p>Dear Guest,<br/>Thank you for your feedback! We greatly appreciate your input and will take it into consideration as we continue to improve our products/services. Your support is invaluable to us, and we look forward to serving you better in the future.</p>" + "<p>" + message + "</p>";
      // Send email to user
      let mail_object_user = {
        to: email,
        subject: "Thank you for your feedback!",
        html: body,
        from
      };

      let mailResponseUser = await notificationServices.sendMail(mail_object_user);

      if (mailResponseUser.status === false) {
        return {
          error: true,
          message: "mailSendError"
        };
      }

      return { error: false, message: "feedbackSendSuccess" };
    } catch (e) {
      console.log(e);
      return { error: true, message: "internalServerError", stack: e };
    }
  },
  getAllCommunityFeedbacks: async function (params, communityId) {
    let page;
    if (params && params.page) {
      page = parseInt(params.page);
    } else {
      page = 1;
    }
    var sortObject = {};
    var key = "created_at";
    let sort = -1;
    sortObject[key] = sort;

    // Define limit per page and calculate skip value
    const limit = 10;
    const skip = (page - 1) * limit;

    let feedbackAggregate = [
      {
        '$match': {
          "community_id": ObjectId(communityId)
        }
      },
      {
        '$sort': {
          'created_at': -1
        }
      },
    ];
    // Search by Mail-id
    if (params && params.search) {
      feedbackAggregate[0]['$match']['email'] = {
        $regex: `.*${params.search}.*`,
        $options: 'i'
      };
    }
    // Filter by message status
    if (params && params.status) {
      feedbackAggregate[0]['$match']['message_status'] = params.status;
    }
    // Filter by 
    if (params && params.feedbackStartDate && params.feedbackEndDate) {
      let feedbackStartDate = params.feedbackStartDate;
      let feedbackEndDate = params.feedbackEndDate;
      feedbackStartDate = new Date(feedbackStartDate).toISOString();
      let isoStartDate = new Date(feedbackStartDate);

      feedbackEndDate = new Date(feedbackEndDate).toISOString();
      let isoEndDate = new Date(feedbackEndDate);

      let obj = {
        $match: {
          "created_at": {
            $gte: isoStartDate,
            $lte: isoEndDate,
          },
        },
      };

      feedbackAggregate.splice(1, 0, obj);
    }

    const feedbacks = await CommunityFeedback.aggregate(feedbackAggregate).skip(skip).limit(limit);

    const total = await CommunityFeedback.aggregate(feedbackAggregate);
    const totalCount = total.length;
    let from = 0;
    let to = 0;
    if (feedbacks.length > 0) { // after query in db with pagination at least 1 data found
      from = ((page - 1) * limit) + 1;
      to = (feedbacks.length <= limit) ? (from + feedbacks.length - 1) : (page * limit);
    }

    return {
      error: false,
      message: "generalSuccess",
      total: totalCount,
      from: from,
      to: to,
      data: Lib.reconstructObjectKeys(feedbacks)
    };
  },

  viewedFeedbackStatus: async function (feedbackId, communityId) {
    const feedback = await CommunityFeedback.findOne({ _id: new ObjectId(feedbackId), community_id: new ObjectId(communityId) });

    if (Lib.isEmpty(feedback)) {
      return { error: true, message: "noFeedbackFound", ErrorClass: ErrorModules.Api404Error };
    }
    // Message status cahnge to Viewed
    feedback.message_status = "Viewed";
    feedback.save();

    return {
      error: false,
      message: "generalSuccess"
    };
  },

  communityReplyFeedback: async function (params) {
    const feedbackId = params.id;
    const to = params.to;
    const subject = params.subject;
    const body = params.body;
    
    const feedback = await CommunityFeedback.findOne({ _id: new ObjectId(feedbackId) });
    
    if (Lib.isEmpty(feedback)) {
      return { error: true, message: "noFeedbackFound", ErrorClass: ErrorModules.Api404Error };
    }

    let communitySettings = await CommunitySettings.findOne({ community_id: new ObjectId(feedback.community_id) });
    let from = communitySettings && communitySettings.slug ? 'no-reply-'+communitySettings.slug+'@sangaraahi.com <donotreply@bar.com>' : null;
    

    let mail_object = {
      to: to,
      subject: subject,
      html: body,
      from
    };
    //Sending Email 
    let mailResponse = await notificationServices.sendMail(mail_object);
    if (mailResponse.status === false) {
      return {
        error: true,
        message: "mailSendError"
      };
    }
    // Message status cahnge to Replied
    feedback.message_status = "Replied";
    feedback.save();

    return {
      error: false,
      message: "generalSuccess"
    };
  },


}