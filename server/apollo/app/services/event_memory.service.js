const Events = Lib.Model('Events');
const EventMemory = Lib.Model('EventMemory');
const Communities = Lib.Model('Communities');
const User = Lib.Model('Users');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const ErrorModules = require('../errors');
const ActivityLogService = require("./activity_log.service")

module.exports = {
    //Query
    // getAllUploadImage: async (data) => {
    //     try {
    //         const page = data.page || 1; // Defaulting to 1 if no page is provided.
    //         const itemsPerPage = 10;  // The number of images per page.
    //         const eventId = data.eventId;
    //         const imageApprove = data.imageApprove;
    //         const imageStatus = data.imageStatus;
    //         const uploadedBy = data.uploadedBy;
    //         const fromDate = data.fromDate;
    //         const toDate = data.toDate;

    //         const filter = {
    //             event_id: ObjectId(eventId),  // Filter by eventMemoryId
    //             is_deleted: false,
    //             image_rejecte: false,
    //         };
    //         if (imageApprove !== undefined) filter.image_approve = imageApprove; // Filter by imageApprove status
    //         if (imageStatus !== undefined) filter.image_status = imageStatus; // Filter by imageStatus status

    //         // Add the uploadedBy filter
    //         if (uploadedBy) {
    //             filter.uploaded_by = uploadedBy;
    //         }
    //         // Add date range filter
    //         if (fromDate && toDate) {
    //             filter.created_at = {
    //                 $gte: new Date(fromDate + 'T00:00:00.000Z'),  // Greater than or equal to fromDate (at 00:00:00 time)
    //                 $lte: new Date(toDate + 'T23:59:59.999Z')    // Less than or equal to toDate (at 23:59:59.999 time)
    //             };
    //         }
    //         // Query for the total number of images that match the filter
    //         const total = await EventMemory.countDocuments(filter);

    //         // Calculate the skip and limit values for pagination
    //         const skip = (page - 1) * itemsPerPage;
    //         const limit = itemsPerPage;

    //         // Fetch the images
    //         const imagesList = await EventMemory.find(filter)
    //             .skip(skip)
    //             .limit(limit)
    //             .exec();

    //         // Convert the imagesList to a format suitable for GraphQL response
    //         const images = imagesList.map(image => {
    //             return {
    //                 id: image._id.toString(),
    //                 uploadedImage: image.uploaded_image,
    //                 imageDeadLine: image.image_dead_line ? image.image_dead_line.toISOString() : null,
    //                 imageApprove: image.image_approve,
    //                 imageStatus: image.image_status,
    //                 uploadedBy: image.uploaded_by,
    //                 phoneNumber: image.phone_number,
    //                 logoImage: image.logo_image,
    //                 createdAt: image.created_at.toISOString()
    //             };
    //         });
    //         const from = skip + 1;
    //         const to = Math.min(skip + itemsPerPage, total);

    //         return {
    //             error: false,
    //             code: 200,
    //             systemCode: 'IMAGES_FETCHED_SUCCESSFULLY',
    //             message: 'Images fetched successfully',
    //             total: total,
    //             from: from,
    //             to: to,
    //             data: images
    //         };

    //     } catch (error) {
    //         return {
    //             error: true,
    //             code: 500,
    //             systemCode: 'ERROR_FETCHING_IMAGES',
    //             message: error.message,
    //             data: null
    //         };
    //     }
    // },
    getAllUploadImage: async (data) => {
        try {
            const page = data.page || 1;
            const itemsPerPage = 10;
            const communityId = data.communityId;
            const eventId = data.eventId;
            const imageApprove = data.imageApprove;
            const imageStatus = data.imageStatus;
            const uploadedBy = data.uploadedBy;
            const fromDate = data.fromDate;
            const toDate = data.toDate;

            const filter = {
                is_deleted: false,
                image_rejecte: false,
            };

            // Add the communityId and eventId to the filter
            if (communityId) filter.community_id = ObjectId(communityId);
            if (eventId) filter.event_id = ObjectId(eventId);

            if (imageApprove !== undefined) filter.image_approve = imageApprove;
            if (imageStatus !== undefined) filter.image_status = imageStatus;

            if (uploadedBy) {
                filter.uploaded_by = uploadedBy;
            }
            if (fromDate && toDate) {
                filter.created_at = {
                    $gte: new Date(fromDate + 'T00:00:00.000Z'),
                    $lte: new Date(toDate + 'T23:59:59.999Z')
                };
            }
            const total = await EventMemory.countDocuments(filter);

            const skip = (page - 1) * itemsPerPage;
            const limit = itemsPerPage;

            // Sort by "created_at" in descending order
            const sortOptions = { created_at: -1 };

            // Fetch the images with the eventName by populating the event field
            const imagesList = await EventMemory.find(filter)
                .populate({
                    path: 'event_id',
                    select: 'title', // Assuming "title" is the field in the "events" model for the event name
                })
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .exec();

            // Convert the imagesList to a format suitable for GraphQL response
            const images = imagesList.map(image => {
                return {
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
                };
            });

            const from = skip + 1;
            const to = Math.min(skip + itemsPerPage, total);

            return {
                error: false,
                code: 200,
                systemCode: 'IMAGES_FETCHED_SUCCESSFULLY',
                message: 'Images fetched successfully',
                total: total,
                from: from,
                to: to,
                data: images,
            };
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_FETCHING_IMAGES',
                message: error.message,
                data: null,
            };
        }
    },
    getAllUploadedUserImage: async (data) => {
        try {
            const page = data.page || 1;
            const itemsPerPage = 10;
            const userId = data.userId
            const eventId = data.eventId;
            // const communityId = data.communityId;
            // const eventId = data.eventId;
            const imageApprove = data.imageApprove;
            const imageStatus = data.imageStatus;
            const uploadedBy = data.uploadedBy;
            const fromDate = data.fromDate;
            const toDate = data.toDate;

            const filter = {
                is_deleted: false,
                image_rejecte: false,
            };

            // Add the communityId and eventId to the filter
            // if (communityId) filter.community_id = ObjectId(communityId);
            // if (eventId) filter.event_id = ObjectId(eventId);
            if (userId) filter.user_id = ObjectId(userId)
            if (eventId) filter.event_id = ObjectId(eventId);
            if (imageApprove !== undefined) filter.image_approve = imageApprove;
            if (imageStatus !== undefined) filter.image_status = imageStatus;

            if (uploadedBy) {
                filter.uploaded_by = uploadedBy;
            }
            if (fromDate && toDate) {
                filter.created_at = {
                    $gte: new Date(fromDate + 'T00:00:00.000Z'),
                    $lte: new Date(toDate + 'T23:59:59.999Z')
                };
            }
            const total = await EventMemory.countDocuments(filter);

            const skip = (page - 1) * itemsPerPage;
            const limit = itemsPerPage;

            // Sort by "created_at" in descending order
            const sortOptions = { created_at: -1 };

            // Fetch the images with the eventName by populating the event field
            const imagesList = await EventMemory.find(filter)
                .populate({
                    path: 'event_id',
                    select: 'title', // Assuming "title" is the field in the "events" model for the event name
                })
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .exec();

            // Convert the imagesList to a format suitable for GraphQL response
            const images = imagesList.map(image => {
                return {
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
                };
            });

            const from = skip + 1;
            const to = Math.min(skip + itemsPerPage, total);

            return {
                error: false,
                code: 200,
                systemCode: 'IMAGES_FETCHED_SUCCESSFULLY',
                message: 'Images fetched successfully',
                total: total,
                from: from,
                to: to,
                data: images,
            };
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_FETCHING_IMAGES',
                message: error.message,
                data: null,
            };
        }
    },

    //event name wise filtering

    orgImageListEventWise: async (data) => {
        try {
            const { communityId } = data;
            const pipeline = [
                {
                    $match: {
                        community_id: ObjectId(communityId),
                        is_deleted: false,
                        image_approve: true,
                        image_status: true,
                    },
                },
                { $sort: { created_at: -1 } },
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
                        from: `${Lib.ENV('DB_PREFIX')}events`,
                        localField: 'event_id',
                        foreignField: '_id',
                        as: 'eventDetails',
                    },
                },
                {
                    $addFields: {
                        eventName: '$eventDetails.title',
                    },
                },
                {
                    $unwind: '$eventName', // Unwind the array created by $group
                },
                {
                    $group: {
                        _id: '$eventName',
                        images: {
                            $push: {
                                id: '$_id',
                                uploadedImage: '$uploaded_image',
                                imageDeadLine: {
                                    $dateToString: {
                                        format: '%Y-%m-%d %H:%M:%S',
                                        date: '$image_dead_line',
                                        timezone: 'UTC',
                                    },
                                },
                                imageApprove: '$image_approve',
                                imageStatus: '$image_status',
                                uploadedBy: '$uploaded_by',
                                profileImage: '$userDetails.profile_image',
                                phoneNumber: '$phone_number',
                                logoImage: '$logo_image',
                                createdAt: {
                                    $dateToString: {
                                        format: '%Y-%m-%d %H:%M:%S',
                                        date: '$created_at',
                                        timezone: 'UTC',
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $project: {
                        eventName: '$_id',
                        _id: 0,
                        images: 1,
                    },
                },
            ];

            const result = await EventMemory.aggregate(pipeline);
            return Lib.resSuccess({
                data: result,
            });
        } catch (error) {
            console.error('Error in service:', error);
            return {
                error: true,
                code: 500,
                systemCode: 'SERVICE_ERROR',
                message: error.message,
                data: null,
            };
        }
    },
    //date wise listing
    orgImageListDateWise: async (data) => {
        try {
            const { communityId, startDate, endDate } = data;
            const pipeline = [
                {
                    $match: {
                        community_id: ObjectId(communityId),
                        is_deleted: false,
                        image_approve: true,
                        image_status: true,
                        // created_at: {
                        //     $gte: new Date(startDate),
                        //     $lte: new Date(endDate)
                        // }
                    },
                },
                {
                    $sort: { created_at: -1 },
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
                    $unwind: {
                        path: '$userDetails',
                    },
                },
                {
                    $lookup: {
                        from: `${Lib.ENV('DB_PREFIX')}events`,
                        localField: 'event_id',
                        foreignField: '_id',
                        as: 'eventDetails',
                    },
                },
                {
                    $addFields: {
                        eventName: '$eventDetails.title',
                        yearOfUpload: {
                            $dateToString: {
                                format: '%Y',
                                date: '$created_at',
                                timezone: 'UTC',
                            },
                        },
                    },
                },
                {
                    $unwind: '$eventName', // Unwind the array created by $group
                },
                {
                    $group: {
                        _id: { yearOfUpload: '$yearOfUpload' },
                        images: {
                            $push: {
                                id: '$_id',
                                uploadedImage: '$uploaded_image',
                                imageDeadLine: {
                                    $dateToString: {
                                        format: '%Y-%m-%d %H:%M:%S',
                                        date: '$image_dead_line',
                                        timezone: 'UTC',
                                    },
                                },
                                imageApprove: '$image_approve',
                                imageStatus: '$image_status',
                                uploadedBy: '$uploaded_by',
                                profileImage: '$userDetails.profile_image',
                                phoneNumber: '$phone_number',
                                logoImage: '$logo_image',
                                createdAt: {
                                    $dateToString: {
                                        format: '%Y-%m-%d %H:%M:%S',
                                        date: '$created_at',
                                        timezone: 'UTC',
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $project: {
                        yearOfUpload: '$_id.yearOfUpload',
                        _id: 0,
                        images: 1,
                    },
                },
            ];
            if (startDate && endDate) {
                let startDateNew = new Date(startDate).toISOString();
                let isoStartDate = new Date(startDateNew);

                let endDateNew = new Date(endDate).toISOString();
                let isoEndDate = new Date(endDateNew);

                let obj = {
                    $match: {
                        "created_at": {
                            $gte: isoStartDate,
                            $lte: isoEndDate,
                        },
                    },
                };

                pipeline.splice(6, 0, obj);
            }
            const result = await EventMemory.aggregate(pipeline);

            return Lib.resSuccess({
                data: result,
            });
        } catch (error) {
            console.error('Error in service:', error);
            return {
                error: true,
                code: 500,
                systemCode: 'SERVICE_ERROR',
                message: error.message,
                data: null,
            };
        }
    },

    // trying to event name and date wise filtering in one api
    // orgAllUploadImage: async (data) => {
    //     try {
    //         const { communityId, page } = data;
    //         const limit = 10;
    //         const pipeline = [
    //             {
    //                 $match: {
    //                     community_id: ObjectId(communityId),
    //                     is_deleted: false,
    //                     image_approve: true,
    //                 },
    //             },
    //             {
    //                 $sort: { created_at: -1 },
    //             },
    //             {
    //                 $skip: (page - 1) * limit,
    //             },
    //             {
    //                 $limit: limit,
    //             },
    //             {
    //                 $lookup: {
    //                     from: `${Lib.ENV('DB_PREFIX')}events`,
    //                     localField: 'event_id',
    //                     foreignField: '_id',
    //                     as: 'eventDetails',
    //                 },
    //             },
    //             {
    //                 $addFields: {
    //                     eventName: '$eventDetails.title',
    //                     yearOfUpload: {
    //                         $dateToString: {
    //                             format: '%Y',
    //                             date: '$created_at',
    //                             timezone: 'UTC',
    //                         },
    //                     },
    //                 },
    //             },
    //             {
    //                 $unwind: '$eventName', // Unwind the array created by $group
    //             },
    //             {
    //                 $group: {
    //                     _id: '$eventName',
    //                     _id: { yearOfUpload: '$yearOfUpload' },
    //                     images: {
    //                         $push: {
    //                             id: '$_id',
    //                             uploadedImage: '$uploaded_image',
    //                             imageDeadLine: {
    //                                 $dateToString: {
    //                                     format: '%Y-%m-%d %H:%M:%S',
    //                                     date: '$image_dead_line',
    //                                     timezone: 'UTC',
    //                                 },
    //                             },
    //                             imageApprove: '$image_approve',
    //                             imageStatus: '$image_status',
    //                             uploadedBy: '$uploaded_by',
    //                             phoneNumber: '$phone_number',
    //                             logoImage: '$logo_image',
    //                             createdAt: {
    //                                 $dateToString: {
    //                                     format: '%Y-%m-%d %H:%M:%S',
    //                                     date: '$created_at',
    //                                     timezone: 'UTC',
    //                                 },
    //                             },
    //                         },
    //                     },
    //                 },
    //             },
    //             {
    //                 $project: {
    //                     eventName: '$_id',
    //                     yearOfUpload: '$_id.yearOfUpload',
    //                     _id: 0,
    //                     images: 1,
    //                 },
    //             },
    //         ];            
    //         const result = await EventMemory.aggregate(pipeline);
    //         console.log(result, "result.........");

    //         return Lib.resSuccess({
    //             total: result.length,
    //             data: result,
    //         });
    //     } catch (error) {
    //         console.error('Error in service:', error);
    //         return {
    //             error: true,
    //             code: 500,
    //             systemCode: 'SERVICE_ERROR',
    //             message: error.message,
    //             data: null,
    //         };
    //     }
    // },
    getUploadImageListCounting: async (data) => {
        try {
            const { eventId } = data;

            // Define a date range for "this week" and "this month"
            const currentDate = new Date();
            const thisWeekStartDate = new Date(currentDate);
            thisWeekStartDate.setDate(currentDate.getDate() - currentDate.getDay()); // Start of the week
            thisWeekStartDate.setHours(0, 0, 0, 0);

            const thisMonthStartDate = new Date(currentDate);
            thisMonthStartDate.setDate(1); // Start of the month
            thisMonthStartDate.setHours(0, 0, 0, 0);

            // Calculate various counts
            const totalPhoto = await EventMemory.countDocuments({
                event_id: ObjectId(eventId),
                image_rejecte: false,
                is_deleted: false
            });

            const approvedPhoto = await EventMemory.countDocuments({
                event_id: ObjectId(eventId),
                image_approve: true,
                is_deleted: false
            });

            const rejectedPhoto = await EventMemory.countDocuments({
                event_id: ObjectId(eventId),
                image_rejecte: true,
                is_deleted: false
            });

            const uploadedThisWeek = await EventMemory.countDocuments({
                event_id: ObjectId(eventId),
                created_at: { $gte: thisWeekStartDate },
                image_rejecte: false,
                is_deleted: false
            });

            const uploadedThisMonth = await EventMemory.countDocuments({
                event_id: ObjectId(eventId),
                created_at: { $gte: thisMonthStartDate },
                image_rejecte: false,
                is_deleted: false
            });

            const activePhoto = await EventMemory.countDocuments({
                event_id: ObjectId(eventId),
                image_approve: true,
                image_status: true,
                is_deleted: false
            });
            // const activePhoto = totalPhoto - approvedPhoto - rejectedPhoto;

            // Create the response data
            const ImageCounting = {
                totalPhoto,
                approvedPhoto,
                rejectedPhoto,
                uploadedThisWeek,
                uploadedThisMonth,
                activePhoto
            };
            console.log(ImageCounting, "ImageCounting.........");
            return {
                error: false,
                code: 200,
                systemCode: "Image_COUNT_FETCHED_SUCCESSFULLY",
                message: "Image counting fetched successfully",
                data: ImageCounting
            };
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: "ERROR_FETCHING_IMAGE_COUNT",
                message: error.message,
                data: null
            };
        }
    },
    //Mutation
    uploadImage: async (data, userName, userId, phoneNumber, logoImage) => {
        try {
            const community = await Communities.findOne({
                _id: ObjectId(data.communityId),
                is_deleted: false
            })
            if (!community) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'COMMUNITY_NOT_FOUND',
                    message: 'Community not found',
                    data: null
                };
            }
            const event = await Events.findOne({
                _id: ObjectId(data.eventId),
                is_deleted: false,
                is_cancelled: false,
            });

            if (!event) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'EVENT_NOT_FOUND',
                    message: 'Event not found',
                    data: null
                };
            }
            // Create a new memory for the event
            const newMemory = new EventMemory({
                user_id: userId,
                community_id: ObjectId(data.communityId),
                event_id: ObjectId(data.eventId),
                uploaded_image: data.uploadedImage,
                uploaded_by: userName, // using the provided username
                phone_number: phoneNumber,
                logo_image: logoImage,
                image_dead_line: data.imageDeadLine,
                image_approve: data.imageApprove,
                image_status: data.imageStatus,
                created_at: new Date(),
            });
            //   console.log(newMemory,"newMemory......");
            const uploadImage = await newMemory.save();

            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;

            if (data.isAppPortal === true) {
                await ActivityLogService.activityLogActiion({
                    communityId: community._id,
                    userId: userId,
                    module: "EVENT_MEMORY",
                    action: "CREATE",
                    platForm: "app",
                    memberRole: userRole,
                    oldData: null,
                    newData: uploadImage
                })
            } else {
                await ActivityLogService.activityLogActiion({
                    communityId: community._id,
                    userId: userId,
                    module: "EVENT_MEMORY",
                    action: "CREATE",
                    platForm: "web",
                    memberRole: userRole,
                    oldData: null,
                    newData: uploadImage
                })
            }
            return {
                error: false,
                code: 200,
                systemCode: 'IMAGE_UPLOADED_SUCCESSFULLY',
                message: 'Image uploaded successfully',
                data: uploadImage
            };
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_UPLOADING_IMAGE',
                message: error.message,
                data: null
            };
        }
    },
    approveOrRejectImage: async (data) => {
        try {
            const { imageId, imageApprove, imageRejecte } = data;

            const image = await EventMemory.findOne({
                _id: ObjectId(imageId),
                is_deleted: false,
                image_rejecte: false
            });

            if (!image) {
                return {
                    error: true,
                    systemCode: "IMAGE_NOT_FOUND",
                    code: 404,
                    message: "Image not found"
                };
            }

            // Update image_approval and image_rejecte fields based on input values
            if (imageApprove) {
                image.image_approve = true;
                image.image_rejecte = false;
            } else if (imageRejecte) {
                image.image_approve = false;
                image.image_rejecte = true;
            } else {
                return {
                    error: true,
                    systemCode: "INVALID_INPUT",
                    code: 400,
                    message: "Invalid input: You must specify either 'imageApprove' or 'imageRejecte'."
                };
            }

            // Save the updated image
            await image.save();

            return {
                error: false,
                code: 200,
                systemCode: "APPROVAL_REJECTION_SUCCESS",
                message: "Image approval/rejection updated successfully"
            };
        } catch (error) {
            return {
                error: true,
                systemCode: "ERROR_PROCESSING_REQUEST",
                code: 500,
                message: error.message
            };
        }
    },
    imageStatusChange: async (id) => {
        try {
            const imageStatus = await EventMemory.findOne({
                _id: ObjectId(id),
                is_deleted: false
            });
            if (Lib.isEmpty(imageStatus)) {
                return { error: true, message: "No imageStatus found", ErrorClass: ErrorModules.Api404Error };
            }
            if (imageStatus.image_status == true) {
                imageStatus.image_status = false;
            } else {
                imageStatus.image_status = true;
            }
            await imageStatus.save();
            return {
                error: false,
                code: 200,
                message: "statusChangedSuccess"
            };
        } catch (error) {
            return {
                error: true,
                systemCode: "ERROR_PROCESSING_REQUEST",
                code: 500,
                message: error.message
            };
        }
    },
    deleteImage: async function (id) {
        try {
            const ImageObj = {
                "is_deleted": true
            }
            const image = await EventMemory.findOne({ _id: id });
            let updateImage = await EventMemory.findOneAndUpdate({ _id: ObjectId(id) }, { "$set": ImageObj });
            return ({ error: false, message: "Deleted Successfully", data: updateImage });

        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Event find error");
        }
    },
}