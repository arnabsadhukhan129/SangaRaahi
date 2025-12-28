module.exports = function(mongoose) {
    const Schema = mongoose.Schema;

    const AnnouncementSchema = new Schema({
        user_id:{
            type: Schema.Types.ObjectId,
            required: false,
            ref:`${Lib.ENV('DB_PREFIX')}users`
        },
        community_id:{
            type: Schema.Types.ObjectId,
            required: false,
            ref:`${Lib.ENV('DB_PREFIX')}communities`
        },
        group_id:{
            type: Schema.Types.ObjectId,
            required: false,
            ref:`${Lib.ENV('DB_PREFIX')}groups`,
            default:null
        },
        title:{
            type:String
        },
        description:{
            type:String
        },
        end_date:{
            type: Date,
            default: new Date()
        },
        to_whom:{
            type:String,
            enum:["Public","Member"],
            default:"Public"
        },
        is_active:{
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
            default: null,
            required:false
        },
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}announcements`, AnnouncementSchema);
}