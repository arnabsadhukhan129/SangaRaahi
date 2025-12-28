const Events = Lib.Model('Events');
const Blogs = Lib.Model('Blogs');
const Communities = Lib.Model('Communities');
const User = Lib.Model('Users');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const ErrorModules = require('../errors');
const moment = require('moment');
const mime = require('mime-types');
// const Services = require("../services")
const ActivityLogService = require('./activity_log.service')
const { uploadFileToS3 } = require('../services/s3.service')

module.exports = {
    createBlogs: async (data, user, userId) => {
        try {
            // Check if communityId is valid and exists
            const community = await Communities.findById(data.communityId);
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
                is_cancelled: false
            });

            if (!event) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'EVENT_NOT_FOUND',
                    message: 'Event not found'
                };
            }
            // Define allowed file extensions
            const allowedImageExtensions = ["png", "jpg", "webp", "jpeg"];
            const allowedPdfExtensions = ["pdf"];

            // Function to check file extension
            const isExtensionAllowed = (filename, allowedExtensions) => {
                const fileExtension = filename.split(".").pop().toLowerCase();
                return allowedExtensions.includes(fileExtension);
            };

            // Check extensions for thumbnail_image
            if (!isExtensionAllowed(data.thumbnailImage, allowedImageExtensions)) {
                return {
                    error: true,
                    code: 400,
                    systemCode: 'INVALID_FILE_EXTENSION',
                    message: 'Invalid file extension for thumbnail_image. Allowed extensions are: png, jpg, webp, jpeg.',
                    data: null
                };
            }
            // Check extensions for image
            if (!Array.isArray(data.image)) {
                return {
                    error: true,
                    code: 400,
                    systemCode: 'INVALID_FILE_EXTENSION',
                    message: 'Image must be an array of file names.',
                    data: null
                };
            }

            for (const imageFileName of data.image) {
                if (!isExtensionAllowed(imageFileName, allowedImageExtensions)) {
                    return {
                        error: true,
                        code: 400,
                        systemCode: 'INVALID_FILE_EXTENSION',
                        message: 'Invalid file extension for image. Allowed extensions are: png, jpg, webp, jpeg.',
                        data: null
                    };
                }
            }
            // Check extensions for image
            if (!Array.isArray(data.pdf)) {
                return {
                    error: true,
                    code: 400,
                    systemCode: 'INVALID_FILE_EXTENSION',
                    message: 'Pdf must be an array of file names.',
                    data: null
                };
            }

            // Check extensions for pdf
            for (const pdfFileName of data.pdf) {
                if (!isExtensionAllowed(pdfFileName, allowedPdfExtensions)) {
                    return {
                        error: true,
                        code: 400,
                        systemCode: 'INVALID_FILE_EXTENSION',
                        message: 'Invalid file extension for pdf. Allowed extension is: pdf.',
                        data: null
                    };
                }
            }
            if (data.blogTitle.length > 50) {
                return {
                    error: true,
                    code: 400,
                    systemCode: 'INVALID_BLOG_TITLE_LENGTH',
                    message: 'Blog title should not exceed 50 characters.',
                    data: null
                };
            }
            const existingBlog = await Blogs.findOne({ blog_title: data.blogTitle });
            if (existingBlog) {
                return {
                    error: true,
                    code: 409,  // HTTP Conflict status
                    systemCode: 'BLOG_TITLE_ALREADY_EXISTS',
                    message: 'Blog title already exists.',
                    data: null
                };
            }

            const blog = new Blogs({
                community_id: ObjectId(data.communityId),
                user_id: ObjectId(userId),
                event_id: ObjectId(data.eventId),
                posted_by: user.name,
                thumbnail_image: data.thumbnailImage,
                image: data.image,
                pdf: data.pdf,
                blog_title: data.blogTitle,
                blog_category: data.blogCategory,
                blog_description: data.blogDescription,
                blog_short_desc: data.blogShortDesc,
                fb_link: data.fbLink,
                twitter_link: data.twitterLink,
                likedin_link: data.likedinLink,
                blog_status: data.blogStatus || false,
                payment_status: data.paymentStatus || false,
                created_at: data.createdAt ? new Date(data.createdAt) : new Date()
            });

            const savedBlog = await blog.save();

            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;
            // log the activity
            await ActivityLogService.activityLogActiion({
                communityId: data.communityId,
                userId: userId,
                module: "BLOG",
                action: "CREATE",
                platForm: "web",
                memberRole: userRole,
                oldData: null,
                newData: savedBlog
            });

            return {
                error: false,
                code: 200,
                systemCode: 'BLOG_CREATED_SUCCESSFULLY',
                message: 'generalSuccess',
                data: savedBlog
            };
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_CREATING_BLOG',
                message: error.message,
                data: null
            };
        }
    },
    updateblogs: async (data, userId) => {
        try {
            // Use the ObjectId type from mongoose to validate and convert the ID
            // const blogId = ObjectId(data.blogId);

            // Create an updates object to hold the changes
            const updates = {};

            if (data.thumbnailImage) updates.thumbnail_image = data.thumbnailImage;
            if (data.image) updates.image = data.image;
            if (data.pdf) updates.pdf = data.pdf;
            if (data.blogTitle) updates.blog_title = data.blogTitle;
            if (data.blogCategory) updates.blog_category = data.blogCategory;
            if (data.blogDescription) updates.blog_description = data.blogDescription;
            if (data.blogShortDesc) updates.blog_short_desc = data.blogShortDesc;
            if (data.fbLink) updates.fb_link = data.fbLink;
            if (data.twitterLink) updates.twitter_link = data.twitterLink;
            if (data.likedinLink) updates.likedin_link = data.likedinLink;
            if (data.blogStatus !== undefined) updates.blog_status = data.blogStatus;
            if (data.paymentStatus !== undefined) updates.payment_status = data.paymentStatus;
            if (data.createdAt) updates.created_at = new Date(data.createdAt);

            const oldBlog = await Blogs.findOne({ _id: ObjectId(data.blogId), is_deleted: false });

            // Update the blog with the provided ID using the updates object
            const updatedBlog = await Blogs.findOneAndUpdate(
                { _id: ObjectId(data.blogId), is_deleted: false },
                { $set: updates },
                { new: true }
            );
            if (!updatedBlog) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'BLOG_NOT_FOUND',
                    message: 'Blog not found or not updated',
                    data: null
                };
            }
            // Find changed fields only
            const changedOldData = {};
            const changedNewData = {};

            Object.keys(updates).forEach((field) => {
                if (String(oldBlog[field]) !== String(updatedBlog[field])) {
                    changedOldData[field] = oldBlog[field];
                    changedNewData[field] = updatedBlog[field];
                }
            });

            const id = updatedBlog.community_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === userId.toString()
            );
            const userRole = member.roles;
            // Call activity log
            await ActivityLogService.activityLogActiion({
                communityId: updatedBlog.community_id,
                userId: userId,
                module: "BLOG",
                action: "UPDATE",
                platForm: "web",
                memberRole: userRole,
                oldData: changedOldData,
                newData: changedNewData
            });

            // Return the successful response
            return {
                error: false,
                code: 200,
                systemCode: 'BLOG_UPDATED_SUCCESSFULLY',
                message: 'Blog updated successfully',
                data: updatedBlog
            };

        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_UPDATING_BLOG',
                message: error.message,
                data: null
            };
        }
    },
    getAllBlogs: async (data, user) => {
        const search = data.search;
        const page = data.page || 1;
        const limit = data.limit || 10;
        const communityId = data.communityId;
        const eventId = data.eventId;
        const blogCategory = data.blogCategory;
        const blogStatus = data.blogStatus;
        let sortObject = {};
        let key = "created_at";
        let sort = -1;
        if (data && data.columnName && data.sort) {
            if (data.columnName === 'BlogName') {
                key = 'blog_title';
            } else if (data.columnName === 'DateSort') {
                key = 'created_at';
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
        if (eventId) filter.event_id = ObjectId(eventId);
        if (search) filter.blog_title = new RegExp(search, 'i');
        if (blogCategory) filter.blog_category = blogCategory;
        if (blogStatus !== undefined) filter.blog_status = blogStatus;

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
                    event_id: 1,
                    eventName: 1,
                    posted_by: 1,
                    thumbnail_image: 1,
                    image: 1,
                    pdf: 1,
                    blog_title: 1,
                    blog_category: 1,
                    blog_description: 1,
                    blog_short_desc: 1,
                    fb_link: 1,
                    twitter_link: 1,
                    likedin_link: 1,
                    blog_status: 1,
                    payment_status: 1,
                    payment_status_timestamp: {
                        $dateToString: {
                            format: '%Y-%m-%dT%H:%M:%S.%LZ',
                            date: '$payment_status_timestamp'
                        }
                    },
                    payment_status_time_verify: 1,
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
            const blogs = await Blogs.aggregate(pipeline).collation({ 'locale': 'en' }).sort(sortObject);
            const total = await Blogs.countDocuments(filter);
            // Calculate the "from" and "to" values based on page and limit
            const from = (page - 1) * limit + 1;
            const to = Math.min(page * limit, total);
            return {
                error: false,
                message: "generalSuccess",
                total: total,
                from: from,
                to: to,
                data: blogs
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
    getBolgsById: async (data, context = { lang: "en" },) => {
        try {
            const blogId = ObjectId(data.blogId);
            console.log(blogId,"blogId.............")
            const ROLES_LANG_ENUM = Lib.getEnum("ROLES_LANG_ENUM");
            // Query the blog by its ID
            const blog = await Blogs.findOne({ _id: blogId, is_deleted: false });
            console.log(blog,"blog.............")

            // If no blog is found, return an appropriate response
            if (!blog) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'BLOG_NOT_FOUND',
                    message: 'Blog not found',
                    data: null
                };
            }

            // Fetch event details
            const eventDetails = await Events.findOne({ _id: blog.event_id });

            // Fetch community details including roles
            const communityDetails = await Communities.findOne({ _id: blog.community_id });

            // Find the member in the community members array
            const memberInCommunity = communityDetails.members.find(member => member.member_id.equals(blog.user_id));

            // If the member is not found in the community, return an appropriate response
            if (!memberInCommunity) {
                return {
                    error: true,
                    code: 404,
                    systemCode: 'MEMBER_NOT_FOUND_IN_COMMUNITY',
                    message: 'Member not found in community',
                    data: null
                };
            }

            // Extract roles from the member in the community
            const rolesInCommunity = memberInCommunity.roles || [];
            const humanReadble = ROLES_LANG_ENUM[rolesInCommunity][context.lang];

            // Convert the blog to a format suitable for GraphQL response
            const blogResponse = {
                id: blog._id.toString(),
                eventId: blog.event_id.toString(),
                eventName: eventDetails ? eventDetails.title : '',
                thumbnailImage: blog.thumbnail_image,
                postedBy: blog.posted_by,
                image: blog.image,
                pdf: blog.pdf,
                blogTitle: blog.blog_title,
                blogCategory: blog.blog_category,
                blogDescription: blog.blog_description,
                blogShortDesc: blog.blog_short_desc,
                fbLink: blog.fb_link,
                twitterLink: blog.twitter_link,
                likedinLink: blog.likedin_link,
                blogStatus: blog.blog_status,
                paymentStatus: blog.payment_status,
                createdAt: blog.created_at.toISOString(),
                role: humanReadble
            };

            // Return the successful response
            return {
                error: false,
                code: 200,
                systemCode: 'BLOG_FETCHED_SUCCESSFULLY',
                message: 'Blog fetched successfully',
                data: blogResponse
            };

        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_FETCHING_BLOG_BY_ID',
                message: error.message,
                data: null
            };
        }
    },
    // getBolgsById: async (data) => {
    //     try {
    //         const blogId = ObjectId(data.blogId);

    //         // Query the blog by its ID,
    //         const blog = await Blogs.findOne({ _id: blogId, is_deleted: false });

    //         // If no blog is found, return an appropriate response
    //         if (!blog) {
    //             return {
    //                 error: true,
    //                 code: 404,
    //                 systemCode: 'BLOG_NOT_FOUND',
    //                 message: 'Blog not found',
    //                 data: null
    //             };
    //         }
    //         const eventDetails = await Events.findOne({ _id: blog.event_id });
    //         // Convert the blog to a format suitable for GraphQL response
    //         const blogResponse = {
    //             id: blog._id.toString(),
    //             eventId: blog.event_id.toString(),
    //             eventName: eventDetails ? eventDetails.title : '',
    //             thumbnailImage: blog.thumbnail_image,
    //             postedBy: blog.posted_by,
    //             image: blog.image,
    //             pdf: blog.pdf,
    //             blogTitle: blog.blog_title,
    //             blogCategory: blog.blog_category,
    //             blogDescription: blog.blog_description,
    //             blogStatus: blog.blog_status,
    //             paymentStatus: blog.payment_status,
    //             createdAt: blog.created_at.toISOString()
    //         };

    //         // Return the successful response
    //         return {
    //             error: false,
    //             code: 200,
    //             systemCode: 'BLOG_FETCHED_SUCCESSFULLY',
    //             message: 'Blog fetched successfully',
    //             data: blogResponse
    //         };

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
    deleteBlogs: async (id) => {
        try {
            const BlogObj = {
                "is_deleted": true
            }
            const blogs = await Blogs.findOne({ _id: id });
            let updateBlogs = await Blogs.findOneAndUpdate({ _id: ObjectId(id) }, { "$set": BlogObj });

            const id = blogs.community_id;
            const useId = blogs.user_id;
            const community = await Communities.findOne({ _id: new ObjectId(id) });
            const member = community.members.find(
                (m) => m.member_id.toString() === useId.toString()
            );
            const userRole = member.roles;
            // Call activity log
            await ActivityLogService.activityLogActiion({
                communityId: blogs.community_id,
                userId: blogs.user_id,
                module: "BLOG",
                action: "DELETE",
                platForm: "web",
                memberRole: userRole,
                oldData: null,
                newData: null
            });
            return ({ error: false, message: "generalSuccess", data: updateBlogs });

        } catch (e) {
            console.log(e);
            throw new ErrorModules.DatabaseError("Blogs find error");
        }
    },
    blogStatusChange: async function (id) {
        const blog = await Blogs.findOne({
            _id: ObjectId(id),
            is_deleted: false
        });
        if (Lib.isEmpty(blog)) {
            return { error: true, message: "No blog found", ErrorClass: ErrorModules.Api404Error };
        }
        // ✅ Store old status
        const oldData = { blog_status: blog.blog_status };
        if (blog.blog_status == true) {
            blog.blog_status = false;
        } else {
            blog.blog_status = true;
        }

        await blog.save();

        const communityId = blog.community_id;
        const userId = blog.user_id;
        const community = await Communities.findOne({ _id: new ObjectId(communityId) });
        const member = community.members.find(
            (m) => m.member_id.toString() === userId.toString()
        );
        const userRole = member.roles;
        // ✅ Log the change
        await ActivityLogService.activityLogActiion({
            communityId: blog.community_id,
            userId: blog.user_id,
            module: "BLOG",
            action: "STATUS_CHANGE",
            platForm: "web",
            memberRole: userRole,
            oldData: oldData,
            newData: { blog_status: blog.blog_status }
        });
        return { error: false, message: "statusChangedSuccess" };
    },
    // blogPaymentStatusChange: async function (id) {
    //     const blog = await Blogs.findOne({
    //         _id: ObjectId(id),
    //         is_deleted: false
    //     });
    //     if (Lib.isEmpty(blog)) {
    //         return { error: true, message: "No blog found", ErrorClass: ErrorModules.Api404Error };
    //     }
    //     if (blog.payment_status == true) {
    //         blog.payment_status = false;
    //     } else {
    //         blog.payment_status = true;
    //     }

    //     await blog.save();
    //     return { error: false, message: "statusChangedSuccess" };
    // },
    blogPaymentStatusChange: async function (id) {
        const blog = await Blogs.findOne({
            _id: ObjectId(id),
            is_deleted: false
        });

        if (Lib.isEmpty(blog)) {
            return { error: true, message: "No blog found", ErrorClass: ErrorModules.Api404Error };
        }

        // Check if payment_status is true
        if (blog.payment_status) {
            // Check if 24 hours have passed since payment_status was last changed
            if (blog.payment_status_timestamp && moment().diff(blog.payment_status_timestamp, 'hours') >= 24) {
                return { error: true, message: "Cannot change payment_status after 24 hours", ErrorClass: ErrorModules.Api400Error };
            }
        }

        // Toggle the payment_status
        blog.payment_status = !blog.payment_status;

        // Update payment_status_timestamp only if payment_status is true
        if (blog.payment_status) {
            blog.payment_status_timestamp = new Date();
            // Set blog_status to true when payment_status is true
            blog.blog_status = true;
        }

        await blog.save();
        return { error: false, message: "statusChangedSuccess" };
    },

}