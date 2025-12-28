module.exports = function(mongoose) {
    const Schema = mongoose.Schema;
    const CommunityFeedbackSchema = new Schema({
        email:{
            type:String,
            required: true,
        },
        message:{
            type:String,
            required: true,
        },
        message_status:{
            type:String,
            enum: ["Replied", "NotViewed","Viewed"],
            default:"NotViewed"
        },
        community_id:{
            type: Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}communities`,
            required: true
        },
        created_at: {
            type: Date,
            default: Date.now
        },
        updated_at: {
            type: Date,
            default: new Date()
        }
       
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}community-feedback`, CommunityFeedbackSchema);
}