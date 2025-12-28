const BaseError = require('./base.error');
const httpErrorCode = require('./httperrorcode');

class FatalError extends BaseError {
    constructor(
        description,
        statusCode=httpErrorCode.SERVER_ERROR,
        stack=null,
        name="FatalError",
        isOperational=true
        ) {
        statusCode= statusCode || httpErrorCode.SERVER_ERROR;
            super(name, statusCode, isOperational, description, stack);
    }
}

module.exports = FatalError;