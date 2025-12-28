const Blogs = Lib.Model('Blogs');
const mongoose = require('mongoose');
const moment = require('moment');
const cron = require('node-cron');
const { mongoDB } = require('../database/db');
const notificationServices = require('./notification.service');


// Schedule the cron job to run every 30 minutes
cron.schedule('*/30 * * * *', async () => {
    try {
        // Find blogs with payment_status set to true and payment_status_time_verify set to false
        const blogsToUpdate = await Blogs.find({
            payment_status: true,
            payment_status_time_verify: false,
            is_deleted: false
        });
        // Update payment_status_time_verify for blogs that meet the criteria
        blogsToUpdate.forEach(async (blog) => {
            if (blog.payment_status_timestamp && moment().diff(blog.payment_status_timestamp, 'hours') >= 24) {
                // Set payment_status_time_verify to true after 24 hours
                blog.payment_status_time_verify = true;
                await blog.save();
            }
        });
        // // Send email notification
        // let body = "<p>cron running...</p>";

        // // Send email to user
        // let mail_object_user = {
        //     to: 'niloydas4125927@gmail.com',
        //     subject: 'cron running...!',
        //     html: body,
        // };

        // try {
        //     let mailResponseUser = await notificationServices.sendMail(mail_object_user);

        //     if (mailResponseUser.status === false) {
        //         console.error('Mail send error:', mailResponseUser.error);
        //     } else {
        //         console.log('Email notification sent successfully.');
        //     }
        // } catch (error) {
        //     console.error('Error sending email notification:', error);
        // }

    } catch (error) {
        console.error('Error updating payment_status_time_verify:', error);
        // Send email notification for the error
        await sendEmail('Cron Job Error', `Error updating payment_status_time_verify: ${error}`);

    }
});

// Log when the cron job starts
console.log('Cron job scheduled to run every 30 minutes');

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

