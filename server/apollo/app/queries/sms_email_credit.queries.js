module.exports = function(gql) {
    return gql`
    input InputCommunitySmsEmailCredit {
        communityId:ID
        smsCredits:Int
        emailCredits:Int
    }
    type wonerObj {
        name: String
    }
    type SmsEmailCredit {
      id: String,
      ownerDetails: wonerObj,
      communityType:CommunityType,
      emailCreditsRemaining:String,
      smsCreditsRemaining:String
      communityName:String,
      communityDescription:String,
      isActive:Boolean,
      memberCount:Int
    }
    type CommunitiesSmsEmailCreditId {
        id: String,
        communityName:String,
        emailCreditsRemaining:Int,
        smsCreditsRemaining:Int,
        communityDescription:String,
    }
    type AllCommunitiesSmsEmailCredit {
        total:Int
        communitiesSmsEmailCredit : [SmsEmailCredit]
    }
    
    type AllCommunitiesSmsEmailCreditResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data:AllCommunitiesSmsEmailCredit
    }
    type CommunitiesSmsEmailCreditByIdResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data:CommunitiesSmsEmailCreditId
    }
    
    type CommunitySmsEmailResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data:CommunitiesSmsEmailCreditId
    }
    extend type Query{
        getAdminSmsEmailCredit:CommunitiesSmsEmailCreditByIdResponse
        getAllCommunitiesSmsEmailCredit(data:GroupSearchField):AllCommunitiesSmsEmailCreditResponse,
        getCommunitiesSmsEmailCreditById(id: String):CommunitiesSmsEmailCreditByIdResponse,
    }
    extend type Mutation {
        addCommunitySmsEmailCredit(data:InputCommunitySmsEmailCredit) : CommunitySmsEmailResponse,
        updateCommunitySmsEmailCredit(data:InputCommunitySmsEmailCredit) : CommunitySmsEmailResponse,
        addAdminSmsEmailCredit(data:InputCommunitySmsEmailCredit) : CommunitySmsEmailResponse,
    }
    ` 
}