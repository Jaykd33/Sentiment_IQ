/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-clash)', 'sans-serif'],
        body: ['var(--font-satoshi)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      colors: {
        void: '#03040a',
        surface: '#080c18',
        panel: '#0d1425',
        border: '#1a2640',
        'border-light': '#243553',
        ink: '#e2eaf8',
        muted: '#6b7fa3',
        dim: '#3d5070',
        positive: '#10b981',
        'positive-glow': '#34d399',
        negative: '#ef4444',
        'negative-glow': '#f87171',
        neutral: '#8b5cf6',
        'neutral-glow': '#a78bfa',
        accent: '#3b82f6',
        'accent-glow': '#60a5fa',
        amber: '#f59e0b',
        'amber-glow': '#fbbf24',
        plasma: '#06b6d4',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        aurora: 'aurora 12s ease-in-out infinite',
        'aurora-2': 'aurora 15s ease-in-out 4s infinite',
        'data-flow': 'dataFlow 3s linear infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        orbit: 'orbit 12s linear infinite',
        'orbit-reverse': 'orbit 18s linear reverse infinite',
        particle: 'particle 8s ease-in-out infinite',
        scan: 'scan 3s ease-in-out infinite',
        glitch: 'glitch 4s ease-in-out infinite',
        'border-flow': 'borderFlow 3s linear infinite',
        breathe: 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-12px) rotate(1deg)' },
          '66%': { transform: 'translateY(-6px) rotate(-1deg)' },
        },
        aurora: {
          '0%, 100%': { transform: 'translate(-10%, -10%) scale(1)', opacity: '0.4' },
          '25%': { transform: 'translate(5%, -20%) scale(1.1)', opacity: '0.6' },
          '50%': { transform: 'translate(10%, 5%) scale(0.9)', opacity: '0.3' },
          '75%': { transform: 'translate(-5%, 10%) scale(1.05)', opacity: '0.5' },
        },
        dataFlow: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(120px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(120px) rotate(-360deg)' },
        },
        particle: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.6' },
          '25%': { transform: 'translate(30px, -40px) scale(1.2)', opacity: '1' },
          '50%': { transform: 'translate(-20px, -80px) scale(0.8)', opacity: '0.4' },
          '75%': { transform: 'translate(40px, -50px) scale(1.1)', opacity: '0.8' },
        },
        scan: {
          '0%, 100%': { transform: 'translateY(-100%)', opacity: '0' },
          '10%, 90%': { opacity: '1' },
          '50%': { transform: 'translateY(100vh)', opacity: '1' },
        },
        glitch: {
          '0%, 90%, 100%': { transform: 'translate(0)', clipPath: 'none' },
          '92%': { transform: 'translate(-2px, 1px)', clipPath: 'polygon(0 30%, 100% 30%, 100% 50%, 0 50%)' },
          '94%': { transform: 'translate(2px, -1px)', clipPath: 'polygon(0 60%, 100% 60%, 100% 75%, 0 75%)' },
          '96%': { transform: 'translate(-1px, 2px)', clipPath: 'none' },
        },
        borderFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        breathe: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59,130,246,0.2)' },
          '50%': { boxShadow: '0 0 60px rgba(59,130,246,0.5), 0 0 100px rgba(59,130,246,0.2)' },
        },
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)`,
        'radial-fade': 'radial-gradient(ellipse at center, transparent 0%, #03040a 70%)',
      },
      backgroundSize: {
        grid: '60px 60px',
      },
    },
  },
  plugins: [],
}
