export type Transaction = {
  id: string
  date: Date | string
  description: string
  category: string
  amount: number
  type: "income" | "expense"
}
