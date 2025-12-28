"use strict";
require('dotenv').config();
const nodemailer = require("nodemailer");
const ErrorModules = require('../errors');
const library = require('../library/library');
const EmailSmsTemplate = Lib.Model('EmailSmsTemplate');
const Notificationlog = Lib.Model('NotificationLog');
const NotificationSettings = Lib.Model('NotificationSettings');

/* change need to be made here */
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = require('twilio')(accountSid, authToken);
const { Vonage } = require('@vonage/server-sdk')

const vonage = new Vonage({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET
})
const smsFrom = process.env.SMS_HEADER
const smsSenderUs = process.env.SMS_SENDER_US
const FCM = require('./fcm.service')
const helperLibrary = require('../library/library')
let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
});
const notification_options = {
    contentAvailable: true,
    priority: "high",
    timeToLive: 60 * 60 * 24,
    sound: 'default',
    badge: '1',
};

module.exports = {
    // Mail send service
    sendMail: async function (mail_object) {
        try {
            //let testAccount = await nodemailer.createTestAccount();
            // create reusable transporter object using the default SMTP transport

            mail_object.from = mail_object.from ? mail_object.from.toString() : process.env.DEFAULT_EMAIL;
            // send mail with defined transport object
            let info = await transporter.sendMail(mail_object);

            return info;
        } catch (err) {
            console.log(err, "mail error")
            return { status: false, err };
        }


    },
    /* need to make a change in this function*/
    sendSms: async function (phone, message) {
        try {
            return await twilioClient.messages
                .create({
                    body: message,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: phone,

                });
        } catch (err) {
            console.log(err);
            return { staus: false, err };
        }

    },
    // sendSmsVonage: async function (phone, from, message) {
    //     let senderId = phone.startsWith('+1') ? smsSenderUs : smsFrom;
    //     //let smsObj = {phone, from, message}
    //     let smsObj = {
    //         to: phone,
    //         from: senderId,
    //         text: message
    //     }
    //     console.log(smsObj, "<------------")
    //     try {
    //         let response = await vonage.sms.send(smsObj)
    //         console.log(response, "@@@@@@")
    //         return response
    //         //return await vonage.sms.send(smsObj)
    //     } catch (err) {
    //         // console.log(err.response.messages,`line 85`);
    //         return { status: false, err };
    //     }

    // },

    sendSmsVonage: async function (phone, from, message) {
        if (!phone) {
            console.error("sendSmsVonage: phone number is undefined");
            return { status: false, err: "Phone number is undefined" };
        }
        let senderId = phone.startsWith('+1') ? smsSenderUs : smsFrom;
        let smsObj = {
            to: phone,
            from: senderId,
            text: message
        };

        try {
            let response = await vonage.sms.send(smsObj);
            console.log(response, "@@@@@@");
            return response;
        } catch (err) {
            return { status: false, err };
        }
    },

    pushNotification: async function (registration_tokens, payload) {
        try {

            /*return await FCM.messaging().sendMulticast(
                registration_tokens,
                payload,
                notification_options
            );*/

            const firebasePayload = {
                tokens: registration_tokens,
                data: {
                    body: payload.notification.body
                },
                notification: {
                    title: payload.notification.title
                }
            }

            return await FCM.messaging().sendMulticast(firebasePayload);
        } catch (err) {
            //console.log(err.responses[0]['error']);
            return { staus: false, err };
        }
    },
    notifyService: function (_payload) {
        /**
            *
            * @param {{recipient:{
            * email:string | Mail.Address | (string | Mail.Address)[],
            * phone:number | (number)[]
            * bcc?:string | Mail.Address | (String | Mail.Address)[],
            * user_id?:ObjectId
            * },
            * template:{
            * path?:string,
            * type:string,
            * slug:string,
            * lang?:string
            * },
            * contents:{
            * attachment?:Mail.Attachment[]
            * } | any
            * }} _payload
            * @returns {Promise<boolean>}
            *
            */
        /**
         * 1. Get the template data from the database
         * 2. Craft the data with the payload given if provided.
         * 3. Send based on the type
        */

        let payload = JSON.parse(JSON.stringify(_payload));

        return new Promise(async (resolve, reject) => {
            if (Lib.isEmpty(payload)) {
                return reject('Param is missing.');
            }
            if (Lib.isEmpty(payload['recipient'])) {
                return reject('Recipient params are missing.');
            }
            // if (Lib.isEmpty(payload['recipient']['email']) && Lib.isEmpty(payload['recipient']['phone'])) {
            //     return reject('To params are missing.');
            // }
            payload['template']['lang'] = payload['template']['lang'] ? payload['template']['lang'] : 'en';
            payload['recipient']['user_id'] = payload['recipient']['user_id'] ? payload['recipient']['user_id'] : null;
            const isDotCom = payload['isDotCom'] ? payload['isDotCom'] : false;
            const section = payload['section'] ? payload['section'] : null;
            const communityId = payload['communityId'] ? payload['communityId'] : null;
            try {
                let template_data = {};
                let template_id;
                // Get the data from the template
                if (Lib.isEmpty(payload['template'])) {
                    return reject('Template is missing.');
                }
                if (Lib.isEmpty(payload['template']['type'])) {
                    return reject('Db param type is missing.');
                }
                if (payload['recipient']['type'] === "SMS" && Lib.isEmpty(payload['recipient']['phone'])) {
                    return reject('Phone params are missing.');
                }
                if (payload['recipient']['type'] === "Email" && Lib.isEmpty(payload['recipient']['email'])) {
                    return reject('Email params are missing.');
                }
                if (payload['recipient']['type'] === "Push" && Lib.isEmpty(payload['recipient']['Push'])) {
                    return reject('Push params are missing.');
                }
                // if (payload['recipient']['type'] === "All" && Lib.isEmpty(payload['recipient']['All'])) {
                //     return reject('All params are missing.');
                // }
                if (Lib.isEmpty(payload['template']['slug'])) {
                    return reject('Db param slug is missing.');
                }
                let response = await EmailSmsTemplate.findOne({
                    $or: [{ 'type': payload['template']['type'] }, { 'type': "All" }],
                    slug: payload['template']['slug'],
                    is_deleted: false,
                    is_active: true
                });
                if (Lib.isEmpty(response)) {
                    return reject('No template found.');
                }
                template_data = response.toJSON();
                template_id = template_data._id;
                // cheching content language and return accordingly for text
                if (!Lib.isEmpty(template_data.text)) {
                    template_data.text = template_data.text.map(elem => {
                        if (elem.lang === payload['template']['lang']) {
                            return elem.data;
                        }
                    });
                }
                // cheching content language and return accordingly for HTML
                if (!Lib.isEmpty(template_data.html)) {
                    template_data.html = template_data.html.map(elem => {
                        if (elem.lang === payload['template']['lang']) {
                            return elem.data;
                        }
                    });
                }
                // cheching content language and return accordingly for Subject
                if (!Lib.isEmpty(template_data.subject)) {
                    template_data.subject = template_data.subject.map(elem => {
                        if (elem.lang === payload['template']['lang']) {
                            return elem.data;
                        }
                    });
                }
                let attachments = [];
                let toEmail = payload['recipient']['email'], bcc = payload['recipient']['bcc'];
                let toSMS = payload['recipient']['phone'];
                let fcm_token = payload['recipient']['fcmToken']; /*["e9fri5tNR8WeqNM-8EGgXH:APA91bE5sQY9npRfs3UQUP3PMtofx_kzKihn4Ck_7slqhnPVot7CR4iRzRRzA2k2E2egnSZr9zQfE7bQ88d3NkOSAd2VRWI2tXCVWEQdqjcj0y-qGQVRAgwiWl3gQl3C8StILXt1Pdu4"];*/
                let user_id = payload['recipient']['user_id'];
                let text = template_data.text ? template_data.text.toString() : '';
                let html = template_data.html ? template_data.html.toString() : '';
                let subject = template_data.subject ? template_data.subject.toString() : '';

                //If there is any dynamic paramemter in content it will replace with value
                if (!Lib.isEmpty(payload['contents'])) {
                    attachments = payload['contents']['attachments'] ? payload['contents']['attachments'] : [];
                    delete payload['contents']['attachments'];
                    for (const [key, value] of Object.entries(payload['contents'])) {
                        if ((text).includes(`#${key.toUpperCase()}#`)) {
                            text = (text).replace(new RegExp(`#${key.toUpperCase()}#`, 'g'), value);
                        }
                        if ((html).includes(`#${key.toUpperCase()}#`)) {
                            html = (html).replace(new RegExp(`#${key.toUpperCase()}#`, 'g'), value);
                        }
                        if ((subject).includes(`#${key.toUpperCase()}#`)) {
                            subject = (subject).replace(new RegExp(`#${key.toUpperCase()}#`, 'g'), value);
                        }
                    }
                }
                const notificationEnum = Lib.getEnum('NOTIFICATION_TYPE');
                // Sending notification on type value
                if (payload['template']['type'] === notificationEnum.Email) {
                    let mail_object = {
                        to: toEmail,
                        bcc: bcc,
                        subject: subject,
                        text: text,
                        html: html,
                        attachments: attachments
                    };
                    let db_payload = {
                        user_id: user_id,
                        template_id: template_id,
                        recipients: toEmail,
                        subject: subject,
                        html: html ? html : text,
                        response: "",
                        type: payload['template']['type'],
                        image: payload['image']
                    };
                    // apply_template feature is not implemented right now

                    // let apply_template = false;
                    // if (apply_template) {
                    //     let ejs_template = {
                    //         path: 'generic-email-template',
                    //         data: {content: html ? html : text}
                    //     };
                    //     if (!Lib.isEmpty(payload['template']) && !Lib.isEmpty(payload['template']['path'])) {
                    //         // Override path
                    //         ejs_template.path = payload['template']['path'];
                    //     }
                    //     EmailTemplate.render((ejs_template.path || '/'), (ejs_template.data || {})).then(async email_template_response => {
                    //         mail_object.html = email_template_response;
                    //         try {
                    //             let result = await this.sendMail(mail_object);
                    //             db_payload['body'] = html ? email_template_response : text;
                    //             db_payload['response'] = JSON.stringify(result);
                    //             await Notificationlog.create(db_payload);
                    //             return resolve(!!result);
                    //         } catch (e) {
                    //             return reject(e);
                    //         }
                    //     }).catch(error => {
                    //         reject(error);
                    //     });
                    // } else {
                    // Send without template

                    let result = await this.sendMail(mail_object);
                    console.log(result, "result...............")
                    db_payload['response'] = JSON.stringify(result);
                    await Notificationlog.create(db_payload);
                    return resolve(!!result);
                    // }

                } else if (payload['template']['type'] === notificationEnum.sms) {
                    /**
                     * Implement the sms gateway here
                     */
                    let db_payload = {
                        user_id: user_id,
                        template_id: template_id,
                        recipients: toSMS,
                        subject: null,
                        text: text,
                        response: "SMS gateway required.",
                        type: payload['template']['type']
                    };
                    //let resultsms = await this.sendSms(toSMS, text);
                    let resultsms = await this.sendSmsVonage(toSMS, smsFrom, text);
                    db_payload['response'] = JSON.stringify(resultsms);
                    db_payload['status'] = resultsms.status === 'sent';
                    await Notificationlog.create(db_payload);
                    resolve(true);
                } else if (payload['template']['type'] === notificationEnum.Push) {
                    /**
                     * Implementing the notification here
                     */
                    let device_type = template_data['device_type'];
                    let domains = template_data['domains'];
                    let db_payload = {
                        user_id: user_id,
                        template_id: template_id,
                        recipients: fcm_token,
                        subject: subject,
                        sent_at: new Date(),
                        text: text,
                        device_type: device_type,
                        domains: domains,
                        response: "Notification gateway required.",
                        type: payload['template']['type'],
                        image: payload['image'],
                        is_dotcom: isDotCom,
                        section: section,
                        community_id: communityId
                    };
                    payload = {
                        'notification': {
                            'title': `${helperLibrary.stripTags(text)}`,
                            'body': `${helperLibrary.stripTags(text)}`,
                        }
                    };

                    let resultNotifiaction = await this.pushNotification(fcm_token, payload);
                    console.log(resultNotifiaction, "resultNotifiaction........................");
                    db_payload['response'] = JSON.stringify(resultNotifiaction);
                    db_payload['successCount'] = resultNotifiaction.status === 'sent';
                    await Notificationlog.create(db_payload);
                    console.log(db_payload, "db_payload..................");
                    resolve(true);
                } else if (payload['template']['type'] === notificationEnum.All) {
                    let mail_object = {
                        to: toEmail,
                        bcc: bcc,
                        subject: subject,
                        text: text,
                        html: html,
                        attachments: attachments
                    };
                    let db_payload = {
                        user_id: user_id,
                        template_id: template_id,
                        recipients: toEmail,
                        subject: subject,
                        sent_at: new Date(),
                        text: text,
                        response: "Notification gateway required.",
                        type: payload['template']['type'],
                        image: payload['image']
                    };
                    let result = await this.sendMail(mail_object);
                    db_payload['response'] = JSON.stringify(result);
                    await Notificationlog.create(db_payload);

                    let db_sms_payload = {
                        user_id: user_id,
                        template_id: template_id,
                        recipients: toSMS,
                        subject: null,
                        text: text,
                        type: payload['template']['type']
                    };
                    // let resultsms = await this.sendSms(toSMS, text);
                    let resultsms = await this.sendSmsVonage(toSMS, smsFrom, text);
                    db_sms_payload['response'] = JSON.stringify(resultsms);
                    db_sms_payload['status'] = resultsms.status === 'sent';
                    await Notificationlog.create(db_sms_payload);

                    let device_type = template_data['device_type'];
                    let domains = template_data['domains'];
                    let db_payload_push = {
                        user_id: user_id,
                        template_id: template_id,
                        recipients: fcm_token,
                        subject: subject,
                        sent_at: new Date(),
                        text: text,
                        device_type: device_type,
                        domains: domains,
                        response: "Notification gateway required.",
                        type: payload['template']['type'],
                        image: payload['image']
                    };
                    payload = {
                        'notification': {
                            'title': `${helperLibrary.stripTags(text)}`,
                            'body': `${helperLibrary.stripTags(text)}`,
                        }
                    };

                    let resultNotifiaction = await this.pushNotification(fcm_token, payload);
                    db_payload_push['response'] = JSON.stringify(resultNotifiaction);
                    db_payload_push['successCount'] = resultNotifiaction.status === 'sent';
                    await Notificationlog.create(db_payload_push);
                    resolve(true);
                }
                else {
                    // Invalid type passed
                    reject("Invalid type passed");
                }
            } catch (e) {
                console.log(e)
                reject(e);
            }
        });
    },

    notificationSettings: async function (userId, params) {
        const deviceId = params.deviceId;
        const deviceType = params.deviceType;
        const communityEvent = params.communityEvent;
        const communityGroupEvent = params.communityGroupEvent;
        const privateEvent = params.privateEvent;
        const communityAnnouncement = params.communityAnnouncement;
        const communityGroupAnnouncement = params.communityGroupAnnouncement;
        const communityGroupAtivities = params.communityGroupAtivities;
        if (userId) {
            const existIosDevice = await NotificationSettings.findOne({ "device_type": "ios", "user_id": userId });
            const existAndroidDevice = await NotificationSettings.findOne({ "device_type": "android", "user_id": userId });
            const existWebDevice = await NotificationSettings.findOne({ "device_type": "web", "user_id": userId });
            // && Lib.isEmpty(existAndroidDevice) && Lib.isEmpty(existWebDevice))

            // db_payload.device_type = "android";
            // await NotificationSettings.create(db_payload);

            // //create for web
            // db_payload.device_type = "web";
            // await NotificationSettings.create(db_payload);
            if (Lib.isEmpty(existIosDevice)) {
                let db_payload = {
                    user_id: userId,
                    device_id: deviceId,
                    device_type: deviceType ? deviceType : "ios",
                    community_event: communityEvent ? communityEvent : false,
                    community_group_event: communityGroupEvent ? communityGroupEvent : false,
                    private_event: privateEvent ? privateEvent : false,
                    community_announcement: communityAnnouncement ? communityAnnouncement : false,
                    community_group_announcement: communityGroupAnnouncement ? communityGroupAnnouncement : false,
                    community_group_ativities: communityGroupAtivities ? communityGroupAtivities : false
                }
                db_payload.device_type = "ios";
                await NotificationSettings.create(db_payload);

            }
            if (Lib.isEmpty(existAndroidDevice)) {
                let db_payload = {
                    user_id: userId,
                    device_id: deviceId,
                    device_type: deviceType ? deviceType : "ios",
                    community_event: communityEvent ? communityEvent : false,
                    community_group_event: communityGroupEvent ? communityGroupEvent : false,
                    private_event: privateEvent ? privateEvent : false,
                    community_announcement: communityAnnouncement ? communityAnnouncement : fanotificationServiceslse,
                    community_group_announcement: communityGroupAnnouncement ? communityGroupAnnouncement : false,
                    community_group_ativities: communityGroupAtivities ? communityGroupAtivities : false
                }
                db_payload.device_type = "android";
                await NotificationSettings.create(db_payload);
            }
            if (Lib.isEmpty(existWebDevice)) {
                let db_payload = {
                    user_id: userId,
                    device_id: deviceId,
                    device_type: deviceType ? deviceType : "ios",
                    community_event: communityEvent ? communityEvent : false,
                    community_group_event: communityGroupEvent ? communityGroupEvent : false,
                    private_event: privateEvent ? privateEvent : false,
                    community_announcement: communityAnnouncement ? communityAnnouncement : false,
                    community_group_announcement: communityGroupAnnouncement ? communityGroupAnnouncement : false,
                    community_group_ativities: communityGroupAtivities ? communityGroupAtivities : false
                }
                db_payload.device_type = "web";
                await NotificationSettings.create(db_payload);
            }

            //IOS configure edit
            if (existIosDevice) {
                existIosDevice.community_event = communityEvent;
                existIosDevice.community_group_event = communityGroupEvent;
                existIosDevice.private_event = privateEvent;
                existIosDevice.community_announcement = communityAnnouncement;
                existIosDevice.community_group_announcement = communityGroupAnnouncement;
                existIosDevice.community_group_ativities = communityGroupAtivities;

                await existIosDevice.save();
            }


            //Android configure edit
            if (existAndroidDevice) {
                existAndroidDevice.community_event = communityEvent;
                existAndroidDevice.community_group_event = communityGroupEvent;
                existAndroidDevice.private_event = privateEvent;
                existAndroidDevice.community_announcement = communityAnnouncement;
                existAndroidDevice.community_group_announcement = communityGroupAnnouncement;
                existAndroidDevice.community_group_ativities = communityGroupAtivities;

                await existAndroidDevice.save();
            }

            //for web
            if (existWebDevice) {
                existWebDevice.community_event = communityEvent;
                existWebDevice.community_group_event = communityGroupEvent;
                existWebDevice.private_event = privateEvent;
                existWebDevice.community_announcement = communityAnnouncement;
                existWebDevice.community_group_announcement = communityGroupAnnouncement;
                existWebDevice.community_group_ativities = communityGroupAtivities;

                await existWebDevice.save();
            }

            return { error: false, message: "settingsChangedSuccessfully" };
        }
    },

    getNotificationSettings: async function (userId, deviceType) {
        const existDevice = await NotificationSettings.findOne({ "user_id": userId, "is_deleted": false, "device_type": deviceType });
        if (Lib.isEmpty(existDevice)) {
            return { error: true, message: "noSettingsFound", ErrorClass: ErrorModules.Api404Error };
        }
        let data = Lib.reconstructObjectKeys(existDevice);
        return { error: false, message: "generalSuccess", data: data };
    },

    dotComNotificationSeen: async function () {
        try {
            await Notificationlog.updateMany({ is_dotcom: true, is_viewed: false }, { $set: { 'is_viewed': true } });
            return { error: false, message: "generalSuccess" };
        } catch (err) {
            return { error: true, message: "Notification seen eror" };
        }
    }
}