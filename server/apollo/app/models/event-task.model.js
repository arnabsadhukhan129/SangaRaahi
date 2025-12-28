module.exports = function (mongoose) {
    const Schema = mongoose.Schema;

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
            enum: ["Accepted", "Rejected"]
        },
        accepted_date: {
            type: Date,
            default: null
        },
        accepted_time: {
            type: String,
            default: null
        },
        is_deleted: {
            type: Boolean,
            default: false
        },
    });
    const DateSchema = new Schema({
        from: {
            type: Date,
            default: Date.now
        },
        to: {
            type: Date,
            default: Date.now
        },
        timezone: {
            type: String,
            default: null
        }
    });

    const EventTaskSchema = new Schema({
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
        task_name: {
            type: String,
            require: true,
        },
        require_team: {
            type: Number,
            default: 0,
        },
        task_description: {
            type: String,
            require: true,
        },
        team_size: {
            type: TeamSizeSchema,
            require: false,
        },
        priority: {
            type: String,
            enum: ["High", "Low", "Medium"]
        },
        task_start_date: {
            type: Date,
            default: Date.now
        },
        task_deadline: {
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
        is_done: {
            type: Boolean,
            default: false,
        },
        is_cancelled:{
            type:Boolean,
            default: false
        },
        is_deleted: {
            type: Boolean,
            default: false
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
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}event_task`, EventTaskSchema);
}