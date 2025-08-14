import type { NextRequest } from "next/server"
import { createUser, makeToken } from "@/app/api/_db"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { email, password } = body || {}
  if (!email || !password) {
    return new Response("Email and password required", { status: 400 })
  }
  const user = createUser(email, password)
  if (!user) {
    return new Response("User already exists", { status: 409 })
  }
  return Response.json({ token: makeToken(email) })
}
