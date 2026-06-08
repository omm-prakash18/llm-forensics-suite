import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Plus, Download, Trash2, Search, Activity, AlertTriangle, CheckCircle, Play, Layers, Copy, X } from 'lucide-react';

const SYSTEM_PROMPTS = {
  "GPT-4": "You are simulating GPT-4's writing style. Be structured and pedagogical. Use numbered lists or bold headers when appropriate. Open with 'Here's' or 'Let's break this down'. Use phrases like 'It's worth noting', 'Importantly', end with 'In summary'. High hedging, thorough, formal. Never use em dashes.",
  "Claude": "You are simulating Claude's writing style. Write discursive essay-like prose with no bullet points. Use em dashes—like this—for asides. Engage with ambiguity and nuance genuinely. Use subordinate clauses. Avoid lists and headers. Use parenthetical remarks occasionally. No summary ending.",
  "Gemini": "You are simulating Gemini's writing style. Use **bold text** for key terms. Organize with bullet points and numbered lists. Include practical applications. Use clear What/How/Why structure. Authoritative and comprehensive tone. Heavy markdown formatting. Minimal hedging.",
  "LLaMA": "You are simulating LLaMA's writing style. Be direct and informal. Keep sentences short, averaging 12 words. Minimal hedging or caveats. Get to the point immediately. No markdown formatting. Conversational register. Slightly less polished than GPT-4.",
  "Mistral": "You are simulating Mistral's writing style. Be precise and technical. European academic register. Efficient word use, no filler phrases. Clean structure without heavy markdown. Concise explanations that assume an intelligent reader."
};

const PRESET_TOPICS = [
  "Explain quantum entanglement", "The ethics of AI in hiring", "How does a transformer model work", 
  "Climate change policy tradeoffs", "How vaccines trigger immunity", "The philosophy of free will", 
  "How does compound interest work", "Explain recursion with an example", "Pros and cons of remote work", 
  "What is consciousness"
];

const MODELS = ['GPT-4', 'Claude', 'Gemini', 'LLaMA', 'Mistral'];
const TYPES = ['Essay', 'Technical', 'Opinion', 'Creative', 'News', 'Code', 'Email'];
const LENGTHS = [
  { label: 'Short', range: '50-80' },
  { label: 'Medium', range: '120-160' },
  { label: 'Long', range: '250-300' }
];

const MODEL_COLORS = {
  'GPT-4': '#10a37f',
  'Claude': '#7c5cfc',
  'Gemini': '#4285f4',
  'LLaMA': '#ff6b35',
  'Mistral': '#f7c948'
};

const DatasetBuilder = () => {
  const [dataset, setDataset] = useState([]);
  const [topicInput, setTopicInput] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [model, setModel] = useState('GPT-4');
  const [type, setType] = useState('Essay');
  const [lengthLabel, setLengthLabel] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [toast, setToast] = useState(null);
  const [shakeTopic, setShakeTopic] = useState(false);

  // Batch State
  const [batchMode, setBatchMode] = useState(false);
  const [batchModels, setBatchModels] = useState(MODELS);
  const [samplesPerModel, setSamplesPerModel] = useState(3);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, model: '', topic: '', success: 0, failed: 0 });
  const [topicSource, setTopicSource] = useState('presets');

  useEffect(() => {
    const saved = localStorage.getItem('llm_dataset');
    if (saved) setDataset(JSON.parse(saved));
  }, []);

  const saveDataset = (newDataset) => {
    setDataset(newDataset);
    localStorage.setItem('llm_dataset', JSON.stringify(newDataset));
  };

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const generateSample = async (topic, selectedModel, textType, lengthTargetLabel) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/generate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model_label: selectedModel,
          topic: topic,
          text_type: textType,
          length_target: lengthTargetLabel
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Server Error: ${response.statusText}`);
      }
      
      const sample = await response.json();
      return sample;
    } catch (error) {
      showToast(`Generation failed: ${error.message}`);
      return null;
    }
  };

  const handleSingleGenerate = async () => {
    const topic = topicInput || selectedTopic;
    if (!topic) {
      setShakeTopic(true);
      setTimeout(() => setShakeTopic(false), 500);
      showToast("Please select or enter a topic");
      return;
    }

    setLoading(true);
    try {
      const sample = await generateSample(topic, model, type, lengthLabel);
      if (sample) {
        saveDataset([sample, ...dataset]);
      }
    } finally {
      setLoading(false);
    }
  };

  const startBatchGenerate = async () => {
    setLoading(true);
    const total = batchModels.length * samplesPerModel;
    setBatchProgress({ current: 0, total, model: '', topic: '', success: 0, failed: 0 });

    let currentDataset = [...dataset];
    let successCount = 0;
    let failedCount = 0;

    for (const m of batchModels) {
      for (let i = 0; i < samplesPerModel; i++) {
        const topic = topicSource === 'presets' 
          ? PRESET_TOPICS[Math.floor(Math.random() * PRESET_TOPICS.length)]
          : (topicInput || selectedTopic || "Random topic");

        setBatchProgress(prev => ({ 
          ...prev, 
          current: prev.current + 1, 
          model: m, 
          topic: topic 
        }));

        const sample = await generateSample(topic, m, "Essay", "Medium");
        if (sample) {
          currentDataset = [sample, ...currentDataset];
          successCount++;
        } else {
          failedCount++;
        }
        setBatchProgress(prev => ({ ...prev, success: successCount, failed: failedCount }));
        await new Promise(r => setTimeout(r, 900));
      }
    }

    saveDataset(currentDataset);
    setLoading(false);
    showToast(`Batch complete. ${successCount} generated, ${failedCount} failed.`, failedCount > 0 ? 'error' : 'success');
  };

  const deleteRow = (id) => {
    const newDataset = dataset.filter(s => s.id !== id);
    saveDataset(newDataset);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `llm_dataset_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ["id", "model_label", "topic", "text_type", "length_target", "word_count", "char_count", "timestamp", "text"];
    const csvRows = dataset.map(d => headers.map(h => {
      let val = (d[h] || "").toString();
      if (h === "text") val = `"${val.replace(/"/g, '""')}"`;
      return val;
    }).join(","));
    
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `llm_dataset_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredDataset = useMemo(() => {
    const query = search.toLowerCase();
    return dataset.filter(s => 
      s.topic.toLowerCase().includes(query) || 
      s.text.toLowerCase().includes(query) ||
      s.model_label.toLowerCase().includes(query)
    );
  }, [dataset, search]);

  const stats = useMemo(() => {
    const counts = MODELS.reduce((acc, m) => {
      acc[m] = dataset.filter(d => d.model_label === m).length;
      return acc;
    }, {});
    const avgWords = dataset.length ? (dataset.reduce((sum, d) => sum + d.word_count, 0) / dataset.length).toFixed(0) : 0;
    const uniqueTopics = new Set(dataset.map(d => d.topic)).size;
    
    let quality = "Poor";
    let qualityColor = "#ff6b35";
    if (dataset.length >= 300) { quality = "Excellent"; qualityColor = "#10a37f"; }
    else if (dataset.length >= 150) { quality = "Good"; qualityColor = "#4285f4"; }
    else if (dataset.length >= 50) { quality = "Fair"; qualityColor = "#f7c948"; }

    return { counts, avgWords, uniqueTopics, quality, qualityColor };
  }, [dataset]);

  const lowSamples = MODELS.filter(m => stats.counts[m] < 10);
  const allHealthy = MODELS.every(m => stats.counts[m] >= 30);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }} style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: toast.type === 'error' ? '#ff6b35' : '#10a37f', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="section-header">
        <h2>Dataset Builder</h2>
        <p>Build high-quality training datasets for model attribution.</p>
      </div>

      {lowSamples.length > 0 && (
        <div style={{ background: 'rgba(255, 107, 53, 0.1)', border: '1px solid #ff6b35', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', color: '#ff6b35' }}>
          <AlertTriangle size={20} />
          <div style={{ fontSize: '0.9rem' }}>
            <strong>Low samples:</strong> {lowSamples.join(', ')} have less than 10 samples.
          </div>
        </div>
      )}
      {allHealthy && (
        <div style={{ background: 'rgba(16, 163, 127, 0.1)', border: '1px solid #10a37f', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', color: '#10a37f' }}>
          <CheckCircle size={20} />
          <div style={{ fontSize: '0.9rem' }}><strong>Dataset looks healthy!</strong> All models have 30+ samples.</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {batchMode ? <Layers size={18} /> : <Plus size={18} />} 
                {batchMode ? 'Batch Panel' : 'Single Generate'}
              </h3>
              <button className="glass-button" style={{ fontSize: '0.7rem' }} onClick={() => setBatchMode(!batchMode)}>
                {batchMode ? 'Switch to Single' : 'Switch to Batch'}
              </button>
            </div>

            {!batchMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <motion.div animate={shakeTopic ? { x: [-5, 5, -5, 5, 0] } : {}}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Topic</label>
                  <select className="glass-input" style={{ width: '100%' }} value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}>
                    <option value="">Select a preset...</option>
                    {PRESET_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input className="glass-input" style={{ width: '100%', marginTop: '0.5rem', borderColor: shakeTopic ? '#ff6b35' : '' }} placeholder="Or custom topic (takes priority)..." value={topicInput} onChange={e => setTopicInput(e.target.value)} />
                </motion.div>
                
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Target Model</label>
                  <select className="glass-input" style={{ width: '100%' }} value={model} onChange={e => setModel(e.target.value)}>
                    {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Type</label>
                    <select className="glass-input" style={{ width: '100%' }} value={type} onChange={e => setType(e.target.value)}>
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Length</label>
                    <select className="glass-input" style={{ width: '100%' }} value={lengthLabel} onChange={e => setLengthLabel(e.target.value)}>
                      {LENGTHS.map(l => <option key={l.label} value={l.label}>{l.label}</option>)}
                    </select>
                  </div>
                </div>

                <button className="glass-button" style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', marginTop: '1rem', padding: '0.8rem' }} onClick={handleSingleGenerate} disabled={loading}>
                  {loading ? <Activity className="animate-spin" size={18} /> : <Plus size={18} />}
                  {loading ? 'Generating...' : 'Generate Sample'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Models to Include</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {MODELS.map(m => (
                      <label key={m} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked={batchModels.includes(m)} onChange={e => {
                          setBatchModels(e.target.checked ? [...batchModels, m] : batchModels.filter(bm => bm !== m));
                        }} /> {m}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Samples per Model</label>
                  <input type="number" min="1" max="10" className="glass-input" style={{ width: '100%' }} value={samplesPerModel} onChange={e => setSamplesPerModel(parseInt(e.target.value))} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Topic Source</label>
                  <select className="glass-input" style={{ width: '100%' }} value={topicSource} onChange={e => setTopicSource(e.target.value)}>
                    <option value="presets">Random from presets</option>
                    <option value="input">Use current topic input</option>
                  </select>
                </div>
                <button className="glass-button" style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', marginTop: '1rem', padding: '0.8rem' }} onClick={startBatchGenerate} disabled={loading || batchModels.length === 0}>
                  {loading ? <Activity className="animate-spin" size={18} /> : <Play size={18} />}
                  Start Batch Job
                </button>
                {loading && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '0.5rem', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(batchProgress.current/batchProgress.total)*100}%`, background: 'var(--accent-primary)', transition: 'width 0.3s' }} />
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      {batchProgress.current} / {batchProgress.total} — {batchProgress.model} — {batchProgress.topic.substring(0, 30)}...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Health & Stats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <span>Total Samples</span>
                  <strong>{dataset.length}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', height: '30px', alignItems: 'flex-end' }}>
                  {MODELS.map(m => {
                    const maxCount = Math.max(...Object.values(stats.counts), 1);
                    return <div key={m} style={{ height: `${(stats.counts[m]/maxCount)*100}%`, background: MODEL_COLORS[m], borderRadius: '2px', opacity: 0.7 }} title={`${m}: ${stats.counts[m]}`} />;
                  })}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem' }}>
                <div>Avg Words: <strong>{stats.avgWords}</strong></div>
                <div>Unique Topics: <strong>{stats.uniqueTopics}</strong></div>
              </div>
              <div style={{ fontSize: '0.75rem', padding: '0.75rem', borderRadius: '4px', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${stats.qualityColor}44` }}>
                <span>Training Quality:</span>
                <strong style={{ color: stats.qualityColor }}>{stats.quality}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
              <input className="glass-input" style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '2.5rem' }} placeholder="Search topic, model, or text..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <X size={14} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', opacity: 0.5 }} onClick={() => setSearch('')} />}
              {search && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>{filteredDataset.length} results found</div>}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="glass-button" onClick={exportJSON}><Download size={14} /> JSON</button>
              <button className="glass-button" onClick={exportCSV}><Download size={14} /> CSV</button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {dataset.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '6rem 2rem', opacity: 0.3 }}>
                <Database size={64} style={{ margin: '0 auto 1.5rem' }} />
                <h3>No samples found.</h3>
                <p>Use the generator panel to start building your dataset.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '1rem' }}>#</th>
                    <th style={{ padding: '1rem' }}>Model</th>
                    <th style={{ padding: '1rem' }}>Topic</th>
                    <th style={{ padding: '1rem' }}>Type</th>
                    <th style={{ padding: '1rem' }}>Words</th>
                    <th style={{ padding: '1rem' }}>Preview</th>
                    <th style={{ padding: '1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDataset.map((d, index) => {
                    const realIndex = filteredDataset.length - index;
                    return (
                      <React.Fragment key={d.id}>
                        <tr 
                          onClick={() => setExpandedRow(expandedRow === d.id ? null : d.id)}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', background: expandedRow === d.id ? 'rgba(255,255,255,0.03)' : 'transparent' }}
                        >
                          <td style={{ padding: '1rem', opacity: 0.3 }}>{realIndex}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, color: '#fff', background: MODEL_COLORS[d.model_label] }}>{d.model_label}</span>
                          </td>
                          <td style={{ padding: '1rem' }}>{d.topic.length > 25 ? d.topic.substring(0, 25) + '...' : d.topic}</td>
                          <td style={{ padding: '1rem', opacity: 0.6 }}>{d.text_type}</td>
                          <td style={{ padding: '1rem' }}>{d.word_count}</td>
                          <td style={{ padding: '1rem', opacity: 0.5, fontStyle: 'italic' }}>{d.text.substring(0, 55)}...</td>
                          <td style={{ padding: '1rem' }}>
                            <button className="glass-button" style={{ padding: '0.4rem', color: '#ff6b35' }} onClick={(e) => { e.stopPropagation(); deleteRow(d.id); }}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                        {expandedRow === d.id && (
                          <tr>
                            <td colSpan="7" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
                              <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Full Generated Text</h4>
                                  <button className="glass-button" style={{ fontSize: '0.7rem' }} onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(d.text); showToast("Copied to clipboard", "success"); }}>
                                    <Copy size={12} /> Copy Text
                                  </button>
                                </div>
                                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6, fontSize: '0.9rem', color: '#eee' }}>{d.text}</pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetBuilder;
