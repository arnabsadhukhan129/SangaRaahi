module.exports = function (mongoose) {
    const Schema = mongoose.Schema;
    const EmailSmsCreditSchema = new Schema({
        community_id: {
            type: Schema.Types.ObjectId,
            ref: `${Lib.ENV('DB_PREFIX')}communities`,
            required: false
        },
        email_credits_remaining:{
            type:Number,
            default:0
        },
        sms_credits_remaining:{
            type:Number,
            default:0
        },
        type: {
            type: String,
            enum: ["Community", "Admin"]
        },
        operation_type: {
            type: String,
            enum: ["add", "update"]
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
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}email_sms_credit_logs`, EmailSmsCreditSchema);
}