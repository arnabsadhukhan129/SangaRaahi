/**
 * The type User
 */
module.exports = function(gql) {
    return gql`
        scalar Upload
        type FamilyMember {
            id: ID
            userId: String,
            communityMemberId: String
            ageOfMinority: String,
            relationType: String,
            memberName: String,
            memberImage: String
            phone: String
            email: String
            gender: String
            phoneCode: String
            countryCode: String
            yearOfBirth : String,
            firstAddressLine : String,
            secondAddressLine : String,
            zipcode : String,
            city : String,
            state : String,
            country : String,
        }
        type DateOfBirthType {
            value: String,
            isMasked: Boolean
        }
        type User {
            id: String,
            communityMemberId: String
            name: String,
            email: String,
            phone: String,
            countryCode: String,
            phoneCode: String,
            secondaryPhone : String,
            secondaryCountryCode: String,
            secondaryPhoneCode: String,
            isSecondaryPhoneVerified: Boolean,
            profileImage : String,
            userType : String,
            isEmailVerified:Boolean,
            isPhoneVerified: Boolean,
            address:String,
            firstAddressLine:String,
            secondAddressLine:String,
            country:String,
            city:String,
            state:String,
            zipcode:String,
            latitude: Float,
            longitude: Float,
            dateOfBirth: DateOfBirthType,
            yearOfBirth : String,
            ageGroup : String
            isMasked: Boolean,
            gender: String,
            hobbies: [String],
            areaOfWork: [String],
            profession: [String],
            aboutYourself: String,
            familyMembers: [FamilyMember],
            contacts:[Contacts]
            subLanguage: String
            selectedCommunity: String,
            isActive: Boolean
            lastActivityAt : String
            language : String
        }
        type Contacts {
            id:String
            userId: String
            contactName: String
            contactImage: String
            contactPhone: String
            isDeleted: Boolean
            isFavourite: Boolean
            user: User
        }
        type UserAddress {
            contact:ContactAddress
        }
        type ContactAddress {
            first_address_line:String
            second_address_line:String
            city:String,
            state:String
            zipcode:String,
            latitude: Float,
            longitude: Float,
        }
        type File {
            filename: String!
            mimetype: String!
            encoding: String!
        }
        type Masked {
            isMasked : Boolean
        }
        type AllUsers {
            total : Int,
            from:Int,
            to:Int
            users : [User]
        }
        type CountryCodes {
            name: String,
            dialCode: String,
            code: String
            flag: String
        }
        type State {
            name: String,
            countryId: String,
            countryCode: String,
            stateCode: String,
            latitude: String,
            longitude: String
        }
        type City {
            name: String,
            stateId: String,
            stateCode: String,
            countryId: String,
            countryCode: String,
            latitude: String,
            longitude: String
        }
        type FamilyMemberDetails {
            familyMembers: FamilyMemberData
        }
        type FamilyMemberData {
            userId: String,
            memberName: String,
            memberImage: String,
            relationType: String,
            user: User
        }
        type MutualCommunities {
            id:String,
            communityName:String,
            bannerImage:String
        }
        type FamilyMembersList {
            familyMembers: [FamilyMember],
            pagination: Pagination
        }
        type FamilyMemberView {
            id: ID
            userId: String,
            communityMemberId: String
            ageOfMinority: String,
            relationType: String,
            memberName: String,
            memberImage: String
            phone: String
            email: String
            gender: String
            phoneCode: String
            countryCode: String
            yearOfBirth : String,
            firstAddressLine : String,
            secondAddressLine : String,
            zipcode : String,
            city : String,
            state : String,
            country : String,
        }
        type ContactsArray {
            contacts:Contacts
            isJoinedEvent:Boolean
        }
        type ContactMembersList {
            contacts: [ContactsArray],
            pagination: Pagination
        }
        type UserSearchDetails {
            user: User,
            loggedUser: String
            isAFamilyMember: Boolean
        }
        type MyProfileData {
            user:User,
            role:String,
            roleKey:String,
            communityName:String,
            communityMemberId: String
            
        }
        type PublicProfileData {
            user:User,
            role:String,
            loggedUser:String,
            isContact: Boolean,
            isFamily: Boolean,
            mutualCommunitiesCount : Int,
            mutualCommunities : [MutualCommunities],
            mutualGroupsCount : Int,
            familyMemberCount : Int,
            familyMemberDetails : [FamilyMemberDetails]
        }
        type UserCommunityRoleType {
            communityId: ID
            role: String
        }
        type EventAnnouncement {
            selectedCommunity:String,
            nonPrivateEvent:[HomeEvent]
            privateEvent:[HomeEvent]
            announcement:[HomeAnnouncement]
        }

        type DashboardDetails {
            userData:[Int]
            communityData:[Int]
            groupData:[Int]
            eventData:[Int]
            messageData:[Int]
        }
        ## Input started
        input InputUserData {
            communityId:String
            id:String
            name: String,
            email: String,
            phone : String,
            countryCode: String,
            phoneCode: String,
            secondaryPhone : String,
            secondaryCountryCode: String,
            secondaryPhoneCode: String,
            firstAddressLine:String,
            secondAddressLine:String,
            profileImage:String
            city:String,
            state:String
            country:String
            zipcode:String,
            userType:UserType,
            dateOfBirth: String,
            yearOfBirth : String,
            isMasked: Boolean,
            gender : String
            hobbies : [String],
            areaOfWork : [String],
            profession : [String],
            aboutYourself : String,
            isAppPortal: Boolean
        }

        input InputAddMember {
            relationType : String,
            memberImage : String,
            memberName : String,
            ageOfMinority : String
            phone : String,
            id: String
        }

        input InputSearchMobile {
            phone : String,
            countryCode: String,
            phoneCode: String,
        }

        input InputUserSearch {
            communityId: String
            search:String
            page: Int,
            limit: Int,
            columnName: String,
            sort: String
        }

        input InputPublicProfile {
            groupId: String,
            communityId: String,
            userId: String!
        }


        input InputFamilyMemberEnlist {
            ageOfMinority: String!,
            memberName: String!,
            memberImage: String,
            relationType: String!
        }
        
        input InputFamilyMemberList {
            isFavourite:Boolean
            communityId:String
            eventId:String
            userId:String
            filter:String
            search: String
            page: Int 
            isAppPortal: Boolean
        }
        input InputRemoveFamilyMember {
            userId:String
            familyMemberId: ID!
        }
        input InputStateList {
            countryCode: String
        }
        input InputCityList {
            stateCode: String
        }
        input PhoneInput {
            phone : String
            phoneCode : String
        }

        input OtpInput {
            otp : Int
        }
        input AddRemoveFavContact {
            userId: String
            isAdd : Boolean
            isAppPortal: Boolean
        }
        
        input InputUserFutureLanguage {
            userId: String
            isIndian: Boolean
            isEuropean: Boolean
            subLanguage: String
        }

        input InputFamilyMemberDetails {
            userId: String
            familyMemberId: String
        }
        ## Input end
        ## Response type started
        type UserSearchByMobileResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: UserSearchDetails
        }
        type UserResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: User
        }
        type MyProfieResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: MyProfileData
        }

        type UpdateResponseData implements Response{
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String
        }

        type ResponseDataUsers implements Response{
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: AllUsers
        }

        type DeleteUserResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String
        }
        

        type UserCreateResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:Id
        }
        
        type ResponseCountryCodes implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:[CountryCodes]
        }
        type ResponseState implements Response { 
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:[State]
        }
        type ResponseCity implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:[City]
        }
        
        type PublicProfileResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:PublicProfileData
        }
        
        type FamilyMemberResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:FamilyMembersList
        }
        type UserCommunityRoleResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:[UserCommunityRoleType]
        }
        
        type ContactsResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:ContactMembersList
        }

        type HomeResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:EventAnnouncement
        }

        type DashboardResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:DashboardDetails
        }

        type FamilyMemberDetailsResponse implements Response {
            error: Boolean,
            systemCode: String,
            code: Int,
            message: String,
            data: FamilyMemberView
        }
        ## Response type end
        
        extend type Query{
            getAllUsers(data: InputUserSearch): ResponseDataUsers,
            getLoggedInUsers(data: InputUserSearch): CommunityActivePassiveMembersResponse,
            getUserByID(id: String): UserResponse,
            searchUserByMobile(data : InputSearchMobile) : UserSearchByMobileResponse
            getFamilyMembers(data:InputFamilyMemberList): FamilyMemberResponse,
            getUserFamilyMembers(data:InputFamilyMemberList): FamilyMemberResponse,
            getFamilyMemberDetails(data : InputFamilyMemberDetails) : FamilyMemberDetailsResponse
            getMyProfileDetails : MyProfieResponse,
            getCountryCodes : ResponseCountryCodes,
            getState(data:InputStateList) : ResponseState,
            getCity(data:InputCityList) : ResponseCity
            getPublicProfile(data: InputPublicProfile) : PublicProfileResponse
            getUserCommunityRoles: UserCommunityRoleResponse
            testFunction : GeneralResponse
            getContacts(data:InputFamilyMemberList): ContactsResponse,
            getContactsMapList(data:InputFamilyMemberList): ContactsResponse,
            getHomeDetails : HomeResponse
            getAdminDashboardDetails: DashboardResponse
            getSubLanguage(data: GeneralIdInput): UserResponse
        }

        extend type Mutation {
            createUser(data: InputUserData): UserCreateResponse,
            updateUser(data: InputUserData): UpdateResponseData,
            singleUpload(file: Upload): File,
            maskDob : GeneralResponse,
            addFamilyMember(data : InputPassiveFamilyMember) : GeneralResponse,
            editFamilyMember(data : InputPassiveFamilyMember) : GeneralResponse,
            adminUpdateFamilyMember(data : InputPassiveFamilyMember) : GeneralResponse,
            removeFamilyMember(data: InputRemoveFamilyMember!) : GeneralResponse
            adminRemoveFamilyMember(data: InputRemoveFamilyMember!) : GeneralResponse
            userStatusChange(id: String!): GeneralResponse,
            deleteUser(id: String!): DeleteUserResponse,
            resetUserPassword(id: String): GeneralResponse
            addToMyContact(data: GeneralIdInput) : GeneralResponse
            addOrRemoveFavouriteContact(data: AddRemoveFavContact) : GeneralResponse
            removeMyContact(data: GeneralIdInput) : GeneralResponse
            sendOtp(data: PhoneInput) : GeneralResponse
            deleteOwnAccount : GeneralResponse
            verifySecondaryPhone(data:PhoneInput): GeneralResponse
            verifySecondaryPhoneOTP(data:OtpInput): GeneralResponse
            deleteSecondaryPhone: GeneralResponse
            verifyUserEmail(data:EmailInput): GeneralResponse
            verifyUserEmailOTP(data:OtpInput): GeneralResponse
            secondaryContactAsDefault: GeneralResponse
            bulkContactImport(data: GeneralIdInput) : GeneralResponse
            updateFutureLanguage(data: InputUserFutureLanguage): GeneralResponse
        }
    `
}