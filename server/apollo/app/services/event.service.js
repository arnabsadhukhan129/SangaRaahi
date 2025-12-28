const Events = Lib.Model('Events');
const EventTask = Lib.Model('EventTask');
const EventSupplierManagement = Lib.Model('EventSupplierManagement');
const Communities = Lib.Model('Communities');
const User = Lib.Model('Users');
const Group = Lib.Model('Groups');
const Blogs = Lib.Model('Blogs');
const EventMemory = Lib.Model('EventMemory');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const ErrorModules = require('../errors');
const UserService = require('./user.service');
const axios = require("axios");
const xlsx = require('xlsx');

const NotificationSettings = Lib.Model('NotificationSettings');
const EventPayment = Lib.Model('EventPayment');
const notificationHelper = require('../library/notifiaction.helper');
const notificationServices = require('./notification.service');
const communityServices = require('./community.service');
const helperService = require('./helper.service');
const ActivityLogService = require("./activity_log.service")

module.exports = {

    // Query 
    getAllEvents: async function (params) {
        try {
            let page;
            if (params && params.page) {
                page = parseInt(params.page);
            } else {
                page = 1;
            }
            // define limit per page
            const limit = 10;
            const skip = (page - 1) * limit;

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
                    '$unwind': {
                        'path': '$community'
                    },
                }
            ];
            if (params && params.search) {
                eventAggregate[0]['$match']['title'] = {
                    $regex: `.*${params.search}.*`,
                    $options: 'i'
                };
            }
            const events = await Events.aggregate(eventAggregate).collation({ 'locale': 'en' }).sort(sortObject).skip(skip).limit(limit);
            const total = await Events.aggregate(eventAggregate);
            return ({ error: false, message: "generalSuccess", total: total.length, data: events });
        } catch (e) {
            clog(e);
            throw new ErrorModules.DatabaseError("Events find error");
        }
    },

    getEventByID: async function (id, isChildEvent) {
        let eventId = id;
        const eventDetails = await Events.findOne({
            _id: ObjectId(eventId),
            is_deleted: false,
        });

        if (!eventDetails) {
            return { error: true, message: "Event not found", data: null };
        }
        if (eventDetails.recurring_event && !isChildEvent) {
            eventId = eventDetails.recurring_details.event_id ? eventDetails.recurring_details.event_id : id;
        }
        const event = await Events.aggregate([{
            '$match': {
                '_id': new ObjectId(eventId),
                'is_deleted': false,
                // 'is_active':true,
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
        // Groups array joining
        {
            '$unwind': {
                path: '$groups',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            '$lookup': {
                'from': 'sr_groups',
                'localField': 'groups.group_id',
                'foreignField': '_id',
                'as': 'group'
            }
        },
        {
            '$unwind': {
                path: '$group',
                preserveNullAndEmptyArrays: true
            }
        },
        // Members array joing
        {
            '$unwind': {
                path: '$members',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            '$lookup': {
                'from': 'sr_users',
                'localField': 'members.user_id',
                'foreignField': '_id',
                'as': 'member'
            }
        },
        {
            '$unwind': {
                path: '$member',
                preserveNullAndEmptyArrays: true
            }

        },
        {
            '$group': {
                '_id': '$_id',
                'title': { '$first': '$title' },
                'category': { '$first': '$category' },
                'host_id': { '$first': '$host_id' },
                'community_id': { '$first': '$community_id' },
                'post_event_as_community': { '$first': '$post_event_as_community' },
                'group_id': { '$first': '$group_id' },
                'type': { '$first': '$type' },
                'description': { '$first': '$description' },
                'image': { '$first': '$image' },
                'logo_image': { '$first': '$logo_image' },
                'venue_details': { '$first': '$venue_details' },
                'date': { '$first': '$date' },
                'time': { '$first': '$time' },
                'is_cancelled': { '$first': '$is_cancelled' },
                'created_at': { '$first': '$created_at' },
                'invitation_type': { '$first': '$invitation_type' },
                'rsvp_end_time': { '$first': '$rsvp_end_time' },
                'attendees': { '$first': '$attendees' },
                'rsvp': { '$first': '$rsvp' },
                'user': { '$first': '$user' },
                'community': { '$first': '$community' },
                'payment_category': { '$first': '$payment_category' },
                'payment_packages': { '$first': '$payment_packages' },
                'payment_status': { '$first': '$payment_status' },
                'recurring_event': { '$first': '$recurring_event' },
                'recurring_details': { '$first': '$recurring_details' },
                'groups': { '$addToSet': '$group' },
                'members': { '$addToSet': '$member' },
            }
        }]);

        if (event.length === 0) {
            return ({ error: true, message: "No event found.", ErrorClass: ErrorModules.Api404Error });
        }
        await Promise.all(event[0].members.map(member => {
            Lib.generalizeUser(member)
        }));
        if (event[0].user.year_of_birth) {
            let yob = event[0].user.year_of_birth;
            const d = new Date();
            let year = d.getFullYear();
            let ageGroup = "";
            let age = year - yob;
            if (age >= 60) {
                ageGroup = "Senior";
            } else if (age >= 18) {
                ageGroup = "Adult";
            } else if (age < 18) {
                ageGroup = "Children";
            }

            event[0].user.ageGroup = ageGroup;
        }
        const filteredPackages = event[0].payment_packages.filter(pkg => pkg.is_active);

        event[0].payment_packages = filteredPackages.map(pkg => ({
            id: pkg._id.toString(),
            packageName: pkg.package_name,
            number: pkg.number || null,
            packageLogo: pkg.package_logo || null,
            description: pkg.description || null,
            packageRate: pkg.package_rate,
            earlyBirdRate: pkg.early_bird_rate,
            earlyBirdDate: new Date(pkg.early_bird_date).getTime() || null,
            currency: pkg.currency,
            isActive: pkg.is_active
        }));

        return ({ error: false, message: "generalSuccess", data: event[0] });

    },

    getAdminEventByID: async function (id) {

        const event = await Events.aggregate([{
            '$match': {
                '_id': new ObjectId(id),
                'is_deleted': false,
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
            '$unwind': {
                'path': '$community'
            },
        }]);
        if (event.length === 0) {
            return ({ error: true, message: "No event found.", ErrorClass: ErrorModules.Api404Error });
        }
        return ({ error: false, message: "generalSuccess", data: event[0] });

    },

    getEventDetails: async function (id, userId, role) {
        let aggregate = [
            {
                '$match': {
                    '_id': new ObjectId(id),
                    'is_deleted': false,
                    'is_active': true,
                }
            },
            {
                '$unwind': {
                    'path': '$rsvp'
                }
            },
            {
                '$match': {
                    'rsvp.user_id': new ObjectId(userId),
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
                '$unwind': {
                    'path': '$community'
                },
            },
            {
                '$unwind': {
                    'path': '$rsvp'
                },
            },
            {
                '$match': {
                    'rsvp.user_id': new ObjectId(userId)
                }
            },
            {
                '$lookup': {
                    'from': 'sr_users',
                    'localField': 'rsvp.invited_by',
                    'foreignField': '_id',
                    'as': 'invited_by'
                }
            },
            {
                '$unwind': {
                    'path': "$invited_by",
                    'preserveNullAndEmptyArrays': true
                },
            },
            {
                '$project': {
                    'title': 1,
                    'category': 1,
                    'host_id': 1,
                    'post_event_as_community': 1,
                    'hostName': '$user.name',
                    'community_id': 1,
                    'group_id': 1,
                    'type': 1,
                    'description': 1,
                    'image': 1,
                    'logo_image': 1,
                    'venue_details': 1,
                    'date': 1,
                    'time': 1,
                    'invitation_type': 1,
                    'rsvp_end_time': 1,
                    'attendees': 1,
                    'rsvp': 1,
                    'user': 1,
                    'community': 1,
                    'groups': 1,
                    'members': 1,
                    'payment_category': 1,
                    'payment_packages': 1,
                    'payment_status': 1,
                    'recurring_event': 1,
                    'recurring_details': 1,
                    'invited_by': 1
                }
            }
        ];

        const event = await Events.aggregate(aggregate);
        if (event.length === 0) {
            return ({ error: true, message: "No event found.", ErrorClass: ErrorModules.Api404Error });
        }
        // Fetch package details from EventPayment model
        // const eventPayment = await EventPayment.findOne({ event_id: id, user_id: userId });
        // let packageDetails = [];
        // if (eventPayment) {
        //     const paymentPackages = event[0].payment_packages;
        //     packageDetails = eventPayment.package_details.map(packageDetail => {
        //         const matchingPackage = paymentPackages.find(paymentPackage => paymentPackage._id.toString() === packageDetail.package_id.toString());
        //         if (matchingPackage) {
        //             return {
        //                 id: packageDetail.package_id,
        //                 number: packageDetail.number,
        //                 currency: matchingPackage.currency,
        //                 packageName: matchingPackage.package_name,
        //                 packageRate: matchingPackage.package_rate,
        //                 packageLogo: matchingPackage.package_logo,
        //                 earlyBirdDate: matchingPackage.early_bird_date,
        //                 earlyBirdRate: matchingPackage.early_bird_rate
        //             };
        //         }
        //     })
        // }

        // // Add package details to the event object
        // event[0].payment_packages = packageDetails;
        // Count the number of invited users
        const invitedCountAggregate = [
            {
                $match: {
                    _id: new ObjectId(id),
                    is_deleted: false,
                    is_active: true,
                },
            },
            {
                $unwind: {
                    path: "$rsvp",
                },
            },
            {
                $count: "invitedCount",
            },
        ];

        const invitedCountResult = await Events.aggregate(invitedCountAggregate);
        const invitedCount = invitedCountResult.length > 0 ? invitedCountResult[0].invitedCount : 0;
        // Count the number of attendees with RSVP status "Attending"
        const attendingCountAggregate = [
            {
                '$match': {
                    '_id': new ObjectId(id),
                    'is_deleted': false,
                    'is_active': true,
                }
            },
            {
                '$unwind': {
                    'path': '$rsvp'
                }
            },
            {
                '$match': {
                    'rsvp.status': "Attending",
                }
            },
            {
                $count: "attendingCount",
            },
        ];

        const attendingCountResult = await Events.aggregate(attendingCountAggregate);
        const attendingCount = attendingCountResult.length > 0 ? attendingCountResult[0].attendingCount : 0;

        // Count the number of event images in attendees
        // const photosCountAggregate = [
        //     {
        //         $match: {
        //             _id: new ObjectId(id),
        //             is_deleted: false,
        //             is_active: true,
        //         },
        //     },
        //     {
        //         $unwind: {
        //             path: "$attendees.event_images",
        //         },
        //     },
        //     {
        //         $count: "photosCount",
        //     },
        // ];

        // const photosCountResult = await Events.aggregate(photosCountAggregate);
        // const photosCount = photosCountResult.length > 0 ? photosCountResult[0].photosCount : 0;

        const photosCount = await EventMemory.countDocuments({ event_id: new ObjectId(id), image_approve: true, is_deleted: false });
        // Count the number of blogs related to the event
        const blogCount = await Blogs.countDocuments({ event_id: new ObjectId(id), blog_status: true, is_deleted: false });
        // Add these counts to the event object
        event[0].listing = {
            invited: invitedCount,
            rsvpCount: attendingCount,
            photosCount: photosCount,
            blogCount: blogCount,
        };
        const blogList = await Blogs.find({
            event_id: new ObjectId(id),
            is_deleted: false,
        });

        // Add the blogList to the event object
        event[0].blogs = blogList.map(blog => ({
            id: blog._id.toString(),
            postedBy: blog.posted_by,
            thumbnailImage: blog.thumbnail_image,
            image: blog.image,
            pdf: blog.pdf,
            blogTitle: blog.blog_title,
            blogCategory: blog.blog_category,
            blogDescription: blog.blog_description,
            blogStatus: blog.blog_status,
            paymentStatus: blog.payment_status,
            createdAt: blog.created_at.toISOString()
        }));
        const eventImageList = await EventMemory.find({
            event_id: new ObjectId(id),
            is_deleted: false,
            image_approve: true,
            image_rejecte: false,
        });
        // Add the eventImageList to the event object
        event[0].eventImage = eventImageList.map(image => ({
            id: image._id.toString(),
            uploadedImage: image.uploaded_image,
            imageDeadLine: image.image_dead_line ? image.image_dead_line.toISOString() : null,
            imageApprove: image.image_approve,
            imageStatus: image.image_status,
            uploadedBy: image.uploaded_by,
            phoneNumber: image.phone_number,
            logoImage: image.logo_image,
            createdAt: image.created_at.toISOString(),
            eventName: image.event_id ? image.event_id.title : null,
        }));
        // Count the number of hosts
        const hostCountAggregate = [
            {
                '$match': {
                    '_id': new ObjectId(id),
                    'is_deleted': false,
                    'is_active': true,
                }
            },
            {
                '$unwind': {
                    'path': '$event_host'
                }
            },
            {
                '$count': 'hostCount'
            }
        ];
        const hostCountResult = await Events.aggregate(hostCountAggregate);
        const hostCount = hostCountResult.length > 0 ? hostCountResult[0].hostCount : 0;
        let numberAggregate = [
            {
                '$match': {
                    '_id': new ObjectId(id),
                    'is_deleted': false,
                    'is_active': true,
                }
            },
            {
                '$unwind': {
                    'path': '$rsvp'
                }
            },
            {
                '$match': {
                    'rsvp.status': "Attending",
                }
            }
        ];
        const eventAttendees = await Events.aggregate(numberAggregate);
        // Calculate remaining attendees
        // const numberOfMaxAttendees = event[0].attendees.number_of_max_attendees || 0;
        // const currentAttendees = eventAttendees.length;
        // const remainingAttendees = numberOfMaxAttendees - currentAttendees;
        // event[0].loginUser = userId;
        // event[0].isJoined = event[0].rsvp.status === "Attending" ? true : false;
        // event[0].currentAttendees = eventAttendees.length;
        // event[0].eventHostCounters = hostCount;
        // event[0].remainingAttendees = remainingAttendees;
        const numberOfMaxAttendees = event[0].attendees.number_of_max_attendees || 0;
        const remainingAttendees = event[0].attendees.remaining_number_of_attendees || 0;
        const currentAttendees = numberOfMaxAttendees - remainingAttendees;
        event[0].loginUser = userId;
        event[0].loginUserRole = role;
        event[0].isJoined = event[0].rsvp.status === "Attending" ? true : false;
        event[0].currentAttendees = currentAttendees;
        event[0].eventHostCounters = hostCount;
        event[0].remainingAttendees = remainingAttendees;
        return ({ error: false, message: "generalSuccess", data: Lib.reconstructObjectKeys(event[0], ["rsvp_end_time", "to", "from", "created_at"], Lib.convertIsoDate) });

    },
    getEventDetailsForApp: async function (id, userId) {
        let aggregate = [
            {
                '$match': {
                    '_id': new ObjectId(id),
                    'is_deleted': false,
                    'is_active': true,
                }
            },
            {
                '$unwind': {
                    'path': '$rsvp'
                }
            },
            {
                '$match': {
                    'rsvp.user_id': new ObjectId(userId),
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
                '$unwind': {
                    'path': '$community'
                },
            },
            {
                '$unwind': {
                    'path': '$rsvp'
                },
            },
            {
                '$match': {
                    'rsvp.user_id': new ObjectId(userId)
                }
            },
            {
                '$lookup': {
                    'from': 'sr_users',
                    'localField': 'rsvp.invited_by',
                    'foreignField': '_id',
                    'as': 'invited_by'
                }
            },
            {
                '$unwind': {
                    'path': "$invited_by",
                    'preserveNullAndEmptyArrays': true
                },
            },
            {
                '$project': {
                    'title': 1,
                    'category': 1,
                    'host_id': 1,
                    'post_event_as_community': 1,
                    'hostName': '$user.name',
                    'community_id': 1,
                    'group_id': 1,
                    'type': 1,
                    'description': 1,
                    'image': 1,
                    'logo_image': 1,
                    'venue_details': 1,
                    'date': 1,
                    'time': 1,
                    'invitation_type': 1,
                    'rsvp_end_time': 1,
                    'attendees': 1,
                    'rsvp': 1,
                    'user': 1,
                    'community': 1,
                    'groups': 1,
                    'members': 1,
                    'payment_category': 1,
                    'payment_packages': 1,
                    'payment_status': 1,
                    'recurring_event': 1,
                    'recurring_details': 1,
                    'invited_by': 1
                }
            }
        ];

        const event = await Events.aggregate(aggregate);
        if (event.length === 0) {
            return ({ error: true, message: "No event found.", ErrorClass: ErrorModules.Api404Error });
        }
        // Fetch package details from EventPayment model
        const eventPayment = await EventPayment.findOne({ event_id: id, user_id: userId });
        let packageDetails = [];
        if (eventPayment) {
            const paymentPackages = event[0].payment_packages;
            packageDetails = eventPayment.package_details.map(packageDetail => {
                const matchingPackage = paymentPackages.find(paymentPackage => paymentPackage._id.toString() === packageDetail.package_id.toString());
                if (matchingPackage) {
                    return {
                        id: packageDetail.package_id,
                        number: packageDetail.number,
                        currency: matchingPackage.currency,
                        packageName: matchingPackage.package_name,
                        packageRate: matchingPackage.package_rate,
                        packageLogo: matchingPackage.package_logo,
                        earlyBirdDate: matchingPackage.early_bird_date,
                        earlyBirdRate: matchingPackage.early_bird_rate,
                        description: matchingPackage.description
                    };
                }
            })
        }

        // Add package details to the event object
        event[0].payment_packages = packageDetails;
        // Count the number of invited users
        const invitedCountAggregate = [
            {
                $match: {
                    _id: new ObjectId(id),
                    is_deleted: false,
                    is_active: true,
                },
            },
            {
                $unwind: {
                    path: "$rsvp",
                },
            },
            {
                $count: "invitedCount",
            },
        ];

        const invitedCountResult = await Events.aggregate(invitedCountAggregate);
        const invitedCount = invitedCountResult.length > 0 ? invitedCountResult[0].invitedCount : 0;
        // Count the number of attendees with RSVP status "Attending"
        const attendingCountAggregate = [
            {
                '$match': {
                    '_id': new ObjectId(id),
                    'is_deleted': false,
                    'is_active': true,
                }
            },
            {
                '$unwind': {
                    'path': '$rsvp'
                }
            },
            {
                '$match': {
                    'rsvp.status': "Attending",
                }
            },
            {
                $count: "attendingCount",
            },
        ];

        const attendingCountResult = await Events.aggregate(attendingCountAggregate);
        const attendingCount = attendingCountResult.length > 0 ? attendingCountResult[0].attendingCount : 0;

        // Count the number of event images in attendees
        // const photosCountAggregate = [
        //     {
        //         $match: {
        //             _id: new ObjectId(id),
        //             is_deleted: false,
        //             is_active: true,
        //         },
        //     },
        //     {
        //         $unwind: {
        //             path: "$attendees.event_images",
        //         },
        //     },
        //     {
        //         $count: "photosCount",
        //     },
        // ];

        // const photosCountResult = await Events.aggregate(photosCountAggregate);
        // const photosCount = photosCountResult.length > 0 ? photosCountResult[0].photosCount : 0;

        const photosCount = await EventMemory.countDocuments({ event_id: new ObjectId(id), image_approve: true, is_deleted: false });
        // Count the number of blogs related to the event
        const blogCount = await Blogs.countDocuments({ event_id: new ObjectId(id), blog_status: true, is_deleted: false });
        // Add these counts to the event object
        event[0].listing = {
            invited: invitedCount,
            rsvpCount: attendingCount,
            photosCount: photosCount,
            blogCount: blogCount,
        };
        const blogList = await Blogs.find({
            event_id: new ObjectId(id),
            is_deleted: false,
        });

        // Add the blogList to the event object
        event[0].blogs = blogList.map(blog => ({
            id: blog._id.toString(),
            postedBy: blog.posted_by,
            thumbnailImage: blog.thumbnail_image,
            image: blog.image,
            pdf: blog.pdf,
            blogTitle: blog.blog_title,
            blogCategory: blog.blog_category,
            blogDescription: blog.blog_description,
            blogStatus: blog.blog_status,
            paymentStatus: blog.payment_status,
            createdAt: blog.created_at.toISOString()
        }));
        const eventImageList = await EventMemory.find({
            event_id: new ObjectId(id),
            is_deleted: false,
            image_approve: true,
            image_rejecte: false,
        });
        // Add the eventImageList to the event object
        event[0].eventImage = eventImageList.map(image => ({
            id: image._id.toString(),
            uploadedImage: image.uploaded_image,
            imageDeadLine: image.image_dead_line ? image.image_dead_line.toISOString() : null,
            imageApprove: image.image_approve,
            imageStatus: image.image_status,
            uploadedBy: image.uploaded_by,
            phoneNumber: image.phone_number,
            logoImage: image.logo_image,
            createdAt: image.created_at.toISOString(),
            eventName: image.event_id ? image.event_id.title : null,
        }));
        // Count the number of hosts
        const hostCountAggregate = [
            {
                '$match': {
                    '_id': new ObjectId(id),
                    'is_deleted': false,
                    'is_active': true,
                }
            },
            {
                '$unwind': {
                    'path': '$event_host'
                }
            },
            {
                '$count': 'hostCount'
            }
        ];
        const hostCountResult = await Events.aggregate(hostCountAggregate);
        const hostCount = hostCountResult.length > 0 ? hostCountResult[0].hostCount : 0;
        let numberAggregate = [
            {
                '$match': {
                    '_id': new ObjectId(id),
                    'is_deleted': false,
                    'is_active': true,
                }
            },
            {
                '$unwind': {
                    'path': '$rsvp'
                }
            },
            {
                '$match': {
                    'rsvp.status': "Attending",
                }
            }
        ];
        const eventAttendees = await Events.aggregate(numberAggregate);
        // Calculate remaining attendees
        // const numberOfMaxAttendees = event[0].attendees.number_of_max_attendees || 0;
        // const currentAttendees = eventAttendees.length;
        // const remainingAttendees = numberOfMaxAttendees - currentAttendees;
        // event[0].loginUser = userId;
        // event[0].isJoined = event[0].rsvp.status === "Attending" ? true : false;
        // event[0].currentAttendees = eventAttendees.length;
        // event[0].eventHostCounters = hostCount;
        // event[0].remainingAttendees = remainingAttendees;
        const numberOfMaxAttendees = event[0].attendees.number_of_max_attendees || 0;
        const remainingAttendees = event[0].attendees.remaining_number_of_attendees || 0;
        const currentAttendees = numberOfMaxAttendees - remainingAttendees;
        event[0].loginUser = userId;
        event[0].isJoined = event[0].rsvp.status === "Attending" ? true : false;
        event[0].currentAttendees = currentAttendees;
        event[0].eventHostCounters = hostCount;
        event[0].remainingAttendees = remainingAttendees;
        return ({ error: false, message: "generalSuccess", data: Lib.reconstructObjectKeys(event[0], ["rsvp_end_time", "to", "from", "created_at"], Lib.convertIsoDate) });

    },
    getEventDetailsForPublic: async function (id, userId, role) {
        let aggregate = [
            {
                '$match': {
                    '_id': new ObjectId(id),
                    'is_deleted': false,
                    'is_active': true,
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
                '$unwind': {
                    'path': '$community'
                },
            },
            // {
            //     '$unwind': {
            //         'path': '$rsvp'
            //     },
            // },
            // {
            //     '$match': {
            //         'rsvp.user_id': new ObjectId(userId)
            //     }
            // },
            // {
            //     '$lookup': {
            //         'from': 'sr_users',
            //         'localField': 'rsvp.invited_by',
            //         'foreignField': '_id',
            //         'as': 'invited_by'
            //     }
            // },
            // {
            //     '$unwind': {
            //         'path': "$invited_by",
            //         'preserveNullAndEmptyArrays': true
            //     },
            // },
            {
                '$project': {
                    'title': 1,
                    'category': 1,
                    'host_id': 1,
                    'post_event_as_community': 1,
                    'hostName': '$user.name',
                    'community_id': 1,
                    'group_id': 1,
                    'type': 1,
                    'description': 1,
                    'image': 1,
                    'logo_image': 1,
                    'venue_details': 1,
                    'date': 1,
                    'time': 1,
                    'invitation_type': 1,
                    'rsvp_end_time': 1,
                    'attendees': 1,
                    'rsvp': 1,
                    'user': 1,
                    'community': 1,
                    'groups': 1,
                    'members': 1,
                    'payment_category': 1,
                    'payment_packages': 1,
                    'payment_status': 1,
                    'recurring_event': 1,
                    'recurring_details': 1,
                    // 'invited_by' : 1
                }
            }
        ];

        const event = await Events.aggregate(aggregate);
        if (event.length === 0) {
            return ({ error: true, message: "No event found.", ErrorClass: ErrorModules.Api404Error });
        }
        // ✅ Filter payment_packages before returning
        if (event[0].payment_packages && Array.isArray(event[0].payment_packages)) {
            event[0].payment_packages = event[0].payment_packages
                .filter(pkg => pkg.is_active)
                .map(pkg => ({
                    id: pkg._id?.toString?.() || '',
                    packageName: pkg.package_name,
                    number: pkg.number || null,
                    packageRate: pkg.package_rate,
                    earlyBirdRate: pkg.early_bird_rate,
                    earlyBirdDate: new Date(pkg.early_bird_date).getTime(),
                    currency: pkg.currency,
                    isActive: pkg.is_active
                }));
        }
        const isJoinRequestSent = await communityServices.isJoinRequestSent(event[0].community_id, userId);
        const isJoined = event[0].rsvp.find(rsvp => rsvp.user_id.toString() === userId && rsvp.status === "Attending") ? true : false;
        // Count the number of invited users
        const invitedCountAggregate = [
            {
                $match: {
                    _id: new ObjectId(id),
                    is_deleted: false,
                    is_active: true,
                },
            },
            {
                $unwind: {
                    path: "$rsvp",
                },
            },
            {
                $count: "invitedCount",
            },
        ];

        const invitedCountResult = await Events.aggregate(invitedCountAggregate);
        const invitedCount = invitedCountResult.length > 0 ? invitedCountResult[0].invitedCount : 0;
        // Count the number of attendees with RSVP status "Attending"
        const attendingCountAggregate = [
            {
                '$match': {
                    '_id': new ObjectId(id),
                    'is_deleted': false,
                    'is_active': true,
                }
            },
            {
                '$unwind': {
                    'path': '$rsvp'
                }
            },
            {
                '$match': {
                    'rsvp.status': "Attending",
                }
            },
            {
                $count: "attendingCount",
            },
        ];

        const attendingCountResult = await Events.aggregate(attendingCountAggregate);
        const attendingCount = attendingCountResult.length > 0 ? attendingCountResult[0].attendingCount : 0;

        const photosCount = await EventMemory.countDocuments({ event_id: new ObjectId(id), image_approve: true, is_deleted: false });
        // Count the number of blogs related to the event
        const blogCount = await Blogs.countDocuments({ event_id: new ObjectId(id), blog_status: true, is_deleted: false });
        // Add these counts to the event object
        event[0].listing = {
            invited: invitedCount,
            rsvpCount: attendingCount,
            photosCount: photosCount,
            blogCount: blogCount,
        };
        const blogList = await Blogs.find({
            event_id: new ObjectId(id),
            is_deleted: false,
        });

        // Add the blogList to the event object
        event[0].blogs = blogList.map(blog => ({
            id: blog._id.toString(),
            postedBy: blog.posted_by,
            thumbnailImage: blog.thumbnail_image,
            image: blog.image,
            pdf: blog.pdf,
            blogTitle: blog.blog_title,
            blogCategory: blog.blog_category,
            blogDescription: blog.blog_description,
            blogStatus: blog.blog_status,
            paymentStatus: blog.payment_status,
            createdAt: blog.created_at.toISOString()
        }));
        const eventImageList = await EventMemory.find({
            event_id: new ObjectId(id),
            is_deleted: false,
            image_approve: true,
            image_rejecte: false,
        });
        // Add the eventImageList to the event object
        event[0].eventImage = eventImageList.map(image => ({
            id: image._id.toString(),
            uploadedImage: image.uploaded_image,
            imageDeadLine: image.image_dead_line ? image.image_dead_line.toISOString() : null,
            imageApprove: image.image_approve,
            imageStatus: image.image_status,
            uploadedBy: image.uploaded_by,
            phoneNumber: image.phone_number,
            logoImage: image.logo_image,
            createdAt: image.created_at.toISOString(),
            eventName: image.event_id ? image.event_id.title : null,
        }));
        // Count the number of hosts
        const hostCountAggregate = [
            {
                '$match': {
                    '_id': new ObjectId(id),
                    'is_deleted': false,
                    'is_active': true,
                }
            },
            {
                '$unwind': {
                    'path': '$event_host'
                }
            },
            {
                '$count': 'hostCount'
            }
        ];
        const hostCountResult = await Events.aggregate(hostCountAggregate);
        const hostCount = hostCountResult.length > 0 ? hostCountResult[0].hostCount : 0;
        let numberAggregate = [
            {
                '$match': {
                    '_id': new ObjectId(id),
                    'is_deleted': false,
                    'is_active': true,
                }
            },
            {
                '$unwind': {
                    'path': '$rsvp'
                }
            },
            {
                '$match': {
                    'rsvp.status': "Attending",
                }
            }
        ];
        const eventAttendees = await Events.aggregate(numberAggregate);
        // Calculate remaining attendees
        // const numberOfMaxAttendees = event[0].attendees.number_of_max_attendees || 0;
        // const currentAttendees = eventAttendees.length;
        // const remainingAttendees = numberOfMaxAttendees - currentAttendees;
        // event[0].loginUser = userId;
        // event[0].isJoined = event[0].rsvp.status === "Attending" ? true : false;
        // event[0].currentAttendees = eventAttendees.length;
        // event[0].eventHostCounters = hostCount;
        // event[0].remainingAttendees = remainingAttendees;
        const numberOfMaxAttendees = event[0].attendees.number_of_max_attendees || 0;
        const remainingAttendees = event[0].attendees.remaining_number_of_attendees || 0;
        const currentAttendees = numberOfMaxAttendees - remainingAttendees;
        event[0].loginUser = userId;
        event[0].loginUserRole = role;
        event[0].isJoined = event[0].rsvp.status === "Attending" ? true : false;
        event[0].isJoined = isJoined;
        event[0].currentAttendees = currentAttendees;
        event[0].eventHostCounters = hostCount;
        event[0].remainingAttendees = remainingAttendees;
        event[0].isJoinRequestSent = isJoinRequestSent;
        return ({ error: false, message: "generalSuccess", data: Lib.reconstructObjectKeys(event[0], ["rsvp_end_time", "to", "from", "created_at"], Lib.convertIsoDate) });

    },

    //Filter values are -> upcoming, past, will_attend, attended, private
    getViewEvents: async function (context, userId, communityId, type, search, filter, Invitetype, paymentStatus) {
        try {
            let isJoinRequestSent = await communityServices.isJoinRequestSent(communityId, userId);
            // Get the user's role
            const userCommunity = await UserService.getUserCommunityDetails(context.getAuthUserInfo(), communityId);
            let loggeduserRole = 'user';
            if (!userCommunity.error) {
                loggeduserRole = userCommunity.data.role;
            }
            //Getting Non private events
            let
                nonPrivateEventAggregate = [
                    {
                        '$match': {
                            is_deleted: false,
                            is_active: true,
                            community_id: new ObjectId(communityId),
                            invitation_type: { $in: type },
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
                        '$unwind': {
                            'path': '$community'
                        },
                    },
                    {
                        '$lookup': {
                            'from': 'sr_users',
                            'localField': 'rsvp.invited_by',
                            'foreignField': '_id',
                            'as': 'invited_by'
                        }
                    },
                    {
                        '$unwind': {
                            'path': "$invited_by",
                            'preserveNullAndEmptyArrays': true
                        },
                    },
                    {
                        '$sort': {
                            'time.from': 1 // 1 for ascending order, -1 for descending order
                        }
                    },
                    // {
                    //     $match: {
                    //         'rsvp.status': {
                    //             $nin: ['Attending', 'Not_Attending']
                    //         }
                    //     }
                    // }

                ];
            // Add a new match stage to filter by paymentStatus
            if (paymentStatus) {
                nonPrivateEventAggregate.push({
                    '$match': {
                        'payment_status': paymentStatus
                    }
                });
            }
            //Serach by title only
            if (search) {
                nonPrivateEventAggregate[0]['$match']['title'] = {
                    $regex: `.*${search}.*`,
                    $options: 'i'
                };
            }
            //Filter
            if (filter) {
                let date = new Date().toISOString();
                let isoDate = new Date(date);
                switch (filter) {
                    case 'upcoming':
                        nonPrivateEventAggregate.push({
                            '$match': {
                                'time.from': {
                                    '$gte': isoDate
                                }
                            }
                        });

                        break;
                    case 'past':
                        nonPrivateEventAggregate.push({
                            '$match': {
                                'time.from': {
                                    '$lte': isoDate
                                }
                            }
                        });

                        break;
                    case 'accepted':
                        nonPrivateEventAggregate.push({
                            '$match': {
                                'time.from': {
                                    '$gte': isoDate
                                }
                            }
                        },
                            {
                                '$unwind': {
                                    path: '$rsvp',
                                }
                            },
                            {
                                '$match': {
                                    "rsvp.user_id": new ObjectId(userId),
                                    "rsvp.status": "Attending"
                                }
                            });
                        break;
                    case 'rejected':
                        nonPrivateEventAggregate.push({
                            '$match': {
                                'time.from': {
                                    '$gte': isoDate
                                }
                            }
                        },
                            {
                                '$unwind': {
                                    path: '$rsvp',
                                }
                            },
                            {
                                '$match': {
                                    "rsvp.user_id": new ObjectId(userId),
                                    "rsvp.status": { "$in": ["Not_Attending", "Maybe"] }
                                }
                            });

                        break;
                    case 'noreply':
                        nonPrivateEventAggregate.push({
                            '$match': {
                                'time.from': {
                                    '$gte': isoDate
                                }
                            }
                        });

                        break;
                    case 'attended':
                        nonPrivateEventAggregate.push({
                            '$match': {
                                'time.from': {
                                    '$lte': isoDate
                                }
                            }
                        },
                            {
                                '$unwind': {
                                    path: '$rsvp',
                                }
                            },
                            {
                                '$match': {
                                    "rsvp.user_id": new ObjectId(userId),
                                    "rsvp.status": "Attending"
                                }
                            });

                        break;
                    default:

                }
            }
            let nonPrivateEvent = []
            if (Invitetype.includes("Public") || Invitetype.includes("Members")) {
                nonPrivateEvent = await Events.aggregate(nonPrivateEventAggregate);
            }



            //Getting Private events
            let privateEventAggregate = [
                {
                    '$match': {
                        is_deleted: false,
                        is_active: true,
                        community_id: new ObjectId(communityId),
                        invitation_type: "Private",
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
                    '$match': {

                        $or: [{
                            host_id: new ObjectId(userId),
                        }, {
                            "rsvp.user_id": ObjectId(userId)
                        }]

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
                    '$unwind': {
                        'path': '$community'
                    },
                },
                {
                    '$unwind': {
                        'path': '$rsvp'
                    },
                },
                {
                    '$match': {
                        'rsvp.user_id': new ObjectId(userId)
                    }
                },
                {
                    '$lookup': {
                        'from': 'sr_users',
                        'localField': 'rsvp.invited_by',
                        'foreignField': '_id',
                        'as': 'invited_by'
                    }
                },
                {
                    '$unwind': {
                        'path': "$invited_by",
                        'preserveNullAndEmptyArrays': true
                    },
                },
                {
                    '$sort': {
                        'time.from': 1 // 1 for ascending order, -1 for descending order
                    }
                },
                // {
                //     $match: {
                //         'rsvp.status': {
                //             $nin: ['Attending', 'Not_Attending']
                //         }
                //     }
                // }
            ];
            // Similar modification for privateEventAggregate
            if (paymentStatus) {
                privateEventAggregate.push({
                    '$match': {
                        'payment_status': paymentStatus
                    }
                });
            }
            //Serach by title only
            if (search) {
                privateEventAggregate[0]['$match']['title'] = {
                    $regex: `.*${search}.*`,
                    $options: 'i'
                };
            }
            //Filter
            if (filter) {
                let date = new Date().toISOString();
                let isoDate = new Date(date);
                switch (filter) {
                    case 'upcoming':
                        privateEventAggregate.push({
                            '$match': {
                                'time.from': {
                                    '$gte': isoDate
                                }
                            }
                        });

                        break;
                    case 'past':
                        privateEventAggregate.push({
                            '$match': {
                                'time.to': {
                                    '$lte': isoDate
                                }
                            }
                        });
                        break;
                    case 'accepted':
                        privateEventAggregate.push({
                            '$match': {
                                'time.from': {
                                    '$gte': isoDate
                                }
                            }
                        },
                            {
                                '$unwind': {
                                    path: '$rsvp',
                                }
                            },
                            {
                                '$match': {
                                    "rsvp.user_id": new ObjectId(userId),
                                    "rsvp.status": "Attending"
                                }
                            });
                        break;
                    case 'rejected':
                        privateEventAggregate.push({
                            '$match': {
                                'time.from': {
                                    '$gte': isoDate
                                }
                            }
                        },
                            {
                                '$unwind': {
                                    path: '$rsvp',
                                }
                            },
                            {
                                '$match': {
                                    "rsvp.user_id": new ObjectId(userId),
                                    "rsvp.status": { "$in": ["Not_Attending", "Maybe"] }
                                }
                            });


                        break;
                    case 'noreply':
                        privateEventAggregate.push({
                            '$match': {
                                'time.from': {
                                    '$gte': isoDate
                                }
                            }
                        },
                            {
                                '$unwind': {
                                    path: '$rsvp',
                                }
                            },
                            {
                                '$match': {
                                    "rsvp.user_id": new ObjectId(userId),
                                    "rsvp.status": "No_Reply"
                                }
                            });

                        break;
                    case 'attended':
                        privateEventAggregate.push({
                            '$match': {
                                'time.from': {
                                    '$lte': isoDate
                                }
                            }
                        },
                            {
                                '$unwind': {
                                    path: '$rsvp',
                                }
                            },
                            {
                                '$match': {
                                    "rsvp.user_id": new ObjectId(userId),
                                    "rsvp.status": "Attending"
                                }
                            });
                        break;
                    default:

                }
            }

            let privateEvent = await Events.aggregate(privateEventAggregate);

            if (Invitetype.includes("Private")) {
                await privateEvent.forEach(elem => {
                    nonPrivateEvent.push(elem);
                });
            }


            let removeIndexes = [];
            await Promise.all(nonPrivateEvent.map(async (elem, index) => {
                elem.loggeduserRole = loggeduserRole;
                if (filter === "noreply" && Lib.isArray(elem.rsvp)) {
                    const isRsvp = elem.rsvp.filter(member => member.user_id && member.user_id.toString() === userId);
                    if (!Lib.isEmpty(isRsvp)) {
                        if (isRsvp[0].status === "Not_Attending" || isRsvp[0].status === "Maybe" || isRsvp[0].status === "Attending") {
                            // nonPrivateEvent.splice(index, 1)
                            removeIndexes.push(index);
                        }
                    }
                }
                let role = '';
                const userCommunity = await UserService.getUserCommunityDetails(context.getAuthUserInfo(), elem.community_id);
                if (!userCommunity.error) {
                    role = userCommunity.data.role;
                }
                elem.role = Lib.toTitleCase(role, '_', false, ' ');
                if (!Lib.isArray(elem.rsvp) && elem.rsvp.user_id && elem.rsvp.user_id.toString() === userId && elem.rsvp.status === "Attending") {
                    elem.is_joined = true;
                } else if (Lib.isArray(elem.rsvp)) {
                    const isRsvp = elem.rsvp.filter(member => member.user_id && member.user_id.toString() === userId);
                    if (!Lib.isEmpty(isRsvp)) {
                        if (isRsvp[0].status === "Attending") {
                            elem.is_joined = true;
                        } else {
                            elem.is_joined = false;
                        }
                    }
                } else {
                    elem.is_joined = false;
                }
                elem.isJoinRequestSent = isJoinRequestSent;
            }));
            nonPrivateEvent = await this.removeMultipleObjects(nonPrivateEvent, removeIndexes);
            return ({ error: false, message: "generalSuccess", data: nonPrivateEvent });
        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Event find error");
        }
    },

    removeMultipleObjects: async function (arr, indices) {
        // Sort the indices in descending order
        indices.sort((a, b) => b - a);

        // Remove elements from the array starting from the end
        for (let index of indices) {
            if (index >= 0 && index < arr.length) {
                arr.splice(index, 1);
            }
        }

        return arr;
    },

    getRsvpList: async function (params) {
        const eventId = params.eventId;
        const rsvpType = params.rsvpType;

        let aggregate = [
            {
                '$match': {
                    '_id': new ObjectId(eventId),
                    is_deleted: false,
                    is_active: true,
                }
            },
            {
                '$unwind': {
                    'path': '$rsvp'
                }
            },
            {
                '$match': {
                    'rsvp.status': {
                        '$in': rsvpType
                    }
                }
            },
            {
                '$lookup': {
                    'from': 'sr_users',
                    'localField': 'rsvp.user_id',
                    'foreignField': '_id',
                    'as': 'rsvp.user'
                }
            },
            {
                '$unwind': {
                    'path': '$rsvp.user'
                },
            },
            {
                '$unwind': {
                    'path': '$rsvp.status'
                }
            },
            {
                '$project': {
                    'rsvp.user_id': 1,
                    'host_id': 1,
                    'rsvp.status': 1,
                    'rsvp.guests': 1,
                    'rsvp.user._id': 1,
                    'rsvp.user.name': 1,
                    'rsvp.user.contact': 1,
                    'rsvp.user.profile_image': 1
                }
            }
        ];

        const eventRsvp = await Events.aggregate(aggregate);

        return { error: false, message: "generalSuccess", data: eventRsvp };
    },

    // getAvalibleUsersForEvent: async function (data) {
    //     const { eventId, search, page, limit } = data;

    //     try {
    //         const event = await Events.findOne({
    //             _id: ObjectId(eventId),
    //             is_deleted: false,
    //             is_active: true
    //         });

    //         if (!event) {
    //             return { error: true, message: "Event not found", data: null };
    //         }

    //         const communityId = event.community_id;
    //         const memberIds = event.members.map(member => member.user_id);
    //         console.log(memberIds,"memberIds............");
    //         // Find the community members
    //         const community = await Communities.findOne({
    //             _id: ObjectId(communityId),
    //             is_deleted: false,
    //             is_active: true
    //         });

    //         if (!community) {
    //             return { error: true, message: "Community not found", data: null };
    //         }

    //         const communityMemberIds = community.members
    //         .filter(member => !member.is_rejected && !member.is_leaved && !member.is_deleted)
    //         .map(member => member.member_id);
    //         console.log(communityMemberIds,"communityMemberIds...........");
    //         // Query users excluding those who are already members and community members
    //         const availableUsers = await User.aggregate([
    //             {
    //                 $match: {
    //                     _id: { $nin: [...memberIds, ...communityMemberIds] },
    //                     is_deleted: false,
    //                 },
    //             },
    //             {
    //                 $project: {
    //                     id: '$_id',
    //                     name: '$name',
    //                     profileImage: '$profile_image',
    //                     number: '$contact.phone.number', // Assuming the phone number is stored in the contact subdocument
    //                 },
    //             },
    //         ]);
    //      console.log(availableUsers,"availableUsers..............");
    //         return { error: false, data: availableUsers };
    //     } catch (error) {
    //         console.error(error);
    //         return { error: true, message: 'Internal server error' };
    //     }
    // },    

    getAvalibleUsersForEvent: async function (data) {
        const { eventId, search, page, limit } = data;
        const pageSize = limit || 10; // Set a default page size if limit is not provided
        const skip = (page - 1) * pageSize;
        try {
            const event = await Events.findOne({
                _id: mongoose.Types.ObjectId(eventId),
                is_deleted: false,
                is_active: true
            });

            if (!event) {
                return { error: true, message: "Event not found", data: null };
            }

            const communityId = event.community_id;
            const memberIds = event.members.map(member => member.user_id);

            // Find the community members with the specified conditions
            const community = await Communities.findOne({
                _id: mongoose.Types.ObjectId(communityId),
                is_deleted: false,
                is_active: true
            });

            if (!community) {
                return { error: true, message: "Community not found", data: null };
            }

            // Extract user IDs from community members
            const communityMemberIds = community.members
                .filter(member => !member.is_rejected && !member.is_leaved && !member.is_deleted && member.is_active && member.is_approved)
                .map(member => member.member_id);

            // Query users with the specified conditions
            const availableUsers = await User.find({
                _id: { $in: communityMemberIds, $nin: memberIds },
                is_deleted: false,
                name: { $regex: new RegExp(search, 'i') }
            })
                .skip(skip)
                .limit(pageSize)
                .select({
                    id: '$_id',
                    name: '$name',
                    profileImage: '$profile_image',
                    number: '$contact.phone.number'
                });

            return { error: false, data: availableUsers };
        } catch (error) {
            console.error(error);
            return { error: true, message: 'Internal server error' };
        }
    },
    // Mutations 
    createEvent: async function (user, params, communityId) {
        const userID = user.id;
        const userName = user.name;
        const invitationType = params.invitationType;
        const toTimeDate = new Date(Date.parse(params.date.to));
        const fromTimeDate = new Date(Date.parse(params.date.from));
        const rsvpEnd = params.recurringEvent ? new Date(Date.parse(params.date.from)) : new Date(Date.parse(params.rsvpEndTime));
        const isRecurring = params.recurringEvent ? true : false;
        const timezone = params.time.timezone || null;
        // Basic event payload
        const eventPayload = {
            host_id: userID,
            community_id: communityId,
            group_id: params.groupId ? params.groupId : null,
            type: params.type,
            title: params.title,
            description: params.description,
            image: params.image,
            logo_image: params.logoImage,
            invitation_type: params.invitationType,
            rsvp_end_time: params.rsvpEndTime,
            post_event_as_community: params.postEventAsCommunity,
            payment_status: params.paymentStatus,
            recurring_event: isRecurring
        };
        // Recurring event add
        if (params.paymentStatus === 'Free' && isRecurring) {
            const recurreingDetails = params.recurringDetails;
            const occurance = recurreingDetails.occurances;
            let recurringDetails = {
                event_id: recurreingDetails.event_id,
                recurreing_type: recurreingDetails.recurringType,
                start_time: params.time.from,
                end_time: params.time.to,
                occuration_number: occurance,
                weekly_day_index: recurreingDetails.recurringType === 'weekly' ? recurreingDetails.dateIndex : [],
                monthly_date: recurreingDetails.recurringType === 'monthly' ? recurreingDetails.dateIndex : [],
            }

            eventPayload['recurring_details'] = recurringDetails;
        }
        const community = await Communities.findOne({ _id: new ObjectId(communityId) });
        if (!community) {
            throw new ErrorModules.Api404Error("noCommunityFound");
        }
        // Check if SMS and email settings are enabled
        const { sms_settings, email_settings } = community.sms_email_global_settings;
        const { sms_credits_remaining, email_credits_remaining } = community;

        // Payment status category add
        if (params.paymentStatus === 'Paid' && !Lib.isEmpty(params.paymentCategory)) {
            eventPayload.payment_category = params.paymentCategory;
        }
        // Payment packages add
        if (params.paymentStatus === 'Paid' && !Lib.isEmpty(params.paymentPackages)) {
            const packages = params.paymentPackages;
            if (packages.length > 10) {
                return ({ error: true, message: "Can't add more than 10 packages." });
            }
            let paymentPackages = [];
            await Promise.all(packages.map(async package => {
                const earlyBirdDate = package.earlyBirdDate ? new Date(Date.parse(package.earlyBirdDate)) : null;
                if (earlyBirdDate && earlyBirdDate.getTime() > rsvpEnd.getTime()) {
                    return ({ error: true, message: "Early bird date should not be greater than RSVP end date." });
                }
                if (earlyBirdDate && earlyBirdDate.getTime() > fromTimeDate.getTime()) {
                    return ({ error: true, message: "Early bird date should not be greater than From date." });
                }
                paymentPackages.push({
                    currency: package.currency,
                    package_name: package.packageName,
                    package_rate: package.packageRate,
                    package_logo: package.packageLogo,
                    early_bird_date: earlyBirdDate,
                    early_bird_rate: package.earlyBirdRate ? package.earlyBirdRate : null,
                    description: package.description,
                    is_active: package.isActive
                });
            }));

            eventPayload['payment_packages'] = paymentPackages;
        }

        // Adding latitude-longitude location for event
        let first_address_line = params.venueDetails.firstAddressLine ? params.venueDetails.firstAddressLine : '';
        let city = params.venueDetails.city ? params.venueDetails.city : '';
        let state = params.venueDetails.state ? params.venueDetails.state : '';
        let country = params.venueDetails.country ? params.venueDetails.country : '';
        let zipcode = params.venueDetails.zipcode ? params.venueDetails.zipcode : '';
        let mainAddress = first_address_line + ',' + city + ',' + state + ',' + zipcode + ',' + country;

        const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${mainAddress}&key=${process.env.GEOCODE_KEY}`;



        const response = await axios({
            url: endpoint,
            method: 'get'
        });
        let latitude = '';
        let longitude = '';
        if (response.data.status == 'OK') {
            latitude = response.data.results[0].geometry.location.lat;
            longitude = response.data.results[0].geometry.location.lng;
        }
        // Venue add
        const venueDetailsPayload = {
            city: params.venueDetails.city,
            state: params.venueDetails.state,
            country: params.venueDetails.country,
            zipcode: params.venueDetails.zipcode,
            phone_no: params.venueDetails.phoneNo,
            phone_code: params.venueDetails.phoneCode,
            first_address_line: params.venueDetails.firstAddressLine,
            second_address_line: params.venueDetails.secondAddressLine,
            latitude: latitude,
            longitude: longitude
        };
        // Event timing add

        if (fromTimeDate.getTime() > toTimeDate.getTime()) {
            return ({ error: true, message: "From date should not be greater than to date." });
        }

        const datePayload = {
            to: toTimeDate.toISOString(),
            from: fromTimeDate.toISOString()
        };

        let to = params.time.to;
        let from = params.time.from;

        const toArray = to.split(":");
        const fromArray = from.split(":");

        toTimeDate.setUTCHours(toArray[0]);
        toTimeDate.setUTCMinutes(toArray[1]);

        fromTimeDate.setUTCHours(fromArray[0]);
        fromTimeDate.setUTCMinutes(fromArray[1]);
        const timePayload = {
            to: toTimeDate.toISOString(),
            from: fromTimeDate.toISOString(),
            timezone: timezone
        };

        const today = new Date().getTime();

        if (fromTimeDate.getTime() < today || toTimeDate.getTime() < today) {
            return ({ error: true, message: "noPastDate" });
        }
        if (!isRecurring && rsvpEnd.getTime() < today) {
            return ({ error: true, message: "RSVP end date should be a future date." });
        }
        if (!isRecurring && rsvpEnd.getTime() > fromTimeDate.getTime()) {
            return ({ error: true, message: "rsvpEndGreaterStartEvent" });
        }

        let attendeesPayload = {};
        if (params.restrictNumberAttendees == true) {
            attendeesPayload['is_restricted'] = true;
            attendeesPayload['number_of_max_attendees'] = params.numberOfMaxAttendees;
            attendeesPayload['remaining_number_of_attendees'] = params.numberOfMaxAttendees;
            attendeesPayload['number_of_max_guests'] = params.numberOfMaxGuests;
        }
        if (params.webvistorRestriction == true) {
            attendeesPayload['webvistor_restriction'] = true;
            attendeesPayload['number_of_max_web_visitors'] = params.numberOfMaxWebVisitors;
            attendeesPayload['remaining_number_of_web_visitors'] = params.numberOfMaxWebVisitors;
            attendeesPayload['number_of_max_guests'] = params.numberOfMaxGuests;
        }
        if (params.attendeeListVisibilty == false) {
            attendeesPayload['attendees_list_visibility'] = "Public";
        }
        if (params.collectEventPhotos == true) {
            attendeesPayload['media_upload_by_attendees'] = true;
        }
        attendeesPayload['is_active'] = true;

        eventPayload['venue_details'] = venueDetailsPayload;
        eventPayload['date'] = datePayload;
        eventPayload['time'] = timePayload;
        eventPayload['attendees'] = attendeesPayload;
        let eventHostsArray = [];
        if (!Lib.isEmpty(params.eventHost)) {
            const eventHosts = params.eventHost;
            await Promise.all(eventHosts.map(async eventHost => {
                const hostUser = await User.findOne({ _id: ObjectId(eventHost) });
                if (!Lib.isEmpty(hostUser)) {
                    eventHostsArray.push({ user_id: hostUser._id });
                }
            }));
        }

        eventPayload['event_host'] = eventHostsArray;
        // eventPayload['rsvp'] = rsvpPayload;
        // eventPayload['groups'] = groupsArray
        // eventPayload['members'] = membersArray

        const event = new Events(eventPayload);
        event.created_at = new Date().toISOString();
        const res = await event.save();

        const member = community.members.find(
            (m) => m.member_id.toString() === userID.toString()
        );
        const userRole = member.roles;

        await ActivityLogService.activityLogActiion({
            communityId: communityId,
            userId: userID,
            module: "EVENT",
            action: "CREATE",
            platForm: "web",
            memberRole: userRole,
            oldData: null,
            newData: eventPayload
        })

        // Event RSVP add based on invitation type
        let rsvpPayload = [];
        let rsvpUserId = [];
        let groupsArray = [];
        let membersArray = [];
        let slug = "new-event-invite";
        let lang = 'en';
        if (invitationType === "Private") {
            rsvpPayload.push({
                user_id: new ObjectId(userID),
                status: "Attending"
            });
            rsvpUserId.push(userID);
        }
        // Adding group members as RSVP
        if (!Lib.isEmpty(params.groups) && invitationType === "Private") {
            const groups = params.groups;
            await Promise.all(groups.map(async groupId => {
                groupsArray.push({ group_id: ObjectId(groupId) });
                const group = await Group.findOne({ _id: ObjectId(groupId) });
                if (!Lib.isEmpty(group.members)) {
                    await Promise.all(group.members.map(async member => {
                        if (rsvpUserId.includes(member.member_id.toString()) === false && member.is_approved === true && member.is_active === true && member.is_deleted === false) {
                            rsvpPayload.push({ user_id: member.member_id, invited_by: ObjectId(userID) });
                            rsvpUserId.push(member.member_id.toString());
                        }
                    }));
                }
            }));
        }
        // Adding selected members as RSVP
        if (!Lib.isEmpty(params.members) && invitationType === "Private") {
            const members = params.members;
            await Promise.all(members.map(async member => {
                if (rsvpUserId.includes(member) === false) {
                    membersArray.push({ user_id: member });
                    rsvpPayload.push({ user_id: member, invited_by: ObjectId(userID) });
                    rsvpUserId.push(member.toString());
                }
            }));
        }
        const usersCount = rsvpUserId.length;
        await helperService.validateCreditsRemaining(community, usersCount, usersCount);

        // if (validate.error) {
        //     return { error: true, message: "Insufficient SMS Or EMAIL credits", data: null };
        // }
        const userAggregate = [
            {
                $match: {
                    _id: { $in: rsvpUserId.map(id => ObjectId(id)) },
                    is_deleted: false,
                }
            },
            {
                $project: {
                    name: "$name",
                    email: "$contact.email.address",
                    phone: "$contact.phone.number",
                    phoneCode: "$contact.phone.phone_code",
                    deviceDetails: "$device_details"
                }
            }
        ];

        const users = await User.aggregate(userAggregate);
        await Promise.all(users.map(async (user) => {
            const userId = user._id;
            const userEmail = user.email;
            const userPhone = user.phone;
            const userphoneCode = user.phoneCode;
            const deviceDetails = user.deviceDetails;

            let phoneNo = userphoneCode + userPhone;

            const ios = await NotificationSettings.findOne({ "user_id": userId, "community_id": communityId, "device_type": "ios", });
            const android = await NotificationSettings.findOne({ "user_id": userId, "community_id": communityId, "device_type": "android", });
            const web = await NotificationSettings.findOne({ "user_id": userId, "community_id": communityId, "device_type": "web", });


            // Fetching user device token 
            let webToken = [];
            if (deviceDetails) {
                if (ios) {
                    fcmToken = deviceDetails.filter(device => device.is_active === true && device.device_type == "ios").map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                    webToken = [...webToken, ...fcmToken];
                }
                if (android) {
                    fcmToken = deviceDetails.filter(device => device.is_active === true && device.device_type == "android").map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                    webToken = [...webToken, ...fcmToken];
                }
                if (web) {
                    webToken = deviceDetails.filter(device => device.is_active === true && device.device_type == "web").map(device => device.web_token).filter(token => token !== null && token !== undefined);
                    webToken = [...webToken, ...fcmToken];
                }
                // webToken = deviceDetails.filter(device => device.is_active === true).map(device => device.web_token).filter(token => token !== null && token !== undefined);
                // fcmToken = deviceDetails.filter(device => device.is_active === true).map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                // webToken = [...webToken, ...fcmToken];
            }
            const smspayload = {
                recipient:
                {
                    phone: phoneNo,
                },
                template: {
                    type: "SMS",
                    slug: "EVENTJOINREQ",
                    lang: "en"
                },
                contents: {
                    EVENTNAME: params.title
                }
            }
            const emailpayload = {
                recipient:
                {
                    email: userEmail
                },
                template: {
                    type: "Email",
                    slug: "EVENTEMAIL",
                    lang: "en"
                },
                contents: {
                    EVENTNAME: params.title
                }
            }
            const payload = {
                recipient:
                {
                    user_id: userId,
                    fcmToken: webToken
                },
                template: {
                    type: "Push",
                    slug: "new-event-invite",
                    lang: "en"
                },
                contents: {
                    USERNAME: userName,
                    COMMUNITYNAME: community.community_name,
                    EVENTNAME: params.title
                },
                image: params.image
            }
            const testpayload = {
                recipient:
                {
                    user_id: userId,
                    fcmToken: ["f6Vk3A1DRAmutEINCLxMGN:APA91bFnRv5f2N5Jz_0tPF4zMiAqgJ1LaGJcbmcp2NRtfc2pLhqerMy3zikeUbV5Xie8yVj619rsMQn04D4lXqIEgCRGyAEpbiKbaHFDB3Yqziy56nLbwOW6eSAJglDxaPCTrBuiN_bc"]
                },
                template: {
                    type: "Push",
                    slug: "new-event-invite",
                    lang: "en"
                },
                contents: {
                    USERNAME: userName,
                    COMMUNITYNAME: community.community_name,
                    EVENTNAME: params.title
                },
                image: params.image
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

            if (!isRecurring) {
                // SMS SEND
                if (sms_settings && smsEvent) {
                    await notificationServices.notifyService(smspayload);
                }
                //EMAIL SEND
                if (email_settings && emailEvent) {
                    await notificationServices.notifyService(emailpayload);
                }
                if (!Lib.isEmpty(notiSettings)) {
                    //check the community event notification settings
                    // if (notiSettings.community_event) {
                    if (communityEvent) {
                        //Push notification send
                        await notificationServices.notifyService(payload);
                    }
                }
            }
        }));
        // Deduct credits based on the number of users processed
        if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining >= usersCount) {
            community.sms_credits_remaining -= usersCount;
            await community.save();
        }

        if (community.sms_email_global_settings.email_settings && community.email_credits_remaining >= usersCount) {
            community.email_credits_remaining -= usersCount;
            await community.save();
        }
        //For member Events
        if (invitationType === "Members") {
            // Getting RSVP members from community members
            let aggregate = [
                {
                    '$match': {
                        '_id': new ObjectId(communityId)
                    }
                },
                {
                    '$unwind': {
                        'path': '$members'
                    }
                },
                {
                    '$match': {
                        'members.is_approved': true,
                        'members.is_active': true,
                        'members.is_rejected': false,
                        'members.is_leaved': false,
                        'members.is_deleted': false,
                        'members.roles': {
                            '$in': ["member", "executive_member", "board_member"]
                        }
                    }
                },
                {
                    $lookup: {
                        from: "sr_users",
                        localField: "members.member_id",
                        foreignField: "_id",
                        as: "members.user",
                    },
                },
                {
                    $unwind: {
                        path: "$members.user",
                    },
                },
                {
                    $match: {
                        "members.user.is_deleted": false,
                        // "members.user.is_active": true,
                    }
                },
                {
                    '$project': {
                        'members.member_id': 1,
                        "members.user._id": 1,
                        "members.user.name": 1,
                        "members.user.contact": 1,
                        "members.user.device_details": 1,
                    }
                }
            ];

            const communityMembers = await Communities.aggregate(aggregate);

            communityMembers.forEach(async element => {
                if (userID === element.members.member_id.toString()) {
                    rsvpPayload.push({
                        user_id: element.members.member_id,
                        status: "Attending"
                    });
                } else {
                    rsvpPayload.push({ user_id: element.members.member_id, invited_by: ObjectId(userID) });
                }
            });

        } else if (invitationType === "Public") {
            // Getting RSVP members from community members
            let aggregate = [
                {
                    '$match': {
                        '_id': new ObjectId(communityId)
                    }
                },
                {
                    '$unwind': {
                        'path': '$members'
                    }
                },
                {
                    '$match': {
                        'members.is_approved': true,
                        'members.is_active': true,
                        'members.is_rejected': false,
                        'members.is_leaved': false,
                        'members.is_deleted': false,
                        'members.roles': {
                            '$in': ["fan", "member", "executive_member", "board_member"]
                        }
                    }
                },
                {
                    $lookup: {
                        from: "sr_users",
                        localField: "members.member_id",
                        foreignField: "_id",
                        as: "members.user",
                    },
                },
                {
                    $unwind: {
                        path: "$members.user",
                    },
                },
                {
                    $match: {
                        "members.user.is_deleted": false,
                        // "members.user.is_active": true,
                    }
                },
                {
                    '$project': {
                        'members.member_id': 1,
                        "members.user._id": 1,
                        "members.user.name": 1,
                        "members.user.contact": 1,
                        "members.user.device_details": 1,
                    }
                }
            ];

            const communityMembers = await Communities.aggregate(aggregate);
            await communityMembers.forEach(async element => {
                if (userID === element.members.member_id.toString()) {
                    rsvpPayload.push({
                        user_id: element.members.member_id,
                        status: "Attending",
                        is_new: false
                    });
                } else {
                    rsvpPayload.push({ user_id: element.members.member_id, is_new: false, invited_by: ObjectId(userID) });
                }
            });
        }
        const validIds = rsvpPayload.map(item => {
            if (ObjectId.isValid(item.user_id)) {
                return ObjectId(item.user_id);
            } else {
                throw new Error(`Invalid ObjectId: ${item.user_id}`);
            }
        });
        if (invitationType === "Members" || invitationType === "Public") {
            const userCount = validIds.length;
            await helperService.validateCreditsRemaining(community, userCount, userCount);
            const usersAggregation = [
                {
                    $match: {
                        _id: { $in: validIds },
                        is_deleted: false,
                    }
                },
                {
                    $project: {
                        name: "$name",
                        email: "$contact.email.address",
                        phone: "$contact.phone.number",
                        phoneCode: "$contact.phone.phone_code",
                        deviceDetails: "$device_details"
                    }
                }
            ];

            const userinfo = await User.aggregate(usersAggregation);

            await Promise.all(userinfo.map(async (user) => {
                const userId = user._id;
                const userEmail = user.email;
                const userPhone = user.phone;
                const userphoneCode = user.phoneCode;
                const deviceDetails = user.deviceDetails;

                let phoneNo = userphoneCode + userPhone;

                const ios = await NotificationSettings.findOne({ "user_id": userId, "community_id": communityId, "device_type": "ios", });
                const android = await NotificationSettings.findOne({ "user_id": userId, "community_id": communityId, "device_type": "android", });
                const web = await NotificationSettings.findOne({ "user_id": userId, "community_id": communityId, "device_type": "web", });


                // Fetching user device token 
                let webToken = [];
                if (deviceDetails) {
                    if (ios) {
                        fcmToken = deviceDetails.filter(device => device.is_active === true && device.device_type == "ios").map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                        webToken = [...webToken, ...fcmToken];
                    }
                    if (android) {
                        fcmToken = deviceDetails.filter(device => device.is_active === true && device.device_type == "android").map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                        webToken = [...webToken, ...fcmToken];
                    }
                    if (web) {
                        webToken = deviceDetails.filter(device => device.is_active === true && device.device_type == "web").map(device => device.web_token).filter(token => token !== null && token !== undefined);
                        webToken = [...webToken, ...fcmToken];
                    }
                }

                // // Fetching user device token 
                // let webToken = [];
                // if (deviceDetails) {
                //     webToken = deviceDetails.filter(device => device.is_active === true).map(device => device.web_token);
                //     fcmToken = deviceDetails.filter(device => device.is_active === true).map(device => device.fcm_token);
                //     webToken = [...webToken, ...fcmToken];
                // }
                const smspayload = {
                    recipient:
                    {
                        phone: phoneNo,
                    },
                    template: {
                        type: "SMS",
                        slug: "EVENTJOINREQ",
                        lang: "en"
                    },
                    contents: {
                        EVENTNAME: params.title
                    }
                }
                const emailpayload = {
                    recipient:
                    {
                        email: userEmail
                    },
                    template: {
                        type: "Email",
                        slug: "EVENTEMAIL",
                        lang: "en"
                    },
                    contents: {
                        EVENTNAME: params.title
                    }
                }
                const payload = {
                    recipient:
                    {
                        user_id: userId,
                        fcmToken: webToken
                    },
                    template: {
                        type: "Push",
                        slug: "new-event-invite",
                        lang: "en"
                    },
                    contents: {
                        USERNAME: userName,
                        COMMUNITYNAME: community.community_name,
                        EVENTNAME: params.title
                    },
                    image: params.image
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
                if (!isRecurring) {
                    // SMS SEND
                    if (sms_settings && smsEvent) {
                        await notificationServices.notifyService(smspayload);
                    }
                    //EMAIL SEND
                    if (email_settings && emailEvent) {
                        await notificationServices.notifyService(emailpayload);
                    }
                    if (!Lib.isEmpty(notiSettings)) {
                        //check the community event notification settings
                        // if (notiSettings.community_event) {
                        if (communityEvent) {
                            //Push notification send
                            await notificationServices.notifyService(payload);
                        }
                    }
                }
            }));

            // Deduct credits based on the number of users processed
            if (!isRecurring) {
                if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining >= userCount) {
                    community.sms_credits_remaining -= userCount;
                    await community.save();
                }

                if (community.sms_email_global_settings.email_settings && community.email_credits_remaining >= userCount) {
                    community.email_credits_remaining -= userCount;
                    await community.save();
                }
            }
        }
        const eventUpdate = await Events.findOne({
            _id: ObjectId(res._id)
        });
        eventUpdate.rsvp = rsvpPayload;
        eventUpdate.groups = groupsArray;
        eventUpdate.members = membersArray;
        eventUpdate.save();

        return { error: false, message: "eventCreateSuccess", data: { id: (res._id).toString() } };
    },

    updateEvent: async function (id, params, context) {
        try {
            const invitationType = params.invitationType;
            const userID = context.user.id;
            const userName = context.user.name;
            const user = await User.findOne({ _id: userID });
            const event = await Events.findOne({ _id: id });
            // store event old data
            const oldData = event.toObject();
            const toTimeDate = params.date && params.date.to ? new Date(Date.parse(params.date.to)) : event.date.to;
            const fromTimeDate = params.date && params.date.from ? new Date(Date.parse(params.date.from)) : event.date.from;
            const rsvpEnd = params.rsvpEndTime ? new Date(Date.parse(params.rsvpEndTime)) : event.rsvp_end_time;
            const communityId = event.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(communityId) });
            if (!community) {
                throw new ErrorModules.Api404Error("noCommunityFound");
            }
            const { sms_settings, email_settings } = community.sms_email_global_settings;
            if (user.user_type == 'admin' || event.host_id == userID) {
                event.title = params.title ? params.title : event.title;
                event.type = params.type ? params.type : event.type;
                event.description = params.description ? params.description : event.description;
                event.image = params.image ? params.image : event.image;
                event.logo_image = params.logoImage ? params.logoImage : event.logo_image;
                // event.invitation_type = params.invitationType ? params.invitationType : event.invitation_type;      

                event.post_event_as_community = params.postEventAsCommunity ? params.postEventAsCommunity : event.post_event_as_community;

                // Payment status category edit
                if (event.payment_status === 'Paid' && !Lib.isEmpty(params.paymentCategory)) {
                    event.payment_category = params.paymentCategory;
                }
                // Payment packages edit
                if (event.payment_status === 'Paid' && !Lib.isEmpty(params.paymentPackages)) {
                    const packages = params.paymentPackages;
                    let paymentPackages = [];
                    if (packages.length > 10) {
                        return ({ error: true, message: "Can't add more than 10 packages." });
                    }
                    await Promise.all(packages.map(async package => {
                        const earlyBirdDate = package.earlyBirdDate ? new Date(Date.parse(package.earlyBirdDate)) : null;
                        if (earlyBirdDate && earlyBirdDate.getTime() > rsvpEnd.getTime()) {
                            return ({ error: true, message: "Early bird date should not be greater than RSVP end date." });
                        }
                        if (earlyBirdDate && earlyBirdDate.getTime() > fromTimeDate.getTime()) {
                            return ({ error: true, message: "Early bird date should not be greater than From date." });
                        }
                        paymentPackages.push({
                            currency: package.currency,
                            package_name: package.packageName,
                            package_rate: package.packageRate,
                            package_logo: package.packageLogo,
                            early_bird_date: earlyBirdDate,
                            early_bird_rate: package.earlyBirdRate ? package.earlyBirdRate : null,
                            description: package.description,
                            is_active: package.isActive
                        });
                    }));

                    event.payment_packages = paymentPackages;
                }


                //Venue details update 
                if (!Lib.isEmpty(params.venueDetails)) {
                    // Adding latitude-longitude location for event
                    let first_address_line = params.venueDetails.firstAddressLine ? params.venueDetails.firstAddressLine : event.venue_details.first_address_line;
                    let city = params.venueDetails.city ? params.venueDetails.city : '';
                    let state = params.venueDetails.state ? params.venueDetails.state : '';
                    let country = params.venueDetails.country ? params.venueDetails.country : '';
                    let zipcode = params.venueDetails.zipcode ? params.venueDetails.zipcode : '';
                    let mainAddress = first_address_line + ',' + city + ',' + state + ',' + zipcode + ',' + country;

                    const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${mainAddress}&key=${process.env.GEOCODE_KEY}`;

                    const response = await axios({
                        url: endpoint,
                        method: 'get'
                    });
                    let latitude = '';
                    let longitude = '';
                    if (response.data.status == 'OK') {
                        latitude = response.data.results[0].geometry.location.lat;
                        longitude = response.data.results[0].geometry.location.lng;
                    }

                    event.venue_details.city = params.venueDetails.city ? params.venueDetails.city : event.venue_details.city;
                    event.venue_details.state = params.venueDetails.state ? params.venueDetails.state : event.venue_details.state;
                    event.venue_details.country = params.venueDetails.country ? params.venueDetails.country : event.venue_details.country;
                    event.venue_details.zipcode = params.venueDetails.zipcode ? params.venueDetails.zipcode : event.venue_details.zipcode;
                    event.venue_details.phone_no = params.venueDetails.phoneNo ? params.venueDetails.phoneNo : event.venue_details.phone_no;
                    event.venue_details.first_address_line = params.venueDetails.firstAddressLine ? params.venueDetails.firstAddressLine : event.venue_details.first_address_line;
                    event.venue_details.second_address_line = params.venueDetails.secondAddressLine ? params.venueDetails.secondAddressLine : event.venue_details.second_address_line;
                    event.venue_details.latitude = latitude ? latitude : event.venue_details.latitude;
                    event.venue_details.longitude = longitude ? longitude : event.venue_details.longitude;
                }



                //Date Update                  
                if (fromTimeDate.getTime() > toTimeDate.getTime()) {
                    return ({ error: true, message: "From date should not be greater than to date." });
                }


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
                if (params.webvistorRestriction == true) {
                    event.attendees.webvistor_restriction = true;
                } else {
                    event.attendees.webvistor_restriction = false;
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
                    event.attendees.remaining_number_of_attendees = (params.numberOfMaxAttendees - event.attendees.number_of_max_attendees) + event.attendees.remaining_number_of_attendees;
                    event.attendees.number_of_max_attendees = params.numberOfMaxAttendees;
                }
                if (params.numberOfMaxWebVisitors) {
                    event.attendees.remaining_number_of_web_visitors = (params.numberOfMaxWebVisitors - event.attendees.number_of_max_web_visitors) + event.attendees.remaining_number_of_web_visitors;
                    event.attendees.number_of_max_web_visitors = params.numberOfMaxWebVisitors;
                }
                if (params.numberOfMaxGuests) {
                    event.attendees.number_of_max_guests = params.numberOfMaxGuests;
                }
                event.attendees.is_active = true;

                // Event RSVP add based on invitation type
                const rsvp = event.rsvp;
                let rsvpPayload = rsvp;
                let rsvpUserId = rsvp.map(x => x.user_id?.toString()).filter(x => !!x);
                let groupsArray = event.groups ? event.groups : [];
                let membersArray = event.members ? event.members : [];
                let rsvpnewUserId = [];
                let slug = "new-event-invite";
                let lang = 'en';
                const existGroup = event.groups.map(x => x.group_id.toString());

                // Adding group members as RSVP
                if (!Lib.isEmpty(params.groups) && invitationType === "Private") {
                    const newGroups = params.groups.filter((element) => !existGroup.includes(element));
                    await Promise.all(newGroups.map(async groupId => {
                        groupsArray.push({ group_id: ObjectId(groupId) });
                        const group = await Group.findOne({ _id: ObjectId(groupId) });
                        group.members.forEach(member => {
                            if (!rsvpUserId.includes(member.member_id.toString()) && !rsvpnewUserId.includes(member.member_id.toString())) {
                                rsvpnewUserId.push(member.member_id.toString());
                            }
                        });
                        if (!Lib.isEmpty(group.members)) {
                            await Promise.all(group.members.map(async member => {
                                if (rsvpUserId.includes(member.member_id.toString()) === false && member.is_approved === true && member.is_active === true && member.is_deleted === false) {
                                    rsvpPayload.push({ user_id: member.member_id, invited_by: ObjectId(userID) });
                                    rsvpUserId.push(member.member_id.toString());
                                }
                            }));
                        }
                    }));
                }

                // Adding selected members as RSVP
                if (!Lib.isEmpty(params.members) && invitationType === "Private") {
                    const members = params.members;
                    await Promise.all(members.map(async member => {
                        if (!rsvpUserId.includes(member) && !rsvpnewUserId.includes(member)) {
                            rsvpnewUserId.push(member);
                        }

                        if (rsvpUserId.includes(member) === false) {
                            membersArray.push({ user_id: member });
                            rsvpPayload.push({ user_id: member, invited_by: ObjectId(userID) });
                            rsvpUserId.push(member.toString());
                        }
                    }));
                }
                const usersCount = rsvpnewUserId.length;
                await helperService.validateCreditsRemaining(community, usersCount, usersCount);
                const userAggregate = [
                    {
                        $match: {
                            _id: { $in: rsvpnewUserId.map(id => ObjectId(id)) },
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

                const users = await User.aggregate(userAggregate);
                await Promise.all(users.map(async (user) => {
                    const userId = user._id;
                    const userEmail = user.email;
                    const userPhone = user.phone;
                    const userphoneCode = user.phoneCode;
                    const deviceDetails = user.deviceDetails;

                    let phoneNo = userphoneCode + userPhone;

                    const ios = await NotificationSettings.findOne({ "user_id": userId, "community_id": communityId, "device_type": "ios", });
                    const android = await NotificationSettings.findOne({ "user_id": userId, "community_id": communityId, "device_type": "android", });
                    const web = await NotificationSettings.findOne({ "user_id": userId, "community_id": communityId, "device_type": "web", });


                    // Fetching user device token 
                    let webToken = [];
                    if (deviceDetails) {
                        if (ios) {
                            fcmToken = deviceDetails.filter(device => device.is_active === true && device.device_type == "ios").map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                            webToken = [...webToken, ...fcmToken];
                        }
                        if (android) {
                            fcmToken = deviceDetails.filter(device => device.is_active === true && device.device_type == "android").map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                            webToken = [...webToken, ...fcmToken];
                        }
                        if (web) {
                            webToken = deviceDetails.filter(device => device.is_active === true && device.device_type == "web").map(device => device.web_token).filter(token => token !== null && token !== undefined);
                            webToken = [...webToken, ...fcmToken];
                        }
                        // webToken = deviceDetails.filter(device => device.is_active === true).map(device => device.web_token).filter(token => token !== null && token !== undefined);
                        // fcmToken = deviceDetails.filter(device => device.is_active === true).map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                        // webToken = [...webToken, ...fcmToken];
                    }
                    const smspayload = {
                        recipient:
                        {
                            phone: phoneNo,
                        },
                        template: {
                            type: "SMS",
                            slug: "EVENTJOINREQ",
                            lang: "en"
                        },
                        contents: {
                            EVENTNAME: params.title
                        }
                    }
                    const emailpayload = {
                        recipient:
                        {
                            email: userEmail
                        },
                        template: {
                            type: "Email",
                            slug: "EVENTEMAIL",
                            lang: "en"
                        },
                        contents: {
                            EVENTNAME: params.title
                        }
                    }
                    const payload = {
                        recipient:
                        {
                            user_id: userId,
                            fcmToken: webToken
                        },
                        template: {
                            type: "Push",
                            slug: "new-event-invite",
                            lang: "en"
                        },
                        contents: {
                            USERNAME: userName,
                            COMMUNITYNAME: community.community_name,
                            EVENTNAME: params.title
                        },
                        image: params.image
                    }
                    const notiSettings = await NotificationSettings.findOne({ user_id: userId });
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
                    // if (!isRecurring) {
                    // SMS SEND
                    if (sms_settings && smsEvent) {
                        await notificationServices.notifyService(smspayload);
                    }
                    //EMAIL SEND
                    if (email_settings && emailEvent) {
                        await notificationServices.notifyService(emailpayload);
                    }
                    if (!Lib.isEmpty(notiSettings)) {
                        //check the community event notification settings
                        // if (notiSettings.community_event) {
                        if (communityEvent) {
                            //Push notification send
                            await notificationServices.notifyService(payload);
                        }
                        // }
                    }
                }));
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
            event.updated_at = new Date();
            const updateEvent = await event.save();
            // Activity log
            const newData = updateEvent.toObject();
            const changes = {};
            const getChangedFields = (oldObj, newObj, prefix = "") => {
                Object.keys(newObj).forEach(key => {
                    if (typeof newObj[key] === "object" && newObj[key] !== null && !Array.isArray(newObj[key])) {
                        getChangedFields(oldObj[key] || {}, newObj[key], `${prefix}${key}.`);
                    } else if (JSON.stringify(oldObj?.[key]) !== JSON.stringify(newObj[key])) {
                        changes[`${prefix}${key}`] = {
                            old: oldObj?.[key],
                            new: newObj[key]
                        };
                    }
                });
            };
            getChangedFields(oldData, newData);

            const member = community.members.find(
                (m) => m.member_id.toString() === userID.toString()
            );
            const userRole = member.roles;

            if (Object.keys(changes).length > 0) {
                await ActivityLogService.activityLogActiion({
                    communityId: communityId,
                    userId: userID,
                    module: "EVENT",
                    action: "UPDATE",
                    oldData: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.old])),
                    newData: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.new])),
                    platForm: "web",
                    memberRole: userRole
                });
            }

            return ({ error: false, message: "eventUpdateSuccess", data: updateEvent });
        } catch (err) {
            console.log(err, 'err');
            throw new ErrorModules.DatabaseError("Event update error");
        }

    },

    deleteEvent: async function (id, UserId) {
        try {
            const EventObj = {
                "is_deleted": true
            }
            const user = await User.findOne({ _id: UserId });
            const event = await Events.findOne({ _id: id });
            if (Lib.isEmpty(event)) {
                return ({ error: true, message: "No event found.", ErrorClass: ErrorModules.Api404Error });
            }
            if (user.user_type == 'admin' || event.host_id == UserId) {
                let updateEvent = await Events.findOneAndUpdate({ _id: ObjectId(id), user_id: UserId }, { "$set": EventObj });

                const id = event.community_id;
                const community = await Communities.findOne({ _id: new ObjectId(id) });
                const member = community.members.find(
                    (m) => m.member_id.toString() === UserId.toString()
                );
                const userRole = member.roles;

                await ActivityLogService.activityLogActiion({
                    communityId: event.community_id,
                    userId: UserId,
                    module: "EVENT",
                    action: "DELETE",
                    platForm: "web",
                    memberRole: userRole,
                    oldData: null,
                    newData: null
                })
                return ({ error: false, message: "generalSuccess", data: updateEvent });
            } else {
                throw new ErrorModules.DatabaseError("User does not have the permission to delete.");
            }

        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Event find error");
        }
    },

    respondOrEditRSVP: async function (params, userId) {
        const eventId = params.eventId;
        let adults = params.adults ? params.adults : 0;
        let minor = params.minor ? params.minor : 0;
        const event = await Events.findOne({ _id: ObjectId(eventId), is_deleted: false, is_active: true });
        if (Lib.isEmpty(event)) {
            return ({ error: true, message: "No event found.", ErrorClass: ErrorModules.Api404Error });
        }
        if (event.attendees.is_restricted === true && adults + minor > event.attendees.number_of_max_attendees) {
            return ({ error: true, message: "eventAttendeesExceeded", ErrorClass: ErrorModules.Api404Error });
        }

        let memberIndex = -1;
        const member = event.rsvp.find((m, i) => {
            if ((m.user_id).toString() === userId) {
                memberIndex = i;
                return true;
            }
        });
        if (memberIndex >= 0) {
            // store old data
            const oldData = JSON.parse(JSON.stringify(event.rsvp[memberIndex]));

            member.status = params.status;
            member.updated_at = new Date();
            member.guests = {
                adults: adults,
                minor: minor,
                total: adults + minor,
            }
            let rsvpFamiltyMember = []
            if (params.familyMembers && params.familyMembers.length > 0) {
                member.guests.family_members = [];
                params.familyMembers.forEach(element => {
                    let familyObj = {
                        name: element.name,
                        relation: element.relation
                    }

                    if (element.userId) {
                        familyObj.user_id = new ObjectId(element.userId);
                    }

                    rsvpFamiltyMember.push(familyObj);
                });
            }

            member.guests.family_members = rsvpFamiltyMember;

            await event.save();

            // ✅ get new data snapshot after save
            const updatedEvent = await Events.findOne({ _id: ObjectId(eventId) });
            const newData = updatedEvent.rsvp.find(m => (m.user_id).toString() === userId);

            const id = event.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;
            // call Activity log
            await ActivityLogService.activityLogActiion({
                communityId: event.community_id,
                userId: userId,
                module: "EVENT_RSVP",
                action: "UPDATE",
                platForm: "app",
                memberRole: userRole,
                oldData: oldData,
                newData: newData
            })
            return { error: false, message: "respondSuccess" }
        } else {
            return { error: true, message: "noEventRsvpFound", ErrorClass: ErrorModules.Api404Error };
        }

    },

    privateEventInvite: async function (params) {
        const eventId = params.eventId;
        const ids = params.userIds;
        const event = await Events.findOne({ _id: ObjectId(eventId), invitation_type: "Private", is_deleted: false, is_active: true });
        if (Lib.isEmpty(event)) {
            return ({ error: true, message: "No private event found.", ErrorClass: ErrorModules.Api404Error });
        }
        let inviteArray = []
        let rsvpPayload = []
        if (event.rsvp && event.rsvp.length !== 0) {
            //Checking if the user is already a member or not
            await ids.forEach(async elm => {
                let isRsvp = await event.rsvp.find(member => member.user_id && member.user_id.toString() === elm);
                if (Lib.isEmpty(isRsvp)) {
                    inviteArray.push(elm)
                }
            });
            rsvpPayload = event.rsvp;
        } else {
            inviteArray = ids;
        }
        let slug = "private-invite";
        let lang = 'en';
        inviteArray.forEach(async elm => {
            rsvpPayload.push({ user_id: elm });
            const notiSettings = await NotificationSettings.findOne({ user_id: new ObjectId(elm) });
            if (!Lib.isEmpty(notiSettings)) {
                //check the private event notification settings
                if (notiSettings.private_event) {
                    //Push notification send
                    await notificationHelper.getFcmTokens(elm, slug, lang);
                }
            }
        });
        event['rsvp'] = rsvpPayload;
        await event.save();
        return { error: false, message: "inviteSuccess" };

    },

    isRsvpOfEvent: async function (eventId, userId, joined = false) {
        let aggregate = [
            {
                '$match': {
                    '_id': new ObjectId(eventId),
                }
            },
            {
                '$unwind': {
                    'path': '$rsvp'
                }
            },
            {
                '$match': {
                    'rsvp.user_id': new ObjectId(userId),
                }
            },

        ];
        if (joined) {
            aggregate.push({
                '$match': {
                    'rsvp.status': "Attending",
                }
            });
        }

        const event = await Events.aggregate(aggregate);
        if (Lib.isEmpty(event)) {
            return ({ error: true, message: "Not a RSVP member.", ErrorClass: ErrorModules.Api404Error });
        }
        return ({ error: false, message: "generalSuccess", data: true });

    },

    cancelEvent: async function (id, communityId, userId) {
        const EventObj = {
            // "is_active": false,
            "is_cancelled": true
        }
        const user = await User.findOne({ _id: userId });
        const event = await Events.findOne({ _id: ObjectId(id), community_id: ObjectId(communityId), is_deleted: false });

        if (Lib.isEmpty(event)) {
            return ({ error: true, message: "No event found.", ErrorClass: ErrorModules.Api404Error });
        }
        if (event.date.from > new Date() === false) {
            return ({ error: true, message: "Unable to cancel the event because it has already started." });
        }
        if (user.user_type === 'admin' || (event.host_id).toString() === userId) {
            let updateEvent = await Events.findOneAndUpdate({ _id: ObjectId(id) }, { "$set": EventObj });
            // Update related EventTasks
            await EventTask.updateMany({ event_id: ObjectId(id) }, { "$set": { "is_cancelled": true } });
            //update Event Supplier
            await EventSupplierManagement.updateMany({ event_id: ObjectId(id) }, { "$set": { "is_cancelled": true } });

            const id = event.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: event.communityId,
                userId: userId,
                module: "EVENT",
                action: "CANCEL",
                platForm: "web",
                memberRole: userRole,
                oldData: null,
                newData: null
            })
            return ({ error: false, message: "generalSuccess" });
        } else {
            throw new ErrorModules.DatabaseError("User does not have the permission to cancel the event.");
        }
    },

    getEventPhotos: async function (id) {

        const event = await Events.aggregate([
            {
                '$match': {
                    '_id': new ObjectId(id),
                    'is_deleted': false,
                    'is_active': true,
                }
            },
            {
                '$unwind':
                {
                    path: '$attendees.event_images',
                }
            },
            {
                '$match': {
                    'attendees.event_images.is_deleted': false
                }
            },
            {
                '$project': {
                    'attendees.event_images': 1
                }
            }
        ]);

        return ({ error: false, message: "generalSuccess", data: Lib.reconstructObjectKeys(event) });

    },

    eventStatusChange: async function (eventId, userId) {
        const event = await Events.findOne({
            _id: ObjectId(eventId)
        });
        if (Lib.isEmpty(event)) {
            return { error: true, message: "No event found", ErrorClass: ErrorModules.Api404Error };
        }
        // store old data
        const oldData = {
            event_name: event.title,
            is_active: event.is_active
        };

        if (event.is_active == true) {
            event.is_active = false;
        } else {
            event.is_active = true;
        }

        await event.save();

        const id = event.community_id;
        const community = await Communities.findOne({ _id: new ObjectId(id) });
        const member = community.members.find(
            (m) => m.member_id.toString() === userId.toString()
        );
        const userRole = member.roles;

        // Log the changes
        await ActivityLogService.activityLogActiion({
            communityId: event.community_id,
            userId: userId,
            module: "EVENT",
            action: "STATUS_CHANGE",
            platForm: "web",
            memberRole: userRole,
            oldData: oldData,
            newData: {
                event_name: event.title,
                is_active: event.is_active
            }
        })
        return { error: false, message: "statusChangedSuccess" };
    },

    acceptOrRejectEvent: async function (userId, data) {
        try {
            const attending = data.status === 'Attending' ? true : false;
            const packageDetails = data.packageDetails;
            // Member role
            const role = data.role;
            //Numbers of guests
            let numberSeniors = data.numberSeniors ? data.numberSeniors : 0;
            let numberAdults = data.numberAdults ? data.numberAdults : 0;
            let numberChildren = data.numberChildren ? data.numberChildren : 0;
            let incomingTotal = numberSeniors + numberAdults + numberChildren;
            let total = numberSeniors + numberAdults + numberChildren;
            let eventPaymentId;
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

            if (data.force_join == false) {
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
                    return {
                        error: true,
                        systemCode: "REMAINING_ATTENDEES_EXCEEDED",
                        code: 400,
                        message: "Number of remaining attendees exceeded."
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
                    return {
                        error: true,
                        code: 403,
                        systemCode: 'USER_NOT_IN_ASSIGNED_MEMBERS',
                        message: 'User is not in the assigned members list'
                    };
                } else if (event.invitation_type === "Private") {
                    return {
                        error: true,
                        code: 403,
                        systemCode: 'USER_NOT_IN_ASSIGNED_MEMBERS',
                        message: 'User is not in the assigned members list'
                    };
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
                    return {
                        error: true,
                        code: 400,
                        systemCode: 'STATUS_NOT_ALLOWED',
                        message: 'Cannot change the RSVP status for this event again.'
                    };
                }
                // Update status and save
                event.rsvp[memberIndex].guests = guestPayload;
                event.rsvp[memberIndex].status = data.status;
            }

            await event.save();

            const id = event.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const memberRole = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = memberRole.roles;

            await ActivityLogService.activityLogActiion({
                communityId: event.community_id,
                userId: userId,
                module: "EVENT",
                action: data.status.toUpperCase(),
                platForm: "app",
                memberRole: userRole,
                oldData: null,
                newData: guestPayload
            })

            if (data.status === 'Attending' && event.payment_status === 'Paid') {
                let total_amount = 0;
                let package_ids = [];
                let currency = '';
                if (!Lib.isEmpty(packageDetails)) {
                    if (event.payment_category === 'per_head') {
                        let perHeadPackage = packageDetails[0];
                        let package = event.payment_packages.find(pack => pack._id.toString() === perHeadPackage.packageId);
                        currency = package.currency;
                        if (package.early_bird_date && package.early_bird_date.getTime() > new Date().getTime()) {
                            total_amount = perHeadPackage.number * package.early_bird_rate;
                        } else {
                            total_amount = perHeadPackage.number * package.package_rate;
                        }
                        package_ids.push({ package_id: perHeadPackage.packageId, number: perHeadPackage.number });
                    } else {
                        await Promise.all(packageDetails.map(async packData => {
                            let package = event.payment_packages.find(pack => pack._id.toString() === packData.packageId);
                            currency = package.currency;
                            if (package.early_bird_date && package.early_bird_date.getTime() > new Date().getTime()) {
                                total_amount += packData.number * package.early_bird_rate;
                            } else {
                                total_amount += packData.number * package.package_rate;
                            }
                            package_ids.push({ package_id: packData.packageId, number: packData.number });
                        }));
                    }
                    // Create event payment entry
                    const EventPaymentPayload = {
                        event_id: new ObjectId(data.eventId),
                        user_id: new ObjectId(userId),
                        member_type: 'user',
                        amount: total_amount,
                        currency: currency,
                        no_of_attendees: incomingTotal,
                        rsvp_status: "tentatively_paid",
                        package_details: package_ids,
                    }
                    const eventPayment = new EventPayment(EventPaymentPayload);
                    const res = await eventPayment.save();
                    eventPaymentId = res._id;
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
                message: `Event status updated to ${data.status}.`,
                data: {
                    id: eventPaymentId
                }
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

    removeGroupOrMemberEvent: async function (eventId, data, context) {
        try {
            const type = data.type.toLowerCase();
            const userID = context.user.id;
            const user = await User.findOne({ _id: userID });
            const id = data.id;
            // const eventId = data.eventId;
            const event = await Events.findOne({ _id: ObjectId(eventId), is_active: true, is_deleted: false });
            if (Lib.isEmpty(event)) {
                return ({ error: true, message: "No event found.", ErrorClass: ErrorModules.Api404Error });
            }
            if (user.user_type == 'admin' || event.host_id == userID) {
                if (type === 'group') {
                    const group = await Group.findOne({ _id: ObjectId(id) });
                    // Extract user IDs from group members
                    const groupMemberIds = group.members
                        .filter(member => !member.is_rejected && !member.is_leaved && !member.is_deleted && member.is_active && member.is_approved)
                        .map(member => member.member_id);

                    const groupMemberIdstring = group.members
                        .filter(member => !member.is_rejected && !member.is_leaved && !member.is_deleted && member.is_active && member.is_approved)
                        .map(member => member.member_id.toString());

                    let eventAggregate = [
                        {
                            '$match': {
                                "_id": ObjectId(eventId)
                            }
                        },
                        {
                            '$unwind': {
                                'path': '$rsvp'
                            },
                        },
                        {
                            '$match': {
                                "rsvp.user_id": { $in: groupMemberIds },
                                "rsvp.status": "Attending"
                            }
                        },

                    ];
                    const isAttending = await Events.aggregate(eventAggregate);

                    if (!Lib.isEmpty(isAttending)) {
                        // Group not delete
                        return ({ error: true, message: "Can't remove the group because members of this group is already attending the event.", ErrorClass: ErrorModules.GeneralApiError });
                    } else {
                        //delete all members of the group 
                        await Promise.all(event.rsvp.map(async (rsvp, index) => {
                            if (groupMemberIdstring.includes(rsvp.user_id.toString())) {
                                event.rsvp.splice(index, 1);
                            }
                        }));
                        event.groups = event.groups.filter(group => group.group_id.toString() !== id);
                        await event.save();
                        return {
                            error: false,
                            systemCode: 'SUCCESS',
                            message: 'Group removed successfully.'
                        };
                    }
                } else {
                    let isAttending = false;
                    await Promise.all(event.rsvp.map(async (rsvp, index) => {
                        if (rsvp.user_id && rsvp.user_id.toString() === id) {
                            if (rsvp.status !== 'Attending') {
                                event.rsvp.splice(index, 1);
                            } else {
                                isAttending = true;
                            }
                        }
                    }));
                    if (isAttending) {
                        return ({ error: true, message: "Can't remove the member because this member is already attending the event.", ErrorClass: ErrorModules.GeneralApiError });
                    }
                }
                event.members = event.members.filter(member => member.user_id.toString() !== id);
                await event.save();
                return {
                    error: false,
                    systemCode: 'SUCCESS',
                    message: 'Member removed successfully.'
                };
            }
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_UPDATING_STATUS',
                message: error.message
            };
        }
    },

    eventAttendingAlert: async function (userId, eventId) {
        const eventDetails = await Events.findOne({
            _id: new ObjectId(eventId),
            is_deleted: false,
            is_active: true
        });

        if (!eventDetails) {
            return { error: true, message: "Event not found", data: null };
        }
        const fromTime = eventDetails.time.from;
        const toTime = eventDetails.time.to;

        const event = await Events.aggregate([
            {
                '$match': {
                    '_id': { '$ne': new ObjectId(eventId) },
                    'is_deleted': false,
                    'is_active': true,
                }
            },
            {
                '$match': {
                    '$or':
                        [
                            {
                                '$and': [
                                    {
                                        "time.from": {
                                            $gt: new Date(fromTime)
                                        }
                                    }, {
                                        "time.from": {
                                            $lte: new Date(toTime)
                                        }
                                    }]
                            },
                            {
                                '$and': [
                                    {
                                        "time.to": {
                                            $gt: new Date(fromTime)
                                        }
                                    }, {
                                        "time.to": {
                                            $lte: new Date(toTime)
                                        }
                                    }
                                ]
                            },
                            {
                                $and: [
                                    {
                                        "time.from": {
                                            $lt: new Date(fromTime)
                                        }
                                    }, {
                                        "time.to": {
                                            $gt: new Date(toTime)
                                        }
                                    }
                                ]
                            }
                        ]
                }
            },
            {
                '$unwind': {
                    'path': '$rsvp'
                },
            },
            {
                '$match': {
                    "rsvp.user_id": new ObjectId(userId),
                    "rsvp.status": "Attending"
                }
            }

        ]);
        if (Lib.isEmpty(event)) {
            return {
                error: false,
                code: 200,
                systemCode: 'SUCCESS',
                message: 'Success',
                data: event
            };
        }
        return {
            error: false,
            code: 202,
            systemCode: 'SUCCESS',
            message: 'Success',
            data: Lib.reconstructObjectKeys(event, ["rsvp_end_time", "to", "from"], Lib.convertIsoDate)
        };
    },

    cancelRsvp: async function (userId, data) {
        const eventId = data.eventId;
        const packageDetails = data.packageDetails;

        let numberSeniors = data.numberSeniors;
        let numberAdults = data.numberAdults;
        let numberChildren = data.numberChildren;
        let total = numberSeniors + numberAdults + numberChildren;

        const event = await Events.findOne({
            _id: new ObjectId(eventId),
            is_deleted: false,
            is_active: true
        });

        if (!event) {
            return { error: true, message: "Event not found", data: null };
        }

        let memberIndex = -1;
        const member = event.rsvp.find((m, i) => {
            if ((m.user_id).toString() === userId) {
                memberIndex = i;
                return true;
            }
        });
        if (member.status !== 'Attending') {
            return { error: false, message: "memberNotAttendingEvent" }
        }
        if (memberIndex >= 0) {
            member.updated_at = new Date();
            member.guests.seniors = member.guests.seniors - numberSeniors;
            member.guests.adults = member.guests.adults - numberAdults;
            member.guests.minor = member.guests.minor - numberChildren;
            member.guests.total = member.guests.total - total;

            member.status = member.guests.total === 0 ? 'Not_Attending' : data.status;
            if (event.payment_status === 'Paid' && !Lib.isEmpty(packageDetails)) {
                const eventPayment = await EventPayment.findOne({ user_id: ObjectId(userId), event_id: ObjectId(eventId) });

                await Promise.all(packageDetails.map(async packData => {
                    let package = event.payment_packages.find(pack => pack._id.toString() === packData.packageId);
                    let deductAmount = 0;
                    if (package && eventPayment) {
                        if (package.early_bird_date && package.early_bird_date.getTime() > new Date(eventPayment.created_at).getTime()) {
                            deductAmount = packData.number * package.early_bird_rate;
                        } else {
                            deductAmount = packData.number * package.package_rate;
                        }

                        await Promise.all(eventPayment.package_details.map((paypackage, index) => {
                            if (paypackage.package_id.toString() === packData.packageId) {
                                paypackage.number = paypackage.number - packData.number;
                                if (paypackage.number === 0) {
                                    eventPayment.package_details.splice(index, 1);
                                }
                            }
                        }));
                    }
                    eventPayment.amount = eventPayment.amount - deductAmount;
                    eventPayment.is_deleted = eventPayment.no_of_attendees === 0 ? true : false;
                }));
                eventPayment.no_of_attendees = eventPayment.no_of_attendees - total;
                await eventPayment.save();
            }
            event.attendees.remaining_number_of_attendees = event.attendees.remaining_number_of_attendees + total;
            await event.save();

            const id = event.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: event.community_id,
                userId: userId,
                module: "EVENT_RSVP",
                action: "CANCEL",
                platForm: "app",
                memberRole: userRole,
                oldData: null,
                newData: null
            })
            return { error: false, message: "respondSuccess" }
        } else {
            return { error: true, message: "noEventRsvpFound", ErrorClass: ErrorModules.Api404Error };
        }
    },

    generateExcel: async function (communityId, userId) {
        try {
            // const events = await Events.find({community_id: new ObjectId(communityId), is_deleted: false });
            eventAggregate = [
                {
                    '$match': {
                        'is_deleted': false,
                        'community_id': mongoose.Types.ObjectId(communityId) // filter for the desired community ID
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
            const events = await Events.aggregate(eventAggregate);
            const table = [['Sl.No', 'Event Name', 'Event Image', 'Community Name', 'Created By', 'Event Creation Date', 'Event Status']];

            for (let i = 0; i < events.length; i++) {
                const app = events[i];
                const formattedDate = new Date(app.created_at).toLocaleDateString();
                const value = [
                    (i + 1),
                    app.title,
                    app.image,
                    app.community.community_name,
                    app.user.name,
                    formattedDate,
                    app.is_active
                ];
                table.push(value);
            }

            const wb = xlsx.utils.book_new();
            const ws = xlsx.utils.aoa_to_sheet(table);
            xlsx.utils.book_append_sheet(wb, ws, 'Events');

            // write options
            const wopts = { bookType: 'xlsx', bookSST: false, type: 'base64' };
            const buffer = xlsx.write(wb, wopts);

            const community = await Communities.findOne({ _id: new ObjectId(communityId) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: communityId,
                userId: userId,
                module: "EVENT",
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
    },

    createRecurringEvent: async function (user, params, communityId) {
        if (params.paymentStatus === 'Paid') {
            return ({ error: true, message: "Can't create a paid recurring event." });
        }
        const userID = user.id;
        const userName = user.name;
        const invitationType = params.invitationType;
        const recurreingDetails = params.recurringDetails;
        const timezone = params.time.timezone || null;

        let datePayload;
        let fromTimeDate = new Date();
        let toTimeDate = new Date();
        if (recurreingDetails.occurances > 0) {
            fromTimeDate = new Date(Date.parse(params.date.from));
            datePayload = {
                from: fromTimeDate.toISOString()
            };
        } else {
            toTimeDate = new Date(Date.parse(params.date.to));
            fromTimeDate = new Date(Date.parse(params.date.from));

            if (fromTimeDate.getTime() > toTimeDate.getTime()) {
                return ({ error: true, message: "From date should not be greater than to date." });
            }

            datePayload = {
                to: toTimeDate.toISOString(),
                from: fromTimeDate.toISOString()
            };
        }

        let to = params.time.to;
        let from = params.time.from;

        const toArray = to.split(":");
        const fromArray = from.split(":");

        toTimeDate.setUTCHours(toArray[0]);
        toTimeDate.setUTCMinutes(toArray[1]);

        fromTimeDate.setUTCHours(fromArray[0]);
        fromTimeDate.setUTCMinutes(fromArray[1]);
        const timePayload = {
            to: toTimeDate.toISOString(),
            from: fromTimeDate.toISOString(),
            timezone: timezone
        };

        // Basic event payload
        const eventPayload = {
            host_id: userID,
            community_id: communityId,
            group_id: params.groupId ? params.groupId : null,
            type: params.type,
            title: params.title,
            description: params.description,
            image: params.image,
            logo_image: params.logoImage,
            invitation_type: params.invitationType,
            post_event_as_community: params.postEventAsCommunity,
            payment_status: params.paymentStatus,
            recurring_event: true,
            main_recurring_event: true
        };
        const community = await Communities.findOne({ _id: new ObjectId(communityId) });
        if (!community) {
            throw new ErrorModules.Api404Error("noCommunityFound");
        }

        // Check if SMS and email settings are enabled
        const { sms_settings, email_settings } = community.sms_email_global_settings;
        const { sms_credits_remaining, email_credits_remaining } = community;

        let recurringDetails = {
            recurreing_type: recurreingDetails.recurringType,
            start_time: params.time.from,
            end_time: params.time.to,
            occuration_number: recurreingDetails.occurances,
            weekly_day_index: recurreingDetails.recurringType === 'weekly' ? recurreingDetails.dateIndex : [],
            monthly_date: recurreingDetails.recurringType === 'monthly' ? recurreingDetails.dateIndex : [],
        }
        eventPayload['recurring_details'] = recurringDetails;

        // Adding latitude-longitude location for event
        let first_address_line = params.venueDetails.firstAddressLine ? params.venueDetails.firstAddressLine : '';
        let city = params.venueDetails.city ? params.venueDetails.city : '';
        let state = params.venueDetails.state ? params.venueDetails.state : '';
        let country = params.venueDetails.country ? params.venueDetails.country : '';
        let zipcode = params.venueDetails.zipcode ? params.venueDetails.zipcode : '';
        let mainAddress = first_address_line + ',' + city + ',' + state + ',' + zipcode + ',' + country;

        const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${mainAddress}&key=${process.env.GEOCODE_KEY}`;

        const response = await axios({
            url: endpoint,
            method: 'get'
        });
        let latitude = '';
        let longitude = '';
        if (response.data.status == 'OK') {
            latitude = response.data.results[0].geometry.location.lat;
            longitude = response.data.results[0].geometry.location.lng;
        }
        // Venue add
        const venueDetailsPayload = {
            city: params.venueDetails.city,
            state: params.venueDetails.state,
            country: params.venueDetails.country,
            zipcode: params.venueDetails.zipcode,
            phone_no: params.venueDetails.phoneNo,
            phone_code: params.venueDetails.phoneCode,
            first_address_line: params.venueDetails.firstAddressLine,
            second_address_line: params.venueDetails.secondAddressLine,
            latitude: latitude,
            longitude: longitude
        };

        let attendeesPayload = {};
        if (params.restrictNumberAttendees == true) {
            attendeesPayload['is_restricted'] = true;
            attendeesPayload['number_of_max_attendees'] = params.numberOfMaxAttendees;
            attendeesPayload['remaining_number_of_attendees'] = params.numberOfMaxAttendees;
            attendeesPayload['number_of_max_guests'] = params.numberOfMaxGuests;
        }
        if (params.webvistorRestriction == true) {
            attendeesPayload['webvistor_restriction'] = true;
            attendeesPayload['number_of_max_web_visitors'] = params.numberOfMaxWebVisitors;
            attendeesPayload['remaining_number_of_web_visitors'] = params.numberOfMaxWebVisitors;
            attendeesPayload['number_of_max_guests'] = params.numberOfMaxGuests;
        }
        if (params.attendeeListVisibilty == false) {
            attendeesPayload['attendees_list_visibility'] = "Public";
        }
        if (params.collectEventPhotos == true) {
            attendeesPayload['media_upload_by_attendees'] = true;
        }
        attendeesPayload['is_active'] = true;

        eventPayload['venue_details'] = venueDetailsPayload;
        eventPayload['date'] = datePayload;
        eventPayload['time'] = timePayload;
        eventPayload['attendees'] = attendeesPayload;

        // Event RSVP add based on invitation type
        let rsvpPayload = [];
        let rsvpUserId = [];
        let groupsArray = [];
        let membersArray = [];
        let slug = "new-event-invite";
        let lang = 'en';

        // For private event adding the creator as RSVP attending
        if (invitationType === "Private") {
            rsvpPayload.push({
                user_id: new ObjectId(userID),
                status: "Attending"
            });
            rsvpUserId.push(userID);
        }

        // Adding group members as RSVP
        if (!Lib.isEmpty(params.groups) && invitationType === "Private") {
            const groups = params.groups;
            await Promise.all(groups.map(async groupId => {
                groupsArray.push({ group_id: ObjectId(groupId) });
                const group = await Group.findOne({ _id: ObjectId(groupId) });
                if (!Lib.isEmpty(group.members)) {
                    await Promise.all(group.members.map(async member => {

                        if (rsvpUserId.includes(member.member_id.toString()) === false && member.is_approved === true && member.is_active === true && member.is_deleted === false) {
                            rsvpPayload.push({ user_id: member.member_id, invited_by: ObjectId(userID) });
                            rsvpUserId.push(member.member_id.toString());

                        }

                    }));
                }
            }));
        }

        // Adding selected members as RSVP
        if (!Lib.isEmpty(params.members) && invitationType === "Private") {
            const members = params.members;
            await Promise.all(members.map(async member => {

                if (rsvpUserId.includes(member) === false) {
                    membersArray.push({ user_id: member });
                    rsvpPayload.push({ user_id: member, invited_by: ObjectId(userID) });
                    rsvpUserId.push(member.toString());
                }
            }));
        }
        const usersCount = rsvpUserId.length;
        await helperService.validateCreditsRemaining(community, usersCount, usersCount);
        const userAggregate = [
            {
                $match: {
                    _id: { $in: rsvpUserId.map(id => ObjectId(id)) },
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

        const users = await User.aggregate(userAggregate);
        await Promise.all(users.map(async (user) => {
            const userId = user._id;
            const userEmail = user.email;
            const userPhone = user.phone;
            const userphoneCode = user.phoneCode;
            let phoneNo = userphoneCode + userPhone;
            const smspayload = {
                recipient:
                {
                    phone: phoneNo,
                },
                template: {
                    type: "SMS",
                    slug: "EVENTJOINREQ",
                    lang: "en"
                },
                contents: {
                    EVENTNAME: params.title
                }
            }
            const emailpayload = {
                recipient:
                {
                    email: userEmail
                },
                template: {
                    type: "Email",
                    slug: "EVENTEMAIL",
                    lang: "en"
                },
                contents: {
                    EVENTNAME: params.title
                }
            }
            const payload = {
                recipient:
                {
                    user_id: userId
                },
                template: {
                    type: "Push",
                    slug: "new-event-invite",
                    lang: "en"
                },
                contents: {
                    USERNAME: userName,
                    COMMUNITYNAME: community.community_name,
                    EVENTNAME: params.title
                },
                image: params.image
            }
            const notiSettings = await NotificationSettings.findOne({ user_id: userId });
            // if (!isRecurring) {
            // SMS SEND
            if (sms_settings) {
                await notificationServices.notifyService(smspayload);
            }
            //EMAIL SEND
            if (email_settings) {
                await notificationServices.notifyService(emailpayload);
            }
            if (!Lib.isEmpty(notiSettings)) {
                //check the community event notification settings
                if (notiSettings.community_event) {
                    //Push notification send
                    await notificationServices.notifyService(payload);
                }
                // }
            }
        }));
        // Deduct credits based on the number of users processed
        if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining >= usersCount) {
            community.sms_credits_remaining -= usersCount;
            await community.save();
        }

        if (community.sms_email_global_settings.email_settings && community.email_credits_remaining >= usersCount) {
            community.email_credits_remaining -= usersCount;
            await community.save();
        }
        if (invitationType === "Members") {
            // Getting RSVP members from community members
            let aggregate = [
                {
                    '$match': {
                        '_id': new ObjectId(communityId)
                    }
                },
                {
                    '$unwind': {
                        'path': '$members'
                    }
                },
                {
                    '$match': {
                        'members.is_approved': true,
                        'members.is_active': true,
                        'members.is_rejected': false,
                        'members.is_leaved': false,
                        'members.is_deleted': false,
                        'members.roles': {
                            '$in': ["member", "executive_member", "board_member"]
                        }
                    }
                },
                {
                    $lookup: {
                        from: "sr_users",
                        localField: "members.member_id",
                        foreignField: "_id",
                        as: "members.user",
                    },
                },
                {
                    $unwind: {
                        path: "$members.user",
                    },
                },
                {
                    $match: {
                        "members.user.is_deleted": false,
                        // "members.user.is_active": true,
                    }
                },
                {
                    '$project': {
                        'members.member_id': 1,
                        "members.user._id": 1,
                        "members.user.name": 1,
                        "members.user.contact": 1,
                    }
                }
            ];

            const communityMembers = await Communities.aggregate(aggregate);

            communityMembers.forEach(async element => {
                if (userID === element.members.member_id.toString()) {
                    rsvpPayload.push({
                        user_id: element.members.member_id,
                        status: "Attending"
                    });
                } else {
                    rsvpPayload.push({ user_id: element.members.member_id, invited_by: ObjectId(userID) });
                }
            });
        } else if (invitationType === "Public") {
            // Getting RSVP members from community members
            let aggregate = [
                {
                    '$match': {
                        '_id': new ObjectId(communityId)
                    }
                },
                {
                    '$unwind': {
                        'path': '$members'
                    }
                },
                {
                    '$match': {
                        'members.is_approved': true,
                        'members.is_active': true,
                        'members.is_rejected': false,
                        'members.is_leaved': false,
                        'members.is_deleted': false,
                        'members.roles': {
                            '$in': ["fan", "member", "executive_member", "board_member"]
                        }
                    }
                },
                {
                    $lookup: {
                        from: "sr_users",
                        localField: "members.member_id",
                        foreignField: "_id",
                        as: "members.user",
                    },
                },
                {
                    $unwind: {
                        path: "$members.user",
                    },
                },
                {
                    $match: {
                        "members.user.is_deleted": false,
                        // "members.user.is_active": true,
                    }
                },
                {
                    '$project': {
                        'members.member_id': 1,
                        "members.user._id": 1,
                        "members.user.name": 1,
                        "members.user.contact": 1,
                    }
                }
            ];

            const communityMembers = await Communities.aggregate(aggregate);

            await communityMembers.forEach(async element => {
                if (userID === element.members.member_id.toString()) {
                    rsvpPayload.push({
                        user_id: element.members.member_id,
                        status: "Attending"
                    });
                } else {
                    rsvpPayload.push({ user_id: element.members.member_id, invited_by: ObjectId(userID) });
                }
            });
        }
        const validIds = rsvpPayload.map(item => {
            if (ObjectId.isValid(item.user_id)) {
                return ObjectId(item.user_id);
            } else {
                throw new Error(`Invalid ObjectId: ${item.user_id}`);
            }
        });
        const userCount = validIds.length;
        await helperService.validateCreditsRemaining(community, userCount, userCount);
        const usersAggregate = [
            {
                $match: {
                    _id: { $in: validIds },
                    is_deleted: false,
                }
            },
            {
                $project: {
                    name: "$name",
                    email: "$contact.email.address",
                    phone: "$contact.phone.number",
                    phoneCode: "$contact.phone.phone_code",
                    deviceDetails: "$device_details"
                }
            }
        ];

        const userinfo = await User.aggregate(usersAggregate);
        await Promise.all(userinfo.map(async (user) => {
            const userId = user._id;
            const userEmail = user.email;
            const userPhone = user.phone;
            const userphoneCode = user.phoneCode;
            const deviceDetails = user.deviceDetails;

            let phoneNo = userphoneCode + userPhone;
            // Fetching user device token 
            let webToken = [];
            if (deviceDetails) {
                webToken = deviceDetails.filter(device => device.is_active === true).map(device => device.web_token).filter(token => token !== null && token !== undefined);
            }
            const smspayload = {
                recipient:
                {
                    phone: phoneNo,
                },
                template: {
                    type: "SMS",
                    slug: "EVENTJOINREQ",
                    lang: "en"
                },
                contents: {
                    EVENTNAME: params.title
                }
            }
            const emailpayload = {
                recipient:
                {
                    email: userEmail
                },
                template: {
                    type: "Email",
                    slug: "EVENTEMAIL",
                    lang: "en"
                },
                contents: {
                    EVENTNAME: params.title
                }
            }
            const payload = {
                recipient:
                {
                    user_id: userId,
                    fcmToken: webToken
                },
                template: {
                    type: "Push",
                    slug: "new-event-invite",
                    lang: "en"
                },
                contents: {
                    USERNAME: userName,
                    COMMUNITYNAME: community.community_name,
                    EVENTNAME: params.title
                },
                image: params.image
            }
            const notiSettings = await NotificationSettings.findOne({ user_id: userId });
            // SMS SEND
            if (sms_settings) {
                await notificationServices.notifyService(smspayload);
            }
            //EMAIL SEND
            if (email_settings) {
                await notificationServices.notifyService(emailpayload);
            }
            if (!Lib.isEmpty(notiSettings)) {
                //check the community event notification settings
                if (notiSettings.community_event) {
                    //Push notification send
                    await notificationServices.notifyService(payload);
                }
            }
        }));
        // Deduct credits based on the number of users processed
        if (community.sms_email_global_settings.sms_settings && community.sms_credits_remaining >= userCount) {
            community.sms_credits_remaining -= userCount;
            await community.save();
        }

        if (community.sms_email_global_settings.email_settings && community.email_credits_remaining >= userCount) {
            community.email_credits_remaining -= userCount;
            await community.save();
        }

        let eventHostsArray = [];
        if (!Lib.isEmpty(params.eventHost)) {
            const eventHosts = params.eventHost;
            await Promise.all(eventHosts.map(async eventHost => {
                const hostUser = await User.findOne({ _id: ObjectId(eventHost) });
                if (!Lib.isEmpty(hostUser)) {
                    eventHostsArray.push({ user_id: hostUser._id });
                }
            }));
        }

        eventPayload['event_host'] = eventHostsArray;
        eventPayload['rsvp'] = rsvpPayload;
        eventPayload['groups'] = groupsArray
        eventPayload['members'] = membersArray

        const event = new Events(eventPayload);
        event.created_at = new Date().toISOString();
        const res = await event.save();

        const member = community.members.find(
            (m) => m.member_id.toString() === user.id.toString()
        );
        const userRole = member.roles;

        await ActivityLogService.activityLogActiion({
            communityId: communityId,
            userId: user.id,
            module: "EVENT",
            action: "CREATE",
            platForm: "web",
            memberRole: userRole,
            oldData: null,
            newData: eventPayload
        })

        let dateIndex = recurreingDetails.dateIndex;
        let eventDates = [];
        if (recurreingDetails.occurances > 0) {
            //If occurance-wise
            if (recurreingDetails.recurringType === 'weekly') {
                // For weekly dates
                eventDates = await this.getNextDatesOccurance(fromTimeDate, recurreingDetails.occurances, dateIndex);
            } else {
                // For monthly dates
                eventDates = await this.getMonthlyDatesOccurance(fromTimeDate, recurreingDetails.occurances, dateIndex);
            }
        } else {
            // If start and end date wise
            if (recurreingDetails.recurringType === 'weekly') {
                // For weekly dates
                eventDates = await this.getweekdatesBetweenDates(fromTimeDate, toTimeDate, dateIndex);
            } else {
                // For monthly dates
                eventDates = await this.getMonthlyDatesBetweenDates(fromTimeDate, toTimeDate, dateIndex);
            }
        }
        let fromDate;
        let toDate;
        const occurances = recurreingDetails.occurances;
        await Promise.all(eventDates.map(async (date, index) => {
            params.date.from = date;
            params.date.to = date;
            toDate = date;
            params.recurringDetails.event_id = ObjectId(res._id);
            params.recurringDetails.occurances = index + 1;
            await this.createEvent(user, params, communityId);
        }));
        if (occurances > 0) {
            const eventUpdate = await Events.findOne({
                _id: ObjectId(res._id)
            });
            // eventUpdate.date.from = fromDate.toISOString();
            eventUpdate.date.to = toDate.toISOString();
            eventUpdate.save();
        }

        return {
            error: false,
            message: "eventCreateSuccess",
            data: { id: (res._id).toString() }
        };
    },

    editRecurringEvent: async function (user, params, communityId) {
        const eventId = params.id;

        const event = await Events.findOne({
            _id: ObjectId(eventId)
        });
        if (Lib.isEmpty(event)) {
            return {
                code: 404,
                error: true,
                systemCode: "NOT_FOUND",
                message: "No event found",
                ErrorClass: ErrorModules.Api404Error
            };
        }
        if (!event.recurring_event || !event.main_recurring_event) {
            return { error: true, message: "Not a main recurring event", ErrorClass: ErrorModules.Api404Error };
        }
        // store old data
        const oldData = event.toObject();
        const eventRecurringDetails = event.recurring_details;
        const recurreingDetails = params.recurringDetails;

        let isExtend = false;
        let isReduce = false;

        let fromTimeDate = new Date();
        let toTimeDate = new Date();
        let today = new Date();
        let eventFromDate = new Date(Date.parse(event.date.from));
        fromTimeDate = new Date(Date.parse(event.date.to));
        fromTimeDate.setDate(fromTimeDate.getDate() + 1);
        if (recurreingDetails.occurances > 0) {
            if (recurreingDetails.occurances > eventRecurringDetails.occuration_number) {
                isExtend = true;
            } else if (recurreingDetails.occurances < eventRecurringDetails.occuration_number) {
                isReduce = true;
            }
        } else {
            toTimeDate = new Date(Date.parse(params.date.to));
            if (toTimeDate > event.date.to) {
                isExtend = true;
            } else if (toTimeDate < event.date.to) {
                isReduce = true;
            }
            if (eventFromDate.getTime() > toTimeDate.getTime()) {
                return ({ error: true, message: "From date should not be greater than to date." });
            }
            if (today.getTime() > toTimeDate.getTime()) {
                return ({ error: true, message: "End date should not be lesser than today's date." });
            }
        }

        if (isExtend) {
            let dateIndex = recurreingDetails.dateIndex;
            let eventDates = [];
            if (recurreingDetails.occurances > 0) {
                const occurance = recurreingDetails.occurances - eventRecurringDetails.occuration_number;
                event.recurring_details.occuration_number = recurreingDetails.occurances;
                //If occurance-wise
                if (recurreingDetails.recurringType === 'weekly') {
                    // For weekly dates
                    eventDates = await this.getNextDatesOccurance(fromTimeDate, occurance, dateIndex);
                } else {
                    // For monthly dates
                    eventDates = await this.getMonthlyDatesOccurance(fromTimeDate, occurance, dateIndex);
                }
            } else {
                // If start and end date wise
                if (recurreingDetails.recurringType === 'weekly') {
                    // For weekly dates
                    eventDates = await this.getweekdatesBetweenDates(fromTimeDate, toTimeDate, dateIndex);
                } else {
                    // For monthly dates
                    eventDates = await this.getMonthlyDatesBetweenDates(fromTimeDate, toTimeDate, dateIndex);
                }
            }

            let toDate = event.date.to;
            await Promise.all(eventDates.map(async (date, index) => {
                params.date.from = date;
                params.date.to = date;
                toDate = date;
                params.recurringDetails.event_id = ObjectId(eventId);
                params.recurringDetails.occurances = eventRecurringDetails.occuration_number + index + 1;
                await this.createEvent(user, params, communityId);
            }));
            // update event end date
            event.date.to = toDate.toISOString();

        } else if (isReduce) {
            if (recurreingDetails.occurances > 0) {
                const lastEvent = await Events.findOne({ 'recurring_details.event_id': ObjectId(eventId), 'recurring_details.occuration_number': recurreingDetails.occurances });

                if (today.getTime() > lastEvent.date.to.getTime()) {
                    return ({ error: true, message: "Last occurance end date should not be lesser than today's date." });
                }

                event.recurring_details.occuration_number = recurreingDetails.occurances;

                await Events.updateMany(
                    {
                        'recurring_details.event_id': ObjectId(eventId),
                        'recurring_details.occuration_number': { '$gt': recurreingDetails.occurances }
                    },
                    {
                        $set: { 'is_deleted': true }
                    }
                );
                event.date.to = lastEvent.date.to.toISOString();
            } else {
                await Events.updateMany(
                    {
                        'recurring_details.event_id': ObjectId(eventId),
                        'date.from': { '$gt': toTimeDate }
                    },
                    {
                        $set: { 'is_deleted': true }
                    }
                );
                event.date.to = toTimeDate.toISOString();
            }
        }

        const updatedEvent = await event.save();
        // --- Change Log Section ---
        const newData = updatedEvent.toObject();
        const changeOldData = {};
        const changeNewData = {};

        Object.keys(newData).forEach(key => {
            if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
                changeOldData[key] = oldData[key];
                changeNewData[key] = newData[key];
            }
        });

        const community = await Communities.findOne({ _id: new ObjectId(communityId) });
        const member = community.members.find(
            (m) => m.member_id.toString() === user.id.toString()
        );
        const userRole = member.roles;

        // Log Activity Log
        await ActivityLogService.activityLogActiion({
            communityId: communityId,
            userId: user.id,
            module: "EVENT",
            action: "UPDATE",
            platForm: "web",
            memberRole: userRole,
            old_data: changeOldData,
            new_data: changeNewData,
        })
        return {
            error: false,
            message: "eventCreateSuccess",
        };
    },

    getweekdatesBetweenDates: async function (startDate, endDate, dayIndex) {
        const dates = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            if (dayIndex.includes(currentDate.getDay())) {
                dates.push(new Date(currentDate));
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dates;
    },

    getNextDatesOccurance: async function (startDate, numberOfOccurrences, dayIndex) {
        const dates = [];
        let currentDate = new Date(startDate);

        for (let i = 0; i < numberOfOccurrences; i++) {
            while (!dayIndex.includes(currentDate.getDay())) {
                currentDate.setDate(currentDate.getDate() + 1);
            }

            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dates;
    },

    getMonthlyDatesBetweenDates: async function (startDate, endDate, dateIndex) {
        let dayIndex = dateIndex[0];
        const dates = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            currentDate.setDate(dayIndex);

            if (currentDate >= startDate && currentDate <= endDate) {
                dates.push(new Date(currentDate));
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        return dates;
    },

    getMonthlyDatesOccurance: async function (startDate, numberOfOccurrences, dateIndex) {
        let dayIndex = dateIndex[0];
        const dates = [];
        let currentDate = new Date(startDate);

        while (dates.length < numberOfOccurrences) {
            currentDate.setDate(dayIndex);
            if (currentDate >= startDate) {
                dates.push(new Date(currentDate));
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        return dates;
    },
    setRemainderStatusChange: async function (eventId) {
        const event = await Events.findOne({
            _id: ObjectId(eventId)
        });
        if (Lib.isEmpty(event)) {
            return {
                code: 404,
                error: true,
                systemCode: "NOT_FOUND",
                message: "No event found",
                ErrorClass: ErrorModules.Api404Error
            };
        }

        // Toggle the 'remain' status
        event.remain = !event.remain;

        await event.save();

        return {
            code: 200,
            error: false,
            systemCode: "SUCCESS",
            message: "Status changed successfully",
            data: { remain: event.remain }
        };
    },
    updateRsvpAdminControll: async function (id, data, context) {
        try {
            const userID = context.user.id;
            const user = await User.findOne({ _id: userID });
            const event = await Events.findOne({ _id: id });
            const rsvpAdminControll = data.rsvpAdminControll;
            const rsvpAdminStatus = [];
            if (user.user_type == 'admin' || event.host_id == userID) {
                // if (event.remain) {
                await Promise.all(rsvpAdminControll.map(async rsvpControll => {
                    rsvpAdminStatus.push({
                        rsvp_type: rsvpControll.rsvpType,
                        email_content: rsvpControll.emailContent,
                        sms_content: rsvpControll.smsContent,
                        deep_link: rsvpControll.deepLink
                    })
                }));
                // }
                event.rsvp_admin_controll = rsvpAdminStatus;
            }
            const updateRsvpAdminControll = await event.save();
            const rsvpControll = updateRsvpAdminControll.rsvp_admin_controll;

            const id = event.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userID.toString()
            );
            const userRole = member.roles;

            await ActivityLogService.activityLogActiion({
                communityId: event.community_id,
                userId: userID,
                module: "EVENT",
                action: "UPDATE_RSVP_ADMINCONTROLL",
                platForm: "web",
                memberRole: userRole,
                oldData: null,
                newData: null
            })
            //  // Generate URL to open in app or fallback to web
            //  const eventId = event._id.toString();
            //  console.log(eventId,"eventId................");
            //  const universalLink = `https://demoyourprojects.com:5066/graphql/event?eventId=${eventId}`;
            return {
                error: false,
                message: "Event Rsvp Remainder Update Success",
                data: rsvpControll
            };
        } catch (err) {
            console.log(err, 'err');
            throw new ErrorModules.DatabaseError("Event update error");
        }
    },

    getEventDetails: async function (id, userId, role) {
        let aggregate = [
            {
                '$match': {
                    '_id': new ObjectId(id),
                    'is_deleted': false,
                    'is_active': true,
                }
            },
            {
                '$unwind': {
                    'path': '$rsvp'
                }
            },
            {
                '$match': {
                    'rsvp.user_id': new ObjectId(userId),
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
                '$unwind': {
                    'path': '$community'
                },
            },
            {
                '$unwind': {
                    'path': '$rsvp'
                },
            },
            {
                '$match': {
                    'rsvp.user_id': new ObjectId(userId)
                }
            },
            {
                '$lookup': {
                    'from': 'sr_users',
                    'localField': 'rsvp.invited_by',
                    'foreignField': '_id',
                    'as': 'invited_by'
                }
            },
            {
                '$unwind': {
                    'path': "$invited_by",
                    'preserveNullAndEmptyArrays': true
                },
            },
            {
                '$project': {
                    'title': 1,
                    'category': 1,
                    'host_id': 1,
                    'post_event_as_community': 1,
                    'hostName': '$user.name',
                    'community_id': 1,
                    'group_id': 1,
                    'type': 1,
                    'description': 1,
                    'image': 1,
                    'logo_image': 1,
                    'venue_details': 1,
                    'date': 1,
                    'time': 1,
                    'invitation_type': 1,
                    'rsvp_end_time': 1,
                    'attendees': 1,
                    'rsvp': 1,
                    'user': 1,
                    'community': 1,
                    'groups': 1,
                    'members': 1,
                    'payment_category': 1,
                    'payment_packages': 1,
                    'payment_status': 1,
                    'recurring_event': 1,
                    'recurring_details': 1,
                    'invited_by': 1
                }
            }
        ];

        const event = await Events.aggregate(aggregate);
        if (event.length === 0) {
            return ({ error: true, message: "No event found.", ErrorClass: ErrorModules.Api404Error });
        }
        // ✅ Filter payment_packages before returning
        if (event[0].payment_packages && Array.isArray(event[0].payment_packages)) {
            event[0].payment_packages = event[0].payment_packages
                .filter(pkg => pkg.is_active)
                .map(pkg => ({
                    id: pkg._id?.toString?.() || '',
                    packageName: pkg.package_name,
                    number: pkg.number || null,
                    packageRate: pkg.package_rate,
                    earlyBirdRate: pkg.early_bird_rate,
                    earlyBirdDate: new Date(pkg.early_bird_date).getTime(),
                    currency: pkg.currency,
                    isActive: pkg.is_active
                }));
        }
        // Fetch package details from EventPayment model
        // const eventPayment = await EventPayment.findOne({ event_id: id, user_id: userId });
        // let packageDetails = [];
        // if (eventPayment) {
        //     const paymentPackages = event[0].payment_packages;
        //     packageDetails = eventPayment.package_details.map(packageDetail => {
        //         const matchingPackage = paymentPackages.find(paymentPackage => paymentPackage._id.toString() === packageDetail.package_id.toString());
        //         if (matchingPackage) {
        //             return {
        //                 id: packageDetail.package_id,
        //                 number: packageDetail.number,
        //                 currency: matchingPackage.currency,
        //                 packageName: matchingPackage.package_name,
        //                 packageRate: matchingPackage.package_rate,
        //                 packageLogo: matchingPackage.package_logo,
        //                 earlyBirdDate: matchingPackage.early_bird_date,
        //                 earlyBirdRate: matchingPackage.early_bird_rate
        //             };
        //         }
        //     })
        // }

        // // Add package details to the event object
        // event[0].payment_packages = packageDetails;
        // Count the number of invited users
        const invitedCountAggregate = [
            {
                $match: {
                    _id: new ObjectId(id),
                    is_deleted: false,
                    is_active: true,
                },
            },
            {
                $unwind: {
                    path: "$rsvp",
                },
            },
            {
                $count: "invitedCount",
            },
        ];

        const invitedCountResult = await Events.aggregate(invitedCountAggregate);
        const invitedCount = invitedCountResult.length > 0 ? invitedCountResult[0].invitedCount : 0;
        // Count the number of attendees with RSVP status "Attending"
        const attendingCountAggregate = [
            {
                '$match': {
                    '_id': new ObjectId(id),
                    'is_deleted': false,
                    'is_active': true,
                }
            },
            {
                '$unwind': {
                    'path': '$rsvp'
                }
            },
            {
                '$match': {
                    'rsvp.status': "Attending",
                }
            },
            {
                $count: "attendingCount",
            },
        ];

        const attendingCountResult = await Events.aggregate(attendingCountAggregate);
        const attendingCount = attendingCountResult.length > 0 ? attendingCountResult[0].attendingCount : 0;

        // Count the number of event images in attendees
        // const photosCountAggregate = [
        //     {
        //         $match: {
        //             _id: new ObjectId(id),
        //             is_deleted: false,
        //             is_active: true,
        //         },
        //     },
        //     {
        //         $unwind: {
        //             path: "$attendees.event_images",
        //         },
        //     },
        //     {
        //         $count: "photosCount",
        //     },
        // ];

        // const photosCountResult = await Events.aggregate(photosCountAggregate);
        // const photosCount = photosCountResult.length > 0 ? photosCountResult[0].photosCount : 0;

        const photosCount = await EventMemory.countDocuments({ event_id: new ObjectId(id), image_approve: true, is_deleted: false });
        // Count the number of blogs related to the event
        const blogCount = await Blogs.countDocuments({ event_id: new ObjectId(id), blog_status: true, is_deleted: false });
        // Add these counts to the event object
        event[0].listing = {
            invited: invitedCount,
            rsvpCount: attendingCount,
            photosCount: photosCount,
            blogCount: blogCount,
        };
        const blogList = await Blogs.find({
            event_id: new ObjectId(id),
            is_deleted: false,
        });

        // Add the blogList to the event object
        event[0].blogs = blogList.map(blog => ({
            id: blog._id.toString(),
            postedBy: blog.posted_by,
            thumbnailImage: blog.thumbnail_image,
            image: blog.image,
            pdf: blog.pdf,
            blogTitle: blog.blog_title,
            blogCategory: blog.blog_category,
            blogDescription: blog.blog_description,
            blogStatus: blog.blog_status,
            paymentStatus: blog.payment_status,
            createdAt: blog.created_at.toISOString()
        }));
        const eventImageList = await EventMemory.find({
            event_id: new ObjectId(id),
            is_deleted: false,
            image_approve: true,
            image_rejecte: false,
        });
        // Add the eventImageList to the event object
        event[0].eventImage = eventImageList.map(image => ({
            id: image._id.toString(),
            uploadedImage: image.uploaded_image,
            imageDeadLine: image.image_dead_line ? image.image_dead_line.toISOString() : null,
            imageApprove: image.image_approve,
            imageStatus: image.image_status,
            uploadedBy: image.uploaded_by,
            phoneNumber: image.phone_number,
            logoImage: image.logo_image,
            createdAt: image.created_at.toISOString(),
            eventName: image.event_id ? image.event_id.title : null,
        }));
        // Count the number of hosts
        const hostCountAggregate = [
            {
                '$match': {
                    '_id': new ObjectId(id),
                    'is_deleted': false,
                    'is_active': true,
                }
            },
            {
                '$unwind': {
                    'path': '$event_host'
                }
            },
            {
                '$count': 'hostCount'
            }
        ];
        const hostCountResult = await Events.aggregate(hostCountAggregate);
        const hostCount = hostCountResult.length > 0 ? hostCountResult[0].hostCount : 0;
        let numberAggregate = [
            {
                '$match': {
                    '_id': new ObjectId(id),
                    'is_deleted': false,
                    'is_active': true,
                }
            },
            {
                '$unwind': {
                    'path': '$rsvp'
                }
            },
            {
                '$match': {
                    'rsvp.status': "Attending",
                }
            }
        ];
        const eventAttendees = await Events.aggregate(numberAggregate);
        // Calculate remaining attendees
        // const numberOfMaxAttendees = event[0].attendees.number_of_max_attendees || 0;
        // const currentAttendees = eventAttendees.length;
        // const remainingAttendees = numberOfMaxAttendees - currentAttendees;
        // event[0].loginUser = userId;
        // event[0].isJoined = event[0].rsvp.status === "Attending" ? true : false;
        // event[0].currentAttendees = eventAttendees.length;
        // event[0].eventHostCounters = hostCount;
        // event[0].remainingAttendees = remainingAttendees;
        const numberOfMaxAttendees = event[0].attendees.number_of_max_attendees || 0;
        const remainingAttendees = event[0].attendees.remaining_number_of_attendees || 0;
        const currentAttendees = numberOfMaxAttendees - remainingAttendees;
        event[0].loginUser = userId;
        event[0].loginUserRole = role;
        event[0].isJoined = event[0].rsvp.status === "Attending" ? true : false;
        event[0].currentAttendees = currentAttendees;
        event[0].eventHostCounters = hostCount;
        event[0].remainingAttendees = remainingAttendees;
        return ({ error: false, message: "generalSuccess", data: Lib.reconstructObjectKeys(event[0], ["rsvp_end_time", "to", "from", "created_at"], Lib.convertIsoDate) });

    },
} 