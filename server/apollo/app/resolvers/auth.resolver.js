const Services = require('../services');
const User = Lib.Model('Users');
const mongoose = require('mongoose');
const Communities = Lib.Model('Communities');
const ErrorModules = require('../errors');
const { ObjectId } = mongoose.Types;
const notificationHelper = require('../library/notifiaction.helper')
const notificationServices = require("../services/notification.service");

module.exports = {
    Query: {
        testSMS(root, args, context, info) {
            Services.NotificationService.sendSms("+918436643064", "test sms from developer");
            return Lib.resSuccess();
        }
    },
    Mutation: {
        // Admin Authentication start
        async adminLogin(root, args, context, info) {
            const AuthService = Services.AuthService;
            const data = args.data;
            if (Lib.isEmpty(data.email)) {
                throw new ErrorModules.ValidationError(context.req.__("fieldEmailRequired"));
            }
            if (Lib.isEmpty(data.password)) {
                throw new ErrorModules.ValidationError(context.req.__("fieldPasswordRequired"));
            }
            const admin = await AuthService.adminLogin(data);
            if (admin.error) {
                throw new ErrorModules.GeneralApiError(Lib.translate(admin.message));
            }
            let user = Lib.generalizeUser(Lib.omitKeysFromObject(admin.data.user, ["password", "family_members", "hobbies", "area_of_work:", "profession", "_v", "about_yourself", "is_delete", "code"]));
            // user = Lib.recostructObjectKeys(user);
            const authentication = await Services.AuthService.createAuthentication('', user);
            const access_token = Lib.generateAccessToken(user, false, '5m');
            const refresh_token = Lib.generateRefreshToken(user, false, '15m');
            return Lib.resSuccess('', {
                token: {
                    accessToken: access_token,
                    refreshToken: refresh_token
                },
                user: user
            })
        },


        async registerByPhone(root, args, context, info) {
            const { data } = args;

            if (Lib.isEmpty(data)) {
                throw new ErrorModules.ValidationError("No user data provided.");
            }

            const registrationResult = await Services.AuthService.registerByPhone(data);
            if (registrationResult.error) {
                throw new ErrorModules.AuthError(Lib.translate(registrationResult.message));
            }

            let { user } = registrationResult.data;

            const { otp, OtpId } = registrationResult.data;

            let myTopRoleCommunities = await Communities.aggregate([
                {
                    '$match': {
                        'is_active': true,
                        'is_deleted': false,
                        "members": {
                            $elemMatch: {
                                "member_id": new ObjectId(user._id),
                                "roles": { $in: ['board_member', "executive_member"] },
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
            user = Lib.omitKeysFromObject(user, [
                "hobbies",
                "area_of_work",
                "profession",
                "is_deleted",
                "family_members",
                "_v",
                "code",
                "contacts",
                "device_details"
            ]);

            user.deviceId = data.deviceId;
            user.deviceType = data.deviceType;

            if (registrationResult.login) {
                user = Lib.generalizeUser(user);
            }

            if (OtpId) {
                user.otp = OtpId;
            }

            const accessExpiresIn = registrationResult.login ? "5m" : "1d";
            const refreshExpiresIn = registrationResult.login ? "15m" : "7d";

            user.login = registrationResult.login;

            if (registrationResult.login) {
                user.cause = Lib.getEnum("OTP_CAUSE._login");
            }

            const accessToken = Lib.generateAccessToken(user, registrationResult.login, accessExpiresIn);
            const refreshToken = Lib.generateRefreshToken(user, registrationResult.login, refreshExpiresIn);
            const CommunityId = user.selectedCommunity;
            const community = await Communities.findOne({ _id: ObjectId(CommunityId) });
            return Lib.resSuccess('', {
                token: {
                    accessToken,
                    refreshToken
                },
                phone: user.phone,
                // selectedCommunity: user.selectedCommunity,
                // // communityId: CommunityId,
                // // communityName: community.community_name,
                // // logoImage: community.logo_image,
                login: registrationResult.login
            });
        },
        async registerUserDetails(root, args, context) {
            /**
             * 1. Get the data from the args
             * 2. Check for the data validation
             * 3. Call on the service to perform the registration
             * 4. If any error occurred throw that
             * 5. Get the OTP and send to the user
             * 6. Generate a new access token and refresh token for the otp validation
             * 7. Return to the user call.
             */
            const { email, name, isAppPortal } = args.data;
            let user = context.user;
            // await notificationHelper.getFcmTokens(user)
            if (user.login) {
                // User has been logged in
                // So we do not allowed this here
                throw new ErrorModules.GeneralApiError("Bad Request");
            }
            const result = await Services.AuthService.registerUserDetails({ email, name }, user);
            if (result.error) {
                throw new ErrorModules.GeneralApiError(result.message);
            }
            // The data consist of {otp, phone}
            const data = result.data;
            // Use the notification service to send the otp to the user.

            // Generate the tokens
            user = Lib.generalizeUser(Lib.omitKeysFromObject(data.user, ["hobbies", "area_of_work", "profession", "is_deleted", "family_members", "_v", "code"]));
            user.cause = Lib.getEnum("OTP_CAUSE._auth");
            const accessToken = Lib.generateAccessToken(user, true, '30d');
            const refreshToken = Lib.generateRefreshToken(user, true, '35d');
            if (isAppPortal) {
                let req = context.req;
                let userd = context.user;
                await Services.AuthService.createAuthentication(userd.otp, user, req);
            }

            return Lib.resSuccess('', {
                token: {
                    accessToken: accessToken,
                    refreshToken: refreshToken
                },
                user: {
                    id: user.id,
                    email: email,
                    name: name,
                    phone: data.phone
                }
            });
        },

        async verifyOtp(root, args, context) {
            const { otp, isAppPortal } = args.data;
            let result;
            if (isAppPortal) {
                result = await Services.AuthService.verifyAppOtp(otp, context.user);
                if (!result.error) {
                    const user = context.user;
                    let userDetails = {
                        phone: user.phone,
                        phoneCode: user.phoneCode,
                        countryCode: user.countryCode,
                        otp: otp
                    }
                    const accessToken = Lib.generateAccessToken(userDetails);
                    const refreshToken = Lib.generateRefreshToken(userDetails);

                    return Lib.resSuccess("otpVerifySuccess", {
                        status: true,
                        token: {
                            accessToken: accessToken,
                            refreshToken: refreshToken
                        },
                    });
                } else if (result.error && result.message === 'signIn') {
                    result = await Services.AuthService.verifyOtp(otp, context.user, isAppPortal);
                } else {
                    throw new ErrorModules.GeneralApiError(result.message);
                }
            } else {
                result = await Services.AuthService.verifyOtp(otp, context.user, isAppPortal);
            }
            if (result.error) {
                throw new ErrorModules.GeneralApiError(result.message);
            }
            // The next step is to add email and name
            // which must be done in 10 minutes
            // in case the verify otp comes after the email and password then the expired in parameter should be removed or
            // made to 1 week
            const cause = result.data.cause; // This will require in future
            let user = result.data.user;
            let role = result.data.role;
            let roleKey = result.data.roleKey;
            let communityName = result.data.communityName;
            let communityId = result.data.communityId;
            let logoImage = result.data.logoImage;
            let orgCurrency = result.data.orgCurrency;
            user = Lib.generalizeUser(user);
            let userData = context.user;
            let req = context.req;
            const userId = user.id;
            const userdetails = await User.findOne({ _id: ObjectId(userId) });
            // let slug="otp-verified";
            // let lang='en';
            // await notificationHelper.getFcmTokens(user.id,slug,lang);
            let webToken = [];
            if (userdetails) {
                webToken = userdetails.device_details.filter(device => device.is_active === true).map(device => device.web_token).filter(token => token !== null && token !== undefined);
                fcmToken = userdetails.device_details.filter(device => device.is_active === true).map(device => device.fcm_token).filter(token => token !== null && token !== undefined);
                webToken = [...webToken, ...fcmToken];
            }
            payload = {
                recipient:
                {
                    user_id: user.id,
                    fcmToken: webToken
                },
                template: {
                    type: "Push",
                    slug: "otp-verified",
                    lang: "en"
                },
                image: `${process.env.AWS_PATH}/image_2024_03_18T07_51_52_614Z.png`
            }
            await notificationServices.notifyService(payload);
            // Only create authentication when the auth is login or register
            if ([Lib.getEnum('OTP_CAUSE._login'), Lib.getEnum('OTP_CAUSE._auth')].includes(cause)) {
                await Services.AuthService.createAuthentication(otp, userData, req);
            }
            // The validation time will change in the future
            const access_token = Lib.generateAccessToken(user, false, '30d');
            const refresh_token = Lib.generateRefreshToken(user, false, '35d');
            return Lib.resSuccess("otpVerifySuccess", {
                status: true,
                causeOfAction: cause,
                token: {
                    accessToken: access_token,
                    refreshToken: refresh_token
                },
                user: {
                    /*id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone*/
                    // Rest of the fields are null
                    ...user
                },
                role: role,
                roleKey: roleKey,
                communityName: communityName,
                communityId: communityId,
                logoImage: logoImage,
                orgCurrency
            });
        },

        async resendOtp(root, args, context) {
            try {
                let token = args.data.token;
                let isAppPortal = args.data.isAppPortal;
                token = Lib.decrypt(token);
                if (Lib.isEmpty(token)) {
                    throw new ErrorModules.ValidationError("noTokenFound");
                }
                const jwt = Lib.getModules('jwt');
                let user = jwt.verify(token, Lib.ENV('REFRESH_TOKEN_SECRET_KEY'));
                user = Lib.omitKeysFromObject(user, ['iat', 'exp']);
                const result = await Services.AuthService.resendOtp(user, isAppPortal);
                if (result.error) {
                    throw new ErrorModules.FatalError(result.message);
                }
                const accessToken = Lib.generateAccessToken(user);
                return Lib.resSuccess('otpSendSuccess', {
                    token: {
                        accessToken: accessToken,
                        refreshToken: token
                    },
                    status: true,
                    causeOfAction: user.cause
                });
            } catch (error) {
                console.log(error);
                throw new ErrorModules.AuthError(Lib.translate("Session expired, Please log in."));
                // return {error: true, message: "Token expired, please log in.", ErrorClass: ErrorModules.AuthError };
            }

        },
        /** Admin Change Password **/
        async adminPasswordChange(root, args, context) {
            let logUser = context.user.id;
            const adminPassword = await Services.AuthService.adminPasswordChange(logUser, args);
            if (adminPassword.error) {
                throw new ErrorModules.GeneralApiError(Lib.translate(adminPassword.message));
            }
            return Lib.resSuccess(adminPassword.message);
        },
        /** Admin Forgot Password **/
        async adminForgotPassword(root, args, context) {
            let email = args.data.email;
            const forgotPassword = await Services.AuthService.adminForgotPassword(email);
            if (forgotPassword.error) {
                throw new ErrorModules.GeneralApiError(Lib.translate(forgotPassword.message));
            }
            return Lib.resSuccess('', {
                token: forgotPassword.data.token
            });
        },
        /** Admin Forgot Password Reset**/
        async adminResetPassword(root, args) {
            const resetPassword = await Services.AuthService.adminResetPassword(args);

            return Lib.resSuccess(resetPassword.message);
        },
        /** Admin Forgot Password Resend OTP **/
        async adminPasswordResendOtp(root, args, context) {
            let email;
            if (context.user.email) {
                email = context.user.email;
            }
            const resendOtp = await Services.AuthService.adminPasswordResendOtp(email);
            return Lib.sendResponse(resendOtp);
        },
        /** Admin Forgot Password verify OTP **/
        async verifyAdminPasswordOtp(root, args, context) {
            const data = args.data;
            const id = context.user.id;
            let result;
            result = await Services.AuthService.verifyAdminPasswordOtp(data.otp, id);
            console.log(result, "result..................")
            if (result.error) {
                throw new ErrorModules.GeneralApiError(result.message);
            }
            // let user = Lib.generalizeUser(Lib.omitKeysFromObject(result.data.user, ["password", "family_members", "hobbies", "area_of_work:", "profession", "_v", "about_yourself", "is_delete", "code"]));
            const cause = result.data.cause;
            let user = result.data.user;
            user = Lib.generalizeUser(user);
            let userData = context.user;
            let req = context.req;

            // Only create authentication when the auth is login or register
            // if ([Lib.getEnum('OTP_CAUSE._login'), Lib.getEnum('OTP_CAUSE._auth')].includes(cause)) {
            //     await Services.AuthService.createAuthentication(data.otp, userData, req);
            // }

            const access_token = Lib.generateAccessToken(user, false, '30d');
            const refresh_token = Lib.generateRefreshToken(user, false, '35d');

            return Lib.resSuccess("otpVerifySuccess", {
                token: {
                    accessToken: access_token,
                    refreshToken: refresh_token
                },
                user: user
            });

        },

        async logout(root, args, context) {
            const logout = await Services.AuthService.logout(context.user);
            if (logout.error) {
                throw new logout.ErrorClass(logout.message);
            }
            return Lib.resSuccess(logout.message);
        },
        async userDotNetSignUp(root, args, context) {
            const data = args.data;
            const result = await Services.AuthService.userDotNetSignUp(data);
            return Lib.sendResponse(result);
        },

        async smsAppLogIn(root, args, context) {
            const { data } = args;

            if (Lib.isEmpty(data)) {
                throw new ErrorModules.ValidationError("No phone data provided.");
            }

            const loginResult = await Services.AuthService.smsAppLogIn(data);

            if (!loginResult || loginResult.error || !loginResult.data) {
                throw new ErrorModules.AuthError(Lib.translate(loginResult.message || "loginFailed"));
            }

            // if (loginResult.error) {
            //     throw new ErrorModules.AuthError(Lib.translate(loginResult.message));
            // }

            let { user } = loginResult.data;
            const { otp, OtpId } = loginResult.data;

            user = Lib.omitKeysFromObject(user, [
                "sms_app_number",
                "community_name"
            ]);

            if (OtpId) {
                user.otp = OtpId;
            }

            const accessExpiresIn = loginResult.login ? "5m" : "1d";
            const refreshExpiresIn = loginResult.login ? "15m" : "7d";

            user.login = loginResult.login;

            const payload = {
                community_id: user._id,
                community_email: user.community_email,
                login: loginResult.login
            };

            const accessToken = Lib.generateAccessToken(payload, loginResult.login, accessExpiresIn);
            const refreshToken = Lib.generateRefreshToken(payload, loginResult.login, refreshExpiresIn);

            return Lib.resSuccess('', {
                token: {
                    accessToken,
                    refreshToken
                },
                communityId: user._id,
                communityName: loginResult.data.user.community_name,
                logoImage: user.logo_image,
                phone: data.phone,
                login: true
            });
        },
        smsAppVerifyOtp: async (root, args, context) => {
            try {
                const { data } = args;

                if (!data || !data.phone || !data.otp) {
                    throw new ErrorModules.ValidationError("missingPhoneOrOtp");
                }

                const result = await Services.AuthService.smsAppVerifyOtp(data.phone, data.otp);

                if (result.error) {
                    return {
                        error: true,
                        systemCode: "INVALID_OTP",
                        code: 400,
                        message: result.message,
                        data: null
                    };
                }
                const { user } = result.data;

                let communityDetails = {
                    community_id: user._id,
                    community_email: user.community_email,
                    login: true
                }

                // Generate tokens after OTP success
                // const accessToken = Lib.generateAccessToken(communityDetails, false, "30d");
                const accessToken = Lib.generateAccessToken({ ...communityDetails, tokenType: 'SMS_APP' }, false, "30d");
                const refreshToken = Lib.generateRefreshToken(communityDetails, false, "35d");

                return Lib.resSuccess(result.message, {
                    token: {
                        accessToken,
                        refreshToken
                    },
                    communityId: user._id,
                    communityName: user.community_name,
                    logoImage: user.logo_image,
                    user
                });
            } catch (err) {
                console.error("smsAppVerifyOtp error:", err);
                return {
                    error: true,
                    systemCode: "SERVER_ERROR",
                    code: 500,
                    message: "otpVerificationFailed",
                    data: null
                };
            }
        },
        smsAppVerifyByWeb: async (root, args, context) => {
            const data = args.data;
            const result = await Services.AuthService.smsAppVerifyByWeb(data.phoneCode, data.phone);
            return Lib.sendResponse(result);
        },

        smsAppOtpVerifyByWeb: async (root, args, context) => {
            const phone = args.data.phone;
            const otp = args.data.otp;
            const result = await Services.AuthService.smsAppOtpVerifyByWeb(phone,otp);
            return Lib.sendResponse(result);
        }


    }
}