const ErrorModules = require('../errors');
const jwt = Lib.getModules('jwt');
const Authentication = Lib.Model('Authentications');
const User = Lib.Model('Users');
const logger = require('../library/logger');
const mongoose = require('mongoose');
const {ObjectId} = mongoose.Types;

module.exports = {
    paymentAuth: async function(req, res, next) {
        const authorization = req.headers['authorization'];
        if(Lib.isEmpty(authorization)) {
            res
            .status(403)
            .send({
                error:true,
                message:"No Authorization Found.",
                ErrorClass:ErrorModules.ValidationError
            });
        }
        
        const token = authorization ? authorization.split(' ').pop() : null;
        if(!token) {
            res
            .status(403)
            .send({
                error:true,
                message:"No token found.",
                ErrorClass:ErrorModules.ValidationError
            });
        } 
        try {
            const user = await jwt.verify(Lib.decrypt(token).replace(/"/g, ''), Lib.ENV("ACCESS_TOKEN_SECRET_KEY"));
            req.user = user;

            const auth = await Authentication.findOne({ "user_id": user.id ,"token.is_logged_in":true});
            if (Lib.isEmpty(auth)) {
                res
                .status(401)
                .send({
                    error:true,
                    message:"Authentication Required.",
                    ErrorClass:ErrorModules.ValidationError
                });
            }

            const userDetails = await User.findOne({
                _id:ObjectId(user.id),
                is_active:true,
                is_deleted:false
            });
            if(Lib.isEmpty(userDetails)) {
                res
                .status(404)
                .send({
                    error:true,
                    message:"Invalid User",
                    ErrorClass:ErrorModules.Api404Error
                });
                throw new ErrorModules.AuthError();
            }
            
            next();
        } catch(e) {
            res
            .status(401)
            .send({
                error:true,
                message:"Authentication Required.",
                ErrorClass:ErrorModules.ValidationError
            });
        }
    }
}
