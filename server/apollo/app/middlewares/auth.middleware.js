const ErrorModules = require('../errors');
const jwt = Lib.getModules('jwt');
const Authentication = Lib.Model('Authentications');
const Communities = Lib.Model('Communities');
const User = Lib.Model('Users');
const logger = require('../library/logger');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
/**
 * Required Info
 * resolve is a function, which will call the resolver after the middleware
 * root is the root of the graphql
 * args is the arguments passed to the resolvers. Add any extra data to the args from the middleware if any data needs to be passed to the resolver.
 * content: contains the req and res object
 * info: i don't know. Please write the usage of it if you know something
 */
module.exports = {
    verifyUser: async function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        const req = context.req;
        const shouldExclude = Lib.shouldExcludeAuth(fieldName);
        context.shouldExclude = shouldExclude;
        //console.log(req)
        // if(!Lib.shouldExcludeAuth(fieldName)) {
        const authorization = req.headers['authorization'];
        if (Lib.isEmpty(authorization) && !shouldExclude) {
            throw new ErrorModules.AuthError("Authorization Required 1.");
        }
        //console.log(authorization,`line 28`)
        const token = authorization ? authorization.split(' ').pop() : null;
        if (!token && !shouldExclude) throw new ErrorModules.AuthError("Authorization Required 2.");
        try {
            const decoded = await jwt.verify(
                Lib.decrypt(token).replace(/"/g, ''),
                Lib.ENV("ACCESS_TOKEN_SECRET_KEY")
            );

            context.user = decoded;
            if (decoded.tokenType === "SMS_APP") {

                context.smsApp = true;

                const community = await Communities.findOne({
                    _id: ObjectId(decoded.community_id),
                    is_deleted: false
                });

                if (!community) {
                    throw new ErrorModules.AuthError("Invalid SMS App Token Community.");
                }

                context.community = community;

                // Allow resolver to proceed
                return resolve(root, args, context, info);
            }
            if (!shouldExclude && Lib.shouldExcludeAuthLogin(fieldName)) {
                return resolve(root, args, context, info);
            }
            const auth = await Authentication.findOne({ "user_id": ObjectId(decoded.id), "token.is_logged_in": true });
            if (Lib.isEmpty(auth) && !shouldExclude) {
                throw new ErrorModules.AuthError("Authentication Required 3.");
            }
        } catch (e) {
            if (Lib.isDevEnv()) {
                //console.log(e)
                console.log("error in verify middleware, Excluding:- ", shouldExclude);
            }
            // Before throwing the error check if the logout is being accessed or not
            if (((fieldName).toLowerCase() === 'logout' && req.headers['x-uid']) || shouldExclude) {
                if (!shouldExclude) context.user = { id: req.headers['x-uid'], force: true };
                return resolve(root, args, context, info);
            }
            logger.error(e);
            throw new ErrorModules.AuthError("Authorization Required 4.");
        }
        // }

        // If you want to pass any data to the resolvers then add the data to the args
        return resolve(root, args, context, info);
    },
    verifyLogin: async function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        const shouldExcludeAuthLogin = Lib.shouldExcludeAuthLogin(fieldName);
        context.shouldExcludeAuthLogin = shouldExcludeAuthLogin;

        // ===========================================
        //   ALLOW SMS APP TOKEN
        // ===========================================
        if (context.user && context.user.tokenType === "SMS_APP") {

            const community = await Communities.findOne({
                _id: ObjectId(context.user.community_id),
                is_deleted: false
            });

            if (!community) {
                throw new ErrorModules.AuthError("Invalid SMS App Token Community.");
            }

            context.community = community;
            context.smsApp = true;

            return resolve(root, args, context, info);
        }

        // ===========================================
        // MAIN APP LOGIN VALIDATION (unchanged)
        // ===========================================
        if (!context.user || !context.user.id) {
            if (context.shouldExclude) return resolve(root, args, context, info);
            if (shouldExcludeAuthLogin) return resolve(root, args, context, info);
            throw new ErrorModules.AuthError("Authentication Required.");
        }

        const userId = context.user.id;
        const auth = await Authentication.findOne({ "user_id": userId, "token.is_logged_in": true });

        if (Lib.isEmpty(auth)) {
            if (context.shouldExclude) return resolve(root, args, context, info);
            if (context.shouldExcludeAuthLogin) return resolve(root, args, context, info);
            throw new ErrorModules.AuthError("Authentication Required.");
        }

        const userDetails = await User.findOne({
            _id: ObjectId(userId),
            is_active: true,
            is_deleted: false
        });

        if (Lib.isEmpty(userDetails)) {
            if (context.shouldExclude) return resolve(root, args, context, info);
            if (context.shouldExcludeAuthLogin) return resolve(root, args, context, info);
            throw new ErrorModules.AuthError("Invalid User");
        }

        context.getAuthUserInfo = function (key = "all") {
            const user = userDetails.toJSON();
            return key === 'all' ? user : user[key];
        }

        return resolve(root, args, context, info);
    },
    verifyOtpToken: async function (resolve, root, args, context, info) {
        const fieldName = info['fieldName'];
        if (fieldName === "verifyOtp") {
            const req = context.req;
            const authorization = req.headers['authorization'];
            if (Lib.isEmpty(authorization)) {
                throw new ErrorModules.AuthError("No Authorization Found.");
            }

            const token = authorization ? authorization.split(' ').pop() : null;
            if (!token) throw new ErrorModules.AuthError("No token found.");
            try {
                const user = await jwt.verify(Lib.decrypt(token).replace(/"/g, ''), Lib.ENV("ACCESS_TOKEN_SECRET_KEY"));
                context.user = user;
                return resolve(root, args, context, info);
            } catch (e) {
                throw new ErrorModules.AuthError("Existing OTP has been expired.");
            }
        }
        return resolve(root, args, context, info);
    },
}