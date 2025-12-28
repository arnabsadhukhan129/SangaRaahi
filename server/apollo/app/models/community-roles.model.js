module.exports = function (mongoose) {
    const Schema = mongoose.Schema;


    const CommunityRoleSchema = new Schema({
        community_id: {
            type: Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}communities`,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        slug: {
            type: String,
            required: true
        },
        access_level: {
            type: String,
            required: false
        },
        type: {
            type: String,
            required: false
        },
        is_deleted:{
            type: Boolean,
            default: false
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
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}community_roles`, CommunityRoleSchema);
}