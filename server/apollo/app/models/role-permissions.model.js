module.exports = function (mongoose) {
    const Schema = mongoose.Schema;

    const RolePermissionSchema = new Schema({
        community_id: {
            type: Schema.Types.ObjectId,
            ref: `${Lib.ENV('DB_PREFIX')}communities`,
            default: null
        },
        role: {
            type: String,
            required: true
        },
        role_permission: {
            can_create: { type: Boolean, default: true },
            can_edit: { type: Boolean, default: true },
            can_view: { type: Boolean, default: true },
            can_delete: { type: Boolean, default: true }
        },
        community_management: {
            global_settings: { type: Boolean, default: true },
            manage_webPage: { type: Boolean, default: true},
            phone_number_verification: { type: Boolean, default: true},
            can_profile_edit: { type: Boolean, default: true}
        },
        member: {
            can_onboard: { type: Boolean, default: true },
            can_edit: { type: Boolean, default: true },
            can_view: { type: Boolean, default: true },
            can_delete: { type: Boolean, default: true },
            can_promote_demote: { type: Boolean, default: true },
        },
        group: {
            can_create: { type: Boolean, default: true },
            can_edit: { type: Boolean, default: true },
            can_view: { type: Boolean, default: true },
            can_delete: { type: Boolean, default: true },
        },
        mail: {
            can_delete: { type: Boolean, default: true },
            can_status_change: { type: Boolean, default: true },
            can_send: { type: Boolean, default: true },
            can_edit: { type: Boolean, default: true }
        },
        webSite: {
            can_edit_homepage: { type: Boolean, default: true },
            can_edit_announcement: { type: Boolean, default: true },
            can_edit_videos: { type: Boolean, default: true },
            can_edit_payments: { type: Boolean, default: true },
            can_edit_aboutus: { type: Boolean, default: true },
        },
        event: {
            can_create: { type: Boolean, default: true },
            can_edit: { type: Boolean, default: true },
            can_view: { type: Boolean, default: true },
            can_delete: { type: Boolean, default: true },
            can_frequency: { type: Boolean, default: true },
        },
        blog: {
            can_create: { type: Boolean, default: true },
            can_edit: { type: Boolean, default: true },
            can_view: { type: Boolean, default: true },
            can_delete: { type: Boolean, default: true }
        },
        checkin: {
            can_view: { type: Boolean, default: true },
            can_check: { type: Boolean, default: true },
        },
        announcement: {
            can_create: { type: Boolean, default: true },
            can_edit: { type: Boolean, default: true },
            can_view: { type: Boolean, default: true },
            can_delete: { type: Boolean, default: true }
        },
        email_response: {
            can_view: { type: Boolean, default: true },
            can_reply: { type: Boolean, default: true },
        },
        activity_log: {
            can_view_app: { type: Boolean, default: true },
            can_view_web: { type: Boolean, default: true },
        },
        created_at: {
            type: Date,
            default: new Date()
        },
        update_at: {
            type: Date,
            default: null
        }
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}role_permissions`, RolePermissionSchema);
}
