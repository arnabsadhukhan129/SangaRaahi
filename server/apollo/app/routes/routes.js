const routes = require('express').Router();
const Services = require("../services");
const xlsx = require('xlsx');
const path = require('path');
const jwt = Lib.getModules('jwt');
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const multer = require('multer');
const Communities = Lib.Model("Communities");
const CommunitySettings = Lib.Model('CommunitySettings');
const Events = Lib.Model('Events');
const MailList = Lib.Model('MailList');
const MailListLog = Lib.Model('MailListLog');
const ErrorModules = require('../errors');
const Storage = multer.memoryStorage();
const upload = multer({ storage: Storage });
const crypto = require("crypto");
const axios = require('axios');
const { expressVerifyUser } = require('../middlewares/expressVerifyUser.middleware')


routes.get('/generate-excel', expressVerifyUser, async (req, res) => {
    try {
        const communityId = req.query.communityId;
        const userId = req.user.id;
        const buffer = await Services.EventService.generateExcel(communityId, userId);
        res.setHeader('Content-disposition', 'attachment; filename=file.xls');
        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        res.end(Buffer.from(buffer, 'base64'));
    } catch (error) {
        console.log(error, "error");
        res.status(500).send({
            success: false,
            message: "An error occurred while generating the Excel file.",
            error: error.message
        });
    }

});
routes.get('/generate-excel-member', expressVerifyUser, async (req, res) => {
    try {
        const communityId = req.query.communityId;
        const userId = req.user.id;
        const buffer = await Services.OrganizationService.generateExcelMemberList(communityId, userId);

        if (buffer) {
            res.setHeader('Content-disposition', 'attachment; filename=file.xls');
            res.setHeader('Content-Type', 'application/vnd.ms-excel');
            res.end(Buffer.from(buffer, 'base64'));
        } else {
            res.status(500).send({
                success: false,
                message: "An error occurred while generating the Excel file. No data found.",
                error: "No data found for the specified communityId."
            });
        }
    } catch (error) {
        console.error(error, "error");
        res.status(500).send({
            success: false,
            message: "An error occurred while generating the Excel file.",
            error: error.message
        });
    }
});
routes.get('/generate-excel-familymember', expressVerifyUser, async (req, res) => {
    try {
        const communityId = req.query.communityId;
        const userId = req.user.id;
        const buffer = await Services.OrganizationService.generateExcelFamilyMemberwiseList(communityId, userId);

        if (buffer) {
            res.setHeader('Content-disposition', 'attachment; filename=file.xls');
            res.setHeader('Content-Type', 'application/vnd.ms-excel');
            res.end(Buffer.from(buffer, 'base64'));
        } else {
            res.status(500).send({
                success: false,
                message: "An error occurred while generating the Excel file. No data found.",
                error: "No data found for the specified communityId."
            });
        }
    } catch (error) {
        console.error(error, "error");
        res.status(500).send({
            success: false,
            message: "An error occurred while generating the Excel file.",
            error: error.message
        });
    }
});
routes.get('/generate-excel-group', expressVerifyUser, async (req, res) => {
    try {
        const communityId = req.query.communityId;
        const userId = req.user.id;
        const buffer = await Services.OrganizationService.generateExcelGroupwiseList(communityId, userId);

        if (buffer) {
            res.setHeader('Content-disposition', 'attachment; filename=file.xls');
            res.setHeader('Content-Type', 'application/vnd.ms-excel');
            res.end(Buffer.from(buffer, 'base64'));
        } else {
            res.status(500).send({
                success: false,
                message: "An error occurred while generating the Excel file. No data found.",
                error: "No data found for the specified communityId."
            });
        }
    } catch (error) {
        console.error(error, "error");
        res.status(500).send({
            success: false,
            message: "An error occurred while generating the Excel file.",
            error: error.message
        });
    }
});
routes.get('/generate-excel-payment', expressVerifyUser, async (req, res) => {
    try {
        const eventId = req.query.eventId;
        const userId = req.user.id;
        const buffer = await Services.EventPaymentService.generateExcelPaymentList(eventId, userId);

        if (buffer) {
            res.setHeader('Content-disposition', 'attachment; filename=file.xls');
            res.setHeader('Content-Type', 'application/vnd.ms-excel');
            res.end(Buffer.from(buffer, 'base64'));
        } else {
            res.status(500).send({
                success: false,
                message: "An error occurred while generating the Excel file. No data found.",
                error: "No data found for the specified communityId."
            });
        }
    } catch (error) {
        console.error(error, "error");
        res.status(500).send({
            success: false,
            message: "An error occurred while generating the Excel file.",
            error: error.message
        });
    }
});
routes.get('/generate-excel-task', expressVerifyUser, async (req, res) => {
    try {
        const eventId = req.query.eventId;
        const userId = req.user.id;
        const buffer = await Services.EventTaskService.generateExcelTaskList(eventId, userId);

        if (buffer) {
            res.setHeader('Content-disposition', 'attachment; filename=file.xls');
            res.setHeader('Content-Type', 'application/vnd.ms-excel');
            res.end(Buffer.from(buffer, 'base64'));
        } else {
            res.status(500).send({
                success: false,
                message: "An error occurred while generating the Excel file. No data found.",
                error: "No data found for the specified communityId."
            });
        }
    } catch (error) {
        console.error(error, "error");
        res.status(500).send({
            success: false,
            message: "An error occurred while generating the Excel file.",
            error: error.message
        });
    }
});
routes.get('/generate-excel-supplier', expressVerifyUser, async (req, res) => {
    try {
        const eventId = req.query.eventId;
        const userId = req.user.id;
        const buffer = await Services.EventSupplierManagementService.generateExcelSupplierList(eventId, userId);

        if (buffer) {
            res.setHeader('Content-disposition', 'attachment; filename=file.xls');
            res.setHeader('Content-Type', 'application/vnd.ms-excel');
            res.end(Buffer.from(buffer, 'base64'));
        } else {
            res.status(500).send({
                success: false,
                message: "An error occurred while generating the Excel file. No data found.",
                error: "No data found for the specified communityId."
            });
        }
    } catch (error) {
        console.error(error, "error");
        res.status(500).send({
            success: false,
            message: "An error occurred while generating the Excel file.",
            error: error.message
        });
    }
});
routes.get('/generate-excel-supplier-log', expressVerifyUser, async (req, res) => {
    try {
        const supplierId = req.query.supplierId;
        const userId = req.user.id;
        const buffer = await Services.EventSupplierManagementService.generateExcelSupplierLogList(supplierId, userId);

        if (buffer) {
            res.setHeader('Content-disposition', 'attachment; filename=file.xls');
            res.setHeader('Content-Type', 'application/vnd.ms-excel');
            res.end(Buffer.from(buffer, 'base64'));
        } else {
            res.status(500).send({
                success: false,
                message: "An error occurred while generating the Excel file. No data found.",
                error: "No data found for the specified communityId."
            });
        }
    } catch (error) {
        console.error(error, "error");
        res.status(500).send({
            success: false,
            message: "An error occurred while generating the Excel file.",
            error: error.message
        });
    }
});
routes.post('/import-file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { communityId } = req.body;

        // Check if communityId is valid
        const community = await Communities.findOne({
            _id: ObjectId(communityId)
        });

        if (Lib.isEmpty(community)) {
            throw new ErrorModules.Api404Error("noCommunityFound");
        }

        // Read file buffer
        const fileBuffer = req.file.buffer;

        // Parse uploaded Excel file from buffer
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Get header row as array
        const headerRow = xlsx.utils.sheet_to_json(worksheet, {
            range: 1, // Skip the first row
            header: 1 // Use the second row as the header
        })[0];

        // Parse data starting from the second row
        const jsonData = xlsx.utils.sheet_to_json(worksheet, {
            range: 2, // Start parsing from the second row
            header: headerRow
        });

        // Get all existing emails and phone numbers for the specific community
        const existingContacts = await MailList.find({
            community_id: communityId,
            $or: [
                { is_deleted: false },
                { is_deleted: { $exists: false } }
            ]
        }, 'contact_email').lean();
        const existingEmails = existingContacts.map(contact => contact.contact_email);
        // const existingPhoneNumbers = existingContacts.map(contact => contact.phone_no);

        // Filter out duplicate data within the same community
        const duplicateData = jsonData.filter(item => {
            return existingEmails.includes(item.contact_email);
        });

        // Log duplicate entries
        const logEntries = duplicateData.map(item => ({
            community_id: communityId,
            contact_email: item.contact_email,
            contact_name: item.contact_name,
            phone_code: item.phone_code,
            phone_no: item.phone_no,
            created_at: new Date(),
        }));

        // Save log entries in mailListLog collection
        await MailListLog.insertMany(logEntries);

        // Filter out unique data within the same community
        const uniqueData = jsonData.filter(item => {
            return !existingEmails.includes(item.contact_email);
        });

        // If all data is duplicate, return message
        if (uniqueData.length === 0) {
            return res.status(400).json({ message: 'All data is duplicate' });
        }

        const mailListData = uniqueData.map(item => ({
            community_id: communityId,
            contact_email: item.contact_email,
            contact_name: item.contact_name,
            phone_code: item.phone_code,
            phone_no: item.phone_no,
            contact_type: item.contact_type || 'web visitor',
            is_deleted: false,
            created_at: new Date(),
            updated_at: null
        }));

        // Insert unique data into MailList collection
        await MailList.insertMany(mailListData);

        res.status(200).json({ message: 'File imported successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Deep Link Event Details
routes.get('/event-details', async (req, res) => {
    try {
        const eventId = req.query.eventId;

        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "Event ID is required."
            });
        }
        const result = await Services.EventService.getEventDetails(eventId);
        if (result.error) {
            return res.status(404).json({
                success: false,
                message: result.message
            });
        }

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.data
        });
    } catch (error) {
        console.error("Error fetching event details:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

// routes.get('/.well-known/assetlinks.json', async (req, res) => {
//     try {
//         // Fetch the assetlinks.json file from the external URL
//         const response = await axios.get("https://sangaraahi.net/.well-known/assetlinks.json");

//         // Set content type to application/json
//         res.setHeader('Content-Type', 'application/json');

//         // Send the file content as JSON response
//         res.send(response.data);
//     } catch (error) {
//         console.error("Error fetching assetlinks.json:", error);
//         res.status(500).json({
//             success: false,
//             message: "Internal server error",
//             error: error.message
//         });
//     }
// });

// routes.get('/deep-link/:eventId', async (req, res) => {
//     try {
//         const eventId = req.params.eventId;


//         if (!eventId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Event ID is required."
//             });
//         }

//         res.sendStatus(200);

//     } catch (error) {
//         console.error("Error fetching event details:", error);
//         res.status(500).json({
//             success: false,
//             message: "Internal server error",
//             error: error.message
//         });
//     }
// });

routes.get('/deep-link/:eventId', async (req, res) => {
    try {
        const nonce = crypto.randomBytes(16).toString("base64");
        res.setHeader("Content-Security-Policy", `script-src 'self' 'nonce-${nonce}' https://apis.google.com`);
        const eventId = new mongoose.Types.ObjectId(req.params.eventId);
        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "Event ID is required."
            });
        }

        const event = await Events.findOne({ _id: new ObjectId(eventId) });

        const communityId = event.community_id;
        // const eventId = event._id;
        const community = await Communities.findOne({ _id: new ObjectId(communityId) });
        const communitySettings = await CommunitySettings.findOne({ community_id: new ObjectId(community._id) })
        const slug = communitySettings.slug;

        // Construct the deep link for the mobile app
        const appDeepLink = `sangaraahi://event/${eventId}`;
        // Construct the fallback web URL
        const webFallback = `https://sangaraahi.org/${slug}/EventDetails?id=${eventId}`
        // `https://sangaraahi.org/event/${eventId}`;

        // HTML page that tries to open the app, then redirects to web if not installed
        const htmlResponse = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Redirecting...</title>
                <script nonce="${nonce}">
                    function openApp() {
                        var now = new Date().getTime();
                        var iframe = document.createElement("iframe");
                        iframe.style.display = "none";
                        iframe.src = "sangaraahi://event/${eventId}";
                        document.body.appendChild(iframe);

                        setTimeout(() => {
                            if (new Date().getTime() - now < 2500) {
                                window.location.href = "https://sangaraahi.org/${slug}/EventDetails?id=${eventId}";
                            }
                        }, 1500);
                    }
                    window.onload = openApp;
                </script>
            </head>
            <body>
                <p>Redirecting...</p>
            </body>
            </html>
        `;

        res.send(htmlResponse);

    } catch (error) {
        console.error("Error processing deep link:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


module.exports = routes;
