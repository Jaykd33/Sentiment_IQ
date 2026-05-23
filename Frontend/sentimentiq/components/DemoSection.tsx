'use client'

import { useState, useRef } from 'react'
import { Send, Loader2, RotateCcw, Sparkles, Brain } from 'lucide-react'
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

export default function DemoSection() {
  const { ref, visible } = useScrollReveal(0.1)
  const [text, setText]         = useState('')
  const [result, setResult]     = useState<any>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [charCount, setCharCount] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handlePreset = (presetText: string) => {
    setText(presetText)
    setCharCount(presetText.length)
    setResult(null)
    setError(null)
    textareaRef.current?.focus()
  }

  const handleSubmit = async () => {
    if (!text.trim() || loading) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Prediction failed')
      }
      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setText('')
    setCharCount(0)
    setResult(null)
    setError(null)
    textareaRef.current?.focus()
  }

  const canSubmit = text.trim().length >= 5 && !loading

  return (
    <section ref={ref} id="demo" className="relative py-28 px-6">
      {/* Strong center glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.06), transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div
          className="text-center mb-14"
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
            Paste any Amazon review and receive a full sentiment, emotion, and helpfulness breakdown in real-time.
          </p>
        </div>

        {/* Example presets */}
        <div
          className="flex flex-wrap gap-2 mb-6 justify-center"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s' }}
        >
          {EXAMPLE_REVIEWS.map(ex => (
            <button
              key={ex.label}
              onClick={() => handlePreset(ex.text)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: `${ex.color}12`,
                border: `1px solid ${ex.color}30`,
                color: ex.color,
              }}
              data-hover
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Main two-column layout */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.3s' }}
        >
          {/* ─── Input column ─── */}
          <div className="flex flex-col gap-4">
            {/* Text input card */}
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
                      placeholder="Paste your Amazon review here...&#10;&#10;Try one of the preset examples above, or write your own. Press Ctrl+Enter to analyze."
                      className="w-full h-full bg-transparent text-ink font-mono text-sm resize-none p-4 placeholder-dim/50 leading-relaxed"
                    />
                    {/* Char counter visual */}
                    {charCount > 0 && (
                      <div className="absolute bottom-2 right-2 pointer-events-none">
                        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                          <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                          <circle
                            cx="16" cy="16" r="12" fill="none"
                            stroke={charCount > 4500 ? '#ef4444' : '#3b82f6'}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray={`${(charCount / 5000) * 75.4} 75.4`}
                            style={{ transition: 'stroke-dasharray 0.3s ease' }}
                          />
                        </svg>
                      </div>
                    )}
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
                  : 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.4)',
                color: canSubmit ? '#fff' : '#3b82f6',
                backgroundSize: '200% 100%',
                opacity: canSubmit ? 1 : 0.5,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                boxShadow: canSubmit ? '0 0 40px rgba(59,130,246,0.3)' : 'none',
              }}
            >
              {/* Shimmer on hover */}
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Analyzing Review...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>Analyze with SentimentIQ</span>
                    <span className="text-sm opacity-60 font-mono">(Ctrl+Enter)</span>
                  </>
                )}
              </div>
            </button>

            {/* Error */}
            {error && (
              <div className="rounded-xl p-4 text-sm font-mono text-red-400"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                ⚠ {error}
              </div>
            )}
          </div>

          {/* ─── Result column ─── */}
          <div className="min-h-[400px]">
            {!result && !loading && (
              <div className="glass rounded-2xl h-full flex flex-col items-center justify-center p-10 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-float"
                  style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <Sparkles size={28} className="text-accent" />
                </div>
                <h3 className="font-display text-xl font-bold text-ink mb-2">Ready to Analyze</h3>
                <p className="text-muted text-sm leading-relaxed max-w-xs">
                  Type or paste a review, choose a preset, and click Analyze to see multi-signal intelligence in action.
                </p>
                <div className="mt-6 flex flex-col gap-2 text-xs font-mono text-dim">
                  <div>→ Sentiment · Emotion · Valence</div>
                  <div>→ Helpfulness Score · Signals</div>
                  <div>→ SHAP Token Attribution</div>
                  <div>→ AI Narrative</div>
                </div>
              </div>
            )}

            {loading && (
              <div className="glass rounded-2xl h-full flex flex-col items-center justify-center p-10 text-center">
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-spin-slow" />
                  <div className="absolute inset-2 rounded-full border-2 border-accent/40 animate-spin-slow" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
                  <div className="absolute inset-4 rounded-full border-2 border-accent/60 animate-spin-slow" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain size={24} className="text-accent animate-pulse" />
                  </div>
                </div>
                <div className="font-display text-lg font-bold text-ink mb-1">Processing</div>
                <div className="text-sm text-muted font-mono">Running inference pipeline...</div>
                <div className="mt-4 flex gap-1">
                  {[0, 0.15, 0.3].map(d => (
                    <div key={d} className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                  ))}
                </div>
              </div>
            )}

            {result && !loading && <PredictionResult data={result} />}
          </div>
        </div>
      </div>
    </section>
  )
}
