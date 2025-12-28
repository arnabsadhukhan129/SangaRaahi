module.exports = function (mongoose) {
    const Schema = mongoose.Schema;

    const ContentSchema = new Schema({
        data: {
            type: String
        },
        lang: {
            type: String,
            enum: [
                "en",
                "hi",
                "bn"
            ],
        }
    }, { _id: false });

    const EmailSmsTemplateSchema = new Schema({
        type: {
            type: String,
            enum: [
                "All",
                "Email",
                "SMS",
                "Push"
            ],
            required: true
        },
        title: {
            type: String
        },
        device_type: {
            type: [String]
        },
        domains: {
            type: [String],
        },
        slug: {
            type: String
        },
        subject: [
            {
                type: ContentSchema,
                required: false
            }
        ],
        html: [
            {
                type: ContentSchema,
                required: false
            }
        ],
        text: [
            {
                type: ContentSchema,
                required: false
            }
        ],
        is_active: {
            type: Boolean,
            default: true
        },
        is_dotcom:{
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
            default: new Date()
        }

    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}email_sms_templates`, EmailSmsTemplateSchema);
}