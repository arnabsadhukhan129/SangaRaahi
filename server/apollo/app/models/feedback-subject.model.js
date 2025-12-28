module.exports = function(mongoose) {
    const Schema = mongoose.Schema;

    const ContentSchema = new Schema({
        data:{
            type:String
        },
        lang:{
            type:String,
            enum: [
                "en",
                "hi",
                "bn"
            ],
        }
    }, { _id : false });

    const FeedbackSubjectSchema = new Schema({
        subject:[
            {
                type: ContentSchema,
                required: false
            }
        ],
        is_active:{
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
        }
       
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}feedback_subject`, FeedbackSubjectSchema);
}