const Distance = Lib.Model('Distance');
const mongoose = require('mongoose');
const {ObjectId} = mongoose.Types;

module.exports = {
    addOrUpdateDistance: async(data, userId) => {
        try {
           // Find the existing distance record
           let distanceRecord = await Distance.findOne();

           if (distanceRecord) {
               // If a record exists, update the distance field
               distanceRecord.distance = data.distance;
               const updatedDistance = await distanceRecord.save();
               return {
                   error: false,
                   code: 200,
                   systemCode: 'DISTANCE_UPDATED_SUCCESSFULLY',
                   message: 'Record updated successfully',
                   data: updatedDistance
               };
            }else {
                const distance = new Distance({
                    distance: data.distance
                })
                const savedDistance = await distance.save();
                return {
                    error: false,
                    code: 200,
                    systemCode: 'DISTANCE_CREATED_SUCCESSFULLY',
                    message: 'generalSuccess',
                    data: savedDistance
                }
            }
        } catch (error) {
            return {
                error: true,
                code: 500,
                systemCode: 'ERROR_CREATING_DISTANCE',
                message: error.message,
                data: null
            }
        }
    },
}