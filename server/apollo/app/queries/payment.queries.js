module.exports = function(gql) {
    return gql`
    type Payment {
        id:String
        communityId:String
        qrcodeImage:String
        bankcheckImage:String
        bankcheckImageName:String
        paymentDescription:String
        authorityName:String
        link:String
        otherpaymentLink:String
    }
    type AdminCommunityPayment {
        bankcheckImage:String
        bankcheckStatus:String
        bankcheckImageName:String
    }
    type OrgPaymentPageSettings {
        id : String
        orgQrcodeImage:String
        orgPaymentDescription:String
        orgAuthorityName:String
        orgLink:String
        qrcodeIsApproved : Boolean
        authorityNameIsApproved : Boolean
        otherpaymentLinkIsApproved : Boolean
        paymentDescriptionIsApproved : Boolean
      }
    input GeneralIdGetInput {
        id: String
        isOrgPortal:Boolean
    }
    input InputPayment {
        qrcodeImage:String
        bankcheckImage:String
        bankcheckImageName:String
        paymentDescription:String
        authorityName:String
        link:String
        otherpaymentLink:String
    }
    input OrgPaymentPageApprovalInput {
        communityId : String
        qrcodeIsApproved : Boolean
        authorityNameIsApproved : Boolean
        otherpaymentLinkIsApproved : Boolean
        paymentDescriptionIsApproved:Boolean
      }
    type ResponsePayments implements Response{
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data: Payment
    }
    type getOrgPaymentPageApprovalResponse implements Response {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: OrgPaymentPageSettings
      }
    extend type Query {
        getCommunityPayments(data:GeneralIdGetInput) : ResponsePayments
        getOrgPaymentPageAdminApproval(data: GeneralIdInput): getOrgPaymentPageApprovalResponse
    }
    extend type Mutation {
        addOrUpdatepayment(data:InputPayment): GeneralResponse
        orgPaymentPageAdminApproval(data : OrgPaymentPageApprovalInput) : GeneralResponse
        bankDetailsAdminStatusChange(data: ApprovalInput) : GeneralResponse
    }
    `
}