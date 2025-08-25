import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const response = await fetch(`${process.env.SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Login proxy error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}