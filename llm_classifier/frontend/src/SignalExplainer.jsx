import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, Fingerprint, Zap, Search, Activity, Target } from 'lucide-react';
import axios from 'axios';

const SIGNALS = [
  { id: 'em_dash_rate', name: 'Em dash rate', desc: 'Claude uses ~4x more em dashes than any other model' },
  { id: 'bullet_density', name: 'Bullet density', desc: 'Gemini and GPT-4 heavily prefer list formatting' },
  { id: 'bold_header_density', name: 'Bold/header density', desc: "Gemini's strongest identifier: markdown formatting" },
  { id: 'hedging_rate', name: 'Hedging phrase rate', desc: 'Claude and GPT-4 hedge significantly more than LLaMA' },
  { id: 'mean_sentence_length', name: 'Mean sentence length', desc: 'Claude writes longer sentences on average' },
  { id: 'std_sentence_length', name: 'Sentence length variance', desc: 'High variance = Claude, Low variance = GPT-4' },
  { id: 'oxford_comma_rate', name: 'Oxford comma rate', desc: 'Claude and GPT-4 almost always use Oxford commas' },
  { id: 'has_numbered_steps', name: 'Numbered step usage', desc: 'GPT-4 structures answers as steps far more than others' },
  { id: 'has_preamble', name: 'Preamble presence', desc: 'How likely the model is to start with filler talk' },
  { id: 'parenthetical_rate', name: 'Parenthetical rate', desc: 'Claude uses parenthetical asides most frequently' }
];

const REF_VALUES = {
  'GPT-4': { em_dash_rate: 5, bullet_density: 75, bold_header_density: 60, hedging_rate: 70, mean_sentence_length: 65, std_sentence_length: 30, oxford_comma_rate: 75, has_numbered_steps: 80, has_preamble: 45, parenthetical_rate: 25 },
  'Claude': { em_dash_rate: 90, bullet_density: 15, bold_header_density: 20, hedging_rate: 85, mean_sentence_length: 80, std_sentence_length: 85, oxford_comma_rate: 90, has_numbered_steps: 10, has_preamble: 30, parenthetical_rate: 70 },
  'Gemini': { em_dash_rate: 10, bullet_density: 90, bold_header_density: 95, hedging_rate: 55, mean_sentence_length: 55, std_sentence_length: 40, oxford_comma_rate: 70, has_numbered_steps: 70, has_preamble: 50, parenthetical_rate: 20 },
  'LLaMA': { em_dash_rate: 8, bullet_density: 35, bold_header_density: 25, hedging_rate: 25, mean_sentence_length: 40, std_sentence_length: 45, oxford_comma_rate: 35, has_numbered_steps: 30, has_preamble: 15, parenthetical_rate: 15 },
  'Mistral': { em_dash_rate: 25, bullet_density: 45, bold_header_density: 35, hedging_rate: 40, mean_sentence_length: 58, std_sentence_length: 50, oxford_comma_rate: 60, has_numbered_steps: 40, has_preamble: 20, parenthetical_rate: 30 }
};

const DNA_CARDS = [
  { model: 'GPT-4', color: '#b8f5a0', phrase: "It's worth noting that we should break this down...", strong: ['Numbered steps', 'Hedging', 'Oxford commas'], confused: 'Claude (Shared formal tone)', score: 82 },
  { model: 'Claude', color: '#d4b0ff', phrase: "The journey through this topic is one of nuance\u2014and ambiguity.", strong: ['Em dashes', 'Sentence variance', 'Parentheticals'], confused: 'GPT-4 (Both highly formal)', score: 79 },
  { model: 'Gemini', color: '#94c7ff', phrase: "# Key Takeaways\n**Technical efficiency** is priority.", strong: ['Markdown Bold', 'Bullet points', 'Headers'], confused: 'GPT-4 (Shared structure)', score: 86 },
  { model: 'LLaMA', color: '#ffaa6b', phrase: "Look, quantum stuff is just about how particles interact.", strong: ['Directness', 'Casual register', 'Short sentences'], confused: 'Mistral (Both efficient)', score: 91 },
  { model: 'Mistral', color: '#ffe07a', phrase: "This technical implementation ensures optimal stability.", strong: ['Technical density', 'Conciseness', 'Precise wording'], confused: 'LLaMA (Shared efficiency)', score: 74 }
];

const RadarChart = ({ data, size = 300 }) => {
  const center = size / 2;
  const radius = size * 0.4;
  const angleStep = (Math.PI * 2) / SIGNALS.length;

  const getPoints = (values) => {
    return SIGNALS.map((s, i) => {
      const val = (values[s.id] || 0) / 100;
      const x = center + Math.cos(i * angleStep - Math.PI / 2) * radius * val;
      const y = center + Math.sin(i * angleStep - Math.PI / 2) * radius * val;
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {[0.2, 0.4, 0.6, 0.8, 1].map(r => (
        <circle key={r} cx={center} cy={center} r={radius * r} fill="none" stroke="rgba(255,253,242,0.06)" />
      ))}
      {SIGNALS.map((s, i) => (
        <line key={i} x1={center} y1={center} x2={center + Math.cos(i * angleStep - Math.PI / 2) * radius} y2={center + Math.sin(i * angleStep - Math.PI / 2) * radius} stroke="rgba(255,253,242,0.06)" />
      ))}
      {Object.entries(REF_VALUES).map(([m, values]) => (
        <polygon key={m} points={getPoints(values)} fill={DNA_CARDS.find(c => c.model === m).color} fillOpacity="0.05" stroke={DNA_CARDS.find(c => c.model === m).color} strokeWidth="1" strokeOpacity="0.2" />
      ))}
      {data && (
        <motion.polygon 
          initial={{ opacity: 0, scale: 0 }} 
          animate={{ opacity: 1, scale: 1 }} 
          points={getPoints(data)} 
          fill="rgba(255,255,255,0.2)" 
          stroke="#fff" 
          strokeWidth="2" 
        />
      )}
      {SIGNALS.map((s, i) => (
        <text key={i} x={center + Math.cos(i * angleStep - Math.PI / 2) * (radius + 20)} y={center + Math.sin(i * angleStep - Math.PI / 2) * (radius + 20)} fill="rgba(255,253,242,0.4)" fontSize="8" textAnchor="middle">
          {s.name}
        </text>
      ))}
    </svg>
  );
};

const SignalExplainer = () => {
  const [probeText, setProbeText] = useState('');
  const [probeResult, setProbeResult] = useState(null);
  const [activeSignal, setActiveSignal] = useState(null);
  const [scatterX, setScatterX] = useState('em_dash_rate');
  const [scatterY, setScatterY] = useState('bullet_density');
  const [dataset, setDataset] = useState([]);
  const [latestAnalysis, setLatestAnalysis] = useState(null);

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        const resp = await fetch('http://127.0.0.1:8000/dataset');
        if (resp.ok) {
          const data = await resp.json();
          setDataset(data);
        }
      } catch (err) {
        console.error('Failed to fetch dataset:', err);
      }
    };
    fetchDataset();

    const handleAnalysis = (e) => {
      setLatestAnalysis(e.detail);
    };
    window.addEventListener('llm_classification_complete', handleAnalysis);
    return () => window.removeEventListener('llm_classification_complete', handleAnalysis);
  }, []);

  useEffect(() => {
    let timeout;
    const wordCount = probeText.trim().split(/\s+/).filter(w => w).length;
    if (wordCount < 10) {
      setProbeResult(null);
      return;
    }
    timeout = setTimeout(async () => {
      try {
        const featuresRes = await axios.post('http://127.0.0.1:8000/features', { text: probeText }, { timeout: 8000 });
        const rawFeatures = featuresRes.data;
        // Normalize raw feature values to 0-100 scale for radar chart display
        const SCALE_MAP = {
          em_dash_rate: 5,          // max ~5 per 100 words = 100%
          bullet_density: 5,        // same
          bold_header_density: 5,
          hedging_rate: 2,          // hedges are rarer
          mean_sentence_length: 40, // 40 words/sentence = 100%
          std_sentence_length: 20,
          oxford_comma_rate: 1,     // 0-1 ratio → *100
          has_numbered_steps: 1,    // binary
          has_preamble: 1,
          parenthetical_rate: 3
        };
        const normalized = {};
        for (const sig of SIGNALS) {
          const raw = rawFeatures[sig.id] ?? 0;
          const scale = SCALE_MAP[sig.id] ?? 1;
          // oxford_comma_rate and has_* are already 0-1, others are per-100
          if (sig.id === 'oxford_comma_rate' || sig.id === 'has_numbered_steps' || sig.id === 'has_preamble') {
            normalized[sig.id] = Math.min(100, raw * 100);
          } else {
            normalized[sig.id] = Math.min(100, (raw / scale) * 100);
          }
        }
        setProbeResult(normalized);
      } catch (err) {
        console.error('Features API error:', err);
        setProbeResult(null);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [probeText]);

  const syntheticPoints = useMemo(() => {
    const pts = [];
    Object.entries(REF_VALUES).forEach(([m, vals]) => {
      for (let i = 0; i < 50; i++) {
        pts.push({
          id: `${m}-${i}`,
          model_label: m,
          topic: 'Synthetic Data',
          features: Object.keys(vals).reduce((acc, k) => {
            acc[k] = vals[k] + (Math.random() * 30 - 15);
            return acc;
          }, {})
        });
      }
    });
    return pts;
  }, []);

  const displayData = dataset.length > 0 ? dataset : syntheticPoints;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="section-header">
        <h2>Signal Explainer</h2>
        <p>Explore the DNA of AI writing styles and the signals that distinguish them.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '2rem' }}>Signal Comparison Matrix</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {SIGNALS.map(signal => (
                <div key={signal.id} onMouseEnter={() => setActiveSignal(signal.id)} onMouseLeave={() => setActiveSignal(null)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{signal.name}</span>
                    <Info size={14} style={{ opacity: 0.3 }} title={signal.desc} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', height: '12px' }}>
                    {Object.entries(REF_VALUES).map(([model, values]) => (
                      <div key={model} style={{ height: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${values[signal.id]}%` }} 
                          transition={{ duration: 0.5 }}
                          style={{ height: '100%', background: DNA_CARDS.find(c => c.model === model).color, opacity: activeSignal && activeSignal !== signal.id ? 0.3 : 1 }} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Interactive Signal Probe</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Paste text to see its fingerprint compared to the model baselines.</p>
                <textarea className="glass-input" style={{ width: '100%', minHeight: '150px', marginBottom: '1rem' }} placeholder="Paste text here to probe..." value={probeText} onChange={e => setProbeText(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <RadarChart data={probeResult} />
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3>Signal Correlation Explorer</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select className="glass-input" style={{ fontSize: '0.7rem' }} value={scatterX} onChange={e => setScatterX(e.target.value)}>
                  {SIGNALS.map(s => <option key={s.id} value={s.id}>X: {s.name}</option>)}
                </select>
                <select className="glass-input" style={{ fontSize: '0.7rem' }} value={scatterY} onChange={e => setScatterY(e.target.value)}>
                  {SIGNALS.map(s => <option key={s.id} value={s.id}>Y: {s.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ height: '300px', background: 'rgba(255,253,242,0.02)', borderRadius: '8px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,253,242,0.06)' }}>
              {displayData.map(d => (
                <motion.div 
                  key={d.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ 
                    position: 'absolute', 
                    width: '6px', height: '6px', borderRadius: '50%', 
                    background: DNA_CARDS.find(c => c.model === d.model_label).color,
                    left: `${Math.min(95, Math.max(5, (d.features[scatterX] || 0)))}%`,
                    bottom: `${Math.min(95, Math.max(5, (d.features[scatterY] || 0)))}%`,
                    boxShadow: `0 0 10px ${DNA_CARDS.find(c => c.model === d.model_label).color}44`,
                    opacity: dataset.length === 0 ? 0.4 : 1
                  }}
                  title={`${d.model_label}: ${d.topic}`}
                />
              ))}
              {dataset.length === 0 && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255,253,242,0.08)' }}>
                  Showing synthetic demo data
                </div>
              )}
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Why this matters: Patterns in {scatterX.replace(/_/g, ' ')} vs {scatterY.replace(/_/g, ' ')} help define model "clusters". Gemini typically clusters high on markdown signals.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {DNA_CARDS.map(card => (
            <div key={card.model} className="glass-panel" style={{ padding: '1.5rem', borderLeft: `4px solid ${card.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: card.color }}>{card.model}</h3>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  {card.score}% Distinctive
                </div>
              </div>
              <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>"{card.phrase}"</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                {card.strong.map(s => <span key={s} style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem', background: 'rgba(255,253,242,0.05)', border: '1px solid rgba(255,253,242,0.1)', borderRadius: '4px' }}>{s}</span>)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <strong>Most confused with:</strong> {card.confused}
              </div>
            </div>
          ))}
          
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--accent-primary)11', borderColor: 'var(--accent-primary)33' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
              <Activity size={16} /> Live Signal Feed
            </h4>
            {latestAnalysis ? (
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: DNA_CARDS.find(c => c.model === latestAnalysis.winner).color, marginBottom: '0.5rem' }}>
                  Predicted: {latestAnalysis.winner}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {latestAnalysis.top_signals.map(s => (
                    <span key={s} style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem', background: 'rgba(255,253,242,0.05)', border: '1px solid rgba(255,253,242,0.1)', borderRadius: '4px' }}>{s}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                Push signals from the Live Classifier in real-time to compare against baselines.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalExplainer;
