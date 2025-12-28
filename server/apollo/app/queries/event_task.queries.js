module.exports = function(gql) {
    return gql`
    type Teamsize {
        adult:Int,
        teenager:Int,
        children:Int,
    }
    type assignmember {
        userId:String,
        name:String,
        userQuantity: Int,
        type:String,
        invitedBy:String,
        profileImage:String,
        status:String,
        isDeleted:Boolean
    }
    type Date {
        from:String,
        to:String,
        timezone:String,
    }
    type EventTask {
        id: String,
        communityId:String,
        communityName:String,
        eventId:String,
        eventName:String,
        invitationType:String,
        taskName:String,
        requireTeam:Int,
        taskDescription:String,
        teamSize:Teamsize,
        priority:String,
        profileImage:String,
        assignedMembers:[assignmember]
        taskStartDate:String,
        taskDeadline:String,
        time:Date,
        isDone:Boolean,
        isCancelled:Boolean,
        assignedMembersCount: Int
    }
    type AllEventTask {
        total : Int,
        from:Int,
        to:Int
        tasks : [EventTask]
    }
    type AllEventTaskById {
        tasks : EventTask
    }
    type UserAvalible {
        id: String,
        name: String,
        profileImage:String,
        number:String
        age: String,
        type: String,
        isAssigned:Boolean,
        rsvpStatus: String
    }
    type AcceptOrRejectUser {
        id: String,
        name: String,
        profileImage:String,
        number:String
        age: String,
        type: String,
        status: String,
        acceptedDate: String,
        acceptedTime: String
    }
    type TaskStatusCount {
        openTask: Int,
        closedTask: Int,
        assignedTask: Int,
        pastTask: Int
    }
    input EventTaskFindInput {
        communityId: String,
        eventId:String,
        userId:String,
        status:String,
        taskDeadline:String,
        page: Int
        search: String
        priority:String,
        isDone:Boolean,
        columnName: String,
        sort: String

        isAppPortal: Boolean
    }
    input EventTaskByIdFindInput {
        taskId:String,
    }
    input assignedMembers {
        UserId:String,
        type:String,
        invitedBy:String,
    }
    input InputTeamsize {
        adult:Int,
        teenager:Int,
        children:Int,
    }
    input DateInput {
        from:String,
        to:String
        timezone:String
    }
    input EventTaskInput {
        communityId:String,
        eventId:String,
        taskName:String,
        requireTeam:Int,
        taskDescription:String,
        teamSize:InputTeamsize,
        priority:String,
        taskStartDate:String,
        taskDeadline:String,
        time: DateInput,
        isDone:Boolean,
        assignedMembers:[assignedMembers],
    }
    input UpdareEventTaskInput {
        taskId:String,
        eventId:String,
        taskName:String,
        requireTeam:Int,
        taskDescription:String,
        teamSize:InputTeamsize,
        priority:String,
        taskStartDate:String,
        taskDeadline:String,
        time: DateInput,
        isDone:Boolean,
        assignedMembers:[assignedMembers],
    }
    input DeleteEventTaskInput {
        taskId:String,
    }
    input assignMembersInput {
        taskId:String,
        UserId:String,
        type:String,
    }
    input deletedInput {
        taskId:String,
        UserId:String,
    }
    input InputEventTaskId {
        eventId: String,
        taskId:String,
        supplierId:String,
        type:String,
        age:Int,
        page: Int,
        limit: Int
    }
    input userToTaskInput {
        taskId:String,
        status:String,
        isAppPortal: Boolean
    }
    input acceptOrRejectuserInput {
        taskId:String,
        status:String,
        page:Int,
    }
    input selfVolunteerInput {
        taskId:String,
        type:String,
        status:String,
        isAppPortal: Boolean
    }
    type AllEventTaskResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data:AllEventTask
    }
    type EventTaskByIdResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data:AllEventTaskById
    }
    type InsetEventTaskResponse implements Response {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: Id
    }
    type InsertAssignMembersInput implements Response {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: Id
    }
    type UpdateEventTaskResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String
        data: Id
    }
    type DeleteEventTaskResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String
    }
    type DeleteAssignMemberResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String
    }
    type AllAvailableUserResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data: [UserAvalible]
    }
    type AllAcceptOrRejectUserListResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data: [AcceptOrRejectUser]
    }
    type AllTaskStatusCountingResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data: TaskStatusCount
    }
    extend type Query {
        getAllEventTask(data: EventTaskFindInput): AllEventTaskResponse,
        getAllEventTaskForApp(data: EventTaskFindInput): AllEventTaskResponse,
        getEventTaskById(data: EventTaskByIdFindInput): EventTaskByIdResponse,
        getUserVisibility(data: InputEventTaskId) : AllAvailableUserResponse,
        getTaskStatusCounting(data: EventTaskFindInput) : AllTaskStatusCountingResponse,
        acceptOrRejectUserList(data: acceptOrRejectuserInput) : AllAcceptOrRejectUserListResponse
    }
    extend type Mutation {
        createEventTask(data: EventTaskInput): InsetEventTaskResponse,
        updateEventTask(data: UpdareEventTaskInput): UpdateEventTaskResponse,
        deleteEventTask(data: DeleteEventTaskInput): DeleteEventTaskResponse,
        eventTaskStatusChange(id: String!): GeneralResponse,
        assignMembers(data: assignMembersInput) : InsertAssignMembersInput,
        deleteAssignMember(data: deletedInput): DeleteAssignMemberResponse,
        acceptOrRejectTask(data: userToTaskInput) : GeneralResponse,
        selfVolunteer(data: selfVolunteerInput) : GeneralResponse
    }
    `
}