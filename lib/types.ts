// lib/types.ts

export interface Transaction {
  id: string
  userId?: string
  amount: number
  description: string
  category: string
  type: "income" | "expense"
  date: Date | string
}

export interface User {
  id: string
  name: string
  email: string
}

export interface AIAdvice {
  message: string
  severity: "low" | "medium" | "high"
  model?: string
}

export interface AuthResponse {
  token: string
}

export interface ApiError {
  error: string
}