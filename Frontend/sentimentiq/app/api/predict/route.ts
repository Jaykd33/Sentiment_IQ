import { NextRequest, NextResponse } from 'next/server'

// In development, calls your local FastAPI at port 8000.
// In production (Vercel), calls your deployed Railway/Render backend.
// Set BACKEND_URL in your Vercel environment variables for production.
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid text' }, { status: 400 })
    }

    const res = await fetch(`${BACKEND_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err.error || 'Backend error' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Proxy error:', err)
    // Fallback: if backend is unreachable, return a helpful error
    return NextResponse.json(
      { error: 'Could not reach inference backend. Is the FastAPI server running?' },
      { status: 503 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', model: 'SentimentIQ v2', version: '2.0.0' })
}