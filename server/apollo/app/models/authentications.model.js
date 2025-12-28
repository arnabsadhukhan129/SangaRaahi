module.exports = function(mongoose) {
    const Schema = mongoose.Schema;

    const CountrySchema = new Schema({
        country_code: {
            type:String,
            default:null
        },
        country:{
            type:String
        },
        locality:{
            type:String
        }
    }, { _id : false });

    const StatusSchema = new Schema({
        code:{
            type:String,
            default: null
        },
        description:{
            type:String,
            default: null
        },
    }, { _id : false });

    const OtpSchema = new Schema({
        number:{
            type:Number,
            default: null
        },
        generation_time:{
            type: Date,
            default: new Date()
        },
        expiry_timestamp:{
            type: Date,
            default: new Date()
        }
    }, { _id : false });

    const TokenSchema = new Schema({
        is_logged_in:{
            type:Boolean,
            default: false
        },
        issued_at:{
            type: Date,
            default: new Date()
        },
        expired_at:{
            type: Date,
            default: new Date()
        },
    }, { _id : false });
    const RemoteSchema = new Schema({
        ip:{
            type:String
        },
        country:{
            type: CountrySchema,
            required: false
        },
        user_agent:{
            type:String,
            required: false
        }
    });
    
    const DeviceSchema = new Schema({
        device_id:{
            type:String,
            required: false
        },
        device_type:{
            type:String,
            required: false
        }
    }, { _id : false });
    const AuthenticationSchema = new Schema({
        user_id:{
            type: Schema.Types.ObjectId,
            required: false,
            ref:`${Lib.ENV('DB_PREFIX')}users`
        },
        phone: {
            type: String,
            required: false
        },
        email:{
            type: String,
            required: false
        },
        init_timestamp:{
            type: Date,
            default: new Date()
        },
        remote:{
            type:RemoteSchema,
            required: false
        },
        status: {
            type:StatusSchema,
            required: false
        },
        otp:{
            type:OtpSchema,
            required: false
        },
        token:{
            type:TokenSchema,
            required: false
        },
        device:{
            type:DeviceSchema,
            required: false
        }
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}authentications`, AuthenticationSchema);
}