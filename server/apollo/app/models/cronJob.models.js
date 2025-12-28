module.exports = function (mongoose) {
    const Schema = mongoose.Schema;
    const CronSchema = new Schema ({
        host_id: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: `${Lib.ENV('DB_PREFIX')}users`
        },
        event_id : {
            type: Schema.Types.ObjectId,
            ref : `${Lib.ENV('DB_PREFIX')}events`
        },
        notification_type: {
            type: String,
            enum: ['immediate', 'scheduled']
        },
        notification_status: {
            type: String,
            enum: ['pending', 'processing', 'sent'],
            default: 'pending'
        },
        notification_date: {
            type: Date
        },
        notification_time: {
            type: Date
        },
        rsvp_type: {
            type: String,
            required: false
        },
        email_count: {
            type: Number,
            required: false,
            default: 0
        },
        sms_count: {
            type: Number,
            required: false,
            default: 0
        },
        is_deleted: {
            type: Boolean,
            default: false
        },
        is_active: {
            type: Boolean,
            default: true
        },
        created_at: {
            type: Date,
            default: new Date()
        },
        updated_at: {
            type: Date,
            default: null
        },
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}cron`, CronSchema);

}