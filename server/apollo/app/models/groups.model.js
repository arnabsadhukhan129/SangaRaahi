module.exports = function(mongoose) {
    const Schema = mongoose.Schema;
    const MemberSchema = new Schema({
        member_id:{
            type: Schema.Types.ObjectId,
            required: false,
            ref:`${Lib.ENV('DB_PREFIX')}users`
        },
        roles:[{type:String}],
        is_approved:{
            type:Boolean,
            default:false
        },
        is_rejected:{
            type:Boolean,
            default:false
        },
        is_active:{
            type:Boolean,
            default: true
        },
        is_deleted:{
            type:Boolean,
            default: false
        },
        is_leaved:{
            type:Boolean,
            default: false
        },
        joined_at:{
            type: Date,
            default: new Date()
        },
        updated_at:{
            type: Date,
            default: null
        },
        leave_at:{
            type: Date,
            default: null
        }
    }, { _id : false });

    const GroupSchema = new Schema({
        name:{
            type: String,
        },
        description:{
            type: String,
        },
        image:{
            type: String,
            default:""
        },
        created_by:{
            type: Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}users`,
            required: true
        },
        community_id:{
            type: Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}communities`,
            required: true
        },
        type:{
            type:String,
            enum: ["Public", "Restricted", "Stealth"],
            default: "Public"
        },
        // member schema id or there should we create again members schema.s
        members:[
            {
                type: MemberSchema,
                required: false
            }
        ],
        is_active:{
            type:Boolean,
            default: true
        },
        is_deleted:{
            type:Boolean,
            default: false
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
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}groups`, GroupSchema);
}