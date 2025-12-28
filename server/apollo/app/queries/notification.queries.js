/**
 * The type Notification
 */

module.exports = function(gql){
    return gql`
        ## Type Construct Start
        type Notification {
            id:String!,
            userId:String,
            subject:String,
            image:String
            text:String,
            type:String,
            sentAt:String
            deviceType:[String],
            domains:[String]
            isViewed : Boolean
            section : String
            communityId : String
            slug : String
        }

        type AllNotification {
            total : Int,
            from : Int,
            to : Int,
            notifications: [Notification]
        }

        type NotificationSettings {
            communityEvent:Boolean
            communityGroupEvent:Boolean
            privateEvent:Boolean
            communityAnnouncement:Boolean
            communityGroupAnnouncement:Boolean
            communityGroupAtivities: Boolean
        }

        ## Type Construct End

        input insertNotificationSettings {
            deviceId:String
            deviceType:String
            communityEvent:Boolean
            communityGroupEvent:Boolean
            privateEvent:Boolean
            communityAnnouncement:Boolean
            communityGroupAnnouncement:Boolean
            communityGroupAtivities: Boolean
            isAppPortal:Boolean
        }
        input insertTestNotification{
            token: [String]
            body:String
            title:String
        }
        ## Response Type Construct Start
        type AllNotificationResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:AllNotification           
        }

        type NotificationSettingsResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
            data:NotificationSettings           
        }
        type TestNotificationResponse implements Response {
            error:Boolean,
            systemCode:String,
            code:Int,
            message:String,
        }
        ## Response Type Construct End

        extend type Query{
            getAllNotifications (data: GroupSearchField) : AllNotificationResponse
            getAllNotificationsForDotCom (data: GroupSearchField) : AllNotificationResponse
            getNotificationSettings(data: insertNotificationSettings) : NotificationSettingsResponse
        }
        extend type Mutation{
            notificationSettings (data: insertNotificationSettings) : GeneralResponse
            testNotification (data:insertTestNotification): TestNotificationResponse
            dotComNotificationSeen : GeneralResponse
        }
    `
}