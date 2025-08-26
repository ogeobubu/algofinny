import winston from "winston";
declare const logger: winston.Logger;
export declare const log: {
    error: (message: string, meta?: object) => void;
    warn: (message: string, meta?: object) => void;
    info: (message: string, meta?: object) => void;
    debug: (message: string, meta?: object) => void;
    userAction: (action: string, userId: string, meta?: object) => void;
    apiRequest: (method: string, path: string, userId?: string, meta?: object) => void;
    dbOperation: (operation: string, collection: string, meta?: object) => void;
    aiRequest: (model: string, userId: string, meta?: object) => void;
    bankStatement: (action: string, userId: string, meta?: object) => void;
};
export default logger;
