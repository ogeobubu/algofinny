import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import winston from "winston"
import { signup, login } from "./controllers/auth.js"
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from "./controllers/transactions.js"
import { compareAdvice, getAdvice, getInsights, getAIHealth, getAIModels } from "./controllers/ai.js"
import { handleFileUpload } from "./controllers/bankStatement.js"
import { connectDatabase } from "./config/database.js"
import { authenticateToken } from "./middleware/authMiddleware.js"

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
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
})

app.use((req, _res, next) => {
  logger.info("Request", { method: req.method, url: req.url })
  next()
})

// Routes
app.get("/health", (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }))
app.post("/api/bank/upload", authenticateToken, handleFileUpload)
app.post("/api/auth/signup", signup)
app.post("/api/auth/login", login)
app.get("/api/transactions", authenticateToken, listTransactions)
app.post("/api/transactions", authenticateToken, createTransaction)
app.put("/api/transactions/:id", authenticateToken, updateTransaction)
app.delete("/api/transactions/:id", authenticateToken, deleteTransaction)
app.get("/api/ai/advice", authenticateToken, getAdvice)
app.get("/api/ai/compare", authenticateToken, compareAdvice)
app.get("/api/ai/insights", authenticateToken, getInsights)
app.get("/api/ai/health", authenticateToken, getAIHealth)
app.get("/api/ai/models", authenticateToken, getAIModels)

const PORT = Number(process.env.PORT || 4001)

let server: import("http").Server | null = null

async function start() {
  try {
    await connectDatabase()

    server = app.listen(PORT, () => {
      logger.info(`🚀 AlgoFinny API ready on http://localhost:${PORT}`)
      logger.info(`📱 Health check: http://localhost:${PORT}/health`)
    })
  } catch (err: any) {
    logger.error("❌ Failed to start server", { error: err.message })

    if (process.env.NODE_ENV === 'development') {
      logger.warn("🔄 Starting server without database connection...")
      server = app.listen(PORT, () => {
        logger.info(`🚀 AlgoFinny API ready on http://localhost:${PORT} (NO DATABASE)`)
      })
    } else {
      process.exit(1)
    }
  }
}

async function stop() {
  logger.info('🔄 Stopping server...')

  // Close HTTP server
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server!.close(err => {
        if (err) return reject(err)
        resolve()
      })
    })
    logger.info('✅ HTTP server closed')
  }

  // Close MongoDB connection
  const mongoose = await import('mongoose')
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close()
    logger.info('✅ MongoDB connection closed')
  }
}

process.on('SIGINT', async () => {
  await stop()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await stop()
  process.exit(0)
})

// Handle uncaught exceptions (like the pdf-parse error)
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message })
  // Don't exit in development to allow for fixes
  if (process.env.NODE_ENV === 'production') {
    process.exit(1)
  }
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason: String(reason), promise })
  // Don't exit in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1)
  }
})

export { start, stop }
start()