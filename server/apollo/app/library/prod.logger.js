const { createLogger, transports, format } = require('winston');
const { timestamp, combine, printf, colorize, errors } = format;

const path = require('path');

function buildProdLogger() {
    const customFormat = printf(({ level, message, timestamp, stack }) => {
        // console.log(level, message, timestamp, stack);
        return `${timestamp} : [${level}]: ${stack || message}`;
    });
    
    return createLogger({
        format: combine(
            timestamp({ format: 'MMMM Do YYYY, h:mm:ss' }),
            errors({ stack: true }),
            customFormat
        ),
        transports: [
            new transports.Console(),
            new transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
            new transports.File({ filename: path.join(__dirname, '../logs/access.log'), level: 'info' }),
        ]
    });
}


module.exports = buildProdLogger;
