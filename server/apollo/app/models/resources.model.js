module.exports = function(mongoose) {
    const Schema = mongoose.Schema;

    
    const ResourceSchema = new Schema({
        name:{
            type: String,
        },
        status:{
            type:Boolean,
            default:true
        }
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}resources`, ResourceSchema);
}