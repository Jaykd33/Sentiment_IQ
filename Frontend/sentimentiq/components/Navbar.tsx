'use client'

import { useEffect, useState } from 'react'
import { Github, ExternalLink } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Demo',       href: '#demo'     },
  { label: 'Pipeline',   href: '#pipeline' },
  { label: 'Metrics',    href: '#metrics'  },
  { label: 'Features',   href: '#features' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const ids = NAV_LINKS.map(l => l.href.slice(1))
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id) })
    }, { threshold: 0.4 })
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(3,4,10,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(26,38,64,0.6)' : '1px solid transparent',
      }}
    >
      {/* Logo */}
      <a href="/" className="flex items-center gap-2" data-hover>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #8b5cf6)', boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}
        >
          <span className="text-white font-display font-bold text-sm">S</span>
        </div>
        <span className="font-display font-bold text-lg text-ink">
          Sentiment<span className="text-accent">IQ</span>
        </span>
        <span className="text-xs font-mono text-muted bg-white/5 px-1.5 py-0.5 rounded">v2</span>
      </a>

      {/* Links */}
      <div className="hidden md:flex items-center gap-1">
        {NAV_LINKS.map(link => (
          <a
            key={link.label}
            href={link.href}
            data-hover
            className="px-3 py-1.5 rounded-lg text-sm font-mono transition-all duration-300"
            style={{
              color: activeSection === link.href.slice(1) ? '#e2eaf8' : '#6b7fa3',
              background: activeSection === link.href.slice(1) ? 'rgba(59,130,246,0.1)' : 'transparent',
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* CTA */}
      <div className="flex items-center gap-3">
        <a
          href="https://kaggle.com"
          target="_blank"
          rel="noopener noreferrer"
          data-hover
          className="hidden md:flex items-center gap-1.5 text-xs font-mono text-muted hover:text-ink transition-colors"
        >
          <ExternalLink size={12} />
          Kaggle
        </a>
        <a
          href="#demo"
          data-hover
          className="px-4 py-2 rounded-lg text-sm font-mono font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
            boxShadow: '0 0 20px rgba(59,130,246,0.25)',
          }}
        >
          Try Demo
        </a>
      </div>
    </nav>
  )
}
