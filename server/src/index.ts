import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import winston from "winston"
import { signup, login } from "./controllers/auth.js"
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from "./controllers/transactions.js"
import { getAdvice } from "./controllers/ai.js"
import { handleBankStatementUpload } from "./controllers/bankStatement.js"

dotenv.config()

const app = express()
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001", 
    process.env.CLIENT_URL || "http://localhost:3000"
  ],
  credentials: true
}))
app.use(express.json())

// Winston logger for all requests
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
})

app.use((req, _res, next) => {
  logger.info("Request", { method: req.method, url: req.url, body: req.body })
  next()
})

app.get("/health", (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }))

// Bank statement upload endpoint
app.post("/api/bank/upload", handleBankStatementUpload)

// Auth routes
app.post("/api/auth/signup", signup)
app.post("/api/auth/login", login)

// Transaction routes
app.get("/api/transactions", listTransactions)
app.post("/api/transactions", createTransaction)
app.put("/api/transactions/:id", updateTransaction)
app.delete("/api/transactions/:id", deleteTransaction)

// AI advice route
app.get("/api/ai/advice", getAdvice)

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/algofinny"
const PORT = Number(process.env.PORT || 4000)

async function start() {
  try {
    logger.info("Connecting to MongoDB...", { uri: MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@") })
    await mongoose.connect(MONGO_URI)
    logger.info("✅ Connected to MongoDB successfully")
    
    // Test the connection
    // const db = mongoose.connection.db
    // const adminDb = db.admin()
    // const result = await adminDb.listCollections().toArray()
    // logger.info("📊 Database collections", { collections: result.map(c => c.name) })
    
    app.listen(PORT, () => {
      logger.info(`🚀 AlgoFinny API ready on http://localhost:${PORT}`)
      logger.info(`📱 Health check: http://localhost:${PORT}/health`)
    })
  } catch (err) {
    logger.error("❌ Failed to start server", { error: err })
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('🔄 Shutting down gracefully...')
  await mongoose.connection.close()
  logger.info('✅ MongoDB connection closed')
  process.exit(0)
})

start()