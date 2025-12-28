module.exports = function (gql) {
    return gql`
    type CronList {
        id:String,
        eventName: String,
        userName: String,
        rsvpType: String,
        notificationType: String,
        notificationStatus: String,
        notificationDate: String,
        notificationTime: String,
        emailCount: Int,
        smsCount: Int,
        createdAt: String,
    }
    type AllCronByEvent {
        total: Int,
        from: Int,
        to: Int,
        crons: [CronList]
    }
    input rememberInput {
        communityId: String,
        eventId: String,
        userId: String,
        notificationType: String,
        notificationStatus: String,
        notificationDate: String,
        notificationTime: String,
        rsvpType: String,
        emailCount: Int,
        smsCount: Int
    }
    input cronInput {
        cronId: String
    }
    input CronFindInput {
        eventId: String,
        page: Int
    }
    type InsertImmediateResponse implements Response {
        error:Boolean,
        code: Int,
        systemCode: String,
        message: String,
        data: Id
    }
    type DeleteEventCronResponse implements Response {
        error: Boolean,
        code: Int,
        systemCode: String,
        message: String
    }
    type AllCronByEventResponse implements Response {
        error: Boolean,
        code: Int,
        systemCode: String,
        message: String,
        data: AllCronByEvent
    }
    extend type Query {
        getCornByEvent(data: CronFindInput): AllCronByEventResponse
    }
    extend type Mutation {
        eventImmediateRemember(data: rememberInput): InsertImmediateResponse,
        deleteEventCron(data: cronInput): DeleteEventCronResponse
    }
    `
}