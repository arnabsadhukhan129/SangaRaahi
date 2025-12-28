module.exports = function(mongoose) {
    const Schema = mongoose.Schema;
    const NotificationLogSchema = new Schema({
        template_id:{
            type: Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}email_sms_templates`
        },
        user_id:{
            type: Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}users`
        },
        community_id:{
            type: Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}communities`
        },
        subject: {
            type:String,
            default: null
        },
        text: {
            type:String,
            default: null
        },
        html: {
            type:String,
            default: null
        },
        image: {
            type:String,
            default: ""
        },
        device_type: {
            type: [String],
        },
        domains: {
            type: [String],
        },
        recipients: [{
            type:String
        }],
        type: {
            type:String
        },
        sent_at: {
            type: Date
        },
        response:{
            type:String,
            default: null
        },
        status:{
            type:Boolean,
            default:false
        },
        is_deleted:{
            type:Boolean,
            default:false
        },
        is_dotcom: {
            type:Boolean,
            default:false
        },
        section:{
            type:String,
            default: null
        },
        is_viewed: {
            type:Boolean,
            default:false
        },
        // created_at: {
        //     type: Date,
        //     default: new Date()
        // },
        // updated_at: {
        //     type: Date,
        //     default: new Date()
        // },
        
       
    },{ timestamps: true });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}notification_log`, NotificationLogSchema);
}