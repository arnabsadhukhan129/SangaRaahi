import {GeneralResponse} from "../interfaces/general-response.ineterface";
// All types will return general response
export type GraphQLRequests = {
  adminLogin: GeneralResponse,
  getAllUsers: GeneralResponse,
  getAllCommunities: GeneralResponse,
  getMyCommunities: GeneralResponse,
  createCommunity:GeneralResponse,
  deleteCommunity:GeneralResponse,
  getCommunityByID:GeneralResponse,
  getAllAnnouncement: GeneralResponse,
  createAnnouncement:GeneralResponse,
  getAllBooks: GeneralResponse,
  updateCommunity: GeneralResponse,
  communityStatusChange: GeneralResponse,
  getAllGroup: GeneralResponse,
  groupStatusChange: GeneralResponse,
  createGroup: GeneralResponse,
  deleteGroup: GeneralResponse,
  updateGroup: GeneralResponse,
  getAvailableUser: GeneralResponse,
  addGroupMember: GeneralResponse,
  getMembersById: GeneralResponse,
  logout: GeneralResponse,
  userStatusChange: GeneralResponse,
  deleteUser:GeneralResponse,
  createUser: GeneralResponse,
  getUserByID: GeneralResponse,
  updateUser: GeneralResponse,
  resetUserPassword: GeneralResponse,
  generateS3UploadURL: GeneralResponse,
  getCountryCodes: GeneralResponse,
  getAvailableCommunityUser: GeneralResponse,
  communityMemberList: GeneralResponse,
  removeCommunityMember: GeneralResponse,
  communityRequestList: GeneralResponse,
  approveOrRejectMemberRequest: GeneralResponse,
  groupMemberList: GeneralResponse,
  removeGroupMember: GeneralResponse,
  groupRequestList: GeneralResponse,
  approveOrRejectGroupMemberRequest: GeneralResponse,
  promoteOrDemoteCommunityMember: GeneralResponse,
  communityUserRole: GeneralResponse,
  groupUserRole: GeneralResponse,
  getAllEvents: GeneralResponse,
  getMyProfileDetails: GeneralResponse,
  eventStatusChange: GeneralResponse,
  deleteEvent: GeneralResponse,
  getAdminEventByID: GeneralResponse,
  createEvent: GeneralResponse,
  updateEvent: GeneralResponse,
  announcementStatusChange: GeneralResponse,
  deleteAnnouncement: GeneralResponse,
  getAnnouncementByID: GeneralResponse,
  updateAnnouncement: GeneralResponse,
  getAllFeedbacks: GeneralResponse,
  deleteFeedback: GeneralResponse,
  getAdminGroupByID: GeneralResponse,
  getAdminDashboardDetails: GeneralResponse
  adminForgotPassword: GeneralResponse
  verifyAdminPasswordOtp: GeneralResponse
  adminPasswordChange: GeneralResponse
  adminPasswordResendOtp: GeneralResponse
  updatefreezePaneStatus: GeneralResponse,
  updateEventPaymentStatus: GeneralResponse,
  publicityPageStatusChange: GeneralResponse
  updateCommunityFeaturedStatus: GeneralResponse,
  adminLogApprovalList: GeneralResponse,
  adminLogApproval: GeneralResponse,
  
  /**Community home tab setting..... */
  orgHomePageAdminApproval: GeneralResponse,
  getOrgPageAdminApproval: GeneralResponse,

  /**Community video tab setting..... */
  getCommunityVideos: GeneralResponse,
  videoSettingsAdminApproval: GeneralResponse,

  /**Community payment tab setting..... */
  getCommunityPayments: GeneralResponse,
  getOrgPaymentPageAdminApproval: GeneralResponse,
  orgPaymentPageAdminApproval: GeneralResponse,
  communityMemberRoleFilter: GeneralResponse,
  aboutPageAdminApproval: GeneralResponse,
  bankDetailsAdminStatusChange: GeneralResponse,

  /**Edit Currency....... */
  editCurrency: GeneralResponse,

  //sms and emails credit data
  getAllCommunitiesSmsEmailCredit: GeneralResponse,
  addCommunitySmsEmailCredit: GeneralResponse,
  getAdminSmsEmailCredit: GeneralResponse,
  updateCommunitySmsEmailCredit: GeneralResponse,
  addAdminSmsEmailCredit: GeneralResponse,
  /**Notification....... */
  getAllNotificationsForDotCom: GeneralResponse,

  /**Geofencing setting....... */
  addOrUpdateDistance: GeneralResponse
}
