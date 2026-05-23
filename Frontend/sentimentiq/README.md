# 🧠 SentimentIQ v2 — Advanced Amazon Review Intelligence

A production-grade, emotion-aware sentiment analysis UI built with **Next.js 14**, deployed on **Vercel**.

## ✨ Features

- 🎯 **3-class sentiment** (Positive / Neutral / Negative) via fine-tuned DistilBERT
- 😊 **8-class emotion detection** (Joy, Anger, Sadness, Frustration, Surprise, Fear, Disgust, Neutral)
- 📊 **Valence scoring** in [-1, +1] range
- 💡 **SHAP token attribution** — know WHY the model predicted what it predicted
- 📈 **Helpfulness prediction** — estimate if a review will be rated helpful by readers
- 🎨 **Premium UI** — aurora background, custom cursor, scroll reveal, animated counters

## 🚀 Deploy to Vercel in 60 seconds

### Option 1: Vercel CLI (recommended)
```bash
npm i -g vercel
cd sentimentiq
npm install
vercel
```

### Option 2: GitHub + Vercel Dashboard
1. Push this folder to a GitHub repo
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repo
4. Click **Deploy** — Vercel auto-detects Next.js

### Option 3: One-click deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/sentimentiq)

## 🔧 Local development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## 🧠 Connecting your real Kaggle model

The `/api/predict` route currently uses a **lexicon-based proxy** for demo purposes.

To connect your actual trained DistilBERT + emotion models:

### Option A: FastAPI sidecar (recommended for Vercel Pro)
1. Deploy your Kaggle models to a FastAPI server (Railway, Render, HuggingFace Spaces)
2. In `app/api/predict/route.ts`, replace `inferSentiment()` with:
```ts
const res = await fetch('https://your-api.railway.app/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text })
})
return NextResponse.json(await res.json())
```

### Option B: HuggingFace Inference API
```ts
const res = await fetch(
  'https://api-inference.huggingface.co/models/distilbert-base-uncased',
  { headers: { Authorization: `Bearer ${process.env.HF_TOKEN}` }, ... }
)
```

### Option C: Vercel AI SDK with local model
Use `@vercel/ai` with an edge-compatible ONNX runtime.

## 📁 Project structure

```
sentimentiq/
├── app/
│   ├── api/predict/route.ts   ← Inference API endpoint
│   ├── globals.css             ← All animations + custom styles
│   ├── layout.tsx
│   └── page.tsx               ← Main page assembly
├── components/
│   ├── AuroraBackground.tsx   ← Animated bg particles + aurora
│   ├── CustomCursor.tsx       ← Smooth custom cursor
│   ├── DemoSection.tsx        ← Interactive playground
│   ├── EmotionMapSection.tsx  ← 8-class emotion taxonomy
│   ├── FeaturesSection.tsx    ← Feature cards
│   ├── Footer.tsx
│   ├── HeroSection.tsx        ← Typewriter hero
│   ├── Navbar.tsx
│   ├── PipelineSection.tsx    ← Architecture cards
│   ├── PredictionResult.tsx   ← Result display with animations
│   └── StatsSection.tsx       ← Animated stat counters
├── lib/
│   └── hooks.ts               ← useScrollReveal, useCountUp
├── vercel.json
└── tailwind.config.js
```

## 🎨 Design system

| Token | Value |
|-------|-------|
| Background | `#03040a` (void) |
| Surface | `#080c18` |
| Panel | `#0d1425` |
| Accent | `#3b82f6` (blue) |
| Positive | `#10b981` (emerald) |
| Negative | `#ef4444` (red) |
| Neutral | `#8b5cf6` (purple) |
| Font Display | Clash Display |
| Font Body | Satoshi |
| Font Mono | JetBrains Mono |
