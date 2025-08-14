import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("statement") as File | null
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

  // Forward to Node.js API
  const apiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/bank/upload`, {
    method: "POST",
    body: formData,
  })
  const data = await apiRes.json()
  return NextResponse.json(data, { status: apiRes.status })
}
