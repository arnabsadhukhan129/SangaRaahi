module.exports = function (mongoose) {
    const Schema = mongoose.Schema;
    const EmailSmsCreditSchema = new Schema({
        email_credits_remaining:{
            type:Number,
            default:0,
        },
        sms_credits_remaining:{
            type:Number,
            default:0,
        },
        created_at: {
            type: Date,
            default: new Date()
        },
        updated_at: {
            type: Date,
            default: null
        }
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}email_sms_credits`, EmailSmsCreditSchema);
}