/**
 * The type Community
 */
 module.exports = function(gql) {
    return gql`
        type Path {
            from:String,
            to:String
        }
        type Role {
            role:String
        }
        type MemberPromotion {
            type: MemberPromotionType,
            date: String,
            status: PromotionStatus,
            path:Path,
            authorizePersonId:String
        }
        type CommunityMemberUser {
            id:ID
            name:String
            email:String
            phone:String
            phoneCode:String
            profileImage:String
            lastActivityAt : String
            isContact : Boolean
        }
        type CommunityMemberType {
            memberId:String
            communityMemberId:String
            roles:String
            joinedAt:String
            rsvpJoined:Boolean
            isAdminApproved:Boolean
            isActive:Boolean
            isActiveDeletePermission:Boolean
            user:CommunityMemberUser
            acknowledgementStatus:String
            acknowledgementDate:String
            invitationDate:String
        }
        type CommunityMemberList {
            id:ID
            communityName:String
            isJoinedToGroup:Boolean
            promoteRole:String
            demoteRole:String
            isContact:Boolean
            communityRole:String
            members:CommunityMemberType
        }
        type CommunityMember {
            memberId: String,
            communityMemberId: String,
            roles:[String],
            isApproved:Boolean,
            isRejected:Boolean,
            memberPromotion:[MemberPromotion],
            isActive: Boolean,
            isDeleted: Boolean,
            isLeaved: Boolean,
            joinedAt:String,
            updatedAt:String,
            leaveAt:String
            isAcknowledge:Boolean
            invitationDate:String
            roleName:String
        }
        
        type CommunityMemberMy {
            memberId: String,
            roles:String,
            isApproved:Boolean,
            isRejected:Boolean,
            memberPromotion:[MemberPromotion],
            isActive: Boolean,
            isDeleted: Boolean,
            isLeaved: Boolean,
            joinedAt:String,
            updatedAt:String,
            leaveAt:String
        }
        type CommunityReqMember {
            memberId: String,
            roles:[String],
            joinedAt:String,
            user: MemberUser,
            memberPromotions:MemberPromotion
        }

        type AddressDetails {
            firstAddressLine:String,
            secondAddressLine:String,
            city:String,
            state:String,
            country:String,
            zipcode:String
        }
        type OwnerDetails {
            id:ID
            name:String
            email:String
            phone:String
            image:String 
        }
        type AllCommunities {
            total:Int,
            communities: [Community]
        }
        type AllRequestMember {
            total:Int,
            from:Int,
            to:Int,
            communities: [CommunityRequestData]
        }
        
        type LocationCommunity {
            location:String,
            latitude:Float,
            longitude:Float
        }
        type AnnouncementSettings {
            showPublicAnnouncement:Boolean
            showMemberAnnouncement:Boolean
            showPublicEvents:Boolean
            showPastEvents:Boolean
            showMembersOnlyEvents:Boolean
        }
        type AboutUsSettings {
            showOrganizationDescription:Boolean,
            showOrganizationAddress:Boolean,
            showBoardMembers:Boolean,
            showExecutiveMembers:Boolean,
            showContactEmailPublicly:Boolean,
            showContactPhonePublicly:Boolean,
            boardMembersLabelName:String,
            executiveMembersLabelName:String
        }

        type CommunitySettings {
            id:String,
            webpageApprovalStatus:String,
            communityId:String,
            communityName:String
            publicityPage:Boolean,
            eventPaymentSettings:Boolean
            freezePane:Boolean,
            homePage:Boolean,
            announcementPage:Boolean,
            videoPage:Boolean,
            paymentPage:Boolean,
            aboutPage:Boolean,
            lebel:String,
            slug:String,
            watermark:String,
            headerFont:String,
            headerFontSize:Int
            bodyFont:String
            bodyFontSize:Int
            textColor:String
            backgroupColor:String,
            announcementSettings:AnnouncementSettings,
            aboutUsSettings:AboutUsSettings
        }

        type Community {
            id: String,
            ownerId: String,
            communityMemberId: String,
            communityType:CommunityType,
            emailCreditsRemaining:String,
            smsCreditsRemaining:String
            bannerImage:String,
            logoImage:String,
            communityName:String,
            communityDescription: String,
            communityLocation:LocationCommunity,
            address:AddressDetails,
            nonProfit:Boolean,
            paymentCategory:String,
            nonProfitTaxId:String,
            members:[CommunityMember],
            currentlySelected: Boolean,
            isActive:Boolean,
            isDeleted:Boolean,
            expiredAt:String,
            createdAt:String,
            updatedAt:String
            ownerDetails:OwnerDetails,
            memberCount:Int
            groupCount:Int
            isFeatured:Boolean
            communitySettings:CommunitySettings
            communityPayments: AdminCommunityPayment
            currency: String
            communityEmail:String,
            communityPhoneCode:String,
            communityNumber:String,
            isJoined: Boolean
            isJoinRequestSent: Boolean
        }
        type CommunityLogMember {
            id: String,
            ownerId: String,
            communityType:CommunityType,
            bannerImage:String,
            logoImage:String,
            communityName:String,
            communityDescription: String,
            communityLocation:LocationCommunity,
            address:AddressDetails,
            nonProfit:Boolean,
            paymentCategory:String,
            nonProfitTaxId:String,
            members:CommunityMemberMy,
            currentlySelected: Boolean,
            isActive:Boolean,
            isDeleted:Boolean,
            expiredAt:String,
            createdAt:String,
            updatedAt:String
            ownerDetails:OwnerDetails,
            memberCount:Int
        }
        
        type MyCommunitiesType {
            myCommunities: [CommunityLogMember]
            underApprovalCommunities:[Community]
            underApprovalFan:[Community]
            underApprovalMembership: [Community]
            nearbyCommunities: [Community]
            myTopRoleCommunities: [Community]
        }
        

        

        # A secod one for only the communities that i beliong to as a approved member/owner/fan
        # This is for the list of communities where i can switch
        type MyCommunitiesTypeList {
            myCommunities: [Community]
        }
        type InsertCommunityResponseDataType {
            id:ID
        }

        type CommunityRequestData {
            id : String,
            communityName : String,
            members : CommunityReqMember,
        }

#        type SwitchCommunityData {
#            currentCommunityId: Id
#        }

        type CommunityViewData {
            community:Community,
            memberCount:Int
            isJoined : String,
            role : String,
            roleKey : String
            isJoinRequestSent : Boolean
        } 

        type promoteData {
            oldRole:String,
            newRole:String
        }

        type switchCommunityResponseData {
            id:String,
            communityName:String,
            logoImage:String,
            role:String,
            roleKey:String,
        }

        ## Input types
        input CommunitySearchField {
            search:String,
            isActive: Boolean,
            communityType:String,
            webpageApprovalStatus : String
            bankcheckStatus:String,
            isDeleted: Boolean,
            page: Int,
            columnName:String,
            sort:String
        }

        input CommunityInput {
            communityType:CommunityType,
            bannerImage:String,
            logoImage:String,
            communityName:String,
            communityDescription:String,
            communityLocation:String,            
            firstAddressLine:String,
            secondAddressLine:String,
            city:String,
            state:String,
            country:String,
            zipcode:String,
            nonProfit:Boolean,
            paymentCategory:String,
            nonProfitTaxId:String
            
            communityEmail:String,
            communityPhoneCode:String,
            communityNumber:String,
        }

        
        input CommunityApproveInput {
            communityId: ID
        }

        input JoinCommunityInput {
            communityId: ID
            promotionType: MemberPromotionType
            role:String
            isAppPortal:Boolean
        }

        input UpdateCommunity {
            id: String!
            communityType:CommunityType,
            bannerImage:String,
            logoImage:String,
            communityName:String,
            communityDescription:String,
            communityLocation:String,
            nonProfit:Boolean,
            paymentCategory:String,
            nonProfitTaxId:String,
            firstAddressLine:String,
            secondAddressLine:String,
            city:String,
            state:String,
            country:String,
            zipcode:String
        }
        
        input ExpiryDateCommunityInput {
            id: String!
            expiryDate: String!
        }
        
        input CommunityMemberInput {
            communityId:String
            memberType:[String],
            search:String
            groupId: String
        }

        input RemoveCommunityMemberInput {
            communityId:String
            memberId:[String]
        }
        input DeleteCommunityMemberInput {
            communityId:String
            memberId:[String]
        }
        input communityMemberStatusChange {
            communityId:String
            memberId:[String]
        }
        input CommunityMemberApproveInput {
            communityId:ID
            approveStatus:Boolean
            memberId:ID
        }

        input NearbyLocation {
            latitude:Float,
            longitude:Float
            isAppPortal: Boolean
        }

        input CommunityListFindInput {
            search:String,
            latitude:Float,
            longitude:Float,
            isAppPortal:Boolean
        }

        input InputRequestCommunityMember {
            search:String,
            communityId:String
            page:Int
        }

        input InputPromoteDemoteMember {
            communityId:String,
            memberId:String,
            promote: Boolean 
            isAppPortal: Boolean
        }
        ## Response Types
        type InsetCommunityResponse implements Response {
            error:Boolean,
            code:Int,
            systemCode:String,
            message:String,
            data: InsertCommunityResponseDataType
        }

        type CommunityResponse implements Response {
            error:Boolean,
            code:Int,
            systemCode:String,
            message:String,
            data: AllCommunities
        }
        type CommunityMemberResponse implements Response {
            error:Boolean,
            code:Int,
            systemCode:String,
            message:String,
            data: [CommunityMember]
        }
        # For frontend
        type CommunityMembersResponse implements Response {
            error:Boolean,
            code:Int,
            systemCode:String,
            message:String,
            data: [CommunityMemberList]
        }

        type MyCommunityResponse implements Response {
            error:Boolean,
            code:Int,
            systemCode:String,
            message:String,
            data: MyCommunitiesType
        }
        
        type CommunityByIdResponse implements Response {
            error:Boolean,
            code:Int,
            systemCode:String,
            message:String,
            data: Community
        }

        type AddexpiryResponse implements Response {
            error:Boolean,
            code:Int,
            systemCode:String,
            message:String
        }

        type UpdateCommunityResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String
        }

        type DeleteCommunityResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String
        }

        type MyCommunitiesResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: MyCommunitiesTypeList
        }
        
        type NearByCommunityResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: [Community]
        }

        type CommunityListFindResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: [Community]
        }

        type CommunityRequestListResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: AllRequestMember
        }
        
#        type SwitchCommunityResponse implements Response {
#            error:Boolean,
#            systemCode:String,
#            code:Int,
#            message:String,
#            data: SwitchCommunityData
#        }

        type CommunityViewResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: CommunityViewData
        }

        type promoteOrDemoteCommunityMemberResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: promoteData
        }

        type switchCommunityResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: switchCommunityResponseData
        }

        type communityUserRoleResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: Role
        }

        

        extend type Query{
            getAllCommunities(data: CommunitySearchField): CommunityResponse,
            getMyRelatedCommunities(data:NearbyLocation): MyCommunityResponse
            getMyCommunities: MyCommunitiesResponse
            getCommunityByID(id: String): CommunityByIdResponse,
            memberList(data:CommunityMemberInput):CommunityMemberResponse,
            getNearByCommunities(data:NearbyLocation):NearByCommunityResponse
            communityMemberList(data:CommunityMemberInput):CommunityMembersResponse,
            findCommunities(data:CommunityListFindInput):CommunityListFindResponse,
            communityRequestList(data:InputRequestCommunityMember) : CommunityRequestListResponse,
            communityViewDetails(data: GeneralIdInput) : CommunityViewResponse
            communityUserRole(data:GeneralIdInput) : communityUserRoleResponse
            getCommunityMembers(data:CommunityMemberInput):CommunityMembersResponse
        }

        extend type Mutation {
            createCommunity(data: CommunityInput): InsetCommunityResponse,
            approveCommunity(data: CommunityApproveInput): GeneralResponse,
            joinOrPromoteCommunity(data: JoinCommunityInput): GeneralResponse,
            updateCommunity(data: UpdateCommunity): UpdateCommunityResponse,
            addExpiryDateToCommunity(data:ExpiryDateCommunityInput): AddexpiryResponse,
            approveOrRejectMemberRequest(data:CommunityMemberApproveInput):GeneralResponse,
            deleteCommunity(id: String!): DeleteCommunityResponse,
            communityStatusChange(id: String!): GeneralResponse,
            switchCommunity(data: GeneralIdInput): switchCommunityResponse,
            removeCommunityMember(data:RemoveCommunityMemberInput) : GeneralResponse,
            deleteCommunityMember(data:DeleteCommunityMemberInput) : GeneralResponse,
            leaveCommunity(data: GeneralAppIdInput) : GeneralResponse,
            promoteOrDemoteCommunityMember(data:InputPromoteDemoteMember): promoteOrDemoteCommunityMemberResponse
            communityMemberStatusChange(data:communityMemberStatusChange): GeneralResponse,
            publicityPageStatusChange(data: GeneralIdInput) : GeneralResponse,
            promoteOrDemoteAppMember(data:InputPromoteDemoteMember): promoteOrDemoteCommunityMemberResponse
        }
    `
}