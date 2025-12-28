module.exports = function (gql) {
    return gql`
    type Images {
        id: String,
        eventName: String,
        uploadedImage: String,
        imageDeadLine: String,
        imageApprove: Boolean,
        imageStatus: Boolean,
        uploadedBy: String,
        profileImage: String,
        phoneNumber: String,
        logoImage: String,
        createdAt: String,
    }
    type EventMemoryDetails {
        eventName: String,
        yearOfUpload: String,
        images : [Images]
    }
    type AllUploadedImage {
        total : Int,
        from:Int,
        to:Int
        images : [Images]
    }
    type OrgUploadedImage {
        total : Int,
        from:Int,
        to:Int
        events : [EventMemoryDetails]
    }
    type ImageCounting {
        totalPhoto : Int,
        approvedPhoto : Int,
        rejectedPhoto : Int,
        uploadedThisWeek : Int,
        uploadedThisMonth : Int,
        activePhoto : Int
    }
    input uploadImageInput {
        communityId : String,
        eventId: String,
        uploadedImage: String,
        imageDeadLine: String,
        imageApprove: Boolean,
        imageStatus: Boolean,
        isAppPortal:Boolean
    }
    input eventMemoryInput {
        communityId : String,
        eventId: String,
        userId: String,
        eventName: String,
        imageApprove: Boolean,
        imageStatus: Boolean,
        uploadedBy: String,
        fromDate: String,
        toDate: String,
        page: Int,
        isAppPortal: Boolean
    }
    input orgEventMemoryInput {
        communityId : String,
        startDate: String
        endDate: String
        page: Int,
    }
    input acceptOrRejectImageInput {
        imageId: String,
        imageApprove: Boolean,
        imageRejecte: Boolean,
    }
    input imageStatusInput {
        imageId: String,
    }
    input uploadImageListCountingInput {
        eventId: String
    }
    input deleteImageInput {
        imageId:String,
        isAppPortal:Boolean
    }
    type InsertUploadImageResponse implements Response {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: Id
    }
    type AllUploadedImageResponse implements Response {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: AllUploadedImage
    }
    type OrgUploadedImageResponse implements Response {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: OrgUploadedImage
    }
    type AllImageCountingResponse implements Response {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: ImageCounting
    }
    extend type Query {
        getAllUploadImage (data: eventMemoryInput) : AllUploadedImageResponse,
        getAllUploadedUserImage (data: eventMemoryInput) : AllUploadedImageResponse
        orgImageListEventWise (data: orgEventMemoryInput) : OrgUploadedImageResponse,
        orgImageListDateWise (data: orgEventMemoryInput) : OrgUploadedImageResponse,
        getUploadImageListCounting (data: uploadImageListCountingInput) : AllImageCountingResponse
    }
    extend type Mutation {
        uploadImage (data: uploadImageInput) : InsertUploadImageResponse,
        approveOrRejectImage (data: acceptOrRejectImageInput) : GeneralResponse,
        imageStatusChange(data: imageStatusInput): GeneralResponse,
        deleteImage(data: deleteImageInput): GeneralResponse,
    }
    `
}