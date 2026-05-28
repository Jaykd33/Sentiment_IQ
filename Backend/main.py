# SENTIMENT_IQ/Backend/main.py

import os, re, time, pickle, logging
import numpy as np
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
from huggingface_hub import hf_hub_download

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
HF_USERNAME  = os.environ.get("HF_USERNAME", "YOUR_HF_USERNAME")
BERT_REPO    = f"{HF_USERNAME}/sentimentiq-distilbert"
SKLEARN_REPO = f"{HF_USERNAME}/sentimentiq-sklearn"
DEVICE       = "cpu"   # Render free tier is CPU-only
CLASS_NAMES  = ["negative", "neutral", "positive"]

# ── Global model holders ──────────────────────────────────────────────────────
# Models are loaded once at startup via the lifespan handler
models = {
    "tokenizer":    None,
    "bert":         None,
    "emotion_pipe": None,
    "lr_pipeline":  None,
    "ready":        False,
}

# ── Lifespan: load all models when server starts ──────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models at startup, clean up on shutdown."""
    log.info("=== SentimentIQ Backend Starting ===")
    log.info(f"Device       : {DEVICE}")
    log.info(f"HF repo      : {BERT_REPO}")

    try:
        # 1. DistilBERT tokenizer + model
        log.info("Loading DistilBERT tokenizer...")
        models["tokenizer"] = AutoTokenizer.from_pretrained(BERT_REPO)

        log.info("Loading DistilBERT model weights...")
        models["bert"] = AutoModelForSequenceClassification.from_pretrained(
            BERT_REPO,
            torch_dtype=torch.float32,   # float32 for CPU stability
        )
        models["bert"].eval()
        log.info("DistilBERT ready.")

        # 2. Sklearn LR pipeline
        log.info("Downloading LR pipeline from HuggingFace...")
        lr_path = hf_hub_download(
            repo_id=SKLEARN_REPO,
            filename="logistic_regression_pipeline.pkl",
            repo_type="dataset",
        )
        with open(lr_path, "rb") as f:
            models["lr_pipeline"] = pickle.load(f)
        log.info("LR pipeline ready.")

        # 3. Emotion model (downloads from HuggingFace Hub automatically)
        log.info("Loading emotion model (j-hartmann/emotion-english-distilroberta-base)...")
        models["emotion_pipe"] = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            top_k=None,
            device=-1,           # -1 = CPU
            truncation=True,
            max_length=512,
        )
        log.info("Emotion model ready.")

        models["ready"] = True
        log.info("=== All models loaded. Server ready. ===")

    except Exception as e:
        log.error(f"Model loading failed: {e}")
        # Don't crash the server — /health will report not ready
        models["ready"] = False

    yield   # Server runs here

    # Cleanup on shutdown
    log.info("Shutting down SentimentIQ backend.")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SentimentIQ API",
    version="2.0.0",
    description="Emotion-aware Amazon review sentiment analysis",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ── Request model ─────────────────────────────────────────────────────────────
class ReviewRequest(BaseModel):
    text: str

# ── Label maps ────────────────────────────────────────────────────────────────
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

# ── Inference helpers ─────────────────────────────────────────────────────────
def uppercase_ratio(text: str) -> float:
    alpha = [c for c in text if c.isalpha()]
    if not alpha: return 0.0
    return sum(c.isupper() for c in alpha) / len(alpha)

@torch.no_grad()
def run_sentiment(text: str) -> dict:
    tok  = models["tokenizer"]
    mdl  = models["bert"]
    enc  = tok(text, return_tensors="pt", truncation=True, max_length=128, padding=True)
    out  = mdl(**enc)
    prob = torch.softmax(out.logits, dim=-1).squeeze().numpy()
    pid  = int(np.argmax(prob))
    return {
        "label":         CLASS_NAMES[pid],
        "label_id":      pid,
        "confidence":    float(prob[pid]),
        "probabilities": {c: float(p) for c, p in zip(CLASS_NAMES, prob)},
    }

def run_emotion(text: str) -> dict:
    EMOTIONS = list(EMOTION_META.keys())
    raw      = models["emotion_pipe"](text[:512])[0]
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
    score        = 0.40
    score       += min(word_count / 200, 0.25)
    if has_numbers:           score += 0.10
    if has_contrast:          score += 0.10
    if has_exclaim:           score -= 0.05
    if upr > 0.15:            score -= 0.05
    if sentiment == "neutral": score += 0.05
    score    = float(np.clip(score, 0.0, 1.0))
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
        if   w in POS: tokens.append({"token":w,"score": 1.2,"direction":"positive"})
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
    """Render uses this to check if the service is up."""
    return {
        "status":  "healthy" if models["ready"] else "loading",
        "ready":   models["ready"],
        "device":  DEVICE,
        "version": "2.0.0",
    }

@app.post("/predict")
def predict(req: ReviewRequest):
    # Guard: reject requests if models aren't loaded yet
    if not models["ready"]:
        raise HTTPException(
            status_code=503,
            detail="Models are still loading. Please retry in 30 seconds.",
        )

    text = req.text.strip()
    if len(text) < 5:
        raise HTTPException(status_code=400, detail="Text too short (min 5 chars)")
    if len(text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long (max 5000 chars)")

    t0          = time.time()
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

    log.info(f"Predicted: {sentiment['label']} | {emotion['dominant_emotion']} | {round(time.time()-t0,2)}s")

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