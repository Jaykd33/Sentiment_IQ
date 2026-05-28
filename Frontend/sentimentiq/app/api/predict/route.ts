import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

export const maxDuration = 60  // Allow up to 60s for Render cold start (Vercel Pro)
                                // On free Vercel this cap is 10s — see note below

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid text' }, { status: 400 })
    }

    const controller = new AbortController()
    // 55 second timeout — gives Render time to wake from sleep
    const timeoutId  = setTimeout(() => controller.abort(), 55000)

    let res: Response
    try {
      res = await fetch(`${BACKEND_URL}/predict`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text }),
        signal:  controller.signal,
      })
    } catch (fetchErr: any) {
      clearTimeout(timeoutId)
      if (fetchErr.name === 'AbortError') {
        return NextResponse.json(
          { error: 'The AI backend is waking up from sleep (Render free tier). Please wait 30 seconds and try again.' },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: 'Could not reach the inference backend. Is it deployed?' },
        { status: 503 }
      )
    }

    clearTimeout(timeoutId)

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      // If backend says models still loading, give friendly message
      if (res.status === 503) {
        return NextResponse.json(
          { error: 'Models are still loading on the backend. Please retry in 20 seconds.' },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: (err as any).detail || 'Backend error' },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)

  } catch (err: any) {
    console.error('Proxy error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', model: 'SentimentIQ v2', version: '2.0.0' })
}