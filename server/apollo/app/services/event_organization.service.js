const Events = Lib.Model('Events');
const Communities = Lib.Model('Communities');
const User = Lib.Model('Users');
const EventPayments = Lib.Model('EventPayment');
const EventTask = Lib.Model('EventTask');
const EventSupplierManagement = Lib.Model('EventSupplierManagement');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const ErrorModules = require('../errors');
const UserService = require('./user.service');
const jwt = Lib.getModules('jwt');

const NotificationSettings = Lib.Model('NotificationSettings');
const EventPayment = Lib.Model('EventPayment');
const notificationHelper = require('../library/notifiaction.helper');
const notificationServices = require('./notification.service');

module.exports = {
    getMyCommunityEvents: async function (params, id) {
        try {
            let page;
            if (params && params.page) {
                page = parseInt(params.page);
            } else {
                page = 1;
            }
            // define limit per page
            const limit = params.limit ? params.limit : 10;
            const skip = (page - 1) * limit;

            let sortObject = { 'created_at': -1 };
            let key = "date.from";
            let sort = 1;
            if (params && params.columnName && params.sort) {
                if (params.columnName === 'EventName') {
                    key = 'title';
                } else if (params.columnName === 'DateSort') {
                    key = 'created_at';
                }
                if (params.sort === 'asc') {
                    sort = 1; // sort a to z
                } else if (params.sort === 'desc') {
                    sort = -1; //sort z to a
                }
                // TODO Add Community Name wise sorting functionality
            }
            sortObject[key] = sort;
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);
            const date_from = {
                'date.from': {
                    '$gte': startOfDay,
                    '$lte': endOfDay
                },
            }
            eventAggregate = [
                {
                    '$match': {
                        'is_deleted': false,
                        'community_id': mongoose.Types.ObjectId(id), // filter for the desired community ID
                        // 'date.from': {
                        //     '$gte': startOfDay,
                        //     '$lte': endOfDay
                        // },
                        $or: [
                            {
                                recurring_event: false,
                                main_recurring_event: false
                            },
                            {
                                recurring_event: true,
                                main_recurring_event: true
                            }
                        ]
                    }
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
                    '$lookup': {
                        'from': 'sr_communities',
                        'localField': 'community_id',
                        'foreignField': '_id',
                        'as': 'community'
                    }
                },
                {
                    '$unwind': {
                        'path': '$user'
                    },
                },
                {
                    '$addFields': {
                        'host_id': '$user.name',
                    }
                },
                {
                    '$unwind': {
                        'path': '$community'
                    },
                },
                //{
                //     '$addFields': {
                //       'is_active': {
                //         $cond: [
                //           { $lt: ["$time.to", new Date()] }, 
                //           'past',
                //           {
                //             $cond: [
                //               { $eq: ["$is_active", true] }, 
                //               'active', 
                //               'inactive'
                //             ]
                //           }
                //         ]
                //       }
                //     }
                //   },
                {
                    '$addFields': {
                        'is_active': {
                            $cond: [
                                { $lt: ["$time.to", new Date()] },
                                'past',
                                {
                                    $cond: [
                                        { $eq: ["$is_active", true] },
                                        'active',
                                        'inactive'
                                    ]
                                }
                            ]
                        },
                    }
                },
                { $sort: { created_at: -1 } },
            ];
            if (params && params.eventType && !params.isAppPortal) {
                if (params.eventType == 'Past') {
                    eventAggregate[0]['$match']['time.to'] = { '$lt': new Date() };
                } else if (params.eventType == 'Upcoming') {
                    eventAggregate[0]['$match']['time.from'] = { '$gt': new Date() };
                }
                else {
                    eventAggregate[0]['$match']['time.to'] = { '$gt': new Date() };
                    eventAggregate[0]['$match']['invitation_type'] = (params.eventType == 'Public') ? 'Public' : 'Members';
                }
            }
            if (params.isAppPortal) {
                eventAggregate[0]['$match']['time.to'] = { '$gt': new Date() };
                eventAggregate[0]['$match']['invitation_type'] = { $in: params.eventType };
            }

            if (params.ongoing) {
                eventAggregate[0]['$match'] = {...eventAggregate[0]['$match'], ...date_from}
            }
            if (params && params.search) {
                eventAggregate[0]['$match']['title'] = {
                    $regex: `.*${params.search}.*`,
                    $options: 'i'
                };
            }
            // if (params && typeof params.isActive === 'boolean') {
            //     eventAggregate[0]['$match']['is_active'] = params.isActive
            // }
            if (params && params.isActive) {
                if (params.isActive === 'past') {
                    eventAggregate[0]['$match']['time.to'] = { '$lt': new Date() };
                } else if (params.isActive === 'active') {
                    eventAggregate[0]['$match']['is_active'] = true;
                    eventAggregate[0]['$match']['time.to'] = { '$gt': new Date() };
                } else if (params.isActive === 'inactive') {
                    eventAggregate[0]['$match']['is_active'] = false;
                    eventAggregate[0]['$match']['time.to'] = { '$gt': new Date() };
                }
            }
            if (params && typeof params.isCancelled === 'boolean') {
                eventAggregate[0]['$match']['is_cancelled'] = params.isCancelled;
            }

            const events = await Events.aggregate(eventAggregate).collation({ 'locale': 'en' }).sort(sortObject).skip(skip).limit(limit);
            const total = await Events.aggregate(eventAggregate);

            let from = 0;
            let to = 0;
            // const of = total;
            if (events.length > 0) { // after query in db with pagination at least 1 data found
                from = ((page - 1) * limit) + 1;
                to = (events.length <= limit) ? (from + events.length - 1) : (page * limit);
            }
            return ({
                error: false,
                message: "generalSuccess",
                total: total.length,
                from: from,
                to: to,
                data: events
            });
        } catch (e) {
            clog(e);
            throw new ErrorModules.DatabaseError("Events find error");
        }
    },
    getMyCommunityEventsList: async function (params, id) {
        try {
            let page;
            if (params && params.page) {
                page = parseInt(params.page);
            } else {
                page = 1;
            }
            // define limit per page
            const limit = params.limit ? params.limit : 10;
            const skip = (page - 1) * limit;

            let sortObject = { 'created_at': -1 };
            let key = "date.from";
            let sort = 1;
            if (params && params.columnName && params.sort) {
                if (params.columnName === 'EventName') {
                    key = 'title';
                } else if (params.columnName === 'DateSort') {
                    key = 'created_at';
                }
                if (params.sort === 'asc') {
                    sort = 1; // sort a to z
                } else if (params.sort === 'desc') {
                    sort = -1; //sort z to a
                }
                // TODO Add Community Name wise sorting functionality
            }
            sortObject[key] = sort;
            eventAggregate = [
                {
                    '$match': {
                        'is_deleted': false,
                        'community_id': mongoose.Types.ObjectId(id),
                        'recurring_event': false,
                        'main_recurring_event': false
                    }
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
                    '$lookup': {
                        'from': 'sr_communities',
                        'localField': 'community_id',
                        'foreignField': '_id',
                        'as': 'community'
                    }
                },
                {
                    '$unwind': {
                        'path': '$user'
                    },
                },
                {
                    '$addFields': {
                        'host_id': '$user.name',
                    }
                },
                {
                    '$unwind': {
                        'path': '$community'
                    },
                },
                //{
                //     '$addFields': {
                //       'is_active': {
                //         $cond: [
                //           { $lt: ["$time.to", new Date()] }, 
                //           'past',
                //           {
                //             $cond: [
                //               { $eq: ["$is_active", true] }, 
                //               'active', 
                //               'inactive'
                //             ]
                //           }
                //         ]
                //       }
                //     }
                //   },
                {
                    '$addFields': {
                        'is_active': {
                            $cond: [
                                { $lt: ["$time.to", new Date()] },
                                'past',
                                {
                                    $cond: [
                                        { $eq: ["$is_active", true] },
                                        'active',
                                        'inactive'
                                    ]
                                }
                            ]
                        },
                    }
                },
                { $sort: { created_at: -1 } },
            ];
            if (params && params.eventType && !params.isAppPortal) {
                if (params.eventType == 'Past') {
                    eventAggregate[0]['$match']['time.to'] = { '$lt': new Date() };
                } else if (params.eventType == 'Upcoming') {
                    eventAggregate[0]['$match']['time.from'] = { '$gt': new Date() };
                }
                else {
                    eventAggregate[0]['$match']['time.to'] = { '$gt': new Date() };
                    eventAggregate[0]['$match']['invitation_type'] = (params.eventType == 'Public') ? 'Public' : 'Members';
                }
            }
            if (params.isAppPortal) {
                eventAggregate[0]['$match']['time.to'] = { '$gt': new Date() };
                eventAggregate[0]['$match']['invitation_type'] = { $in: params.eventType };
            }

            if (params && params.search) {
                eventAggregate[0]['$match']['title'] = {
                    $regex: `.*${params.search}.*`,
                    $options: 'i'
                };
            }
            // if (params && typeof params.isActive === 'boolean') {
            //     eventAggregate[0]['$match']['is_active'] = params.isActive
            // }
            if (params && params.isActive) {
                if (params.isActive === 'past') {
                    eventAggregate[0]['$match']['time.to'] = { '$lt': new Date() };
                } else if (params.isActive === 'active') {
                    eventAggregate[0]['$match']['is_active'] = true;
                    eventAggregate[0]['$match']['time.to'] = { '$gt': new Date() };
                } else if (params.isActive === 'inactive') {
                    eventAggregate[0]['$match']['is_active'] = false;
                    eventAggregate[0]['$match']['time.to'] = { '$gt': new Date() };
                }
            }
            if (params && typeof params.isCancelled === 'boolean') {
                eventAggregate[0]['$match']['is_cancelled'] = params.isCancelled;
            }

            const events = await Events.aggregate(eventAggregate).collation({ 'locale': 'en' }).sort(sortObject).skip(skip).limit(limit);
            const total = await Events.aggregate(eventAggregate);

            let from = 0;
            let to = 0;
            // const of = total;
            if (events.length > 0) { // after query in db with pagination at least 1 data found
                from = ((page - 1) * limit) + 1;
                to = (events.length <= limit) ? (from + events.length - 1) : (page * limit);
            }
            return ({
                error: false,
                message: "generalSuccess",
                total: total.length,
                from: from,
                to: to,
                data: events
            });
        } catch (e) {
            clog(e);
            throw new ErrorModules.DatabaseError("Events find error");
        }
    },
    getMyCommunityEventsForBlog: async function (params, id) {
        try {

            let sortObject = {};
            let key = "created_at";
            let sort = -1;
            if (params && params.columnName && params.sort) {
                if (params.columnName === 'EventName') {
                    key = 'title';
                }
                if (params.sort === 'asc') {
                    sort = 1;
                }
                // TODO Add Community Name wise sorting functionality
            }
            sortObject[key] = sort;
            eventAggregate = [
                {
                    '$match': {
                        'is_deleted': false,
                        'community_id': mongoose.Types.ObjectId(id) // filter for the desired community ID
                    }
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
                    '$lookup': {
                        'from': 'sr_communities',
                        'localField': 'community_id',
                        'foreignField': '_id',
                        'as': 'community'
                    }
                },
                {
                    '$unwind': {
                        'path': '$user'
                    },
                },
                {
                    '$addFields': {
                        'host_id': '$user.name',
                    }
                },
                {
                    '$unwind': {
                        'path': '$community'
                    },
                },
                //{
                //     '$addFields': {
                //       'is_active': {
                //         $cond: [
                //           { $lt: ["$time.to", new Date()] }, 
                //           'past',
                //           {
                //             $cond: [
                //               { $eq: ["$is_active", true] }, 
                //               'active', 
                //               'inactive'
                //             ]
                //           }
                //         ]
                //       }
                //     }
                //   },
                {
                    '$addFields': {
                        'is_active': {
                            $cond: [
                                { $lt: ["$time.to", new Date()] },
                                'past',
                                {
                                    $cond: [
                                        { $eq: ["$is_active", true] },
                                        'active',
                                        'inactive'
                                    ]
                                }
                            ]
                        },
                    }
                }
            ];

            const events = await Events.aggregate(eventAggregate).collation({ 'locale': 'en' }).sort(sortObject);

            return ({
                error: false,
                message: "generalSuccess",
                data: events
            });
        } catch (e) {
            clog(e);
            throw new ErrorModules.DatabaseError("Events find error");
        }
    },
    myCommunitydeleteEvent: async function (id, UserId) {
        try {
            const EventObj = {
                "is_deleted": true
            }
            let updateEvent = await Events.findOneAndUpdate({ _id: ObjectId(id), user_id: UserId }, { "$set": EventObj });
            return ({ error: false, message: "generalSuccess", data: updateEvent });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Event find error");
        }
    },
    myCommunityupdateEvent: async function (id, params, context) {
        // try { 
        const user = await User.findOne({ _id: context.user.id });
        const event = await Events.findOne({ _id: id });
        if (user) {
            event.title = params.title ? params.title : event.title;
            event.type = params.type ? params.type : event.type;
            event.description = params.description ? params.description : event.description;
            event.image = params.image ? params.image : null;
            // event.phoneNo = params.phoneNo ? params.phoneNo : event.phone_no;
            event.logo_image = params.logoImage ? params.logoImage : null;
            event.invitation_type = params.invitationType ? params.invitationType : event.invitation_type;
            // event.post_event_as_community = params.postEventAsCommunity ? params.postEventAsCommunity : event.post_event_as_community;
            event.post_event_as_community = typeof params.postEventAsCommunity !== 'undefined' ? params.postEventAsCommunity : event.post_event_as_community;
            //Venue details update 
            if (params.venueDetails && params.venueDetails.city) {
                event.venue_details.city = params.venueDetails.city;
            }
            if (params.venueDetails && params.venueDetails.state) {
                event.venue_details.state = params.venueDetails.state;
            }
            if (params.venueDetails && params.venueDetails.country) {
                event.venue_details.country = params.venueDetails.country;
            }
            if (params.venueDetails && params.venueDetails.zipcode) {
                event.venue_details.zipcode = params.venueDetails.zipcode;
            }
            if (params.venueDetails && params.venueDetails.phoneNo) {
                event.venue_details.phone_no = params.venueDetails.phoneNo;
            }
            if (params.venueDetails && params.venueDetails.phoneCode) {
                event.venue_details.phone_code = params.venueDetails.phoneCode;
            }
            if (params.venueDetails && params.venueDetails.first_address_line) {
                event.venue_details.first_address_line = params.venueDetails.first_address_line;
            }
            if (params.venueDetails && params.venueDetails.second_address_line) {
                event.venue_details.second_address_line = params.venueDetails.second_address_line;
            }
            //event.venue_details.city                = params.venueDetails.city ? params.venueDetails.city : event.venue_details.city; 
            // event.venue_details.state               = params.venueDetails.state ? params.venueDetails.state : event.venue_details.state; 
            // event.venue_details.country             = params.venueDetails.country ? params.venueDetails.country : event.venue_details.country; 
            // event.venue_details.zipcode             = params.venueDetails.zipcode ? params.venueDetails.zipcode : event.venue_details.zipcode; 
            // event.venue_details.phone_no            = params.venueDetails.phoneNo ? params.venueDetails.phoneNo : event.venue_details.phone_no; 
            // event.venue_details.first_address_line  = params.venueDetails.firstAddressLine ? params.venueDetails.firstAddressLine : event.venue_details.first_address_line; 
            // event.venue_details.second_address_line = params.venueDetails.secondAddressLine ? params.venueDetails.secondAddressLine : event.venue_details.second_address_line; 
            // //Date Update 
            const toTimeDate = params.date && params.date.to ? new Date(Date.parse(params.date.to)) : event.date.to;
            const fromTimeDate = params.date && params.date.from ? new Date(Date.parse(params.date.from)) : event.date.from;
            if (fromTimeDate.getTime() > toTimeDate.getTime()) {
                return ({ error: true, message: "From date should not be greater than to date." });
            }
            const rsvpEnd = params.rsvpEndTime ? new Date(Date.parse(params.rsvpEndTime)) : event.rsvp_end_time;

            event.date.to = toTimeDate.toISOString();
            event.date.from = fromTimeDate.toISOString();
            //Time Update 
            if (params.time && params.time.to) {
                let to = params.time.to;

                const toArray = to.split(":");

                toTimeDate.setUTCHours(toArray[0]);
                toTimeDate.setUTCMinutes(toArray[1]);

                event.time.to = toTimeDate.toISOString();
            } else {
                event.time.to = event.time.to;
            }
            if (params.time && params.time.from) {
                let from = params.time.from;

                const fromArray = from.split(":");

                fromTimeDate.setUTCHours(fromArray[0]);
                fromTimeDate.setUTCMinutes(fromArray[1]);

                event.time.from = fromTimeDate.toISOString();
            } else {
                event.time.from = event.time.from;
            }
            const today = new Date().getTime();
            // if(fromTimeDate.getTime() < today || toTimeDate.getTime() < today || rsvpEnd.getTime() < today){
            //     return ({error: true, message: "noPastDate"});
            // }
            if (rsvpEnd.getTime() > fromTimeDate.getTime()) {
                return ({ error: true, message: "rsvpEndGreaterStartEvent" });
            }

            event.rsvp_end_time = params.rsvpEndTime ? rsvpEnd.toISOString() : event.rsvp_end_time;
            //Attendess update 

            if (params.restrictNumberAttendees == true) {
                event.attendees.is_restricted = true;
            } else {
                event.attendees.is_restricted = false;
            }
            if (params.attendeeListVisibilty == false) {
                event.attendees.attendees_list_visibility = "Public";
            } else {
                event.attendees.attendees_list_visibility = "Host";
            }
            if (params.collectEventPhotos == true) {
                event.attendees.media_upload_by_attendees = true;
            } else {
                event.attendees.media_upload_by_attendees = false;
            }
            if (params.numberOfMaxAttendees) {
                event.attendees.number_of_max_attendees = params.numberOfMaxAttendees;
            }
            event.attendees.is_active = true;
        }
        const updateEvent = await event.save();
        return ({ error: false, message: "eventUpdateSuccess", data: updateEvent });

    },
    // Unassigned event users for community
    getAvailableEventUser: async function (id) {
        try {
            const event = await Events.findOne({
                _id: ObjectId(id),
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
            if (!community) {
                return ({ error: true, message: "Community not found", data: null });
            }
            const eventMember = [];
            event.members.map(x => {
                eventMember.push(x.user_id.toString());
            });
            const communityMember = [];
            community.members.map(x => {
                if (x.is_approved && x.is_active && !x.is_deleted) {
                    communityMember.push(x.member_id.toString());
                }
            });
            const leftMembers = Lib.distinctArray(communityMember, eventMember).map(id => ObjectId(id));
            if (leftMembers.length === 0) return { error: false, message: "generalSuccess", data: [] };
            const user = await User.find({
                _id: { $in: leftMembers },
                is_deleted: false,
                is_active: true
            });
            return ({ error: false, message: "generalSuccess", data: user });
        } catch (e) {
            clog(e);
            throw new ErrorModules.FatalError("internalServerError");
        }
    },
    getEventsCardDetails: async function (communityId) {
        const paidEvents = await Events.find({
            "community_id": new ObjectId(communityId),
            "is_deleted": false,
            "is_active": true,
            "payment_status": "Paid"
        }).count();

        const freeEvents = await Events.find({
            "community_id": new ObjectId(communityId),
            "is_deleted": false,
            "is_active": true,
            "payment_status": "Free"
        }).count();

        const eventPayment = await Events.aggregate([
            {
                '$match': {
                    "community_id": new ObjectId(communityId)
                }
            },
            {
                '$lookup': {
                    'from': "sr_event_payments",
                    'localField': "_id",
                    'foreignField': "event_id",
                    'as': "payment"
                }
            },
            {
                '$unwind': {
                    'path': "$payment",
                    'preserveNullAndEmptyArrays': true
                },
            },
            {
                '$match': {
                    "payment.rsvp_status": "paid"
                }
            },
            {
                '$group': {
                    '_id': '$_id',
                    'totalcount': { $sum: "$payment.payment_details.transaction_amount" }
                }
            }
        ]);
        let totalPayment = 0;
        if (!Lib.isEmpty(eventPayment)) {
            totalPayment = eventPayment.reduce((accumulator, object) => {
                return accumulator + object.totalcount;
            }, 0);
        }

        return ({
            error: false,
            message: "generalSuccess",
            data: {
                totalPayment,
                paidEvents: paidEvents,
                freeEvents: freeEvents
            }
        });
    },
    getEventPaymentCardDetails: async function (eventId) {
        const eventPayment = await EventPayments.aggregate([
            {
                '$match': {
                    "event_id": new ObjectId(eventId),
                    "is_deleted": false
                }
            },
            {
                '$group': {
                    '_id': '$_id',
                    'totalcount': { $sum: "$payment_details.transaction_amount" },
                    'donationTotal': { $sum: "$payment_details.donation_amount" },
                    'concessionTotal': { $sum: "$payment_details.concession_amount" }
                }
            }
        ]);
        let totalPayment = 0;
        let totalDonation = 0;
        let totalConcession = 0;
        if (eventPayment[0]) {
            totalPayment = eventPayment[0].totalcount ? eventPayment[0].totalcount : 0;
            totalDonation = eventPayment[0].donationTotal ? eventPayment[0].donationTotal : 0;
            totalConcession = eventPayment[0].concessionTotal ? eventPayment[0].concessionTotal : 0;
        }

        const rsvpTotal = await Events.aggregate([
            {
                '$match': {
                    "_id": new ObjectId(eventId)
                }
            },
            {
                '$unwind': {
                    'path': "$rsvp",
                },
            },
            {
                '$match': {
                    'rsvp.status': { '$ne': "No_Reply" }
                }
            },
        ]);

        const nonrsvpTotal = await Events.aggregate([
            {
                '$match': {
                    "_id": new ObjectId(eventId)
                }
            },
            {
                '$unwind': {
                    'path': "$rsvp",
                },
            },
            {
                '$match': {
                    'rsvp.status': "No_Reply"
                }
            },
        ]);

        const tentativelyrsvpTotal = await Events.aggregate([
            {
                '$match': {
                    "_id": new ObjectId(eventId)
                }
            },
            {
                '$unwind': {
                    'path': "$rsvp",
                },
            },
            {
                '$match': {
                    'rsvp.status': "No_Reply"
                }
            },
        ]);

        const cancelrsvpTotal = await Events.aggregate([
            {
                '$match': {
                    "_id": new ObjectId(eventId)
                }
            },
            {
                '$unwind': {
                    'path': "$rsvp",
                },
            },
            {
                '$match': {
                    'rsvp.status': "Not_Attending"
                }
            },
        ]);

        const openTask = await EventTask.count({
            event_id: new ObjectId(eventId),
            is_deleted: false,
            task_start_date: { '$gt': new Date() }
        });

        const eventSupplies = await EventSupplierManagement.count({
            event_id: new ObjectId(eventId),
            is_deleted: false,
            required_date: { '$gt': new Date() }
        });
        return ({
            error: false,
            message: "generalSuccess",
            data: {
                totalAmount: totalPayment,
                totalDonation,
                totalConcession,
                rsvpTotal: rsvpTotal.length,
                nonrsvpTotal: nonrsvpTotal.length,
                tentativelyrsvpTotal: tentativelyrsvpTotal.length,
                cancelrsvpTotal: cancelrsvpTotal.length,
                openTask: openTask,
                eventSupplies: eventSupplies
            }
        });
    },

    acceptOrRejectOrgEvent: async function (data) {
        try {
            const attending = data.status === 'Attending' ? true : false;
            const packageDetails = data.packageDetails;

            //Numbers of guests
            let numberSeniors = data.numberSeniors ? data.numberSeniors : 0;
            let numberAdults = data.numberAdults ? data.numberAdults : 0;
            let numberChildren = data.numberChildren ? data.numberChildren : 0;
            let incomingTotal = numberSeniors + numberAdults + numberChildren;
            let total = numberSeniors + numberAdults + numberChildren;

            if (attending && total === 0) {
                return {
                    error: true,
                    message: 'Guests is required if you want to attend the event.',
                    ErrorClass: ErrorModules.ValidationError
                };
            }

            const event = await Events.findOne({
                _id: ObjectId(data.eventId),
                is_deleted: false,
                is_active: true,
            });
            // If no event found
            if (!event) {
                return {
                    error: true,
                    systemCode: "EVENT_NOT_FOUND",
                    code: 404,
                    message: "Event not found"
                };
            }
            // Checking the phone no is already exist or not
            const member = event.rsvp.find(member =>
                member.phone === data.phone
            );
            if (member && attending) {
                let seniors = member.guests && member.guests.seniors ? member.guests.seniors : 0;
                let adults = member.guests && member.guests.adults ? member.guests.adults : 0;
                let minor = member.guests && member.guests.minor ? member.guests.minor : 0;
                let existTotal = member.guests && member.guests.total ? member.guests.total : 0;

                numberSeniors = numberSeniors + seniors;
                numberAdults = numberAdults + adults;
                numberChildren = numberChildren + minor;

                total = total + existTotal;
            }

            if(data.force_join == false){
            // Ensure that users can't accept or reject after the rsvp end time.
            if (new Date() > new Date(event.rsvp_end_time)) {
                return {
                    error: true,
                    code: 400,
                    systemCode: 'TIME_EXPIRED',
                    message: 'Cannot accept or reject after the deadline.'
                };
            }
            }
            if (!event.attendees.webvistor_restriction || event.invitation_type !== "Public") {
                return {
                    error: true,
                    message: "permissionDenied",
                    ErrorClass: ErrorModules.AuthError,
                    statusCode: Lib.getHttpErrors('FORBIDDEN')
                };
            }

            if (attending) {
                const remainingAttendees = event.attendees.remaining_number_of_web_visitors;
                const noMaxGuests = event.attendees.number_of_max_guests;
                // Remaining attendees check
                if (total > remainingAttendees) {
                    return {
                        error: true,
                        systemCode: "REMAINING_ATTENDEES_EXCEEDED",
                        code: 400,
                        message: "Number of remaining web-visitor exceeded."
                    };
                }
                // Max number of guest check
                if (total > noMaxGuests) {
                    return {
                        error: true,
                        systemCode: "MAX_GUEST_EXCEEDED",
                        code: 400,
                        message: "Number of maximum guests exceeded."
                    };
                }
                // If member already RSVP'd then maxed or not
                if (member && member.guests && member.guests.total === noMaxGuests) {
                    return {
                        error: true,
                        systemCode: "MAX_GUEST_EXCEEDED",
                        code: 400,
                        message: "Number of maximum guests exceeded."
                    };
                }
                event.attendees.remaining_number_of_web_visitors = remainingAttendees - incomingTotal;
            }

            // Locate the user in the assigned members list.
            const memberIndex = event.rsvp.findIndex(member =>
                member.phone === data.phone
            );

            const rsvp = event.rsvp;
            let rsvpPayload = rsvp;
            let guestPayload = {
                seniors: numberSeniors,
                adults: numberAdults,
                minor: numberChildren,
                total: total
            }

            if (memberIndex === -1) {
                rsvpPayload.push({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    phone_code: data.phoneCode,
                    type: "web_vistor",
                    status: data.status,
                    invited_by: new ObjectId(event.host_id),
                    guests: guestPayload
                });

                event.rsvp = rsvpPayload;
            } else {
                // Update status and save
                event.rsvp[memberIndex].guests = guestPayload;
                event.rsvp[memberIndex].status = data.status;
            }

            await event.save();

            if (data.status === 'Attending' && event.payment_status === 'Paid') {
                let total_amount = 0;
                let package_ids = [];
                let currency = '';
                if (!Lib.isEmpty(packageDetails)) {
                    if (event.payment_category === 'per_head') {
                        let perHeadPackage = packageDetails[0];
                        let package = event.payment_packages.find(pack => pack._id.toString() === perHeadPackage.packageId);
                        if (package) {
                            currency = package.currency;
                            if (package.early_bird_date && package.early_bird_date.getTime() > new Date().getTime()) {
                                total_amount = perHeadPackage.number * package.early_bird_rate;
                            } else {
                                total_amount = perHeadPackage.number * package.package_rate;
                            }
                            package_ids.push({ package_id: perHeadPackage.packageId, number: perHeadPackage.number });
                        }
                    } else {
                        await Promise.all(packageDetails.map(async packData => {
                            let package = event.payment_packages.find(pack => pack._id.toString() === packData.packageId);
                            if (package) {
                                currency = package.currency;
                                if (package.early_bird_date && package.early_bird_date.getTime() > new Date().getTime()) {
                                    total_amount += packData.number * package.early_bird_rate;
                                } else {
                                    total_amount += packData.number * package.package_rate;
                                }
                                package_ids.push({ package_id: packData.packageId, number: packData.number });
                            }
                        }));
                    }
                    if (total_amount > 0) {
                        // Create event payment entry
                        const EventPaymentPayload = {
                            event_id: new ObjectId(data.eventId),
                            member_type: 'web_vistor',
                            name: data.name,
                            email: data.email,
                            phone: data.phone,
                            phone_code: data.phoneCode,
                            amount: total_amount,
                            currency: currency,
                            no_of_attendees: incomingTotal,
                            rsvp_status: "tentatively_paid",
                            package_details: package_ids,
                        }
                        const eventPayment = new EventPayment(EventPaymentPayload);
                        const res = await eventPayment.save();
                    }
                } else {
                    return {
                        error: true,
                        message: 'Package details is required for paid event.',
                        ErrorClass: ErrorModules.ValidationError
                    };
                }
            }

            return {
                error: false,
                systemCode: 'SUCCESS',
                code: 200,
                message: `Event status updated to ${data.status}.`
            };

        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_UPDATING_STATUS',
                message: error.message
            };
        }
    },

    webVisitorPhoneVerify: async function (params) {
        const eventId = params.eventId;
        const phone = params.phone;
        const phoneCode = params.phoneCode;

        let user = await User.find({
            'contact.phone.number': params.phone,
            'contact.phone.phone_code': params.phoneCode,
            "is_deleted": false
        });

        if (!Lib.isEmpty(user)) {
            return { error: true, message: "System has unable to confirm your RSVP. Please, connect with the host." };
        }

        const event = await Events.findOne({
            _id: new ObjectId(eventId),
            is_deleted: false,
            is_active: true
        });

        if (!event) {
            return { error: true, message: "Event not found", data: null };
        }

        // const member = event.rsvp.find((member) => {
        //     if (member.phone === phone && member.phone_code === phoneCode) {
        //         return true;
        //     }
        // });
        // if (member) {
        //     return { error: true, message: "Already rsvp'd as web-visitor." };
        // }

        // const otp = Lib.generateRandomNumber(100000, 999999);
        const otp = 700091;
        const code = Lib.generateOtpToken(otp, Lib.getEnum("OTP_CAUSE._verification"));

        /**
          * Send SMS with OTP
        */
        const to = phoneCode + phone;
        const payload = {
            recipient:
            {
                phone: to,
            },
            template: {
                type: "SMS",
                slug: "PHONEVERIFICATION",
                lang: "en"
            },
            contents: {
                OTP: otp,
                NAME: "there"
            }
        }
        //Sending SMS 
        await notificationServices.notifyService(payload);
        return {
            error: false,
            systemCode: "SUCCESS",
            code: 200,
            message: "otpSendSuccess",
            data: {
                token: code
            }
        };
    },

    webVisitorPhoneOTPVerify: async function (otp, token) {
        const code = token;
        if (!code) return { error: true, message: "notAllowed", ErrorClass: ErrorModules.GeneralApiError };
        const data = jwt.verify(code, Lib.ENV('GENERAL_SECRET_KEY'));
        if (data.otp === otp) {
            return { error: false, systemCode: "SUCCESS", code: 200, message: "OTP verified successfully." };
        }
        return ({ error: true, message: "wrongOTP" });
    },

    acceptOrRejectRecurringEvent: async function (userId, data) {
        try {
            const attending = data.status === 'Attending' ? true : false;
            // Member role
            const role = data.role;
            //Numbers of guests
            let numberSeniors = data.numberSeniors ? data.numberSeniors : 0;
            let numberAdults = data.numberAdults ? data.numberAdults : 0;
            let numberChildren = data.numberChildren ? data.numberChildren : 0;
            let total = numberSeniors + numberAdults + numberChildren;

            if (attending && total === 0) {
                return {
                    error: true,
                    message: 'Guests is required if you want to attend the event.',
                    ErrorClass: ErrorModules.ValidationError
                };
            }

            const event = await Events.findOne({
                _id: ObjectId(data.eventId),
                is_deleted: false,
                is_active: true,
            });
            // If no event found
            if (!event) {
                return {
                    error: true,
                    systemCode: "EVENT_NOT_FOUND",
                    code: 404,
                    message: "Event not found"
                };
            }
            // Validate guest count against event's maximum number of guests
            if (total > event.attendees.number_of_max_guests) {
                return {
                    error: true,
                    message: 'The number of guests exceeds the maximum allowed for this event.',
                    ErrorClass: ErrorModules.ValidationError
                };
            }

            // let mainEvent = event.recurring_details.event_id;
            let mainEvent = data.eventId;

            let otherEventIds = [];
            let events;
            if (data.recurringType === 'weekly') {
                // Getting start and end date of this event's week
                let getDates = await this.getStartAndEndDateOfWeek(event.date.from);
                eventAggregate = [
                    {
                        '$match': {
                            'is_deleted': false,
                            'is_active': true,
                            'is_cancelled': false,
                        }
                    },
                    {
                        '$match': {
                            $or: [
                                {
                                    'recurring_details.event_id': new ObjectId(mainEvent)
                                },
                                {
                                    '_id': new ObjectId(mainEvent)
                                },
                            ]
                        }
                    },
                    {
                        '$match': {
                            'date.from': {
                                '$gte': getDates.startDate,
                                '$gte': new Date(),
                                '$lte': getDates.endDate
                            }
                        }
                    }
                ];
                events = await Events.aggregate(eventAggregate);
            } else {
                // Getting all related event Ids
                eventAggregate = [
                    {
                        '$match': {
                            'is_deleted': false,
                            'is_active': true,
                            'is_cancelled': false,
                        }
                    },
                    {
                        '$match': {
                            $or: [
                                {
                                    'recurring_details.event_id': new ObjectId(mainEvent)
                                },
                                {
                                    '_id': new ObjectId(mainEvent)
                                },
                            ]
                        }
                    },
                    {
                        '$project': {
                            '_id': 1
                        }
                    }
                ];
                events = await Events.aggregate(eventAggregate);
            }

            let errorDate = [];
            await Promise.all(events.map(async eventdetails => {
                let attendeesExceed = false;
                let generalError = false;
                const event = await Events.findOne({
                    _id: ObjectId(eventdetails._id)
                });

                const member = event.rsvp.find(member =>
                    member.user_id && member.user_id.toString() === userId
                );
                if (member && attending) {
                    let seniors = member.guests && member.guests.seniors ? member.guests.seniors : 0;
                    let adults = member.guests && member.guests.adults ? member.guests.adults : 0;
                    let minor = member.guests && member.guests.minor ? member.guests.minor : 0;
                    let existTotal = member.guests && member.guests.total ? member.guests.total : 0;

                    numberSeniors = numberSeniors + seniors;
                    numberAdults = numberAdults + adults;
                    numberChildren = numberChildren + minor;

                    total = total + existTotal;
                }
                if (event.attendees.is_restricted && attending) {
                    const remainingAttendees = event.attendees.remaining_number_of_attendees;
                    const noMaxGuests = event.attendees.number_of_max_guests;
                    // Remaining attendees check
                    if (total > remainingAttendees) {
                        attendeesExceed = true;
                    }
                    // Max number of guest check
                    if (total > noMaxGuests) {
                        attendeesExceed = true;
                    }
                    // If member already RSVP'd then maxed or not
                    if (member && member.guests && member.guests.total === noMaxGuests) {
                        attendeesExceed = true;
                    }
                    event.attendees.remaining_number_of_attendees = remainingAttendees - total;
                }

                // Locate the user in the assigned members list.
                const memberIndex = event.rsvp.findIndex(member =>
                    member.user_id && member.user_id.toString() === userId
                );
                const rsvp = event.rsvp;
                let rsvpPayload = rsvp;
                let guestPayload = {
                    seniors: numberSeniors,
                    adults: numberAdults,
                    minor: numberChildren,
                    total: total
                }
                if (memberIndex === -1) {
                    if (event.invitation_type === "Members" && role === "fan") {
                        generalError = true;
                    } else if (event.invitation_type === "Private") {
                        generalError = true;
                    }
                    rsvpPayload.push({
                        user_id: new ObjectId(userId),
                        status: data.status,
                        invited_by: new ObjectId(event.host_id),
                        guests: guestPayload
                    });

                    event.rsvp = rsvpPayload;
                } else {
                    // Check if the status is "Not_Attending" and don't accept again
                    if (member.status === 'Not_Attending') {
                        generalError = true;
                    }
                    // Update status and save
                    event.rsvp[memberIndex].guests = guestPayload;
                    event.rsvp[memberIndex].status = data.status;
                }

                if (generalError || attendeesExceed) {
                    errorDate.push({
                        date: event.date.from,
                        error: attendeesExceed ? 'attendess' : 'general'
                    });
                } else {
                    errorDate.push({
                        date: event.date.from,
                        error: false
                    });
                    await event.save();
                }
            }));

            if (!Lib.isEmpty(errorDate)) {
                let data = await this.errorMsgStructured(errorDate);
                if (data.error) {
                    return {
                        error: true,
                        systemCode: 'ERROR_UPDATING_STATUS',
                        code: 500,
                        message: data.message
                    };
                } else {
                    return {
                        error: false,
                        systemCode: 'SUCCESS',
                        code: 200,
                        message: data.message
                    };
                }
            }
            return {
                error: false,
                systemCode: 'SUCCESS',
                code: 200,
                message: `Event status updated to ${data.status}.`
            };
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_UPDATING_STATUS',
                message: error.message
            };
        }
    },
    getUpcomingRecurringEvent: async function (eventId) {
        try {
            eventAggregate = [
                {
                    '$match': {
                        'is_deleted': false,
                        'is_active': true,
                        'is_cancelled': false,
                        'main_recurring_event': false,
                    }
                },
                {
                    '$match': {
                        'recurring_details.event_id': new ObjectId(eventId)
                    }
                },
                {
                    '$match': {
                        'date.from': {
                            '$gte': new Date()
                        }
                    }
                }
            ];
            const events = await Events.aggregate(eventAggregate).skip(0).limit(3);
            const result = Lib.reconstructObjectKeys(events, ["rsvp_end_time", "to", "from"], Lib.convertIsoDate);
            const total = await Events.aggregate(eventAggregate);
            return ({ error: false, message: "generalSuccess", data: { events: result, total: total.length } });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Event find error");
        }
    },



    getStartAndEndDateOfWeek: async function (inputDate) {
        // Copy the input date to avoid modifying the original date
        const date = new Date(inputDate);

        // Find the first day of the week (Sunday)
        const firstDayOfWeek = new Date(date.setDate(date.getDate() - date.getDay()));

        // Find the last day of the week (Saturday)
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

        return {
            startDate: firstDayOfWeek,
            endDate: lastDayOfWeek,
        };
    },

    errorMsgStructured: async function (dateDetails) {
        let errordates = '';
        let successdates = '';
        let lastIndex = dateDetails.length - 1;
        dateDetails.forEach(async (data, i) => {
            if (data !== undefined) {
                if (data.error) {
                    if (lastIndex === i)
                        errordates += Lib.convertDate(data.date);
                    else
                        errordates += Lib.convertDate(data.date) + ', ';
                } else {
                    if (lastIndex === i)
                        successdates += Lib.convertDate(data.date);
                    else
                        successdates += Lib.convertDate(data.date) + ', ';
                }

            }
        });
        if (successdates) {
            return { error: false, message: `Success: RSVP'd to ${successdates} events. Error : Could not RSVP'd ${errordates ? errordates : 0} events.` }
        } else {
            return { error: true, message: `Error : Could not RSVP'd ${errordates} events.` }
        }

    },
    // Inside getAllRsvpAdminControll resolver
    getAllRsvpAdminControll: async function (id) {
        try {
            const event = await Events.findById(id);

            // If event is not found, return an error response
            if (!event) {
                return {
                    error: true,
                    systemCode: "EventNotFound",
                    code: 404,
                    message: "Event not found",
                    data: null
                };
            }

            // Extract RSVP admin controls from the event
            const rsvpAdminControlls = event.rsvp_admin_controll.filter(adminControll => !adminControll.is_deleted).map(adminControll => ({
                id: adminControll.id,
                rsvpType: adminControll.rsvp_type,
                emailContent: adminControll.email_content,
                smsContent: adminControll.sms_content,
                isDelete: adminControll.is_deleted
            }));
            const response = {
                error: false,
                systemCode: "200",
                code: 200,
                message: "Successfully retrieved all RSVP admin controls.",
                data: {
                    remain: event.remain,
                    rsvpAdminControll: rsvpAdminControlls
                }
            };

            return response;
        } catch (error) {
            // Handle errors
            console.error("Error in getAllRsvpAdminControll:", error);
            return {
                error: true,
                systemCode: "500",
                code: 500,
                message: "Internal Server Error",
                data: null
            };
        }
    },
    removeRemainderSettingsEvent: async function (eventId, id, context) {
        try {
            const userID = context.user.id;
            const user = await User.findOne({ _id: userID });
            const event = await Events.findById(eventId);
            if (!event) {
                return {
                    error: true,
                    message: "Event not found",
                    data: null
                };
            }
            if (user.user_type == 'admin' || event.host_id == userID) {
                // Find the index of the rsvp_admin_controll object by its ID
                const index = event.rsvp_admin_controll.findIndex(obj => {
                    return obj._id.toString() === id;
                });

                // Check if the index is valid
                if (index !== -1) {
                    // Set the is_deleted field to true for the specific object
                    event.rsvp_admin_controll[index].is_deleted = true;
                }
                // Save the updated event
                await event.save();

                return {
                    error: false,
                    message: "Rsvp admin controll object marked as deleted successfully",
                    data: null
                };
            } else {
                return {
                    error: true,
                    message: "Rsvp admin controll object not found with the provided ID",
                    data: null
                };
            }
        } catch (error) {
            console.error("Error in setRsvpAdminControllDeletedById:", error);
            return {
                error: true,
                message: "Internal Server Error",
                data: null
            };
        }
    }

}