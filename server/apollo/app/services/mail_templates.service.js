const Communities = Lib.Model('Communities');
const Events = Lib.Model('Events');
const MailTemplates = Lib.Model('MailTemplate');
const MailList = Lib.Model('MailList');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const ErrorModules = require('../errors');
const notificationServices = require('./notification.service');

module.exports = {
    //Query
    getAllMailtemplates: async (data) => {
        const search = data.search;
        const page = data.page || 1;
        const limit = data.limit || 10;
        const status = data.status;
        const communityId = data.communityId;
        let sortObject = {};
        let key = "created_at";
        let sort = -1;
        if (data && data.columnName && data.sort) {
            if (data.columnName === 'TemplateName') {
                key = 'mail_template_name';
            }
            if (data.sort === 'asc') {
                sort = 1; //sort a to z
            } else if (data.sort === 'desc') {
                sort = -1; //sort z to a
            }
        }
        sortObject[key] = sort;
        let filter = { is_deleted: false };
        if (communityId) filter.community_id = ObjectId(communityId);
        if (search) filter.mail_template_name = new RegExp(search, 'i');
        if (status !== undefined) filter.status = status;

        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: "sr_events",
                    localField: "event_id",
                    foreignField: "_id",
                    as: "eventDetails"
                }
            },
            {
                '$lookup': {
                    'from': 'sr_communities',
                    'localField': 'community_id',
                    'foreignField': '_id',
                    'as': 'community'
                }
            },
            {
                $addFields: {
                    eventName: {
                        $arrayElemAt: ['$eventDetails.title', 0]
                    }
                },
            },
            {
                $project: {
                    community_id: 1,
                    event_id: 1,
                    eventName: 1,
                    mail_title: 1,
                    mail_template_name: 1,
                    mail_header: 1,
                    banner_image: 1,
                    description: 1,
                    event_link: 1,
                    contact_type: 1,
                    status: 1,
                    is_deleted: 1,
                    created_at: {
                        $dateToString: {
                            format: '%Y-%m-%dT%H:%M:%S.%LZ',
                            date: '$created_at'
                        }
                    },
                }
            },
            { $sort: { created_at: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];
        try {
            const mailtemplates = await MailTemplates.aggregate(pipeline).collation({ 'locale': 'en' }).sort(sortObject);
            // console.log(mailtemplates,"mailtemplates...................");
            const total = await MailTemplates.countDocuments(filter);
            // Calculate the "from" and "to" values based on page and limit
            const from = (page - 1) * limit + 1;
            const to = Math.min(page * limit, total);
            return {
                error: false,
                message: "generalSuccess",
                total: total,
                from: from,
                to: to,
                data: mailtemplates
            };
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_FETCHING_TASKS',
                message: error.message,
                data: null
            };
        }
    },
    getMailTemplateById: async (data) => {
        const id = data.mailtemplateId;

        try {
            const mailTemplate = await MailTemplates.findOne({ _id: ObjectId(id), is_deleted: false });

            if (!mailTemplate) {
                throw new ErrorModules.Api404Error("Mail template not found");
            }

            // Fetch event details
            const eventDetails = await Events.findOne({ _id: mailTemplate.event_id });

            const mailTemplateData = {
                id: mailTemplate._id,
                community_id: mailTemplate.community_id,
                event_id: mailTemplate.event_id,
                eventName: eventDetails ? eventDetails.title : '',
                mail_title: mailTemplate.mail_title,
                mail_template_name: mailTemplate.mail_template_name,
                mail_header: mailTemplate.mail_header,
                banner_image: mailTemplate.banner_image,
                description: mailTemplate.description,
                event_link: mailTemplate.event_link,
                contact_type: mailTemplate.contact_type,
                status: mailTemplate.status,
                created_at: mailTemplate.created_at ? new Date(mailTemplate.created_at).toISOString() : null
            };
            return {
                error: false,
                code: 200,
                systemCode: 'SUCCESS',
                message: 'Mail Template found',
                data: mailTemplateData
            };
        } catch (error) {
            console.error("Error fetching mail Template:", error);
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_FETCHING_MAIL_LIST',
                message: error.message,
                data: null
            };
        }
    },

    //Mutation
    createMailTemplates: async (data) => {
        try {
            const community = await Communities.findById(data.communityId);
            if (!community) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'COMMUNITY_NOT_FOUND',
                    message: 'Community Not Found'
                }
            }
            const event = await Events.findOne({
                _id: ObjectId(data.eventId),
                is_deleted: false,
                is_cacelled: false
            });
            if (!event) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'Event_Not_Found',
                    message: 'Event not found'
                }
            };
            const mailtemplate = new MailTemplates({
                community_id: ObjectId(data.communityId),
                event_id: ObjectId(data.eventId),
                mail_title: data.mailTitle,
                mail_template_name: data.mailTemplateName,
                mail_header: data.mailHeader,
                banner_image: data.bannerImage,
                description: data.description,
                event_link: data.eventLink,
                status: data.status,
                created_at: data.createdAt ? new Date(data.createdAt) : new Date()
            });
            const savemailtemplate = await mailtemplate.save();
            // console.log(savemailtemplate,"savemailtemplate.................");

            return {
                error: false,
                code: 200,
                systemCode: 'MAIL_TEMPLATE_CREATED_SUCCESSFULL',
                data: savemailtemplate
            };
        } catch (error) {
            // console.log(error,"error............");
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_CREATED_MAIL_TEMPLATE',
                data: null
            }
        }

    },
    updateMailTemplates: async (data) => {
        try {
            // Create an updates object to hold the changes
            const updates = {};

            if (data.mailTitle) updates.mail_title = data.mailTitle;
            if (data.mailTemplateName) updates.mail_template_name = data.mailTemplateName;
            if (data.mailHeader) updates.mail_header = data.mailHeader;
            if (data.bannerImage) updates.banner_image = data.bannerImage;
            if (data.description) updates.description = data.description;
            if (data.eventLink) updates.event_link = data.eventLink;
            if (data.status !== undefined) updates.status = data.status;
            if (data.createdAt) updates.created_at = new Date(data.createdAt);

            // Update the blog with the provided ID using the updates object
            const updatedMailTemplets = await MailTemplates.findOneAndUpdate(
                { _id: ObjectId(data.mailtemplateId), is_deleted: false },
                { $set: updates },
                { new: true }
            );
            if (!updatedMailTemplets) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'MailTemplets_NOT_FOUND',
                    message: 'MailTemplets not found or not updated',
                    data: null
                };
            }

            // Return the successful response
            return {
                error: false,
                code: 200,
                systemCode: 'MailTemplets_UPDATED_SUCCESSFULLY',
                message: 'MailTemplets updated successfully',
                data: updatedMailTemplets
            };

        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_UPDATING_MAILTEMPLETS',
                message: error.message,
                data: null
            };
        }
    },
    deleteMailTemplates: async (id) => {
        try {
            const MailTemplateObj = {
                "is_deleted": true
            }
            let updateMailTemplate = await MailTemplates.findOneAndUpdate({ _id: ObjectId(id) }, { "$set": MailTemplateObj });
            return ({ error: false, message: "generalSuccess", data: updateMailTemplate });

        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Mail Template find error");
        }
    },
    sendMailToMaillists: async (mailtemplateId, CommunityId) => {
        try {
            const mailTemplate = await MailTemplates.findOne({ _id: ObjectId(mailtemplateId), is_deleted: false });

            if (!mailTemplate) {
                throw new ErrorModules.Api404Error("Mail template not found");
            }
            // Fetch event details
            const eventDetails = await Events.findOne({ _id: mailTemplate.event_id });
            const mailTemplateData = {
                id: mailTemplate._id,
                community_id: mailTemplate.community_id,
                event_id: mailTemplate.event_id,
                eventName: eventDetails ? eventDetails.title : '',
                mail_title: mailTemplate.mail_title,
                mail_template_name: mailTemplate.mail_template_name,
                mail_header: mailTemplate.mail_header,
                banner_image: mailTemplate.banner_image,
                description: mailTemplate.description,
                event_link: mailTemplate.event_link,
                contact_type: mailTemplate.contact_type,
                status: mailTemplate.status,
                created_at: mailTemplate.created_at ? new Date(mailTemplate.created_at).toISOString() : null
            };
            const eventName = mailTemplateData.eventName;
            const mailTitle = mailTemplateData.mail_title;
            const mailTemplateName = mailTemplateData.mail_template_name;
            const mailHeader = mailTemplateData.mail_header;
            const description = mailTemplateData.description;
            const eventLink = mailTemplateData.event_link;
            const contactType = mailTemplateData.contact_type;
            const status = mailTemplateData.status;

            const userData = await MailList.find({ community_id: ObjectId(CommunityId), is_deleted: false });

            if (!userData) {
                throw new ErrorModules.Api404Error("User not found");
            }
            // Send test email to each user
            const emailPromises = userData.map(async user => {
                const userEmail = user.contact_email;
                const userName = user.contact_name;
                const body = `<p>${description}</p>`;
                const mail_object_user = {
                    to: userEmail,
                    subject: mailHeader,
                    html: body,
                };
                try {
                    const mailResponseUser = await notificationServices.sendMail(mail_object_user);
                    if (mailResponseUser.status === false) {
                        console.error('Mail send error:', mailResponseUser.err);
                    } else {
                        console.log('Test email sent successfully to:', userEmail);
                    }
                } catch (error) {
                    console.error('Error sending test email to', userEmail, ':', error);
                }
            });

            // Wait for all emails to be sent before completing the resolver
            await Promise.all(emailPromises);
            // Update mail template status to "Published"
            await MailTemplates.updateOne({ _id: ObjectId(mailtemplateId) }, { $set: { status: 'Published' } });
            return {
                error: false,
                message: "Mail sent successfully",
            };
            // Return relevant data or success indicator
            // return { success: true, message: 'Test emails sent successfully' };
        } catch (error) {
            console.error('Error in sendMailToMaillists resolver:', error);
            throw new Error('Failed to send test emails');
        }
    }
}