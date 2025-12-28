const BookData = require('../../books.json');
const Services = require('../services');
const ErrorModules = require('../errors');
/**
 * Here write your main logic
 */
module.exports = {
    Query:{
        async getAllSubjects(root, args, context, info) {
            let lang = Lib.getLocale(context.req);
            const subjects = await Services.FeedbackService.getAllSubjects(lang);
            return Lib.sendResponse(subjects);
        },
        async getAllFeedbacks(root, args, context, info) {
            const feedbacks = await Services.FeedbackService.getAllFeedbacks(args.data);
            if(feedbacks.error) {
                return Lib.sendResponse(feedbacks);
              }
              let allFeedbacks = {
                total:feedbacks.total,
                from: feedbacks.from,
                to: feedbacks.to,
                feedbacks:feedbacks.data,
              }
              return Lib.resSuccess("",allFeedbacks);
        },
    },
    
    Mutation:{
        // Write Mutation code here...

        //Create feedback
        async createFeedback(root, args, context, info) {
            const data = args.data;
            let user = '';
            let userId = '';
            if (!Lib.isEmpty(context.user)) {
                user = context.getAuthUserInfo();
                userId = user._id.toString();
            }
            let result = await Services.FeedbackService.createFeedback(data, {user, userId});
            return Lib.sendResponse(result);

        },
        // Feedback reply by Admin
        async replyFeedback(root, args, context, info) {
            const feedbackId = args.data.id;
            const replyMessage = args.data.replyMessage;
            let result = await Services.FeedbackService.replyFeedback(context.getAuthUserInfo(),feedbackId,replyMessage);
            return Lib.sendResponse(result);
        },

        async deleteFeedback(root, args, context, info) { 
            const id = args.data.id; 
            const type = context.user.userType; 
            let result = await Services.FeedbackService.deleteFeedback(id,type); 
            return Lib.resSuccess("feedbackDeleteSuccess"); 
        }, 
    }
}