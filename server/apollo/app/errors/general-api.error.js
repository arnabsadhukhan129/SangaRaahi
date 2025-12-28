const BaseError = require('./base.error');
const httpErrorCode = require('./httperrorcode');

class GeneralApiError extends BaseError {
    constructor(
        description,
        statusCode=httpErrorCode.BAD_REQUEST,
        stack=null,
        name="GeneralAPIError",
        isOperational=true
    ) {
        statusCode= statusCode || httpErrorCode.BAD_REQUEST;
        super(name, statusCode, isOperational, description, stack);
    }
}

module.exports = GeneralApiError;