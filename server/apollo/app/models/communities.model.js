module.exports = function (mongoose) {
    const Schema = mongoose.Schema;

    const PathSchema = new Schema({
        from: {
            type: String
        },
        to: {
            type: String
        }
    }, { _id: false })

    const MemberPromotionSchema = new Schema({
        type: {
            type: String,
            enum: ["Promotion", "Demotion"],
            default: "Promotion"
        },
        date: {
            type: Date,
            default: new Date()
        },
        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected", "Completed"],
            default: "Pending"
        },
        path: {
            type: PathSchema,
            required: false
        },
        authorize_person_id: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: `${Lib.ENV('DB_PREFIX')}users`
        }
    }, { _id: false });


    const MemberSchema = new Schema({
        member_id: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: `${Lib.ENV('DB_PREFIX')}users`
        },
        community_member_id: {
            type: String,
            unique: true
        },
        roles: [{ type: String }],
        is_approved: {
            type: Boolean,
            default: false
        },
        is_rejected: {
            type: Boolean,
            default: false
        },
        member_promotions: [
            {
                type: MemberPromotionSchema,
                required: false
            }
        ],
        is_promotion_request: {
            type: Boolean,
            default: false
        },
        is_active: {
            type: Boolean,
            default: true
        },
        is_admin_approved: {
            type: Boolean,
            default: false
        },
        is_deleted: {
            type: Boolean,
            default: false
        },
        is_leaved: {
            type: Boolean,
            default: false
        },
        joined_at: {
            type: Date,
            default: Date.now
        },
        updated_at: {
            type: Date,
            default: null
        },
        leave_at: {
            type: Date,
            default: null
        },
        is_acknowledged: {
            type: Boolean,
            default: false
        },
        acknowledgement_status: {
            type: String,
            enum: ["NoReply", "Accepted", "Rejected", "Blocked"],
            default: "NoReply"
        },
        acknowledgement_date: {
            type: Date,
            default: null
        },
        acknowledgement_message: {
            type: String,
            default: null
        },
        invitation_date: {
            type: Date,
            default: Date.now
        },
    }, { _id: false });


    const AddressSchema = new Schema({
        first_address_line: {
            type: String
        },
        second_address_line: {
            type: String
        },
        city: {
            type: String
        },
        state: {
            type: String
        },
        country: {
            type: String
        },
        zipcode: {
            type: String
        }
    });

    const LocationSchema = new Schema({
        location: {
            type: String
        },
        org_location: {
            type: String
        },
        latitude: {
            type: Number,
            default: null
        },
        longitude: {
            type: Number,
            default: null
        }
    });

    const SmsEmailSchema = new Schema({
        sms_settings: {
            type: Boolean,
            default: true,
        },
        email_settings: {
            type: Boolean,
            default: true,
        }
    });

    const PhoneSchema = new Schema({
        // country_code: {
        //     type: String,
        //     default: null
        // },
        phone_code: {
            type: String
        },
        number: {
            type: String,
            default: ""
        },
        is_verified: {
            type: Boolean,
            default: false
        },
        verified_at: {
            type: Date,
            default: null
        }
    }, { _id: false });

    const CommunitySchema = new Schema({
        owner_id: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: `${Lib.ENV('DB_PREFIX')}users`
        },
        community_type: {
            type: String,
            enum: ["Social", "Cultural", "Religious", "Others"],
            required: false
        },
        email_credits_remaining: {
            type: Number,
            default: 0
        },
        sms_credits_remaining: {
            type: Number,
            default: 0
        },
        banner_image: {
            type: String,
            required: false
        },
        org_banner_image: {
            type: String,
            required: false
        },
        banner_image_approval: {
            type: Boolean,
            default: true
        },
        logo_image: {
            type: String,
            required: false
        },
        org_logo_image: {
            type: String,
            required: false
        },
        logo_image_approval: {
            type: Boolean,
            default: true
        },
        community_name: {
            type: String,
            required: false
        },
        community_description: {
            type: String,
            required: false
        },
        org_community_description: {
            type: String,
            required: false
        },
        community_location: {
            type: LocationSchema,
            required: false
        },
        community_email: {
            type: String,
            required: false
        },
        org_community_email: {
            type: String,
            required: false
        },
        community_email_approval: {
            type: Boolean,
            default: false
        },
        code: {
            type: String,
            default: null
        },
        community_phone_code: {
            type: String,
            required: false
        },
        community_number: {
            type: String,
            required: false
        },
        org_community_number: {
            type: String,
            required: false
        },
        community_number_approval: {
            type: Boolean,
            default: true
        },
        sms_app_number: {
            type: PhoneSchema,
            default: {},
            required: false
        },
        address: {
            type: AddressSchema,
            required: false
        },
        currency: {
            type: String,
            required: false
        },
        currency_restriction: {
            type: Boolean,
            default: false
        },
        payment_category: {
            type: String,
            enum: ["ForProfit", "NonProfit", "Informal"]
        },
        non_profit: {
            type: Boolean,
            default: null
        },
        non_profit_tax_id: {
            type: String,
            default: null
        },
        members: [
            {
                type: MemberSchema,
                required: false
            }
        ],
        is_active: {
            type: Boolean,
            default: false
        },
        is_featured: {
            type: Boolean,
            default: false
        },
        is_sangaraahi: {
            type: Boolean,
            default: false
        },
        sms_email_global_settings: {
            type: SmsEmailSchema,
            default: {}, // Initialize to an empty object
            required: false
        },
        code: {
            type: String,
            required: false
        },
        is_deleted: {
            type: Boolean,
            default: false
        },
        expired_at: {
            type: Date,
            default: null
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
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}communities`, CommunitySchema);
}