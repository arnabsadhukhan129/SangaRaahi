module.exports = function(mongoose) {
    const Schema = mongoose.Schema;
    const CommunityPaymentSchema = new Schema({
        community_id:{
            type: Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}communities`,
            default:null
        },
        stripe_account_id:{
            type:String,
            default:null
        },
        stripe_account_approval:{
            type:Boolean,
            default:false
        },
        stripe_account_dashboard:{
            type:String,
            default:null
        },
        qrcode_image:{
            type:String,
        },
        org_qrcode_image:{
            type:String,
        },
        bankcheck_image:{
            type:String,
        },
        bankcheck_image_name:{
            type:String,
            required:false
        },
        bankcheck_status:{
            type:String,
            enum: [ "Approved", "Not Reviewed", "Rejected","Not Submitted" ],
            default: "Not Submitted"
        },
        payment_description:{
            type:String
        },
        org_payment_description:{
            type:String
        },
        authority_name:{
            type:String
        },
        org_authority_name:{
            type:String
        },
        link:{
            type:String
        },
        org_link:{
            type:String
        },
        otherpayment_link:{
            type:String
        },
        qrcode_isApproved:{
            type:Boolean,
            default:false
        },
        authority_name_isApproved:{
            type:Boolean,
            default:false
        },
        otherpayment_link_isApproved:{
            type:Boolean,
            default:false
        },
        payment_description_isApproved:{
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
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}community_payment`,CommunityPaymentSchema);
}