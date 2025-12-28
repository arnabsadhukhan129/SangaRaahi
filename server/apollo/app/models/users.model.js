module.exports = function(mongoose) {
    const Schema = mongoose.Schema;
    const EmailSchema = new Schema({
        address:{
            type:String,
            default:""
        },
        is_verified: {
            type:Boolean,
            default:false
        },
        verified_at: {
            type: Date,
            default:null
        }
    }, { _id : false });
    const PhoneSchema = new Schema({
        country_code:{
            type:String,
            default:null
        },
        phone_code:{
            type:String
        },
        number:{
            type:String,
            default:""
        },
        is_verified: {
            type:Boolean,
            default:false
        },
        verified_at: {
            type: Date,
            default:null
        }
    }, { _id : false });
    const ContactSchema = new Schema({
        email:EmailSchema,
        phone:PhoneSchema,
        secondary_phone: {
            type: PhoneSchema,
            default: {},
            required: false
        },
        first_address_line:{
            type:String,
            default:null
        },
        second_address_line:{
            type:String,
            default:null
        },
        zipcode: {
            type: String,
            default:null
        },
        city: {
            type: String,
            default:null
        },
        state: {
            type: String,
            default:null
        },
        country: {
            type: String,
            default:null
        },
        latitude:{
            type:Number,
            default:null
        },
        longitude:{
            type:Number,
            default:null
        }
    }, { _id : false });
    const DateOfBirthSchema = new Schema({
        value:{
            type:Date,
            default:null
        },
        is_masked:{
            type:Boolean,
            default: false
        }
    }, { _id : false });
    const FamilyMemberSchema = new Schema({
        user_id:{
            type: Schema.Types.ObjectId,
            required: false,
            ref:`${Lib.ENV('DB_PREFIX')}users`
        },
        community_member_id: {
            type: String,
            unique: true
        },
        age_of_minority: {
            type: String,
            enum: ["adult", "minor", "spouse"],
            required: false
        },
        relation_type: {
            type: String,
            required: false
        },
        gender: {
            type: String,
            required: false
        },
        member_name: {
            type: String
        },
        member_image: {
            type:String,
            default:null
        },
        year_of_birth: {
            type:String,
            default:null
        },
        email : {
            type:String,
            default:null
        },
        first_address_line:{
            type:String,
            default:null
        },
        second_address_line:{
            type:String,
            default:null
        },
        zipcode: {
            type: String,
            default:null
        },
        city: {
            type: String,
            default:null
        },
        state: {
            type: String,
            default:null
        },
        country: {
            type: String,
            default:null
        },
        country_code:{
            type:String,
            default:null
        },
        // We don't need country code or phone code as the phone number only be added to the family member when
        // the user actually exist
        phone: {
            type: String
        },
        phone_code:{
            type:String
        },
        is_deleted:{
            type: Boolean,
            default:false
        },
        created_at:{
            type:Date,
            default: new Date()
        },
        updated_at:{
            type: Date,
            default: new Date()
        }
    }, { timestamp: false })
    
    const MyContactSchema = new Schema({
        user_id:{
            type: Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}users`
        },
        contact_name: {
            type: String
        },
        contact_image: {
            type: String
        },
        contact_phone: {
            type: String
        },
        is_deleted:{
            type: Boolean,
            default:false
        },
        is_favourite: {
            type: Boolean,
            default:false
        },
        created_at:{
            type:Date,
            default: new Date()
        },
        updated_at:{
            type: Date,
            default: new Date()
        }
    }, { timestamp: false });
    
    const DeviceSchema = new Schema({
        user_id:{
            type: Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}users`,
            required: false
        },
        fcm_token: {
            type: String
        },
        web_token: {
            type: String
        },
        device_id: {
            type: String
        },
        device_type: {
            type: String
        },
        domain:{
            type:String,
            default:null
        },
        is_active:{
            type: Boolean,
            default:false
        },
        created_at:{
            type:Date,
            default: new Date()
        },
        updated_at:{
            type: Date,
            default: new Date()
        }
    }, { _id : true });

    const MyLanguageSchema = new Schema({
        is_indian:{
            type:Boolean,
            default:false,
        },
        is_european:{
            type:Boolean,
            default:false,
        },
        sub_language:{
            type:String,
            default: null
        }
    }, { _id : false });
    
    const UserSchema = new Schema({
        name: {
            type: String
        },
        contact: {
            type: ContactSchema,
            required: false
        },
        password:{
           type:String,
           required: false
        },
        code: {
            type: String,
            required: false
        },
        user_type:{
            type:String,
            enum: ['admin', 'user'],
            required: false
        },
        profile_image:{
            type: String,
            required: false
        },
        date_of_birth:{
            type: DateOfBirthSchema,
            required: false
        },
        year_of_birth:{
            type:String,
            default:null
        },
        gender: {
            type:String,
            //enum: ["Male", "Female", "Non Binary", "Undeclared"],
            required: false
        },
        hobbies:[{type:String, required: false}],
        area_of_work: [{type:String, required: false}],
        profession: [{type:String, required: false}],
        about_yourself: {
            type:String,
            required: false
        },
        family_members:[
            {
                type: FamilyMemberSchema,
                required: false
            }
        ],
        contacts:[
            {
                type: MyContactSchema,
                required: false
            }
        ],
        // For App-end selected community
        selected_community: {
            type: Schema.Types.ObjectId,
            required: false
        },
        // For Organisation-end selected community
        selected_organization_portal: {
            type: Schema.Types.ObjectId,
            required: false
        },
        language:{
            type:String,
            //enum: ['en', 'bn','hi'],
            default: 'en'
        },
        future_language:[
            {
                type: MyLanguageSchema,
                required: false
            }
        ],
        device_details: [
            {
                type: DeviceSchema,
                required: false
            }
        ],
        last_activity_at:{
            type: Date,
            required: false
        },
        is_active: {
            type: Boolean,
            default: true
        },
        is_loggedIn: {
            type: Boolean,
            default: false
        },
        is_deleted: {
            type: Boolean,
            default: false
        },
        created_at:{
            type:Date,
            default: Date.now
        },
        updated_at:{
            type: Date,
            default: Date.now
        }
    }, {
        timestamp: false
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}users`, UserSchema);
}