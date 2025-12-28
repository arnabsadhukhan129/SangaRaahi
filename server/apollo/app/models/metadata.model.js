module.exports = function(mongoose) {
    const Schema = mongoose.Schema;

    const ValueSchema = new Schema({
        language:{
            type:String,
            enum:["en", "bn", "hi"],
            default:"en"
        },
        values:[
            {
                type:String
            }
        ]
    },{ _id : false });


    const PurposeSchema = new Schema({
        type:{
            type:String,
        },
        values:[
            {
                type:ValueSchema,
                required:true
            }
        ]
    },{ _id : false });

    
    const MetaDataSchema = new Schema({
        type:{
            type:String,
        },
        purpose:[
            {
                type:PurposeSchema,
                required: true
            }
        ]
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}metadata`, MetaDataSchema);
}