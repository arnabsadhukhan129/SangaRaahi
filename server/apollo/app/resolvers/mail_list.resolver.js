const Services = require("../services");

module.exports = {
    Query: {
        async getAllMailList(root, args, context, info) {
            try {
                const result = await Services.MailListService.getAllMailList(args.data);
                return {
                    error: false,
                    code: 200,
                    systemCode: "SUCCESS",
                    message: "generalSuccess",
                    data: {
                        total: result.total,
                        from: result.from,
                        to: result.to,
                        mailList: result.data.map(item => ({
                            id: item._id,
                            communityId: item.community_id,
                            contactEmail: item.contact_email,
                            contactName: item.contact_name,
                            phoneCode: item.phone_code,
                            phoneNo: item.phone_no,
                            contactType: item.contact_type,
                            isDeleted: item.is_deleted,
                            createdAt: item.created_at
                        }))
                    }
                };
            } catch (error) {
                return {
                    error: true,
                    code: 500,
                    systemCode: "RESOLVER_ERROR",
                    message: error.message,
                    daat: null
                };
            }
        },
        async getAllMailListLogs(root, args, context, info) {
            try {
                const result = await Services.MailListService.getAllMailListLogs(args.data);
                return {
                    error: false,
                    code: 200,
                    systemCode: "SUCCESS",
                    message: "generalSuccess",
                    data: {
                        total: result.total,
                        from: result.from,
                        to: result.to,
                        mailList: result.data.map(item => {
                            return {
                                id: item._id,
                                communityId: item.community_id,
                                contactEmail: item.contact_email,
                                contactName: item.contact_name,
                                phoneCode: item.phone_code,
                                phoneNo: item.phone_no,
                                createdAt: item.created_at
                            }
                        })
                    }
                };
            } catch (error) {
                return {
                    error: true,
                    code: 500,
                    systemCode: "RESOLVER_ERROR",
                    message: error.message,
                    daat: null
                };
            }
        },
        async getMailListByID(root, args, context, info) {
            try {
                const result = await Services.MailListService.getMailListByID(args.data);
                if (!result.error) {
                    return {
                        error: false,
                        code: 200,
                        systemCode: 'SUCCESS',
                        message: 'Mail list found',
                        data: {
                            mailListId: result.data
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
        async deleteMailList (root,args,context,info) {
            const id = args.data.mailId;
            const result = await Services.MailListService.deleteMailList(id);
            return Lib.sendResponse(result);
        }
    }
}