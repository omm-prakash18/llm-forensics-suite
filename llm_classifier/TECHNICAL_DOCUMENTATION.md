# Technical Documentation: LLM Forensics Suite

This document outlines the technical architecture, core features, and the foundational knowledge required to build the LLM Forensics Suite from scratch.

---

## 1. System Architecture

The LLM Forensics Suite follows a modern **Client-Server Architecture**:

- **Frontend (Client):** A Single Page Application (SPA) built with React and Vite. It handles user interactions, complex UI state management, and real-time data visualization.
- **Backend (Server):** A RESTful API built with Python and FastAPI. It handles the heavy lifting: communicating with the Google Gemini API, extracting stylometric NLP features, and managing the local JSON dataset.
- **Communication:** The frontend communicates with the backend via asynchronous `fetch` and `axios` HTTP requests, utilizing JSON payloads. Cross-Origin Resource Sharing (CORS) is explicitly configured on the backend to allow the frontend to make these requests securely.

---

## 2. Core Components

### A. Frontend Layer
*   **App Shell (`App.jsx`):** Manages global navigation state and smooth page transitions using Framer Motion (`AnimatePresence`).
*   **Live Classifier (`ClassifierDashboard.jsx`):** Sends user text to the backend (`/classify` endpoint). Parses and displays the AI's structural and stylistic breakdown, outputting confidence scores for models like GPT-4, Claude, and Gemini.
*   **Dataset Builder (`DatasetBuilder.jsx`):** A full CRUD (Create, Read, Update, Delete) interface. It calls backend endpoints (`/generate`, `/dataset`) to synthesize new AI-generated text samples and search through the existing corpus.
*   **Signal Explainer (`SignalExplainer.jsx`):** A deep-dive analytical tool. It queries the backend (`/features` endpoint) for raw stylometric features (like sentence length variance and lexical diversity) and visualizes them on a Radar chart.
*   **Accuracy Board (`AccuracyBoard.jsx`):** Analyzes historical classifications to generate a Confusion Matrix and actionable algorithmic recommendations using the `/recommendations` endpoint.

### B. Backend Layer (`src/app.py`)
*   **`@app.post("/classify")`:** The primary engine. Uses the Gemini API to analyze text stylometry (hedging, formatting, sentence structure) and returns simulated confidence scores for various LLMs.
*   **`@app.post("/features")`:** Performs lightweight, deterministic Natural Language Processing (NLP) to extract raw numerical features from text (e.g., word count, punctuation frequency).
*   **Dataset Endpoints (`GET`, `POST`, `DELETE /dataset`):** Handles file I/O operations to read, write, and delete entries from the persistent `data/datasets.json` file.
*   **`@app.post("/recommendations")`:** Evaluates confusion matrix arrays and asks the Gemini API to suggest data science improvements to fix misclassifications.

---

## 3. What You Need to Know to Build This

To build an application of this caliber from scratch, a developer needs a blend of Full-Stack Web Development, UI/UX Design, and applied AI/NLP knowledge.

### 🌐 Frontend & UI/UX Engineering
1.  **React Fundamentals:**
    *   Functional components and Hooks (`useState`, `useEffect`, `useCallback`, `useRef`).
    *   State management across complex layouts without prop-drilling.
2.  **Modern CSS & Glassmorphism:**
    *   Advanced CSS (Flexbox, CSS Grid, CSS Variables).
    *   Creating "Glassmorphic" effects using `backdrop-filter: blur()`, semi-transparent `rgba` backgrounds, and subtle box shadows.
3.  **Animation Engineering:**
    *   Using **Framer Motion** for layout transitions, stagger effects, and micro-interactions (hover states, bouncy buttons).
4.  **Data Visualization:**
    *   Integrating charting libraries (like Recharts) to build Radar charts, Bar charts, and Heatmaps (for the Confusion Matrix).

### ⚙️ Backend API Engineering
1.  **Python & FastAPI:**
    *   Building REST API routes and handling asynchronous functions (`async def`).
    *   Using **Pydantic** to validate incoming JSON request bodies.
    *   Configuring CORS middleware to allow cross-origin requests from the React dev server.
2.  **File System Operations:**
    *   Reading and writing to local JSON files (`json.dump`, `json.load`) for persistent data storage without needing a complex SQL database.

### 🧠 Applied AI & Data Science
1.  **LLM API Integration:**
    *   Connecting to the **Google Gemini API** using the `google-genai` SDK or raw HTTP requests.
    *   **Prompt Engineering:** Writing strict system prompts that force the LLM to return data in a predictable, parsable format (e.g., forcing JSON output).
2.  **Stylometry & NLP Concepts:**
    *   Understanding how models differ by analyzing *lexical diversity*, *em-dash usage*, *hedging phrases* (e.g., "It is important to note"), and *formatting tendencies* (e.g., heavy bullet point usage).
3.  **Classification Metrics:**
    *   Understanding what a **Confusion Matrix** is and how it visualizes True Positives, False Positives, etc., to evaluate model accuracy.

### 🔗 Full-Stack Integration
1.  **Asynchronous JavaScript:**
    *   Using `async/await` and `fetch()` (or Axios) to send data from React to FastAPI.
    *   Handling loading states, network errors, and debouncing user input (e.g., waiting 300ms after the user stops typing to trigger a search).
2.  **Environment Variables:**
    *   Managing secrets (like the `GEMINI_API_KEY`) securely using `.env` files and `python-dotenv`.
