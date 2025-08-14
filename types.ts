export interface Transaction {
  id: string
  userId: string
  amount: number
  category: string // e.g., "Food", "Transport", etc.
  type: "income" | "expense"
  date: Date
}

export interface AIAdvice {
  message: string
  severity: "low" | "medium" | "high"
}
