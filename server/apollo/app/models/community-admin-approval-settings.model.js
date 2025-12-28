module.exports = function(mongoose) {
    const Schema = mongoose.Schema;
    const CommunityAdminApprovalSettingsSchema = new Schema({
        community_id:{
            type: Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}communities`,
            required: true
        },
        is_approve_community_banner_image: {
            type: Boolean,
            default: true
          },
          is_approve_community_logo_image: {
            type: Boolean,
            default: true
          },
          is_approve_community_description: {
            type: Boolean,
            default: true
          },
          // is_approve_community_donation_qrlogo: {
          //   type: Boolean,
          //   default: true
          // },
          // is_approve_community_payment_message: {
          //   type: Boolean,
          //   default: true
          // },
          // is_approve_community_payable_authority_name: {
          //   type: Boolean,
          //   default: true
          // },
          // is_approve_community_other_payable_link: {
          //   type: Boolean,
          //   default: true
          // },
          is_approve_community_address: {
            type: Boolean,
            default: true
          },
          is_approve_community_email_address: {
            type: Boolean,
            default: true
          },
          is_approve_community_phone_number: {
            type: Boolean,
            default: true
          }
    },{ timestamps: true});
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}community_admin_approval_settings`,CommunityAdminApprovalSettingsSchema);
}