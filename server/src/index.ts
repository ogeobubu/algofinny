import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import winston from "winston"
import { signup, login } from "./controllers/auth.js"
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from "./controllers/transactions.js"
import { getAdvice } from "./controllers/ai.js"
import { handleBankStatementUpload } from "./controllers/bankStatement.js"
import { connectDatabase } from "./config/database.js"

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
  logger.info("Request", { method: req.method, url: req.url })
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

const PORT = Number(process.env.PORT || 4000)

async function start() {
  try {
    // Connect to database
    await connectDatabase()
    
    app.listen(PORT, () => {
      logger.info(`🚀 AlgoFinny API ready on http://localhost:${PORT}`)
      logger.info(`📱 Health check: http://localhost:${PORT}/health`)
    })
  } catch (err: any) {
    logger.error("❌ Failed to start server", { error: err.message })
    
    // For development, you might want to continue without MongoDB
    if (process.env.NODE_ENV === 'development') {
      logger.warn("🔄 Starting server without database connection...")
      app.listen(PORT, () => {
        logger.info(`🚀 AlgoFinny API ready on http://localhost:${PORT} (NO DATABASE)`)
        logger.info(`📱 Health check: http://localhost:${PORT}/health`)
      })
    } else {
      process.exit(1)
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('🔄 Shutting down gracefully...')
  const mongoose = await import('mongoose')
  await mongoose.connection.close()
  logger.info('✅ MongoDB connection closed')
  process.exit(0)
})

start()