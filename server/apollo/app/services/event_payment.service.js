const Events = Lib.Model('Events');
const Services = require("../services");
const Communities = Lib.Model('Communities');
const User = Lib.Model('Users');
const EventPayments = Lib.Model('EventPayment');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const ErrorModules = require('../errors');
const xlsx = require('xlsx');
const notificationServices = require('./notification.service');
const notificationHelper = require('../library/notifiaction.helper')
const SocketEventService = require('./socket-event.service');
const ActivityLogService = require('./activity_log.service')

module.exports = {
    getAllEventPayment: async (data) => {
        const page = data.page || 1;
        const limit = data.limit || 10;
        const eventId = data.eventId;
        const search = data.search;
        const idFilter = data.idFilter;
        const accessPlatfrom = data.accessPlatfrom;
        const skip = (page - 1) * limit;

        let filter = { is_deleted: false };
        if (eventId) filter.event_id = ObjectId(eventId);

        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: "sr_users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "userDetails"
                },
            },
            {
                '$unwind': {
                    'path': '$userDetails',
                    preserveNullAndEmptyArrays: true
                },
            },
            {
                $lookup: {
                    from: "sr_events",
                    localField: "event_id",
                    foreignField: "_id",
                    as: "eventDetails",
                },
            },
            {
                $project: {
                    event_id: 1,
                    user_id: 1,
                    user_name: '$userDetails.name',
                    user_email: '$userDetails.contact.email.address',
                    user_phone_code: '$userDetails.contact.phone.phone_code',
                    user_phone: '$userDetails.contact.phone.number',
                    phone_code: 1,
                    phone: 1,
                    name: 1,
                    email: 1,
                    member_type: 1,
                    amount: 1,
                    currency: 1,
                    no_of_attendees: 1,
                    payment_mode: '$payment_details.payment_mode',
                    access_platfrom: '$payment_details.access_platfrom',
                    transaction_id: '$payment_details.transaction_id',
                    rsvp_status: 1,
                    check_in: 1,
                    // payment_details: 1,
                    created_at: 1
                },
            },
            // { $sort: { created_at: -1 } },
            // { $skip: (page - 1) * limit },
            // { $limit: limit }
        ];
        let searchName = "";
        if (search) {
            searchName = search;
            let objUser = {
                '$match': {
                    $or: [
                        {
                            'userDetails.name': new RegExp(`.*${searchName}.*`, 'i')
                        },
                        {
                            'name': new RegExp(`.*${searchName}.*`, 'i')
                        }
                    ]

                }
            };
            pipeline.splice(3, 0, objUser);
        }
        if (idFilter) {
            let objUser = {
                '$match': {
                    _id: new ObjectId(idFilter)
                }
            };
            pipeline.splice(3, 0, objUser);
        }
        if (accessPlatfrom) {
            let objMatch = {
                '$match': {
                    'payment_details.access_platfrom': accessPlatfrom
                }
            };
            pipeline.splice(3, 0, objMatch);
        }

        try {
            const payment = await EventPayments.aggregate(pipeline).sort({ created_at: -1 }).skip(skip).limit(limit);
            const totalcount = await EventPayments.aggregate(pipeline);
            const total = totalcount.length;
            // Calculate the "from" and "to" values based on page and limit
            const from = (page - 1) * limit + 1;
            const to = Math.min(page * limit, total);

            return {
                error: false,
                message: "generalSuccess",
                total: total,
                from: from,
                to: to,
                data: payment,
            };
        } catch (error) {
            console.error(error);
            return { error: true, message: 'Internal Server Error' };
        }
    },
    getEventPaymentById: async (data) => {
        try {
            const paymentId = data.paymentId;
            const filter = { is_deleted: false, _id: ObjectId(paymentId) };
            const pipeline = [
                { $match: filter },
                {
                    $lookup: {
                        from: "sr_users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "userDetails"
                    },
                },
                {
                    $unwind: {
                        path: '$userDetails',
                        preserveNullAndEmptyArrays: true
                    },
                },
                {
                    $lookup: {
                        from: "sr_events",
                        localField: "event_id",
                        foreignField: "_id",
                        as: "eventDetails",
                    },
                },
                {
                    $project: {
                        payment_id: 1,
                        userId: '$userDetails._id',
                        userName: '$userDetails.name',
                        userEmail: '$userDetails.contact.email.address',
                        profileImage: '$userDetails.profile_image',
                        phoneNumber: '$userDetails.contact.phone.number',
                        phCode: '$userDetails.contact.phone.phone_code',
                        phone_code: 1,
                        phone: 1,
                        name: 1,
                        email: 1,
                        member_type: 1,
                        payment_status: '$payment_details.payment_status',
                        amount: '$amount',
                        transaction_amount: '$payment_details.transaction_amount',
                        gateway_charge_cost: '$payment_details.gateway_charge_cost',
                        actual_payment_amtount: '$payment_details.actual_payment_amtount',
                        payment_mode: '$payment_details.payment_mode',
                        card_no: '$payment_details.card_no',
                        currency: '$currency',
                        check_no: '$payment_details.check_no',
                        transaction_id: '$payment_details.transaction_id',
                        description: '$payment_details.description',
                        created_at: '$created_at',
                    },
                },
            ];

            const payment = await EventPayments.aggregate(pipeline);
            const paymentResponse = payment[0];

            return {
                error: false,
                code: 200,
                systemCode: 'PAYMENT_FETCHED_SUCCESSFULLY',
                message: 'Payment fetched successfully',
                data: paymentResponse,
            };
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_FETCHING_PAYMENT_BY_ID',
                message: error.message,
                data: null,
            };
        }
    },
    getEventPaymentByIdApp: async (userId, data) => {
        try {
            const { eventId } = data;
            let filter = { is_deleted: false, user_id: ObjectId(userId) };

            if (eventId) {
                filter.event_id = ObjectId(eventId);
            } else {
                // Handle the case where eventId is not provided
                return {
                    error: true,
                    code: 400,
                    systemCode: 'INVALID_INPUT',
                    message: 'eventId must be provided.',
                    data: null,
                };
            }
            const pipeline = [
                { $match: filter },
                {
                    $lookup: {
                        from: "sr_users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "userDetails"
                    },
                },
                {
                    $unwind: {
                        path: '$userDetails',
                    },
                },
                {
                    $lookup: {
                        from: "sr_events",
                        localField: "event_id",
                        foreignField: "_id",
                        as: "eventDetails",
                    },
                },
                {
                    $project: {
                        payment_id: 1,
                        userName: '$userDetails.name',
                        payment_status: '$payment_details.payment_status',
                        amount: '$amount',
                        rsvp_status: '$rsvp_status',
                        transaction_amount: '$payment_details.transaction_amount',
                        gateway_charge_cost: '$payment_details.gateway_charge_cost',
                        actual_payment_amtount: '$payment_details.actual_payment_amtount',
                        payment_mode: '$payment_details.payment_mode',
                        card_no: '$payment_details.card_no',
                        currency: '$currency',
                        check_no: '$payment_details.check_no',
                        transaction_id: '$payment_details.transaction_id',
                        description: '$payment_details.description',
                        package_details: '$package_details',
                        created_at: '$created_at',
                    },

                },
            ];

            const payment = await EventPayments.aggregate(pipeline);
            const paymentResponse = payment[0];
            return {
                error: false,
                code: 200,
                systemCode: 'PAYMENT_FETCHED_SUCCESSFULLY',
                message: 'Payment fetched successfully',
                data: paymentResponse,
            };
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_FETCHING_PAYMENT_BY_ID',
                message: error.message,
                data: null,
            };
        }
    },
    // getEventPaymentById: async (data) => {
    //     try {
    //         const paymentId = ObjectId(data.paymentId);

    //         // Query the blog by its ID,
    //         const payment = await EventPayments.findOne({ _id: paymentId, is_deleted: false });

    //         // If no payment is found, return an appropriate response
    //         if (!payment) {
    //             return {
    //                 error: true,
    //                 code: 404,
    //                 systemCode: 'PAYMENT_NOT_FOUND',
    //                 message: 'Payment not found',
    //                 data: null
    //             };
    //         }

    //         // Convert the payment to a format suitable for GraphQL response
    //         const paymentResponse = {
    //             id: payment._id.toString(),
    //             paymentStatus: payment.payment_details ? payment.payment_details.payment_status : null,
    //             amount: payment.amount,
    //             transactionAmount: payment.payment_details ? payment.payment_details.transaction_amount : null,
    //             gatewayChargeCost: payment.payment_details ? payment.payment_details.gateway_charge_cost : null,
    //             actualPaymentmtount: payment.payment_details ? payment.payment_details.actual_payment_amtount : null,
    //             paymentMode: payment.payment_details ? payment.payment_details.payment_mode : null,
    //             cardNo: payment.payment_details ? payment.payment_details.card_no : null,
    //             currency: payment.currency,
    //             checkNo: payment.payment_details ? payment.payment_details.check_no : null,
    //             transactionId: payment.payment_details ? payment.payment_details.transaction_id : null,
    //             description: payment.payment_details ? payment.payment_details.description : null,
    //             createdAt: new Date(payment.created_at).toLocaleDateString("en-US", {
    //                 weekday: "long",
    //                 year: "numeric",
    //                 month: "long",
    //                 day: "numeric"
    //             })    
    //         };

    // // Return the successful response
    // return {
    //     error: false,
    //     code: 200,
    //     systemCode: 'PAYMENT_FETCHED_SUCCESSFULLY',
    //     message: 'Payment fetched successfully',
    //     data: paymentResponse
    // };

    //     } catch (error) {
    //         return {
    //             error: true,
    //             code: 500,
    //             systemCode: 'ERROR_FETCHING_BLOG_BY_ID',
    //             message: error.message,
    //             data: null
    //         };
    //     }
    // },
    //Mutation
    deleteEventPayment: async function (id, userId) {
        try {
            const eventPayment = await EventPayments.findOne({ _id: new ObjectId(id) });
            // let updateEventPayment = await EventPayments.findOneAndUpdate({ _id: ObjectId(id) }, { "$set": EventPaymentObj });
            if (!eventPayment) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'PAYMENT_NOT_FOUND',
                    message: 'Payment not found',
                    data: null
                };
            }
            const userId = eventPayment.user_id;
            const eventId = eventPayment.event_id;
            await Events.updateOne({
                '_id': ObjectId(eventId),
                'is_deleted': false,
                'rsvp.user_id': new ObjectId(userId)
            }, { $set: { 'rsvp.$[xxx].status': 'Maybe', 'rsvp.$[xxx].guests': {} } },
                {
                    arrayFilters: [
                        { "xxx.user_id": new ObjectId(userId) }
                    ]
                });

            const event = await Events.findOne({ _id: new ObjectId(eventId) });
            if (event && event.attendees.is_restricted) {
                event.attendees.remaining_number_of_attendees = event.attendees.remaining_number_of_attendees + eventPayment.no_of_attendees;
                await event.save();
            }

            eventPayment.is_deleted = true;
            await eventPayment.save();

            const id = event.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            // call activity log
            await ActivityLogService.activityLogActiion({
                communityId: event.community_id,
                userId: userId,
                module: "EVENT",
                action: "PAYMENT_DELETE",
                platForm: "web",
                memberRole: userRole,
                oldData: null,
                newData: null
            })
            return ({ error: false, message: "generalSuccess" });

        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("EventPayment find error");
        }
    },
    updateEventPayment: async function (data, context) {
        try {

            loginUserId = context.user.id;
            // Extract data from the input arguments
            const { paymentId, rsvpStatus, paymentDetails } = data;

            // Fetch the specific event payment by its ID
            const eventPayment = await EventPayments.findById(paymentId);
            // Check if the event payment exists
            if (!eventPayment) {
                return {
                    error: true,
                    systemCode: 'EVENT_PAYMENT_NOT_FOUND',
                    code: 404,
                    message: 'Event payment not found',
                    data: null
                };
            }

            // === Capture old data before updating ===
            const oldData = {
                rsvp_status: eventPayment.rsvp_status,
                payment_details: { ...eventPayment.payment_details }
            };
            const filter = { is_deleted: false, _id: ObjectId(paymentId) };
            const pipeline = [
                { $match: filter },
                {
                    $lookup: {
                        from: "sr_users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "userDetails"
                    },
                },
                {
                    $unwind: {
                        path: '$userDetails',
                        preserveNullAndEmptyArrays: true
                    },
                },
                {
                    $lookup: {
                        from: "sr_events",
                        localField: "event_id",
                        foreignField: "_id",
                        as: "eventDetails",
                    },
                },
                {
                    $unwind: {
                        path: '$eventDetails',
                    },
                },
                {
                    $lookup: {
                        from: "sr_users",
                        localField: "eventDetails.host_id",
                        foreignField: "_id",
                        as: "hostDetails",
                    },
                },
                {
                    $unwind: {
                        path: '$hostDetails',
                    },
                },
                {
                    $project: {
                        eventName: '$eventDetails.title',
                        eventId: '$eventDetails._id',
                        paymentCategory: '$eventDetails.payment_category',
                        paymentPackages: '$eventDetails.payment_packages',
                        eventNumber: '$eventDetails.venue_details.phone_no',
                        hostName: '$hostDetails.name',
                        payment_id: 1,
                        no_of_attendees: 1,
                        userId: '$userDetails._id',
                        userName: '$userDetails.name',
                        userEmail: '$userDetails.contact.email.address',
                        phCode: '$userDetails.contact.phone.phone_code',
                        profileImage: '$userDetails.profile_image',
                        phoneNumber: '$userDetails.contact.phone.number',
                        deviceDetails: '$userDetails.device_details',
                        web_visitor_name: '$name',
                        web_visitor_email: '$email',
                        web_visitor_phone: '$phone',
                        web_visitor_phone_code: '$phone_code',
                        member_type: '$member_type',
                        payment_status: '$payment_details.payment_status',
                        amount: '$amount',
                        transaction_amount: '$payment_details.transaction_amount',
                        gateway_charge_cost: '$payment_details.gateway_charge_cost',
                        actual_payment_amtount: '$payment_details.actual_payment_amtount',
                        payment_mode: '$payment_details.payment_mode',
                        card_no: '$payment_details.card_no',
                        currency: '$currency',
                        check_no: '$payment_details.check_no',
                        transaction_id: '$payment_details.transaction_id',
                        description: '$payment_details.description',
                        created_at: '$created_at',
                    },

                },
            ];
            const payment = await EventPayments.aggregate(pipeline);
            const paymentResponse = payment[0];
            const packageNames = eventPayment.package_details.map(packageDetail => {
                const foundPackage = paymentResponse.paymentPackages.find(package =>
                    package._id.toString() === packageDetail.package_id
                );
                return {
                    name: foundPackage ? foundPackage.package_name : 'Unknown', // default to 'Unknown' if not found
                    number: packageDetail.number
                };
            });

            // Transforming packageNames array into an object
            const packageNamesObject = packageNames.reduce((acc, packageDetail) => {
                acc[packageDetail.name] = packageDetail.number;
                return acc;
            }, {});

            // Converting packageNamesObject into a string
            let packageNamesString = '';
            for (const key in packageNamesObject) {
                if (Object.hasOwnProperty.call(packageNamesObject, key)) {
                    packageNamesString += `${key}: ${packageNamesObject[key]}, `;
                }
            }

            // Removing the trailing comma and space
            packageNamesString = packageNamesString.slice(0, -2);

            const name = paymentResponse.member_type === 'user' ? paymentResponse.userName : paymentResponse.web_visitor_name;
            const email = paymentResponse.member_type === 'user' ? paymentResponse.userEmail : paymentResponse.web_visitor_email;
            const phoneCode = paymentResponse.member_type === 'user' ? paymentResponse.phCode : paymentResponse.web_visitor_phone_code;
            const phone = paymentResponse.member_type === 'user' ? paymentResponse.phoneNumber : paymentResponse.web_visitor_phone;
            const userId = paymentResponse.member_type === 'user' ? paymentResponse.userId : null;
            const deviceDetails = paymentResponse.member_type === 'user' ? paymentResponse.deviceDetails : null;
            const amount = paymentResponse.amount;
            const paymentMode = paymentResponse.payment_mode;
            const eventName = paymentResponse.eventName;
            const eventId = paymentResponse.eventId;
            const currency = paymentResponse.currency;
            const NoOfAttendess = paymentResponse.no_of_attendees;
            const hostName = paymentResponse.hostName;
            const paymentCategory = paymentResponse.paymentCategory;
            const eventNumber = paymentResponse.eventNumber;
            const createdAt = paymentResponse.created_at;
            // Set pacageName and pacageNumber based on packageNamesObject
            const pacageName = Object.keys(packageNamesObject).join(', ');
            const pacageNumber = Object.values(packageNamesObject).join(', ');
            // const paymentPackages = paymentResponse.paymentPackages;
            let to = phoneCode + phone;
            // Update the event payment fields
            eventPayment.rsvp_status = rsvpStatus;
            // Fetching user device token 
            let webToken = [];
            if (deviceDetails) {
                webToken = deviceDetails.filter(device => device.is_active === true).map(device => device.web_token).filter(token => token !== null && token !== undefined);
                fcmToken = deviceDetails.filter(device => device.is_active === true).map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                webToken = [...webToken, ...fcmToken];
            }

            const event = await Events.findOne({
                _id: ObjectId(eventId),
                is_deleted: false
            });
            if (!event) {
                return ({ error: true, message: "Event not found", data: null });
            }
            const communityId = event.community_id;
            const community = await Communities.findOne({
                _id: ObjectId(communityId),
                is_deleted: false,
                is_active: true
            });
            const communityEmail = community.community_email;
            // Check if SMS and email settings are enabled
            const { sms_settings, email_settings } = community.sms_email_global_settings;
            const { sms_credits_remaining, email_credits_remaining } = community;
            const communityName = community.community_name;
            if (paymentDetails) {
                // Update payment details if provided
                eventPayment.payment_details = {
                    payment_status: paymentDetails.paymentStatus || false,
                    transaction_amount: paymentDetails.transactionAmount || 0,
                    gateway_charge_cost: paymentDetails.gatewayChargeCost || 0,
                    actual_payment_amtount: paymentDetails.actualPaymentmtount || 0,
                    donation_amount: paymentDetails.donationAmount || 0,
                    concession_amount: paymentDetails.concessionAmount || 0,
                    payment_mode: paymentDetails.paymentMode || null,
                    check_no: paymentDetails.checkNo || null,
                    transaction_id: paymentDetails.transactionId || null,
                    description: paymentDetails.description || null,
                    access_platfrom: paymentDetails.accessPlatfrom || null
                };
            }

            // Save the updated event payment to the database
            await eventPayment.save();
            // === Capture new data after update ===
            const newData = {
                rsvp_status: eventPayment.rsvp_status,
                payment_details: { ...eventPayment.payment_details }
            };

            const member = community.members.find(
                (m) => m.member_id.toString() === loginUserId.toString()
            );
            const userRole = member.roles;
            await ActivityLogService.activityLogActiion({
                communityId: communityId,
                userId: loginUserId,
                module: "EVENT",
                action: "UPDATE_EVENT_PAYMENT",
                oldData: oldData,
                newData: newData,
                platForm: "web",
                memberRole: userRole
            });

            SocketEventService.doCheckInEvent(eventId.toString(), loginUserId, { id: eventPayment._id, type: 'payment_update' });
            let smspayload;
            let emailpayload;
            if (paymentCategory === "per_head") {
                if (rsvpStatus === 'paid') {
                    smspayload = {
                        recipient:
                        {
                            phone: to,
                            // user_id: userId,
                        },
                        template: {
                            type: "SMS",
                            slug: "PAYMENTSUCCESSSMS",
                            lang: "en"
                        },
                        contents: {
                            NAME: name,
                            AMOUNT: amount,
                            CURRENCY: currency,
                            COMMUNITYNAME: communityName,
                            EVENTNAME: eventName,
                            ATTENDESS: NoOfAttendess,
                            USERNAME: hostName,
                            PACAKAGEDETAILS: pacageNumber,
                            COMMUNITYEMAIL: communityEmail,
                            EVENTNUMBER: eventNumber
                        },
                    }
                } else if (rsvpStatus === 'unpaid') {
                    smspayload = {
                        recipient:
                        {
                            phone: to,
                            // user_id: userId,
                        },
                        template: {
                            type: "SMS",
                            slug: "PAYMENTFAILEDSMS",
                            lang: "en"
                        },
                        contents: {
                            NAME: name,
                            AMOUNT: amount,
                            CURRENCY: currency,
                            COMMUNITYNAME: communityName,
                            EVENTNAME: eventName,
                            ATTENDESS: NoOfAttendess,
                            USERNAME: hostName,
                            PACAKAGEDETAILS: pacageNumber,
                            COMMUNITYEMAIL: communityEmail,
                            EVENTNUMBER: eventNumber,
                            PAYMENTMODE: paymentMode
                        },
                    }
                }
                // Send notification if smsemailpayload is defined
                if (sms_settings && sms_credits_remaining > 0 && smspayload) {
                    await notificationServices.notifyService(smspayload);
                    if (sms_credits_remaining > 0) {
                        community.sms_credits_remaining = sms_credits_remaining - 1;
                        await community.save();
                    }
                }
                if (rsvpStatus === 'paid') {
                    emailpayload = {
                        recipient:
                        {
                            email: email,
                            // user_id: userId,
                        },
                        template: {
                            type: "Email",
                            slug: "PAYMENTSUCCESSEMAIL",
                            lang: "en"
                        },
                        contents: {
                            NAME: name,
                            AMOUNT: amount,
                            CURRENCY: currency,
                            COMMUNITYNAME: communityName,
                            EVENTNAME: eventName,
                            ATTENDESS: NoOfAttendess,
                            USERNAME: hostName,
                            PACAKAGEDETAILS: pacageNumber,
                            COMMUNITYEMAIL: communityEmail,
                            EVENTNUMBER: eventNumber,
                            PAYMENTMODE: paymentMode,
                            CREATEDAT: createdAt,
                        },
                    }
                } else if (rsvpStatus === 'unpaid') {
                    emailpayload = {
                        recipient:
                        {
                            email: email,
                            // user_id: userId,
                        },
                        template: {
                            type: "Email",
                            slug: "PAYMENTFAILEDEMAIL",
                            lang: "en"
                        },
                        contents: {
                            NAME: name,
                            AMOUNT: amount,
                            CURRENCY: currency,
                            COMMUNITYNAME: communityName,
                            EVENTNAME: eventName,
                            ATTENDESS: NoOfAttendess,
                            USERNAME: hostName,
                            PACAKAGEDETAILS: pacageNumber,
                            COMMUNITYEMAIL: communityEmail,
                            EVENTNUMBER: eventNumber,
                            PAYMENTMODE: paymentMode,
                            CREATEDAT: createdAt,
                        },
                    }
                }
                // Send notification if smsemailpayload is defined
                if (email_settings && email_credits_remaining > 0 && emailpayload) {
                    await notificationServices.notifyService(emailpayload);
                    if (email_credits_remaining > 0) {
                        community.email_credits_remaining = email_credits_remaining - 1;
                        await community.save();
                    }
                }
            }
            if (paymentCategory === "package_wise") {
                if (rsvpStatus === 'paid') {
                    smspayload = {
                        recipient:
                        {
                            phone: to,
                            // user_id: userId,
                        },
                        template: {
                            type: "SMS",
                            slug: "PAYMENTSUCCESSSMS",
                            lang: "en"
                        },
                        contents: {
                            NAME: name,
                            AMOUNT: amount,
                            CURRENCY: currency,
                            COMMUNITYNAME: communityName,
                            EVENTNAME: eventName,
                            ATTENDESS: NoOfAttendess,
                            USERNAME: hostName,
                            PACAKAGEDETAILS: packageNamesString,
                            EVENTNUMBER: eventNumber
                        },
                    }
                } else if (rsvpStatus === 'unpaid') {
                    smspayload = {
                        recipient:
                        {
                            phone: to,
                            // user_id: userId,
                        },
                        template: {
                            type: "SMS",
                            slug: "PAYMENTFAILEDSMS",
                            lang: "en"
                        },
                        contents: {
                            NAME: name,
                            AMOUNT: amount,
                            CURRENCY: currency,
                            COMMUNITYNAME: communityName,
                            EVENTNAME: eventName,
                            ATTENDESS: NoOfAttendess,
                            USERNAME: hostName,
                            PACAKAGEDETAILS: packageNamesString,
                            EVENTNUMBER: eventNumber
                        },
                    }
                }
                // Send notification if smsemailpayload is defined
                if (sms_settings && sms_credits_remaining > 0 && smspayload) {
                    await notificationServices.notifyService(smspayload);
                    if (sms_credits_remaining > 0) {
                        community.sms_credits_remaining = sms_credits_remaining - 1;
                        await community.save();
                    }
                }
                if (rsvpStatus === 'paid') {
                    emailpayload = {
                        recipient:
                        {
                            email: email,
                            // user_id: userId,
                        },
                        template: {
                            type: "Email",
                            slug: "PAYMENTSUCCESSEMAIL",
                            lang: "en"
                        },
                        contents: {
                            NAME: name,
                            AMOUNT: amount,
                            CURRENCY: currency,
                            COMMUNITYNAME: communityName,
                            EVENTNAME: eventName,
                            ATTENDESS: NoOfAttendess,
                            USERNAME: hostName,
                            PACAKAGEDETAILS: packageNamesString,
                            COMMUNITYEMAIL: communityEmail,
                            EVENTNUMBER: eventNumber,
                            PAYMENTMODE: paymentMode,
                            CREATEDAT: createdAt,
                        },
                    }
                } else if (rsvpStatus === 'unpaid') {
                    emailpayload = {
                        recipient:
                        {
                            email: email,
                            // user_id: userId,
                        },
                        template: {
                            type: "Email",
                            slug: "PAYMENTFAILEDEMAIL",
                            lang: "en"
                        },
                        contents: {
                            NAME: name,
                            AMOUNT: amount,
                            CURRENCY: currency,
                            COMMUNITYNAME: communityName,
                            EVENTNAME: eventName,
                            ATTENDESS: NoOfAttendess,
                            USERNAME: hostName,
                            PACAKAGEDETAILS: packageNamesString,
                            COMMUNITYEMAIL: communityEmail,
                            EVENTNUMBER: eventNumber,
                            PAYMENTMODE: paymentMode,
                            CREATEDAT: createdAt,
                        },
                    }
                }
                // Send notification if smsemailpayload is defined
                if (email_settings && email_credits_remaining > 0 && emailpayload) {
                    await notificationServices.notifyService(emailpayload);
                    if (email_credits_remaining > 0) {
                        community.email_credits_remaining = email_credits_remaining - 1;
                        await community.save();
                    }
                }
            }
            if (rsvpStatus === 'paid') {
                payload = {
                    recipient:
                    {
                        user_id: userId,
                        fcmToken: webToken
                    },
                    template: {
                        type: "Push",
                        slug: "payment-success",
                        lang: "en"
                    },
                    contents: {
                        AMOUNT: amount,
                        CURRENCY: currency,
                        COMMUNITYNAME: communityName,
                        EVENTNAME: eventName,
                        ATTENDESS: NoOfAttendess,
                        USERNAME: hostName
                        // NAME: name
                    },
                    image: `${process.env.AWS_PATH}/image_2024_03_18T07_41_34_650Z.png`
                }
                await notificationServices.notifyService(payload);
            } else if (rsvpStatus === 'unpaid') {
                payload = {
                    recipient:
                    {
                        user_id: userId,
                        fcmToken: webToken
                    },
                    template: {
                        type: "Push",
                        slug: "payment-Failed",
                        lang: "en"
                    },
                    contents: {
                        AMOUNT: amount,
                        CURRENCY: currency,
                        COMMUNITYNAME: communityName,
                        EVENTNAME: eventName,
                        ATTENDESS: NoOfAttendess,
                        USERNAME: hostName
                        // NAME: name
                    },
                    image: `${process.env.AWS_PATH}/image_2024_03_18T07_41_34_647Z.png`
                }
                await notificationServices.notifyService(payload);

            }
            return {
                error: false,
                systemCode: 'SUCCESS',
                code: 200,
                message: 'Event payment updated successfully',
                data: {
                    id: eventPayment._id,
                    rsvpStatus: rsvpStatus || null,
                    paymentDetails: eventPayment.payment_details
                }
            };
        } catch (error) {
            console.log(error, 'error');
            return {
                error: true,
                systemCode: 'ERROR_UPDATING_EVENT_PAYMENT',
                code: 500,
                message: error.message,
                data: null
            };
        }
    },
    updateCheckIn: async function (id, userId) {
        try {
            const eventPayment = await EventPayments.findOneAndUpdate(
                { _id: id },
                { $set: { check_in: true } },
                { new: true }
            );
            if (!eventPayment) {
                return {
                    error: true,
                    systemCode: 'ERROR_EVENT_CHECKIN_NOT_FOUND',
                    code: 404,
                    message: 'Event checkIn not found',
                    data: null
                };
            }
            let eventId = eventPayment.event_id;
            SocketEventService.doCheckInEvent(eventId.toString(), userId, { id: id, checkIn: true, type: 'checkIn_update' });

            return {
                error: false,
                systemCode: 'SUCCESS',
                code: 200,
                message: 'CheckIn updated successfully',
                data: {
                    id: eventPayment._id,
                    checkIn: eventPayment.check_in
                }
            };
        } catch (error) {
            return {
                error: true,
                systemCode: 'ERROR_UPDATING_EVENT_CHECKIN',
                code: 500,
                message: error.message,
            }
        }
    },
    generateExcelPaymentList: async function (eventId, userId) {
        try {
            const pipeline = [
                {
                    '$match': {
                        'is_deleted': false,
                        'event_id': mongoose.Types.ObjectId(eventId)
                    }
                },
                {
                    $lookup: {
                        from: "sr_users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "userDetails"
                    },
                },
                {
                    '$unwind': {
                        'path': '$userDetails',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: "sr_events",
                        localField: "event_id",
                        foreignField: "_id",
                        as: "eventDetails",
                    },
                },
                {
                    '$unwind': {
                        'path': '$eventDetails'
                    }
                },
                {
                    $addFields: {
                        payment_category: {
                            $cond: {
                                if: { $isArray: "$eventDetails.payment_category" },
                                then: { $arrayElemAt: ["$eventDetails.payment_category", 0] },
                                else: "$eventDetails.payment_category"
                            }
                        },
                        guests: {
                            $let: {
                                vars: {
                                    matchingRsvp: {
                                        $filter: {
                                            input: { $ifNull: ["$eventDetails.rsvp", []] },
                                            as: "rsvp",
                                            cond: { $eq: ["$$rsvp.user_id", "$user_id"] }
                                        }
                                    }
                                },
                                in: {
                                    $cond: {
                                        if: { $gt: [{ $size: "$$matchingRsvp" }, 0] },
                                        then: { $arrayElemAt: ["$$matchingRsvp.guests", 0] },
                                        else: null
                                    }
                                }
                            }
                        },

                    }
                },
                {
                    $set: {
                        complete_package_details: {
                            $map: {
                                input: {
                                    $cond: {
                                        if: { $isArray: "$package_details" },
                                        then: "$package_details",
                                        else: []
                                    }
                                },
                                as: "packageData",
                                in: {
                                    $let: {
                                        vars: {
                                            matchedPackage: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$eventDetails.payment_packages",
                                                            as: "paymentPackage",
                                                            cond: {
                                                                $eq: [
                                                                    { $toString: "$$paymentPackage._id" },
                                                                    { $toString: "$$packageData.package_id" }
                                                                ]
                                                            }
                                                        }
                                                    },
                                                    0
                                                ]
                                            }
                                        },
                                        in: {
                                            package_name: "$$matchedPackage.package_name",
                                            package_rate: "$$matchedPackage.package_rate",
                                            number: "$$packageData.number",
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        event_id: 1,
                        user_id: 1,
                        name: {
                            $ifNull: ["$userDetails.name", "$name"], // Use `name` for web_visitor
                        },
                        email: {
                            $ifNull: ["$userDetails.contact.email.address", "$email"], // Use `email` for web_visitor
                        },
                        phone_code: {
                            $ifNull: ["$userDetails.contact.phone.phone_code", "$phone_code"], // Use `phone_code` for web_visitor
                        },
                        phone: {
                            $ifNull: ["$userDetails.contact.phone.number", "$phone"], // Use `phone` for web_visitor
                        },
                        member_type: 1,
                        amount: 1,
                        currency: 1,
                        no_of_attendees: 1,
                        payment_mode: "$payment_details.payment_mode",
                        transaction_id: "$payment_details.transaction_id",
                        rsvp: '$eventDetails.rsvp',
                        rsvp_status: 1,
                        guests: 1,
                        payment_details: 1,
                        package_details: 1,
                        complete_package_details: 1,
                        payment_category: 1,
                        created_at: 1,
                    },
                },
            ];

            const payment = await EventPayments.aggregate(pipeline);

            const event = await Events.findOne({ _id: eventId });
            const communityId = event.community_id;
            console.log(communityId, "communityId.............")

            const table = [['Sl.No', 'RSVP Date', 'RSVP Status', 'Member Name', 'Member Email', 'Phone Code', 'Phone No.', 'Type of Member', 'No. of Attendees', 'Seniors', 'Adult', 'Minor', 'Payment Package', 'Payment Mode', 'Payment Category', 'Actual Amtount.', 'Transaction Amount', 'Donation Amount', 'Concession Amount', 'Transaction Id']];

            for (let i = 0; i < payment.length; i++) {
                const app = payment[i];

                const formattedDate = new Date(app.created_at).toLocaleDateString();

                // Check if the payment mode is one of the specified types
                const transactionId = ["Apple_pay", "Google_pay", "Zelle", "Paypal"].includes(app.payment_mode)
                    ? app.payment_details.transaction_id
                    : "Not Applicable";

                // formate payment packages
                const formatePackages = app.complete_package_details.map(pkg => `${pkg.package_name} ${pkg.package_rate} ${pkg.number}`).join(', ');

                const value = [
                    (i + 1),
                    formattedDate,
                    app.rsvp_status,
                    app.name,
                    app.email,
                    app.phone_code,
                    app.phone,
                    app.member_type,
                    app.no_of_attendees,
                    app.guests.seniors,
                    app.guests.adults,
                    app.guests.minor,
                    formatePackages,
                    app.payment_mode,
                    app.payment_category,
                    app.amount,
                    app.payment_details.transaction_amount,
                    app.payment_details.donation_amount,
                    app.payment_details.concession_amount,
                    transactionId
                ];
                table.push(value);

            }

            const wb = xlsx.utils.book_new();
            const ws = xlsx.utils.aoa_to_sheet(table);
            xlsx.utils.book_append_sheet(wb, ws, 'Event Payments');

            // write options
            const wopts = { bookType: 'xlsx', bookSST: false, type: 'base64' };
            const buffer = xlsx.write(wb, wopts);

            const community = await Communities.findOne({ _id: new ObjectId(communityId) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            // Call Activity log
            await ActivityLogService.activityLogActiion({
                communityId: communityId,
                userId: userId,
                module: "EVENT_PAYMENT",
                action: "EXPORT",
                platForm: "web",
                memberRole: userRole,
                oldData: null,
                newData: null
            })

            return buffer;
        } catch (error) {
            throw error;
        }
    }
}