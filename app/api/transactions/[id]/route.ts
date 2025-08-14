import type { NextRequest } from "next/server"
import { parseAuth, getTransactions, setTransactions } from "@/app/api/_db"
import type { Transaction } from "@/lib/types"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = parseAuth(req.headers.get("authorization"))
  if (!auth) return new Response("Unauthorized", { status: 401 })
  const id = params.id
  const body = (await req.json().catch(() => ({}))) as Omit<Transaction, "id">
  const list = getTransactions(auth.userId)
  const idx = list.findIndex((t) => t.id === id)
  if (idx === -1) return new Response("Not found", { status: 404 })
  const updated: Transaction = {
    ...list[idx],
    date: body.date ? new Date(body.date) : list[idx].date,
    description: body.description ?? list[idx].description,
    category: body.category ?? list[idx].category,
    amount: Number(body.amount ?? list[idx].amount),
    type: body.type === "income" || body.type === "expense" ? body.type : (list[idx].type as any),
  }
  const next = [...list]
  next[idx] = updated
  setTransactions(auth.userId, next)
  return Response.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = parseAuth(req.headers.get("authorization"))
  if (!auth) return new Response("Unauthorized", { status: 401 })
  const id = params.id
  const list = getTransactions(auth.userId)
  const next = list.filter((t) => t.id !== id)
  setTransactions(auth.userId, next)
  return new Response(null, { status: 204 })
}
