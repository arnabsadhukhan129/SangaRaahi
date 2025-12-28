module.exports = function(mongoose) {
    const Schema = mongoose.Schema;
    const NotificationSettingsSchema = new Schema({
        jwt:{
            type: String,
        },
        short_token: {
            type: String,
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
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}tokens`, NotificationSettingsSchema);
}