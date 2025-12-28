/**
 * The type Book
 */
 module.exports = function(gql) {
    return gql`
        type FindUserResult {
            isActiveUser:Boolean
            isPassiveUser:Boolean
            user:User
        }
        type CompanySettings {
            slug:String 
        }
        type CommunityDetails {
            id: String,
            communityName:String,
            communityEmail:String
            address:AddressDetails,
            members:CommunityMember,
            communitySetting:CompanySettings
        }
        type OrgAdminDetails {
            id:ID
            name:String
        }

        type EmailSmsPreferences {
            smsAnnouncement: Boolean,
            emailAnnouncement: Boolean,
            smsEvent: Boolean,
            emailEvent: Boolean,
        }

        type Details{
            totalFamilyMembers:Int,
            communityDetails:[CommunityDetails]
            userDetails:User
            orgAdminDetails:OrgAdminDetails
            emailSmsPreferences: EmailSmsPreferences
            invitationType: String
        }
        type UserSmsEmailSettingsViewData{
            userId : String
            communityId : String
            emailAnnouncement : Boolean
            smsAnnouncement : Boolean
            emailEvent : Boolean
            smsEvent : Boolean
            communityEvent: Boolean
            communityAnnouncement: Boolean
        }
        input InputDateOfBirth {
            value: String
            isMasked: Boolean
          }
        input InputfindUserByPhoneMail {
            email:String
            phone:String
            phoneCode:String
            countryCode:String
        }
        
        input InputPassiveUserInvitationDetails {
            token:String
        }

        input InputPassiveFamilyMember {
            userId:String
            id:String
            firstName: String,
            lastName: String,
            middleName: String,
            memberImage: String
            userRole: RolesEnum
            phone : String
            email : String
            countryCode: String
            phoneCode: String
            memberType : String            
            relationType: String
            yearOfBirth : String
            address1 : String
            address2 : String
            city : String
            state : String
            country : String
            zipcode : String
            gender: String
            emailAnnouncement : Boolean
            smsAnnouncement : Boolean
            emailEvent : Boolean
            smsEvent : Boolean
            isAppPortal: Boolean
        }

        input InputPassiveMemberOnboard {
            communityId : String
            userRole : RolesEnum
            language : String
            firstname : String
            middlename : String
            lastname : String
            email : String
            gender: String
            yearOfBirth : String
            countryCode : String
            phoneCode : String
            phone : String
            addressLine1 : String
            addressLine2 : String
            country : String
            state : String
            city : String
            zipcode : String
            familyMember : [InputPassiveFamilyMember]
            emailAnnouncement : Boolean
            smsAnnouncement : Boolean
            emailEvent : Boolean
            smsEvent : Boolean
        }

        input InputInvitationResponse {
            userId : String
            communityId : String
            deviceType:String
            response : InvitationResponse
            message : String
            emailAnnouncement : Boolean
            smsAnnouncement : Boolean
            emailEvent : Boolean
            smsEvent : Boolean
            communityEvent: Boolean
            communityAnnouncement: Boolean
            invitationType : InvitationType
        }

        input InputOnboardExistUser {
            communityId : String
            userId : String
            userRole : RolesEnum
            languge : Language
        }

        input InputPassiveUserInvitationUpdate {
            id: String,
            language: String
            firstname : String
            middlename : String
            lastname : String
            firstAddressLine:String
            secondAddressLine:String
            country: String,
            city:String,
            state:String
            zipcode:String,
            hobbies: [String],
            profession: [String],
            aboutYourself: String,
        }

        input InputUserSmsEmailSettings {
            userId: String,
            communityId: String
            deviceType: String
        }

        type ResponseFindUserByPhoneMail implements Response{
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: FindUserResult
        }
        type passiveUserInvitationDetailsResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: Details
        }
        type updatePassiveUserInvitationDetailsResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
        }
        type userSmsEmailSettingsResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: Id
        }

        type UserSmsEmailSettingsViewResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: UserSmsEmailSettingsViewData
        }
        extend type Query{
            findUserByPhoneMail(data : InputfindUserByPhoneMail) : ResponseFindUserByPhoneMail
            passiveUserInvitationDetails(data: InputPassiveUserInvitationDetails): passiveUserInvitationDetailsResponse
            userSmsEmailSettingsView(data : InputUserSmsEmailSettings): UserSmsEmailSettingsViewResponse
        }

        extend type Mutation {
            onboardPassiveMember (data : InputPassiveMemberOnboard) : GeneralResponse
            resendOnboardingInvitation (data : GeneralIdInput) : GeneralResponse
            invitationResponse (data : InputInvitationResponse) : GeneralResponse
            onboardExistUser (data : InputOnboardExistUser) : GeneralResponse
            updatePassiveUserInvitationDetails(data:InputPassiveUserInvitationUpdate): updatePassiveUserInvitationDetailsResponse
            userSmsEmailSettings (data : InputInvitationResponse) : userSmsEmailSettingsResponse
        }
    `
}