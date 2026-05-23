'use client'

export default function AuroraBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Grid */}
      <div className="absolute inset-0 grid-bg opacity-100" />

      {/* Radial vignette */}
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, transparent 0%, #03040a 70%)' }} />

      {/* Aurora blobs */}
      <div
        className="absolute w-[900px] h-[600px] rounded-full animate-aurora"
        style={{
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)',
          top: '-20%', left: '-10%', filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute w-[700px] h-[500px] rounded-full animate-aurora-2"
        style={{
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.10) 0%, transparent 70%)',
          top: '10%', right: '-15%', filter: 'blur(70px)',
        }}
      />
      <div
        className="absolute w-[600px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.07) 0%, transparent 70%)',
          bottom: '20%', left: '30%', filter: 'blur(80px)',
          animation: 'aurora 18s ease-in-out 8s infinite',
        }}
      />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            background: i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#8b5cf6' : '#10b981',
            left: `${5 + (i * 4.7) % 90}%`,
            top: `${10 + (i * 6.3) % 80}%`,
            opacity: 0.15 + (i % 5) * 0.08,
            animation: `particle ${6 + (i % 4) * 2}s ease-in-out ${i * 0.4}s infinite`,
            filter: 'blur(0.5px)',
          }}
        />
      ))}

      {/* Scan line */}
      <div className="scanline" />

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 opacity-30"
        style={{ background: 'radial-gradient(circle at top left, rgba(59,130,246,0.3), transparent 70%)' }} />
      <div className="absolute top-0 right-0 w-32 h-32 opacity-20"
        style={{ background: 'radial-gradient(circle at top right, rgba(139,92,246,0.3), transparent 70%)' }} />
    </div>
  )
}
