module.exports = function(mongoose) {
    const Schema = mongoose.Schema;
    const VideosSchema = new Schema({
        community_id:{
            type: Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}communities`,
            default:null
        },
        title:{
            type:String
        },
        description:{
            type:String
        },
        thumbnail_image:{
            type:String
        },
        link:{
            type:String
        },
        duration:{
            type:String,
            required: false
        },
        type:{
            type:String,
            enum: ["Youtube", "Vimeo"],
            required: false
        },
        org_title:{
            type:String
        },
        org_description:{
            type:String
        },
        org_thumbnail_image:{
            type:String
        },
        org_link:{
            type:String
        },
        org_duration:{
            type:String,
            required: false
        },
        org_type:{
            type:String,
            enum: ["Youtube", "Vimeo"],
            required: false
        },
        order_no:{
            type:Number
        },
        is_approved:{
            type:Boolean,
            default: true
        },
        is_deleted:{
            type:Boolean,
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
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}videos`, VideosSchema);

}