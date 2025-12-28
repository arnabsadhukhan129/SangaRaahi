const BaseError = require('./base.error');
const httpErrorCode = require('./httperrorcode');

class DenialError extends BaseError {
    constructor(
        description,
        statusCode=httpErrorCode.FORBIDDEN,
        stack=null,
        name="PermissionDenied",
        isOperational=true
    ) {
        statusCode = statusCode || httpErrorCode.FORBIDDEN;
        super(name, statusCode, isOperational, description, stack);
    }
}

module.exports = DenialError;