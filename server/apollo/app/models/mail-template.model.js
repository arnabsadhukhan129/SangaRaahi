module.exports = function (mongoose) {
    const Schema = mongoose.Schema;
    const MailTemplateSchema = new Schema({
        community_id: {
            type: Schema.Types.ObjectId,
            ref: `${Lib.ENV('DB_PREFIX')}communities`,
            required: true
        },
        event_id: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: `${Lib.ENV('DB_PREFIX')}events`
        },
        mail_title: {
            type: String,
            required: false
        },
        mail_template_name:{
            type: String,
            required: false
        },
        mail_header:{
            type: String,
            required: false
        },
        banner_image: {
            type: String,
            required: false
        },
        description: {
            type: String,
            required: true
        },
        event_link:{
            type: String,
            required: false
        },
        contact_type:{
            type: String,
            default: 'web visitor'
        },
        status: {
            type: String,
            enum: ["Publish","Published", "Draft"]
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
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}mailtemplates`, MailTemplateSchema);
}