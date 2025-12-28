module.exports = function(mongoose) {
    const Schema = mongoose.Schema;
    const OtpSchema = new Schema({
        otp:{
            type: Number,
            required: true,
        },
        is_valid: {
            type: Boolean,
            default: true
        },
        expired_at: {
            type: Date,
        },
        number: {
            type: String,
        },
        email: {
            type: String,
        },
        type: {
            type: String,
        },
        created_at: {
            type: Date,
            default: new Date()
        },
        updated_at: {
            type: Date,
            default: new Date()
        },
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}otps`, OtpSchema);
}