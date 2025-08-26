import winston from "winston";
// Create a logger with different levels and formats
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }), winston.format.errors({ stack: true }), winston.format.json(), winston.format.colorize({ all: process.env.NODE_ENV === 'development' })),
    defaultMeta: {
        service: 'algofinny-api',
        version: process.env.npm_package_version || '1.0.0'
    },
    transports: [
        // Console transport for development
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple(), winston.format.printf(({ level, message, timestamp, ...meta }) => {
                let output = `${timestamp} [${level}]: ${message}`;
                // Add metadata if present
                const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
                if (metaStr) {
                    output += `\n${metaStr}`;
                }
                return output;
            }))
        })
    ],
    // Don't exit on handled exceptions
    exitOnError: false
});
// Add file transports in production
if (process.env.NODE_ENV === 'production') {
    // Error log file
    logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
    }));
    // Combined log file
    logger.add(new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10
    }));
}
// Handle uncaught exceptions and rejections
logger.exceptions.handle(new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple())
}));
logger.rejections.handle(new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple())
}));
// Add helper methods for structured logging
export const log = {
    error: (message, meta) => {
        logger.error(message, meta);
    },
    warn: (message, meta) => {
        logger.warn(message, meta);
    },
    info: (message, meta) => {
        logger.info(message, meta);
    },
    debug: (message, meta) => {
        logger.debug(message, meta);
    },
    // Specific logging methods for common operations
    userAction: (action, userId, meta) => {
        logger.info(`User action: ${action}`, { userId, ...meta });
    },
    apiRequest: (method, path, userId, meta) => {
        logger.info(`API ${method} ${path}`, { userId, ...meta });
    },
    dbOperation: (operation, collection, meta) => {
        logger.debug(`DB ${operation} on ${collection}`, meta);
    },
    aiRequest: (model, userId, meta) => {
        logger.info(`AI request to ${model}`, { userId, ...meta });
    },
    bankStatement: (action, userId, meta) => {
        logger.info(`Bank statement ${action}`, { userId, ...meta });
    }
};
export default logger;
//# sourceMappingURL=logger.js.map