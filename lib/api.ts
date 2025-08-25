// lib/api.ts

import { getAuthHeaders, getToken, setToken } from "./auth"
import type { Transaction, AuthResponse, AIAdvice } from "./types"

// Environment variables
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4001"
const USE_SERVER = process.env.NEXT_PUBLIC_USE_SERVER === "true"

// Helper function to get the correct endpoint
function getEndpoint(path: string): string {
  if (USE_SERVER) {
    return `${SERVER_URL}${path}`
  }
  return `/api${path.replace('/api', '')}`
}

// Authentication
export async function login(email: string, password: string): Promise<void> {
  const response = await fetch(getEndpoint("/api/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || "Login failed")
  }

  const data: AuthResponse = await response.json()
  setToken(data.token)
}

export async function signup(email: string, password: string): Promise<void> {
  const response = await fetch(getEndpoint("/api/auth/signup"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || "Signup failed")
  }

  const data: AuthResponse = await response.json()
  setToken(data.token)
}

// Transactions
export async function fetchTransactions(): Promise<Transaction[]> {
  const response = await fetch(getEndpoint("/api/transactions"), {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch transactions")
  }

  return response.json()
}

export async function createTransaction(transaction: Omit<Transaction, "id">): Promise<Transaction> {
  const response = await fetch(getEndpoint("/api/transactions"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(transaction),
  })

  if (!response.ok) {
    throw new Error("Failed to create transaction")
  }

  return response.json()
}

export async function updateTransaction(id: string, transaction: Omit<Transaction, "id">): Promise<Transaction> {
  const response = await fetch(getEndpoint(`/api/transactions/${id}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(transaction),
  })

  if (!response.ok) {
    throw new Error("Failed to update transaction")
  }

  return response.json()
}

export async function deleteTransaction(id: string): Promise<void> {
  const response = await fetch(getEndpoint(`/api/transactions/${id}`), {
    method: "DELETE",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error("Failed to delete transaction")
  }
}

// AI Insights
export async function fetchInsights(): Promise<string> {
  try {
    const token = getToken()
    if (!token) return "Please log in to get personalized insights."

    const response = await fetch(getEndpoint("/api/insights"), {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      return "Unable to fetch insights at this time."
    }

    const data = await response.json()
    return data.advice || "Add some transactions to get personalized advice!"
  } catch (error) {
    console.error("Error fetching insights:", error)
    return "Add some transactions to get personalized advice!"
  }
}

// Server-specific AI advice (with OpenAI)
export async function fetchAdvancedInsights(userId?: string): Promise<string> {
  try {
    if (!USE_SERVER) {
      return fetchInsights() // Fallback to local insights
    }

    const response = await fetch(`${SERVER_URL}/api/ai/advice?openai=true${userId ? `&userId=${userId}` : ''}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      return "Unable to fetch advanced insights at this time."
    }

    const data = await response.json()
    return data.advice || "Add some transactions to get AI-powered advice!"
  } catch (error) {
    console.error("Error fetching advanced insights:", error)
    return fetchInsights() // Fallback
  }
}

// Health check for server connection
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${SERVER_URL}/health`)
    return response.ok
  } catch (error) {
    console.error("Server health check failed:", error)
    return false
  }
}

// Get profile email from token (for display purposes)
export function getProfileEmail(): string | null {
  const token = getToken()
  if (!token) return null
  
  try {
    const decoded = atob(token.split('.')[1] || token)
    const email = decoded.split('|')[0]
    return email || null
  } catch (error) {
    console.error("Error decoding token:", error)
    return null
  }
}