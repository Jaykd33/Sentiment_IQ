# SENTIMENT_IQ/Backend/main.py
# Memory-optimised for Render free tier (512MB RAM limit)
# Emotion detection offloaded to HuggingFace Inference API (free)
# Only DistilBERT + sklearn LR loaded locally (~375MB total)

import os, re, time, pickle, logging, httpx
import numpy as np
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from huggingface_hub import hf_hub_download

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s"
)
log = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
HF_USERNAME  = os.environ.get("HF_USERNAME", "YOUR_HF_USERNAME")
HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "")          # HuggingFace Inference API token
BERT_REPO    = f"{HF_USERNAME}/sentimentiq-distilbert"
SKLEARN_REPO = f"{HF_USERNAME}/sentimentiq-sklearn"
DEVICE       = "cpu"
CLASS_NAMES  = ["negative", "neutral", "positive"]

# HuggingFace Inference API endpoint for emotion model
# This runs on HF servers — zero RAM cost on our side
HF_EMOTION_API = (
    "https://api-inference.huggingface.co/models/"
    "j-hartmann/emotion-english-distilroberta-base"
)

# ── Global model holders ──────────────────────────────────────────────────────
models: dict = {
    "tokenizer":   None,
    "bert":        None,
    "lr_pipeline": None,
    "ready":       False,
}

# ── Lifespan: load only local models at startup ───────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("=== SentimentIQ Backend Starting (memory-optimised) ===")
    log.info(f"Device       : {DEVICE}")
    log.info(f"BERT repo    : {BERT_REPO}")
    log.info(f"Emotion      : HuggingFace Inference API (offloaded)")

    try:
        # 1. DistilBERT tokenizer
        log.info("Loading DistilBERT tokenizer...")
        models["tokenizer"] = AutoTokenizer.from_pretrained(BERT_REPO)
        log.info("Tokenizer ready.")

        # 2. DistilBERT classification model
        log.info("Loading DistilBERT model weights (~260MB)...")
        models["bert"] = AutoModelForSequenceClassification.from_pretrained(
            BERT_REPO,
            torch_dtype=torch.float32,
            low_cpu_mem_usage=True,      # stream weights, reduces peak RAM
        )
        models["bert"].eval()
        log.info("DistilBERT ready.")

        # 3. Sklearn LR pipeline (~15MB)
        log.info("Downloading LR pipeline from HuggingFace dataset...")
        lr_path = hf_hub_download(
            repo_id=SKLEARN_REPO,
            filename="logistic_regression_pipeline.pkl",
            repo_type="dataset",
        )
        with open(lr_path, "rb") as f:
            models["lr_pipeline"] = pickle.load(f)
        log.info("LR pipeline ready.")

        models["ready"] = True
        log.info("=== All local models loaded. Server ready. ===")

    except Exception as e:
        log.error(f"Model loading failed: {e}", exc_info=True)
        models["ready"] = False

    yield

    log.info("Shutting down SentimentIQ backend.")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SentimentIQ API",
    version="2.1.0",
    description="Memory-optimised emotion-aware Amazon review sentiment analysis",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ── Request schema ─────────────────────────────────────────────────────────────
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
    "joy": "joy", "anger": "anger", "sadness": "sadness",
    "fear": "fear", "disgust": "disgust", "surprise": "surprise",
    "neutral": "neutral", "annoyance": "frustration",
    "disappointment": "sadness", "optimism": "joy",
    "approval": "joy", "disapproval": "frustration",
    "confusion": "surprise", "caring": "joy",
    "excitement": "joy", "amusement": "joy", "gratitude": "joy",
    "love": "joy", "relief": "joy", "grief": "sadness",
    "remorse": "sadness", "curiosity": "surprise",
    "nervousness": "fear", "pride": "joy",
    "realization": "surprise", "embarrassment": "sadness",
    "desire": "joy", "admiration": "joy",
}

NARRATIVES = {
    "positive-joy":         "Reviewer is genuinely happy and fully satisfied.",
    "positive-surprise":    "Reviewer is pleasantly surprised — product exceeded expectations.",
    "positive-neutral":     "Reviewer is satisfied in a calm, measured, credible way.",
    "negative-anger":       "Reviewer is clearly angry — expressing strong dissatisfaction.",
    "negative-frustration": "Reviewer is frustrated, likely with usability or delivery.",
    "negative-sadness":     "Reviewer is disappointed — their expectations were not met.",
    "negative-disgust":     "Reviewer feels strong repulsion toward the product.",
    "neutral-neutral":      "Reviewer gives a balanced, unemotional assessment.",
    "neutral-surprise":     "Reviewer is on the fence but something caught them off guard.",
}

# ── Inference: sentiment (local DistilBERT) ───────────────────────────────────
@torch.no_grad()
def run_sentiment(text: str) -> dict:
    tok  = models["tokenizer"]
    mdl  = models["bert"]
    enc  = tok(
        text, return_tensors="pt",
        truncation=True, max_length=128, padding=True
    )
    out  = mdl(**enc)
    prob = torch.softmax(out.logits, dim=-1).squeeze().numpy()
    pid  = int(np.argmax(prob))
    return {
        "label":         CLASS_NAMES[pid],
        "label_id":      pid,
        "confidence":    float(prob[pid]),
        "probabilities": {c: float(p) for c, p in zip(CLASS_NAMES, prob)},
    }

# ── Inference: emotion (HuggingFace Inference API — offloaded) ────────────────
async def run_emotion(text: str) -> dict:
    """
    Calls HuggingFace's free Inference API instead of loading the model locally.
    This costs zero RAM on our Render instance.
    Falls back to rule-based detection if the API call fails.
    """
    EMOTIONS = list(EMOTION_META.keys())

    # ── Try HuggingFace Inference API ─────────────────────────────────────────
    if HF_API_TOKEN:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    HF_EMOTION_API,
                    headers={"Authorization": f"Bearer {HF_API_TOKEN}"},
                    json={"inputs": text[:512]},
                )

            if response.status_code == 200:
                raw_list = response.json()

                # HF returns either [[{label, score}]] or [{label, score}]
                if isinstance(raw_list, list) and len(raw_list) > 0:
                    items = raw_list[0] if isinstance(raw_list[0], list) else raw_list

                    scores = {e: 0.0 for e in EMOTIONS}
                    for item in items:
                        label  = item.get("label", "").lower()
                        score  = item.get("score", 0.0)
                        mapped = RAW_LABEL_MAP.get(label, "neutral")
                        scores[mapped] = max(scores[mapped], score)

                    total    = sum(scores.values()) or 1.0
                    scores   = {k: round(v / total, 5) for k, v in scores.items()}
                    dominant = max(scores, key=scores.get)
                    valence  = sum(
                        scores[e] * EMOTION_META[e]["valence"] for e in EMOTIONS
                    )
                    return {
                        "dominant_emotion": dominant,
                        "dominant_score":   scores[dominant],
                        "valence_score":    round(float(np.clip(valence, -1.0, 1.0)), 4),
                        "emoji":            EMOTION_META[dominant]["emoji"],
                        "source":           "hf_api",
                    }

            elif response.status_code == 503:
                # Model loading on HF side — use fallback
                log.warning("HF emotion model still loading, using rule-based fallback.")
            else:
                log.warning(f"HF API returned {response.status_code}, using fallback.")

        except Exception as e:
            log.warning(f"HF emotion API error: {e}, using rule-based fallback.")

    # ── Rule-based fallback (zero RAM, always available) ─────────────────────
    return _rule_based_emotion(text)

def _rule_based_emotion(text: str) -> dict:
    """
    Lightweight keyword-based emotion detector.
    Used when HF API is unavailable or no token is set.
    """
    lower = text.lower()
    joy_words   = {"love","amazing","excellent","fantastic","perfect","happy",
                   "thrilled","wonderful","awesome","brilliant","great","best"}
    anger_words = {"angry","furious","ridiculous","outrage","scam","garbage",
                   "hate","worst","disgusting","unacceptable","useless"}
    sad_words   = {"disappointed","unfortunate","regret","sad","letdown",
                   "disappointing","devastated","heartbroken","upset"}
    frust_words = {"frustrating","annoying","hassle","difficult","complicated",
                   "broken","defective","returned","refund","slow","waited"}
    disgust_words={"horrible","terrible","awful","gross","nasty","disgusting",
                   "repulsive","filthy","toxic","rotten"}
    fear_words  = {"scared","afraid","worried","unsafe","dangerous","risk"}

    exclaims = text.count("!")
    words    = set(re.findall(r"\b[a-z]{3,}\b", lower))

    scores = {
        "joy":         len(words & joy_words) * 1.2 + (exclaims * 0.1 if any(w in lower for w in joy_words) else 0),
        "anger":       len(words & anger_words) * 1.5 + (exclaims * 0.2 if any(w in lower for w in anger_words) else 0),
        "sadness":     len(words & sad_words) * 1.3,
        "frustration": len(words & frust_words) * 1.2,
        "disgust":     len(words & disgust_words) * 1.4,
        "fear":        len(words & fear_words) * 1.1,
        "surprise":    1.0 if re.search(r"\b(wow|unexpected|unbelievable|amazing|shocked)\b", lower) else 0,
        "neutral":     0.5,   # base score so we never return nothing
    }

    dominant = max(scores, key=scores.get)
    total    = sum(scores.values()) or 1.0
    norm     = {k: round(v / total, 5) for k, v in scores.items()}
    EMOTIONS = list(EMOTION_META.keys())
    valence  = sum(norm[e] * EMOTION_META[e]["valence"] for e in EMOTIONS)

    return {
        "dominant_emotion": dominant,
        "dominant_score":   norm[dominant],
        "valence_score":    round(float(np.clip(valence, -1.0, 1.0)), 4),
        "emoji":            EMOTION_META[dominant]["emoji"],
        "source":           "rule_based",
    }

# ── Helpfulness heuristic ─────────────────────────────────────────────────────
def run_helpfulness(text: str, sentiment: str) -> dict:
    word_count   = len(text.split())
    has_numbers  = bool(re.search(r"\d", text))
    has_contrast = bool(re.search(
        r"\b(but|however|although|though|despite|except)\b", text.lower()
    ))
    has_exclaim  = text.count("!") > 2
    upr          = sum(c.isupper() for c in text if c.isalpha()) / max(
                       sum(1 for c in text if c.isalpha()), 1)

    score = 0.40
    score += min(word_count / 200, 0.25)
    if has_numbers:            score += 0.10
    if has_contrast:           score += 0.10
    if has_exclaim:            score -= 0.05
    if upr > 0.15:             score -= 0.05
    if sentiment == "neutral": score += 0.05
    score    = float(np.clip(score, 0.0, 1.0))

    tendency = "high" if score >= 0.70 else "medium" if score >= 0.45 else "low"
    hlabel   = {
        "high":   "🟢 Likely Helpful",
        "medium": "🟡 Moderately Helpful",
        "low":    "🔴 Unlikely Helpful",
    }[tendency]

    return {
        "score": round(score, 3),
        "tendency": tendency,
        "label": hlabel,
        "signals": {
            "word_count":      word_count,
            "has_numbers":     has_numbers,
            "has_contrast":    has_contrast,
            "has_exclaim":     has_exclaim,
            "uppercase_ratio": round(upr, 3),
        },
    }

# ── Token attribution (keyword-based) ────────────────────────────────────────
def get_top_tokens(text: str) -> list:
    POS = {"amazing","excellent","perfect","great","love","best","fantastic",
           "wonderful","awesome","superb","brilliant","outstanding","thrilled",
           "happy","pleased","satisfied","recommend","worth","quality","fast"}
    NEG = {"terrible","awful","horrible","worst","hate","broken","garbage",
           "useless","waste","disappointed","defective","poor","bad","cheap",
           "slow","avoid","refund","return","damage","broke","fail","failed"}
    tokens, seen, result = [], set(), []
    for w in re.findall(r"\b[a-z]{3,}\b", text.lower()):
        if   w in POS: tokens.append({"token": w, "score":  1.2, "direction": "positive"})
        elif w in NEG: tokens.append({"token": w, "score": -1.5, "direction": "negative"})
    for t in sorted(tokens, key=lambda x: abs(x["score"]), reverse=True):
        if t["token"] not in seen:
            seen.add(t["token"])
            result.append(t)
        if len(result) >= 12:
            break
    return result

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status":  "ok",
        "model":   "SentimentIQ v2",
        "version": "2.1.0",
        "emotion": "HuggingFace Inference API",
    }

@app.get("/health")
def health():
    return {
        "status":       "healthy" if models["ready"] else "loading",
        "ready":        models["ready"],
        "device":       DEVICE,
        "version":      "2.1.0",
        "emotion_mode": "hf_api" if HF_API_TOKEN else "rule_based",
    }

@app.post("/predict")
async def predict(req: ReviewRequest):
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
    emotion     = await run_emotion(text)       # async — calls HF API
    helpfulness = run_helpfulness(text, sentiment["label"])
    top_tokens  = get_top_tokens(text)

    sv_map    = {"positive": 1.0, "neutral": 0.0, "negative": -1.0}
    alignment = 1 - abs(emotion["valence_score"] - sv_map[sentiment["label"]]) / 2
    adj_conf  = round(sentiment["confidence"] * (0.70 + 0.30 * alignment), 4)

    narrative = NARRATIVES.get(
        f"{sentiment['label']}-{emotion['dominant_emotion']}",
        f"{emotion['emoji']} Reviewer expresses {emotion['dominant_emotion']}.",
    )

    elapsed = round((time.time() - t0) * 1000, 1)
    log.info(
        f"[{sentiment['label'].upper()}] {emotion['dominant_emotion']} | "
        f"conf={sentiment['confidence']:.3f} | {elapsed}ms | "
        f"emotion_src={emotion.get('source','?')}"
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
        "processing_ms":  elapsed,
    }