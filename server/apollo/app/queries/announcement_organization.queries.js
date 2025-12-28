module.exports = function(gql) {
    return gql`
    type HomeOrgAnnouncement {
        id:ID!,
        userId: String,
        title: String,
        description: String,
        endDate: String,
        toWhom:String,
        communityId:String
        isActive:String ,
        community:Community
        user:User
    }
    type AllOrganizationAnnouncement {
        total : Int,
        from:Int,
        to:Int
        announcements : [HomeOrgAnnouncement]
    }
    ## Input Construct 
    input InputAnnouncementOrganization {
        title: String,
        description: String,
        endDate: String,
        type:String
    }
    input AllAnnouncementSearchField {
        communityId:String,
        search:String,
        page: Int,
        columnName: String,
        sort: String,
        announcementType:String
        isActive: String
        isAppPortal: Boolean
    }
    type AllOrganizationAnnouncementResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data:AllOrganizationAnnouncement
    }
    extend type Query{
        getAllAnnouncementOrganization(data: AllAnnouncementSearchField): AllOrganizationAnnouncementResponse,
        getAnnouncementOrganizationByID(id: ID): AnnouncementByIdResponse,
    }
    extend type Mutation {
        createAnnouncementOrganization(data: InputAnnouncementOrganization): InsertAnnouncementResponse,
        myCommunityAnnouncementStatusChange(id: String!): GeneralResponse,
        deleteAnnouncementOrganizaztion(id: String!): DeleteAnnouncementResponse
        updateMyCommunityAnnouncement(id: String!,data: UpdateAnnouncement): UpdateAnnouncementResponse,
    }
    `}