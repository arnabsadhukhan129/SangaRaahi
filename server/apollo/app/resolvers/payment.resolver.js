const Services = require("../services");

module.exports = {
    Query:{
        // async getCommunityPayments(root, args, context, info) {
        //     const communityId = args.data.id;
        //     const result = await Services.CommunityPaymentService.getCommunityPayments(communityId);
        //     return Lib.sendResponse(result);
        // }
        // async getCommunityPayments(root, args, context, info) {
        //     const { id, isOrgPortal } = args.data;
        //     const result = await Services.CommunityPaymentService.getCommunityPayments(id, isOrgPortal);
        //     return Lib.sendResponse(result);
        //   } 
      async getCommunityPayments(root, args, context, info) {
        const communityId = args.data.id;
        const isOrgPortal = args.data.isOrgPortal;
        const result = await Services.CommunityPaymentService.getCommunityPayments(communityId, isOrgPortal);
        return Lib.sendResponse(result);
      },
      async getOrgPaymentPageAdminApproval(root, args, context, info) {
        const communityId = args.data.id;
        let result = await Services.CommunityPaymentService.getOrgPaymentPageAdminApproval(communityId);
        return Lib.sendResponse(result);
      },                   
    },
    Mutation:{
      async addOrUpdatepayment(root, args, context, info) {
        const communityId = context.user.selectedOrganizationPortal;
        const paymentData = args.data;
        const userId = context.user.id;
        const result = await Services.CommunityPaymentService.addOrUpdatepayment(paymentData,communityId, userId);
        return Lib.sendResponse(result);
      },
      async orgPaymentPageAdminApproval(root, args, context, info) {
        const data = args.data;
        const result = await Services.CommunityPaymentService.orgPaymentPageAdminApproval(data);
        return Lib.sendResponse(result);
      },
      async bankDetailsAdminStatusChange(root, args, context, info) {
        const data = args.data;
        const result = await Services.CommunityPaymentService.bankDetailsAdminStatusChange(data);
        return Lib.sendResponse(result);
      },
    }
}