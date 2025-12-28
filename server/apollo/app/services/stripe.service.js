const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const DatabaseError = require('../errors/database.error');
const ErrorModules = require('../errors');
const User = Lib.Model('Users');
const Communities = Lib.Model('Communities');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const CommunityPayment = Lib.Model('CommunityPayment');
const EventPayments = Lib.Model('EventPayment');
const Events = Lib.Model('Events');
const notificationServices = require('./notification.service');


require('dotenv').config();
module.exports = {
    createStripeSubMerchantAcc: async function (data) {
        try {
            const { email, communityId } = data;
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'US',
                email: email
            });

            const communityPayment = await CommunityPayment.findOne({ community_id: new ObjectId(communityId) });

            if (Lib.isEmpty(communityPayment)) {
                return {
                    error: true,
                    message: "Community payment not found.",
                    ErrorClass: ErrorModules.Api404Error,
                };
            }

            communityPayment.stripe_account_id = account.id;
            await communityPayment.save();

            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: 'https://sangarahinet.demoyourprojects.com/dashboard',
                return_url: 'https://sangarahinet.demoyourprojects.com/payment/redirect-link/' + account.id,
                type: 'account_onboarding',
            });

            return { error: false, message: "generalSuccess", statusCode: 200, data: accountLink.url };
        } catch (error) {
            console.log(error);

            return { error: true, message: error.message, statusCode: 500 };
        }
    },
    stripeDashboardLinkGeneration: async function (accountId) {
        try {
            const loginLink = await stripe.accounts.createLoginLink(accountId);

            const communityPayment = await CommunityPayment.findOne({ stripe_account_id: accountId });

            if (Lib.isEmpty(communityPayment)) {
                return {
                    error: true,
                    message: "Community payment not found.",
                    ErrorClass: ErrorModules.Api404Error,
                };
            }

            communityPayment.stripe_account_approval = loginLink ? true : false;
            communityPayment.stripe_account_dashboard = loginLink.url;

            await communityPayment.save();

            return { error: false, message: "generalSuccess", statusCode: 200, data: loginLink };
        } catch (error) {
            console.log(error);

            return { error: true, message: error.message, statusCode: 500 };
        }
    },
    createPaymentntent: async function (req) {
        try {
            const { amount, currency, communityId } = req.body;
            const communityPayment = await CommunityPayment.findOne({ community_id: new ObjectId(communityId) });
            const stripeId = communityPayment.stripe_account_id;
            if (Lib.isEmpty(communityPayment) || !stripeId) {
                return {
                    error: true,
                    message: "Community payment not found.",
                    ErrorClass: ErrorModules.Api404Error,
                };
            }
            const customer = await stripe.customers.create({});
            
            const ephemeralKey = await stripe.ephemeralKeys.create(
                { customer: customer.id },
                { 
                    apiVersion: '2020-08-27',
                }
            );

            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency,
                customer: customer.id,
                transfer_data: {
                    destination: stripeId,
                },
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            
            return {
                error: false,
                message: 'Success.',
                statusCode: 200,
                data: {
                    paymentIntent,
                    ephemeralKey,
                    customer,
                    stripeId
                }
            };
        } catch (error) {
            console.log(error);
            return { error: true, message: error.message, statusCode: 500 };
        }
    },
    createPaymentRefund: async function (req) {
        try {
            const { intentId, communityId, eventId } = req.body;
            const communityPayment = await CommunityPayment.findOne({ community_id: new ObjectId(communityId) });
            const eventPayment = await EventPayments.findOne({ 'event_id': new ObjectId(eventId), 'payment_details.transaction_id': intentId });
            const userId = eventPayment.user_id;
            const userDetails = await User.findOne({_id: new ObjectId(userId)})
            const userName = userDetails.name;
            const userEmail = userDetails.contact.email.address;
            const userDilerCode = userDetails.contact.phone.phone_code;
            const userPhoneNo = userDetails.contact.phone.number;
            const to = userDilerCode + userPhoneNo;
            // Community Details
            const community = await Communities.findOne({
                _id: ObjectId(communityId),
                is_deleted: false,
                is_active: true
            })
            const communityName = community.community_name;
            const communtiyEmail = community.community_email;
            // event Details
            const event = await Events.findOne({
                _id: ObjectId(eventId),
                is_deleted: false,
                is_active: true
            })
            const eventName = event.title;
            const eventNumber = event.venue_details.phone_no;
            const eventDate = event.date.from
            const eventAddress = event.venue_details.first_address_line;
            const formattedDate = eventDate.toISOString().split('T')[0];
            const currentDate = new Date().toISOString().split('T')[0];

            const transactionAmount = eventPayment.payment_details.transaction_amount;
            const transactionId = eventPayment.payment_details.transaction_id;
            const transactionDate = eventPayment.payment_details.created_at;
            const formateTransactionDate = transactionDate.toISOString().split('T')[0];
            // Check SMS and Email Settings are enabled
            const { sms_settings, email_settings } = community.sms_email_global_settings;
            
            // Check SMS and Email Balance
            const { sms_credits_remaining, email_credits_remaining } = community;


            if (Lib.isEmpty(communityPayment) || !communityPayment.stripe_account_id) {
                return {
                    error: true,
                    message: "Community payment not found.",
                    ErrorClass: ErrorModules.Api404Error,
                };
            }

            if (Lib.isEmpty(eventPayment)) {
                return {
                    error: true,
                    message: "Event payment not found.",
                    ErrorClass: ErrorModules.Api404Error,
                };
            }

            const refund = await stripe.refunds.create({
                payment_intent: intentId,
            });
            eventPayment.rsvp_status = 'refunded';
            await eventPayment.save();

            let smspayload;
            let emailpayload;

            smspayload = {
                recipient: 
                {
                    phone: to
                },
                template: {
                    type: "SMS",
                    slug: "REFUND_EVENT_SMS",
                    lang: "en"
                },
                contents: {
                    MEMBERNAME: userName,
                    DATEOFTRANSACTION: formateTransactionDate,
                    REFUNDAMOUNT: transactionAmount,
                    TRANSACTIONID: transactionId,
                    CREATEDAT: currentDate,
                    COMMUNITYEMAIL: communtiyEmail,
                    EVENTNUMBER: eventNumber,
                }
            }
            // send notifications if sms & email settings are enabled
            if (sms_settings && sms_credits_remaining > 0 && smspayload) {
                await notificationServices.notifyService(smspayload);
                if (sms_credits_remaining > 0) {
                    community.sms_credits_remaining = sms_credits_remaining - 1;
                    await community.save();
                }
            }
            emailpayload = {
                recipient: 
                {
                    email: userEmail
                },
                template: {
                    type: "Email",
                    slug: "REFUND_EVENT_EMAIL",
                    lang: "en"
                },
                contents: {
                    MEMBERNAME: userName,
                    DATEOFTRANSACTION: formateTransactionDate,
                    REFUNDAMOUNT: transactionAmount,
                    COMMUNITYNAME: communityName,
                    EVENTNAME: eventName,
                    EVENTDATE: formattedDate,
                    EVENTADDRESS: eventAddress,
                    TRANSACTIONID: transactionId,
                    AMOUNT: transactionAmount,
                    CREATEDAT: currentDate,
                    COMMUNITYEMAIL: communtiyEmail,
                    EVENTNUMBER: eventNumber,
                }
            }
            if (email_settings && email_credits_remaining > 0 && emailpayload) {
                await notificationServices.notifyService(emailpayload);
                if (email_credits_remaining > 0) {
                    community.email_credits_remaining = email_credits_remaining - 1;
                    await community.save();
                }
            }
            

            return { error: false, message: 'Success.', statusCode: 200, data: { refund } };
        } catch (error) {
            console.log(error);
            return { error: true, message: "Unable to process the refund.", statusCode: 500 };
        }
    }

}