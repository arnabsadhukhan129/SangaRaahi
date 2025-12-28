module.exports = function(mongoose) {
    const Schema = mongoose.Schema;
    const EventMemorySchema = new Schema ({
        user_id: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: `${Lib.ENV('DB_PREFIX')}users`
        },
        event_id: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: `${Lib.ENV('DB_PREFIX')}events`
        },
        community_id:{
            type: Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}communities`
        },
        uploaded_image: {
            type: String,
            required: true,
        },
        uploaded_by: {
            type: String,
        },
        phone_number: {
            type: String,
        },
        logo_image : {
            type: String,
        },
        image_dead_line : {
            type : Date,
            default: null,
        },
        image_approve: {
            type: Boolean,
            default: false,
        },
        image_rejecte: {
            type: Boolean,
            default: false,
        },
        image_status: {
            type: Boolean,
            default : true
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
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}event_memory`, EventMemorySchema);
}