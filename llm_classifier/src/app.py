from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
import os
import requests
import json
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Load .env from two levels up (project root)
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_root, '.env'))

DATA_FILE = os.path.join(_root, 'data', 'datasets.json')

def load_dataset():
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return []

def save_dataset(data):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from feature_extraction import extract_features

app = FastAPI(
    title="LLM Stylometric Classifier API",
    description="Comprehensive forensics tool for AI model attribution.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ClassifyRequest(BaseModel):
    text: str

class GenerateRequest(BaseModel):
    model_label: str
    topic: str
    text_type: str
    length_target: str

def softmax(x):
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()

def rule_based_scoring(features):
    scores = {"GPT-4": 0.0, "Claude": 0.0, "Gemini": 0.0, "LLaMA": 0.0, "Mistral": 0.0}
    
    # em_dash_rate > 0.8 → Claude +3
    if features.get('em_dash_rate', 0) > 0.8: scores["Claude"] += 3
    # bullet_density > 0.4 → GPT-4 +2, Gemini +3
    if features.get('bullet_density', 0) > 0.4:
        scores["GPT-4"] += 2
        scores["Gemini"] += 3
    # bold_header_density > 0.5 → Gemini +4
    if features.get('bold_header_density', 0) > 0.5: scores["Gemini"] += 4
    # hedging_rate > 0.6 AND mean_sentence_length > 20 → Claude +2
    if features.get('hedging_rate', 0) > 0.6 and features.get('mean_sentence_length', 0) > 20: scores["Claude"] += 2
    # mean_sentence_length < 15 AND hedging_rate < 0.2 → LLaMA +3
    if features.get('mean_sentence_length', 0) < 15 and features.get('hedging_rate', 0) < 0.2: scores["LLaMA"] += 3
    # numbered_steps = true AND summary_ending = true → GPT-4 +3
    if features.get('has_numbered_steps', 0) == 1.0 and features.get('has_summary_ending', 0) == 1.0: scores["GPT-4"] += 3
    # oxford_comma_rate > 0.5 AND subordinate_clause_ratio > 0.3 → Claude +2, GPT-4 +1
    if features.get('oxford_comma_rate', 0) > 0.5 and features.get('subordinate_clause_ratio', 0) > 0.3:
        scores["Claude"] += 2
        scores["GPT-4"] += 1
        
    for k in scores: scores[k] += 0.5 # Smoothing
    probs = softmax(list(scores.values()))
    return {name: float(p) for name, p in zip(scores.keys(), probs)}

def call_gemini_api(system_prompt, user_message, json_mode=True):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key: 
        print("Error: GEMINI_API_KEY not found in environment.")
        return None
    try:
        # Using gemini-flash-latest as it's the most reliable in this environment
        model = "gemini-flash-latest"
        combined_prompt = f"{system_prompt}\n\nUser request: {user_message}"
        
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{
                    "parts": [{"text": combined_prompt}]
                }],
                "generationConfig": {
                    "response_mime_type": "application/json" if json_mode else "text/plain"
                }
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text) if json_mode else text
        else:
            print(f"Gemini API Error ({model}): {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Gemini API Exception: {str(e)}")
        return None

@app.post("/classify")
def classify_text(request: ClassifyRequest):
    text = request.text
    if len(text.split()) < 1: raise HTTPException(400, "Text is empty.")
    
    features = extract_features(text)
    
    system_prompt = "You are an expert in LLM stylometrics. You will receive a feature analysis dict and raw text. Your job: determine which AI model most likely wrote this text. Be specific about which signals are most diagnostic. Return ONLY valid JSON."
    user_message = f"Feature analysis: {json.dumps(features)}\nRaw text (first 800 chars): {text[:800]}\nReturn JSON format: {{winner: string, confidence: float 0-1, scores: {{GPT-4: float, Claude: float, Gemini: float, LLaMA: float, Mistral: float}}, top_signals: [string, string, string], reasoning: string (2 sentences max)}}"
    
    result = call_gemini_api(system_prompt, user_message)
    if result: return result
    
    # Fallback
    probs = rule_based_scoring(features)
    winner = max(probs, key=probs.get)
    return {
        "winner": winner,
        "confidence": float(probs[winner]),
        "scores": probs,
        "top_signals": ["Rule-based extraction", "Pattern matching", "Stylistic heuristic"],
        "reasoning": f"Rule-based estimate (API unavailable). The text matches {winner} stylistic patterns.",
        "is_fallback": True
    }

@app.post("/generate")
def generate_sample(request: GenerateRequest):
    prompts = {
        "GPT-4": "You are simulating GPT-4's writing style. Write the response in GPT-4's characteristic way: structured and pedagogical, use numbered lists or bold headers when appropriate, open with 'Here's' or 'Let's break this down', use phrases like 'It's worth noting', 'Importantly', and 'In summary' at the end. High hedging, thorough coverage, slightly formal. Never use em dashes.",
        "Claude": "You are simulating Claude's writing style. Write in Claude's characteristic way: discursive, essay-like prose without bullet points, use em dashes—like this—for asides, engage genuinely with ambiguity and nuance, show intellectual curiosity, use subordinate clauses heavily, avoid lists and headers, end without a summary. Use parenthetical remarks (like this) occasionally.",
        "Gemini": "You are simulating Gemini's writing style. Write in Gemini's characteristic way: use **bold text** for key terms, organize with bullet points and numbered lists, include a 'Key takeaways' or practical applications section, use clear What/How/Why structure, authoritative and comprehensive tone, heavy use of markdown formatting, minimal hedging.",
        "LLaMA": "You are simulating LLaMA's writing style. Write in LLaMA's characteristic way: direct and informal register, shorter sentences averaging 12 words, minimal hedging or caveats, get to the point immediately without preamble, slightly less polished than GPT-4, occasional minor grammatical informality, no markdown formatting, conversational.",
        "Mistral": "You are simulating Mistral's writing style. Write in Mistral's characteristic way: precise and technical, European academic register, efficient word use with no filler phrases, medium sentence length, minimal hedging, clean structure without heavy markdown, concise explanations that assume intelligence in the reader."
    }
    
    system_prompt = prompts.get(request.model_label, prompts["GPT-4"])
    user_message = f"Write a {request.text_type} about '{request.topic}'. Length: {request.length_target}. Provide ONLY the text, no conversational filler."
    
    text = call_gemini_api(system_prompt, user_message, json_mode=False)
    if not text: raise HTTPException(500, "Generation failed.")
    
    sample = {
        "id": str(uuid.uuid4()),
        "model_label": request.model_label,
        "topic": request.topic,
        "text_type": request.text_type,
        "length_target": request.length_target,
        "text": text,
        "word_count": len(text.split()),
        "char_count": len(text),
        "timestamp": datetime.now().isoformat(),
        "features": extract_features(text)
    }

    # Persist to database
    dataset = load_dataset()
    dataset.insert(0, sample)
    save_dataset(dataset)

    return sample

@app.get("/dataset")
def get_dataset(search: str = None):
    dataset = load_dataset()
    if not search:
        return dataset
    
    q = search.lower()
    filtered = [
        d for d in dataset
        if q in (d.get("topic") or "").lower() or
           q in (d.get("text") or "").lower() or
           q in (d.get("model_label") or "").lower() or
           q in (d.get("text_type") or "").lower()
    ]
    return filtered

@app.delete("/dataset/{item_id}")
def delete_item(item_id: str):
    dataset = load_dataset()
    new_dataset = [d for d in dataset if d.get("id") != item_id]
    if len(new_dataset) == len(dataset):
        raise HTTPException(404, "Item not found")
    save_dataset(new_dataset)
    return {"status": "deleted"}

@app.delete("/dataset")
def clear_dataset():
    save_dataset([])
    return {"status": "cleared"}

@app.get("/health")
def health(): return {"status": "ok"}



@app.post("/features")
def extract_features_endpoint(request: ClassifyRequest):
    """Extract raw stylometric features from text (used by Signal Explainer)."""
    text = request.text
    if not text or not text.strip():
        raise HTTPException(400, "Text is empty.")
    features = extract_features(text)
    return features

@app.post("/recommendations")
def get_recommendations(request: dict):
    # This endpoint receives the confusion matrix and feature weights to generate improvements
    matrix = request.get("confusion_matrix")
    weights = request.get("feature_weights")
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return [
            {"pair": "GPT-4 ↔ Claude", "reason": "Shared formal tone and hedging.", "fix": "Increase em-dash weight.", "gain": 4},
            {"pair": "Mistral ↔ LLaMA", "reason": "Both are efficient and concise.", "fix": "Add sentence length variance signal.", "gain": 6},
            {"pair": "Gemini ↔ GPT-4", "reason": "Both use heavy list formatting.", "fix": "Reward markdown-specific markers more.", "gain": 5}
        ]

    system_prompt = "You are a forensic data scientist. Analyze the confusion matrix and feature weights provided to identify the top 3 most impactful improvements to reduce misclassification. Return ONLY a JSON array: [{pair, reason, fix, gain}]"
    user_message = f"Confusion Matrix: {json.dumps(matrix)}\nFeature Weights: {json.dumps(weights)}"
    
    result = call_gemini_api(system_prompt, user_message)
    if isinstance(result, list):
        return result
    return [
        {"pair": "GPT-4 ↔ Claude", "reason": "Shared formal tone and hedging.", "fix": "Increase em-dash weight.", "gain": 4},
        {"pair": "Mistral ↔ LLaMA", "reason": "Both are efficient and concise.", "fix": "Add sentence length variance signal.", "gain": 6},
        {"pair": "Gemini ↔ GPT-4", "reason": "Both use heavy list formatting.", "fix": "Reward markdown-specific markers more.", "gain": 5}
    ]
