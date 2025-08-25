import type { NextRequest } from "next/server"

const SERVER_URL = process.env.SERVER_URL || "http://localhost:4001"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || ""

    const response = await fetch(`${SERVER_URL}/api/transactions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        authorization: authHeader,
      },
    })

    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (err) {
    console.error("Transactions proxy error:", err)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const body = await req.json()

    const response = await fetch(`${SERVER_URL}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: authHeader,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (err) {
    console.error("Transaction create proxy error:", err)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
