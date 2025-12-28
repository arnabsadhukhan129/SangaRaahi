const BookData = require('../../books.json');
const Services = require('../services');
const ErrorModules = require('../errors');
/**
 * Here write your main logic
 */
module.exports = {
    Query:{
        async getAllCommunityFeedbacks(root, args, context, info) {
            let id = context.user.selectedOrganizationPortal;
            const feedbacks = await Services.CommunityFeedbackService.getAllCommunityFeedbacks(args.data,id);
            if(feedbacks.error) {
                return Lib.sendResponse(feedbacks);
              }
              const CommunityFeedback = Lib.reconstructObjectKeys(
                feedbacks.data,
                ["createdAt"],
                function (value, key) {
                  if (key === "createdAt") {
                    return Lib.convertIsoDate(value);
                  }
                  else {
                    return value;
                  }
                }
              );
              let allFeedbacks = {
                total:feedbacks.total,
                from: feedbacks.from,
                to: feedbacks.to,
                communityfeedbacks:CommunityFeedback,
              }
              return Lib.resSuccess("",allFeedbacks);
        }
    },
    Mutation:{
      async createCommunityFeedback(root,args,context,info) {
          const data = args.data;
          const communityId = data.communityId;
          let result = await Services.CommunityFeedbackService.createCommunityFeedback(data,communityId);
          return Lib.sendResponse(result);
      },
      async viewedFeedbackStatus(root,args,context,info) {
        const feedbackId = args.data.id;
        const communityId = context.user.selectedOrganizationPortal;
        let result = await Services.CommunityFeedbackService.viewedFeedbackStatus(feedbackId, communityId);
        return Lib.sendResponse(result);
      },
      async communityReplyFeedback(root,args,context,info) {
        const data = args.data;
        let result = await Services.CommunityFeedbackService.communityReplyFeedback(data);
        return Lib.sendResponse(result);
      }
    }
}