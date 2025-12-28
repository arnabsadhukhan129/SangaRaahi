const Events = Lib.Model('Events');
const User = Lib.Model('Users');
const Communities = Lib.Model('Communities');
const CommunitySettings = Lib.Model('CommunitySettings');
const CronJob = Lib.Model('Cronjob');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const ErrorModules = require('../errors');
const notificationServices = require('./notification.service');
const helperService = require('./helper.service');
const ActivityLogService = require('./activity_log.service')

module.exports = {
    // Query
    getCronByEvent: async (data) => {
        const eventId = data.eventId;
        const page = data.page || 1;
        const limit = data.limit || 10;

        let filter = { is_deleted: false };
        if (eventId) filter.event_id = ObjectId(eventId);

        const pipeline = [
            {
                $match: filter,
            },
            {
                '$lookup': {
                    'from': 'sr_users',
                    'localField': 'host_id',
                    'foreignField': '_id',
                    'as': 'user'
                }
            },
            {
                $lookup: {
                    from: "sr_events",
                    localField: "event_id",
                    foreignField: "_id",
                    as: "eventData"
                }
            },
            {
                $unwind: {
                    path: "$eventData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    'path': '$user'
                }
            },
            {
                $project: {
                    _id: 1,
                    event_id: 1,
                    eventName: "$eventData.title",
                    userName: "$user.name",
                    rsvpType: "$rsvp_type",
                    notificationType: "$notification_type",
                    notificationStatus: "$notification_status",
                    notificationDate: "$notification_date",
                    notificationTime: "$notification_time",
                    emailCount: "$email_count",
                    smsCount: "$sms_count",
                    createdAt: "$created_at"
                }
            },
            { $sort: { notificationTime: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];
        try {
            const Crons = await CronJob.aggregate(pipeline).collation({ 'locale': 'en' })
            const total = await CronJob.countDocuments(filter);
            const from = (page - 1) * limit + 1;
            const to = Math.min(page * limit, total);
            return {
                error: false,
                message: "generalSuccess",
                total: total,
                from: from,
                to: to,
                data: Crons
            }
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_CREATING_CRON',
                message: error.message,
                data: null
            }
        }

    },

    // Mutation
    createEventImmediateCron: async (data, eventId, userId) => {
        try {
            // Convert input date to a proper UTC Date object
            const notificationDate = data.notificationType === 'immediate'
                ? new Date()
                : new Date(Date.UTC(
                    new Date(data.notificationDate).getUTCFullYear(),
                    new Date(data.notificationDate).getUTCMonth(),
                    new Date(data.notificationDate).getUTCDate()
                ));

            // Convert input time to a full Date object (ensuring time is properly stored)
            const notificationTime = data.notificationType === 'immediate'
                ? new Date()
                : new Date(`${data.notificationDate}T${data.notificationTime}:00.000Z`);

            const cronData = {
                host_id: userId,
                event_id: new ObjectId(eventId),
                notification_type: data.notificationType,
                notification_status: 'pending',
                notification_date: notificationDate,
                notification_time: notificationTime,
                email_count: data.emailCount,
                sms_count: data.smsCount,
                rsvp_type: data.rsvpType,
                is_deleted: false,
                is_active: true
            };
            const newCronJob = await CronJob.create(cronData);
            const event = await Events.findOne({ _id: new ObjectId(eventId) });
            const communityId = event.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(communityId) });
            const communitySettings = await CommunitySettings.findOne({ community_id: new ObjectId(community._id) });
            const { sms_settings, email_settings } = community.sms_email_global_settings;
            if (newCronJob.notification_type === "immediate") {
                if (Array.isArray(event.rsvp_admin_controll)) {
                    for (const rsvpAdminControll of event.rsvp_admin_controll) {
                        if (rsvpAdminControll.rsvp_type === "Yesrsvp") {
                            cronData.rsvp_type = "Yesrsvp";
                            cronData.notification_status = "sent"
                            await newCronJob.updateOne({ $set: { rsvp_type: "Yesrsvp", notification_status: "sent" } });
                            // for (const rsvp of event.rsvp) {
                            //     if (rsvp.status === "Attending") {
                            const yesRsvp = event.rsvp
                                .filter(rsvp => rsvp.status === "Attending")
                                .map(async (rsvp) => {
                                    const userAggregate = [
                                        {
                                            $match: {
                                                _id: ObjectId(rsvp.user_id),
                                                is_deleted: false,
                                            }
                                        },
                                        {
                                            $project: {
                                                name: "$name",
                                                email: "$contact.email.address",
                                                phone: "$contact.phone.number",
                                                phoneCode: "$contact.phone.phone_code"
                                            }
                                        }
                                    ];
                                    const user = await User.aggregate(userAggregate);
                                    // Check if the aggregation returned any results
                                    if (!user || user.length === 0) {
                                        console.error("No user found for ID:", rsvp.user_id);
                                        return;
                                    }
                                    const usersCount = user.length;
                                    await helperService.validateCreditsRemaining(community, usersCount, usersCount);

                                    const userData = user[0] || {};
                                    const userEmail = userData.email || "";
                                    const userPhone = userData.phone || "";
                                    const userphoneCode = userData.phoneCode || "";
                                    const username = userData.name || "";
                                    let to = userphoneCode + userPhone;

                                    let emailbody = `${rsvpAdminControll.email_content}<br><br> Url: <a href="https://api.sangaraahi.net/api/deep-link/${eventId}">https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;
                                    let smsbody = `${rsvpAdminControll.sms_content}<br><br> Url: <a>https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;
                                    let smsText = smsbody
                                        .replace(/<br\s*\/?>/gi, '\n')
                                        .replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, '$2 ($1)')
                                        .replace(/<\/?[^>]+(>|$)/g, '');

                                    // Send email to user
                                    let mail_object_user = {
                                        to: userEmail,
                                        subject: 'Event aleart!',
                                        html: emailbody,
                                    };
                                    let sms_object_user = {
                                        to: to,
                                        subject: 'Event aleart!',
                                        html: smsText,
                                    };

                                    // Send email and SMS concurrently
                                    const emailPromise = email_settings ? notificationServices.sendMail(mail_object_user) : Promise.resolve();
                                    const smsPromise = sms_settings ? notificationServices.sendSmsVonage(sms_object_user.to, sms_object_user.subject, sms_object_user.html) : Promise.resolve();

                                    const [emailResponse, smsResponse] = await Promise.all([emailPromise, smsPromise]);

                                    if (emailResponse && emailResponse.status === false) {
                                        console.error('Mail send error:', emailResponse.error);
                                    } else {
                                        console.log('Email sent successfully.');
                                    }

                                    if (smsResponse && smsResponse.status === false) {
                                        console.error('SMS send error:', smsResponse.error);
                                    } else {
                                        console.log('SMS sent successfully.');
                                    }
                                    // Deduct credits based on the number of users processed
                                    // if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining >= usersCount) {
                                    //     community.sms_credits_remaining -= usersCount;
                                    //     await community.save();
                                    // }

                                    // if (community.sms_email_global_settings.email_settings && community.email_credits_remaining >= usersCount) {
                                    //     community.email_credits_remaining -= usersCount;
                                    //     await community.save();
                                    // }
                                    return {
                                        usersCount,
                                    };
                                });
                            // Aggregate all user updates and then apply the credit deductions at once
                            const results = await Promise.all(yesRsvp);

                            // Calculate the total number of users to deduct credits
                            const totalUsersCount = results.reduce((sum, result) => sum + result.usersCount, 0);

                            // Deduct credits for all users processed at once
                            if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining >= totalUsersCount) {
                                community.sms_credits_remaining -= totalUsersCount;
                            }

                            if (community.sms_email_global_settings.email_settings && community.email_credits_remaining >= totalUsersCount) {
                                community.email_credits_remaining -= totalUsersCount;
                            }

                            // Save community document after all credits have been deducted
                            await community.save();

                            // Wait for all notifications to be sent
                            await Promise.all(yesRsvp);
                            if (email_settings) {
                                await newCronJob.updateOne({ $set: { email_count: totalUsersCount } });
                            }
                            if (sms_settings) {
                                await newCronJob.updateOne({ $set: { sms_count: totalUsersCount } });
                            }
                        } else if (rsvpAdminControll.rsvp_type === "Norsvp") {
                            cronData.rsvp_type = "Norsvp";
                            cronData.notification_status = "sent"
                            await newCronJob.updateOne({ $set: { rsvp_type: "Norsvp", notification_status: "sent" } });
                            // for (const rsvp of event.rsvp) {
                            //     if (rsvp.status === "No_Reply") {
                            const noRsvp = event.rsvp
                                .filter(rsvp => rsvp.status === "No_Reply")
                                .map(async (rsvp) => {
                                    const userAggregate = [
                                        {
                                            $match: {
                                                _id: ObjectId(rsvp.user_id),
                                                is_deleted: false,
                                            }
                                        },
                                        {
                                            $project: {
                                                name: "$name",
                                                email: "$contact.email.address",
                                                phone: "$contact.phone.number",
                                                phoneCode: "$contact.phone.phone_code"
                                            }
                                        }
                                    ];
                                    const user = await User.aggregate(userAggregate);
                                    if (!user) {
                                        throw new ErrorModules.Api404Error("User not found");
                                    }
                                    // User count who not attend
                                    const usersCount = user.length;
                                    await helperService.validateCreditsRemaining(community, usersCount, usersCount);

                                    const userData = user[0] || {};
                                    const userEmail = userData.email || "";
                                    const userPhone = userData.phone || "";
                                    const userphoneCode = userData.phoneCode || "";
                                    const username = userData.name || "";

                                    let to = userphoneCode + userPhone;

                                    let emailbody = `${rsvpAdminControll.email_content}<br><br> Url: <a href="https://api.sangaraahi.net/api/deep-link/${eventId}">https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;
                                    let smsbody = `${rsvpAdminControll.sms_content}<br><br> Url: <a>https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;
                                    let smsText = smsbody
                                        .replace(/<br\s*\/?>/gi, '\n')
                                        .replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, '$2 ($1)')
                                        .replace(/<\/?[^>]+(>|$)/g, '');

                                    // Send email to user
                                    let mail_object_user = {
                                        to: userEmail,
                                        subject: 'Event aleart!',
                                        html: emailbody,
                                    };
                                    let sms_object_user = {
                                        to: to,
                                        subject: 'Event aleart!',
                                        html: smsText,
                                    };

                                    // Send email and SMS concurrently
                                    const emailPromise = email_settings ? notificationServices.sendMail(mail_object_user) : Promise.resolve();
                                    const smsPromise = sms_settings ? notificationServices.sendSmsVonage(sms_object_user.to, sms_object_user.subject, sms_object_user.html) : Promise.resolve();

                                    const [emailResponse, smsResponse] = await Promise.all([emailPromise, smsPromise]);

                                    if (emailResponse && emailResponse.status === false) {
                                        console.error('Mail send error:', emailResponse.error);
                                    } else {
                                        console.log('Email sent successfully.');
                                    }

                                    if (smsResponse && smsResponse.status === false) {
                                        console.error('SMS send error:', smsResponse.error);
                                    } else {
                                        console.log('SMS sent successfully.');
                                    }
                                    // Deduct credits based on the number of users processed
                                    // if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining >= usersCount) {
                                    //     community.sms_credits_remaining -= usersCount;
                                    //     await community.save();
                                    // }

                                    // if (community.sms_email_global_settings.email_settings && community.email_credits_remaining >= usersCount) {
                                    //     community.email_credits_remaining -= usersCount;
                                    //     await community.save();
                                    // }
                                    // Deduct credits for each user after processing all users
                                    return {
                                        usersCount,
                                    };
                                });
                            // Aggregate all user updates and then apply the credit deductions at once
                            const results = await Promise.all(noRsvp);

                            // Calculate the total number of users to deduct credits
                            const totalUsersCount = results.reduce((sum, result) => sum + result.usersCount, 0);

                            // Deduct credits for all users processed at once
                            if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining >= totalUsersCount) {
                                community.sms_credits_remaining -= totalUsersCount;
                            }

                            if (community.sms_email_global_settings.email_settings && community.email_credits_remaining >= totalUsersCount) {
                                community.email_credits_remaining -= totalUsersCount;
                            }

                            // Save community document after all credits have been deducted
                            await community.save();

                            // Wait for all notifications to be sent
                            await Promise.all(noRsvp);
                            if (email_settings) {
                                await newCronJob.updateOne({ $set: { email_count: totalUsersCount } });
                            }
                            if (sms_settings) {
                                await newCronJob.updateOne({ $set: { sms_count: totalUsersCount } });
                            }
                        } else if (rsvpAdminControll.rsvp_type === "Not_Attending") {
                            cronData.rsvp_type = "Not_Attending";
                            cronData.notification_status = "sent"
                            await newCronJob.updateOne({ $set: { rsvp_type: "Not_Attending", notification_status: "sent" } });
                            for (const rsvp of event.rsvp) {
                                if (rsvp.status === "Not_Attending") {
                                    const userAggregate = [
                                        {
                                            $match: {
                                                _id: ObjectId(rsvp.user_id),
                                                is_deleted: false,
                                            }
                                        },
                                        {
                                            $project: {
                                                name: "$name",
                                                email: "$contact.email.address",
                                                phone: "$contact.phone.number",
                                                phoneCode: "$contact.phone.phone_code"
                                            }
                                        }
                                    ];
                                    const user = await User.aggregate(userAggregate);
                                    if (!user) {
                                        throw new ErrorModules.Api404Error("User not found");
                                    }
                                    // User count who not attend
                                    const usersCount = user.length;
                                    await helperService.validateCreditsRemaining(community, usersCount, usersCount);

                                    const userEmail = user[0].email;
                                    const userPhone = user[0].phone;
                                    const userphoneCode = user[0].phoneCode;
                                    const username = user[0].name;
                                    let to = userphoneCode + userPhone;

                                    let emailbody = `${rsvpAdminControll.email_content}<br><br> Url: <a href="https://api.sangaraahi.net/api/deep-link/${eventId}">https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;
                                    let smsbody = `${rsvpAdminControll.sms_content}<br><br> Url: <a>https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;
                                    let smsText = smsbody
                                        .replace(/<br\s*\/?>/gi, '\n')
                                        .replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, '$2 ($1)')
                                        .replace(/<\/?[^>]+(>|$)/g, '');

                                    // Send email to user
                                    let mail_object_user = {
                                        to: userEmail,
                                        subject: 'Event aleart!',
                                        html: emailbody,
                                    };
                                    let sms_object_user = {
                                        to: to,
                                        subject: 'Event aleart!',
                                        html: smsText,
                                    };

                                    if (email_settings) {
                                        const mailResponseUser = await notificationServices.sendMail(mail_object_user);
                                        if (mailResponseUser.status === false) {
                                            console.error('Mail send error:', mailResponseUser.error);
                                        } else {
                                            console.log('Email sent successfully.');
                                        }
                                    }
                                    if (sms_settings) {
                                        const smsResponseUser = await notificationServices.sendSmsVonage(
                                            sms_object_user.to,
                                            sms_object_user.subject,
                                            sms_object_user.html
                                        );
                                        if (smsResponseUser.status === false) {
                                            console.error('SMS send error:', smsResponseUser.error);
                                        } else {
                                            console.log('SMS sent successfully.');
                                        }
                                    }
                                    // Deduct credits based on the number of users processed
                                    if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining >= usersCount) {
                                        community.sms_credits_remaining -= usersCount;
                                        await community.save();
                                    }

                                    if (community.sms_email_global_settings.email_settings && community.email_credits_remaining >= usersCount) {
                                        community.email_credits_remaining -= usersCount;
                                        await community.save();
                                    }
                                    if (email_settings) {
                                        await newCronJob.updateOne({ $set: { email_count: usersCount } });
                                    }
                                    if (sms_settings) {
                                        await newCronJob.updateOne({ $set: { sms_count: usersCount } });
                                    }
                                }
                            };
                        } else if (rsvpAdminControll.rsvp_type === "tentative") {
                            cronData.rsvp_type = "tentative";
                            cronData.notification_status = "sent"
                            await newCronJob.updateOne({ $set: { rsvp_type: "tentative", notification_status: "sent" } });
                            for (const rsvp of event.rsvp) {
                                if (rsvp.status === "Maybe") {
                                    const userAggregate = [
                                        {
                                            $match: {
                                                _id: ObjectId(rsvp.user_id),
                                                is_deleted: false,
                                            }
                                        },
                                        {
                                            $project: {
                                                name: "$name",
                                                email: "$contact.email.address",
                                                phone: "$contact.phone.number",
                                                phoneCode: "$contact.phone.phone_code"
                                            }
                                        }
                                    ];
                                    const user = await User.aggregate(userAggregate);
                                    if (!user) {
                                        throw new ErrorModules.Api404Error("User not found");
                                    }
                                    // User count who not attend
                                    const usersCount = user.length;
                                    await helperService.validateCreditsRemaining(community, usersCount, usersCount);

                                    const userEmail = user[0].email;
                                    const userPhone = user[0].phone;
                                    const userphoneCode = user[0].phoneCode;
                                    const username = user[0].name;
                                    let to = userphoneCode + userPhone;

                                    let emailbody = `${rsvpAdminControll.email_content}<br><br> Url: <a href="https://api.sangaraahi.net/api/deep-link/${eventId}">https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;
                                    let smsbody = `${rsvpAdminControll.sms_content}<br><br> Url: <a>https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;
                                    let smsText = smsbody
                                        .replace(/<br\s*\/?>/gi, '\n')
                                        .replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, '$2 ($1)')
                                        .replace(/<\/?[^>]+(>|$)/g, '');

                                    // Send email to user
                                    let mail_object_user = {
                                        to: userEmail,
                                        subject: 'Event aleart!',
                                        html: emailbody,
                                    };
                                    let sms_object_user = {
                                        to: to,
                                        subject: 'Event aleart!',
                                        html: smsText,
                                    };

                                    if (email_settings) {
                                        const mailResponseUser = await notificationServices.sendMail(mail_object_user);
                                        if (mailResponseUser.status === false) {
                                            console.error('Mail send error:', mailResponseUser.error);
                                        } else {
                                            console.log('Email sent successfully.');
                                        }
                                    }
                                    if (sms_settings) {
                                        const smsResponseUser = await notificationServices.sendSmsVonage(
                                            sms_object_user.to,
                                            sms_object_user.subject,
                                            sms_object_user.html
                                        );
                                        if (smsResponseUser.status === false) {
                                            console.error('SMS send error:', smsResponseUser.error);
                                        } else {
                                            console.log('SMS sent successfully.');
                                        }
                                    }
                                    // Deduct credits based on the number of users processed
                                    if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining >= usersCount) {
                                        community.sms_credits_remaining -= usersCount;
                                        await community.save();
                                    }

                                    if (community.sms_email_global_settings.email_settings && community.email_credits_remaining >= usersCount) {
                                        community.email_credits_remaining -= usersCount;
                                        await community.save();
                                    }
                                    if (email_settings) {
                                        await newCronJob.updateOne({ $set: { email_count: usersCount } });
                                    }
                                    if (sms_settings) {
                                        await newCronJob.updateOne({ $set: { sms_count: usersCount } });
                                    }
                                }
                            };
                        } else if (rsvpAdminControll.rsvp_type === "All") {
                            cronData.rsvp_type = "All";
                            cronData.notification_status = "sent";
                            await newCronJob.updateOne({ $set: { rsvp_type: "All", notification_status: "sent" } });

                            // Filter all relevant RSVP statuses
                            const allRsvps = event.rsvp.filter(rsvp =>
                                ["No_Reply", "Maybe", "Attending", "Not_Attending"].includes(rsvp.status)
                            );

                            // Process all users concurrently
                            const allUsersResults = await Promise.all(allRsvps.map(async (rsvp) => {
                                const userAggregate = [
                                    {
                                        $match: {
                                            _id: ObjectId(rsvp.user_id),
                                            is_deleted: false,
                                        }
                                    },
                                    {
                                        $project: {
                                            name: "$name",
                                            email: "$contact.email.address",
                                            phone: "$contact.phone.number",
                                            phoneCode: "$contact.phone.phone_code"
                                        }
                                    }
                                ];
                                const user = await User.aggregate(userAggregate);
                                if (!user || user.length === 0) {
                                    throw new ErrorModules.Api404Error("User not found");
                                }

                                const usersCount = user.length;
                                await helperService.validateCreditsRemaining(community, usersCount, usersCount);

                                const userData = user[0];
                                const to = `${userData.phoneCode}${userData.phone}`;

                                const emailbody = `${rsvpAdminControll.email_content}<br><br> Url: <a href="https://api.sangaraahi.net/api/deep-link/${eventId}">https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;
                                const smsbody = `${rsvpAdminControll.sms_content}<br><br> Url: <a>https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;

                                const smsText = smsbody
                                    .replace(/<br\s*\/?>/gi, '\n')
                                    .replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, '$2 ($1)')
                                    .replace(/<\/?[^>]+(>|$)/g, '');

                                const mail_object_user = {
                                    to: userData.email,
                                    subject: 'Event alert!',
                                    html: emailbody,
                                };
                                const sms_object_user = {
                                    to,
                                    subject: 'Event alert!',
                                    html: smsText,
                                };

                                // Send notifications concurrently
                                const emailPromise = email_settings ? notificationServices.sendMail(mail_object_user) : Promise.resolve();
                                const smsPromise = sms_settings ? notificationServices.sendSmsVonage(sms_object_user.to, sms_object_user.subject, sms_object_user.html) : Promise.resolve();
                                const [emailResponse, smsResponse] = await Promise.all([emailPromise, smsPromise]);

                                if (emailResponse && emailResponse.status === false) console.error('Mail send error:', emailResponse.error);
                                else if (email_settings) console.log('Email sent successfully.');

                                if (smsResponse && smsResponse.status === false) console.error('SMS send error:', smsResponse.error);
                                else if (sms_settings) console.log('SMS sent successfully.');

                                return { usersCount };
                            }));
                            const totalUsersCount = allUsersResults.reduce((sum, result) => sum + result.usersCount, 0);

                            if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining >= totalUsersCount) {
                                community.sms_credits_remaining -= totalUsersCount;
                            }

                            if (community.sms_email_global_settings.email_settings && community.email_credits_remaining >= totalUsersCount) {
                                community.email_credits_remaining -= totalUsersCount;
                            }

                            await community.save();

                            if (email_settings) {
                                await newCronJob.updateOne({ $set: { email_count: totalUsersCount } });
                            }
                            if (sms_settings) {
                                await newCronJob.updateOne({ $set: { sms_count: totalUsersCount } });
                            }
                        }
                    };
                }
            }
            return {
                error: false,
                code: 200,
                systemCode: "EVENT_ALERTS_UPDATED_SUCCESSFULLY",
                message: "Event alerts updated successfully",
                data: newCronJob
            }

        } catch (error) {
            console.log(error)
        }
    },
    deleteEventCron: async (id) => {
        try {
            const cronObj = {
                "is_deleted": true
            }
            let deleteCron = await CronJob.findOneAndUpdate({ _id: ObjectId(id) }, { "$set": cronObj });
            return ({ error: false, message: "generalSuccess", data: deleteCron });
        } catch (error) {
            console.log(error);
            throw new ErrorModules.DatabaseError("Cron Job find error");
        }
    }
}