'use client'

import { useScrollReveal } from '@/lib/hooks'

const EMOTIONS = [
  { label: 'Joy',         emoji: '😊', color: '#10b981', valence: +1.0,  desc: 'Happy · Excited · Grateful',   ring: 1   },
  { label: 'Surprise',    emoji: '😲', color: '#3b82f6', valence: +0.2,  desc: 'Unexpected · Novel · Impressed', ring: 2  },
  { label: 'Neutral',     emoji: '😐', color: '#8b5cf6', valence:  0.0,  desc: 'Balanced · Objective · Calm',   ring: 1   },
  { label: 'Fear',        emoji: '😨', color: '#6366f1', valence: -0.6,  desc: 'Worried · Unsafe · Anxious',    ring: 2   },
  { label: 'Frustration', emoji: '😤', color: '#f59e0b', valence: -0.7,  desc: 'Annoyed · Hassled · Stuck',     ring: 1   },
  { label: 'Sadness',     emoji: '😢', color: '#60a5fa', valence: -0.8,  desc: 'Let down · Regret · Disappointed', ring: 2 },
  { label: 'Disgust',     emoji: '🤢', color: '#84cc16', valence: -0.85, desc: 'Revolted · Repulsed · Appalled', ring: 1  },
  { label: 'Anger',       emoji: '😠', color: '#ef4444', valence: -0.9,  desc: 'Furious · Betrayed · Outraged',  ring: 2  },
]

export default function EmotionMapSection() {
  const { ref, visible } = useScrollReveal(0.1)

  return (
    <section ref={ref} id="features" className="relative py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div
          className="text-center mb-16"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          <div className="inline-block glass px-4 py-1.5 rounded-full mb-4">
            <span className="text-xs font-mono text-accent uppercase tracking-widest">Emotion Taxonomy</span>
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold text-ink">
            8-Class <span className="grad-text">Emotion</span> Model
          </h2>
          <p className="mt-4 text-muted text-lg max-w-xl mx-auto">
            Each review mapped to dominant emotion with valence score. Negative reviews are never monolithic — anger and sadness predict very different purchase behaviors.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {EMOTIONS.map((em, i) => (
            <div
              key={em.label}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : 'scale(0.9) translateY(20px)',
                transition: `all 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.08}s`,
              }}
            >
              <div
                className="glass rounded-2xl p-5 text-center group hover:scale-105 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden"
                style={{ borderColor: `${em.color}20` }}
                data-hover
              >
                {/* Glow bg */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                  style={{ background: `radial-gradient(circle at 50% 50%, ${em.color}0d, transparent 70%)` }}
                />

                <div className="text-4xl mb-3 group-hover:scale-125 transition-transform duration-500">{em.emoji}</div>
                <div className="font-display text-lg font-bold text-ink mb-1">{em.label}</div>
                <div className="text-xs text-muted leading-relaxed mb-3">{em.desc}</div>

                {/* Valence badge */}
                <div
                  className="inline-block px-2.5 py-1 rounded-full text-xs font-mono"
                  style={{ background: `${em.color}15`, color: em.color, border: `1px solid ${em.color}30` }}
                >
                  {em.valence > 0 ? '+' : ''}{em.valence.toFixed(2)}
                </div>

                {/* Valence bar */}
                <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="h-full rounded-full bar-fill"
                    style={{
                      width: `${Math.abs(em.valence) * 100}%`,
                      marginLeft: em.valence < 0 ? 'auto' : '0',
                      background: em.color,
                      boxShadow: `0 0 6px ${em.color}`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Valence spectrum */}
        <div
          className="mt-10 glass rounded-2xl p-6"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.8s' }}
        >
          <div className="text-xs font-mono text-muted mb-3 text-center uppercase tracking-widest">Valence Spectrum</div>
          <div className="relative h-3 rounded-full overflow-hidden mb-2"
            style={{ background: 'linear-gradient(90deg, #ef4444, #8b5cf6 50%, #10b981)' }}>
            {EMOTIONS.map(em => (
              <div
                key={em.label}
                className="absolute top-1/2 -translate-y-1/2 group cursor-default"
                style={{ left: `${((em.valence + 1) / 2) * 100}%` }}
                title={`${em.label}: ${em.valence}`}
              >
                <div
                  className="w-3 h-3 rounded-full border-2 border-panel -translate-x-1/2"
                  style={{ background: em.color, boxShadow: `0 0 6px ${em.color}` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs font-mono text-muted">
            <span>😠 Most Negative (-0.9)</span>
            <span>😐 Neutral (0.0)</span>
            <span>Most Positive (+1.0) 😊</span>
          </div>
        </div>
      </div>
    </section>
  )
}
