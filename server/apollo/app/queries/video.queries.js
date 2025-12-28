/**
 * The type Book
 */
module.exports = function(gql) {
    return gql`
        type Video {
            id:String
            communityId:String
            title:String
            description:String
            thumbnailImage:String
            link:String
            orderNo:Int
            isApproved: Boolean
            type: String
            duration: String
            createdAt: String
        }

        type VideoDetails {
            title:String
            description:String
            thumbnailImage:String
            link:String
            type: String
            duration: String
        }


        input InputVideo {
            id:String
            title:String
            description:String
            thumbnailImage:String
            link:String
            orderNo:Int
            duration:String
        }

        input VideoApprovalInput {
            id : String!
            isApprove : Boolean
        }

        input LinkInput {
            link : String!
        }

        type ResponseVideos implements Response{
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: [Video]
        }

        type ResponseVideoData implements Response{
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: VideoDetails
        }

        extend type Query {
            getCommunityVideos(data: OrgPortalCommunityInput) : ResponseVideos
            getVideoDetails(data:LinkInput) : ResponseVideoData
        }

        extend type Mutation {
            addOrUpdateVideo(data:[InputVideo]): GeneralResponse
            videoSettingsAdminApproval(data : [VideoApprovalInput]) : GeneralResponse 
            resetVideo(data : GeneralIdInput) : GeneralResponse
        }
    `
}