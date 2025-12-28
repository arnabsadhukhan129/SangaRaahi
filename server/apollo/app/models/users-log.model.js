module.exports = function(mongoose) {
    const Schema = mongoose.Schema;

    const UsersLogSchema = new Schema({
        user_id:{
            type: Schema.Types.ObjectId,
            required: false,
            ref:`${Lib.ENV('DB_PREFIX')}users`
        },
        name:{
            type:String
        },
        email:{
            type:String
        },
        phone:{
            type:String
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
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}users_log`, UsersLogSchema);
}