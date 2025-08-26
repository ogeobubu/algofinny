import type { Request, Response } from "express"
import Transaction from "../models/Transaction.js"
import { getUserIdFromRequest } from "../middleware/authMiddleware.js"
import logger from "../utils/logger.js"

function normalizeType(type?: string, legacy_type?: string): { type: "credit" | "debit", legacy_type: "income" | "expense" } {
  if (type === "income" || legacy_type === "income") {
    return { type: "credit", legacy_type: "income" }
  }
  if (type === "expense" || legacy_type === "expense") {
    return { type: "debit", legacy_type: "expense" }
  }
  if (type === "credit") {
    return { type: "credit", legacy_type: "income" }
  }
  if (type === "debit") {
    return { type: "debit", legacy_type: "expense" }
  }
  // default
  return { type: "debit", legacy_type: "expense" }
}

export async function listTransactions(req: Request, res: Response) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      logger.warn("Unauthorized transaction list request - no userId in request")
      return res.status(401).json({ error: "Unauthorized - authentication required" })
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
      legacy_type: item.type === "credit" ? "income" : "expense",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))
    
    return res.json(transformedItems)
  } catch (err: any) {
    logger.error("Error fetching transactions", { 
      error: err.message,
      stack: err.stack 
    })
    return res.status(500).json({ error: "Internal server error" })
  }
}

export async function createTransaction(req: Request, res: Response) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      logger.warn("Unauthorized transaction creation request - no userId in request")
      return res.status(401).json({ error: "Unauthorized - authentication required" })
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
      legacy_type
    } = req.body || {}

    // Validate required fields
    if (amount == null || !description) {
      logger.warn("Transaction creation missing required fields", { 
        userId,
        hasAmount: amount != null,
        hasDescription: !!description
      })
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["amount", "description"],
        received: Object.keys(req.body)
      })
    }

    // Normalize type here
    const { type: normalizedType, legacy_type: normalizedLegacy } = normalizeType(type, legacy_type)

    const transactionData = {
      userId,
      amount: Number(amount),
      description: description.trim(),
      category: category || "Other",
      type: normalizedType,
      legacy_type: normalizedLegacy,
      date: date ? new Date(date) : new Date(),
      time: time || new Date().toTimeString().slice(0, 8),
      channel: channel || "Manual Entry",
      transaction_reference: transaction_reference || `MAN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      counterparty: counterparty || null,
      balance_after: balance_after || null
    }

    const item = await Transaction.create(transactionData)

    logger.info("Transaction created", {
      userId,
      transactionId: item._id,
      type: item.type,
      amount,
      description: description.substring(0, 50) + (description.length > 50 ? "..." : "")
    })

    // Return transformed response
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
      legacy_type: item.type === "credit" ? "income" : "expense",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }

    return res.status(201).json(response)
  } catch (err: any) {
    logger.error("Error creating transaction", { 
      error: err.message,
      stack: err.stack,
      requestBody: req.body
    })
    
    // Check for validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation error",
        details: Object.values(err.errors).map((e: any) => e.message)
      })
    }
    
    return res.status(500).json({ error: "Internal server error" })
  }
}

export async function updateTransaction(req: Request, res: Response) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized - authentication required" })
    }

    const { id } = req.params as { id: string }
    
    if (!id) {
      return res.status(400).json({ error: "Transaction ID is required" })
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
      legacy_type
    } = req.body || {}

    const item = await Transaction.findOne({ _id: id, userId })
    if (!item) {
      logger.warn("Transaction not found for update", { userId, transactionId: id })
      return res.status(404).json({ error: "Transaction not found" })
    }

    // Update fields if provided
    if (amount != null) item.amount = Number(amount)
    if (description) item.description = description.trim()
    if (category) item.category = category
    if (date) item.date = new Date(date)
    if (time) item.time = time
    if (channel) item.channel = channel
    if (transaction_reference) item.transaction_reference = transaction_reference
    if (counterparty !== undefined) item.counterparty = counterparty
    if (balance_after !== undefined) item.balance_after = balance_after

    // Normalize type on update
    if (type || legacy_type) {
      const { type: normalizedType, legacy_type: normalizedLegacy } = normalizeType(type, legacy_type)
      item.type = normalizedType
      item.legacy_type = normalizedLegacy
    }

    await item.save()

    logger.info("Transaction updated", { userId, transactionId: item._id })
    
    // Return transformed response
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
      legacy_type: item.type === "credit" ? "income" : "expense",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }
    
    return res.json(response)
  } catch (err: any) {
    logger.error("Error updating transaction", { 
      error: err.message,
      transactionId: req.params.id
    })
    return res.status(500).json({ error: "Internal server error" })
  }
}

export async function deleteTransaction(req: Request, res: Response) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized - authentication required" })
    }
    
    const { id } = req.params as { id: string }
    
    if (!id) {
      return res.status(400).json({ error: "Transaction ID is required" })
    }
    
    const result = await Transaction.deleteOne({ _id: id, userId })
    
    if (result.deletedCount === 0) {
      logger.warn("Transaction not found for deletion", { userId, transactionId: id })
      return res.status(404).json({ error: "Transaction not found" })
    }
    
    logger.info("Transaction deleted", { userId, transactionId: id })
    
    return res.status(204).send()
  } catch (err: any) {
    logger.error("Error deleting transaction", { 
      error: err.message,
      transactionId: req.params.id
    })
    return res.status(500).json({ error: "Internal server error" })
  }
}