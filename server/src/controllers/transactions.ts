import type { Request, Response } from "express"
import jwt from "jsonwebtoken"
import Transaction from "../models/Transaction"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"

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
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: "Unauthorized" })
  const items = await Transaction.find({ userId }).sort({ date: -1 })
  return res.json(items)
}

export async function createTransaction(req: Request, res: Response) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: "Unauthorized" })
  const { amount, category, type, date } = req.body || {}
  if (amount == null || !category || !type) return res.status(400).json({ error: "amount, category, type required" })
  const item = await Transaction.create({ userId, amount, category, type, date: date ? new Date(date) : new Date() })
  return res.status(201).json(item)
}

export async function updateTransaction(req: Request, res: Response) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: "Unauthorized" })
  const { id } = req.params as { id: string }
  const { amount, category, type, date } = req.body || {}
  const item = await Transaction.findOne({ _id: id, userId })
  if (!item) return res.status(404).json({ error: "Not found" })
  if (amount != null) item.amount = Number(amount)
  if (category) item.category = category
  if (type) item.type = type
  if (date) item.date = new Date(date)
  await item.save()
  return res.json(item)
}

export async function deleteTransaction(req: Request, res: Response) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: "Unauthorized" })
  const { id } = req.params as { id: string }
  await Transaction.deleteOne({ _id: id, userId })
  return res.status(204).send()
}
