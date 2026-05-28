import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

export async function GET() {
  try {
    const controller = new AbortController()
    const timeout    = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(`${BACKEND_URL}/health`, {
      signal: controller.signal,
      cache:  'no-store',
    })
    clearTimeout(timeout)

    if (!res.ok) return NextResponse.json({ ready: false, status: 'error' })

    const data = await res.json()
    return NextResponse.json({
      ready:  data.ready === true,
      status: data.status,
      device: data.device,
    })
  } catch {
    return NextResponse.json({ ready: false, status: 'unreachable' })
  }
}