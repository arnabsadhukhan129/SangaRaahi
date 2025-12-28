module.exports = function(gql) {
    return gql`

    input InputCommunityFeedback {
        email:String,
        message:String!
        communityId:ID
    }

    input FeedbackSearchField {
        search:String
        page: Int,
        status: MessageStatusEnum
        feedbackStartDate : String
        feedbackEndDate :String
    }

    input ReplyInput {
        id: String
        to:String
        subject:String
        body:String
    }

    type CommunityFeedback {
        id:String,
        email:String,
        message:String,
        messageStatus:MessageStatusEnum
        createdAt:String
    }
    type AllCommunityFeedback {
        total : Int,
        from: Int,
        to: Int,
        communityfeedbacks : [CommunityFeedback]
    }
    type AllCommunityFeedbackResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data:AllCommunityFeedback
    }
    extend type Query{
        getAllCommunityFeedbacks(data: FeedbackSearchField) : AllCommunityFeedbackResponse
    }
    extend type Mutation {
        createCommunityFeedback(data:InputCommunityFeedback) : GeneralResponse,
        viewedFeedbackStatus(data:GeneralIdInput) : GeneralResponse
        communityReplyFeedback(data:ReplyInput) : GeneralResponse
    }
    `
}