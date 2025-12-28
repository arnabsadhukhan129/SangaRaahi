/**
 * The type Group
 */

module.exports = function (gql) {
    return gql`
      
        type Group {
            id:String,
            name: String,
            description: String,
            image: String,
            type: String,
            createdBy: String,
            communityId: String,
            isActive: Boolean,
            members: [Member]
            createdAt:String
            ownerDetails : OwnerDetails
            memberCount:Int
            community : Community
            user : User
        }
        type OwnerDetails {
            id:ID
            name:String
            email:String
            phone:String
            image:String 
        }

        type Role {
            role:String
        }
        
        type AllGroups {
            total : Int,
            from:Int,
            to:Int
            groups : [Group]
            loggeduser : String
        }

        type Member {
            memberId:String,
            roles: [String],
            isApproved: Boolean,
            isRejected: Boolean,
            isActive: Boolean,
            isDeleted : Boolean
            isLeaved : Boolean
        }

        type GroupUser {
            id: String,
            name: String,
            contact: email
        }

        type email {
            email: address
        }
        type address {
            address: String
        }

        type GroupMember {
            name: String,
            email: String,
            userId: String,
            roles: [String]
        }

        type GroupMemberList {
            id:ID,
            name:String,
            communityRole:String,
            communityRoleKey:String,
            loggedUser:String
            createdBy:String
            members:GroupMemberType,
            createdUser:createdUserName
        }

        type createdUserName {
            name:String
        }

        type GroupMemberType {
            memberId:String
            roles:[String]
            joinedAt:String
            user:GroupMemberUser
        }

        type GroupMemberUser {
            id:ID
            name:String
            email:String
            phone:String
            profileImage:String
        }

        type GroupRequestData {
            id : String,
            name : String,
            members : GroupReqMember,
        }

        type GroupReqMember {
            memberId: String,
            roles: [String],
            joinedAt:String,
            user: MemberUser
        }
        
        type GroupList {
            pagination: Pagination
            groups: [Group]
        }

        type GroupViewData {
            id:String,
            name:String,
            description:String,
            image:String,
            memberCount:Int
        }

        type GroupInfoData {
            group:Group,
            communityRole:String
            communityRoleKey:String
            groupRole:String
            groupRoleKey:String
            isJoined:Boolean
        }

        ###### Input types ######

        input GroupSearchField {
            search:String
            page: Int,
            limit:Int
            columnName: String,
            sort: String
            deviceType: String,
            domains:String,
            type: String
            isAppPortal:Boolean
        }

        input GroupSearchFieldFront {
            #page: Int,
            #columnName: String,
            #sort: String,
            search : String
        }
        
        input GroupMemberApproveInput {
            groupId:ID
            approveStatus:Boolean
            memberId:ID
        }
        ## Type Construct End

        ## Input Construct Start
        input InputGroup {
            name: String!,
            description: String,
            image: String,
            communityId: String!,
            type: GroupType,
            userId: String
        }

        input UpdateGroupField {
            name: String,
            description: String,
            image: String,
            communityId: String,
        }

        input InputMember {
            id: String,
            memberId: [String],
        }

        input InputRemoveMember {
            groupId : String,
            memberIds : [String]
        }

        input GroupMemberInput {
            groupId:String,
            memberType:[String],
            search:String
        }
        input InputGroupJoinRequest {
            groupId: String
        }
        input DiscoverGroupInput {
            page : Int
            limit : Int
            search : String
        }
        input InputRequestGroupMember {
            search:String,
            groupId:String
        }
        ## Input Construct End
            
        ## Response Type Construct Start
        type AllGroupResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:AllGroups
        }

        type GroupByIdResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:Group
        }

        type GroupInfoResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:GroupInfoData
        }

        type MembersByIdResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:[GroupMember]
        }
        type IDResponse {
            id:ID
        }
        type InsertGroupResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:IDResponse
        }

        type UpdateGroupResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String
        }

        type DeleteGroupResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String
        }

        type AvailableUsersByIdResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: [GroupUser]
        }

        type GroupResponseFront implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: [Group]
        }

        type GroupMembersResponse implements Response {
            error:Boolean,
            code:Int,
            systemCode:String,
            message:String,
            data: [GroupMemberList]
        }

        type GroupRequestListResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: [GroupRequestData]
        }
        
        type DiscoverGroupResponse implements Response {
            error:Boolean
            systemCode:String
            message:String
            code:Int
            data: GroupList
        }
        
        type GriupViewResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: GroupViewData
        }

        type groupUserRoleResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data: Role
        }
        ## Response Type Construct End
            
        extend type Query{
            getAllGroup(data: GroupSearchField): AllGroupResponse,
            getGroupByID(id: ID): GroupByIdResponse,
            getAdminGroupByID(id: ID): GroupByIdResponse,
            getMembersById(id: String): MembersByIdResponse,
            getAvailableUser(id: String): AvailableUsersByIdResponse,
            getAvailableCommunityUser(id: String) : AvailableUsersByIdResponse,
            getNonStealthGroup(data: GroupSearchFieldFront) : GroupResponseFront,
            getNonStealthGroupInfo(data: GeneralIdInput) : GroupInfoResponse,
            getStealthGroupInfo(data: GeneralIdInput) : GroupInfoResponse,
            groupMemberList(data:GroupMemberInput):GroupMembersResponse,
            groupRequestList(data:InputRequestGroupMember) : GroupRequestListResponse,
            getStealthGroup(data: GroupSearchFieldFront) : GroupResponseFront,
            getMyGroups(data: GroupSearchFieldFront) : GroupResponseFront,
            discoverGroupList(data: DiscoverGroupInput) : DiscoverGroupResponse,
            groupViewDetails(data: GeneralIdInput) : GroupInfoResponse
            groupUserRole(data:GeneralIdInput) : groupUserRoleResponse
        }

        extend type Mutation {
            createGroup(data: InputGroup): InsertGroupResponse,
            updateGroup(id: String!,data: UpdateGroupField): UpdateGroupResponse,
            deleteGroup(data: GeneralIdInput): DeleteGroupResponse
            groupStatusChange(id: String!): GeneralResponse
            addGroupMember(data: InputMember): GeneralResponse,
            removeGroupMember(data: InputRemoveMember) : GeneralResponse
            groupJoinRequest(data:InputGroupJoinRequest) : GeneralResponse,
            approveOrRejectGroupMemberRequest(data:GroupMemberApproveInput):GeneralResponse,
            leaveGroup(data: GeneralIdInput) : GeneralResponse
        }
    `
}