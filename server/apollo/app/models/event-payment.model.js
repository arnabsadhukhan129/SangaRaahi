module.exports = function(mongoose) {
    const Schema = mongoose.Schema;

    const PaymentDetails = new Schema({
        payment_status:{
            type:Boolean,
            default: false
        },
        card_no: {
            type:String,
            default:null
        },
        // The main amount recieved by org after any deduction
        transaction_amount: {
            type: Number,
            default: 0
        },
        gateway_charge_cost: {
            type: Number,
            default: 0
        },
        // The amount after calculating all the packages charge
        actual_payment_amtount: {
            type: Number,
            default: 0
        },
        donation_amount: {
            type: Number,
            default: 0
        },
        concession_amount: {
            type: Number,
            default: 0
        },
        payment_mode: {
            type:String,
            enum: ["Card","Apple_pay","Google_pay","Cash", "Check", "Zelle", "Paypal"],
            required: false
        },
        check_no: {
            type:String,
            required: false
        },
        transaction_id:{
            type:String,
            default:null
        },
        description: {
            type: String,
            required: false
        },
        access_platfrom :{
            type: String
        },
        created_at:{
            type: Date,
            default: new Date()
        },
    }, { _id : false });

    const PackageDetails = new Schema({
        package_id:{
            type:String,
            default: false
        },
        number:{
            type:Number,
            default:0
        },
    }, { _id : false });

    const EventPaymentSchema = new Schema({
        event_id:{
            type: Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}events`,
            default:null
        },
        user_id:{
            type: Schema.Types.ObjectId,
            required: false,
            ref:`${Lib.ENV('DB_PREFIX')}users`
        },
        email:{
            type:String,
            default:null,
            required: false,
        },
        name:{
            type:String,
            default:null,
            required: false,
        },
        phone_code:{
            type:String
        },
        phone:{
            type:String,
            default:null,
            required: false,
        },
        member_type: {
            type:String,
            enum: ["web_vistor", "user"],
            default:"user"
        },
        amount: {
            type:Number,
        },
        currency: {
            type:String
        },
        no_of_attendees: {
            type:Number,
            default:0
        },
        // payment_mode: {
        //     type:String
        // },
        rsvp_status: {
            type:String,
            enum: ["paid", "unpaid", "tentatively_paid", "refunded"]
        },
        check_in : {
            type: Boolean,
            default: false
        },
        package_details:[{
            type:PackageDetails,
            required: false
        }],
        payment_details:{
            type:PaymentDetails,
            required: false
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
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}event_payments`, EventPaymentSchema);
}