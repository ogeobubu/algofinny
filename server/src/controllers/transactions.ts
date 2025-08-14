import type { Request, Response } from "express"
import jwt from "jsonwebtoken"
import Transaction from "../models/Transaction.js"
import winston from "winston"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"

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

function getUserId(req: Request): string | null {
  const header = req.headers.authorization
  if (!header) return null
  const [, token] = header.split(" ")
  if (!token) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    return payload.sub as string
  } catch {
    return null
  }
}

export async function listTransactions(req: Request, res: Response) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      logger.warn("Unauthorized transaction list request")
      return res.status(401).json({ error: "Unauthorized" })
    }
    
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const skip = (page - 1) * limit
    
    const items = await Transaction.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip)
    
    logger.info("Transactions fetched", { 
      userId, 
      count: items.length, 
      page, 
      limit 
    })
    
    // Transform to include legacy fields for backward compatibility
    const transformedItems = items.map(item => ({
      id: item._id,
      userId: item.userId,
      date: item.date,
      time: item.time,
      description: item.description,
      type: item.type, // credit/debit
      amount: item.amount,
      balance_after: item.balance_after,
      channel: item.channel,
      transaction_reference: item.transaction_reference,
      counterparty: item.counterparty,
      category: item.category,
      // Legacy compatibility
      legacy_type: item.type === "credit" ? "income" : "expense"
    }))
    
    return res.json(transformedItems)
  } catch (err: any) {
    logger.error("Error fetching transactions", { error: err.message })
    return res.status(500).json({ error: "Internal server error" })
  }
}

export async function createTransaction(req: Request, res: Response) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      logger.warn("Unauthorized transaction creation request")
      return res.status(401).json({ error: "Unauthorized" })
    }
    
    const { 
      amount, 
      description,
      category, 
      type, 
      date,
      time,
      channel,
      transaction_reference,
      counterparty,
      balance_after,
      // Legacy support
      legacy_type
    } = req.body || {}
    
    // Validation
    if (amount == null || !description) {
      return res.status(400).json({ error: "amount and description are required" })
    }
    
    // Determine transaction type
    let transactionType = type
    if (!transactionType && legacy_type) {
      transactionType = legacy_type === "income" ? "credit" : "debit"
    }
    if (!transactionType) {
      transactionType = "debit" // default to debit
    }
    
    const transactionData = {
      userId,
      amount: Number(amount),
      description: description.trim(),
      category: category || "Other",
      type: transactionType,
      date: date ? new Date(date) : new Date(),
      time: time || new Date().toTimeString().slice(0, 8), // HH:MM:SS
      channel: channel || "Manual Entry",
      transaction_reference: transaction_reference || `MAN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      counterparty: counterparty || null,
      balance_after: balance_after || null
    }
    
    const item = await Transaction.create(transactionData)
    
    logger.info("Transaction created", { 
      userId, 
      transactionId: item._id,
      type: transactionType,
      amount,
      description 
    })
    
    // Transform response
    const response = {
      id: item._id,
      userId: item.userId,
      date: item.date,
      time: item.time,
      description: item.description,
      type: item.type,
      amount: item.amount,
      balance_after: item.balance_after,
      channel: item.channel,
      transaction_reference: item.transaction_reference,
      counterparty: item.counterparty,
      category: item.category,
      // Legacy compatibility
      legacy_type: item.type === "credit" ? "income" : "expense"
    }
    
    return res.status(201).json(response)
  } catch (err: any) {
    logger.error("Error creating transaction", { error: err.message })
    return res.status(500).json({ error: "Internal server error" })
  }
}

export async function updateTransaction(req: Request, res: Response) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }
    
    const { id } = req.params as { id: string }
    const { 
      amount, 
      description,
      category, 
      type, 
      date,
      time,
      channel,
      transaction_reference,
      counterparty,
      balance_after,
      // Legacy support
      legacy_type
    } = req.body || {}
    
    const item = await Transaction.findOne({ _id: id, userId })
    if (!item) {
      return res.status(404).json({ error: "Transaction not found" })
    }
    
    // Update fields
    if (amount != null) item.amount = Number(amount)
    if (description) item.description = description.trim()
    if (category) item.category = category
    if (date) item.date = new Date(date)
    if (time) item.time = time
    if (channel) item.channel = channel
    if (transaction_reference) item.transaction_reference = transaction_reference
    if (counterparty !== undefined) item.counterparty = counterparty
    if (balance_after !== undefined) item.balance_after = balance_after
    
    // Handle type conversion
    if (type) {
      item.type = type
    } else if (legacy_type) {
      item.type = legacy_type === "income" ? "credit" : "debit"
    }
    
    await item.save()
    
    logger.info("Transaction updated", { 
      userId, 
      transactionId: item._id 
    })
    
    // Transform response
    const response = {
      id: item._id,
      userId: item.userId,
      date: item.date,
      time: item.time,
      description: item.description,
      type: item.type,
      amount: item.amount,
      balance_after: item.balance_after,
      channel: item.channel,
      transaction_reference: item.transaction_reference,
      counterparty: item.counterparty,
      category: item.category,
      // Legacy compatibility
      legacy_type: item.type === "credit" ? "income" : "expense"
    }
    
    return res.json(response)
  } catch (err: any) {
    logger.error("Error updating transaction", { error: err.message })
    return res.status(500).json({ error: "Internal server error" })
  }
}

export async function deleteTransaction(req: Request, res: Response) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }
    
    const { id } = req.params as { id: string }
    
    const result = await Transaction.deleteOne({ _id: id, userId })
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Transaction not found" })
    }
    
    logger.info("Transaction deleted", { userId, transactionId: id })
    
    return res.status(204).send()
  } catch (err: any) {
    logger.error("Error deleting transaction", { error: err.message })
    return res.status(500).json({ error: "Internal server error" })
  }
}