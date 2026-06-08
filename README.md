# 🕵️‍♂️ LLM Forensics Suite

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/frontend-React-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)

A professional-grade **Stylometric Analysis & Model Attribution** framework. This suite detects the subtle "digital fingerprints" left by Large Language Models (LLMs) to identify the likely source of any given text with high precision.

---

## 🌟 Key Capabilities

### 🔍 Forensic Attribution
Identify the likely authoring model among:
- **OpenAI:** GPT-4, GPT-3.5
- **Anthropic:** Claude 3 (Opus/Sonnet/Haiku)
- **Google:** Gemini Pro/Ultra
- **Meta:** LLaMA 3, LLaMA 2
- **Mistral AI:** Mistral-7B, Mixtral

### 📊 Signal Extraction
The engine extracts **20+ diagnostic features** including:
- **Lexical Density:** Vocabulary richness and word-choice patterns.
- **Punctuation Signatures:** Precise tracking of em-dashes, Oxford commas, and ellipsis usage.
- **Structural Cues:** Analysis of markdown usage, list formatting, and header styles.
- **Syntactic Profiling:** Sentence length variance and subordinate clause complexity.

### 🎭 Style Simulation
Generate forensic "gold standards" by simulating the specific writing styles of target models to build robust training datasets.

---

## 🚀 Getting Started

### Backend Setup (FastAPI)
```bash
# Navigate to backend
cd llm_classifier

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn src.app:app --reload
```

### Frontend Setup (React + Vite)
```bash
# Navigate to frontend
cd llm_classifier/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Framer Motion, Lucide Icons |
| **Backend** | FastAPI, Uvicorn, Pydantic |
| **Analysis** | NumPy, Python Stylometrics Engine |
| **AI Integration** | Claude 3.5 Sonnet (Hybrid Analysis Mode) |

---

## 🧠 How the Forensics Engine Works

The suite utilizes a **Hybrid Detection Strategy**:

1. **Heuristic Layer:** A rule-based engine that scores text based on known model behaviors (e.g., Claude's affinity for em-dashes or Gemini's structured bolding).
2. **LLM Analysis Layer:** Leverages high-reasoning models to analyze nuance, tone, and "voice" that static rules might miss.
3. **Probability Mapping:** Generates a confidence-weighted score across all supported models.

---

## 📈 Roadmap
- [ ] Support for fine-tuned versions of LLaMA/Mistral.
- [ ] Exportable forensic reports (PDF/JSON).
- [ ] Batch processing for large document datasets.
- [ ] Chrome Extension for one-click web text analysis.

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Created for forensic data scientists and AI safety researchers.*
