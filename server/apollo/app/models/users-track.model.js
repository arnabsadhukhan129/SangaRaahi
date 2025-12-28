module.exports = function(mongoose) {
    const Schema = mongoose.Schema;

    const UsersTrackSchema = new Schema({
        user_id:{
            type: Schema.Types.ObjectId,
            required: false,
            ref:`${Lib.ENV('DB_PREFIX')}users`
        },
        acknowledgement_status:{
            type:String,
            required:false
        },
        platform_type:{
            type:String,
            required:false
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
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}users_track`, UsersTrackSchema);
}