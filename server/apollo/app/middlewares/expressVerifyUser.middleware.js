const ErrorModules = require('../errors');
const jwt = Lib.getModules('jwt');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

module.exports = {
    expressVerifyUser: async function (req, res, next) {
        try {
            const authorization = req.headers['authorization'];
            if (!authorization) throw new Error("Authorization Required.");

            const token = authorization.split(' ').pop();
            const user = await jwt.verify(Lib.decrypt(token).replace(/"/g, ''), Lib.ENV("ACCESS_TOKEN_SECRET_KEY"));

            req.user = user;
            next();
        } catch (error) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
                error: error.message,
            });
        }
    }
}