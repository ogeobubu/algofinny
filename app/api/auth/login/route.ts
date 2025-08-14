import type { NextRequest } from "next/server"
import { findUser, makeToken } from "@/app/api/_db"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { email, password } = body || {}
  if (!email || !password) {
    return new Response("Email and password required", { status: 400 })
  }
  const user = findUser(email)
  if (!user || user.password !== password) {
    return new Response("Invalid credentials", { status: 401 })
  }
  return Response.json({ token: makeToken(email) })
}
