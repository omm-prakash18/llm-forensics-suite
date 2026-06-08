# LLM Forensics Suite 🕵️‍♂️

A comprehensive stylometric analysis and model attribution framework designed to identify the "fingerprints" of various Large Language Models. This suite provides tools for forensic data scientists to detect, analyze, and simulate LLM-specific writing patterns.

## 🚀 Features

- **Model Attribution:** Identify the likely source of text among major models including **GPT-4, Claude, Gemini, LLaMA, and Mistral**.
- **Lexical Signal Extraction:** Analyzes over 20+ stylometric features such as em-dash frequency, hedging density, Oxford comma usage, and structural complexity.
- **Explainable Forensics:** Not just a classification—provides specific "Key Signals" and reasoning for why a model was selected.
- **Style Simulation:** Generate synthetic text samples that mimic the characteristic "voice" of specific LLMs for dataset building and testing.
- **Live Dashboard:** A modern, React-based UI for real-time text analysis and signal visualization.

## 🛠️ Tech Stack

- **Backend:** FastAPI (Python)
- **Forensics Engine:** Lexical pattern matching + Claude 3.5 Sonnet (Hybrid Analysis)
- **Frontend:** React, Vite, Framer Motion, Tailwind CSS (Vanilla CSS variants)
- **Stylometrics:** Custom feature extraction engine in `feature_extraction.py`

## 📦 Installation

### Backend
1. Navigate to the `llm_classifier` directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set your Anthropic API Key (optional for fallback mode):
   ```bash
   export ANTHROPIC_API_KEY='your_key_here'
   ```
4. Run the API:
   ```bash
   python src/app.py
   ```

### Frontend
1. Navigate to `llm_classifier/frontend`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🔍 How it Works

The suite uses a hybrid approach to classification:
1. **Structural Analysis:** Measures markdown usage, list density, and header styles.
2. **Syntactic Profiling:** Tracks sentence length variance, subordinate clause ratios, and transition patterns.
3. **Lexical Fingerprinting:** Identifies model-specific "crutches" (e.g., Claude's use of em-dashes vs. GPT-4's pedagogical structure).

## 📄 License

MIT
