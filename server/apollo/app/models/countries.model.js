module.exports = function(mongoose) {
    const Schema = mongoose.Schema;


    const CountrySchema = new Schema({
        country:{
            type:String
        },
        code:{
            type:String
        },
        phone_code:{
            type:String
        },
        states:[
            {
                type:String
            }
        ]
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}countries`, CountrySchema);
}