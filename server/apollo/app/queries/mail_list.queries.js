module.exports = function (gql) {
    return gql`
    type MailList {
        id: String
        communityId:String
        contactEmail:String
        contactName:String
        phoneCode:String
        phoneNo:String
        contactType:String,
        isDeleted:Boolean
        createdAt:String
    }
    type AllMailList {
        total : Int,
        from : Int,
        to: Int,
        mailList: [MailList]
    }
    type getMailListById {
        mailListId: MailList
    }
    input MailFindinpt {
    communityId: String
    page:Int
    search:String
    columnName: String,
    sort: String,
    }
    input MailFindinputById {
    mailId:String
    }
    type AllMaillistResponse implements Response {
        error : Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: AllMailList
    }
    type mailListByIdresponse implements Response {
        error : Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: getMailListById
    }
    type DeleteMailListResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String
    }
    extend type Query {
        getAllMailList(data:MailFindinpt) : AllMaillistResponse
        getAllMailListLogs(data:MailFindinpt) : AllMaillistResponse
        getMailListByID(data:MailFindinputById) : mailListByIdresponse
    }
    extend type Mutation {
        deleteMailList(data: MailFindinputById): DeleteMailListResponse
    }
    `
}