'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Cpu, Zap, Brain } from 'lucide-react'

const DEMO_TEXTS = [
  'Amazing battery life and build quality. Best purchase this year!',
  'Absolute garbage. Broke after 2 days. Customer service ignored me.',
  'Delivery was slow but quality is okay. Mixed feelings overall.',
  'Cannot believe how good this is. Exceeded every expectation!',
]

export default function HeroSection() {
  const [typed, setTyped]       = useState('')
  const [textIdx, setTextIdx]   = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [mounted, setMounted]   = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    const target = DEMO_TEXTS[textIdx]
    const speed  = deleting ? 25 : 55

    const timer = setTimeout(() => {
      if (!deleting) {
        if (typed.length < target.length) {
          setTyped(target.slice(0, typed.length + 1))
        } else {
          setTimeout(() => setDeleting(true), 2400)
        }
      } else {
        if (typed.length > 0) {
          setTyped(typed.slice(0, -1))
        } else {
          setDeleting(false)
          setTextIdx((i) => (i + 1) % DEMO_TEXTS.length)
        }
      }
    }, speed)

    return () => clearTimeout(timer)
  }, [typed, deleting, textIdx, mounted])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16">
      {/* Orbital rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="absolute rounded-full border border-blue-500/10"
          style={{ width: '600px', height: '600px', animation: 'spin 30s linear infinite' }}
        />
        <div
          className="absolute rounded-full border border-purple-500/8"
          style={{ width: '800px', height: '800px', animation: 'spin 45s linear reverse infinite' }}
        />
        <div
          className="absolute rounded-full border border-emerald-500/6"
          style={{ width: '1000px', height: '1000px', animation: 'spin 60s linear infinite' }}
        />
        {/* Orbiting dots */}
        <div className="absolute" style={{ width: '600px', height: '600px' }}>
          <div
            className="absolute w-2 h-2 bg-blue-500 rounded-full"
            style={{ top: '-4px', left: '50%', transform: 'translateX(-50%)', boxShadow: '0 0 10px #3b82f6', animation: 'orbit 12s linear infinite' }}
          />
          <div
            className="absolute w-1.5 h-1.5 bg-purple-400 rounded-full"
            style={{ top: '-3px', left: '50%', transform: 'translateX(-50%)', boxShadow: '0 0 8px #8b5cf6', animation: 'orbit 18s linear reverse infinite' }}
          />
        </div>
      </div>

      {/* Badge */}
      <div
        className="relative z-10 mb-8 animated-border rounded-full"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-20px)', transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <div className="glass px-5 py-2 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-sm font-mono text-muted tracking-widest uppercase">v2.0 · Live Intelligence</span>
        </div>
      </div>

      {/* Main heading */}
      <div
        className="relative z-10 text-center max-w-5xl"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(30px)', transition: 'all 1s cubic-bezier(0.22, 1, 0.36, 1) 0.2s' }}
      >
        <h1 className="font-display text-7xl md:text-9xl font-bold leading-none tracking-tight mb-6">
          <span className="text-ink">Sentiment</span>
          <span className="grad-text">IQ</span>
        </h1>
        <p className="text-muted text-xl md:text-2xl font-body max-w-2xl mx-auto leading-relaxed">
          Emotion-aware intelligence for Amazon reviews.{' '}
          <span className="text-ink">DistilBERT</span> + <span className="text-ink">Emotion Models</span> + <span className="text-ink">SHAP Explainability</span>.
        </p>
      </div>

      {/* Typewriter demo */}
      <div
        className="relative z-10 mt-12 w-full max-w-2xl"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.5s' }}
      >
        <div className="glass rounded-2xl p-1 animated-border">
          <div className="bg-panel rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <span className="ml-2 text-xs font-mono text-muted">review_input.txt</span>
            </div>
            <p className="font-mono text-base text-ink min-h-[48px]">
              <span className="text-muted mr-2">›</span>
              {typed}
              <span className="typewriter-cursor inline-block w-0.5 h-4 bg-blue-400 ml-0.5 align-middle animate-pulse" />
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div
        className="relative z-10 mt-14 grid grid-cols-3 gap-6 md:gap-12"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.8s' }}
      >
        {[
          { icon: Brain, label: 'Model', value: 'DistilBERT', sub: '66M params' },
          { icon: Zap, label: 'Accuracy', value: '91%+', sub: 'Test F1-weighted' },
          { icon: Cpu, label: 'Classes', value: '3+8', sub: 'Sentiment · Emotion' },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="text-center">
            <div className="flex justify-center mb-2">
              <Icon size={18} className="text-accent" />
            </div>
            <div className="font-display text-2xl md:text-3xl font-bold text-ink">{value}</div>
            <div className="text-xs text-muted mt-0.5 font-mono">{sub}</div>
          </div>
        ))}
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-50 animate-bounce">
        <span className="text-xs font-mono text-muted tracking-widest">SCROLL</span>
        <ChevronDown size={16} className="text-muted" />
      </div>
    </section>
  )
}
