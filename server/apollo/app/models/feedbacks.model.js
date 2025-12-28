module.exports = function(mongoose) {
    const Schema = mongoose.Schema;

    const PhoneSchema = new Schema({
        country_code:{
            type:String,
            default:null
        },
        phone_code:{
            type:String,
            required: false,
        },
        number:{
            type:String,
            default:""
        }
    }, { _id : false });

    const FeedbackSchema = new Schema({
        user_id:{
            type: Schema.Types.ObjectId,
            required: false,
            ref:`${Lib.ENV('DB_PREFIX')}users`
        },
        subject_id:{
            // type: Schema.Types.ObjectId,
            type: String,
            required: false,
            default:"",
            // ref:`${Lib.ENV('DB_PREFIX')}feedback_subject`
        },
        name:{
            type:String,
            required: true,
        },
        email:{
            type:String,
            required: true,
        },
        phone:PhoneSchema,
        message:{
            type:String,
            required: true,
        },
        is_replied:{
            type:Boolean,
            default:false
        },
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
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}feedbacks`, FeedbackSchema);
}