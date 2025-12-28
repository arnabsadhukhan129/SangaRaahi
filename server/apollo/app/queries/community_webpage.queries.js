/**
 * The type Announcement
 */

module.exports = function (gql) {
    return gql`
        ## Type Construct Start

        type CommunityHomePageOverview {
            id:String!,
            communityType:String
            communityName:String
            bannerImage:String,
            logoImage:String,
            communityDescription:String
            backgroupColor:String,
            nonProfit:Boolean,
            paymentCategory:String,
            
        }
        type CommunityBasicDetails {
            id:String!,
            communityName:String,
            communityType:String,
            logoImage:String,
            nonProfit:Boolean,
            paymentCategory:String,
            communityDescription:String,
            communityEmail:String,
            communityPhoneCode:String,
            communityNumber:String,
            communityLocation:String
            communityDescriptionApproval:Boolean,
            communityEmailApproval:Boolean,
            communityNumberApproval:Boolean,
            locationApproval:Boolean
        }
        type FeaturedCommunity {
            id:String!,
            bannerImage:String,
            logoImage:String,
            createdAt:String,
            communityName:String,
            ownerName:String
        }
        type FeaturedCommunityData {
            total:Int,
            featuredCommunities:[FeaturedCommunity]
        }
        type EventPaymentStatus {
            eventPaymentSettings : Boolean
        }
        ## Type Construct End


        ## Input Construct 

        input InputHomePageOverview {
            id:String,
            bannerImage:String,
            logoImage:String,
            communityDescription:String
        }
        
        input InputCommunityAnnouncementSettings {
            id:String,
            showPublicAnnouncement:Boolean,
            showMemberAnnouncement:Boolean,
            showPublicEvents:Boolean,
            showPastEvents:Boolean,
            showMembersOnlyEvents:Boolean
        }
        input InputCommunityAboutUsSettings {
            id:String,
            showOrganizationDescription:Boolean,
            showOrganizationAddress:Boolean,
            showBoardMembers:Boolean,
            showExecutiveMembers:Boolean,
            showContactEmailPublicly:Boolean,
            showContactPhonePublicly:Boolean,
            communityType:CommunityType,
            nonProfit:Boolean,
            paymentCategory:String,
            boardMembersLabelName:String,
            executiveMembersLabelName:String
        }
        input OrgPortalCommunityInput {
            id:String
            isOrgPortal: Boolean
        }
        input InputGetFeaturedCommunities {
            search:String
            page:Int,
            limit:Int
        }
        input InputGetCommunityBasicDetails {
            id:String,
            keyNames:[String]
            isOrgPortal: Boolean
            isAppPortal:Boolean
        }
        
        ## Input Construct End


        ## Response Type Construct Start

        type UpdateResponseData implements Response{
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String
        }
        type getCommunityHomePageOverviewByIdData implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: CommunityHomePageOverview
        }
        type getCommunityBasicDetailsData implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: CommunityBasicDetails
        }
        type getFeaturedCommunitiesData implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: FeaturedCommunityData
        }
        type getEventPaymentStatusResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: EventPaymentStatus
        }

        ## Response Type Construct End

        extend type Query{
            getCommunityHomePageOverviewByID(data: OrgPortalCommunityInput): getCommunityHomePageOverviewByIdData,
            getFeaturedCommunities(data: InputGetFeaturedCommunities): getFeaturedCommunitiesData,
            getSangaraahiCommunity: getFeaturedCommunitiesData,
            getCommunityBasicDetails(data: InputGetCommunityBasicDetails): getCommunityBasicDetailsData,
            getEventPaymentStatus(data:GeneralIdInput) : getEventPaymentStatusResponse,
        }

        extend type Mutation {
            updateHomePageOverview(data:InputHomePageOverview) : UpdateResponseData,
            updateCommunityFeaturedStatus(data:GeneralIdInput) : UpdateResponseData,
            updatefreezePaneStatus(data:GeneralIdInput) : UpdateResponseData,
            updateEventPaymentStatus(data:GeneralIdInput) : UpdateResponseData,
            updateCommunityAnnouncementSettings(data:InputCommunityAnnouncementSettings) : UpdateResponseData,
            updateCommunityAboutUsSettings(data:InputCommunityAboutUsSettings) : UpdateResponseData

        }
    `
}