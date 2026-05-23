'use client'

import dynamic from 'next/dynamic'
import AuroraBackground from '@/components/AuroraBackground'
import HeroSection from '@/components/HeroSection'
import DemoSection from '@/components/DemoSection'
import StatsSection from '@/components/StatsSection'
import FeaturesSection from '@/components/FeaturesSection'
import EmotionMapSection from '@/components/EmotionMapSection'
import Footer from '@/components/Footer'

// Lazy-load heavy components
const Navbar        = dynamic(() => import('@/components/Navbar'),        { ssr: false })
const CustomCursor  = dynamic(() => import('@/components/CustomCursor'),  { ssr: false })
const PipelineSection = dynamic(() => import('@/components/PipelineSection'), { ssr: true })

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-void overflow-x-hidden">
      {/* Global background */}
      <AuroraBackground />

      {/* Custom cursor (desktop only) */}
      <CustomCursor />

      {/* Navigation */}
      <Navbar />

      {/* ─── Sections ─── */}
      <div className="relative z-10">
        {/* Hero */}
        <HeroSection />

        {/* Demo playground */}
        <div id="demo">
          <DemoSection />
        </div>

        {/* Divider */}
        <div className="h-px max-w-5xl mx-auto" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)' }} />

        {/* Stats / model performance */}
        <div id="metrics">
          <StatsSection />
        </div>

        {/* Divider */}
        <div className="h-px max-w-5xl mx-auto" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)' }} />

        {/* Pipeline architecture */}
        <div id="pipeline">
          <PipelineSection />
        </div>

        {/* Divider */}
        <div className="h-px max-w-5xl mx-auto" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)' }} />

        {/* Emotion taxonomy */}
        <EmotionMapSection />

        {/* Divider */}
        <div className="h-px max-w-5xl mx-auto" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)' }} />

        {/* Features */}
        <FeaturesSection />

        {/* Footer */}
        <Footer />
      </div>
    </main>
  )
}
