import type { Transaction } from "@/lib/types"

// Simple in-memory DB for demo purposes.
export type User = { id: string; email: string; password: string }

const users = new Map<string, User>() // key by email
const transactionsByUser = new Map<string, Transaction[]>()

function randomId() {
  return crypto.randomUUID()
}

// Helpers
export function createUser(email: string, password: string): User | null {
  if (users.has(email)) return null
  const user: User = { id: randomId(), email, password }
  users.set(email, user)
  return user
}

export function findUser(email: string): User | null {
  return users.get(email) ?? null
}

export function seedIfEmpty(userId: string) {
  if (!transactionsByUser.has(userId)) {
    const now = new Date()
    const demo: Transaction[] = [
      { id: randomId(), date: now, description: "Jumia", category: "Shopping", amount: 25000, type: "expense" },
      { id: randomId(), date: now, description: "Freelance", category: "Income", amount: 80000, type: "income" },
      { id: randomId(), date: now, description: "POS Fee", category: "POS Charges", amount: 300, type: "expense" },
      { id: randomId(), date: now, description: "Bus fare", category: "Transport", amount: 700, type: "expense" },
      { id: randomId(), date: now, description: "Groceries", category: "Food", amount: 15000, type: "expense" },
      { id: randomId(), date: now, description: "Airtime Top-up", category: "Airtime", amount: 2000, type: "expense" },
    ]
    transactionsByUser.set(userId, demo)
  }
}

export function getTransactions(userId: string): Transaction[] {
  seedIfEmpty(userId)
  return transactionsByUser.get(userId) ?? []
}

export function setTransactions(userId: string, list: Transaction[]) {
  transactionsByUser.set(userId, list)
}

export function parseAuth(header?: string | null): { userId: string; email: string } | null {
  if (!header) return null
  const m = header.match(/^Bearer\s+(.+)$/i)
  if (!m) return null
  const token = m[1]
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8")
    const email = decoded.split("|")[0] ?? decoded
    const user = users.get(email)
    if (!user) return null
    return { userId: user.id, email }
  } catch {
    return null
  }
}

export function makeToken(email: string) {
  return Buffer.from(`${email}|mock`, "utf-8").toString("base64")
}
