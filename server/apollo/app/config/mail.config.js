"use strict";
const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
module.exports = async function sendMail(mailTo,subject,body) {
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USERNAME, 
      pass: process.env.EMAIL_PASSWORD, 
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: process.env.DEFAULT_EMAIL, // sender address
    to: mailTo, // list of receivers
    subject: subject, // Subject line
    // text: "Hello world?", // plain text body
    html: body, // html body
  });

  console.log("Message sent: %s", info.messageId);

}
