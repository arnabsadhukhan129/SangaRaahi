module.exports = function(mongoose) {
    const Schema = mongoose.Schema;

    
    const SettingSchema = new Schema({
       key:{
        type:String,
        required:true
       },
       value:{
        type:String,
        required:true
       },
       comment:{
        type:String,
        required:true
       },
       label:{
        type:String,
        required:true
       },
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}settings`, SettingSchema);
}