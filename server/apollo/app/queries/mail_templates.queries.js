module.exports = function (gql) {
    return gql `
    type MailTemplates {
        id: String
        communityId: String,
        eventName: String
        eventId:String,
        mailTitle:String,
        mailTemplateName:String,
        mailHeader:String,
        bannerImage:String,
        description:String,
        eventLink:String,
        contactType:String,
        status:String,
        createdAt:String,
    }
    type AllMailtemplates {
        total: Int,
        from: Int,
        to: Int,
        mailTemplates: [MailTemplates]
    }
    type MailTemplatesById {
        mailtemplatesId: MailTemplates
    }
    input MailTemplateInput {
        communityId: String,
        eventId:String,
        mailTitle:String,
        mailTemplateName:String,
        mailHeader:String,
        bannerImage:String,
        description:String,
        eventLink:String,
        status:String,
        createdAt:String,
    }
    input MailTemplateFindinput {
        communityId:String,
        status:String,
        page: Int
        search: String
        columnName: String,
        sort: String,
    }
    input MailTemplateFindinputById {
        mailtemplateId:String
    }
    input UpdateMailTemplateInput {
        mailtemplateId:String,
        mailTitle:String,
        mailTemplateName:String,
        mailHeader:String,
        bannerImage:String,
        description:String,
        eventLink:String,
        status:String,
    }
    type InsertMailTemplateInputResponse implements Response {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: Id
    }
    type AllMailtemplatesResponse implements Response {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data: AllMailtemplates
    }
    type mailTemplatesByIdResponse implements Response {
        error:Boolean,
        code:Int,
        systemCode:String,
        message:String,
        data:MailTemplatesById
    }
    type DeleteMailTemplateResponse implements Response {
        error:Boolean,
        systemCode:String,
        code:Int,
        message:String
    }

    extend type Query {
        getAllMailtemplates(data: MailTemplateFindinput): AllMailtemplatesResponse,
        getMailTemplateById(data: MailTemplateFindinputById): mailTemplatesByIdResponse,
    }
    extend type Mutation {
        createMailTemplates(data: MailTemplateInput): InsertMailTemplateInputResponse,
        updateMailTemplates(data: UpdateMailTemplateInput): InsertMailTemplateInputResponse,
        deleteMailTemplates(data: MailTemplateFindinputById): DeleteMailTemplateResponse,
        sendMailToMaillists(data: MailTemplateFindinputById): GeneralResponse
    }
    `
}