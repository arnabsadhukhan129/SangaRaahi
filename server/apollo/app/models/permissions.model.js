module.exports = function(mongoose) {
    const Schema = mongoose.Schema;

    
    const PermissionSchema = new Schema({
        resource_id:{
            type: Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}resources`
        },
        role_id:{
            type:Schema.Types.ObjectId,
            ref:`${Lib.ENV('DB_PREFIX')}roles`
        },
        permissions:[{
            type:String
        }]
    });
    return mongoose.model(`${Lib.ENV('DB_PREFIX')}permissions`, PermissionSchema);
}