const FeedbackSubject = Lib.Model('FeedbackSubject');
const Feedback = Lib.Model('Feedbacks');
const DatabaseError = require('../errors/database.error');
const ErrorModules = require('../errors');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const notificationServices = require('./notification.service');
const Notificationlog = Lib.Model('NotificationLog');

module.exports = {
    getAllSubjects: async function (lang) {
        try {
            let language = 'en';
            if (!Lib.isEmpty(lang)) {
                language = lang;
            }
            const subjects = await FeedbackSubject.aggregate([
                {
                    '$match': {
                        "is_deleted": false,
                        "is_active": true
                    }
                }, {
                    '$unwind': {
                        path: "$subject",
                    }
                }, {
                    '$match': {
                        "subject.lang": language
                    }
                }
            ]);
            if (Lib.isEmpty(subjects)) {
                return { error: true, message: "noSubjectFound", ErrorClass: ErrorModules.Api404Error };
            }
            return ({ error: false, message: "generalSuccess", data: Lib.reconstructObjectKeys(subjects) });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Subjects find error");
        }
    },

    createFeedback: async function (params, userData) {
        try {
            const { user, userId } = userData;
            const feedbackPayload = {};
            let name;
            let email;
            let number;
            let phone_code;
            let country_code;
            let message = params.message;
            //let subjectId = new ObjectId(params.subjectId);
            if (!Lib.isEmpty(userId)) {
                feedbackPayload['user_id'] = new ObjectId(user._id);
                name = user.name;
                email = user.contact && user.contact.email ? user.contact.email.address : '';
                number = user.contact && user.contact.phone ? user.contact.phone.number : '';
                phone_code = user.contact && user.contact.phone ? user.contact.phone.phone_code : '';
                country_code = user.contact && user.contact.phone ? user.contact.phone.country_code : '';
            } else if (Lib.isEmpty(params.email)) {
                return ({ error: true, message: "fieldEmailRequired", ErrorClass: ErrorModules.ValidationError });
            } else {
                name = params.name ? params.name : '';
                email = params.email;
                number = params.number ? params.number : '';
                phone_code = params.phoneCode ? params.phoneCode : '';
                country_code = params.countryCode ? params.countryCode : '';
            }
            feedbackPayload['name'] = name;
            feedbackPayload['email'] = email;
            feedbackPayload['phone'] = {
                number: number,
                phone_code: phone_code,
                country_code: country_code,
            };

            if (message.length > 500) {
                return ({ error: true, message: "moreThan500Characters" });
            }

            feedbackPayload['message'] = message;
            feedbackPayload['subject_id'] = "";

            const feedback = new Feedback(feedbackPayload);
            let res = await feedback.save();

            //For now feedback mail functionality is off

            /**
             * Sending Email
             */

            const payload = {
                recipient:
                {
                    email: email,
                    user_id: userId
                },
                template: {
                    type: "Email",
                    slug: "feedback",
                    lang: "en"
                },
                contents: {
                    NAME: name,
                }
            }
            //Sending Email
            /**
             * Sending Admin notify Email
             */

            const adminPayload = {
                recipient:
                {
                    email: "sangaraahi@mailiantor.com", // for test ony
                    user_id: userId
                },
                template: {
                    type: "Email",
                    slug: "feedback-admin",
                    lang: "en"
                },
                contents: {
                    NAME: name,
                    EMAIL: email,
                    PHONE_CODE: phone_code || "N/A",
                    PHONE: number || "N/A"
                }
            }
            //Sending Email
            /*notificationServices.notifyService(payload).then(r => {}).catch(e => {
                console.log(e)});
            notificationServices.notifyService(adminPayload).then(r => {}).catch(e => {
                console.log(e)});*/
            return ({ error: false, message: "feedbackSendSuccess" });
        } catch (e) {
            clog(e);
            return { error: true, message: "internalServerError", stack: e };
        }

    },

    getAllFeedbacks: async function (params) {
        let page;
        if (params && params.page) {
            page = parseInt(params.page);
        } else {
            page = 1;
        }
        // define limit per page
        const limit = 10;
        const skip = (page - 1) * limit;
        let feedbackAggregate = [
            {
                '$match': {
                    "is_deleted": false
                }
            }, {
                '$lookup': {
                    from: "sr_feedback_subjects",
                    localField: "subject_id",
                    foreignField: "_id",
                    as: "subject"
                }
            }, {
                '$unwind': {
                    path: "$subject",
                }
            }, {
                '$unwind': {
                    path: "$subject.subject",
                }
            }, {
                '$match': {
                    "subject.subject.lang": "en"
                }
            }, {
                '$project': {
                    "name": 1,
                    "email": 1,
                    "phone.number": 1,
                    "message": 1,
                    "is_active": 1,
                    "subject": 1,
                    "created_at": 1,
                    "is_replied": 1
                }

            }, {
                '$sort': {
                    'created_at': -1
                }
            },
        ];
        const feedbacks = await Feedback.aggregate(feedbackAggregate).skip(skip).limit(limit);
        console.log(feedbacks,"feedbacks.>>>>>>>>>>>>>>>>>>>>>>...................");
        const total = await Feedback.aggregate(feedbackAggregate);
        let from = 0;
        let to = 0;
        if (feedbacks.length > 0) { // after query in db with pagination at least 1 data found
            from = ((page - 1) * limit) + 1;
            //console.log(from,"from");
            to = (feedbacks.length <= limit) ? (from + feedbacks.length - 1) : (page * limit);
            //console.log(to,"tooooo");
        }
        // if(Lib.isEmpty(feedbacks)) {
        //     return {error:true, message:"noFeedbackFound", ErrorClass:ErrorModules.Api404Error};
        // }
        return ({
            error: false,
            message: "generalSuccess",
            total: total.length,
            from: from,
            to: to,
            data: Lib.reconstructObjectKeys(feedbacks)
        });
    },

    replyFeedback: async function (user, feedbackId, replyMessage) {
        if (user.user_type !== 'admin') {
            return ({ error: true, message: "permissionDenied", ErrorClass: ErrorModules.AuthError });
        }
        const feedback = await Feedback.findOne({ is_deleted: false, _id: new ObjectId(feedbackId) });
        if (Lib.isEmpty(feedback)) {
            return { error: true, message: "noSubjectFound", ErrorClass: ErrorModules.Api404Error };
        }

        /**
         * Sending Email
         */

        // let mail_object = {
        //     to: feedback.email,
        //     subject: "Reply to you feedback",
        //     html: replyMessage
        // };
        // let db_payload = {
        //     user_id: feedback.user_id ? feedback.user_id : '',
        //     template_id: '',
        //     recipients: feedback.email,
        //     subject: "Reply to you feedback",
        //     html: replyMessage,
        //     response: "",
        //     type: "Email"
        // };
        // let result = await notificationServices.sendMail(mail_object);
        // db_payload['response'] = JSON.stringify(result);
        // await Notificationlog.create(db_payload);

        feedback.is_replied = true;
        await feedback.save();
        return ({ error: false, message: "replySuccess" });

    },
    deleteFeedback: async function (id, type) {
        const FeedbackObj = {
            "is_deleted": true
        }
        if (type == 'admin') {
            let updateFeedback = await Feedback.findOneAndUpdate({ _id: ObjectId(id) }, { "$set": FeedbackObj });
            return ({ error: false, message: "generalSuccess", data: updateFeedback });
        } else {
            throw new ErrorModules.DatabaseError("User does not have the permission to delete.");
        }
    },
}