import { TypedDocumentNode, ResultOf, VariablesOf } from "apollo-angular"
export interface ModuleKeyType {
  'adminLogin': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getAllUsers': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getAllCommunities':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getMyCommunities':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getAllAnnouncement':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'createAnnouncement':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'updateCommunity':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getAllBooks': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>,
  'createCommunity':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'deleteCommunity':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getCommunityByID':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'communityStatusChange':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getAllGroup':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'groupStatusChange':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'createGroup':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'deleteGroup':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'updateGroup':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'addGroupMember':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getMembersById':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'logout':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'userStatusChange':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'deleteUser':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'createUser':TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getUserByID': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'updateUser': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'resetUserPassword': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'generateS3UploadURL': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getCountryCodes': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getAvailableCommunityUser': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'communityMemberList': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'removeCommunityMember': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'communityRequestList': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'approveOrRejectMemberRequest': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'groupMemberList': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'removeGroupMember': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'groupRequestList': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'approveOrRejectGroupMemberRequest': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'promoteOrDemoteCommunityMember': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'communityUserRole': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'groupUserRole': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getAllEvents': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getMyProfileDetails': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'eventStatusChange': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'deleteEvent': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getAdminEventByID': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'createEvent': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'updateEvent': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'announcementStatusChange': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'deleteAnnouncement': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getAnnouncementByID': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'updateAnnouncement': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getAllFeedbacks': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'deleteFeedback': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getAdminGroupByID': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getAdminDashboardDetails': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'adminForgotPassword': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'verifyAdminPasswordOtp': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'adminPasswordChange': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'adminPasswordResendOtp': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'updateCommunityFeaturedStatus': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'updatefreezePaneStatus': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'updateEventPaymentStatus': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'publicityPageStatusChange': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'adminLogApprovalList': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'adminLogApproval': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  
  /**Community home tab setting..... */
  'orgHomePageAdminApproval': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getOrgPageAdminApproval': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;

   /**Community video tab setting..... */
   'getCommunityVideos': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
   'videoSettingsAdminApproval': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;

   /**Community payment tab setting..... */
   'getCommunityPayments': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
   'getOrgPaymentPageAdminApproval': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
   'orgPaymentPageAdminApproval': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
   'communityMemberRoleFilter': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
   'aboutPageAdminApproval': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
   'bankDetailsAdminStatusChange': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;

  /**Edit Currency....... */
  'editCurrency': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;

  //sms and emails credit data
  'getAllCommunitiesSmsEmailCredit': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'addCommunitySmsEmailCredit': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'getAdminSmsEmailCredit': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'updateCommunitySmsEmailCredit': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
  'addAdminSmsEmailCredit': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;

  /**Notifiaction....... */
  'getAllNotificationsForDotCom': TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;

  /**Geofencing setting....... */
  addOrUpdateDistance: TypedDocumentNode<ResultOf<any>, VariablesOf<any>>;
}
