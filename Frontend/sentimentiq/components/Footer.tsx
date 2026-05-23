'use client'

import { useScrollReveal } from '@/lib/hooks'

const TECH_STACK = [
  { name: 'DistilBERT', desc: '3-class sentiment' },
  { name: 'DistilRoBERTa', desc: '8-class emotion' },
  { name: 'SHAP', desc: 'Token attribution' },
  { name: 'HuggingFace', desc: 'Transformers' },
  { name: 'Next.js 14', desc: 'React framework' },
  { name: 'Tailwind CSS', desc: 'Styling' },
  { name: 'Framer Motion', desc: 'Animations' },
  { name: 'kagglehub', desc: 'Data pipeline' },
]

export default function Footer() {
  const { ref, visible } = useScrollReveal(0.1)
  return (
    <footer ref={ref} className="relative py-20 px-6 border-t border-border">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-96 h-48 rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.05), transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Logo & tagline */}
        <div
          className="text-center mb-14"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          <div className="font-display text-4xl font-bold mb-3">
            <span className="text-ink">Sentiment</span>
            <span className="grad-text">IQ</span>
          </div>
          <p className="text-muted text-sm font-mono">Advanced Emotion-Aware Amazon Review Intelligence</p>
        </div>

        {/* Tech stack grid */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-14"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s' }}
        >
          {TECH_STACK.map((t, i) => (
            <div
              key={t.name}
              className="glass rounded-xl px-4 py-3 text-center group hover:scale-105 transition-transform duration-300"
              style={{ transitionDelay: `${i * 0.05}s` }}
            >
              <div className="font-mono text-sm text-ink group-hover:text-accent transition-colors">{t.name}</div>
              <div className="text-xs text-muted mt-0.5">{t.desc}</div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border/50"
          style={{ opacity: visible ? 1 : 0, transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.4s' }}
        >
          <p className="text-xs font-mono text-dim">
            Dataset: <a href="https://www.kaggle.com/datasets/arhamrumi/amazon-product-reviews" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent transition-colors">arhamrumi/amazon-product-reviews</a>
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-mono text-muted">SentimentIQ v2.0 · Built with Next.js on Vercel</span>
          </div>
          <p className="text-xs font-mono text-dim">14 Pipeline Stages · 50K Training Reviews</p>
        </div>
      </div>
    </footer>
  )
}
