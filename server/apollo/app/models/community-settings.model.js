module.exports = function (mongoose) {
    const Schema = mongoose.Schema;
    const CommunitySettingsSchema = new Schema({
        community_id: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: `${Lib.ENV('DB_PREFIX')}communities`
        },
        webpage_approval_status: {
            type: String,
            enum: ["not_approved", "active", "inactive"],
            default: "inactive"
        },
        publicity_page: {
            type: Boolean,
            default: true
        },
        freeze_pane: {
            type: Boolean,
            default: false
        },
        home_page: {
            type: Boolean,
            default: true
        },
        event_payment_settings: {
            type: Boolean,
            default: true
        },
        announcement_page: {
            type: Boolean,
            default: false
        },
        video_page: {
            type: Boolean,
            default: false
        },
        payment_page: {
            type: Boolean,
            default: false
        },
        about_page: {
            type: Boolean,
            default: false
        },
        lebel: {
            type: String,
            required: false
        },
        slug: {
            type: String,
            required: false
        },
        watermark: {
            type: String,
            required: false
        },
        header_font: {
            type: String,
            required: false
        },
        header_font_size: {
            type: Number,
            required: false
        },
        body_font: {
            type: String,
            required: false
        },
        body_font_size: {
            type: Number,
            required: false
        },
        text_color: {
            type: String,
            required: false
        },
        backgroup_color: {
            type: String,
            required: false
        },
        announcement_settings: {
            show_public_announcement: {
                type: Boolean,
                default: true
            },
            show_member_announcement: {
                type: Boolean,
                default: true
            },
            show_public_events: {
                type: Boolean,
                default: true
            },
            show_past_events: {
                type: Boolean,
                default: true
            },
            show_members_only_events: {
                type: Boolean,
                default: true
            },
            required: false
        },
        about_us_settings: {
            show_organization_description: {
                type: Boolean,
                default: true
            },
            show_organization_address: {
                type: Boolean,
                default: true
            },
            show_board_members: {
                type: Boolean,
                default: true
            },
            show_executive_members: {
                type: Boolean,
                default: true
            },
            show_contact_email_publicly: {
                type: Boolean,
                default: true
            },
            show_contact_phone_publicly: {
                type: Boolean,
                default: true
            },
            board_members_label_name: {
                type: String,
                default: 'Board Member'
            },
            executive_members_label_name: {
                type: String,
                default: 'Executive Member'
            },
            required: false
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
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}community_settings`, CommunitySettingsSchema);
}