module.exports = function (mongoose) {
    const Schema = mongoose.Schema;

    const EventImageSchema = new Schema({
        image_name: {
            type: String
        },
        url: {
            type: String
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: `${Lib.ENV('DB_PREFIX')}users`,
            required: false
        },
        uploaded_at: {
            type: Date,
            default: new Date()
        },
        is_deleted: {
            type: Boolean,
            default: false
        },
        is_active: {
            type: Boolean,
            default: true
        }
    });

    const VenueSchema = new Schema({
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
        },
        phone_no: {
            type: String
        },
        phone_code: {
            type: String
        },
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
        },
    });

    const AttendeesSchema = new Schema({
        is_restricted: {
            type: Boolean,
            default: false
        },
        webvistor_restriction: {
            type: Boolean,
            default: false
        },
        number_of_max_attendees: {
            type: Number,
            default: 0
        },
        remaining_number_of_attendees: {
            type: Number,
            default: 0
        },
        number_of_max_web_visitors: {
            type: Number,
            default: 0
        },
        remaining_number_of_web_visitors: {
            type: Number,
            default: 0
        },
        additional_guests: {
            type: Boolean,
            default: false
        },
        number_of_max_guests: {
            type: Number,
            default: 0
        },
        attendees_list_visibility: {
            type: String,
            enum: ["Host", "Public"],
            default: "Host"
        },
        media_upload_by_attendees: {
            type: Boolean,
            default: false
        },
        // event_images:[
        //     {
        //         type:EventImageSchema,
        //         required: false
        //     }
        // ],
        is_active: {
            type: Boolean,
            required: true
        },
        is_deleted: {
            type: Boolean,
            required: false
        },
        created_at: {
            type: Date,
            default: new Date()
        },
        updated_at: {
            type: Date,
            default: null
        },
    }, { _id: false });


    const FamilyMemberSchema = new Schema({
        user_id: {
            type: Schema.Types.ObjectId,
            ref: `${Lib.ENV('DB_PREFIX')}users`,
            default: null
        },
        name: {
            type: String
        },
        relation: {
            type: String
        },
    }, { _id: false });

    const DateSchema = new Schema({
        from: {
            type: Date,
            default: new Date()
        },
        to: {
            type: Date,
            default: new Date()
        },
        timezone: {
            type: String,
            default: null
        }
    }, { _id: false });

    const GuestSchema = new Schema({
        seniors: {
            type: Number,
            required: false,
            default: 0
        },
        adults: {
            type: Number,
            required: false,
            default: 0
        },
        minor: {
            type: Number,
            required: false,
            default: 0
        },
        total: {
            type: Number,
            required: false,
            default: 0
        },
        family_members: [
            {
                type: FamilyMemberSchema,
                required: false
            }
        ]
    }, { _id: false });


    const RsvpSchema = new Schema({
        user_id: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: `${Lib.ENV('DB_PREFIX')}users`
        },
        name: {
            type: String,
            default: null,
            required: false,
        },
        email: {
            type: String,
            default: null,
            required: false,
        },
        phone_code: {
            type: String
        },
        phone: {
            type: String,
            default: null,
            required: false,
        },
        type: {
            type: String,
            enum: ["web_vistor", "user"],
            default: "user"
        },
        status: {
            type: String,
            enum: ["No_Reply", "Attending", "Not_Attending", "Maybe"],
            default: "No_Reply"
        },
        is_new: {
            type: Boolean,
            default: true
        },
        guests: {
            type: GuestSchema,
            required: false
        },
        invited_by: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: `${Lib.ENV('DB_PREFIX')}users`
        },
        created_at: {
            type: Date,
            default: new Date()
        },
        updated_at: {
            type: Date,
            default: null
        },
    });

    const PaymentPackageSchema = new Schema({
        currency: {
            type: String,
            required: false
        },
        package_name: {
            type: String,
            required: false
        },
        package_rate: {
            type: Number,
            required: false
        },
        package_logo: {
            type: String,
            required: false
        },
        early_bird_date: {
            type: Date,
            default: null,
            required: false
        },
        early_bird_rate: {
            type: Number,
            required: false
        },
        description: {
            type: String,
            required: false
        },
        is_active: {
            type: Boolean,
            default: true
        }
    });

    const GroupsSchema = new Schema({
        group_id: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: `${Lib.ENV('DB_PREFIX')}groups`
        },
        is_deleted: {
            type: Boolean,
            default: false
        },
    });

    const RecurringSchema = new Schema({
        event_id: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: `${Lib.ENV('DB_PREFIX')}events`
        },
        recurreing_type: {
            type: String,
            enum: ["weekly", "monthly"]
        },
        start_time: {
            type: String,
            default: null
        },
        end_time: {
            type: String,
            default: null
        },
        occuration_number: {
            type: Number,
            default: 0
        },
        weekly_day_index: [{
            type: String
        }],
        monthly_date: [{
            type: String
        }]
    });

    const rsvpAdminControllSchema = new Schema({
        rsvp_type: {
            type: String,
            enum: [
                "Yesrsvp",
                "Norsvp",
                "Not_Attending",
                "tentative",
                "All"
            ]
        },
        email_content: {
            type: String,
        },
        sms_content: {
            type: String,
        },
        deep_link: {
            type: String,
            default: null,
        },
        is_deleted: {
            type: Boolean,
            default: false
        },
    });
    const EventSchema = new Schema({
        host_id: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: `${Lib.ENV('DB_PREFIX')}users`
        },
        community_id: {
            type: Schema.Types.ObjectId,
            ref: `${Lib.ENV('DB_PREFIX')}communities`,
            default: null
        },
        group_id: {
            type: Schema.Types.ObjectId,
            ref: `${Lib.ENV('DB_PREFIX')}groups`,
            default: null
        },
        category: {
            type: String,
            enum: ["Community", "Group", "Private"],
            default: "Community"
        },
        post_event_as_community: {
            type: Boolean,
            required: true
        },
        payment_status: {
            type: String,
            enum: ["Paid", "Free"]
        },
        payment_category: {
            type: String,
            enum: ["per_head", "package_wise"],
            required: false
        },
        payment_packages: [
            {
                type: PaymentPackageSchema,
                required: false
            }
        ],
        recurring_event: {
            type: Boolean,
            default: false
        },
        main_recurring_event: {
            type: Boolean,
            default: false
        },
        recurring_details: {
            type: RecurringSchema,
            required: false
        },
        type: {
            type: String,
            enum: [
                "Religious",
                "Educational",
                "Cultural",
                "Social",
                "Health",
                "Other"
            ],
            default: "Other"
        },
        title: {
            type: String
        },
        description: {
            type: String
        },
        image: {
            type: String
        },
        logo_image: {
            type: String
        },
        venue_details: {
            type: VenueSchema,
            required: true
        },
        date: {
            type: DateSchema,
            required: true
        },
        time: {
            type: DateSchema,
            required: true
        },
        invitation_type: {
            type: String,
            enum: ["Public", "Members", "Private"],
            default: "Public"
        },
        rsvp_end_time: {
            type: Date,
            required: false,
            default: null
        },
        rsvp: [
            {
                type: RsvpSchema,
                required: false
            }
        ],
        groups: [
            {
                type: GroupsSchema,
                required: false
            }
        ],
        members: [
            {
                user_id: {
                    type: Schema.Types.ObjectId,
                    required: false,
                    ref: `${Lib.ENV('DB_PREFIX')}users`
                },
            }
        ],
        event_host: [
            {
                user_id: {
                    type: Schema.Types.ObjectId,
                    required: false,
                    ref: `${Lib.ENV('DB_PREFIX')}users`
                },
            }
        ],
        attendees: {
            type: AttendeesSchema,
            required: false
        },

        is_active: {
            type: Boolean,
            default: true
        },
        is_cancelled: {
            type: Boolean,
            default: false
        },
        is_deleted: {
            type: Boolean,
            default: false
        },
        updated_by: {
            type: Schema.Types.ObjectId,
            ref: `${Lib.ENV('DB_PREFIX')}users`
        },
        // rsvp_admin_controll: {
        //         type:String,
        //         enum: ["Yesrsvp", "Norsvp", "All"],
        //         default:"Yesrsvp"
        // },
        rsvp_admin_controll: [
            {
                type: rsvpAdminControllSchema,
                required: false,
                default: {}
            }
        ],
        remain: {
            type: Boolean,
            default: false
        },
        created_at: {
            type: Date,
            default: function () {
                return new Date();
            }
        },
        updated_at: {
            type: Date,
            default: null
        },

    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}events`, EventSchema);
}