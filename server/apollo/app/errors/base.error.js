class BaseError extends Error {
    constructor(name, errorStatus, isOperational, description, stack) {
        super(description);

        Object.setPrototypeOf(this, new.target.prototype);
        this.name = name;
        this.statusCode = errorStatus.statusCode;
        this.code = errorStatus.code;
        this.isOperational = isOperational;
        if(Lib.isDevEnv() || Lib.isStagingEnv()) {
            Error.captureStackTrace(stack || this);
        } else {
            // Production
            /**
             * For production do not send any stack trace
             */
            Error.captureStackTrace({});
        }
    }
}

module.exports = BaseError;