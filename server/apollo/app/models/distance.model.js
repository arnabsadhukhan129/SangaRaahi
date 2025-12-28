module.exports = function(mongoose) {
    const Schema = mongoose.Schema;
    const DistanceSchema = new Schema({
        distance:{
            type: Number,
            required: true
        },
        is_deleted:{
            type: Boolean,
            default: false
        },
        created_at: {
            type: Date,
            default: new Date
        },
        updated_at: {
            type: Date,
            default: new Date
        }
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}distances`, DistanceSchema);
}