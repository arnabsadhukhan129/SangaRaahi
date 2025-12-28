const BaseError = require('./base.error');
const httpErrorCode = require('./httperrorcode');

class ValidationError extends BaseError {
    constructor(
        description,
        statusCode=httpErrorCode.MALFORMED_ERROR,
        stack=null,
        name="ValidationError",
        isOperational=true
        ) {
        statusCode= statusCode || httpErrorCode.MALFORMED_ERROR;
            super(name, statusCode, isOperational, description, stack);
    }
}

module.exports = ValidationError;