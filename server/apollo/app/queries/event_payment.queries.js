module.exports = function(gql) {
    return gql `
    type details {
        packageId:String,
        number: Int
    }
    type PaymentDetail {
        paymentStatus: Boolean,
        currency: String,
        amount: Int,
        transactionAmount : Int,
        gatewayChargeCost :Int,
        actualPaymentmtount : Int,
        paymentMode: ModeType,
        rsvpStatus: String,
        cardNo: String,
        checkNo : String,
        transactionId: String,
        description: String,
        packageDetails: [details]
        userId: String,
        userName: String,
        userEmail: String,
        profileImage: String,
        phCode:String,
        phoneNumber: String,
        name: String
        email: String,
        phone: String,
        phoneCode: String,
        memberType:String,
        createdAt: String,
    }
    type EventPayment {
        id: String,
        userId: String,
        name: String
        email: String,
        phone: String,
        phoneCode: String,
        userName: String
        userEmail: String,
        userPhone: String,
        userPhoneCode: String,
        memberType:String,
        createdAt: String,
        amount: Int,
        currency: String,
        noOfAttendees: Int,
        paymentMode: String,
        accessPlatfrom: String,
        transactionId: String,
        rsvpStatus: String,
        checkIn: Boolean,
    }
    type AllEventPayment {
        total : Int,
        from:Int,
        to:Int
        payment : [EventPayment]

    }
    type EventPaymentById {
        id : String,
        amount: Int,
        paymentMode: String,
        currency: String,
        paymentStatus: String,
        transactionId: String,
        cardNo: String,
        accountNo: String
    }
    type EventPaymentData {
        id : String,
        rsvpStatus: String,
    }
    input DeleteEventPaymentInput {
        paymentId:String,
    }
    input PaymentDetails {
        paymentStatus: Boolean,
        transactionAmount : Int,
        gatewayChargeCost :Int,
        actualPaymentmtount : Int,
        paymentMode: ModeType,
        checkNo : String,
        transactionId: String,
        donationAmount: Int
        concessionAmount: Int
        description: String,
        accessPlatfrom: String
    }
    input EventPaymentUpdateInput {
        paymentId:String,
        rsvpStatus:String,
        paymentDetails: PaymentDetails,
    }
    input EventPaymentFindInput {
        eventId:String,
        search:String,
        idFilter:String,
        accessPlatfrom: String,
        page: Int
    }
    input EventPaymentByIdFindInput {
        paymentId:String
    }
    input EventPaymentByIdAppFindInput {
        eventId:String
        isAppPortal:Boolean
    }
    input CheckInUpdateInput {
        paymentId:String
    }
    type AllEventPaymentResponse implements Response {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: AllEventPayment
    }
    type EventPaymentByIdResponse implements Response {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: PaymentDetail
    }
    type DeleteEventPaymentResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String
    }
    type EventPaymentUpdateResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String
        data: EventPaymentData
    }
    extend type Query {
        getAllEventPayment(data: EventPaymentFindInput): AllEventPaymentResponse,
        getEventPaymentById(data: EventPaymentByIdFindInput): EventPaymentByIdResponse,
        getEventPaymentByIdApp(data: EventPaymentByIdAppFindInput): EventPaymentByIdResponse,
    }
    extend type Mutation {
        updateEventPayment(data: EventPaymentUpdateInput): EventPaymentUpdateResponse
        deleteEventPayment(data: DeleteEventPaymentInput): DeleteEventPaymentResponse,
        updateCheckIn(data: CheckInUpdateInput): GeneralResponse
    }
    `
}