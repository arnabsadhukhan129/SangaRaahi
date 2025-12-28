import { Apollo, gql } from 'apollo-angular';
import { ModuleKeyType } from '../interfaces/module-key-type.interface';

export const query_modules:ModuleKeyType = {
  adminLogin: gql`
        mutation adminLogin($data: AdminLogin){
          adminLogin(data:$data) {
            code,
            message,
            systemCode,
            data {
              token {
                accessToken,
                refreshToken
              },
              user {
                id,
                name,
                email
              }
            }
          }
        }
`,
verifyAdminPasswordOtp: gql`mutation VerifyAdminPasswordOtp($data: InputAdminVerifyPassword) {
  verifyAdminPasswordOtp(data: $data) {
    error
    systemCode
    code
    message
    data {
      token {
        accessToken
        refreshToken
      }
      user {
        id
        name
        phone
        email
      }
    }
  }
}`,
  // getAllUsers: gql`
  //   query {
  //     getAllUsers {
  //       code,
  //       message,
  //       systemCode,
  //       data {
  //         id
  //         name
  //         email
  //       }
  //     }
  //   }
  // `,
  getAllCommunities: gql`query GetAllCommunities($data: CommunitySearchField) {
    getAllCommunities(data: $data) {
      error
      code
      systemCode
      message
      data {
        total
        communities {
          id
          communityName
          communityType
          isActive
          isFeatured
          communitySettings {
            publicityPage
            freezePane
            eventPaymentSettings
            slug
            lebel
            webpageApprovalStatus
          }
          communityPayments {
            bankcheckImage
            bankcheckImageName
            bankcheckStatus
          }
          ownerDetails {
            id
            name
          }
        }
      }
    }
  }
  `,
  getMyCommunities: gql`
    query {
      getMyCommunities {
        code
        error
        message
        systemCode
        data {
          myCommunities {
            id
            ownerId
            communityType
            bannerImage
            communityName
            communityDescription
          }
        }
      }
    }
  `,
  getAllAnnouncement: gql`query GetAllAnnouncement($data: GroupSearchField) {
    getAllAnnouncement(data: $data) {
      error
      systemCode
      code
      message
      data {
        total
        announcements {
          id
          userId
          title
          description
          endDate
          toWhom
          communityId
          isActive
          community {
            communityName
          }
        }
      }
    }
  }
  `,
  announcementStatusChange: gql`mutation AnnouncementStatusChange($announcementStatusChangeId: GeneralIdInput) {
    announcementStatusChange(id: $announcementStatusChangeId) {
      code
      error
      systemCode
      message
    }
  }`,
  createAnnouncement: gql`
  mutation($data: InputAnnouncement) {
    createAnnouncement(data: $data){
      code
      error
      message
      systemCode
      data {
        id
      }
    }
  }
  `,
  deleteAnnouncement: gql`
  mutation DeleteAnnouncement($deleteAnnouncementId: String!) {
    deleteAnnouncement(id: $deleteAnnouncementId) {
      error
      systemCode
      code
      message
    }
  }`,
  getAnnouncementByID: gql`query GetAnnouncementByID($getAnnouncementByIdId: ID) {
    getAnnouncementByID(id: $getAnnouncementByIdId) {
      error
      systemCode
      code
      message
      data {
        id
        userId
        title
        description
        endDate
        toWhom
        communityId
        isActive
        community {
          communityName
        }
        user {
          name
        }
      }
    }
  }`,
  updateAnnouncement: gql`mutation UpdateAnnouncement($updateAnnouncementId: String!, $data: UpdateAnnouncement) {
    updateAnnouncement(id: $updateAnnouncementId, data: $data) {
      error
      systemCode
      code
      message
    }
  }`,
  getAllFeedbacks: gql`query GetAllFeedbacks($data: GroupSearchField) {
    getAllFeedbacks(data: $data) {
      error
      systemCode
      code
      message
      data {
        total
        feedbacks {
          id
          subject {
            id
            subject {
              data
              lang
            }
          }
          name
          email
          message
          isActive
          isReplied
        }
      }
    }
  }`,
  deleteFeedback: gql`mutation DeleteFeedback($data: GeneralIdInput) {
    deleteFeedback(data: $data) {
      code
      error
      systemCode
      message
    }
  }`,
  createCommunity: gql`
  mutation($data: CommunityInput) {
    createCommunity(data: $data) {
      error
      code
      systemCode
      message
      data {
        id
      }
    }
  }
  `,
  deleteCommunity: gql`
  mutation($deleteCommunityId: String!) {
    deleteCommunity(id: $deleteCommunityId) {
      error
      systemCode
      code
      message
    }
  }
  `,
  getCommunityByID: gql`query getCommunityByID($getCommunityByIdId: String) {
    getCommunityByID(id: $getCommunityByIdId) {
      error
      code
      systemCode
      message
      data {
        id
        communityType
        bannerImage
        communityName
        communityDescription
        currency
        communityLocation {
          location
          latitude
          longitude
        }
        address {
          firstAddressLine
          secondAddressLine
          city
          state
          country
          zipcode
        }
        nonProfit
        nonProfitTaxId
      }
    }
  }`,
  updateCommunity: gql` mutation updateCommunity($data: UpdateCommunity) {
    updateCommunity(data: $data) {
      error
      systemCode
      code
      message
    }
  }
  `,
  communityStatusChange: gql`
  mutation communityStatusChange($communityStatusChangeId: String!) {
    communityStatusChange(id: $communityStatusChangeId) {
      code
      error
      systemCode
      message
    }
  }`,

  communityMemberList: gql`
  query CommunityMemberList($data: CommunityMemberInput) {
    communityMemberList(data: $data) {
      error
      code
      systemCode
      message
      data {
        id
        communityName
        members {
          memberId
          roles
          joinedAt
          user {
            id
            name
            email
            phone
            profileImage
          }
        }
      }
    }
  }`,
  removeCommunityMember: gql`
  mutation RemoveCommunityMember($data: RemoveCommunityMemberInput) {
    removeCommunityMember(data: $data) {
      code
      error
      systemCode
      message
    }
  }`,

  communityRequestList: gql`query CommunityRequestList($data: InputRequestCommunityMember) {
  communityRequestList(data: $data) {
    error
    systemCode
    code
    message
    data {
      total
      from
      to
      communities {
        id
        communityName
        members {
          memberId
          roles
          joinedAt
          user {
            id
            name
            profileImage
          }
          memberPromotions {
            type
            date
            status
            path {
              from
              to
            }
            authorizePersonId
          }
        }
      }
    }
  }
}`,

  approveOrRejectMemberRequest: gql`mutation ApproveOrRejectMemberRequest($data: CommunityMemberApproveInput) {
    approveOrRejectMemberRequest(data: $data) {
      code
      error
      systemCode
      message
    }
  }`,
  communityUserRole: gql`query CommunityUserRole($data: GeneralIdInput) {
    communityUserRole(data: $data) {
      error
      systemCode
      code
      message
      data {
        role
      }
    }
  }`,
  groupUserRole: gql`query GroupUserRole($data: GeneralIdInput) {
    groupUserRole(data: $data) {
      error
      systemCode
      code
      message
      data {
        role
      }
    }
  }`,

  //For Group
  getAllGroup: gql`
  query GetAllGroup($data: GroupSearchField) {
    getAllGroup(data:$data) {
      error
      systemCode
      code
      message
      data {
        total
        loggeduser
        groups {
          id
          name
          description
          image
          createdBy
          communityId
          isActive
          ownerDetails {
            id
            name
            email
            phone
            image
          }
          community {
            communityName
          }
          user {
            name
          }
        }
      }
    }
  }
  `,

  groupStatusChange: gql`
  mutation groupStatusChange($groupStatusChangeId: String!) {
    groupStatusChange(id: $groupStatusChangeId) {
      code
      error
      systemCode
      message
    }
  }`,
  createGroup: gql`
  mutation createGroup($data: InputGroup) {
    createGroup(data: $data) {
      error
      systemCode
      code
      message
      data {
        id
      }
    }
  }
  `,
  deleteGroup: gql`
  mutation DeleteGroup($data: GeneralIdInput) {
    deleteGroup(data: $data) {
      error
      systemCode
      code
      message
    }
  }`,
  getAdminGroupByID: gql`query GetAdminGroupByID($getAdminGroupByIdId: ID) {
    getAdminGroupByID(id: $getAdminGroupByIdId) {
      error
      systemCode
      code
      message
      data {
        id
        name
        description
        image
        type
        createdBy
        communityId
        isActive
        members {
          memberId
          roles
          isApproved
          isRejected
          isActive
          isDeleted
          isLeaved
        }
        ownerDetails {
          id
          name
          email
          phone
          image
        }
        memberCount
      }
    }
  }`,
  updateGroup: gql`
  mutation UpdateGroup($updateGroupId: String!, $data: UpdateGroupField) {
    updateGroup(id: $updateGroupId, data: $data) {
      error
      systemCode
      code
      message
    }
  }`,
  getAvailableCommunityUser: gql`
  query getAvailableCommunityUser($getAvailableCommunityUserId: String) {
    getAvailableCommunityUser(id: $getAvailableCommunityUserId) {
      error
      systemCode
      code
      message
      data {
        id
        name
        contact {
          email {
            address
          }
        }
      }
    }
  }`,
  addGroupMember: gql`
  mutation AddGroupMember($data: InputMember) {
    addGroupMember(data: $data) {
      code
      error
      systemCode
      message
    }
  }
  `,
  getMembersById: gql`query GetMembersById($getMembersByIdId: String) {
    getMembersById(id: $getMembersByIdId) {
      error
      systemCode
      code
      message
      data {
        name
        email
        userId
        roles
      }
    }
  }`,
  groupMemberList: gql`query GroupMemberList($data: GroupMemberInput) {
    groupMemberList(data: $data) {
      error
      code
      systemCode
      message
      data {
        id
        name
        members {
          memberId
          roles
          joinedAt
          user {
            id
            name
            email
            phone
            profileImage
          }
        }
      }
    }
  }`,

  removeGroupMember: gql`mutation RemoveGroupMember($data: InputRemoveMember) {
    removeGroupMember(data: $data) {
      code
      error
      systemCode
      message
    }
  }`,

  groupRequestList: gql`query GroupRequestList($data: InputRequestGroupMember) {
    groupRequestList(data: $data) {
      error
      systemCode
      code
      message
      data {
        id
        name
        members {
          memberId
          roles
          joinedAt
          user {
            id
            name
            profileImage
          }
        }
      }
    }
  }`,
  approveOrRejectGroupMemberRequest: gql`
  mutation ApproveOrRejectGroupMemberRequest($data: GroupMemberApproveInput) {
    approveOrRejectGroupMemberRequest(data: $data) {
      code
      error
      systemCode
      message
    }
  }`,
  promoteOrDemoteCommunityMember: gql`mutation PromoteOrDemoteCommunityMember($data: InputPromoteDemoteMember) {
    promoteOrDemoteCommunityMember(data: $data) {
      code
      error
      systemCode
      message
      data {
        oldRole
        newRole
      }
    }
  }`,

  //User queries
  getAllUsers: gql`query getAllUsers($data: InputUserSearch) {
    getAllUsers(data: $data) {
      error
      systemCode
      code
      message
      data {
        total
        users {
          id
          communityMemberId
          name
          email
          phone
          isActive
          profileImage
          address
          gender
        }
      }
    }
  }`,
  userStatusChange: gql`
  mutation UserStatusChange($userStatusChangeId: String!) {
    userStatusChange(id: $userStatusChangeId) {
      code
      error
      systemCode
      message
    }
  }`,
  deleteUser: gql`
  mutation DeleteUser($deleteUserId: String!) {
    deleteUser(id: $deleteUserId) {
      error
      systemCode
      code
      message
    }
  }`,
  createUser: gql`
  mutation CreateUser($data: InputUserData) {
    createUser(data: $data) {
      error
      systemCode
      code
      message
      data {
        id
      }
    }
  }`,
  getUserByID: gql`query GetUserByID($getUserByIdId: String) {
    getUserByID(id: $getUserByIdId) {
      error
      systemCode
      code
      message
      data {
        id
        name
        email
        phone
        userType
        firstAddressLine
        profileImage
        city
        zipcode
        phoneCode
        dateOfBirth {
          value
        }
        isActive
      }
    }
  }`,
  updateUser: gql` mutation UpdateUser($data: InputUserData) {
    updateUser(data: $data) {
      error
      systemCode
      code
      message
    }
  }`,
  resetUserPassword: gql`mutation ResetUserPassword($resetUserPasswordId: String) {
    resetUserPassword(id: $resetUserPasswordId) {
      code
      error
      systemCode
      message
    }
  }`,
  getCountryCodes: gql`query GetCountryCodes {
    getCountryCodes {
      error
      systemCode
      code
      message
      data {
        name
        dialCode
        code
      }
    }
  }`,

  //Logout
  logout: gql`mutation Logout {
    logout {
      code
      error
      systemCode
      message
    }
  }`,
  //S3 File upload
  generateS3UploadURL: gql`mutation generateS3UploadURL($data: InputS3Details) {
    generateS3UploadURL(data: $data) {
      error
      systemCode
      code
      message
      data {
        url
        key
      }
    }
  }`,


  // For only test
  getAllBooks: gql`
    query {
      getAllBooks {
        code
        error
        message
        systemCode
        data{
          title
          language
        }
      }
    }
  `,

  getAllEvents: gql`query GetAllEvents($data: GroupSearchField) {
    getAllEvents(data: $data) {
      error
      systemCode
      code
      message
      data {
        loggeduser
        total
        events {
          id
          hostId
          communityId
          groupId
          category
          postEventAsCommunity
          type
          title
          description
          image
          invitationType
          rsvpEndTime
          date {
            from
            to
          }
          time {
            from
            to
          }
          user{
            name
          }
          community{
            communityName
          }
          isActive
        }
      }
    }
  }`,
  getMyProfileDetails: gql`query GetMyProfileDetails {
    getMyProfileDetails {
      error
      systemCode
      code
      message
      data {
        user {
          name
          email
          phone
          id
          profileImage
        }
      }
    }
  }`,
  eventStatusChange: gql`mutation EventStatusChange($eventStatusChangeId: String!) {
    eventStatusChange(id: $eventStatusChangeId) {
      code
      error
      systemCode
      message
    }
  }`,
  deleteEvent: gql`mutation DeleteEvent($deleteEventId: String!) {
    deleteEvent(id: $deleteEventId) {
      error
      systemCode
      code
      message
    }
  }`,
  getAdminEventByID: gql`query GetAdminEventById($getAdminEventByIdId: ID) {
    getAdminEventByID(id: $getAdminEventByIdId) {
      error
      systemCode
      code
      message
      data {
        id
        hostId
        communityId
        groupId
        category
        postEventAsCommunity
        type
        title
        description
        image
        venueDetails {
          firstAddressLine
          secondAddressLine
          city
          state
          country
          zipcode
          phoneNo
        }
        invitationType
        rsvpEndTime
        date {
          from
          to
        }
        time {
          from
          to
        }
        attendees {
          isRestricted
          numberOfMaxAttendees
          additionalGuests
          numberOfMaxGuests
          attendeesListVisibility
          mediaUploadByAttendees
          isActive
          isDeleted
          createdAt
          updatedAt
        }
        isJoined
        isActive
        user {
          name
        }
        community {
          communityName
        }
      }
    }
  }`,
  createEvent: gql`mutation CreateEvent($data: EventInput) {
    createEvent(data: $data) {
      error
      code
      systemCode
      message
      data {
        id
      }
    }
  }`,
  updateEvent: gql`mutation UpdateEvent($data: UpdateEvent) {
    updateEvent(data: $data) {
      error
      systemCode
      code
      message
    }
  }`,
  getAdminDashboardDetails: gql `query GetAdminDashboardDetails {
    getAdminDashboardDetails {
      error
      systemCode
      code
      message
      data {
        userData
        communityData
        groupData
        eventData
        messageData
      }
    }
  },`,
  adminForgotPassword:gql `mutation AdminForgotPassword($data: InputAdminForgotPassword) {
    adminForgotPassword(data: $data) {
      error
      systemCode
      code
      message
      data {
        token
      }
    }
  }`,
  // verifyAdminPasswordOtp : gql `mutation VerifyAdminPasswordOtp($data: InputAdminVerifyPassword) {
  //   verifyAdminPasswordOtp(data: $data) {
  //     error
  //     systemCode
  //     code
  //     message
  //   }
  // }`,
  adminPasswordChange : gql `mutation AdminPasswordChange($data: InputAdminPassChange) {
    adminPasswordChange(data: $data) {
      error
      systemCode
      code
      message
    }
  }`,
  adminPasswordResendOtp : gql`mutation AdminPasswordResendOtp {
    adminPasswordResendOtp {
      code
      error
      systemCode
      message
    }
  }` ,
  updateCommunityFeaturedStatus : gql`mutation UpdateCommunityFeaturedStatus($data: GeneralIdInput) {
    updateCommunityFeaturedStatus(data: $data) {
      error
      systemCode
      code
      message
    }
  }`,

  updatefreezePaneStatus : gql`mutation UpdatefreezePaneStatus($data: GeneralIdInput) {
    updatefreezePaneStatus(data: $data) {
      error
      systemCode
      code
      message
    }
  }`, 

  updateEventPaymentStatus : gql`mutation UpdateEventPaymentStatus($data: GeneralIdInput) {
    updateEventPaymentStatus(data: $data) {
      error
      systemCode
      code
      message
    }
  }`, 
  
  publicityPageStatusChange : gql`mutation PublicityPageStatusChange($data: GeneralIdInput) {
    publicityPageStatusChange(data: $data) {
      code
      error
      systemCode
      message
    }
  }`,
  adminLogApprovalList: gql`query AdminLogApprovalList($data: InputAdminLogApprovalList) {
    adminLogApprovalList(data: $data) {
      error
      systemCode
      code
      message
      data {
        id
        communityId
        type
        field
        fieldname
        content
        contentId
        isApproved
      }
    }
  }`, 
  adminLogApproval: gql`mutation AdminLogApproval($data: ApprovalInput) {
    adminLogApproval(data: $data) {
      code
      error
      systemCode
      message
    }
  }`, 
  
  /**Community home tab setting..... */
  orgHomePageAdminApproval: gql`mutation OrgHomePageAdminApproval($data: OrgHomePageApprovalInput) {
    orgHomePageAdminApproval(data: $data) {
      code
      error
      systemCode
      message
    }
  }`,

  getOrgPageAdminApproval: gql`query GetOrgPageAdminApproval($data: GeneralIdInput) {
    getOrgPageAdminApproval(data: $data) {
      error
      code
      systemCode
      message
      data {
        communityId
        orgBannerImage
        orgLogoImage
        orgLocation
        orgCommunityEmail
        orgCommunityNumber
        orgCommunityDescription
        isApproveCommunityBannerImage
        isApproveCommunityDescription
        isApproveCommunityAddress
        isApproveCommunityEmailAddress
        isApproveCommunityPhoneNumber
        isApproveCommunityLogoImage
      }
    }
  }`,

  /**Community video tab setting..... */
  getCommunityVideos: gql`query GetCommunityVideos($data: OrgPortalCommunityInput) {
    getCommunityVideos(data: $data) {
      error
      systemCode
      code
      message
      data {
        id
        communityId
        title
        description
        thumbnailImage
        link
        orderNo
        isApproved
      }
    }
  }`,

  videoSettingsAdminApproval: gql`mutation VideoSettingsAdminApproval($data: [VideoApprovalInput]) {
    videoSettingsAdminApproval(data: $data) {
      code
      error
      systemCode
      message
    }
  }`,

  /**Community payment tab setting..... */
  getCommunityPayments: gql`query GetCommunityPayments($data: GeneralIdGetInput) {
    getCommunityPayments(data: $data) {
      error
      systemCode
      code
      message
      data {
        id
        communityId
        qrcodeImage
        bankcheckImage
        bankcheckImageName
        paymentDescription
        authorityName
        link
        otherpaymentLink
      }
    }
  }`,

  getOrgPaymentPageAdminApproval: gql`query GetOrgPaymentPageAdminApproval($data: GeneralIdInput) {
    getOrgPaymentPageAdminApproval(data: $data) {
      error
      code
      systemCode
      message
      data {
        id
        qrcodeIsApproved
        authorityNameIsApproved
        otherpaymentLinkIsApproved
        paymentDescriptionIsApproved
        orgQrcodeImage
        orgPaymentDescription
        orgAuthorityName
        orgLink
      }
    }
  }`,
  orgPaymentPageAdminApproval: gql`mutation OrgPaymentPageAdminApproval($data: OrgPaymentPageApprovalInput) {
    orgPaymentPageAdminApproval(data: $data) {
      code
      error
      systemCode
      message
    }
  }`,
  communityMemberRoleFilter: gql`query CommunityMemberRoleFilter($data: CommunityMemberRoleFilterInput) {
    communityMemberRoleFilter(data: $data) {
      error
      code
      systemCode
      message
      data {
        members {
          memberId
          roles
          isAdminApproved
          user {
            id
            name
            email
            phone
            profileImage
            lastActivityAt
          }
        }
      }
    }
  }`,
  aboutPageAdminApproval: gql`mutation AboutPageAdminApproval($data: AboutPageApprovalInput) {
    aboutPageAdminApproval(data: $data) {
      code
      error
      systemCode
      message
    }
  }`,
  bankDetailsAdminStatusChange : gql`mutation BankDetailsAdminStatusChange($data: ApprovalInput) {
    bankDetailsAdminStatusChange(data: $data) {
      code
      error
      systemCode
      message
    }
  }`,

  editCurrency: gql`mutation EditCurrency($data: CurrencyInput) {
    editCurrency(data: $data) {
      code
      error
      systemCode
      message
    }
  }`,

  getAllCommunitiesSmsEmailCredit: gql`query GetAllCommunitiesSmsEmailCredit($data: GroupSearchField) {
    getAllCommunitiesSmsEmailCredit(data: $data) {
      error
      systemCode
      code
      message
      data {
        total
        communitiesSmsEmailCredit {
          id
          communityName
          communityDescription
          ownerDetails {
            name
          }
          communityType
          smsCreditsRemaining
          emailCreditsRemaining
          isActive
          memberCount
        }
      }
    }
  }`,

  addCommunitySmsEmailCredit: gql`mutation AddCommunitySmsEmailCredit($data: InputCommunitySmsEmailCredit) {
    addCommunitySmsEmailCredit(data: $data) {
      code
      error
      systemCode
      message
      data {
        emailCreditsRemaining
        smsCreditsRemaining
      }
    }
  }`,

  getAdminSmsEmailCredit: gql`query GetAdminSmsEmailCredit {
    getAdminSmsEmailCredit {
      error
      systemCode
      code
      message
      data {
        emailCreditsRemaining
        smsCreditsRemaining
      }
    }
  }`,

  updateCommunitySmsEmailCredit: gql`mutation UpdateCommunitySmsEmailCredit($data: InputCommunitySmsEmailCredit) {
    updateCommunitySmsEmailCredit(data: $data) {
      code
      error
      systemCode
      message
      data {
        emailCreditsRemaining
        smsCreditsRemaining
      }
    }
  }`,

  addAdminSmsEmailCredit: gql`mutation AddAdminSmsEmailCredit($data: InputCommunitySmsEmailCredit) {
    addAdminSmsEmailCredit(data: $data) {
      error
      systemCode
      code
      message
      data {
        emailCreditsRemaining
        smsCreditsRemaining
      }
    }
  }`,

  getAllNotificationsForDotCom: gql`query GetAllNotificationsForDotCom($data: GroupSearchField) {
    getAllNotificationsForDotCom(data: $data) {
      error
      systemCode
      code
      message
      data {
        total
        notifications {
          id
          userId
          subject
          image
          text
          type
          sentAt
          isViewed
          section
          communityId
          slug
        }
      }
    }
  }`,

  addOrUpdateDistance: gql`mutation AddOrUpdateDistance($data: DistanceInput) {
    addOrUpdateDistance(data: $data) {
      error
      code
      systemCode
      message
      data {
        id
      }
    }
  }`
};
