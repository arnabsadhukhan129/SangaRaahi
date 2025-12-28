const Services = require('../services');
const ErrorModules = require('../errors');
/**
 * Here write your main logic
 */
module.exports = {
    Query:{
        async getAllCommunitiesSmsEmailCredit(root, args, context, info) {
            const communitysmsemailcredit = await Services.SmsEmailCreditService.getAllCommunitiesSmsEmailCredit(args.data);
            if(communitysmsemailcredit.error) {
                return Lib.sendResponse(communitysmsemailcredit);
            }
            const result = Lib.reconstructObjectKeys(communitysmsemailcredit.data);
            let AllCommunitysmsemailcredit = {
                total:communitysmsemailcredit.total,
                communitiesSmsEmailCredit:result
              }
            return Lib.resSuccess("", AllCommunitysmsemailcredit);
        },
        async getCommunitiesSmsEmailCreditById(root, { id }) {
            const community = await Services.SmsEmailCreditService.getCommunitiesSmsEmailCreditById(id);
            let result = Lib.reconstructObjectKeys(community.data);
            return Lib.resSuccess("", result);
        },
        
        async getAdminSmsEmailCredit() {
            const result = await Services.SmsEmailCreditService.getAdminSmsEmailCredit();
            return Lib.sendResponse(result);
        },
    },
    Mutation:{
        async updateCommunitySmsEmailCredit(root,args,context,info) {
            const data = args.data;
            const communityId = data.communityId;
            let result = await Services.SmsEmailCreditService.updateCommunitySmsEmailCredit(data,communityId);
            return Lib.sendResponse(result);
        },
        async addCommunitySmsEmailCredit(root,args,context,info) {
            const data = args.data;
            const communityId = data.communityId;
            let result = await Services.SmsEmailCreditService.addCommunitySmsEmailCredit(data,communityId);
            return Lib.sendResponse(result);
        },
        
        async addAdminSmsEmailCredit(root,args,context,info) {
            const data = args.data;
            let result = await Services.SmsEmailCreditService.addAdminSmsEmailCredit(data);
            return Lib.sendResponse(result);
        },
    }
    }