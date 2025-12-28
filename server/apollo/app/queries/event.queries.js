/**
 * The type Event
 */
module.exports = function (gql) {
    return gql`
            type Date {
                from:String,
                to:String,
                timezone:String,
            }

            type FamilyMembers {
                userId: String,
                name: String,
                relation: String
            }

            type Guests {
                seniors:Int,
                adults:Int,
                minor:Int,
                total:Int,
                familyMembers:[FamilyMembers],
            }

            type Rsvp {
                userId:String,
                status:String,
                guests:Guests,
                createdAt:String,
                updatedAt:String
                user:User
            }

            type EventImages {
                imageName:String
                url:String
                userId:String,
                uploadedAt:String,
                isDeleted:Boolean,
                isActive:Boolean,
            }

            type Attendees {
                isRestricted:Boolean,
                webvistorRestriction:Boolean,
                numberOfMaxAttendees:Int,
                numberOfMaxWebVisitors:Int,
                remainingNumberOfAttendees:Int
                remainingNumberOfWebVisitors:Int
                additionalGuests:Boolean,
                numberOfMaxGuests:Int,
                attendeesListVisibility:String,
                mediaUploadByAttendees:Boolean,
                isActive:Boolean,
                isDeleted:Boolean,
                createdAt:String,
                updatedAt:String,
            }
            
            type AttendeesList {
                attendees:Attendees
            }

            type VenueDetails {
                firstAddressLine:String,
                secondAddressLine:String,
                city:String,
                state:String,
                country:String,
                zipcode:String,
                phoneNo:String,
                phoneCode:String,
                latitude: String
                longitude: String
            }

            type PaymentPackages {
                id:String,
                currency: String
                packageName: String
                packageRate: Int
                packageLogo: String
                earlyBirdDate: String
                earlyBirdRate: Int
                number:Int
                description: String
                isActive: Boolean
            }

            type RecurringDetails {
                recurreingType: String
                startTime: String
                endTime: String
                occurationNumber: Int
                weeklyDayIndex: [Int]
                monthlyDate: [Int]
            }

            type Event {
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
                attendees:Attendees,
                isJoined:Boolean
                createdAt:String,
                isActive:Boolean
                isCancelled:Boolean
                user:User
                community:Community
                role:String
                invitedBy:User
                paymentCategory: String
                paymentPackages: [PaymentPackages]
                paymentStatus: String
                groups: [Group]
                members: [User]
                recurringEvent : Boolean
                recurringDetails : RecurringDetails
            }

            type HomeEvent {
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
                rsvp:Rsvp,
                attendees:Attendees,
                isJoined:Boolean
                isActive:Boolean
                isCancelled:Boolean
                user:User
                community:Community
                role:String
                invitedBy:User
                paymentCategory: String
                paymentPackages: [PaymentPackages]
                paymentStatus: String
                groups: [Group]
                members: [User]
                recurringEvent : Boolean
                recurringDetails : RecurringDetails
                isJoinRequestSent: Boolean
                loggeduserRole : String
            }

            type Counters {
                invited:Int
                rsvpCount:Int
                blogCount:Int
                photosCount:Int
            }
            type EventDetails {
                id: String,
                hostId: String,
                hostName: String,
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
                rsvp:Rsvp,
                attendees:Attendees,
                user:User
                community:Community
                loginUser:String
                loginUserRole:String
                isJoined:Boolean
                currentAttendees:Int
                paymentCategory: String
                paymentPackages: [PaymentPackages]
                paymentStatus: String
                groups: [Group]
                members: [User]
                eventHostCounters:Int
                remainingAttendees:Int
                listing:Counters
                blogs : [Blogs]
                eventImage : [Images]
                recurringEvent : Boolean
                recurringDetails : RecurringDetails
                isJoinRequestSent : Boolean
                invitedBy:User
            }

            type AllEvents {
                total : Int,
                from:Int,
                to:Int
                events : [Event]
                loggeduser : String
            }
            

            type InsertEventResponseDataType {
                id:ID
            }

            type RsvpRes {
                id:String
                hostId:String
                rsvp:Rsvp
            }

            type RsvpList {
                rsvps:[RsvpRes]
                isHost:Boolean
                loginId:String
            }
            
            type UserAvalibility {
                id: String,
                name: String,
                profileImage:String,
                number:String
            }
            type RemainStatus {
                remain: Boolean
            }
            type RsvpEventControll {
                id: String
                rsvpType:String,
                emailContent: String
                smsContent: String
                isDelete: Boolean
            }
            type RsvpAdminControll {
                rsvpControll : [RsvpEventControll],
                link: String
            }
            type AllEventsRsvpAdminControll {
                remain : Boolean
                rsvpAdminControll : [RsvpEventControll]
            }

            ## Input types
            input DateInput {
                from:String,
                to:String
                timezone:String
            }
            input InputVenue {
                firstAddressLine:String,
                secondAddressLine:String,
                city:String,
                state:String,
                country:String,
                zipcode:String,
                phoneNo:String,
                phoneCode:String
            }

            input EventInput {
                id:String
                communityId:String,
                groupId:String,
                type:String,
                title:String,
                description:String,
                image:String,
                logoImage:String
                venueDetails:InputVenue,
                date:DateInput,
                time:DateInput,
                invitationType:String,
                rsvpEndTime:String,
                restrictNumberAttendees:Boolean,
                webvistorRestriction:Boolean,
                postEventAsCommunity:Boolean,
                attendeeListVisibilty:Boolean,
                collectEventPhotos:Boolean
                numberOfMaxAttendees:Int
                numberOfMaxWebVisitors:Int
                numberOfMaxGuests:Int
                paymentStatus: PaymentType
                paymentCategory: PaymentCategoryType
                paymentPackages: [InputPaymentPackages]
                groups: [String]
                members: [String]
                eventHost: [String]

                recurringEvent: Boolean
                recurringDetails: InputRecurring

            }

            input InputRecurring {
                occurances : Int
                recurringType : RecurringType
                dateIndex: [Int]
            }

            input InputPaymentPackages {
                currency: String
                packageName: String
                packageRate: Int
                packageLogo: String
                earlyBirdDate: String
                earlyBirdRate: Int
                description: String
                isActive: Boolean
            }

            input UpdateEvent {
                id: String!,
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
                webvistorRestriction:Boolean,
                postEventAsCommunity:Boolean,
                attendeeListVisibilty:Boolean,
                collectEventPhotos:Boolean
                numberOfMaxAttendees:Int
                numberOfMaxWebVisitors:Int
                numberOfMaxGuests:Int
                paymentCategory: PaymentCategoryType
                paymentPackages: [InputPaymentPackages]
                groups: [String]
                members: [String]
            }

            input RsvpFamilyMemberInput {
                userId: String
                name: String!
                relation: String!
            }

            input RsvpInput {
                eventId:String
                userId:String
                status:String
                adults:Int
                minor:Int
                familyMembers:[RsvpFamilyMemberInput]
            }

            input RsvpListInput {
                eventId:String,
                rsvpType:[String]
            }

            input EventFilter {
                search:String
                filter:String
                Invitetype:[String]
                paymentStatus:String
                communityId:String
                isAppPortal:Boolean
            }

            input PrivateEventInviteInput {
                eventId:String
                userIds:[String]
            }

            input userToEventInput {
                eventId:String,
                userId:String,
                status:InvitationStatus,
                numberSeniors:Int
                numberAdults:Int
                numberChildren:Int
                packageDetails:[inputPackageDetails]
                name:String
                email:String
                phone:String,
                phoneCode:String,
                recurringType:RecurringInputType
                force_join:Boolean
                userType:String
            }

            input inputPackageDetails {
                packageId:String
                number:Int
            }
            
            input inputRemoveGroupOrMember {
                id : String
                eventId : String
                type : String
            }
            input InputRsvpRemainderControll {
                rsvpType:String,
                emailContent: String
                smsContent: String
                deepLink: String
            }
            input UpdateRsvpAdminControll {
                id : String
                rsvpAdminControll: [InputRsvpRemainderControll]
            }
            input inputRemoveRemainderSettings {
                id: String
                eventId : String
            }

            ## Response Types
            type InsetEventResponse implements Response {
                error:Boolean,
                code:Int,
                systemCode:String,
                message:String,
                data: Id
            }

            type AllEventsResponse implements Response {
                error:Boolean,
                systemCode:String,
                code:Int,
                message:String,
                data:AllEvents
            }

            type EventByIdResponse implements Response {
                error:Boolean,
                systemCode:String,
                code:Int,
                message:String,
                data:Event
            }

            type EventDetailsResponse implements Response {
                error:Boolean,
                systemCode:String,
                code:Int,
                message:String,
                data:EventDetails
            }

            type UpdateEventResponse implements Response {
                error:Boolean,
                systemCode:String,
                code:Int,
                message:String
            }

            type DeleteEventResponse implements Response {
                error:Boolean,
                systemCode:String,
                code:Int,
                message:String
            }

            type ViewEventResponse implements Response {
                error:Boolean,
                systemCode:String,
                code:Int,
                message:String
                data:[HomeEvent]
            }

            type RsvpListResponse implements Response {
                error:Boolean,
                systemCode:String,
                code:Int,
                message:String
                data:RsvpList
            }

            type EventPhotoResponse implements Response {
                error:Boolean,
                systemCode:String,
                code:Int,
                message:String
                data:[AttendeesList]
            }
            type AllAvailableForEventResponse implements Response {
                error:Boolean,
                systemCode:String,
                code:Int,
                message:String,
                data: [UserAvalibility]
            }

            type EventAttendingAlertRecord implements Response {
                code:Int,
                error:Boolean,
                systemCode:String,
                message:String,
                data:[Event]
            }
            type RemainderStatusResponse implements Response {
                code:Int,
                error:Boolean,
                systemCode:String,
                message:String,
                data:RemainStatus
            }
            type UpdateRsvpAdminControllResponse implements Response {
                code:Int,
                error:Boolean,
                systemCode:String,
                message:String,
                data:RsvpAdminControll
            }
            type AllEventsRsvpAdminControllResponse implements Response {
                error:Boolean,
                systemCode:String,
                code:Int,
                message:String,
                data:AllEventsRsvpAdminControll
            }

            #####
            extend type Query{
                getAllEvents(data: GroupSearchField): AllEventsResponse,
                getEventByID(id: ID): EventByIdResponse
                getAdminEventByID(id: ID): EventByIdResponse
                getViewEvents(data:EventFilter): ViewEventResponse
                getRsvpList(data:RsvpListInput): RsvpListResponse
                getRsvpMemberList(data:RsvpListInput): RsvpListResponse
                getEventDetails(data: GeneralIdInput) : EventDetailsResponse,
                getEventDetailsForApp(data: GeneralIdInput) : EventDetailsResponse
                getEventDetailsForPublic(data: GeneralIdInput) : EventDetailsResponse
                getEventPhotos(data: GeneralIdInput) : EventPhotoResponse
                getAvalibleUsersForEvent(data: InputEventId) : AllAvailableForEventResponse,
                getAllRsvpAdminControll(data: GeneralIdInput): AllEventsRsvpAdminControllResponse,
            }

            extend type Mutation {
                createEvent(data: EventInput): InsetEventResponse,
                updateEvent(data: UpdateEvent): UpdateEventResponse,
                deleteEvent(id: String!): DeleteEventResponse
                respondOrEditRSVP(data:RsvpInput): GeneralResponse
                privateEventInvite(data:PrivateEventInviteInput): GeneralResponse
                cancelEvent(data: GeneralIdInput): GeneralResponse
                eventStatusChange(id: String!): GeneralResponse,
                acceptOrRejectEvent(data: userToEventInput) : InsetEventResponse
                updateUserRsvp(data: userToEventInput) : InsetEventResponse
                removeGroupOrMemberEvent(data: inputRemoveGroupOrMember) : GeneralResponse
                eventAttendingAlert(data: GeneralIdInput) : EventAttendingAlertRecord
                cancelRsvp(data: userToEventInput) : GeneralResponse
                setRemainderStatusChange(id: String!): RemainderStatusResponse
                updateRsvpAdminControll(data: UpdateRsvpAdminControll): UpdateRsvpAdminControllResponse
                removeRemainderSettingsEvent(data: inputRemoveRemainderSettings) : GeneralResponse
                editRecurringEvent(data: EventInput) : GeneralResponse
            }
        `
} 