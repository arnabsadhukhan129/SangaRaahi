module.exports = function (mongoose) {
    const Schema = mongoose.Schema;
    const mailListLogSchema = new Schema({
        community_id: {
            type: Schema.Types.ObjectId,
            ref: `${Lib.ENV('DB_PREFIX')}communities`,
            required: true
        },
        // maillist_id: {
        //     type: Schema.Types.ObjectId,
        //     ref: `${Lib.ENV('DB_PREFIX')}maillists`,
        //     required: false
        // },
        contact_email: {
            type: String,
            required: true
        },
        contact_name: {
            type: String,
            required: true
        },
        phone_code: {
            type: String,
            required: false
        },
        phone_no: {
            type: String,
            required: false
        },
        is_deleted: {
            type: Boolean,
            default: false
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
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}maillistlogs`, mailListLogSchema);
}