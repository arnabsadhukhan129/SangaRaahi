module.exports = function (mongoose) {
    const Schema = mongoose.Schema;
    const BolgSchema = new Schema({
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
        event_id: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: `${Lib.ENV('DB_PREFIX')}events`
        },
        posted_by: {
            type: String,
            required: false,
        },
        thumbnail_image: {
            type: String,
            required: false
        },
        image: [
            {
                type: String,
                required: false

            }
        ],
        pdf: [
            {
                type: String,
                required: false

            }
        ],
        blog_title: {
            type: String,
            required: true
        },
        blog_category: {
            type: String,
            enum: ["Public", "Private", "Fan"]
        },
        blog_description: {
            type: String,
            required: true
        },
        blog_short_desc: {
            type: String,
            required: false
        },
        fb_link: {
            type: String,
            required: false
        },
        twitter_link: {
            type: String,
            required: false
        },
        likedin_link: {
            type: String,
            required: false
        },
        blog_status: {
            type: Boolean,
            default: false
        },
        payment_status: {
            type: Boolean,
            default: false
        },
        payment_status_timestamp: {
            type: Date,
            default: null
        },
        payment_status_time_verify: {
            type: Boolean,
            default: false
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
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}blogs`, BolgSchema);
}