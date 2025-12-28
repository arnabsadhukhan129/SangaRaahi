module.exports = function(mongoose) {
    const Schema = mongoose.Schema;

    
    const RoleSchema = new Schema({
       name:{
        type:String,
        required:true
       },
       slug:{
        type:String,
        required:true
       },
       access_level:{
        type:String,
        required:false
       },
       type:{
        type:String,
        required:false
       }
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}roles`, RoleSchema);
}