/**
 * The type Community
 */
module.exports = function (gql) {
  return gql`
    ## Input types

    ## Response Types
  type SwitchOrganizationListResponse implements Response {
    error: Boolean
    code: Int
    systemCode: String
    message: String
    data: [TopOrgList]
  }


  type TopOrgList {
    id: String,
    logoImage:String,
    communityName:String,
    communityDescription: String,
    role: String
    roleName: String
  }

  type Role {
    role:String
  }

  type communityActiveMemberList {
    id: ID
    communityName: String
    members: CommunityMemberType
    isResend: Boolean
    isContact: Boolean
    groupNames: [String]
  }
  type SmsAppNumberDetails {
    phoneCode: String,
    number: String,
    isVerified: Boolean
  }

  type ownCommunity {
    id: String,
    logoImage:String,
    communityName:String,
    communityDescription: String,
    communityLocation:LocationCommunity,
    address:AddressDetails,
    communityEmail:String,
    communityNumber:String,
    communityPhoneCode: String,
    nonProfit:Boolean,
    paymentCategory:String,
    nonProfitTaxId:String,
    communityEmailApproval:Boolean
    currencyRestriction:Boolean
    smsAppNumber: SmsAppNumberDetails
  }
  type dashboardList {
    peopleCount:Int,
    groupCount:Int,
    eventCount:Int,
    announcementCount:Int,
  }

  type InsetCommunityViewResponse {
    id:ID
  }

  type AllMembers {
    total:Int,
    from:Int,
    to:Int
    members: [communityActiveMemberList]
  }

  type UserDetailsWithRole {
    totalFamilyMembers:Int,
    user: User,
    role: String
    filterFamilymembers: [FamilyMember]
  }
  
  type MyCommunitiesView {
    myCommunities: ownCommunity
  }
  type MyCommunitiesDashboardList {
    myCommunitieDasboard: dashboardList
    events : [Event]
    announcements : [HomeAnnouncement]
  }

  type CommunityMemberRole {
    id:ID
    communityName:String
    communityRole:String
    members:CommunityMemberType
  }

  type OrgHomePageSettings {
    communityId: String
    orgBannerImage: String
    orgLogoImage : String
    orgLocation: String
    orgCommunityEmail: String
    orgCommunityNumber: String
    orgCommunityDescription: String
    isApproveCommunityBannerImage: Boolean
    isApproveCommunityDescription: Boolean
    isApproveCommunityAddress: Boolean
    isApproveCommunityEmailAddress: Boolean
    isApproveCommunityPhoneNumber: Boolean
    isApproveCommunityLogoImage: Boolean
  }

  type CommunityIdData {
    communityId: String
  }

  type ApprovalLog {
    id:String
    communityId: String
    type: String
    field: String,
    fieldname: String,
    content: String
    contentId: String
    isApproved: Boolean
  }
  type SmsEmailSettingsView {
    sms: Boolean,
    email: Boolean
  }
  type communitymember {
    title:String,
    data: [CommunityMemberType]
  }
  type CommunityMembersRollWise {
    communities : [communitymember]
}
  input CommunityActivePassiveMemberInput {
    communityId: String
    eventId: String
    page: Int
    limit: Int
    search: String
    isActiveMember: Boolean
    startDate: String
    endDate: String
    isAcknowladgeUser:Boolean
    isTrack: Boolean
    roles:[String]
    acknowladgementStatus:[acknowledgementStatusEnum]
    AcknowladgementDateStart:String
    AcknowladgementDateEnd:String
    filter: String
    nameWiseFilter: String,
    columnName: String,
    sort: String,
  }

  input communityActivePassiveMemberDetailsInput {
    id: String,
    ageOfMinority: MinorityAgeEnum
    page: Int
  }

  input InputCommunitiesSettingsView {
    communityId: String
    slug: String
  }

  input CommunityViewInput {
    logoImage:String,
    communityName:String,
    communityEmail:String,
    communityNumber:String,
    communityPhoneCode: String,
    communityDescription:String,
    communityLocation:String,            
    firstAddressLine:String,
    secondAddressLine:String,
    city:String,
    state:String,
    country:String,
    zipcode:String,
    phoneCode: String,
    number: String,
    nonProfit:Boolean,
    paymentCategory:String,
    nonProfitTaxId:String
  }

  input OrgGlobalSettingsInput {
    announcementPage:Boolean,
    videoPage:Boolean,
    paymentPage:Boolean,
    aboutPage:Boolean,
    lebel:String,
    watermark:String,
    headerFont:String,
    headerFontSize:Int
    bodyFont:String
    bodyFontSize:Int,
    textColor:String
    backgroupColor:String,
  }

  input CommunityMemberRoleFilterInput {
    communityId:String
    memberType: [String],
    search:String
    isOrgPortal:Boolean
  }

  input OrgHomePageApprovalInput {
    communityId : String
    bannerImageApproval : Boolean
    logoImageApproval : Boolean
    communityDescriptionApproval : Boolean
  }

  input MemberAppovalInput {
    memberId : String!
    isApprove : Boolean
  }

  input AboutPageApprovalInput {
    communityId : String
    communityDescriptionApproval : Boolean
    communityLocationApproval : Boolean
    communityEmailApproval : Boolean
    communityNumberApproval : Boolean
    communityMemberApproval : [MemberAppovalInput]
  }

  input ApprovalInput {
    id : String,
    isApprove : Boolean
  }

  input SlugInput {
    slug: String
  }
  input InputGlobalSearch {
    search:String
  }
  input InputOrgGlobalSearch {
    communityId : String
    search:String
  }

  input InputAdminLogApprovalList {
    communityId : String
    type : AdminApprvalLogType
  }

  input CurrencyInput {
    communityId : String
    currency : CurrencyType
  }

  input EmailInput {
    email: String
  }
  input CommunitySettingsInput {
    communityId : String
    sms: Boolean,
    email: Boolean
  }
  input CommunityMembersInput {
    communityId: String
    search: String
    isAppPortal: Boolean
  }
  type sortEvent {
    publicEvents:[Event]
    pastEvents:[Event]
    membersOnlyEvents:[Event]
  }
  type sortGroup {
    total:Int
    groupList:[Group]
  }
  type sortHomeAnnouncement {
    publicAnnouncement:[HomeAnnouncement]
    memberAnnouncement:[HomeAnnouncement]
  }
  type GlobalSearchData {
    announcements : [HomeAnnouncement]
    communityfeedbacks : [CommunityFeedback]
    events : [Event]
    groups : sortGroup
    videos: [Video]
    members: [communityActiveMemberList]
}
type OrgGlobalSearchData {
  announcements : sortHomeAnnouncement
  communityfeedbacks : [CommunityFeedback]
  events : sortEvent
  groups : [Group]
  videos: [Video]
}
  type CommunityStripeDetail {
    stripeAccountId : String,
    stripeAccountApproval : Boolean,
    stripeAccountDashboard : String,
  }
  type CommunityActivePassiveMembersResponse implements Response {
    error: Boolean
    code: Int
    systemCode: String
    message: String
    data: AllMembers
  }

  type communityActivePassiveMemberDetailsResponse implements Response {
      error:Boolean,
      systemCode:String,
      code:Int,
      message:String,
      data: UserDetailsWithRole
  }

  type MyCommunitiesViewResponse implements Response {
    error:Boolean,
    systemCode:String,
    code:Int,
    message:String,
    data: MyCommunitiesView
  }
  type MyCommunityDashboardListResponse implements Response {
    error:Boolean,
    systemCode:String,
    code:Int,
    message:String,
    data: MyCommunitiesDashboardList
  }

  type MyCommunitiesSettingsResponse implements Response {
    error:Boolean,
    systemCode:String,
    code:Int,
    message:String,
    data: CommunitySettings
  }

  type InsetCommunityViewResponse implements Response {
    error:Boolean,
    code:Int,
    systemCode:String,
    message:String,
  }

  type CommunityMembersRoleFilterResponse implements Response {
    error:Boolean,
    code:Int,
    systemCode:String,
    message:String,
    data: [CommunityMemberRole]
  }

  type getOrgHomePageApprovalResponse implements Response {
    error:Boolean,
    code:Int,
    systemCode:String,
    message:String,
    data: OrgHomePageSettings
  }

  type getCommunityIdFromSlugResponse implements Response {
    error:Boolean,
    code:Int,
    systemCode:String,
    message:String,
    data: CommunityIdData
  }
  type MyCommunityGlobalSearchResponse implements Response {
    error:Boolean,
    systemCode:String,
    code:Int,
    message:String,
    data:GlobalSearchData
  }
  type OrgGlobalSearchResponse implements Response {
    error:Boolean,
    systemCode:String,
    code:Int,
    message:String,
    data:OrgGlobalSearchData
  }

  type adminLogApprovalListResponse implements Response {
    error:Boolean,
    systemCode:String,
    code:Int,
    message:String,
    data:[ApprovalLog]
  }

  type SwitchPortalResponse implements Response {
    code:Int,
    error:Boolean,
    systemCode:String,
    message:String
    data: Role
}
type viewSmsEmailGlobalSettingsResponse implements Response {
  code:Int,
  error:Boolean,
  systemCode:String,
  message:String,
  data: SmsEmailSettingsView
}
type CommunityMembersRollWiseResponse implements Response {
  error:Boolean,
  code:Int,
  systemCode:String,
  message:String,
  data: CommunityMembersRollWise
}
  type CommunityStripeDetailsResponse implements Response {
    error:Boolean,
    code:Int,
    systemCode:String,
    message:String,
    data: CommunityStripeDetail
  }

  extend type Query {
    switchOrganizationList: SwitchOrganizationListResponse
    communityActivePassiveMemberList(data: CommunityActivePassiveMemberInput): CommunityActivePassiveMembersResponse
    communityActivePassiveMemberDetails(data: communityActivePassiveMemberDetailsInput): communityActivePassiveMemberDetailsResponse
    getMyCommunitiesView : MyCommunitiesViewResponse
    getMyCommunitiesSettingsView(data:InputCommunitiesSettingsView) : MyCommunitiesSettingsResponse
    communityMemberRoleFilter(data:CommunityMemberRoleFilterInput):CommunityMembersRoleFilterResponse,
    getOrgPageAdminApproval(data: GeneralIdInput): getOrgHomePageApprovalResponse
    getCommunityIdFromSlug(data: SlugInput) : MyCommunitiesSettingsResponse
    getmyCommunityDashboardList(data: GeneralIdInput) : MyCommunityDashboardListResponse
    myCommunityDotNetGlobalSearch(data: InputGlobalSearch) : MyCommunityGlobalSearchResponse
    myCommunityOrgGlobalSearch(data: InputOrgGlobalSearch) : OrgGlobalSearchResponse
    adminLogApprovalList(data: InputAdminLogApprovalList) : adminLogApprovalListResponse
    currentUserRole(data: GeneralIdInput): SwitchPortalResponse
    viewSmsEmailGlobalSettings(data: CommunitySettingsInput) : viewSmsEmailGlobalSettingsResponse
    communityMemberListRollWise(data: CommunityMembersInput): CommunityMembersRollWiseResponse
    communityStripeDetails : CommunityStripeDetailsResponse
  }

  extend type Mutation {
    switchOrganiztionPortal(data: GeneralIdInput): SwitchPortalResponse
    updateCommunityView(data: CommunityViewInput): InsetCommunityViewResponse,
    addOrgGlobalSettings(data: OrgGlobalSettingsInput) : GeneralResponse
    orgHomePageAdminApproval(data : OrgHomePageApprovalInput) : GeneralResponse
    aboutPageAdminApproval(data : AboutPageApprovalInput) : GeneralResponse
    adminLogApproval(data: ApprovalInput): GeneralResponse
    editCurrency(data: CurrencyInput): GeneralResponse
    verifyCommunityEmail(data:EmailInput): GeneralResponse
    verifyCommunityOTP(data:OtpInput): GeneralResponse
    updateSmsEmailGlobalSettings(data: CommunitySettingsInput): GeneralResponse
  }`;
};
