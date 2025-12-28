const Communities = Lib.Model('Communities');
const EmailSmsCreditLog = Lib.Model('EmailSmsCreditLog');
const EmailSmsCredit = Lib.Model('EmailSmsCredit');
const DatabaseError = require('../errors/database.error');
const ErrorModules = require('../errors');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

require('dotenv').config();

module.exports = {
  // getAllCommunitiesSmsEmailCredit: async function(params) {
  //     try {
  //         let page;
  //         if (params && params.page) {
  //             page = parseInt(params.page);
  //         } else {
  //             page = 1;
  //         }

  //         const limit = 10;
  //         const skip = (page - 1) * limit;

  //         let sortObject = {};
  //         let key = "created_at";
  //         let sort = -1;
  //         sortObject[key] = sort;

  //         // Retrieve communities with pagination and sorting
  //         let communities = await Communities.find({ is_deleted: false })
  //             .populate({ path: 'owner_id', select: 'name', options: { lean: true } })
  //             .sort(sortObject)
  //             .limit(limit)
  //             .skip(skip);

  //         // Map owner_id to owner_details and include other properties
  //         let mappedCommunities = communities.map(community => {
  //             const { _id, community_type, email_credits_remaining, sms_credits_remaining, community_name, is_active, owner_id } = community;
  //             return {
  //                 id: _id,
  //                 communityType: community_type,
  //                 emailCreditsRemaining: email_credits_remaining,
  //                 smsCreditsRemaining: sms_credits_remaining,
  //                 communityName: community_name,
  //                 isActive: is_active,
  //                 ownerDetails: { name: owner_id.name },
  //             };
  //         });

  //         return { error: false, data: mappedCommunities };
  //     } catch (error) {
  //         console.error(error);
  //         throw new DatabaseError('An error occurred while retrieving communities SMS and email credits');
  //     }
  // }

  getAllCommunitiesSmsEmailCredit: async function (params, user) {
    try {
      let communities;
      let communitiesFindAggregate = [
        {
          $match: {
            is_deleted: false
          }
        },
        {
          '$lookup': {
            from: "sr_users",
            let: { "user_id": "$owner_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", "$$user_id"]
                  }
                }
              },
              {
                $project: {
                  name: 1
                }
              }
            ],
            as: "owner_details"
          }
        },
        {
          $unwind: {
            path: "$owner_details"
          }
        },
        {
          '$unwind': {
            'path': '$members'
          },
        },
        {
          '$match': {
            'members.is_approved': true,
            'members.is_active': true,
            'members.is_rejected': false,
            'members.is_leaved': false,
            'members.is_deleted': false
          }
        },
        {
          '$group': {
            '_id': '$_id',
            'community_type': { '$first': '$community_type' },
            'banner_image': { '$first': '$banner_image' },
            'owner_details': { '$first': '$owner_details' },
            'sms_credits_remaining': { '$first': '$sms_credits_remaining' },
            'email_credits_remaining': { '$first': '$email_credits_remaining' },
            'community_name': { '$first': '$community_name' },
            'community_description': { '$first': '$community_description' },
            'is_active': { '$first': '$is_active' },
            'members': { '$push': '$members' },
            'memberCount': { '$sum': 1 },
            'created_at': { '$first': '$created_at' }
          }
        }
      ];
      let page;

      if (params && params.page) {
        page = parseInt(params.page);
      }
      else {
        page = 1;
      }

      var sortObject = {};
      var key = "created_at";
      let sort = -1;
      // if (params.columnName && params.sort) {
      //     if (params.columnName === 'CommunityType') {
      //         key = 'community_type';
      //     }
      //     if (params.columnName === 'CommunityName') {
      //         key = 'community_name';
      //     }
      //     if (params.sort === 'asc') {
      //         sort = 1;
      //     }
      // }
      sortObject[key] = sort;

      // define limit per page
      const limit = 10;
      const skip = (page - 1) * limit;

      if (params) {
        if (typeof params.isActive === 'boolean') {
          communitiesFindAggregate[0]['$match'].is_active = params.isActive;
        }

        if (params.search) {
          communitiesFindAggregate[0]['$match']['community_name'] = {
            $regex: `.*${params.search}.*`,
            $options: 'i'
          };
        }
      }
      communities = await Communities.aggregate(communitiesFindAggregate).collation({ 'locale': 'en' }).sort(sortObject).skip(skip).limit(limit);
      const total = await Communities.aggregate(communitiesFindAggregate);
      return ({ error: false, message: "generalSuccess", data: communities, total: total.length });
    } catch (e) {
      clog(e);
      throw new ErrorModules.DatabaseError("Communities find error");
    }
  },
  updateCommunitySmsEmailCredit: async function (data, communityId) {
    try {
      const community = await Communities.findOne({ is_deleted: false, _id: communityId });
      const smsCreditsRemaining = data.smsCredits ? data.smsCredits : community.sms_credits_remaining;
      const emailCreditsRemaining = data.emailCredits ? data.emailCredits : community.email_credits_remaining;

      if (!community) {
        return {
          error: true,
          systemCode: 'NOT_FOUND',
          code: 404,
          message: 'Community not found',
          data: null
        };
      }

      if (!community.is_active) {
        return {
          error: true,
          systemCode: 'FORBIDDEN',
          code: 403,
          message: 'You do not have permission to add or edit in this community',
          data: null
        };
      }

      // SMS and email credit fields of the community
      const emailDiff = emailCreditsRemaining - community.email_credits_remaining;
      const smsDiff = smsCreditsRemaining - community.sms_credits_remaining;

      community.sms_credits_remaining = smsCreditsRemaining;
      community.email_credits_remaining = emailCreditsRemaining;

      const credit = await EmailSmsCredit.findOne();

      if (Lib.isEmpty(credit)) {
        return {
          error: true,
          systemCode: 'FORBIDDEN',
          code: 403,
          message: 'Not enough credit remaining.',
          data: null
        };
      } else {
        if (credit.email_credits_remaining >= emailDiff) {
          credit.email_credits_remaining = credit.email_credits_remaining - emailDiff;
        } else {
          return { error: true, message: 'Not enough email credit remains.' };
        }
        if (credit.sms_credits_remaining >= smsDiff) {
          credit.sms_credits_remaining = credit.sms_credits_remaining - smsDiff;
        } else {
          return { error: true, message: 'Not enough SMS credit remains.' };
        }
        await credit.save();
      }

      await community.save();

      await EmailSmsCreditLog.create({
        community_id: new ObjectId(communityId),
        email_credits_remaining: emailCreditsRemaining,
        sms_credits_remaining: smsCreditsRemaining,
        type: "Community",
        operation_type: "update"
      });

      return {
        error: false,
        systemCode: 'SUCCESS',
        code: 200,
        message: `${smsCreditsRemaining ? 'SMS' : 'Email'} credits updated successfully`,
        data: {
          smsCreditsRemaining : smsCreditsRemaining,
          emailCreditsRemaining : emailCreditsRemaining
        }
      };
    } catch (error) {
      console.error(error);
      throw new DatabaseError('An error occurred while creating the SMS and email credit entry');
    }
  },
  getCommunitiesSmsEmailCreditById: async function (id) { 
    let community = await Communities.findOne({ is_deleted: false, _id: new ObjectId(id) });
    if (Lib.isEmpty(community)) {
      return { error: true, message: "noCommunityFound", ErrorClass: ErrorModules.Api404Error };
    }
    return ({ error: false, message: "generalSuccess", data: community });
  },
  addCommunitySmsEmailCredit: async function (data, communityId) {
    try {
      // Retrieve the community with the specified ID
      const community = await Communities.findOne({ is_deleted: false, _id: new ObjectId(communityId) });

      // Check if the community exists
      if (!community) {
        return {
          error: true,
          systemCode: 'NOT_FOUND',
          code: 404,
          message: 'Community not found',
          data: null
        };
      }
      if (!community.is_active) {
        return {
          error: true,
          systemCode: 'FORBIDDEN',
          code: 403,
          message: 'You do not have permission to add or edit in this community',
          data: null
        };
      }

      const smsCreditsRemaining = data.smsCredits ? data.smsCredits : 0;
      const emailCreditsRemaining = data.emailCredits ? data.emailCredits : 0;

      // Get the current SMS and email credits
      const currentSmsCredits = community.sms_credits_remaining;
      const currentEmailCredits = community.email_credits_remaining;

      // Add the given values to the current credits
      const updatedSmsCredits = currentSmsCredits + smsCreditsRemaining;
      const updatedEmailCredits = currentEmailCredits + emailCreditsRemaining;

      // Update the community's SMS and email credits
      community.sms_credits_remaining = updatedSmsCredits;
      community.email_credits_remaining = updatedEmailCredits;

      const credit = await EmailSmsCredit.findOne();

      if (Lib.isEmpty(credit)) {
        return {
          error: true,
          systemCode: 'FORBIDDEN',
          code: 403,
          message: 'Not enough credit remaining.',
          data: null
        };
      } else {
        if (credit.email_credits_remaining >= emailCreditsRemaining) {
          credit.email_credits_remaining = credit.email_credits_remaining - emailCreditsRemaining;
        } else {
          return { error: true, message: 'Not enough email credit remains.' };
        }
        if (credit.sms_credits_remaining >= smsCreditsRemaining) {
          credit.sms_credits_remaining = credit.sms_credits_remaining - smsCreditsRemaining;
        } else {
          return { error: true, message: 'Not enough SMS credit remains.' };
        }
        await credit.save();
      }

      // Save the updated community
      await community.save();

      await EmailSmsCreditLog.create({
        community_id: new ObjectId(communityId),
        email_credits_remaining: emailCreditsRemaining,
        sms_credits_remaining: smsCreditsRemaining,
        type: "Community",
        operation_type: "add"
      });


      return {
        error: false,
        systemCode: 'SUCCESS',
        code: 200,
        message: `${smsCreditsRemaining ? 'SMS' : 'Email'} credits added successfully`,
        data: {
          smsCreditsRemaining : updatedSmsCredits,
          emailCreditsRemaining : updatedEmailCredits
        }
      };
    } catch (error) {
      console.error(error);
      throw new DatabaseError('An error occurred while updating the SMS and email credits');
    }
  },

  addAdminSmsEmailCredit: async function (data) {
    try {
      const smsCreditsRemaining = data.smsCredits ? data.smsCredits : 0;
      const emailCreditsRemaining = data.emailCredits ? data.emailCredits : 0;

      let updatedSmsCredits = 0;
      let updatedEmailCredits = 0;
      const credit = await EmailSmsCredit.findOne();

      if (Lib.isEmpty(credit)) {
        await EmailSmsCredit.create({
          email_credits_remaining: emailCreditsRemaining,
          sms_credits_remaining: smsCreditsRemaining,
        });
      } else {
        // Get the current SMS and email credits
        const currentSmsCredits = credit.sms_credits_remaining;
        const currentEmailCredits = credit.email_credits_remaining;

        // Add the given values to the current credits
        updatedSmsCredits = currentSmsCredits + smsCreditsRemaining;
        updatedEmailCredits = currentEmailCredits + emailCreditsRemaining;

        credit.sms_credits_remaining = updatedSmsCredits;
        credit.email_credits_remaining = updatedEmailCredits;

        await credit.save();
      }

      await EmailSmsCreditLog.create({
        email_credits_remaining: emailCreditsRemaining,
        sms_credits_remaining: smsCreditsRemaining,
        type: "Admin",
        operation_type: "add"
      });

      return {
        error: false,
        systemCode: 'SUCCESS',
        code: 200,
        message: `${smsCreditsRemaining ? 'SMS' : 'Email'} credits added successfully`,
        data: {
          smsCreditsRemaining : updatedSmsCredits,
          emailCreditsRemaining : updatedEmailCredits
        }
      };
    } catch (error) {
      console.error(error);
      throw new DatabaseError('An error occurred while updating the SMS and email credits');
    }
  },

  getAdminSmsEmailCredit: async function (data) {
    const credit = await EmailSmsCredit.findOne();

    let emailCreditsRemaining;
    let smsCreditsRemaining;

    if (Lib.isEmpty(credit)) {
      emailCreditsRemaining = 0;
      smsCreditsRemaining = 0;
    } else {
      emailCreditsRemaining = credit.email_credits_remaining;
      smsCreditsRemaining = credit.sms_credits_remaining;
    }
    const dataObj = { emailCreditsRemaining, smsCreditsRemaining };
    return {
      error: false,
      systemCode: 'SUCCESS',
      code: 200,
      message: 'success',
      data: dataObj
    };
  },

};
