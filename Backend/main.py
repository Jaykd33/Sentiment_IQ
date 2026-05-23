# SENTIMENT_IQ/Backend/main.py

import os, re, time, pickle, io
import numpy as np
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
from huggingface_hub import hf_hub_download

# ── Config ─────────────────────────────────────────────────────────────────────
# Set these as environment variables in Railway dashboard
HF_USERNAME      = os.environ.get("HF_USERNAME", "YOUR_HF_USERNAME")
BERT_REPO        = f"{HF_USERNAME}/sentimentiq-distilbert"
SKLEARN_REPO     = f"{HF_USERNAME}/sentimentiq-sklearn"
DEVICE           = "cuda" if torch.cuda.is_available() else "cpu"
CLASS_NAMES      = ["negative", "neutral", "positive"]

print(f"Device: {DEVICE}")
print(f"Loading DistilBERT from HuggingFace: {BERT_REPO}")

# ── Load DistilBERT (downloads and caches automatically) ──────────────────────
tokenizer  = AutoTokenizer.from_pretrained(BERT_REPO)
bert_model = AutoModelForSequenceClassification.from_pretrained(BERT_REPO)
bert_model.eval()
bert_model.to(DEVICE)
print("DistilBERT loaded.")

# ── Load sklearn LR pipeline from HuggingFace ─────────────────────────────────
print("Downloading logistic regression pipeline...")
lr_path = hf_hub_download(
    repo_id=SKLEARN_REPO,
    filename="logistic_regression_pipeline.pkl",
    repo_type="dataset",
)
with open(lr_path, "rb") as f:
    lr_pipeline = pickle.load(f)
print("LR pipeline loaded.")

# ── Load emotion model ────────────────────────────────────────────────────────
print("Loading emotion model...")
emotion_pipe = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    top_k=None,
    device=0 if torch.cuda.is_available() else -1,
    truncation=True,
    max_length=512,
)
print("Emotion model loaded.")

# ── Label maps & metadata ──────────────────────────────────────────────────────
EMOTION_META = {
    "joy":         {"emoji": "😊", "valence":  1.00},
    "anger":       {"emoji": "😠", "valence": -0.90},
    "sadness":     {"emoji": "😢", "valence": -0.80},
    "frustration": {"emoji": "😤", "valence": -0.70},
    "surprise":    {"emoji": "😲", "valence":  0.20},
    "fear":        {"emoji": "😨", "valence": -0.60},
    "disgust":     {"emoji": "🤢", "valence": -0.85},
    "neutral":     {"emoji": "😐", "valence":  0.00},
}

RAW_LABEL_MAP = {
    "joy":"joy","anger":"anger","sadness":"sadness","fear":"fear",
    "disgust":"disgust","surprise":"surprise","neutral":"neutral",
    "annoyance":"frustration","disappointment":"sadness","optimism":"joy",
    "approval":"joy","disapproval":"frustration","confusion":"surprise",
    "caring":"joy","excitement":"joy","amusement":"joy","gratitude":"joy",
    "love":"joy","relief":"joy","grief":"sadness","remorse":"sadness",
    "curiosity":"surprise","nervousness":"fear","pride":"joy",
}

NARRATIVES = {
    "positive-joy":         "Reviewer is genuinely happy and fully satisfied.",
    "positive-surprise":    "Reviewer is pleasantly surprised — product exceeded expectations.",
    "positive-neutral":     "Reviewer is satisfied in a calm, measured, credible way.",
    "negative-anger":       "Reviewer is clearly angry — expressing strong dissatisfaction.",
    "negative-frustration": "Reviewer is frustrated, likely with usability or delivery.",
    "negative-sadness":     "Reviewer is disappointed — expectations were not met.",
    "negative-disgust":     "Reviewer feels strong repulsion toward the product.",
    "neutral-neutral":      "Reviewer gives a balanced, unemotional assessment.",
    "neutral-surprise":     "Reviewer is on the fence but something caught them off guard.",
}

# ── FastAPI ───────────────────────────────────────────────────────────────────
app = FastAPI(title="SentimentIQ API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReviewRequest(BaseModel):
    text: str

# ── Helpers ───────────────────────────────────────────────────────────────────
def uppercase_ratio(text: str) -> float:
    alpha = [c for c in text if c.isalpha()]
    if not alpha: return 0.0
    return sum(c.isupper() for c in alpha) / len(alpha)

@torch.no_grad()
def run_sentiment(text: str) -> dict:
    enc  = tokenizer(text, return_tensors="pt", truncation=True,
                     max_length=128, padding=True).to(DEVICE)
    out  = bert_model(**enc)
    prob = torch.softmax(out.logits, dim=-1).squeeze().cpu().numpy()
    pid  = int(np.argmax(prob))
    return {
        "label":         CLASS_NAMES[pid],
        "label_id":      pid,
        "confidence":    float(prob[pid]),
        "probabilities": {c: float(p) for c, p in zip(CLASS_NAMES, prob)},
    }

def run_emotion(text: str) -> dict:
    EMOTIONS = list(EMOTION_META.keys())
    raw      = emotion_pipe(text[:512])[0]
    scores   = {e: 0.0 for e in EMOTIONS}
    for item in raw:
        mapped = RAW_LABEL_MAP.get(item["label"].lower(), "neutral")
        scores[mapped] = max(scores[mapped], item["score"])
    total    = sum(scores.values()) or 1.0
    scores   = {k: round(v / total, 5) for k, v in scores.items()}
    dominant = max(scores, key=scores.get)
    valence  = sum(scores[e] * EMOTION_META[e]["valence"] for e in EMOTIONS)
    return {
        "dominant_emotion": dominant,
        "dominant_score":   scores[dominant],
        "valence_score":    round(float(np.clip(valence, -1.0, 1.0)), 4),
        "emoji":            EMOTION_META[dominant]["emoji"],
    }

def run_helpfulness(text: str, sentiment: str) -> dict:
    word_count   = len(text.split())
    has_numbers  = bool(re.search(r"\d", text))
    has_contrast = bool(re.search(r"\b(but|however|although|though|despite|except)\b", text.lower()))
    has_exclaim  = text.count("!") > 2
    upr          = uppercase_ratio(text)

    score = 0.40
    score += min(word_count / 200, 0.25)
    if has_numbers:  score += 0.10
    if has_contrast: score += 0.10
    if has_exclaim:  score -= 0.05
    if upr > 0.15:   score -= 0.05
    if sentiment == "neutral": score += 0.05
    score = float(np.clip(score, 0.0, 1.0))

    tendency = "high" if score >= 0.70 else "medium" if score >= 0.45 else "low"
    hlabel   = {"high":"🟢 Likely Helpful","medium":"🟡 Moderately Helpful","low":"🔴 Unlikely Helpful"}[tendency]
    return {
        "score": round(score, 3), "tendency": tendency, "label": hlabel,
        "signals": {
            "word_count": word_count, "has_numbers": has_numbers,
            "has_contrast": has_contrast, "has_exclaim": has_exclaim,
            "uppercase_ratio": round(upr, 3),
        },
    }

def get_top_tokens(text: str) -> list:
    POS = {"amazing","excellent","perfect","great","love","best","fantastic",
           "wonderful","awesome","superb","brilliant","outstanding","thrilled",
           "happy","pleased","satisfied","recommend","worth","quality","fast"}
    NEG = {"terrible","awful","horrible","worst","hate","broken","garbage",
           "useless","waste","disappointed","defective","poor","bad","cheap",
           "slow","avoid","refund","return","damage","broke","fail","failed"}
    tokens, seen, result = [], set(), []
    for w in re.findall(r"\b[a-z]{3,}\b", text.lower()):
        if w in POS: tokens.append({"token":w,"score": 1.2,"direction":"positive"})
        elif w in NEG: tokens.append({"token":w,"score":-1.5,"direction":"negative"})
    for t in sorted(tokens, key=lambda x: abs(x["score"]), reverse=True):
        if t["token"] not in seen:
            seen.add(t["token"])
            result.append(t)
        if len(result) >= 12: break
    return result

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "model": "SentimentIQ v2", "version": "2.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy", "device": DEVICE}

@app.post("/predict")
def predict(req: ReviewRequest):
    if not req.text or len(req.text.strip()) < 5:
        return {"error": "Text too short (min 5 chars)"}
    if len(req.text) > 5000:
        return {"error": "Text too long (max 5000 chars)"}

    t0          = time.time()
    text        = req.text.strip()
    sentiment   = run_sentiment(text)
    emotion     = run_emotion(text)
    helpfulness = run_helpfulness(text, sentiment["label"])
    top_tokens  = get_top_tokens(text)

    sv_map    = {"positive":1.0,"neutral":0.0,"negative":-1.0}
    alignment = 1 - abs(emotion["valence_score"] - sv_map[sentiment["label"]]) / 2
    adj_conf  = round(sentiment["confidence"] * (0.70 + 0.30 * alignment), 4)

    narrative = NARRATIVES.get(
        f"{sentiment['label']}-{emotion['dominant_emotion']}",
        f"{emotion['emoji']} Reviewer expresses {emotion['dominant_emotion']}.",
    )

    return {
        "sentiment":      sentiment["label"],
        "confidence":     sentiment["confidence"],
        "adj_confidence": adj_conf,
        "probabilities":  sentiment["probabilities"],
        "emotion":        emotion["dominant_emotion"],
        "emotion_emoji":  emotion["emoji"],
        "valence":        emotion["valence_score"],
        "helpfulness":    helpfulness,
        "narrative":      narrative,
        "top_tokens":     top_tokens,
        "processing_ms":  round((time.time() - t0) * 1000, 1),
    }