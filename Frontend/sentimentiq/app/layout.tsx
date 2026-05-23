import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SentimentIQ — Advanced Amazon Review Intelligence',
  description: 'Real-time emotion-aware sentiment analysis for Amazon reviews. Powered by DistilBERT, SHAP, and emotion models.',
  keywords: ['sentiment analysis', 'NLP', 'AI', 'Amazon reviews', 'emotion detection'],
  openGraph: {
    title: 'SentimentIQ v2',
    description: 'Advanced Emotion-Aware Amazon Review Analysis',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="noise">{children}</body>
    </html>
  )
}
