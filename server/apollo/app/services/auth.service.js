const User = Lib.Model('Users');
const Communities = Lib.Model('Communities');
const Authentication = Lib.Model('Authentications');
const OTP = Lib.Model('Otps');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const jwt = Lib.getModules('jwt');
const crypto = require('crypto');
const ErrorModules = require('../errors');
const config = require("../config");
const notificationServices = require('./notification.service');
const communityServices = require('./community.service');
const rolePermissionServices = require("./role_permission.service");
const ActivityLogService = require('./activity_log.service')
//const notificationHelper = require('../library/notifiaction.helper')

module.exports = {
    // Admin section authentication start
    // adminLogin: async function (params) {
    //     try {
    //         const admin = await User.findOne({ "contact.email.address": params.email });
    //         if (Lib.isEmpty(admin)) {
    //             return { data: {}, message: "userNotFound", error: true };
    //         }
    //         if (admin.user_type != Lib.getEnum('USER_TYPE.admin')) {
    //             return { data: {}, message: "userNotAdmin", error: true };
    //         }
    //         const hashPassword = crypto.createHash('sha256').update(params.password).digest('hex');
    //         if (admin.password !== hashPassword) {
    //             // return { data: {}, message: "incorrectPassword", error: true };
    //             return { data: {}, message: "incorrectUsernamePassword", error: true };
    //         }
    //         if (params.webToken && params.deviceType) {
    //             if (Lib.isEmpty(admin.device_details)) {
    //                 const payload = {
    //                     device_type: params.deviceType,
    //                     domain: ".com",
    //                     is_active: true,
    //                     updated_at: new Date(),
    //                     web_token: params.webToken
    //                 }
    //                 admin.device_details = [payload];
    //             } else {
    //                 let isDevice = false;
    //                 if (admin.device_details.length > 5) {
    //                     admin.device_details.splice(0, 2);
    //                 }
    //                 await admin.device_details.map(device => {
    //                     device.is_active = false;
    //                     if (params.webToken && params.webToken === device.web_token) {
    //                         device.is_active = true;
    //                         device.web_token = params.webToken;
    //                         isDevice = true;
    //                     }
    //                 });
    //                 if (!isDevice) {
    //                     const payload = {
    //                         device_type: params.deviceType,
    //                         domain: ".com",
    //                         is_active: true,
    //                         updated_at: new Date(),
    //                         web_token: params.webToken
    //                     }
    //                     admin.device_details.push(payload);
    //                 }
    //             }
    //         }
    //         await admin.save();
    //         return { data: { user: admin.toJSON() }, message: "generalSuccess", error: false };
    //     } catch (e) {
    //         if (Lib.isDevEnv()) console.log(e);
    //         if (Lib.isDevEnv() || Lib.isStagingEnv()) {
    //             // For local throw the error itself
    //             throw e;
    //         } else {
    //             throw new ErrorModules.FatalError(Lib.translate("generalError"));
    //         }
    //     }
    // },

    adminLogin: async function (params) {
        try {
            const admin = await User.findOne({ "contact.email.address": params.email });
            if (Lib.isEmpty(admin)) {
                return { data: {}, message: "userNotFound", error: true };
            }
            if (admin.user_type != Lib.getEnum('USER_TYPE.admin')) {
                return { data: {}, message: "userNotAdmin", error: true };
            }
            const hashPassword = crypto.createHash('sha256').update(params.password).digest('hex');
            if (admin.password !== hashPassword) {
                // return { data: {}, message: "incorrectPassword", error: true };
                return { data: {}, message: "incorrectUsernamePassword", error: true };
            }
            // Dynamic OTP
            let otp = Lib.generateRandomNumber(100000, 999999);
            admin.code = Lib.generateOtpToken(otp, Lib.getEnum("OTP_CAUSE._login"));

            if (params.webToken && params.deviceType) {
                if (Lib.isEmpty(admin.device_details)) {
                    const payload = {
                        device_type: params.deviceType,
                        domain: ".com",
                        is_active: true,
                        updated_at: new Date(),
                        web_token: params.webToken
                    }
                    admin.device_details = [payload];
                } else {
                    let isDevice = false;
                    if (admin.device_details.length > 5) {
                        admin.device_details.splice(0, 2);
                    }
                    await admin.device_details.map(device => {
                        device.is_active = false;
                        if (params.webToken && params.webToken === device.web_token) {
                            device.is_active = true;
                            device.web_token = params.webToken;
                            isDevice = true;
                        }
                    });
                    if (!isDevice) {
                        const payload = {
                            device_type: params.deviceType,
                            domain: ".com",
                            is_active: true,
                            updated_at: new Date(),
                            web_token: params.webToken
                        }
                        admin.device_details.push(payload);
                    }
                }
            }

            // TODO send OTP SMS
            let to = params.email;
            const payload = {
                recipient:
                {
                    email: to,
                    user_id: admin._id
                },
                template: {
                    type: "Email",
                    slug: "ADMINSIGNIN",
                    lang: "en"
                },
                contents: {
                    TOKEN: otp,
                }
            }
            //Sending SMS 
            await notificationServices.notifyService(payload);
            let date = new Date();
            await OTP.updateMany({ 'email': params.email }, { $set: { 'is_valid': false } });
            const otpPayload = new OTP({
                otp,
                expired_at: date.setMinutes(date.getMinutes() + 2),
                type: "ADMINSIGNIN",
                email: params.email
            });
            let res = await otpPayload.save();
            await admin.save();
            return { data: { user: admin.toJSON() }, message: "generalSuccess", error: false };
        } catch (e) {
            if (Lib.isDevEnv()) console.log(e);
            if (Lib.isDevEnv() || Lib.isStagingEnv()) {
                // For local throw the error itself
                throw e;
            } else {
                throw new ErrorModules.FatalError(Lib.translate("generalError"));
            }
        }
    },

    // Admin section authentication end

    // Register service for end users
    registerByPhone: async function (data) {
        /**
         * 1. Check if any user is exist
         * 2. Generate the OTP with get random otp
         * 3. Create a new user if does not exists with otp token
         * 4. Return the user details to the resolver
         */
        try {
            const existUser = await User.findOne({
                "contact.phone.number": data.phone,
                "contact.phone.phone_code": data.phoneCode,
                "contact.phone.country_code": new RegExp(["^", data.countryCode, "$"].join(""), "i"),
                // user_type: Lib.getEnum("USER_TYPE.user")
            });
            if (data.isOrgPortal) {
                if (Lib.isEmpty(existUser)) {
                    return { data: {}, message: "userNotFound", error: true };
                }
                const allRoles = await rolePermissionServices.getAllCreatedDotNetRole();
                // My communities under roles -> Board member and Executive member
                let myTopRoleCommunities = await Communities.aggregate([
                    {
                        '$match': {
                            'is_active': true,
                            'is_deleted': false,
                            "members": {
                                $elemMatch: {
                                    "member_id": new ObjectId(existUser._id),
                                    "roles": { $in: allRoles.data },
                                    'is_approved': true,
                                    'is_active': true,
                                    'is_rejected': false,
                                    'is_leaved': false,
                                    'is_deleted': false,
                                }
                            }
                        }
                    }
                ]);
                if (myTopRoleCommunities.length === 0) {
                    return { error: true, message: "You have not admin access or pending admin approval", ErrorClass: ErrorModules.ValidationError };
                }
            }
            let OtpId;
            if (!Lib.isEmpty(existUser)) {
                // login flow
                // Now check if the phone code and country code is same
                const userEmail = existUser.contact.email.address;
                //is active
                if (!existUser.is_active || existUser.is_deleted) {
                    return { error: true, message: "User has been deactivated.", ErrorClass: ErrorModules.ValidationError };
                }
                const euser = existUser.toJSON();
                if (euser.contact.phone.phone_code !== data.phoneCode) {
                    return { error: true, login: true, message: Lib.translate("phoneCodeInvalid"), ErrorClass: ErrorModules.ValidationError };
                }

                if (euser.contact.phone.country_code.toLowerCase() !== data.countryCode.toLowerCase()) {
                    return { error: true, login: true, message: Lib.translate("countryCodeInvalid"), ErrorClass: ErrorModules.ValidationError };
                }
                // Now check if the use has already logged in or not
                // For mobile ending development this is commented out. Will open when we are deploy to the server
                /*const auth = await Authentication.findOne({ "user_id": euser._id ,"token.is_logged_in": true});
                if(!Lib.isEmpty(auth)) {
                    // The user is already logged in
                    return { error: true, login: true, message: Lib.translate("userAlreadyLoggedIn"), ErrorClass: ErrorModules.AuthError };
                }*/

                // Dynamic OTP
                let otp;
                if (data.phone === "9876543210") {
                    otp = 700091;
                } else {
                    otp = 700091;
                    // otp = Lib.generateRandomNumber(100000, 999999);
                }
                existUser.code = Lib.generateOtpToken(otp, Lib.getEnum("OTP_CAUSE._login"));

                // Device details input
                if (((data.fcmToken && data.deviceId) || data.webToken) && data.deviceType) {
                    if (Lib.isEmpty(existUser.device_details)) {
                        const payload = {
                            device_type: data.deviceType,
                            domain: ".net",
                            is_active: true,
                            updated_at: new Date()
                        }
                        if (data.fcmToken && data.deviceId) {
                            payload.fcm_token = data.fcmToken,
                                payload.device_id = data.deviceId
                        }
                        if (data.webToken) {
                            payload.web_token = data.webToken
                        }
                        // If no devices yet
                        if (!existUser.device_details || existUser.device_details.length === 0) {
                            existUser.device_details = [payload];
                        }
                        // existUser.device_details = [payload];
                    } else {
                        let isDevice;
                        if (existUser.device_details.length > 5) {
                            existUser.device_details.splice(0, 2);
                        }
                        await existUser.device_details.map(device => {
                            device.is_active = false;
                            if (data.fcmToken && device.device_id === data.deviceId) {
                                device.is_active = true;
                                device.fcm_token = data.fcmToken;
                                isDevice = true;
                                device.updated_at = new Date();
                            } else if (data.webToken && data.webToken === device.web_token) {
                                device.is_active = true;
                                device.web_token = data.webToken;
                                isDevice = true;
                            }
                        });
                        if (!isDevice) {
                            const payload = {
                                device_type: data.deviceType,
                                domain: ".net",
                                is_active: true,
                                updated_at: new Date()
                            }
                            if (data.fcmToken && data.deviceId) {
                                payload.fcm_token = data.fcmToken,
                                    payload.device_id = data.deviceId
                            }
                            if (data.webToken) {
                                payload.web_token = data.webToken
                            }
                            existUser.device_details.push(payload);
                        }
                    }
                }
                // TODO send OTP SMS
                let to = data.phoneCode + data.phone;
                const payload = {
                    recipient:
                    {
                        phone: to,
                        user_id: euser._id
                    },
                    template: {
                        type: "SMS",
                        slug: "SIGNIN",
                        lang: "en"
                    },
                    contents: {
                        TOKEN: otp,
                        NAME: euser.name
                    }
                }
                // For Email
                const emailpayload = {
                    recipient:
                    {
                        email: userEmail
                    },
                    template: {
                        type: "Email",
                        slug: "SIGNINEMAIL",
                        lang: "en"
                    },
                    contents: {
                        TOKEN: otp,
                        NAME: euser.name
                    }
                }
                //Sending SMS 
                await notificationServices.notifyService(payload);

                // Sending Email
                await notificationServices.notifyService(emailpayload)

                // App prtal sign-in
                if (data.isAppPortal) {
                    let date = new Date();
                    await OTP.updateMany({ 'number': data.phone }, { $set: { 'is_valid': false } });
                    const otpPayload = new OTP({
                        otp,
                        expired_at: date.setMinutes(date.getMinutes() + 2),
                        type: "SIGNIN",
                        number: data.phone
                    });
                    let res = await otpPayload.save();
                    OtpId = res._id;
                }
                await existUser.save();
                //const userDummy={"name":"xyz"}
                //await notificationHelper.getFcmTokens(existUser)
                return { error: false, login: true, message: "generalSuccess", data: { user: existUser.toJSON(), otp, OtpId } };
            } else {
                /**
                 * Registration flow
                 */

                const muser = await User.findOne({
                    "contact.phone.number": data.phone,
                    "is_deleted": false
                }, "_id");
                if (!Lib.isEmpty(muser)) {
                    return { error: true, message: "Phone no. already exists.", ErrorClass: ErrorModules.UniqueConstraintError };
                }

                // App portal sign-up
                if (data.isAppPortal) {
                    let date = new Date();
                    // Dynamic OTP
                    let otp = 700091;
                    // let otp = Lib.generateRandomNumber(100000, 999999);
                    await OTP.updateMany({ 'number': data.phone }, { $set: { 'is_valid': false } });
                    const otpPayload = new OTP({
                        otp,
                        expired_at: date.setMinutes(date.getMinutes() + 2),
                        type: "SIGNUP",
                        number: data.phone
                    });
                    let res = await otpPayload.save();
                    OtpId = res._id;
                    // TODO send OTP SMS
                    let to = data.phoneCode + data.phone;
                    const payload = {
                        recipient:
                        {
                            phone: to,
                            // user_id:userSaveRes._id
                        },
                        template: {
                            type: "SMS",
                            slug: "SIGNUP",
                            lang: "en"
                        },
                        contents: {
                            TOKEN: otp,
                        }
                    }
                    //Sending SMS 
                    await notificationServices.notifyService(payload);
                }

                return {
                    error: false,
                    login: false,
                    message: "Your account is not yet registered or pending admin approval.",
                    data:
                    {
                        user:
                        {
                            phone: data.phone,
                            phoneCode: data.phoneCode,
                            countryCode: data.countryCode,
                            otp: OtpId,
                            fcmToken: data.fcmToken,
                            webToken: data.webToken,
                            deviceId: data.deviceId,
                            deviceType: data.deviceType
                        }
                    }
                };
            }
        } catch (e) {
            if (Lib.isDevEnv()) console.log("Auth User", e);
            if (Lib.isDevEnv() || Lib.isStagingEnv()) {
                // For local throw the error itself
                throw e;
            } else {
                // When in live throw a generalize error stating only the required general message
                console.log(e);
                throw new ErrorModules.FatalError(Lib.translate("generalError"));
            }
        }
    },
    registerUserDetails: async function ({ email, name }, _user) {
        try {
            /**
             * 1. Find the user.
             * 2. Check the user`
             * 3. Generate OTP
             * 4. Update the user with the email name otp
             * 5. Return the call to the controller
             */
            const muser = await User.findOne({
                "contact.email.address": email,
                "is_deleted": false
            }, "_id");
            if (!Lib.isEmpty(muser)) {
                return { error: true, message: "emailIdExist", ErrorClass: ErrorModules.UniqueConstraintError };
            }
            if (Lib.containsNumbers(name)) {
                return { error: true, message: "nameNotNumeric" };
            }
            const otp = 700091;
            // const otp = Lib.generateRandomNumber(100000, 999999);
            const code = Lib.generateOtpToken(otp, Lib.getEnum("OTP_CAUSE._auth"));
            const user = new User({
                name: name,
                contact: {
                    phone: {
                        number: _user.phone,
                        phone_code: _user.phoneCode,
                        country_code: _user.countryCode,
                        is_verified: false
                    },
                    email: {
                        address: email,
                        is_verified: false
                    }

                },
                code: code,
                user_type: Lib.getEnum("USER_TYPE.user"),
                // device_details : [{
                //     fcm_token : _user.fcmToken,
                //     device_id : _user.deviceId, 
                //     device_type : _user.deviceType,
                //     is_active : true
                // }]
            });
            if (_user.deviceType === 'web') {
                user.device_details = [{
                    web_token: _user.webToken,
                    device_type: _user.deviceType,
                    is_active: true
                }];
            } else {
                user.device_details = [{
                    fcm_token: _user.fcmToken,
                    device_id: _user.deviceId,
                    device_type: _user.deviceType,
                    is_active: true
                }];
            }

            const userSaveRes = await user.save();
            if (Lib.isEmpty(userSaveRes)) {
                return { error: true, message: "userNotFound" };
            }
            // TODO send OTP SMS
            let to = _user.phoneCode + _user.phone;
            const payload = {
                recipient:
                {
                    phone: to,
                    user_id: userSaveRes._id
                },
                template: {
                    type: "SMS",
                    slug: "SIGNUP",
                    lang: "en"
                },
                contents: {
                    TOKEN: otp,
                    NAME: name
                }
            }
            //Sending SMS 
            // await notificationServices.notifyService(payload);
            return { error: false, message: "userRegisterSuccess", data: { otp: otp, phone: _user.phone, user: userSaveRes.toJSON() } };
        } catch (e) {
            if (Lib.isDevEnv()) console.log("Auth User Details saved failed", e);
            if (Lib.isDevEnv() || Lib.isStagingEnv()) {
                throw e;
            } else {
                throw new ErrorModules.FatalError(Lib.translate("generalError"));
            }
        }
    },
    verifyOtp: async function (otp, user, isAppPortal) {
        try {
            await OTP.updateMany({ 'expired_at': { $lt: new Date() } }, { $set: { 'is_valid': false } });

            const muser = await User.findOne({
                _id: ObjectId(user.id)
            }, "_id name contact code selected_community selected_organization_portal");
            if (Lib.isEmpty(muser)) {
                return { error: true, message: "userNotFound", ErrorClass: ErrorModules.API404Error };
            }
            let role = '';
            let roleKey = '';
            let communityName = '';
            let logoImage = '';
            let orgCurrency = '';

            let communityId = muser.selected_community ? muser.selected_community : '';
            let orgId = muser.selected_organization_portal ? muser.selected_organization_portal : '';
            if (muser.selected_community && !!isAppPortal) {
                const community = await Communities.findOne({ _id: ObjectId(muser.selected_community) });
                if (!Lib.isEmpty(community)) {
                    let member = community.members.find(elem =>
                        elem.member_id.toString() === user.id &&
                        elem.is_deleted === false &&
                        elem.is_active === true &&
                        elem.is_approved === true &&
                        elem.is_leaved === false
                    );
                    if (member && member.roles[0]) {
                        role = Lib.toTitleCase(member.roles[0], "_", false, " ");
                        roleKey = member.roles[0];
                    }
                    communityName = community.community_name;
                    logoImage = community.logo_image;
                }
            }

            if (orgId && !isAppPortal) {
                const community = await Communities.findOne({ _id: ObjectId(orgId) });
                if (!Lib.isEmpty(community)) {
                    let member = community.members.find(elem =>
                        elem.member_id.toString() === user.id &&
                        elem.is_deleted === false &&
                        elem.is_active === true &&
                        elem.is_approved === true &&
                        elem.is_leaved === false
                    );
                    if (member && member.roles[0]) {
                        role = Lib.toTitleCase(member.roles[0], "_", false, " ");
                        roleKey = member.roles[0];
                    }
                    communityName = community.community_name;
                    logoImage = community.logo_image;
                    orgCurrency = community.currency ? community.currency : '';
                }
            }

            const code = muser.code;
            if (!code) return { error: true, message: "notAllowed", ErrorClass: ErrorModules.GeneralApiError };
            const data = jwt.verify(code, Lib.ENV('GENERAL_SECRET_KEY'));
            if (data.otp === otp) {
                // Update the user tabel
                muser.code = null;
                muser.is_loggedIn = true; // Set is_loggedIn to true upon successful OTP verification
                if (!muser.contact.phone.is_verified) {
                    // Set that the phone number has been verified
                    muser.contact.phone.is_verified = true;
                    muser.contact.phone.verified_at = new Date();
                }
                await muser.save();
                // Otp table otp check
                let otpDetails = await OTP.findOne({ otp, number: muser.contact.phone.number, is_valid: true });
                if (otpDetails) {
                    if (otpDetails.otp !== otp) {
                        return ({ error: true, message: "wrongOTP" });
                    } else if (new Date() > otpDetails.expired_at) {
                        return ({ error: true, message: "OTP Expired." });
                    } else {
                        otpDetails.is_valid = false;
                        await otpDetails.save();
                    }
                }

                const community = await Communities.findOne({ _id: new ObjectId(orgId) });
                const member = community.members.find(
                    (m) => m.member_id.toString() === muser._id.toString()
                );
                const userRole = member.roles;

                await ActivityLogService.activityLogActiion({
                    communityId: orgId,
                    userId: muser._id,
                    module: "AUTHENTICATION",
                    action: "LOG_IN",
                    platForm: "web",
                    memberRole: userRole,
                    oldData: null,
                    newData: null
                });
                //
                return ({
                    error: false,
                    message: "generalSuccess",
                    data: {
                        user: muser.toJSON(),
                        cause: data.cause,
                        communityId: isAppPortal ? communityId : orgId,
                        roleKey: roleKey,
                        role: role,
                        communityName: communityName,
                        logoImage: logoImage,
                        orgCurrency
                    }
                });
            }
            return ({ error: true, message: "wrongOTP" });
        } catch (e) {
            if (Lib.isDevEnv()) console.log(e);
            if (Lib.isDevEnv() || Lib.isStagingEnv()) {
                throw e;
            } else {
                throw new ErrorModules.FatalError(Lib.translate(e.toString()));
            }
        }

    },
    verifyAppOtp: async function (otp, user) {
        try {
            const existUser = await User.findOne({
                "contact.phone.number": user.phone,
                "contact.phone.phone_code": user.phoneCode,
                "contact.phone.country_code": new RegExp(["^", user.countryCode, "$"].join(""), "i"),
                user_type: Lib.getEnum("USER_TYPE.user")
            });
            let communityId = null;
            if (existUser) {
                communityId = existUser.selected_community ? existUser.selected_community : '';
            }

            if (!Lib.isEmpty(existUser)) {
                return { error: true, message: 'signIn' };

            } else {
                let otpDetails = await OTP.findOne({ otp, number: user.phone, is_valid: true });
                if (Lib.isEmpty(otpDetails)) {
                    return ({ error: true, message: "OTP is invalid" });
                }
                if (otpDetails.otp !== otp) {
                    return ({ error: true, message: "wrongOTP" });
                } else if (new Date() > otpDetails.expired_at) {
                    return ({ error: true, message: "OTP Expired." });
                } else {
                    otpDetails.is_valid = false;
                    await otpDetails.save();
                    const id = existUser.selected_community ? existUser.selected_community : '';
                    const community = await Communities.findOne({ _id: new ObjectId(id) });
                    const member = community.members.find(
                        (m) => m.member_id.toString() === existUser._id.toString()
                    );
                    const userRole = member.roles;

                    // Call activity log
                    if (existUser) {
                        await ActivityLogService.activityLogActiion({
                            communityId: communityId,
                            userId: existUser._id,
                            module: "AUTHENTICATION",
                            action: "LOG_IN",
                            platForm: "app",
                            memberRole: userRole,
                            oldData: null,
                            newData: null
                        });
                    }
                    return ({
                        error: false,
                        message: "generalSuccess",
                    });
                }
            }

        } catch (e) {
            if (Lib.isDevEnv()) console.log(e);
            if (Lib.isDevEnv() || Lib.isStagingEnv()) {
                throw e;
            } else {
                throw new ErrorModules.FatalError(Lib.translate(e.toString()));
            }
        }
    },
    resendOtp: async function (user, isAppPortal) {
        try {

            /**
             * 1. Decode the refersh token.
             * 2. Generate another otp and update the user
             * 3. Generate another access token for the OTP.
             * 4. Send the response
             */
            const phone = user.phone;
            const phoneCode = user.phoneCode;

            let name = "there";

            let otp;
            if (phone === "9876543210") {
                otp = 700091;
            } else {
                // otp = Lib.generateRandomNumber(100000, 999999);
                otp = 700091;
            }

            const existUser = await User.findOne({
                "contact.phone.number": phone,
                "contact.phone.phone_code": phoneCode,
                user_type: Lib.getEnum("USER_TYPE.user")
            });

            if (isAppPortal && Lib.isEmpty(existUser)) {
                let date = new Date();
                await OTP.updateMany({ 'number': phone }, { $set: { 'is_valid': false } });
                const otpPayload = new OTP({
                    otp,
                    expired_at: date.setMinutes(date.getMinutes() + 2),
                    type: "SIGNUP",
                    number: phone
                });
                let res = await otpPayload.save();
            } else {
                const _userRes = await User.findOne({ _id: ObjectId(user.id) }, '_id name code contact');
                if (Lib.isEmpty(_userRes)) {
                    return { error: true, message: "userNotFound", ErrorClass: ErrorModules.API404Error };
                }
                // We need to send the cauase with the user token to get the cause again in the refersh token.
                name = _userRes.name
                _userRes.code = Lib.generateOtpToken(otp, user.cause);
                await _userRes.save();
            }

            if (Lib.isEmpty(phone) && Lib.isEmpty(phoneCode)) {
                return { error: true, message: "phoneNotFound", ErrorClass: ErrorModules.API404Error };
            }
            // TODO send OTP SMS
            let to = phoneCode + phone;
            const payload = {
                recipient:
                {
                    phone: to,
                },
                template: {
                    type: "SMS",
                    slug: "RSNDOTP",
                    lang: "en"
                },
                contents: {
                    TOKEN: otp,
                    NAME: name
                }
            }
            //Sending SMS 
            await notificationServices.notifyService(payload);
            return { error: false, message: "generalSuccess", otp };
        } catch (e) {
            if (Lib.isDevEnv()) console.log(e);
            if (Lib.isDevEnv() || Lib.isStagingEnv()) {
                // For local throw the error itself -> This will help us to debug on staging server
                throw e;
            } else {
                throw new ErrorModules.FatalError(Lib.translate("generalError"));
            }
        }
    },
    createAuthentication: async function (otp, user, req) {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 1);
        const authenticationPayload = {
            user_id: user.id,
            email: user.email,
            phone: user.phone
        };

        const statusPayload = {
            code: "200",
            description: user.id + " Id Logging In.",
        };
        if (otp != null) {
            const otpPayload = {
                number: otp
            };
            authenticationPayload['otp'] = otpPayload;
        }

        const tokenPayload = {
            is_logged_in: true,
            expired_at: expireDate,
        };

        const country = {
            country_code: user.countryCode
        };

        if (req) {
            const remotePayload = {
                ip: req.connection.remoteAddress,
                country: country,
                user_agent: req.headers['user-agent'],
            };
            authenticationPayload['remote'] = remotePayload;
        }
        if (user.userType !== "admin" && user.deviceId && user.deviceType) {
            // let deviceDetails = user.find(elem => elem.isActive === true);
            const devicePayload = {
                device_id: user.deviceId ? user.deviceId : '',
                device_type: user.deviceType ? user.deviceType : '',
            }
            authenticationPayload['device'] = devicePayload;
        }



        authenticationPayload['status'] = statusPayload;
        authenticationPayload['token'] = tokenPayload;
        const authentication = new Authentication(authenticationPayload);
        const res = await authentication.save();
        return { error: false, message: "generalSuccess", data: { authentication: res.toJSON() } };
    },


    adminPasswordChange: async function (logUser, params) {
        try {
            const admin = await User.findOne({ _id: logUser });
            if (Lib.isEmpty(admin)) {
                return { error: true, message: "userNotFound" };
            }
            if (admin.user_type == 'admin') {
                const data = params.data;
                if (data.newPassword === data.confirmPassword) {
                    const hashPassword = crypto.createHash('sha256').update(data.newPassword).digest('hex');
                    admin.password = hashPassword;
                    admin.save();
                } else {
                    return { error: true, message: "New passowrd should be same as confirm password" };
                }
            } else {
                return { error: true, message: "User is not an admin" };
            }
            return ({ error: false, message: "adminPassUpdateSuccess" });
        } catch (error) {
            console.log(error);
            throw new ErrorModules.DatabaseError("User not found");
        }

    },

    adminForgotPassword: async function (email) {
        // try {
        const admin = await User.findOne({ "contact.email.address": email });

        if (Lib.isEmpty(admin)) {
            return { error: true, message: "userNotFound", ErrorClass: ErrorModules.API404Error };
        }
        let token;
        let accessToken;
        if (admin.user_type === 'admin') {
            // For token
            // let jwtSecretKey = process.env.JWT_SECRET_KEY;
            // let adminData = {
            //     user_id: admin._id,
            //     email: admin.contact.email.address,
            // }

            // token = jwt.sign(adminData, jwtSecretKey);
            // For token

            // token = Lib.generateRandomNumber(100000, 999999);
            token = 700091;
            const code = Lib.generateOtpToken(token, Lib.getEnum("OTP_CAUSE._auth"));
            let user = {
                email: admin.contact.email.address,
                id: admin._id,
                isAdmin: true,
                cause: "PasswordChange"
            };
            accessToken = Lib.generateAccessToken(user, true, "5m");

            admin.code = code;
            admin.save();
            /**
             * Send mail with link
             */
            const payload = {
                recipient:
                {
                    email: email,
                    user_id: admin._id
                },
                template: {
                    type: "Email",
                    slug: "FRGTPASS",
                    lang: "en"
                },
                contents: {
                    OTP: token,
                    EMAIL: email
                }
            }
            //Sending Email 
            await notificationServices.notifyService(payload);

        } else {
            return { error: true, message: "User is not an admin" };
        }
        return ({ error: false, data: { token: accessToken } });
        // } catch (error) {
        //     console.log(error);
        //     throw new ErrorModules.DatabaseError("User not found");
        // }

    },

    verifyAdminPasswordOtp: async function (otp, id) {
        const admin = await User.findOne({ "_id": id });
        if (Lib.isEmpty(admin)) {
            return { error: true, message: "userNotFound", ErrorClass: ErrorModules.API404Error };
        }
        const code = admin.code;
        if (!code) return { error: true, message: "notAllowed", ErrorClass: ErrorModules.GeneralApiError };
        const data = jwt.verify(code, Lib.ENV('GENERAL_SECRET_KEY'));
        if (data.otp === otp) {
            // Update the user tabel
            admin.code = null;
            await admin.save();
            let otpDetails = await OTP.findOne({ otp, email: admin.contact.email.address, is_valid: true });
            if (otpDetails) {
                if (otpDetails.otp !== otp) {
                    return ({ error: true, message: "wrongOTP" });
                } else if (new Date() > otpDetails.expired_at) {
                    return ({ error: true, message: "OTP Expired." });
                } else {
                    otpDetails.is_valid = false;
                    await otpDetails.save();
                }
            }
            return { data: { user: admin.toJSON() }, message: "generalSuccess", error: false };
        }
        return ({ error: true, message: "wrongOTP" });

    },

    adminPasswordResendOtp: async function (email) {
        // try {
        const admin = await User.findOne({ "contact.email.address": email });

        if (Lib.isEmpty(admin)) {
            return { error: true, message: "userNotFound", ErrorClass: ErrorModules.API404Error };
        }
        let token;
        if (admin.user_type === 'admin') {
            // token = Lib.generateRandomNumber(100000, 999999);
            token = 700091;
            const code = Lib.generateOtpToken(token, Lib.getEnum("OTP_CAUSE._auth"));
            admin.code = code;
            admin.save();
            /**
             * Send mail with link
             */
            const payload = {
                recipient:
                {
                    email: email,
                    user_id: admin._id
                },
                template: {
                    type: "Email",
                    slug: "RSNDOTP",
                    lang: "en"
                },
                contents: {
                    OTP: token,
                    EMAIL: email
                }
            }
            //Sending Email 
            await notificationServices.notifyService(payload);

        } else {
            return { error: true, message: "User is not an admin" };
        }
        return ({ error: false, message: "Resend OTP successfully." });
        // } catch (error) {
        //     console.log(error);
        //     throw new ErrorModules.DatabaseError("User not found");
        // }

    },

    adminResetPassword: async function (params) {
        try {
            const data = params.data;
            var decoded;
            let jwtSecretKey = process.env.JWT_SECRET_KEY;
            decoded = jwt.verify(data.token, jwtSecretKey);
            if (decoded) {
                const admin = await User.findOne({ _id: decoded.user_id });
                if (Lib.isEmpty(admin)) {
                    return { error: true, message: "userNotFound" };
                }
                if (admin.user_type == 'admin') {

                    if (data.newPassword === data.confirmPassword) {
                        const hashPassword = crypto.createHash('sha256').update(data.newPassword).digest('hex');
                        await User.update({ "_id": ObjectId(decoded.user_id) }, { "$set": { "password": hashPassword } });

                        /**
                         * Sending passord change success mail 
                         */

                        const payload = {
                            recipient:
                            {
                                email: admin.contact.email.address,
                                user_id: admin._id
                            },
                            template: {
                                type: "Email",
                                slug: "RSTPASS",
                                lang: "en"
                            },
                            contents: {
                                NAME: admin.name,
                            }
                        }
                        //Sending Email 
                        await notificationServices.notifyService(payload);
                    } else {
                        return { error: true, message: "New passowrd should be same as confirm password" };
                    }
                } else {
                    return { error: true, message: "User is not an admin" };
                }
                return ({ error: false, message: "adminPassUpdateSuccess" });

            } else {
                // Access Denied
                return { error: true, message: "unauthorized" };
            }


        } catch (error) {
            console.log(error);
            throw new ErrorModules.FatalError(Lib.translate("generalError"));
        }
    },

    logout: async function (user) {
        const auth = await Authentication.findOne({ "user_id": ObjectId(user.id), "token.is_logged_in": true });
        if (Lib.isEmpty(auth)) {
            if (!user.force) return { error: true, message: Lib.resSuccess("noUserLoggedIn"), ErrorClass: ErrorModules.AuthError };
        } else {
            auth.token.is_logged_in = false;
            await auth.save();
        }
        // If you have is_loggedIn property in your User model, update it as well
        const muser = await User.findOne({ _id: ObjectId(user.id) });
        if (muser) {
            muser.is_loggedIn = false;
            await muser.save();
        }
        return { error: false, message: "You have been successfully logged out" };
    },

    clearAuthentication: async function () {
        // await Authentication
    },

    userDotNetSignUp: async function (params) {
        const paramUser = params.user;
        const existUser = await User.aggregate([{
            '$match': {
                '$or': [
                    {
                        "contact.phone.number": paramUser.phone,
                        "contact.phone.phone_code": paramUser.phoneCode,
                        "contact.phone.country_code": new RegExp(["^", paramUser.countryCode, "$"].join(""), "i"),
                        "user_type": Lib.getEnum("USER_TYPE.user")
                    },
                    {
                        "contact.email.address": paramUser.email
                    }
                ]
            }
        }]);

        // Checking if any similar email or phone number is exist or not
        if (!Lib.isEmpty(existUser)) {
            if (existUser[0].contact.phone.number === paramUser.phone) {
                return { error: true, message: "Phone no. already exists.", ErrorClass: ErrorModules.ValidationError };
            }
            if (existUser[0].contact.email.address === paramUser.email) {
                return { error: true, message: "Email already exists.", ErrorClass: ErrorModules.ValidationError };
            }
            return { error: true, message: Lib.translate("phoneOrEmailExist"), ErrorClass: ErrorModules.ValidationError };
        } else {
            // Creating new user
            const user = new User({
                name: paramUser.name,
                year_of_birth: paramUser.yearOfBirth,
                profile_image: paramUser.profileImage,
                contact: {
                    phone: {
                        number: paramUser.phone,
                        phone_code: paramUser.phoneCode,
                        country_code: paramUser.countryCode,
                        is_verified: false
                    },
                    email: {
                        address: paramUser.email,
                        is_verified: false
                    }
                },
                user_type: Lib.getEnum("USER_TYPE.user")
            });
            const userSaveRes = await user.save();
            const userId = { id: userSaveRes._id };
            const community = await communityServices.createCommunity(userId, params.community);
            let to = paramUser.phoneCode + paramUser.phone;
            const payload =
            {
                recipient: {
                    phone: to,
                    email: paramUser.email,
                    user_id: userSaveRes._id
                },
                template: {
                    type: "All",
                    slug: "DOTNETSIGN",
                    lang: "en"
                },
                contents: {
                    NAME: paramUser.name
                }
            }
            //Sending notification
            await notificationServices.notifyService(payload);
            return { error: false, message: "Your community request was created successfully! Pending Admin Approval." }
        }
    },

    smsAppLogIn: async function (data) {
        try {
            // Step 1: Find community by sms_app_number
            const community = await Communities.findOne({
                // "sms_app_number.country_code": new RegExp(["^", data.countryCode, "$"].join(""), "i"),
                "sms_app_number.phone_code": data.phoneCode,
                "sms_app_number.number": data.phone
            });

            if (Lib.isEmpty(community)) {
                return { error: true, message: "community Sms App Number Not Found", ErrorClass: ErrorModules.ValidationError };
            }

            if (!community.sms_app_number.is_verified) {
                return { error: true, message: "Please Verify Your Number By Web", ErrorClass: ErrorModules.ValidationError }
            }

            // Generate OTP
            let otp;
            otp = 700091;
            // otp = Lib.generateRandomNumber(100000, 999999);

            community.code = Lib.generateOtpToken(otp, Lib.getEnum("OTP_CAUSE._login"));
            await community.save();

            // Save OTP
            let date = new Date();
            await OTP.updateMany({ 'number': data.phone }, { $set: { 'is_valid': false } });
            const otpPayload = new OTP({
                otp,
                expired_at: date.setMinutes(date.getMinutes() + 2),
                type: "SMS_APP_LOGIN",
                number: data.phone
            });
            const otpDoc = await otpPayload.save();

            // Send notification (SMS)
            const to = data.phoneCode + data.phone;
            const payload = {
                recipient: {
                    phone: to
                },
                template: {
                    type: "SMS",
                    slug: "SMSAPPLOGIN",
                    lang: "en"
                },
                contents: {
                    TOKEN: otp,
                    COMMUNITY: community.community_name
                }
            };

            await notificationServices.notifyService(payload);

            return {
                error: false,
                login: true,
                message: "OTP sent successfully via SMS app login",
                data: {
                    user: community.toJSON(),
                    otp,
                    OtpId: otpDoc._id
                }
            };
        } catch (err) {
            if (Lib.isDevEnv()) console.error("smsAppLogIn error", err);
            throw new ErrorModules.FatalError(Lib.translate("generalError"));
        }
    },

    smsAppVerifyOtp: async function (phone, otp) {
        try {
            if (!phone || !otp) {
                return { error: true, message: "missingPhoneOrOtp" };
            }

            const otpRecord = await OTP.findOne({
                number: phone,
                type: "SMS_APP_LOGIN",
                is_valid: true
            });

            // FIX: Add this back!!
            if (!otpRecord) {
                return { error: true, message: "Otp Not found or alredy Used" };
            }

            // Validate OTP value
            if (otpRecord.otp !== otp) {
                return { error: true, message: "invalidOtp" };
            }

            // Check if OTP is expired
            const now = new Date();
            if (otpRecord.expired_at && otpRecord.expired_at < now) {
                await OTP.updateOne({ _id: otpRecord._id }, { $set: { is_valid: false } });
                return { error: true, message: "otpExpired" };
            }

            // Invalidate OTP after successful verification
            await OTP.updateOne({ _id: otpRecord._id }, { $set: { is_valid: false } });

            const community = await Communities.findOne({
                "sms_app_number.number": phone
            });

            if (!community) {
                return { error: true, message: "communityNotFoundForSmsApp" };
            }

            const code = community.code;
            if (!code) {
                return { error: true, message: "notAllowed", ErrorClass: ErrorModules.GeneralApiError };
            }

            const data = jwt.verify(code, Lib.ENV('GENERAL_SECRET_KEY'));

            const user = community.toJSON();

            return {
                error: false,
                message: "OTP verified successfully",
                data: { user }
            };

        } catch (e) {
            if (Lib.isDevEnv()) console.error(e);
            if (Lib.isDevEnv() || Lib.isStagingEnv()) {
                throw e;
            } else {
                throw new ErrorModules.FatalError(Lib.translate(e.toString()));
            }
        }
    },
    smsAppVerifyByWeb: async function (phoneCode, phone) {
        const community = await Communities.findOne({
            "sms_app_number.number": phone
        });

        if (!community) {
            return { error: true, message: "communityNotFoundForSmsApp" };
        }
        if (community.sms_app_number.number !== phone || community.sms_app_number.phone_code !== phoneCode) {
            return { error: true, message: "pleaseEnterValidPhoneNo", ErrorClass: ErrorModules.GeneralApiError };
        }
        // const otp = Lib.generateRandomNumber(100000, 999999);
        const otp = 700091;
        const code = Lib.generateOtpToken(otp, Lib.getEnum("OTP_CAUSE._verification"));
        community.code = code;
        community.save();

        /**
          * Send SMS with OTP
        */
        const to = phoneCode + phone;
        const payload = {
            recipient:
            {
                phone: to
            },
            template: {
                type: "SMS",
                slug: "SMSAPPVERIFICATION",
                lang: "en"
            },
            contents: {
                OTP: otp,
            }
        }
        //Sending SMS 
        await notificationServices.notifyService(payload);
        return {
            error: false,
            systemCode: "SUCCESS",
            code: 200,
            message: "otpSendSuccess",
        };
    },

    smsAppOtpVerifyByWeb: async function (phone, otp) {
        const community = await Communities.findOne({
            "sms_app_number.number": phone
        });

        if (!community) {
            return { error: true, message: "communityNotFoundForSmsApp" };
        }
        const code = community.code;
        if (!code) {
            return {
                error: true,
                message: "notAllowed",
                ErrorClass: ErrorModules.GeneralApiError
            }
        }
        const data = jwt.verify(code, Lib.ENV('GENERAL_SECRET_KEY'));
        if (data.otp === otp) {
            community.sms_app_number.is_verified = true;
            community.sms_app_number.verified_at = new Date();
            community.code = null;
            await community.save();
            return {
                error: false,
                systemCode: "SUCCESS",
                code: 200,
                message: "success"
            };
        }
        return ({
            error: true,
            message: "wrongOTP"
        })
    }

}