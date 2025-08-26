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
    
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
    }

    // Forward to Node.js API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001"}/api/bank/upload`
    
    console.log("Forwarding upload to:", apiUrl)
    
    // Create a new FormData for the backend
    const backendFormData = new FormData()
    backendFormData.append("statement", file)

    const apiRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        'Authorization': authHeader,
      },
      body: backendFormData,
    })

    if (!apiRes.ok) {
      const errorText = await apiRes.text()
      console.error("Backend error:", apiRes.status, errorText)
      return NextResponse.json(
        { error: `Backend error: ${apiRes.status}`, details: errorText },
        { status: apiRes.status }
      )
    }

    const data = await apiRes.json()
    
    return NextResponse.json(data, { status: apiRes.status })
    
  } catch (error: any) {
    console.error("Upload error:", error)
    
    // Handle connection errors specifically
    if (error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { 
          error: "Cannot connect to backend server",
          details: "Please make sure the backend server is running on port 4001",
          solution: "Run 'npm run dev' in the server directory"
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to process upload", details: error.message },
      { status: 500 }
    )
  }
}

// Add OPTIONS method for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}