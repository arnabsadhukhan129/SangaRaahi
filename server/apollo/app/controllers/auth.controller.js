const AuthController = {
    doAuth(req, res) {
        console.log("Socket Auth for the socket id: ", req.body.socketId, "On User: ", req.user.id);
        // No need to do anything
        res.status(200).json({
            error:false,
            message:"Success",
            // ErrorClass:ErrorModules.ValidationError
        });
    }
};
module.exports = AuthController;