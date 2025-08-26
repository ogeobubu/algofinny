import mongoose from "mongoose";
import winston from "winston";
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.Console(),
    ],
});
export async function connectDatabase() {
    const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://ogeobubu:kdVax8gfromh9i33@cluster0.9rgphuk.mongodb.net/algofinny?retryWrites=true&w=majority&appName=Cluster0";
    try {
        logger.info("Attempting to connect to MongoDB...", {
            uri: MONGO_URI
        });
        await mongoose.connect(MONGO_URI);
        logger.info("✅ Connected to MongoDB successfully");
        // Test the connection
        await mongoose.connection.db?.admin().ping();
        logger.info("✅ MongoDB ping successful");
    }
    catch (error) {
        logger.error("❌ MongoDB connection failed", {
            error: error.message,
            stack: error.stack
        });
        // More specific error handling
        if (error.message.includes("IP address")) {
            logger.error("🔒 IP Whitelist Issue: Please add your current IP to MongoDB Atlas whitelist");
            logger.info("📝 To fix this:");
            logger.info("   1. Go to MongoDB Atlas Dashboard");
            logger.info("   2. Navigate to Network Access");
            logger.info("   3. Add your current IP address or use 0.0.0.0/0 for development");
        }
        else if (error.message.includes("authentication")) {
            logger.error("🔑 Authentication Issue: Check your MongoDB credentials");
        }
        else if (error.message.includes("ENOTFOUND") || error.message.includes("timeout")) {
            logger.error("🌐 Network Issue: Check your internet connection and MongoDB URI");
        }
        throw error;
    }
}
//# sourceMappingURL=database.js.map