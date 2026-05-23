'use client'

import { useScrollReveal, useCountUp } from '@/lib/hooks'

const STATS = [
  { value: 50000, suffix: 'K', label: 'Training Reviews', description: 'Balanced across 3 sentiment classes', color: '#3b82f6' },
  { value: 91,    suffix: '%', label: 'Test Accuracy',     description: 'DistilBERT fine-tuned F1-weighted', color: '#10b981' },
  { value: 8,     suffix: '',  label: 'Emotion Classes',   description: 'Joy · Anger · Sadness · Frustration + 4 more', color: '#a78bfa' },
  { value: 14,    suffix: '',  label: 'Pipeline Stages',   description: 'From raw text to explained prediction', color: '#f59e0b' },
]

function StatCard({ value, suffix, label, description, color, visible }: {
  value: number; suffix: string; label: string; description: string; color: string; visible: boolean
}) {
  const count = useCountUp(value, 1400, visible)
  return (
    <div
      className="glass rounded-2xl p-6 text-center group hover:scale-105 transition-transform duration-500"
      style={{ borderColor: `${color}20` }}
      data-hover
    >
      <div
        className="font-display text-6xl font-bold mb-2 transition-all duration-300 group-hover:scale-110"
        style={{ color, textShadow: `0 0 30px ${color}60` }}
      >
        <span className="stat-value">{count}</span>
        <span className="text-3xl">{suffix}</span>
      </div>
      <div className="font-display text-base font-semibold text-ink mb-1">{label}</div>
      <div className="text-xs text-muted font-mono leading-relaxed">{description}</div>
      <div
        className="mt-4 h-0.5 w-0 group-hover:w-full transition-all duration-700 mx-auto rounded-full"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
    </div>
  )
}

export default function StatsSection() {
  const { ref, visible } = useScrollReveal()
  return (
    <section ref={ref} className="relative py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div
          className="text-center mb-16"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          <div className="inline-block glass px-4 py-1.5 rounded-full mb-4">
            <span className="text-xs font-mono text-accent uppercase tracking-widest">By the numbers</span>
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold text-ink">
            Model <span className="grad-text">Performance</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(40px)', transition: `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.1 + 0.2}s` }}
            >
              <StatCard {...s} visible={visible} />
            </div>
          ))}
        </div>

        {/* Model comparison table */}
        <div
          className="mt-12 glass rounded-2xl overflow-hidden"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.6s' }}
        >
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-sm text-muted">model_comparison.json</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-mono text-muted uppercase tracking-wider">Model</th>
                  <th className="text-center px-4 py-3 text-xs font-mono text-muted uppercase tracking-wider">Accuracy</th>
                  <th className="text-center px-4 py-3 text-xs font-mono text-muted uppercase tracking-wider">F1 Macro</th>
                  <th className="text-center px-4 py-3 text-xs font-mono text-muted uppercase tracking-wider">F1 Weighted</th>
                  <th className="text-center px-4 py-3 text-xs font-mono text-muted uppercase tracking-wider">AUC-ROC</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { model: 'Naive Bayes (TF-IDF)', acc: '82.1%', f1m: '80.4%', f1w: '81.2%', auc: '91.3%', highlight: false },
                  { model: 'Logistic Regression (TF-IDF)', acc: '87.4%', f1m: '86.1%', f1w: '87.0%', auc: '95.1%', highlight: false },
                  { model: 'DistilBERT (fine-tuned)', acc: '91.3%', f1m: '90.8%', f1w: '91.1%', auc: '—', highlight: true },
                ].map(({ model, acc, f1m, f1w, auc, highlight }) => (
                  <tr
                    key={model}
                    className="border-b border-border/50 transition-colors hover:bg-white/[0.02]"
                    style={highlight ? { background: 'rgba(16,185,129,0.04)' } : {}}
                  >
                    <td className="px-6 py-4 font-mono text-sm text-ink flex items-center gap-2">
                      {highlight && <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />}
                      {model}
                    </td>
                    {[acc, f1m, f1w, auc].map((v, i) => (
                      <td key={i} className="px-4 py-4 text-center font-mono text-sm" style={{ color: highlight ? '#10b981' : '#e2eaf8' }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
