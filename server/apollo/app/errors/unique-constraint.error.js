const BaseError = require('./base.error');
const httpErrorCode = require('./httperrorcode');

class UniqueConstraintError extends BaseError {
    constructor(
        description,
        statusCode=httpErrorCode.CONFLICT_ERROR,
        stack=null,
        name="UniqueConstraintViolationError",
        isOperational=true
        ) {
        statusCode= statusCode || httpErrorCode.CONFLICT_ERROR;
            super(name, statusCode, isOperational, description, stack);
    }
}

module.exports = UniqueConstraintError;