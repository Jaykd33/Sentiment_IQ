'use client'

import { useScrollReveal } from '@/lib/hooks'
import { ArrowRight } from 'lucide-react'

const PIPELINE_STEPS = [
  {
    step: '01', title: 'Text Cleaning',
    desc: 'Regex + NLTK TextCleaner expands contractions, strips HTML/URLs, preserves negation & sentiment punctuation.',
    tag: 'TextCleaner', color: '#3b82f6',
  },
  {
    step: '02', title: 'Tokenization',
    desc: 'DistilBERT WordPiece tokenizer. Max 128 tokens with truncation and dynamic padding.',
    tag: 'AutoTokenizer', color: '#8b5cf6',
  },
  {
    step: '03', title: 'Sentiment Inference',
    desc: 'Fine-tuned DistilBERT 3-class classifier. Softmax probabilities for Positive / Neutral / Negative.',
    tag: 'DistilBERT', color: '#10b981',
  },
  {
    step: '04', title: 'Emotion Detection',
    desc: 'Hartmann DistilRoBERTa model. 8-class emotion with valence score in [-1, +1] range.',
    tag: 'DistilRoBERTa', color: '#f59e0b',
  },
  {
    step: '05', title: 'SHAP Explainability',
    desc: 'Text masker SHAP values. Token-level attribution showing which words push or pull each prediction.',
    tag: 'SHAP', color: '#06b6d4',
  },
  {
    step: '06', title: 'Helpfulness Score',
    desc: 'Feature-engineered heuristic using word count, numbers, contrast cues, uppercase ratio.',
    tag: 'Heuristics', color: '#ec4899',
  },
]

export default function PipelineSection() {
  const { ref, visible } = useScrollReveal(0.1)
  return (
    <section ref={ref} className="relative py-28 px-6">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute right-0 top-1/4 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.05), transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="max-w-5xl mx-auto">
        <div
          className="text-center mb-16"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          <div className="inline-block glass px-4 py-1.5 rounded-full mb-4">
            <span className="text-xs font-mono text-accent uppercase tracking-widest">Architecture</span>
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold text-ink">
            Inference <span className="grad-text">Pipeline</span>
          </h2>
          <p className="mt-4 text-muted text-lg max-w-xl mx-auto">End-to-end: raw review text → multi-signal intelligence in under 500ms.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PIPELINE_STEPS.map((step, i) => (
            <div
              key={step.step}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : 'translateY(40px)',
                transition: `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.1}s`,
              }}
            >
              <div
                className="glass rounded-2xl p-6 h-full group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden"
                style={{ borderColor: `${step.color}20` }}
                data-hover
              >
                {/* Step number (large background) */}
                <div
                  className="absolute top-3 right-4 font-display text-7xl font-bold opacity-[0.04] select-none group-hover:opacity-[0.07] transition-opacity duration-500"
                  style={{ color: step.color }}
                >
                  {step.step}
                </div>
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${step.color}0a, transparent 70%)` }}
                />

                <div className="relative z-10">
                  <div
                    className="inline-flex px-2.5 py-1 rounded-md text-xs font-mono mb-4"
                    style={{ background: `${step.color}15`, color: step.color, border: `1px solid ${step.color}30` }}
                  >
                    {step.tag}
                  </div>
                  <h3 className="font-display text-xl font-bold text-ink mb-2">{step.step} · {step.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Flow arrow diagram */}
        <div
          className="mt-12 glass rounded-2xl p-6 overflow-x-auto"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.7s' }}
        >
          <div className="flex items-center gap-2 min-w-max mx-auto justify-center">
            {PIPELINE_STEPS.map((s, i) => (
              <div key={s.step} className="flex items-center gap-2">
                <div
                  className="px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap"
                  style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30` }}
                >
                  {s.tag}
                </div>
                {i < PIPELINE_STEPS.length - 1 && <ArrowRight size={14} className="text-dim flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
