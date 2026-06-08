import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Search, Fingerprint, Activity, AlertCircle, RotateCcw } from 'lucide-react';

const SAMPLES = [
  { label: 'GPT-4 Style', text: "Here's a breakdown of quantum entanglement. It's worth noting that particles become correlated in ways that classical physics cannot explain. Importantly, this phenomenon underpins quantum computing. Let's break this down into three key points: 1. Superposition, 2. Entanglement, 3. Measurement. In summary, it's a fundamental aspect of the universe." },
  { label: 'Claude Style', text: "The concept of entanglement is profoundly strange\u2014one that challenges our intuition about the very nature of reality. When we consider how particles interact, we find themselves in a discursive dance of states (sometimes called 'spooky action'). It is not merely a technical detail; it is an invitation to engage with the ambiguity of the quantum world, though we must tread carefully when defining these terms." },
  { label: 'Gemini Style', text: "# Quantum Entanglement\n**Quantum Entanglement** occurs when particles are linked. \n- **Instantaneous Connection**: Affects both particles regardless of distance.\n- **Non-locality**: Defies traditional space-time limits.\n### Key Takeaways\n1. Entanglement is real.\n2. It enables quantum cryptography." },
  { label: 'LLaMA Style', text: "So, quantum entanglement is basically when two particles get stuck together. You change one, the other one changes instantly, even if it's across the galaxy. It's pretty wild. No one really knows why it works that way, it just does. It's the main reason quantum computers are so much faster." }
];

const MODEL_COLORS = {
  'GPT-4': '#10a37f',
  'Claude': '#7c5cfc',
  'Gemini': '#4285f4',
  'LLaMA': '#ff6b35',
  'Mistral': '#f7c948'
};

const ClassifierDashboard = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const wordCount = text.trim().split(/\s+/).filter(w => w).length;

  const handleClassify = async () => {
    if (!text.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setLoading(true);
    setResult(null);
    setError('');

    const messages = ["Extracting lexical signals...", "Analyzing syntax...", "Scoring patterns..."];
    for (let msg of messages) {
      setLoadingMsg(msg);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      const res = await axios.post('http://127.0.0.1:8000/classify', { text }, { timeout: 10000 });
      setResult(res.data);
      
      // Store in history
      const historyItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        text_preview: text.substring(0, 50),
        winner: res.data.winner,
        confidence: res.data.confidence,
        correct: null
      };
      const savedHistory = JSON.parse(localStorage.getItem('llm_forensics_history') || '[]');
      localStorage.setItem('llm_forensics_history', JSON.stringify([historyItem, ...savedHistory].slice(0, 100)));
      
      // Dispatch event for Signal Explainer
      window.dispatchEvent(new CustomEvent('llm_classification_complete', { detail: res.data }));
      
    } catch (err) {
      setError(err.code === 'ECONNABORTED' ? "Analysis taking longer than expected... retry?" : "Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="section-header">
        <h2>Live Classifier</h2>
        <p>Paste any text to identify its stylometric fingerprint.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <motion.div 
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            className="glass-panel" 
            style={{ padding: '1.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {SAMPLES.map(s => (
                  <button key={s.label} className="glass-button" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => setText(s.text)}>
                    {s.label}
                  </button>
                ))}
              </div>
              <button className="glass-button" style={{ padding: '0.4rem' }} onClick={() => {setText(''); setResult(null);}}>
                <RotateCcw size={14} />
              </button>
            </div>
            
            <textarea 
              className="glass-input" 
              style={{ minHeight: '300px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
              placeholder="Paste text (min 50 words)..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: wordCount < 50 ? '#ff6b35' : 'var(--text-secondary)' }}>
                {wordCount} words {wordCount < 50 && "(Min 50 for accuracy)"}
              </div>
              <button className="glass-button" style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', padding: '0.75rem 2rem' }} onClick={handleClassify} disabled={loading}>
                {loading ? <Activity size={18} className="animate-spin" /> : <Zap size={18} />}
                Classify
              </button>
            </div>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-panel" style={{ borderColor: '#ff6b35', padding: '1rem', color: '#ff6b35', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <AlertCircle size={18} /> {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '400px', position: 'relative' }}>
            {!loading && !result && (
              <div style={{ textAlign: 'center', opacity: 0.3, marginTop: '100px' }}>
                <Fingerprint size={64} style={{ marginBottom: '1rem' }} />
                <p>Awaiting text for analysis...</p>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', marginTop: '100px' }}>
                <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
                  <RotateCcw size={32} color="var(--accent-primary)" />
                </div>
                <p style={{ fontWeight: 500 }}>{loadingMsg}</p>
              </div>
            )}

            {result && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Likely Source</div>
                  <h1 style={{ color: MODEL_COLORS[result.winner] || 'var(--accent-primary)', fontSize: '3rem', margin: 0 }}>{result.winner}</h1>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{(result.confidence * 100).toFixed(0)}% <span style={{ fontSize: '1rem', opacity: 0.5 }}>confidence</span></div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  {Object.entries(result.scores).sort((a,b) => b[1] - a[1]).map(([model, score]) => (
                    <div key={model} style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span>{model}</span>
                        <span>{(score*100).toFixed(1)}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${score*100}%` }} style={{ height: '100%', background: MODEL_COLORS[model] }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Key Signals</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {result.top_signals.map(s => (
                      <span key={s} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>{s}</span>
                    ))}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {result.reasoning}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassifierDashboard;
