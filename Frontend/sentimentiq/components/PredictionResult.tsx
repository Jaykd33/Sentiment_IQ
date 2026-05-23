'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle, XCircle, MinusCircle, Heart, Zap, BarChart3, MessageSquare, Clock } from 'lucide-react'

interface PredictionData {
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  adj_confidence: number
  probabilities: { positive: number; negative: number; neutral: number }
  emotion: string
  emotion_emoji: string
  valence: number
  helpfulness: {
    score: number
    tendency: 'high' | 'medium' | 'low'
    label: string
    signals: {
      word_count: number
      has_numbers: boolean
      has_contrast: boolean
      has_exclaim: boolean
      uppercase_ratio: number
    }
  }
  narrative: string
  top_tokens: Array<{ token: string; score: number; direction: 'positive' | 'negative' }>
  processing_ms: number
}

const SENTIMENT_CONFIG = {
  positive: {
    icon: CheckCircle,
    color: '#10b981',
    glow: 'rgba(16,185,129,0.3)',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.25)',
    label: 'POSITIVE',
    gradient: 'from-emerald-500/20 to-emerald-900/5',
  },
  negative: {
    icon: XCircle,
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.3)',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    label: 'NEGATIVE',
    gradient: 'from-red-500/20 to-red-900/5',
  },
  neutral: {
    icon: MinusCircle,
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.3)',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.25)',
    label: 'NEUTRAL',
    gradient: 'from-purple-500/20 to-purple-900/5',
  },
}

function AnimatedBar({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value * 100), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-full rounded-full bar-fill"
        style={{ width: `${width}%`, background: color, boxShadow: `0 0 8px ${color}` }}
      />
    </div>
  )
}

function TokenChip({ token, score }: { token: string; score: number }) {
  const isPos = score > 0
  const intensity = Math.min(Math.abs(score) / 2, 1)
  const bg = isPos
    ? `rgba(16,185,129,${0.1 + intensity * 0.2})`
    : `rgba(239,68,68,${0.1 + intensity * 0.2})`
  const border = isPos ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'
  const color  = isPos ? '#34d399' : '#f87171'
  return (
    <span
      className="inline-block px-2.5 py-1 rounded-md text-xs font-mono mr-1.5 mb-1.5 transition-all duration-300 hover:scale-110 cursor-default"
      style={{ background: bg, border: `1px solid ${border}`, color }}
      title={`Score: ${score.toFixed(2)}`}
    >
      {token}
    </span>
  )
}

export default function PredictionResult({ data }: { data: PredictionData }) {
  const cfg = SENTIMENT_CONFIG[data.sentiment]
  const SentIcon = cfg.icon
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(30px) scale(0.98)'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1)'
        el.style.opacity = '1'
        el.style.transform = 'translateY(0) scale(1)'
      })
    })
  }, [data])

  const helpColor = data.helpfulness.tendency === 'high' ? '#10b981'
    : data.helpfulness.tendency === 'medium' ? '#f59e0b' : '#ef4444'

  return (
    <div ref={containerRef} className="space-y-4">

      {/* ─── Main sentiment card ─── */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${cfg.bg} 0%, rgba(8,12,24,0.9) 100%)`,
          border: `1px solid ${cfg.border}`,
          boxShadow: `0 0 60px ${cfg.glow}, inset 0 1px 0 ${cfg.border}`,
        }}
      >
        {/* Animated corner glow */}
        <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
          style={{ background: `radial-gradient(circle at top right, ${cfg.glow}, transparent 70%)` }} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative pulse-ring" style={{ color: cfg.color }}>
                <SentIcon size={36} style={{ color: cfg.color, filter: `drop-shadow(0 0 10px ${cfg.color})` }} />
              </div>
              <div>
                <div className="font-display text-4xl font-bold" style={{ color: cfg.color }}>{cfg.label}</div>
                <div className="text-muted text-sm font-mono mt-0.5">{data.confidence * 100 >= 85 ? 'High confidence' : data.confidence * 100 >= 65 ? 'Moderate confidence' : 'Low confidence'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-5xl font-bold text-ink">{(data.confidence * 100).toFixed(1)}%</div>
              <div className="text-muted text-xs font-mono">raw confidence</div>
            </div>
          </div>

          {/* Probability bars */}
          <div className="space-y-3">
            {([
              { key: 'positive', color: '#10b981', label: 'Positive' },
              { key: 'neutral',  color: '#8b5cf6', label: 'Neutral'  },
              { key: 'negative', color: '#ef4444', label: 'Negative' },
            ] as const).map(({ key, color, label }, i) => (
              <div key={key}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs font-mono text-muted">{label}</span>
                  <span className="text-xs font-mono" style={{ color }}>{(data.probabilities[key] * 100).toFixed(1)}%</span>
                </div>
                <AnimatedBar value={data.probabilities[key]} color={color} delay={i * 150 + 200} />
              </div>
            ))}
          </div>

          {/* Adj confidence */}
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="text-xs font-mono text-muted">Emotion-calibrated confidence</div>
            <div className="font-mono text-sm" style={{ color: cfg.color }}>{(data.adj_confidence * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* ─── Emotion + Helpfulness row ─── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Emotion card */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={16} className="text-accent" />
            <span className="text-xs font-mono text-muted uppercase tracking-widest">Emotion</span>
          </div>
          <div className="text-4xl mb-2">{data.emotion_emoji}</div>
          <div className="font-display text-xl font-bold text-ink capitalize">{data.emotion}</div>

          {/* Valence meter */}
          <div className="mt-4">
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-mono text-muted">Negative</span>
              <span className="text-xs font-mono text-muted">Positive</span>
            </div>
            <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(90deg, #ef4444, #8b5cf6, #10b981)',
                opacity: 0.3,
              }} />
              <div
                className="absolute top-0 w-3 h-3 rounded-full -translate-y-0.5 -translate-x-1.5 transition-all duration-1000"
                style={{
                  left: `${((data.valence + 1) / 2) * 100}%`,
                  background: data.valence > 0.2 ? '#10b981' : data.valence < -0.2 ? '#ef4444' : '#8b5cf6',
                  boxShadow: `0 0 8px ${data.valence > 0.2 ? '#10b981' : data.valence < -0.2 ? '#ef4444' : '#8b5cf6'}`,
                }}
              />
            </div>
            <div className="text-center mt-1">
              <span className="text-xs font-mono text-muted">valence: <span className="text-ink">{data.valence > 0 ? '+' : ''}{data.valence.toFixed(2)}</span></span>
            </div>
          </div>
        </div>

        {/* Helpfulness card */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-accent" />
            <span className="text-xs font-mono text-muted uppercase tracking-widest">Helpfulness</span>
          </div>

          {/* Donut-like score */}
          <div className="relative w-16 h-16 mb-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle
                cx="32" cy="32" r="26" fill="none"
                stroke={helpColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${data.helpfulness.score * 163.4} 163.4`}
                style={{ filter: `drop-shadow(0 0 4px ${helpColor})`, transition: 'stroke-dasharray 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold font-mono" style={{ color: helpColor }}>
                {(data.helpfulness.score * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="text-sm font-mono" style={{ color: helpColor }}>{data.helpfulness.label}</div>

          {/* Signals */}
          <div className="mt-3 space-y-1.5">
            {[
              { label: 'Words', value: `${data.helpfulness.signals.word_count}` },
              { label: 'Numbers', value: data.helpfulness.signals.has_numbers ? '✓' : '✗' },
              { label: 'Contrast', value: data.helpfulness.signals.has_contrast ? '✓' : '✗' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-xs text-muted font-mono">{label}</span>
                <span className="text-xs font-mono text-ink">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Narrative card ─── */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={16} className="text-accent" />
          <span className="text-xs font-mono text-muted uppercase tracking-widest">AI Narrative</span>
        </div>
        <p className="text-ink font-body text-sm leading-relaxed">{data.narrative}</p>
      </div>

      {/* ─── Token contributions ─── */}
      {data.top_tokens.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-accent" />
            <span className="text-xs font-mono text-muted uppercase tracking-widest">Key Signal Words</span>
          </div>
          <div className="flex flex-wrap">
            {data.top_tokens.map((t, i) => (
              <TokenChip key={`${t.token}-${i}`} token={t.token} score={t.score} />
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs font-mono text-muted">
            <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-sm bg-emerald-500/60" /> positive signal</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-sm bg-red-500/60" /> negative signal</span>
          </div>
        </div>
      )}

      {/* ─── Footer timing ─── */}
      <div className="flex items-center justify-end gap-2 px-1">
        <Clock size={12} className="text-dim" />
        <span className="text-xs font-mono text-dim">Processed in {data.processing_ms}ms</span>
      </div>
    </div>
  )
}
