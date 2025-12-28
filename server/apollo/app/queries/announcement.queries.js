/**
 * The type Announcement
 */

module.exports = function(gql) {
    return gql`
        ## Type Construct Start
        type Announcement {
            id:ID!,
            userId: String,
            title: String,
            description: String,
            endDate: String,
            toWhom:String,
            communityId:String
            isActive:Boolean
            
        }
        
        type HomeAnnouncement {
            id:ID!,
            userId: String,
            title: String,
            description: String,
            endDate: String,
            toWhom:String,
            communityId:String
            isActive:Boolean,
            community:Community
            user:User
        }

        type AllAnnouncement {
            total : Int,
            from:Int,
            to:Int
            announcements : [HomeAnnouncement]
        }
        
        
        ## Type Construct End



        ## Input Construct 
        input InputAnnouncement {
            communityId:String,
            groupId:String,
            title: String,
            description: String,
            endDate: String,
            type:String
        }

        input UpdateAnnouncement {
            title: String!,
            description: String,
            endDate: String,
            toWhom: String
        }

        input CommunityIdInput {
            communityId : String
        }
        ## Input Construct End




        ## Response Type Construct Start
        type AllAnnouncementResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:AllAnnouncement
        }

        type AnnouncementByIdResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:HomeAnnouncement
        }

        type InsertAnnouncementResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:Id
        }

        type UpdateAnnouncementResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String
        }

        type DeleteAnnouncementResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String
        }

        type ViewAnnouncementResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String
            data:[Announcement]
        }
        ## Response Type Construct End



        extend type Query{
            getAllAnnouncement(data: GroupSearchField): AllAnnouncementResponse,
            getAnnouncementByID(id: ID): AnnouncementByIdResponse,
            getViewAnnouncements: ViewAnnouncementResponse
        }

        extend type Mutation {
            createAnnouncement(data: InputAnnouncement): InsertAnnouncementResponse,
            updateAnnouncement(id: String!,data: UpdateAnnouncement): UpdateAnnouncementResponse,
            deleteAnnouncement(id: String!): DeleteAnnouncementResponse
            announcementStatusChange(id: GeneralIdInput): GeneralResponse
        }
    `
}