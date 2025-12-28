const BaseError = require('./base.error');
const httpErrorCode = require('./httperrorcode');

class DatabaseError extends BaseError {
    constructor(
        description,
        statusCode=httpErrorCode.DATABASE_ERROR,
        stack=null,
        name="DatabaseError",
        isOperational=true
        ) {
            statusCode = statusCode || httpErrorCode.DATABASE_ERROR;
            super(name, statusCode, isOperational, description, stack);
    }
}

module.exports = DatabaseError;