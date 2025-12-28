module.exports = function (mongoose) {
    const Schema = mongoose.Schema;
    const LogSchema = new Schema({
        community_id: {
            type: Schema.Types.ObjectId,
            ref: `${Lib.ENV('DB_PREFIX')}communities`,
            required: true
        },
        user_id: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: `${Lib.ENV('DB_PREFIX')}users`
        },
        module: {
            type: String,
            required: false
        },
        action: {
            type: String,
            required: false
        },
        old_data: {
            type: Schema.Types.Mixed,
            default: null
        },
        new_data: {
            type: Schema.Types.Mixed,
            default: null
        },
        plat_form: {
            type: String,
            required: false
        },
        member_role: {
            type: [String],
            default: []
        },
        is_deleted: {
            type: Boolean,
            default: false
        },
        created_at: {
            type: Date,
            default: Date.now
        },
        updated_at: {
            type: Date,
            default: Date.now
        }
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}activity_log`, LogSchema)
}