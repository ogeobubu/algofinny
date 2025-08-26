// server/src/index.ts
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./routes/index.js";
import logger from "./utils/logger.js";
// Load environment variables
dotenv.config();
// ES modules dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;
// ===== MIDDLEWARE =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Trust proxy for proper IP forwarding
app.set('trust proxy', true);
// Request ID middleware for better logging
app.use((req, res, next) => {
    ;
    req.requestId = Math.random().toString(36).substr(2, 9);
    res.setHeader('X-Request-ID', req.requestId);
    next();
});
// ===== ROUTES =====
app.use('/api', routes);
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, '../../client/build');
    app.use(express.static(buildPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(buildPath, 'index.html'));
    });
}
// ===== DATABASE CONNECTION =====
async function connectToDatabase() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/algofinny';
        await mongoose.connect(mongoUri);
        logger.info('Connected to MongoDB', { uri: mongoUri });
        // Handle connection events
        mongoose.connection.on('error', (error) => {
            logger.error('MongoDB connection error:', error);
        });
        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });
        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });
    }
    catch (error) {
        logger.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}
// ===== GRACEFUL SHUTDOWN =====
async function gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    // Close server
    server.close(() => {
        logger.info('HTTP server closed');
    });
    // Close database connection
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
    }
    catch (error) {
        logger.error('Error closing MongoDB connection:', error);
    }
    process.exit(0);
}
// ===== START SERVER =====
async function startServer() {
    try {
        // Connect to database first
        await connectToDatabase();
        // Start HTTP server
        const server = app.listen(PORT, () => {
            logger.info('Server started successfully', {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                nodeVersion: process.version,
                timestamp: new Date().toISOString()
            });
        });
        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Port ${PORT} is already in use`);
                process.exit(1);
            }
            else {
                logger.error('Server error:', error);
            }
        });
        // Graceful shutdown handlers
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        return server;
    }
    catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// ===== ENVIRONMENT VALIDATION =====
function validateEnvironment() {
    const required = ['MONGODB_URI', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        logger.error('Missing required environment variables:', { missing });
        process.exit(1);
    }
    // Warn about optional but recommended variables
    const recommended = ['OPENAI_API_KEY', 'DEEPSEEK_API_KEY'];
    const missingRecommended = recommended.filter(key => !process.env[key]);
    if (missingRecommended.length > 0) {
        logger.warn('Missing recommended environment variables (AI features may be limited):', {
            missing: missingRecommended
        });
    }
}
// ===== INITIALIZE APP =====
async function initialize() {
    try {
        logger.info('Initializing AlgoFinny API Server...');
        // Validate environment
        validateEnvironment();
        // Start server
        const server = await startServer();
        // Global error handlers
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at Promise:', { reason, promise });
        });
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            process.exit(1);
        });
        logger.info('AlgoFinny API Server initialized successfully');
        return server;
    }
    catch (error) {
        logger.error('Failed to initialize server:', error);
        process.exit(1);
    }
}
// Start the server
let server;
initialize().then((s) => {
    server = s;
});
export default app;
//# sourceMappingURL=index.js.map