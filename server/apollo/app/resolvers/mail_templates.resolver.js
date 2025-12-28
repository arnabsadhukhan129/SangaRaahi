const Services = require("../services");

module.exports = {
    Query : {
        async getAllMailtemplates(root,args,context,info){
            try {
                const result = await Services.MailTemplates.getAllMailtemplates(args.data);
                // Map fields to match the expected response
                const mailTemplates = result.data.map(template => ({
                    id: template._id,
                    communityId: template.community_id,
                    eventId: template.event_id,
                    eventName: template.eventName,
                    mailTitle: template.mail_title,
                    mailTemplateName: template.mail_template_name,
                    mailHeader: template.mail_header,
                    bannerImage: template.banner_image,
                    description: template.description,
                    eventLink: template.event_link,
                    contactType: template.contact_type,
                    status: template.status,
                    createdAt: template.created_at
                }));
                const mailtemplatedata = {
                    total: result.total,
                    from: result.from,
                    to: result.to,
                    mailTemplates: mailTemplates
                };
                return Lib.resSuccess(mailtemplatedata);
            } catch (error) {
                return {
                    error: true,
                    code: 500,
                    systemCode: 'RESOLVER_ERROR',
                    message: error.message,
                    data: null
                };
            }
        },
        async getMailTemplateById(root, args, context, info) {
            try {
                const result = await Services.MailTemplates.getMailTemplateById(args.data);
                // console.log(result, "result..................");
                if (!result.error) {
                    return {
                        error: false,
                        code: 200,
                        systemCode: 'SUCCESS',
                        message: 'Mail template found',
                        data: {
                            mailtemplatesId: {
                                id: result.data.id,
                                communityId: result.data.community_id,
                                eventName: result.data.eventName,
                                eventId: result.data.event_id,
                                mailTitle: result.data.mail_title,
                                mailTemplateName: result.data.mail_template_name,
                                mailHeader: result.data.mail_header,
                                bannerImage: result.data.banner_image,
                                description: result.data.description,
                                eventLink: result.data.event_link,
                                contactType: result.data.contact_type,
                                status: result.data.status,
                                createdAt: result.data.created_at
                            }
                        }
                    };
                } else {
                    // Handle error response
                    return {
                        error: true,
                        code: result.code || 500,
                        systemCode: result.systemCode || 'ERROR',
                        message: result.message || 'An error occurred',
                        data: null
                    };
                }
            } catch (error) {
                console.error("Error in resolver:", error);
                return {
                    error: true,
                    code: 500,
                    systemCode: 'RESOLVER_ERROR',
                    message: error.message,
                    data: null
                };
            }
        },
               
    },
    Mutation: {
        async createMailTemplates(root, args, context, info) {
            try {
                const result = await Services.MailTemplates.createMailTemplates(args.data);
                if (result.error) {
                    throw new Error(result.message);
                }
                return {
                    error: false,
                    code: 200,
                    systemCode: 'SUCCESS',
                    message: 'generalSuccess',
                    data: result.data
                };
            } catch (error) {
                console.error(error);
                return {
                    error: true,
                    code: 500,
                    systemCode: 'INTERNAL_SERVER_ERROR',
                    message: 'An internal server error occurred',
                    data: null
                };
            }
        },
        async updateMailTemplates (root,args,context,info){
            // const id = args.data.blogId;
            const result = await Services.MailTemplates.updateMailTemplates(args.data);
            return Lib.sendResponse(result);
        },
        async deleteMailTemplates(root, args, context, info){
            const id = args.data.mailtemplateId;
            const result = await Services.MailTemplates.deleteMailTemplates(id);
            return Lib.sendResponse(result);
        },
        async sendMailToMaillists(root, args, context, info){
            try {
              const mailtemplateId = args.data.mailtemplateId;
              let CommunityId;
              const userCommunityPortal = await Services.UserService.getUserCommunityPortalDetails(
                context.getAuthUserInfo(),
                CommunityId
              );
              if (userCommunityPortal.error) {
                return Lib.sendResponse(userCommunityPortal);
              }
            //   console.log(userCommunityPortal,"userCommunityPortal..................");
              const communityId = userCommunityPortal.data.community._id;
              console.log(communityId,"communityId..................");
              // Query the service to get the maillists for the given communityId
              const result = await Services.MailTemplates.sendMailToMaillists(mailtemplateId,communityId);
              return Lib.sendResponse(result);
            } catch (error) {
              console.error('Error in resolver:', error);
              throw new Error('Failed to fetch result');
            }
          },
    }
}