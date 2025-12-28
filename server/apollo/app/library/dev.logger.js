const {
    createLogger,
    transports,
    format
} = require('winston');
const {
    timestamp,
    combine,
    errors,
    json
} = format;

const path = require('path');

function buildDevLogger() {
    return createLogger({
        format: combine(
            timestamp(),
            errors({
                stack: true
            }),
            json()
        ),
        defaultMeta: {
            service: 'user-service'
        },
        transports: [
            new transports.Console(),
            new transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
            new transports.File({ filename: path.join(__dirname, '../logs/access.log'), level: 'info' }),
        ]
    });
}


module.exports = buildDevLogger;