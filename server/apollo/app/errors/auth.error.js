const BaseError = require('./base.error');
const httpErrorCode = require('./httperrorcode');

class AuthError extends BaseError {
    constructor(
        description,
        statusCode=httpErrorCode.AUTH_ERROR,
        stack=null,
        name="AuthenticationError",
        isOperational=true
    ) {
        statusCode = statusCode || httpErrorCode.AUTH_ERROR;
        super(name, statusCode, isOperational, description, stack);
    }
}

module.exports = AuthError;