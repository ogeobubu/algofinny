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
app.use(cors())
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


app.get("/health", (_req, res) => res.json({ ok: true }))

// Bank statement upload endpoint
app.post("/api/bank/upload", handleBankStatementUpload)

app.post("/api/auth/signup", signup)
app.post("/api/auth/login", login)

app.get("/api/transactions", listTransactions)
app.post("/api/transactions", createTransaction)
app.put("/api/transactions/:id", updateTransaction)
app.delete("/api/transactions/:id", deleteTransaction)

const MONGO_URI = process.env.MONGO_URI
const PORT = Number(process.env.PORT || 4000)

async function start() {
  try {
    await mongoose.connect(MONGO_URI)
    app.listen(PORT, () => logger.info(`API ready on http://localhost:${PORT}`))
  } catch (err) {
    logger.error("Failed to start server", { error: err })
    process.exit(1)
  }
}

start()
