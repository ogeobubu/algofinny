import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("statement") as File | null
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Get the auth token from the request
    const authHeader = req.headers.get('authorization')
    
    // Forward to Node.js API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001"}/api/bank/upload`
    
    const apiRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        'Authorization': authHeader || '',
      },
      body: formData,
    })

    const data = await apiRes.json()
    
    return NextResponse.json(data, { status: apiRes.status })
    
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to process upload", details: String(error) },
      { status: 500 }
    )
  }
}