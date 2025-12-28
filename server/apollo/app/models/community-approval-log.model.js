module.exports = function(mongoose) {
    const Schema = mongoose.Schema;
    const CommunityApprovalLogSchema = new Schema({
        community_id: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: `${Lib.ENV('DB_PREFIX')}communities`
        },
        type:{
            type:String,
            enum: ["Home", "Video","Payment","About"]
        },
        field:{
            type:String,
            enum: [
                "logo_image", 
                "banner_image",
                "community_description",
                "video",
                "qrcode_image",
                "payment_description",
                "authority_name",
                "link",
                "community_email",
                "community_number",
                "address"
            ]
        },
        fieldname:{
            type:String
        },
        content:{
            type:String,
            default: null
        },
        content_id: {
            type: Schema.Types.ObjectId,
            required: false
        },
        is_approved:{
            type:Boolean,
            default:false
        },
        is_acknowledged:{
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
        }
    },{ timestamps: true });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}community_approval_log`, CommunityApprovalLogSchema);
}