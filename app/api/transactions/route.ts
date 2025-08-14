import type { NextRequest } from "next/server"
import { parseAuth, getTransactions, setTransactions } from "@/app/api/_db"
import type { Transaction } from "@/lib/types"

export async function GET(req: NextRequest) {
  const auth = parseAuth(req.headers.get("authorization"))
  if (!auth) return new Response("Unauthorized", { status: 401 })
  const data = getTransactions(auth.userId)
  return Response.json(data)
}

export async function POST(req: NextRequest) {
  const auth = parseAuth(req.headers.get("authorization"))
  if (!auth) return new Response("Unauthorized", { status: 401 })
  const body = (await req.json().catch(() => ({}))) as Omit<Transaction, "id">
  const list = getTransactions(auth.userId)
  const tx: Transaction = {
    id: crypto.randomUUID(),
    date: body.date ? new Date(body.date) : new Date(),
    description: body.description ?? "",
    category: body.category ?? "Other",
    amount: Number(body.amount ?? 0),
    type: body.type === "income" ? "income" : "expense",
  }
  setTransactions(auth.userId, [tx, ...list])
  return Response.json(tx)
}
