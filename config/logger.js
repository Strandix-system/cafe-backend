import winston from 'winston';
import { MongoDB } from 'winston-mongodb';
import dotenv from 'dotenv';
dotenv.config();

// Custom error format to include stack trace in logs
const enumerateErrorFormat = winston.format((info) => {
    if (info instanceof Error) {
        Object.assign(info, { message: info.stack });
    }
    return info;
});

// Define the logger
const logger = winston.createLogger({
    level: 'info', // Default log level
    format: winston.format.combine(
        enumerateErrorFormat(),          // Include error stack trace
        winston.format.colorize(),       // Colorize log output
        winston.format.splat(),          // String interpolation for logs
        winston.format.printf(({ level, message }) => `${level}: ${message}`) // Log format
    ),
    transports: [
        new winston.transports.Console({
            stderrLevels: ['error'], // Log errors to stderr
        }),
        new MongoDB({
            db: process.env.DB_URL,
            collection: 'appinfologs',
            level: 'info',
            storeHost: true,
        }),
        new MongoDB({
            db: process.env.DB_URL,
            collection: 'apperrorlogs',
            level: 'error',
            storeHost: true,
        })
    ],
});

export {
    logger
};
