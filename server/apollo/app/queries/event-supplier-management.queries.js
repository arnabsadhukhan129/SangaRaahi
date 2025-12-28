module.exports = function(gql) {
    return gql `
    type Teamsize {
        adult:Int,
        teenager:Int,
        children:Int,
    }
    type EventSupplier {
        id: String,
        communityId: String,
        communityName: String,
        eventId: String,
        invitationType:String,
        supplyItem:String,
        quantity:Int,
        alreadyTaken:Int,
        remainingQuantity:Int,
        eventName:String,
        supplyItemDescription:String,
        neededFor:String,
        requiredDate:String,
        time:Date,
        volunteered:Int,
        teamSize:Teamsize,
        isDone:Boolean,
        assignedMembers:[assignmember]
        assignedMembersCount: Int,
        isCancelled:Boolean,
    }
    type AllEventSupplier {
        total : Int,
        from:Int,
        to:Int
        orders : [EventSupplier]
    }
    type AllEventSupplierById {
        total : Int,
        from:Int,
        to:Int
        orders : EventSupplier
    }
    type AllSupplierStatusCount {
        openOrders: Int,
        closedOrders: Int,
        assignedOrders: Int,
        fulfilledOrders: Int
    }
    type SupplierLog {
        id: String,
        name: String,
        profileImage:String,
        number:String
        age: String,
        type: String,
        status: String,
        userQuantity: Int,
        portal: String,
        acceptedDate: String,
        acceptedTime: String,
        isActive: Boolean
    }
    input InputTeamsize {
        adult:Int,
        teenager:Int,
        children:Int,
    }
    input EventSupplierManagementInput {
        communityId: String,
        eventId: String,
        supplyItem:String,
        quantity:Int,
        supplyItemDescription:String,
        neededFor:String,
        requiredDate:String,
        time: DateInput
        volunteered:Int,
        teamSize:InputTeamsize
        assignedMembers:[assignedMembers],
    }
    input userToSupplierManagementInput {
        userQuantity:Int,
        supplierId:String,
        status:String,
        isAppPortal: Boolean
    }
    input EventSupplierInput {
        EventSupplierId: String
    }
    input EventSupplierManagementFindInput {
        communityId:String,
        eventId:String,
        userId:String,
        page: Int
        search: String,
        isDone: Boolean,
        columnName: String,
        sort: String,

        isAppPortal: Boolean
    }
    input EventSupplierByIdFindInput {
        supplierId:String,
    }
    input UpdateEventSupplierManagement {
        id:String,
        eventId: String,
        supplyItem:String,
        userQuantity: Int,
        quantity:Int,
        alreadyTaken:Int,
        supplyItemDescription:String,
        neededFor:String,
        requiredDate:String,
        time: DateInput,
        volunteered:Int,
        teamSize:InputTeamsize,
        isDone:Boolean,
        assignedMembers:[assignedMembers],
    }
    input assignSupplierMembersInput {
        supplierId:String,
        UserId:String,
        type:String,
    }
    input deletedSupplierInput {
        supplierId:String,
        UserId:String,
    }
    input acceptOrRejectSupplierUserInput {
        supplierId:String,
        status:String,
        page:Int,
    }
    input selfVolunteerSupplierInput {
        supplierId:String,
        alreadyTaken: Int,
        userQuantity: Int,
        type:String,
        status:String,
        isAppPortal: Boolean
    }
    input quantityStatusInput {
        supplierId: String,
        id: String,
        isActive: Boolean
    }
    type InsetEventSupplierManagementResponse implements Response {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: Id
    }
    type AllEventSupplierManagementResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data:AllEventSupplier
    }
    type EventSupplierByIdResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data:AllEventSupplierById
    }
    type UpdateEventSupplierManagementResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String
    }
    type DeleteEventSupplierManagementResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String
    }
    type AllSupplierStatusCountingResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data:AllSupplierStatusCount
    }
    type AllAcceptOrRejectSupplierUserListResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String,
        data: [AcceptOrRejectUser]
    }
    type SupplierAllLogHistoryResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int
        message:String,
        data: [SupplierLog]
    }
    extend type Query {
        getAllEventSupplierManagement(data: EventSupplierManagementFindInput): AllEventSupplierManagementResponse,
        getAllEventSupplierManagementForApp(data: EventSupplierManagementFindInput): AllEventSupplierManagementResponse,
        getEventSupplierById(data: EventSupplierByIdFindInput): EventSupplierByIdResponse,
        getSupplierStatusCounting(data: EventTaskFindInput) : AllSupplierStatusCountingResponse,
        acceptOrRejectSupplierUserList(data: acceptOrRejectSupplierUserInput) : AllAcceptOrRejectSupplierUserListResponse,
        getSupplierLogHistory(data: acceptOrRejectSupplierUserInput) : SupplierAllLogHistoryResponse
    }
    extend type Mutation {
        createEventSupplierManagement(data: EventSupplierManagementInput): InsetEventSupplierManagementResponse,
        updateEventSupplierManagement(data: UpdateEventSupplierManagement): UpdateEventSupplierManagementResponse,
        updateEventSupplierManagementQuantity(data: UpdateEventSupplierManagement): UpdateEventSupplierManagementResponse,
        deleteEventSupplierManagement(data: EventSupplierInput): DeleteEventSupplierManagementResponse,
        assignSupplierMembers(data: assignSupplierMembersInput) : InsertAssignMembersInput,
        deleteAssignSupplierMembers(data: deletedSupplierInput): DeleteAssignMemberResponse,
        acceptOrRejectSupplierManagement(data: userToSupplierManagementInput) : GeneralResponse,
        selfVolunteerSupplier(data: selfVolunteerSupplierInput) : GeneralResponse,
        adminQuantityStatusChange(data: quantityStatusInput): GeneralResponse
    }
    `
}