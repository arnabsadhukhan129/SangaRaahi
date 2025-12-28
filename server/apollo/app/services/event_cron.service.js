const Redis = require("ioredis");
const redis = new Redis();
const Events = Lib.Model('Events');
const User = Lib.Model('Users');
const Communities = Lib.Model('Communities');
const CommunitySettings = Lib.Model('CommunitySettings');
const ActivityLogs = Lib.Model('ActivityLog');
const mongoose = require('mongoose');
const moment = require('moment');
const cron = require('node-cron');
const CronJob = Lib.Model('Cronjob');
const { ObjectId } = mongoose.Types;
const { mongoDB } = require('../database/db');
const notificationServices = require('./notification.service');
const NotificationSettings = Lib.Model('NotificationSettings');
const helperService = require('./helper.service');

// Schedule the cron job to run every 24 h
// cron.schedule('0 0 * * *', async () => {
//     try {
//         eventAggregate = [
//             {
//                 '$match': {
//                     'is_deleted': false,
//                     'main_recurring_event': false
//                 }
//             },
//             {
//                 '$lookup': {
//                     'from': 'sr_users',
//                     'localField': 'host_id',
//                     'foreignField': '_id',
//                     'as': 'user'
//                 }
//             },
//             {
//                 '$lookup': {
//                     'from': 'sr_communities',
//                     'localField': 'community_id',
//                     'foreignField': '_id',
//                     'as': 'community'
//                 }
//             },
//             {
//                 '$unwind': {
//                     'path': '$user'
//                 },
//             },
//             {
//                 '$unwind': {
//                     'path': '$community'
//                 },
//             }
//         ];
//         const events = await Events.aggregate(eventAggregate).collation({ 'locale': 'en' });

//         events.forEach(async (event) => {
//             const communityId = event.community_id;
//             const eventId = event._id;
//             const community = await Communities.findOne({ _id: new ObjectId(communityId) });
//             const communitySettings = await CommunitySettings.findOne({ community_id: new ObjectId(community._id)})
//             const slug = communitySettings.slug;
//             const { sms_settings, email_settings } = community.sms_email_global_settings;
//             if (event.remain && event.rsvp_end_time && moment().isBefore(event.rsvp_end_time) && moment().diff(event.rsvp_end_time, 'hours') >= -24) {
//                 if (Array.isArray(event.rsvp_admin_controll)) {
//                     event.rsvp_admin_controll.forEach(async (rsvpAdminControll) => {
//                         if (rsvpAdminControll.rsvp_type === "Yesrsvp") {
//                             event.rsvp.forEach(async (rsvp) => {

//                                 const userAggregate = [
//                                     {
//                                         $match: {
//                                             _id: ObjectId(rsvp.user_id),
//                                             is_deleted: false,
//                                         }
//                                     },
//                                     {
//                                         $project: {
//                                             name: "$name",
//                                             email: "$contact.email.address",
//                                             phone: "$contact.phone.number",
//                                             phoneCode: "$contact.phone.phone_code"
//                                         }
//                                     }
//                                 ];
//                                 const user = await User.aggregate(userAggregate);
//                                 // Check if the aggregation returned any results
//                                 if (!user || user.length === 0) {
//                                     console.error("No user found for ID:", rsvp.user_id);
//                                     return; // Exit early if no user is found
//                                 }
//                                 const userEmail = user[0].email;
//                                 const userPhone = user[0].phone;
//                                 const userphoneCode = user[0].phoneCode;
//                                 const username = user[0].name;
//                                 let to = userphoneCode + userPhone;

//                                 if (rsvp.status === "Attending") {
//                                     // let emailbody = `${rsvpAdminControll.email_content}<br><br> Url: <a href="https://sangaraahi.org/${slug}/EventDetails?id=${eventId}">https://sangaraahi.org/${slug}/EventDetails?id=${eventId}</a>.`;
//                                     // let smsbody = `${rsvpAdminControll.sms_content}<br><br> Url: <a href="https://sangaraahi.org/${slug}/EventDetails?id=${eventId}">https://sangaraahi.org/${slug}/EventDetails?id=${eventId}</a>.`;
//                                     let emailbody = `${rsvpAdminControll.email_content}<br><br> Url: <a href="https://api.sangaraahi.net/api/deep-link/${eventId}">https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;
//                                     let smsbody = `${rsvpAdminControll.sms_content}<br><br> Url: <a href="https://api.sangaraahi.net/api/deep-link/${eventId}">https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;


//                                     // Send email to user
//                                     let mail_object_user = {
//                                         to: userEmail,
//                                         subject: 'Event aleart!',
//                                         html: emailbody,
//                                     };
//                                     let sms_object_user = {
//                                         to: to,
//                                         subject: 'Event aleart!',
//                                         html: smsbody,
//                                     };

//                                     if (email_settings) {
//                                         const mailResponseUser = await notificationServices.sendMail(mail_object_user);
//                                         if (mailResponseUser.status === false) {
//                                             console.error('Mail send error:', mailResponseUser.error);
//                                         } else {
//                                             console.log('Email sent successfully.');
//                                         }
//                                     }
//                                     if (sms_settings) {
//                                         const smsResponseUser = await notificationServices.sendSms(sms_object_user);
//                                         if (smsResponseUser.status === false) {
//                                             console.error('SMS send error:', smsResponseUser.error);
//                                         } else {
//                                             console.log('SMS sent successfully.');
//                                         }
//                                     }
//                                 }
//                             });
//                         } else if (rsvpAdminControll.rsvp_type === "Norsvp") {
//                             event.rsvp.forEach(async (rsvp) => {
//                                 if (rsvp.status === "No_Reply" || rsvp.status === "Maybe") {
//                                     const userAggregate = [
//                                         {
//                                             $match: {
//                                                 _id: ObjectId(rsvp.user_id),
//                                                 is_deleted: false,
//                                             }
//                                         },
//                                         {
//                                             $project: {
//                                                 name: "$name",
//                                                 email: "$contact.email.address",
//                                                 phone: "$contact.phone.number",
//                                                 phoneCode: "$contact.phone.phone_code"
//                                             }
//                                         }
//                                     ];
//                                     const user = await User.aggregate(userAggregate);
//                                     if (!user) {
//                                         throw new ErrorModules.Api404Error("User not found");
//                                     }
//                                     const userEmail = user[0].email;
//                                     const userPhone = user[0].phone;
//                                     const userphoneCode = user[0].phoneCode;
//                                     const username = user[0].name;
//                                     let to = userphoneCode + userPhone;
//                                     // if (rsvp.status === "No_Reply") {
//                                     let emailbody = `${rsvpAdminControll.email_content}<br><br> Url: <a href="https://api.sangaraahi.net/api/deep-link/${eventId}">https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;
//                                     let smsbody = `${rsvpAdminControll.sms_content}<br><br> Url: <a href="https://api.sangaraahi.net/api/deep-link/${eventId}">https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;
//                                     console.log(userEmail,"userEmail...........")
//                                     // Send email to user
//                                     let mail_object_user = {
//                                         to: userEmail,
//                                         subject: 'Event aleart!',
//                                         html: emailbody,
//                                     };
//                                     let sms_object_user = {
//                                         to: to,
//                                         subject: 'Event aleart!',
//                                         html: smsbody,
//                                     };

//                                     if (email_settings) {
//                                         const mailResponseUser = await notificationServices.sendMail(mail_object_user);
//                                         if (mailResponseUser.status === false) {
//                                             console.error('Mail send error:', mailResponseUser.error);
//                                         } else {
//                                             console.log('Email sent successfully.');
//                                         }
//                                     }
//                                     if (sms_settings) {
//                                         const smsResponseUser = await notificationServices.sendSms(sms_object_user);
//                                         if (smsResponseUser.status === false) {
//                                             console.error('SMS send error:', smsResponseUser.error);
//                                         } else {
//                                             console.log('SMS sent successfully.');
//                                         }
//                                     }
//                                     // }
//                                 }
//                             });
//                         } else if (rsvpAdminControll.rsvp_type === "All") {
//                             event.rsvp.forEach(async (rsvp) => {
//                                 if (rsvp.status === "No_Reply" || rsvp.status === "Maybe" || rsvp.status === "Attending") {
//                                     const userAggregate = [
//                                         {
//                                             $match: {
//                                                 _id: ObjectId(rsvp.user_id),
//                                                 is_deleted: false,
//                                             }
//                                         },
//                                         {
//                                             $project: {
//                                                 name: "$name",
//                                                 email: "$contact.email.address",
//                                                 phone: "$contact.phone.number",
//                                                 phoneCode: "$contact.phone.phone_code"
//                                             }
//                                         }
//                                     ];
//                                     const user = await User.aggregate(userAggregate);
//                                     if (!user) {
//                                         throw new ErrorModules.Api404Error("User not found");
//                                     }
//                                     const userEmail = user[0].email;
//                                     const userPhone = user[0].phone;
//                                     const userphoneCode = user[0].phoneCode;
//                                     const username = user[0].name;
//                                     let to = userphoneCode + userPhone;

//                                     // if (rsvp.status === "Attending") {
//                                     // let emailbody = rsvpAdminControll.email_content;
//                                     // let smsbody = rsvpAdminControll.sms_content;
//                                     // const emailbody = `${rsvpAdminControll.email_content}<br><br> Url: <a href="https://sangaraahi.org/${slug}/EventDetails?id=${eventId}">https://sangaraahi.org/${slug}/EventDetails?id=${eventId}</a>.`;
//                                     // let smsbody = `${rsvpAdminControll.sms_content}<br><br> Url: <a href="https://sangaraahi.org/${slug}/EventDetails?id=${eventId}">https://sangaraahi.org/${slug}/EventDetails?id=${eventId}</a>.`;

//                                     const emailbody = `${rsvpAdminControll.email_content}<br><br> Url: <a href="https://api.sangaraahi.net/api/deep-link/${eventId}">https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;
//                                     let smsbody = `${rsvpAdminControll.sms_content}<br><br> Url: <a href="https://api.sangaraahi.net/api/deep-link/${eventId}">https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;

//                                     // Send email to user
//                                     let mail_object_user = {
//                                         to: userEmail,
//                                         subject: 'Event aleart!',
//                                         html: emailbody,
//                                     };
//                                     let sms_object_user = {
//                                         to: to,
//                                         subject: 'Event aleart!',
//                                         html: smsbody,
//                                     };
//                                     if (email_settings) {
//                                         const mailResponseUser = await notificationServices.sendMail(mail_object_user);
//                                         if (mailResponseUser.status === false) {
//                                             console.error('Mail send error:', mailResponseUser.error);
//                                         } else {
//                                             console.log('Email sent successfully.');
//                                         }
//                                     }
//                                     if (sms_settings) {
//                                         const smsResponseUser = await notificationServices.sendSms(sms_object_user);
//                                         if (smsResponseUser.status === false) {
//                                             console.error('SMS send error:', smsResponseUser.error);
//                                         } else {
//                                             console.log('SMS sent successfully.');
//                                         }
//                                     }
//                                     // }
//                                 }
//                             });
//                         }
//                     });
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('Error updating :', error);
//     }
// });

// function for schedule cron logic
async function processScheduledNotification(job, eventId) {
    try {
        const event = await Events.findOne({ _id: new ObjectId(job.event_id) });
        if (!event) return;

        const community = await Communities.findOne({ _id: new ObjectId(event.community_id) });
        const communitySettings = await CommunitySettings.findOne({ community_id: new ObjectId(community._id) });
        const { sms_settings, email_settings } = community.sms_email_global_settings;

        if (job.notification_type === "scheduled" && job.notification_status === 'pending' && job.is_deleted === false) {
            if (Array.isArray(event.rsvp_admin_controll)) {
                for (const rsvpAdminControll of event.rsvp_admin_controll) {
                    if (rsvpAdminControll.rsvp_type === "Yesrsvp") {
                        await job.updateOne({ $set: { rsvp_type: rsvpAdminControll.rsvp_type, notification_status: "sent" } });
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
                            await job.updateOne({ $set: { email_count: totalUsersCount } });
                        }
                        if (sms_settings) {
                            await job.updateOne({ $set: { sms_count: totalUsersCount } });
                        }
                    } else if (rsvpAdminControll.rsvp_type === "Norsvp") {
                        await job.updateOne({ $set: { rsvp_type: "Norsvp", notification_status: "sent" } });
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
                            await job.updateOne({ $set: { email_count: totalUsersCount } });
                        }
                        if (sms_settings) {
                            await job.updateOne({ $set: { sms_count: totalUsersCount } });
                        }
                    } else if (rsvpAdminControll.rsvp_type === "Not_Attending") {
                        await job.updateOne({ $set: { rsvp_type: "Not_Attending", notification_status: "sent" } });
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
                            }
                        };
                    } else if (rsvpAdminControll.rsvp_type === "tentative") {
                        await job.updateOne({ $set: { rsvp_type: "tentative", notification_status: "sent" } });
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
                            }
                        };
                    } else if (rsvpAdminControll.rsvp_type === "All") {
                        await job.updateOne({ $set: { rsvp_type: "All", notification_status: "sent" } });

                        // Collect all relevant RSVP users
                        const allRsvpUsers = event.rsvp
                            .filter(rsvp =>
                                ["No_Reply", "Maybe", "Attending", "Not_Attending"].includes(rsvp.status)
                            )
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
                                if (!user || user.length === 0) {
                                    throw new ErrorModules.Api404Error("User not found");
                                }

                                const usersCount = user.length;
                                await helperService.validateCreditsRemaining(community, usersCount, usersCount);

                                const userData = user[0];
                                const to = userData.phoneCode + userData.phone;

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
                                    to: to,
                                    subject: 'Event alert!',
                                    html: smsText,
                                };

                                // Send notifications concurrently
                                const emailPromise = email_settings ? notificationServices.sendMail(mail_object_user) : Promise.resolve();
                                const smsPromise = sms_settings ? notificationServices.sendSmsVonage(sms_object_user.to, sms_object_user.subject, sms_object_user.html) : Promise.resolve();

                                const [emailResponse, smsResponse] = await Promise.all([emailPromise, smsPromise]);

                                if (emailResponse && emailResponse.status === false) {
                                    console.error('Mail send error:', emailResponse.error);
                                } else if (email_settings) {
                                    console.log('Email sent successfully.');
                                }

                                if (smsResponse && smsResponse.status === false) {
                                    console.error('SMS send error:', smsResponse.error);
                                } else if (sms_settings) {
                                    console.log('SMS sent successfully.');
                                }

                                return { usersCount };
                            });

                        // Run all concurrently
                        const results = await Promise.all(allRsvpUsers);

                        // Calculate total user count for all processed users
                        const totalUsersCount = results.reduce((sum, result) => sum + result.usersCount, 0);

                        // Deduct credits only once
                        if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining >= totalUsersCount) {
                            community.sms_credits_remaining -= totalUsersCount;
                        }

                        if (community.sms_email_global_settings.email_settings && community.email_credits_remaining >= totalUsersCount) {
                            community.email_credits_remaining -= totalUsersCount;
                        }

                        await community.save();

                        // Wait for all notifications to be sent
                        await Promise.all(allRsvpUsers);

                        if (email_settings) {
                            await job.updateOne({ $set: { email_count: totalUsersCount } });
                        }
                        if (sms_settings) {
                            await job.updateOne({ $set: { sms_count: totalUsersCount } });
                        }
                    }
                    // else if (rsvpAdminControll.rsvp_type === "All") {
                    //     await job.updateOne({ $set: { rsvp_type: "All", notification_status: "sent" } });
                    //     for (const rsvp of event.rsvp) {
                    //         if (rsvp.status === "No_Reply" || rsvp.status === "Maybe" || rsvp.status === "Attending" || rsvp.status === "Not_Attending") {
                    //             const userAggregate = [
                    //                 {
                    //                     $match: {
                    //                         _id: ObjectId(rsvp.user_id),
                    //                         is_deleted: false,
                    //                     }
                    //                 },
                    //                 {
                    //                     $project: {
                    //                         name: "$name",
                    //                         email: "$contact.email.address",
                    //                         phone: "$contact.phone.number",
                    //                         phoneCode: "$contact.phone.phone_code"
                    //                     }
                    //                 }
                    //             ];
                    //             const user = await User.aggregate(userAggregate);
                    //             if (!user) {
                    //                 throw new ErrorModules.Api404Error("User not found");
                    //             }
                    //             // User count for All
                    //             const usersCount = user.length;
                    //             await helperService.validateCreditsRemaining(community, usersCount, usersCount);

                    //             const userEmail = user[0].email;
                    //             const userPhone = user[0].phone;
                    //             const userphoneCode = user[0].phoneCode;
                    //             const username = user[0].name;
                    //             let to = userphoneCode + userPhone;

                    //             const emailbody = `${rsvpAdminControll.email_content}<br><br> Url: <a href="https://api.sangaraahi.net/api/deep-link/${eventId}">https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;
                    //             let smsbody = `${rsvpAdminControll.sms_content}<br><br> Url: <a>https://api.sangaraahi.net/api/deep-link/${eventId}</a>.`;
                    //             let smsText = smsbody
                    //                 .replace(/<br\s*\/?>/gi, '\n')
                    //                 .replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, '$2 ($1)')
                    //                 .replace(/<\/?[^>]+(>|$)/g, '');

                    //             // Send email to user
                    //             let mail_object_user = {
                    //                 to: userEmail,
                    //                 subject: 'Event aleart!',
                    //                 html: emailbody,
                    //             };
                    //             // Send sms to user
                    //             let sms_object_user = {
                    //                 to: to,
                    //                 subject: 'Event aleart!',
                    //                 html: smsText,
                    //             };
                    //             if (email_settings) {
                    //                 const mailResponseUser = await notificationServices.sendMail(mail_object_user);
                    //                 if (mailResponseUser.status === false) {
                    //                     console.error('Mail send error:', mailResponseUser.error);
                    //                 } else {
                    //                     console.log('Email sent successfully.');
                    //                 }
                    //             }
                    //             if (sms_settings) {
                    //                 const smsResponseUser = await notificationServices.sendSmsVonage(
                    //                     sms_object_user.to,
                    //                     sms_object_user.subject,
                    //                     sms_object_user.html
                    //                 );
                    //                 if (smsResponseUser.status === false) {
                    //                     console.error('SMS send error:', smsResponseUser.error);
                    //                 } else {
                    //                     console.log('SMS sent successfully.');
                    //                 }
                    //             }
                    //             // Deduct credits based on the number of users processed
                    //             if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining >= usersCount) {
                    //                 community.sms_credits_remaining -= usersCount;
                    //                 await community.save();
                    //             }

                    //             if (community.sms_email_global_settings.email_settings && community.email_credits_remaining >= usersCount) {
                    //                 community.email_credits_remaining -= usersCount;
                    //                 await community.save();
                    //             }
                    //         }
                    //     };
                    // }
                };
            }
        }

    } catch (err) {
        console.error('Error processing scheduled notification:', err);
    }
}

// Schedule the cron job
cron.schedule('*/1 * * * *', async () => {
    try {
        const now = moment.utc();
        // match with Cron model
        const pendingJob = await CronJob.find({
            notification_type: 'scheduled',
            notification_status: 'pending',
            is_deleted: false,
            is_active: true,
            // notification_date: { $lte: now.startOf('day').toDate() },
            notification_time: { $lte: now },
        });
        console.log(pendingJob, "pendingJob..........")
        for (const job of pendingJob) {
            const eventId = job.event_id
            await processScheduledNotification(job, eventId);
        }
    } catch (error) {
        console.log(error, "error.......")
    }
})

cron.schedule("*/5 * * * *", async () => {
    console.log("Flushing logs from Redis to MongoDB...");

    let logs = [];
    let log;
    while ((log = await redis.lpop("audit_logs"))) {
        logs.push(JSON.parse(log));
    }

    if (logs.length > 0) {
        await ActivityLogs.insertMany(logs);
        console.log(`✅ Inserted ${logs.length} logs into DB`);
    }
});

// Cron job for send notification for public events reminder for new users
cron.schedule("*/2 * * * *", async () => {
    try {
        const now = new Date();

        const events = await Events.find({
            invitation_type: "Public",
            is_active: true,
            is_deleted: false,
            is_cancelled: false,
            rsvp_end_time: { $gte: new Date() },
            rsvp: {
                $elemMatch: {
                    is_new: true,
                    type: "user"
                }
            }
        });
        for (const event of events) {
            // let rsvpUpdated = false;
            for (const rsvp of event.rsvp) {
                if (!rsvp.is_new || rsvp.type !== "user") continue;

                const updatedEvent = await Events.findOneAndUpdate(
                    {
                        _id: event._id,
                        "rsvp._id": rsvp._id,
                        "rsvp.is_new": true
                    },
                    {
                        $set: {
                            "rsvp.$.is_new": false,
                            "rsvp.$.updated_at": new Date()
                        }
                    },
                    { new: true }
                );

                if (!updatedEvent) {
                    continue;
                }

                const user = await User.findById(rsvp.user_id);
                if (!user) continue;

                const community = await Communities.findById(event.community_id);
                const communityId = community._id;
                const userCount = 1;
                await helperService.validateCreditsRemaining(community, userCount, userCount);

                const userId = user._id;
                const userEmail = user.contact?.email?.address || "";
                const userPhone = user.contact?.phone?.number || "";
                const userphoneCode = user.contact?.phone?.phone_code || "";
                const username = user.name || "";
                let to = userphoneCode + userPhone;

                // Check if SMS and email settings are enabled
                const { sms_settings, email_settings } = community.sms_email_global_settings;

                const smspayload = {
                    recipient:
                    {
                        phone: to,
                    },
                    template: {
                        type: "SMS",
                        slug: "EVENTJOINREQ",
                        lang: "en"
                    },
                    contents: {
                        EVENTNAME: event.title,
                    }
                }
                const emailpayload = {
                    recipient:
                    {
                        email: userEmail,
                    },
                    template: {
                        type: "Email",
                        slug: "EVENTEMAIL",
                        lang: "en"
                    },
                    contents: {
                        EVENTNAME: event.title,
                    }
                }

                const notiSettings = await NotificationSettings.findOne({ user_id: userId, community_id: communityId });
                let smsEvent, emailEvent, communityEvent;
                // If notiSettings exists, extract sms_event and email_event, else set to true to ensure SMS is sent
                if (notiSettings) {
                    smsEvent = notiSettings.sms_event;
                    emailEvent = notiSettings.email_event;
                    communityEvent = notiSettings.community_event;
                } else {
                    smsEvent = true; // Default to true if no settings found
                    emailEvent = true; // Default to true if no settings found
                    communityEvent = true; // Default to true if no settings found
                }
                // SMS SEND
                if (sms_settings && smsEvent) {
                    await notificationServices.notifyService(smspayload);
                }
                //EMAIL SEND
                if (email_settings && emailEvent) {
                    await notificationServices.notifyService(emailpayload);
                }

                // Deduct credits based on the number of users processed
                if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining >= userCount) {
                    community.sms_credits_remaining -= userCount;
                    await community.save();
                }

                if (community.sms_email_global_settings.email_settings && community.email_credits_remaining >= userCount) {
                    community.email_credits_remaining -= userCount;
                    await community.save();
                }

                // Mark RSVP as processed
                // rsvp.is_new = false;
                rsvp.updated_at = new Date();
                // rsvpUpdated = true;

            }
            if (rsvpUpdated) {
                await event.save();
            }
            console.log("✅ Public RSVP notification cron completed");
        }
    } catch (e) {
        console.log("❌ Public RSVP notification cron failed", e);
    }
});


// Log when the cron job starts
console.log('Cron job scheduled for Event to run every 24 h');
// Handle shutdown gracefully (close MongoDB connection)
process.on('SIGINT', () => {
    console.log('Received SIGINT. Closing MongoDB connection...');
    mongoDB.close(() => {
        console.log('MongoDB connection closed.');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});