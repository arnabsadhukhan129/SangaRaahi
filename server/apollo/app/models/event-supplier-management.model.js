module.exports = function (mongoose) {
    const Schema = mongoose.Schema;
    const AssignMemberSchema = new Schema({
        user_id: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: `${Lib.ENV('DB_PREFIX')}users`
        },
        type: {
            type: String,
            enum: ["adult", "teenager", "children"]
        },
        invited_by: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            enum: ["Accepted", "Rejected", "added by Admin"]
        },
        user_quantity: {
            type: Number,
            default: 0
        },
        portal: {
            type: String,
            defult: null
        },
        accepted_date: {
            type: Date,
            default: null
        },
        accepted_time: {
            type: String,
            default: null
        },
        is_active: {
            type: Boolean,
            default: true
        },
        is_deleted: {
            type: Boolean,
            default: false
        },
    });
    const TeamSizeSchema = new Schema({
        adult: {
            type: Number,
            default: 0
        },
        teenager: {
            type: Number,
            default: 0
        },
        children: {
            type: Number,
            default: 0
        },
    });
    const DateSchema = new Schema({
        from: {
            type: String,
            default: "00:00"
        },
        to: {
            type: String,
            default: "00:00"
        },
        timezone: {
            type: String,
            default: null
        }
    }, { _id: false });
    const EventSupplierManagementSchema = new Schema({
        community_id: {
            type: Schema.Types.ObjectId,
            ref: `${Lib.ENV('DB_PREFIX')}communities`,
            default: null
        },
        event_id: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: `${Lib.ENV('DB_PREFIX')}events`
        },
        supply_item: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        already_taken: {
            type: Number,
            default: 0,
        },
        supply_item_description: {
            type: String,
            return: false
        },
        needed_for: {
            type: String,
            required: true
        },
        required_date: {
            type: Date,
            default: Date.now
        },
        time: {
            type: DateSchema,
            required: true
        },
        assigned_members: [
            {
                type: AssignMemberSchema,
                require: true,
            }
        ],
        volunteered: {
            type: Number,
            default: 0
        },
        team_size: {
            type: TeamSizeSchema,
            require: false,
        },
        is_done: {
            type: Boolean,
            default: false
        },
        is_cancelled: {
            type: Boolean,
            default: false
        },
        is_deleted: {
            type: Boolean,
            default: false
        },
        created_at: {
            type: Date,
            default: () => new Date()
        },
        updated_at: {
            type: Date,
            default: null
        }
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}event_supplier_management`, EventSupplierManagementSchema);
}