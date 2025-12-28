module.exports = function(mongoose) {
    const Schema = mongoose.Schema;

    const ContentSchema = new Schema({
        title:{
            type:String
        },
        body:{
            type:String
        },
    });
    
    const NotificationSchema = new Schema({
        user_id:{
            type:Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}users`
        },
        purpose:{
            type:String
        },
        type:{
            type:String,
            enum:["SMS","EMAIL","PUSH"],
            default:"SMS"
        },
        content:{
            type:ContentSchema,
            required: false
        },
        is_send:{
            type:Boolean,
            default:false
        },
        retired_count:{
            type:Number
        },
        send_at:{
            type: Date,
            default: new Date()
        },
        created_at:{
            type: Date,
            default: new Date()
        },
        updated_at:{
            type: Date,
            default: null
        },
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}notifications`, NotificationSchema);
}