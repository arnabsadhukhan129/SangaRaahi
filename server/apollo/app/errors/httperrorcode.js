module.exports = {
    OK:{
        code:200,
        statusCode:"SUCCESS"
    },
    NOT_FOUND: {
        code:404,
        statusCode:"RESOURCE_NOT_FOUND"
    },
    BAD_REQUEST:{
        code:400,
        statusCode:"BAD_REQUEST"
    },
    AUTH_ERROR:{
        code:401,
        statusCode:"AUTHENTICATION_ERROR"
    },
    FORBIDDEN:{
        code:403,
        statusCode:"AUTHORIZATION_ERROR"
    },
    SERVER_ERROR: {
        code:500,
        statusCode:"INTERNAL_SERVER_ERROR"
    },
    MALFORMED_ERROR: {
        code:422,
        statusCode:"MALFORMED_DATA"
    },
    CONFLICT_ERROR: {
        code:409,
        statusCode:"CONFLICT_ERROR"
    },
    DATABASE_ERROR: {
        code: 1001,
        statusCode:"DATABASE_ERROR"
    },
    
};

