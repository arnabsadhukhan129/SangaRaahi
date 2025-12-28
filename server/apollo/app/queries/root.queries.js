module.exports = function(gql) {
    // # For defining the root type of queries
    // Other will extends on these
    // Only include the type and input that are global or need to be extend in other queries
    return gql`
        union RootData = AuthData | AuthUser | Token | RegisterByPhone | RegisterUser | OtpStatus | FamilyMember | DateOfBirthType | User | Announcement | Id 
        
        interface Response {
            error:Boolean,
            code:Int,
            systemCode:String,
            message:String
        }

        # Enums
        enum MemberPromotionType {
            Promotion,
            Demotion
        }
        enum PromotionStatus {
            Pending,
            Approved, 
            Rejected,
            Completed
        }
        enum CommunityType {
            Social,
            Cultural,
            Religious,
            Others
        }
        enum GroupType {
            Public,
            Restricted,
            Stealth
        }
        enum RolesEnum {
            board_member,
            executive_member,
            member,
            fan,
            user
        }
        enum MinorityAgeEnum {
            adult,
            minor,
            spouse
        }
        enum acknowledgementStatusEnum {
            NoReply,
            Accepted,
            Rejected,
            Blocked
        }
        enum UserType {
            admin,
            user
        }
        enum genderEnum{
            Male,
            Female,
            Non Binary,
            Undeclared
        }
        enum RsvpType {
            No_Reply, 
            Attending,
            Not_Attending, 
            Maybe
        }

        enum Language {
            en
            hi
            bn
        }
        enum MessageStatusEnum{
            Replied
            NotViewed
            Viewed
        }
        enum InvitationResponse {
            Accept
            Reject
            Block
        }
        enum InvitationType {
            EMAIL
            SMS
        }
        
        enum AdminApprvalLogType {
            Home,
            Video,
            Payment,
            About
        }

        enum PaymentType {
            Paid,
            Free
        }
        enum ModeType {
            Card,
            Apple_pay,
            Google_pay,
            Cash,
            Check,
            Zelle,
            Paypal
        }
        enum PaymentCategoryType {
            per_head,
            package_wise
        }

        enum S3FileType {
            png,
            jpg,
            jpeg,
            pdf,
            doc,
            docx,
            xml,
        }

        enum CurrencyType {
            INR,
            CAD,
            USD,
            GBP,
        }

        enum InvitationStatus {
            Attending,
            Not_Attending,
            Maybe,
        }

        enum RecurringType {
            weekly
            monthly
        }

        enum RecurringInputType {
            weekly
            all
        }
    
        ## Response Type
        type GeneralResponse implements Response {
            code:Int,
            error:Boolean,
            systemCode:String,
            message:String
        }

        ## Common ID Type
        type Id {
            id: String
        }
        ## Pagination type
        type Pagination {
            currentPage: Int
            perPage: Int
            total: Int
            lastPage: Int
        }
        ## Default member user query for sending the limited data for member to the forntend 
        ## Group member and Community Member
        type MemberUser {
            id: String,
            name: String,
            profileImage: String
        }
        
        # General Input
        input GeneralIdInput {
            id: String
            isAppPortal: Boolean
        }

        input GeneralAppIdInput {
            id: String
            isAppPortal: Boolean
        }
        
        type Query {
            # Must include a query otherwise error throws
            test:String
        }
        
        type Mutation {
            # Must include a query otherwise error throws
            testSave(data:String):String
        }
    `
};