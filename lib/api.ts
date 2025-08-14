import type { Transaction } from "./types"
import { setToken, getToken } from "./auth"

function authHeaders() {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export async function login(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  setToken(data.token, email)
  return data
}

export async function signup(email: string, password: string) {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  setToken(data.token, email)
  return data
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch("/api/transactions", { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}

export async function createTransaction(input: Omit<Transaction, "id">): Promise<Transaction> {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}

export async function updateTransaction(id: string, input: Omit<Transaction, "id">): Promise<Transaction> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}

export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function fetchInsights(): Promise<string> {
  const res = await fetch(`/api/insights`, { headers: { ...authHeaders() } })
  if (!res.ok) return ""
  const data = await res.json()
  return data.advice as string
}
