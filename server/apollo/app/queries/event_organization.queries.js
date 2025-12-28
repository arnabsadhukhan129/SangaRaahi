module.exports = function (gql) {
    return gql`
    type OrgEvent {
        id: String,
        hostId: String,
        communityId:String,
        groupId:String,
        category: String,
        postEventAsCommunity:Boolean
        type:String,
        title:String,
        description:String,
        image:String,
        logoImage:String,
        venueDetails:VenueDetails,
        invitationType:String,
        rsvpEndTime:String,
        date:Date,
        time:Date,
        rsvp:[Rsvp],
        createdAt:String,
        attendees:Attendees,
        isJoined:Boolean
        isActive:String,
        isCancelled:Boolean,
        user:User
        community:Community
        role:String
        paymentCategory: String
        paymentStatus: String
        recurringEvent : Boolean
        recurringDetails : RecurringDetails
        paymentPackages: [PaymentPackages]
    }
    type AllOrgEvents {
        total : Int,
        from:Int,
        to:Int
        events : [OrgEvent]
        loggeduserRole : String
    }
    type EventsCardDetails {
        totalPayment: Int
        paidEvents: Int
        freeEvents: Int
    }

    

    type EventPaymentCardDetails {
        totalAmount: Int
        totalDonation: Int,
        totalConcession: Int,
        rsvpTotal: Int
        nonrsvpTotal: Int
        tentativelyrsvpTotal: Int
        cancelrsvpTotal: Int
        openTask: Int
        eventSupplies: Int
    }
    
    input MyCommunityEventInput {
        type:String,
        title:String,
        description:String,
        image:String,
        logoImage:String,
        venueDetails:InputVenue,
        date:DateInput,
        time:DateInput,
        invitationType:String,
        rsvpEndTime:String,
        restrictNumberAttendees:Boolean,
        postEventAsCommunity:Boolean,
        attendeeListVisibilty:Boolean,
        collectEventPhotos:Boolean
        numberOfMaxAttendees:Int

        paymentStatus: PaymentType
        paymentCategory: PaymentCategoryType
        paymentPackages: InputPaymentPackages
        groups: [String]
        members: [String]
    }
    input AllEventsSearchField {
        communityId:String,
        search:String,
        page: Int,
        limit:Int,
        columnName: String,
        sort: String,
        eventType:String
        isActive:String,
        isCancelled: Boolean
        isAppPortal: Boolean
        ongoing: Boolean
    }
    input AllEventsSearchFieldForBlog {
        communityId:String
    }
    input OtpTokenInput {
        token : String
        otp : Int
    }

    type AllOrganizationEventsResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data:AllOrgEvents
    }

    type EventsCardDetailsResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data:EventsCardDetails
    }

    type EventPaymentCardDetailsResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data:EventPaymentCardDetails
    }

    type WebVisitorPhoneVerifyResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data:Jtoken
    }

    type RecurringWithTotal {
        events: [HomeEvent]
        total: Int
    }
    type UpcomingRecurringEventResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String
        data:RecurringWithTotal
    }
    
    extend type Query{
        getMyCommunityEvents(data: AllEventsSearchField): AllOrganizationEventsResponse,
        getMyCommunityEventsList(data: AllEventsSearchField): AllOrganizationEventsResponse,
        getMyCommunityEventsForBlog(data: AllEventsSearchFieldForBlog): AllOrganizationEventsResponse,
        getMyCommunityEventByID(id: ID): EventByIdResponse
        getchildEventDetails(id: ID): EventByIdResponse
        getAvailableEventUser(id: String) : AvailableUsersByIdResponse,
        getEventsCardDetails : EventsCardDetailsResponse
        getEventPaymentCardDetails(data: GeneralIdInput) : EventPaymentCardDetailsResponse
        getUpcomingRecurringEvent(data: GeneralIdInput) : UpcomingRecurringEventResponse
    }

    extend type Mutation {
        createMyCommunityEvent(data: MyCommunityEventInput): InsetEventResponse,
        myCommunityEventStatusChange(id: String!): GeneralResponse,
        myCommunitydeleteEvent(id: String!): DeleteEventResponse,
        myCommunityupdateEvent(data: UpdateEvent): UpdateEventResponse,
        acceptOrRejectOrgEvent(data: userToEventInput) : GeneralResponse,
        webVisitorPhoneVerify(data: userToEventInput) : WebVisitorPhoneVerifyResponse
        webVisitorPhoneOTPVerify(data: OtpTokenInput) : GeneralResponse
        acceptOrRejectRecurringEvent(data: userToEventInput) : GeneralResponse,
    }
`
}