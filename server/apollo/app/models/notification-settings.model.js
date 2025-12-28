module.exports = function(mongoose) {
    const Schema = mongoose.Schema;
    const NotificationSettingsSchema = new Schema({
        user_id:{
            type: Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}users`
        },
        community_id:{
            type: Schema.Types.ObjectId,
            required: false
        },
        device_id:{
            type:String,
            default: null
        },
        device_type: {
            type:String,
            default: null
        },
        community_event: {
            type:Boolean,
            default:true
        },
        community_group_event: {
            type:Boolean,
            default:false
        },
        private_event: {
            type:Boolean,
            default:false
        },
        community_announcement: {
            type:Boolean,
            default:true
        },
        community_group_announcement: {
            type:Boolean,
            default:false
        },
        community_group_ativities: {
            type:Boolean,
            default:false
        },
        sms_announcement: {
            type:Boolean,
            default:true
        },
        email_announcement: {
            type:Boolean,
            default:true
        },
        sms_event: {
            type:Boolean,
            default:true
        },
        email_event: {
            type:Boolean,
            default:true
        },
        is_deleted:{
            type:Boolean,
            default:false
        },
        created_at: {
            type: Date,
            default: new Date()
        },
        updated_at: {
            type: Date,
            default: new Date()
        },    
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}notification_settings`, NotificationSettingsSchema);
}