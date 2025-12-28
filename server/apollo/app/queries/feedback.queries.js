/**
 * The type Announcement
 */

module.exports = function(gql) {
    return gql`
        ## Type Construct Start
        type Subject {
            id:String!,
            subject: SubjectData
        }
        
        type SubjectData {
            data:String,
            lang:String
        }

        type Feedback {
            id:String!,
            subject:Subject,
            name:String,
            email:String,
            message:String,
            isActive:Boolean,
            isReplied:Boolean
        }
        type AllFeedback {
            total : Int,
            from:Int,
            to:Int
            feedbacks : [Feedback]
        }
        ## Type Construct End



        ## Input Construct 
        input InputFeedback {
            subjectId:String,
            name:String,
            email:String,
            number:String,
            phoneCode:String,
            countryCode:String,
            message:String!
        }
        
        input InputReplyFeedback {
            id:String,
            replyMessage:String
        }
        
        ## Input Construct End




        ## Response Type Construct Start
        type AllSubjectResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:[Subject]
        }

        type AllFeedbackResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:AllFeedback
        }

        ## Response Type Construct End



        extend type Query{
            getAllSubjects: AllSubjectResponse,
            getAllFeedbacks(data: GroupSearchField) : AllFeedbackResponse
        }

        extend type Mutation {
            createFeedback(data:InputFeedback) : GeneralResponse,
            replyFeedback(data:InputReplyFeedback) : GeneralResponse
            deleteFeedback(data:GeneralIdInput) : GeneralResponse
        }
    `
}