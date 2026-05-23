'use client'

import { useScrollReveal } from '@/lib/hooks'
import { Brain, TrendingUp, Lightbulb, Shield, BarChart3, Cpu } from 'lucide-react'

const FEATURES = [
  {
    icon: Brain,
    title: 'DistilBERT Fine-Tuning',
    description: '66M parameter transformer fine-tuned on 50K balanced Amazon reviews. 91%+ accuracy across 3 sentiment classes with efficient inference.',
    color: '#3b82f6',
    tag: 'Core Model',
  },
  {
    icon: TrendingUp,
    title: 'Emotion-Aware Scoring',
    description: '8-class emotion detection (joy, anger, sadness, frustration, etc.) with valence scoring in [-1, +1] range. Adjusts confidence based on emotion alignment.',
    color: '#10b981',
    tag: 'Unique Feature',
  },
  {
    icon: Lightbulb,
    title: 'SHAP Explainability',
    description: 'Token-level SHAP attributions show exactly which words drove the prediction. Text masker with 300+ evaluations per review.',
    color: '#f59e0b',
    tag: 'XAI',
  },
  {
    icon: BarChart3,
    title: 'Helpfulness Prediction',
    description: 'Proprietary heuristic combining word count, factual signals, contrast language, and stylistic markers to predict if a review will be rated helpful.',
    color: '#8b5cf6',
    tag: 'Novel Signal',
  },
  {
    icon: Shield,
    title: 'Balanced Dataset Engineering',
    description: '50K reviews sampled equally from Negative / Neutral / Positive to prevent class imbalance. Engineered 7+ features including uppercase ratio and helpfulness ratio.',
    color: '#ec4899',
    tag: 'Data Quality',
  },
  {
    icon: Cpu,
    title: 'Kaggle-Native & Safe',
    description: 'Zero ABI conflicts. No spaCy, no pinned scientific stack, no trust_remote_code. Runs end-to-end on free Kaggle T4 GPU in under 30 minutes.',
    color: '#06b6d4',
    tag: 'Engineering',
  },
]

export default function FeaturesSection() {
  const { ref, visible } = useScrollReveal(0.1)
  return (
    <section ref={ref} className="relative py-28 px-6">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-0 top-1/3 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.06), transparent 70%)', filter: 'blur(70px)' }} />
      </div>

      <div className="max-w-5xl mx-auto">
        <div
          className="text-center mb-16"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          <div className="inline-block glass px-4 py-1.5 rounded-full mb-4">
            <span className="text-xs font-mono text-accent uppercase tracking-widest">Capabilities</span>
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold text-ink">
            What Makes It <span className="grad-text">Different</span>
          </h2>
          <p className="mt-4 text-muted text-lg max-w-xl mx-auto">Beyond basic sentiment — a multi-signal intelligence system for real-world review analysis.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon
            return (
              <div
                key={feat.title}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'none' : 'translateY(50px)',
                  transition: `all 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.12}s`,
                }}
              >
                <div
                  className="glass rounded-2xl p-6 h-full group hover:-translate-y-1 hover:scale-[1.01] transition-all duration-500 relative overflow-hidden"
                  data-hover
                >
                  {/* Hover top border glow */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(90deg, transparent, ${feat.color}, transparent)` }}
                  />

                  {/* Tag */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                      style={{ background: `${feat.color}15`, border: `1px solid ${feat.color}30` }}
                    >
                      <Icon size={18} style={{ color: feat.color }} />
                    </div>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded-md"
                      style={{ background: `${feat.color}10`, color: feat.color, border: `1px solid ${feat.color}20` }}
                    >
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-ink mb-2">{feat.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{feat.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
