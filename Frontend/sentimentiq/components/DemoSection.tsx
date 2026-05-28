'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, RotateCcw, Sparkles, Wifi, WifiOff, Clock } from 'lucide-react'
import { useScrollReveal } from '@/lib/hooks'
import PredictionResult from './PredictionResult'

const EXAMPLE_REVIEWS = [
  {
    label: '😊 Glowing 5-Star',
    color: '#10b981',
    text: "This is absolutely the best product I've ever bought! The battery lasts all day, the build quality feels incredibly premium, and delivery arrived two days early. Customer service was also amazing when I had a small setup question. I've already recommended it to five friends. Worth every single penny — buy it without hesitation!",
  },
  {
    label: '😠 Angry 1-Star',
    color: '#ef4444',
    text: "ABSOLUTE GARBAGE! This thing broke after exactly 2 days of normal use. Battery drains in under 2 hours, the build quality is cheap plastic, and customer service completely ignored my refund request for three weeks. I've never been so angry about a purchase in my life. AVOID THIS PRODUCT AT ALL COSTS. Complete scam.",
  },
  {
    label: '😤 Mixed 3-Star',
    color: '#f59e0b',
    text: "Battery life is impressive — lasts 3 full days. However, delivery took nearly 3 weeks and the packaging was slightly damaged on arrival. The price feels a bit high for the build quality, which is just average plastic. Customer service was helpful when I reached out but it took 5 days to get a reply. Not terrible, but not great.",
  },
  {
    label: '😐 Neutral 3-Star',
    color: '#8b5cf6',
    text: "Works as described. Nothing amazing, nothing terrible. Does exactly what it says on the box and arrived on time. The price seems fair for what you get. Setup was straightforward. I've been using it for 2 months without issues. Not life-changing but solid and reliable for the price point.",
  },
]

// Backend status type
type BackendStatus = 'unknown' | 'checking' | 'waking' | 'loading' | 'ready' | 'error'

// How long between health-check polls during warm-up (ms)
const POLL_INTERVAL = 6000

export default function DemoSection() {
  const { ref, visible }          = useScrollReveal(0.1)
  const [text, setText]           = useState('')
  const [result, setResult]       = useState<any>(null)
  const [loading, setLoading]     = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('unknown')
  const [warmUpSeconds, setWarmUpSeconds] = useState(0)
  const [warmUpMessage, setWarmUpMessage] = useState('')
  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const pollRef      = useRef<NodeJS.Timeout | null>(null)
  const timerRef     = useRef<NodeJS.Timeout | null>(null)
  const warmingRef   = useRef(false)

  // ── Check backend health ──────────────────────────────────────────────────
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/health', { cache: 'no-store' })
      if (!res.ok) return false
      const data = await res.json()
      return data.ready === true
    } catch {
      return false
    }
  }, [])

  // ── Poll until backend is ready ───────────────────────────────────────────
  const startWarmUpPolling = useCallback(() => {
    if (warmingRef.current) return   // already polling
    warmingRef.current = true
    setBackendStatus('waking')
    setWarmUpSeconds(0)

    const messages = [
      'Waking up the AI backend on Render...',
      'Server is starting up...',
      'Downloading DistilBERT model weights...',
      'Loading sentiment model into memory...',
      'Loading emotion detection model...',
      'Almost ready — finalising setup...',
      'Still loading — large models take a moment...',
      'Nearly there — thanks for your patience...',
    ]
    let msgIndex = 0
    setWarmUpMessage(messages[0])

    // Elapsed seconds counter
    timerRef.current = setInterval(() => {
      setWarmUpSeconds(s => s + 1)
    }, 1000)

    // Poll health every 6 seconds
    const poll = async () => {
      msgIndex = Math.min(msgIndex + 1, messages.length - 1)
      setWarmUpMessage(messages[msgIndex])

      // After a few polls, show "loading models" status
      if (msgIndex >= 2) setBackendStatus('loading')

      const ready = await checkHealth()
      if (ready) {
        // Backend is up!
        warmingRef.current = false
        clearInterval(timerRef.current!)
        clearInterval(pollRef.current!)
        setBackendStatus('ready')
        setWarmUpMessage('')
        setWarmUpSeconds(0)
      }
    }

    pollRef.current = setInterval(poll, POLL_INTERVAL)
    // Run first poll immediately after a short delay
    setTimeout(poll, 2000)
  }, [checkHealth])

  // ── On mount: do an initial health check ─────────────────────────────────
  useEffect(() => {
    const initialCheck = async () => {
      setBackendStatus('checking')
      const ready = await checkHealth()
      if (ready) {
        setBackendStatus('ready')
      } else {
        // Backend is sleeping — start polling
        startWarmUpPolling()
      }
    }
    initialCheck()

    return () => {
      if (pollRef.current)  clearInterval(pollRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [checkHealth, startWarmUpPolling])

  // ── Handle preset examples ────────────────────────────────────────────────
  const handlePreset = (presetText: string) => {
    setText(presetText)
    setCharCount(presetText.length)
    setResult(null)
    textareaRef.current?.focus()
  }

  const handleReset = () => {
    setText('')
    setCharCount(0)
    setResult(null)
    textareaRef.current?.focus()
  }

  // ── Submit review for analysis ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!text.trim() || loading || backendStatus !== 'ready') return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        // If backend went back to sleep mid-session, restart polling
        if (res.status === 503) {
          setBackendStatus('waking')
          startWarmUpPolling()
        }
        throw new Error((err as any).error || 'Analysis failed')
      }

      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setResult({ _error: e.message || 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = text.trim().length >= 5 && !loading && backendStatus === 'ready'

  // ── Status indicator component ────────────────────────────────────────────
  const StatusBadge = () => {
    const configs: Record<BackendStatus, { color: string; bg: string; border: string; dot: string; label: string }> = {
      unknown:  { color: '#6b7fa3', bg: 'rgba(107,127,163,0.1)',  border: 'rgba(107,127,163,0.3)',  dot: '#6b7fa3', label: 'Checking backend...' },
      checking: { color: '#6b7fa3', bg: 'rgba(107,127,163,0.1)',  border: 'rgba(107,127,163,0.3)',  dot: '#6b7fa3', label: 'Checking backend...' },
      waking:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.3)',   dot: '#f59e0b', label: 'Backend waking up...' },
      loading:  { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.3)',   dot: '#3b82f6', label: 'Loading AI models...' },
      ready:    { color: '#10b981', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.3)',   dot: '#10b981', label: 'Backend ready' },
      error:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.3)',    dot: '#ef4444', label: 'Backend error' },
    }
    const c = configs[backendStatus]
    return (
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
        style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: c.dot,
            boxShadow: `0 0 6px ${c.dot}`,
            animation: backendStatus !== 'ready' && backendStatus !== 'error' ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }}
        />
        {c.label}
        {backendStatus === 'ready' && <span>✓</span>}
      </div>
    )
  }

  // ── Warm-up overlay shown while backend loads ─────────────────────────────
  const WarmUpScreen = () => {
    const isWaking  = backendStatus === 'waking'
    const isLoading = backendStatus === 'loading'
    const mins = Math.floor(warmUpSeconds / 60)
    const secs = warmUpSeconds % 60
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

    // Progress: assume full warm-up takes ~240 seconds
    const progress = Math.min((warmUpSeconds / 240) * 100, 95)

    return (
      <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
        {/* Animated rings */}
        <div className="relative w-24 h-24 mb-6">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="absolute inset-0 rounded-full border"
              style={{
                borderColor: i === 0 ? 'rgba(245,158,11,0.6)' : i === 1 ? 'rgba(59,130,246,0.4)' : 'rgba(139,92,246,0.2)',
                animation: `spin ${3 + i * 2}s linear ${i % 2 === 1 ? 'reverse' : ''} infinite`,
                inset: `${i * 10}px`,
              }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">
              {isLoading ? '🧠' : '⚡'}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display text-xl font-bold text-ink mb-2">
          {isLoading ? 'Loading AI Models' : 'Waking Up Backend'}
        </h3>

        {/* Current message */}
        <p className="text-sm text-muted font-mono mb-6 max-w-xs leading-relaxed">
          {warmUpMessage || 'Please wait...'}
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-xs mb-4">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #f59e0b, #3b82f6)',
                boxShadow: '0 0 10px rgba(59,130,246,0.5)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs font-mono text-dim">Starting up</span>
            <span className="text-xs font-mono text-dim">Ready</span>
          </div>
        </div>

        {/* Timer */}
        <div
          className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full mb-6"
          style={{ background: 'rgba(255,255,255,0.04)', color: '#6b7fa3' }}
        >
          <Clock size={11} />
          Elapsed: {timeStr}
        </div>

        {/* Explanation */}
        <div
          className="rounded-xl p-4 max-w-xs text-left"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
        >
          <p className="text-xs font-mono text-muted leading-relaxed">
            <span className="text-accent">ℹ</span> This project runs on Render's free tier.
            The backend loads a <span className="text-ink">66M parameter DistilBERT</span> model
            on first visit. This takes <span className="text-ink">2-4 minutes</span> once,
            then stays fast for all subsequent requests.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-4 flex flex-col gap-2 w-full max-w-xs">
          {[
            { label: 'Server waking up',          done: warmUpSeconds > 15  },
            { label: 'Downloading DistilBERT',    done: warmUpSeconds > 60  },
            { label: 'Loading sentiment model',   done: warmUpSeconds > 120 },
            { label: 'Loading emotion model',     done: warmUpSeconds > 180 },
            { label: 'Ready to analyze reviews',  done: backendStatus === 'ready' },
          ].map(({ label, done }) => (
            <div key={label} className="flex items-center gap-2 text-xs font-mono">
              <span style={{ color: done ? '#10b981' : '#3d5070' }}>
                {done ? '✓' : '○'}
              </span>
              <span style={{ color: done ? '#e2eaf8' : '#3d5070' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section ref={ref} id="demo" className="relative py-28 px-6">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.06), transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div
          className="text-center mb-10"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          <div className="inline-block glass px-4 py-1.5 rounded-full mb-4">
            <span className="text-xs font-mono text-accent uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" />
              Live Demo
            </span>
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold text-ink">
            Try <span className="grad-text">SentimentIQ</span>
          </h2>
          <p className="mt-4 text-muted text-lg max-w-xl mx-auto">
            Paste any Amazon review and receive a full sentiment, emotion, and helpfulness breakdown.
          </p>

          {/* Backend status badge */}
          <div className="mt-4 flex justify-center">
            <StatusBadge />
          </div>
        </div>

        {/* Preset examples */}
        <div
          className="flex flex-wrap gap-2 mb-6 justify-center"
          style={{ opacity: visible ? 1 : 0, transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s' }}
        >
          {EXAMPLE_REVIEWS.map(ex => (
            <button
              key={ex.label}
              onClick={() => handlePreset(ex.text)}
              disabled={backendStatus !== 'ready'}
              className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: `${ex.color}12`, border: `1px solid ${ex.color}30`, color: ex.color }}
              data-hover
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Input column ── */}
          <div className="flex flex-col gap-4">
            <div className="animated-border rounded-2xl flex-1">
              <div className="glass rounded-2xl p-1 h-full">
                <div className="bg-panel rounded-xl h-full flex flex-col">
                  {/* Terminal header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/60" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                      </div>
                      <span className="text-xs font-mono text-muted ml-2">review_input.txt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-dim">{charCount}/5000</span>
                      {text && (
                        <button onClick={handleReset} className="p-1 rounded-md hover:bg-white/5 transition-colors" data-hover>
                          <RotateCcw size={12} className="text-muted" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Textarea */}
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={text}
                      onChange={e => { setText(e.target.value); setCharCount(e.target.value.length) }}
                      onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') handleSubmit() }}
                      maxLength={5000}
                      rows={12}
                      disabled={backendStatus !== 'ready'}
                      placeholder={
                        backendStatus === 'ready'
                          ? 'Paste your Amazon review here...\n\nTry one of the preset examples above, or write your own.\nPress Ctrl+Enter to analyze.'
                          : 'Waiting for backend to be ready...'
                      }
                      className="w-full h-full bg-transparent text-ink font-mono text-sm resize-none p-4 placeholder-dim/50 leading-relaxed disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Analyze button */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              data-hover
              className="relative w-full py-4 rounded-xl font-display text-lg font-semibold transition-all duration-300 overflow-hidden group"
              style={{
                background: canSubmit
                  ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #1d4ed8 100%)'
                  : 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.4)',
                color: canSubmit ? '#fff' : '#3b82f6',
                opacity: canSubmit ? 1 : 0.5,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                boxShadow: canSubmit ? '0 0 40px rgba(59,130,246,0.3)' : 'none',
              }}
            >
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <><Loader2 size={20} className="animate-spin" /><span>Analyzing Review...</span></>
                ) : backendStatus !== 'ready' ? (
                  <><Loader2 size={20} className="animate-spin" /><span>Waiting for backend...</span></>
                ) : (
                  <><Sparkles size={20} /><span>Analyze with SentimentIQ</span><span className="text-sm opacity-60 font-mono">(Ctrl+Enter)</span></>
                )}
              </div>
            </button>
          </div>

          {/* ── Result column ── */}
          <div className="min-h-[400px]">
            {/* Warm-up screen while backend loads */}
            {(backendStatus === 'waking' || backendStatus === 'loading' || backendStatus === 'checking' || backendStatus === 'unknown') && !result && (
              <WarmUpScreen />
            )}

            {/* Ready but no result yet */}
            {backendStatus === 'ready' && !result && !loading && (
              <div className="glass rounded-2xl h-full flex flex-col items-center justify-center p-10 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-float"
                  style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <Sparkles size={28} className="text-accent" />
                </div>
                <h3 className="font-display text-xl font-bold text-ink mb-2">Ready to Analyze</h3>
                <p className="text-muted text-sm leading-relaxed max-w-xs">
                  Backend is live. Type or paste a review and click Analyze.
                </p>
                <div className="mt-6 flex flex-col gap-2 text-xs font-mono text-dim">
                  <div>→ Sentiment · Emotion · Valence</div>
                  <div>→ Helpfulness Score · Signals</div>
                  <div>→ Token Attribution</div>
                  <div>→ AI Narrative</div>
                </div>
              </div>
            )}

            {/* Loading spinner while analyzing */}
            {loading && (
              <div className="glass rounded-2xl h-full flex flex-col items-center justify-center p-10 text-center">
                <div className="relative w-20 h-20 mb-6">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="absolute rounded-full border-2"
                      style={{
                        inset: `${i * 8}px`,
                        borderColor: ['rgba(59,130,246,0.6)','rgba(139,92,246,0.4)','rgba(16,185,129,0.2)'][i],
                        animation: `spin ${2 + i}s linear ${i % 2 ? 'reverse' : ''} infinite`,
                      }}
                    />
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">🧠</span>
                  </div>
                </div>
                <div className="font-display text-lg font-bold text-ink mb-1">Analyzing</div>
                <div className="text-sm text-muted font-mono">Running inference pipeline...</div>
              </div>
            )}

            {/* Error state */}
            {result?._error && (
              <div className="glass rounded-2xl p-6">
                <div className="rounded-xl p-4 text-sm font-mono text-red-400"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  ⚠ {result._error}
                </div>
              </div>
            )}

            {/* Actual result */}
            {result && !result._error && !loading && (
              <PredictionResult data={result} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}