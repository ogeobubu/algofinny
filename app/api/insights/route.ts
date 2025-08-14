import type { NextRequest } from "next/server"
import { parseAuth, getTransactions } from "@/app/api/_db"

export async function GET(req: NextRequest) {
  const auth = parseAuth(req.headers.get("authorization"))
  if (!auth) return new Response("Unauthorized", { status: 401 })
  const all = getTransactions(auth.userId)
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  const month = all.filter((t) => {
    const d = new Date(t.date)
    return d >= start && d <= end
  })
  const byCategory: Record<string, number> = {}
  let income = 0
  let expenses = 0
  month.forEach((t) => {
    if (t.type === "expense") {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
      expenses += t.amount
    } else {
      income += t.amount
    }
  })
  const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]
  const [cat, amt] = top ?? ["spending", 0]
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0
  const tip =
    amt > 0
      ? `You spent ₦${Math.round(amt).toLocaleString()} on ${cat} this month. Try meal prepping to save around 10%.`
      : "Add your expenses to get personalized savings tips."
  const wrap = `Monthly check-in: Income ₦${Math.round(income).toLocaleString()}, Expenses ₦${Math.round(
    expenses,
  ).toLocaleString()}, Savings rate ~${Math.max(0, savingsRate)}%. ${tip}`

  return Response.json({ advice: wrap, model: "mock-deepseek" })
}
