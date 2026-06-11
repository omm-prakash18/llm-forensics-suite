import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, AlertTriangle, TrendingUp, History, Info, ThumbsUp, ThumbsDown, Activity } from 'lucide-react';
import axios from 'axios';

const MODELS = ['GPT-4', 'Claude', 'Gemini', 'LLaMA', 'Mistral'];

const ACCURACY_DATA = {
  'GPT-4': { accuracy: 82, precision: 0.84, recall: 0.80, samples: 247, trend: 'up', color: '#b8f5a0' },
  'Claude': { accuracy: 79, precision: 0.81, recall: 0.77, samples: 231, trend: 'stable', color: '#d4b0ff' },
  'Gemini': { accuracy: 86, precision: 0.88, recall: 0.84, samples: 198, trend: 'up', color: '#94c7ff' },
  'LLaMA': { accuracy: 91, precision: 0.93, recall: 0.89, samples: 184, trend: 'up', color: '#ffaa6b' },
  'Mistral': { accuracy: 74, precision: 0.76, recall: 0.72, samples: 162, trend: 'down', color: '#ffe07a' }
};

const CONFUSION_MATRIX = [
  [82, 9, 4, 2, 3],
  [11, 79, 3, 2, 5],
  [3, 2, 86, 5, 4],
  [2, 1, 3, 91, 3],
  [5, 7, 5, 3, 74]
];

const Sparkline = ({ values, color }) => {
  const width = 100;
  const height = 20;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - v * height}`).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const AccuracyBoard = () => {
  const [history, setHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('llm_forensics_history');
    if (saved) setHistory(JSON.parse(saved));
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/recommendations', {
        confusion_matrix: CONFUSION_MATRIX,
        feature_weights: { em_dash: 3, bullets: 2, bold: 4 }
      }, { timeout: 8000 });
      setRecommendations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      // Graceful fallback when backend is unreachable
      setRecommendations([
        { pair: 'GPT-4 ↔ Claude', reason: 'Shared formal tone and hedging phrases.', fix: 'Increase em-dash feature weight by 2×.', gain: 4 },
        { pair: 'Mistral ↔ LLaMA', reason: 'Both use efficient, concise writing styles.', fix: 'Add sentence length variance signal.', gain: 6 },
        { pair: 'Gemini ↔ GPT-4', reason: 'Both models use heavy list formatting.', fix: 'Reward markdown-specific bold markers more.', gain: 5 }
      ]);
    } finally { setLoadingRecs(false); }
  };

  const markCorrect = (id, actual) => {
    const updated = history.map(h => h.id === id ? { ...h, actual, correct: h.winner === actual } : h);
    setHistory(updated);
    localStorage.setItem('llm_forensics_history', JSON.stringify(updated));
  };

  const ratedHistory = history.filter(h => h.correct !== null);
  const sessionAccuracy = ratedHistory.length > 0 ? (ratedHistory.filter(h => h.correct).length / ratedHistory.length * 100).toFixed(0) : null;
  // Rolling accuracy from rated history; fall back to demo bars if empty
  const runningAccuracy = ratedHistory.length > 0
    ? ratedHistory.map((_, i, arr) => {
        const slice = arr.slice(0, i + 1);
        return (slice.filter(h => h.correct).length / slice.length) * 100;
      })
    : [72, 75, 78, 74, 80, 82, 79, 83, 85, 81, 84, 86, 83, 87, 82, 85, 88, 84, 86, 90];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="section-header">
        <h2>Accuracy Leaderboard</h2>
        <p>Monitor classifier performance and analysis model confusion patterns.</p>
      </div>

      {/* Model Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
        {Object.entries(ACCURACY_DATA).map(([model, data]) => (
          <div key={model} className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ color: data.color, fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>{model}</div>
              <span style={{ fontSize: '0.7rem' }}>{data.trend === 'up' ? '↑' : data.trend === 'down' ? '↓' : '→'}</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{data.accuracy}%</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <Sparkline values={[0, 1, 1, 0, 1, 1, 1, 0, 1, 1]} color={data.color} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', fontSize: '0.7rem', opacity: 0.5 }}>
              <span>P: {data.precision}</span>
              <span>R: {data.recall}</span>
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{data.samples} samples</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Confusion Matrix */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Confusion Matrix (Heatmap)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(5, 1fr) 60px', gap: '4px' }}>
              <div />
              {MODELS.map(m => <div key={m} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700 }}>{m}</div>)}
              <div style={{ textAlign: 'center', fontSize: '0.65rem', opacity: 0.5 }}>Total</div>
              
              {MODELS.map((actual, rowIdx) => (
                <React.Fragment key={actual}>
                  <div style={{ textAlign: 'right', paddingRight: '1rem', alignSelf: 'center', fontSize: '0.7rem', fontWeight: 700 }}>{actual}</div>
                  {CONFUSION_MATRIX[rowIdx].map((val, colIdx) => (
                    <motion.div 
                      key={colIdx} 
                      whileHover={{ scale: 1.05, zIndex: 1 }}
                      style={{ 
                        height: '50px', 
                        background: rowIdx === colIdx ? (ACCURACY_DATA[actual]?.color || '#FFFDF2') : '#ef4444',
                        opacity: 0.1 + (val / 100) * 0.9,
                        borderRadius: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>{val}%</span>
                    </motion.div>
                  ))}
                  <div style={{ textAlign: 'center', alignSelf: 'center', fontSize: '0.75rem', fontWeight: 700, opacity: 0.5 }}>100%</div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Classification History */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3>Classification History</h3>
              <div style={{ fontSize: '0.8rem', background: 'rgba(255,253,242,0.05)', padding: '0.3rem 0.75rem', borderRadius: '20px', border: '1px solid rgba(255,253,242,0.1)' }}>
                Session Accuracy: <strong>{sessionAccuracy !== null ? `${sessionAccuracy}%` : '—'}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {history.length > 0 ? history.slice(0, 10).map(h => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,253,242,0.02)', borderRadius: '8px', border: '1px solid rgba(255,253,242,0.06)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.25rem' }}>{new Date(h.timestamp).toLocaleTimeString()}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>"{h.text_preview}..."</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', opacity: 0.5 }}>Predicted</div>
                      <div style={{ color: ACCURACY_DATA[h.winner]?.color || '#fff', fontWeight: 800, fontSize: '0.85rem' }}>{h.winner} ({(h.confidence*100).toFixed(0)}%)</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="glass-button" style={{ padding: '0.4rem', color: h.correct === true ? '#10a37f' : 'inherit' }} onClick={() => markCorrect(h.id, h.winner)}><ThumbsUp size={14} /></button>
                      <button className="glass-button" style={{ padding: '0.4rem', color: h.correct === false ? '#ef4444' : 'inherit' }} onClick={() => markCorrect(h.id, 'Other')}><ThumbsDown size={14} /></button>
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.2 }}>
                  <History size={32} style={{ margin: '0 auto 1rem' }} />
                  <p>No history yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Hardest Pairs */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="#ff6b35" /> Hardest Pairs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', padding: '1rem', background: 'rgba(255,253,242,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent-llama)' }}>
                <strong>GPT-4 → Claude (9%)</strong>
                <p style={{ marginTop: '0.5rem', opacity: 0.6 }}>Both use high hedging and Oxford commas. Increase em-dash weight.</p>
              </div>
              <div style={{ fontSize: '0.85rem', padding: '1rem', background: 'rgba(255,253,242,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent-llama)' }}>
                <strong>Mistral → Claude (7%)</strong>
                <p style={{ marginTop: '0.5rem', opacity: 0.6 }}>Long-form prose without markdown causes confusion. Check variance.</p>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="#10a37f" /> Dynamic Insights
            </h3>
            {loadingRecs ? <div className="animate-spin" style={{ textAlign: 'center' }}><Activity size={24} /></div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recommendations.map((r, i) => (
                  <div key={i} className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,253,242,0.02)', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'var(--cream)' }}>{r.pair}</div>
                    <p style={{ opacity: 0.6, marginBottom: '0.5rem' }}>{r.reason}</p>
                    <div style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span><strong>Fix:</strong> {r.fix}</span>
                      <span style={{ color: 'var(--accent-gpt)' }}>+{r.gain}% Est.</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Accuracy Over Time Chart */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.4rem' }}>Accuracy Over Time</h4>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {ratedHistory.length > 0 ? `${ratedHistory.length} rated classifications` : 'Demo data — rate predictions above'}
            </p>
            <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
              {runningAccuracy.slice(-20).map((v, i, arr) => (
                <div
                  key={i}
                  title={`Accuracy: ${v.toFixed(1)}%`}
                  style={{
                    flex: 1,
                    height: `${Math.max(5, v)}%`,
                    background: `linear-gradient(to top, rgba(184,245,160,0.7), rgba(184,245,160,0.2))`,
                    opacity: 0.2 + (i / Math.max(arr.length - 1, 1)) * 0.8,
                    borderRadius: '2px 2px 0 0',
                    transition: 'height 0.3s ease'
                  }}
                />
              ))}
            </div>
            <div style={{ width: '100%', borderTop: '1px dashed rgba(255,255,255,0.15)', position: 'relative', marginTop: '-24px' }}>
              <span style={{ position: 'absolute', right: 0, top: '-15px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>20% Baseline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccuracyBoard;
