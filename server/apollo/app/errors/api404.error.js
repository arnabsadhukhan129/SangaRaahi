const BaseError = require('./base.error');
const httpErrorCode = require('./httperrorcode');

class Api404Error extends BaseError {
    constructor(
        description,
        statusCode=httpErrorCode.NOT_FOUND,
        stack=null,
        name="ResourceNotFoundError",
        isOperational=true
        ) {
            statusCode= statusCode || httpErrorCode.NOT_FOUND;
            super(name, statusCode, isOperational, description, stack);
    }
}

module.exports = Api404Error;