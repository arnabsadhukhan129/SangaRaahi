module.exports = function (gql) {
    return gql`
    type CommunityRole {
        id : String
        name : String
        slug : String
    }

    type RolePermissionDetails {
        canCreate: Boolean
        canEdit: Boolean
        canView: Boolean
        canDelete: Boolean
    }
    
    type CommunityManagementPermissions {
        globalSettings: Boolean
        manageWebPage: Boolean
        phoneNumberVerification: Boolean
        canProfileEdit: Boolean
    }
    
    type MemberPermission{
        canOnboard: Boolean
        canEdit: Boolean
        canView: Boolean
        canDelete: Boolean
        canPromoteDemote: Boolean
    }

    type EventPermissions{
        canCreate: Boolean
        canEdit: Boolean
        canView: Boolean
        canDelete: Boolean
        canFrequency: Boolean
    }

    type GroupPermissions{
        canCreate : Boolean
        canEdit : Boolean
        canView : Boolean
        canDelete : Boolean
    }

    type MailPermissions{
        canDelete : Boolean
        canStatusChange : Boolean
        canSend : Boolean
        canEdit : Boolean
    }
        
    type WebSitePermissions{
        canEditHomepage : Boolean
        canEditAnnouncement : Boolean
        canEditVideos : Boolean
        canEditPayments : Boolean
        canEditAboutus : Boolean
    }

    type BlogPermissions{
        canCreate : Boolean
        canEdit : Boolean
        canView : Boolean
        canDelete : Boolean
    }
    type CommunityRoleData {
        total : Int
        from : Int
        to : Int
        roles: [CommunityRole]
    }
    
    type AnnouncementPermissions{
        canCreate : Boolean
        canEdit : Boolean
        canView : Boolean
        canDelete : Boolean
    }
    type CheckinPermissions {
        canView: Boolean,
        canCheck: Boolean
    }

    type EmailResponsePermissions {
        canView: Boolean,
        canReply: Boolean
    }

    type ActivityLogPermissions {
        canViewApp: Boolean,
        canViewWeb: Boolean
    }

    type UnAssignedCommunityMemberList {
        id:ID
        communityName:String
        members:UnAssignedCommunityMember
    }
    type UnAssignedCommunityMember {
        memberId:String
        roles:[String]
        user:CommunityMemberUser
    }
    
    input RolePermissionDetailsInput {
        canCreate: Boolean
        canEdit: Boolean
        canView: Boolean
        canDelete: Boolean
    }
    
    input CommunityManagementPermissionsInput {
        globalSettings: Boolean
        manageWebPage: Boolean
        phoneNumberVerification: Boolean
        canProfileEdit: Boolean
    }

    input MemberPermissionInput{
        can_onboard: Boolean
        can_edit: Boolean
        can_view: Boolean
        can_delete: Boolean
        can_promote_demote: Boolean
    }

    input GroupPermissionsInput{
        can_create : Boolean
        can_edit : Boolean
        can_view : Boolean
        can_delete : Boolean
    }

    input MailPermissionsInput{
        can_delete : Boolean
        can_status_change : Boolean
        can_send : Boolean
        can_edit : Boolean
    }
        
    input WebSitePermissionsInput{
        can_edit_homepage : Boolean
        can_edit_announcement : Boolean
        can_edit_videos : Boolean
        can_edit_payments : Boolean
        can_edit_aboutus : Boolean
    }

    input EventPermissionsInput{
        can_create: Boolean
        can_edit: Boolean
        can_view: Boolean
        can_delete: Boolean
        can_frequency: Boolean
    }


    input BlogPermissionsInput{
        can_create : Boolean
        can_edit : Boolean
        can_view : Boolean
        can_delete : Boolean
    }
    
    input CommunityRoleInput {
        search:String,
        page: Int,
        columnName:String,
        sort:String
        limit : Int
    }
    
    input AnnouncementPermissionsInput{
        can_create : Boolean
        can_edit : Boolean
        can_view : Boolean
        can_delete : Boolean
    }
    input CheckinPermissionsInput {
        can_view: Boolean,
        can_check: Boolean
    }

    input EmailResponsePermissionsInput {
        can_view: Boolean,
        can_reply: Boolean
    }

    input ActivityLogPermissionsInput {
        can_view_app: Boolean,
        can_view_web: Boolean
    }

    type RolePermissionsList {
        id: String
        communityId: String
        role: String,
        permissionforRole: RolePermissionDetails
        commuhityManagement: CommunityManagementPermissions
        member: MemberPermission
        group: GroupPermissions
        mail: MailPermissions
        webSite: WebSitePermissions
        event: EventPermissions
        blog: BlogPermissions
        checkin: CheckinPermissions
        announcement: AnnouncementPermissions
        emailResponse: EmailResponsePermissions
        activityLog: ActivityLogPermissions
    }
    type SlugType {
        slug : String
    }
    input RolePermissionsFindInput {
        communityId: String,
        role: String,
    }
    input updateRolePermissionsinput {
        id: String
        permissionforRole: RolePermissionDetailsInput
        communityManagement: CommunityManagementPermissionsInput
        member: MemberPermissionInput
        group: GroupPermissionsInput
        mail: MailPermissionsInput
        webSite: WebSitePermissionsInput
        event: EventPermissionsInput
        blog: BlogPermissionsInput
        checkin: CheckinPermissionsInput
        announcement: AnnouncementPermissionsInput
        emailResponse: EmailResponsePermissionsInput
        activityLog: ActivityLogPermissionsInput
    }
    input AddCommunityRoleInput {
        name : String
        slug : String
        memberId : String
    }
    type RolePermissionsResponse implements Response {
        error : Boolean
        code:Int,
        systemCode:String,
        message:String,
        data: RolePermissionsList
    }
    type InsertRolePermissionsResponse {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: Id
    }
    type CommunityCreatedRolesResponse {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data : CommunityRoleData
    }
    type getUnAssignedMembersResponse {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data : [UnAssignedCommunityMemberList]
    }
    type AddCommunityRoleResponse {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data : SlugType
    }
    extend type Query {
        getRolePermissions(data: RolePermissionsFindInput): RolePermissionsResponse
        getCommunityCreatedRoles (data: CommunityRoleInput) : CommunityCreatedRolesResponse
        getUnAssignedMembers : getUnAssignedMembersResponse
        getUsherAssignedMembers(data: AddCommunityRoleInput) : getUnAssignedMembersResponse
    }
    extend type Mutation {
        updateRolePermissions(data: updateRolePermissionsinput): InsertRolePermissionsResponse
        addCommunityRole(data: AddCommunityRoleInput) : AddCommunityRoleResponse
        assignUsherRole(data: AddCommunityRoleInput) : GeneralResponse
    }
    `
}