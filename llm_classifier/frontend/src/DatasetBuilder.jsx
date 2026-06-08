import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Plus, Download, Trash2, Search, Activity, AlertTriangle, CheckCircle, Play, Layers, Copy } from 'lucide-react';

const TOPICS = [
  "Explain quantum entanglement", "The ethics of AI in hiring", "How does a transformer model work", 
  "Climate change policy tradeoffs", "Write a short story about a robot", "How to center a div in CSS", 
  "The philosophy of free will", "Explain blockchain to a 10-year-old", "Pros and cons of remote work", 
  "How vaccines trigger immunity", "The causes of World War I", "Explain recursion with an example", 
  "Is social media good for democracy", "How does compound interest work", "What is consciousness"
];

const MODELS = ['GPT-4', 'Claude', 'Gemini', 'LLaMA', 'Mistral'];
const TYPES = ['Essay', 'Technical explanation', 'Opinion piece', 'Creative writing', 'News summary', 'Code explanation', 'Twitter thread', 'Email'];
const LENGTHS = ['Short (50–80 words)', 'Medium (120–160 words)', 'Long (250–300 words)'];

const DatasetBuilder = () => {
  const [dataset, setDataset] = useState([]);
  const [topic, setTopic] = useState('');
  const [model, setModel] = useState('GPT-4');
  const [type, setType] = useState('Essay');
  const [length, setLength] = useState('Medium (120–160 words)');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterModels, setFilterModels] = useState(MODELS);
  const [expandedRow, setExpandedRow] = useState(null);
  
  // Batch Generate State
  const [batchMode, setBatchGenerate] = useState(false);
  const [batchModels, setBatchModels] = useState(MODELS);
  const [samplesPerModel, setSamplesPerModel] = useState(1);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('llm_forensics_dataset');
    if (saved) setDataset(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('llm_forensics_dataset', JSON.stringify(dataset));
  }, [dataset]);

  const handleGenerate = async (targetModel = model, targetTopic = topic) => {
    if (!targetTopic) return null;
    try {
      const res = await axios.post('http://127.0.0.1:8000/generate', {
        model_label: targetModel,
        topic: targetTopic,
        text_type: type,
        length_target: length
      });
      return res.data;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const startBatchGenerate = async () => {
    setLoading(true);
    setBatchTotal(batchModels.length * samplesPerModel);
    setBatchProgress(0);
    
    const newSamples = [];
    for (const m of batchModels) {
      for (let i = 0; i < samplesPerModel; i++) {
        const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
        setBatchStatus(`Generating ${newSamples.length + 1}/${batchModels.length * samplesPerModel} — ${m} style — ${randomTopic.substring(0, 20)}...`);
        
        const sample = await handleGenerate(m, randomTopic);
        if (sample) {
          newSamples.push(sample);
          setBatchProgress(newSamples.length);
        }
        await new Promise(r => setTimeout(r, 800)); // Delay to avoid rate limit
      }
    }
    
    setDataset([...newSamples, ...dataset]);
    setLoading(false);
    setBatchMode(false);
  };

  const deleteSample = (id) => setDataset(dataset.filter(d => d.id !== id));
  const copyToClipboard = (text) => navigator.clipboard.writeText(text);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'llm_forensics_dataset.json';
    a.click();
  };

  const exportCSV = () => {
    const headers = ['id', 'model_label', 'topic', 'text_type', 'word_count', 'text'];
    const rows = dataset.map(d => headers.map(h => `"${(d[h] || '').toString().replace(/"/g, '""')}"`).join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'llm_forensics_dataset.csv';
    a.click();
  };

  const counts = MODELS.reduce((acc, m) => {
    acc[m] = dataset.filter(d => d.model_label === m).length;
    return acc;
  }, {});

  const filteredData = dataset.filter(d => 
    filterModels.includes(d.model_label) && 
    (d.topic.toLowerCase().includes(search.toLowerCase()) || d.text.toLowerCase().includes(search.toLowerCase()))
  );

  const quality = dataset.length < 50 ? 'Poor' : dataset.length < 150 ? 'Fair' : dataset.length < 300 ? 'Good' : 'Excellent';
  const lowSamples = MODELS.filter(m => counts[m] < 10);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="section-header">
        <h2>Dataset Builder</h2>
        <p>Generate and manage training data for stylometric classification.</p>
      </div>

      {lowSamples.length > 0 && (
        <div style={{ background: 'rgba(255, 107, 53, 0.1)', border: '1px solid #ff6b35', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', color: '#ff6b35' }}>
          <AlertTriangle size={20} />
          <div style={{ fontSize: '0.9rem' }}>
            <strong>Low sample warning:</strong> {lowSamples.join(', ')} {lowSamples.length === 1 ? 'only has' : 'have'} fewer than 10 samples. Aim for 30+ per model for reliable training.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2rem' }}>
        {/* Generator Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {batchMode ? <Layers size={18} /> : <Plus size={18} />} 
                {batchMode ? 'Batch Generate' : 'Single Generate'}
              </h3>
              <button className="glass-button" style={{ fontSize: '0.7rem' }} onClick={() => setBatchGenerate(!batchMode)}>
                {batchMode ? 'Switch to Single' : 'Switch to Batch'}
              </button>
            </div>
            
            {!batchMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Topic</label>
                  <select className="glass-input" style={{ width: '100%' }} value={topic} onChange={e => setTopic(e.target.value)}>
                    <option value="">Select or type...</option>
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input className="glass-input" style={{ width: '100%', marginTop: '0.5rem' }} placeholder="Or custom topic..." value={topic} onChange={e => setTopic(e.target.value)} />
                </div>
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
                    <select className="glass-input" style={{ width: '100%' }} value={length} onChange={e => setLength(e.target.value)}>
                      {LENGTHS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <button className="glass-button" style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', marginTop: '1rem', padding: '0.75rem' }} onClick={async () => {
                  setLoading(true);
                  const s = await handleGenerate();
                  if (s) setDataset([s, ...dataset]);
                  setLoading(false);
                }} disabled={loading || !topic}>
                  {loading ? <Activity className="animate-spin" size={18} /> : <Plus size={18} />}
                  Generate
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
                <button className="glass-button" style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', marginTop: '1rem', padding: '0.75rem' }} onClick={startBatchGenerate} disabled={loading || batchModels.length === 0}>
                  {loading ? <Activity className="animate-spin" size={18} /> : <Play size={18} />}
                  Start Batch Job
                </button>
                {loading && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '0.5rem' }}>
                      <div style={{ height: '100%', width: `${(batchProgress/batchTotal)*100}%`, background: 'var(--accent-primary)', borderRadius: '2px', transition: 'width 0.3s' }} />
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{batchStatus}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Dataset Health</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <span>Total Samples</span>
                  <span style={{ fontWeight: 700 }}>{dataset.length} across {MODELS.length} models</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, dataset.length/3)}%`, background: 'var(--accent-primary)', borderRadius: '2px' }} />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', height: '40px', alignItems: 'flex-end' }}>
                {MODELS.map(m => (
                  <div key={m} style={{ height: `${(counts[m]/Math.max(...Object.values(counts),1))*100}%`, background: counts[m] >= 30 ? '#10a37f' : counts[m] >= 10 ? '#f7c948' : '#ff6b35', borderRadius: '2px', opacity: 0.6 }} title={`${m}: ${counts[m]}`} />
                ))}
              </div>

              <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Unique Topics:</span>
                <strong>{new Set(dataset.map(d => d.topic)).size}</strong>
              </div>

              <div style={{ fontSize: '0.75rem', padding: '0.75rem', borderRadius: '4px', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {quality === 'Excellent' ? <CheckCircle size={14} color="#10a37f" /> : <AlertTriangle size={14} color="#f7c948" />}
                Training Quality: <strong style={{ color: quality === 'Excellent' ? '#10a37f' : '#f7c948' }}>{quality}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Table Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
              <input className="glass-input" style={{ width: '100%', paddingLeft: '2.5rem' }} placeholder="Search topic or text..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="glass-button" onClick={exportJSON}><Download size={14} /> JSON</button>
              <button className="glass-button" onClick={exportCSV}><Download size={14} /> CSV</button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
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
                {filteredData.map((d, i) => (
                  <React.Fragment key={d.id}>
                    <tr 
                      onClick={() => setExpandedRow(expandedRow === d.id ? null : d.id)}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', background: expandedRow === d.id ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                    >
                      <td style={{ padding: '1rem', opacity: 0.3 }}>{filteredData.length - i}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, background: 'rgba(255,255,255,0.05)', border: `1px solid var(--accent-${d.model_label.toLowerCase()})`, color: `var(--accent-${d.model_label.toLowerCase()})` }}>{d.model_label}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>{d.topic}</td>
                      <td style={{ padding: '1rem', opacity: 0.5 }}>{d.text_type}</td>
                      <td style={{ padding: '1rem' }}>{d.word_count}</td>
                      <td style={{ padding: '1rem', opacity: 0.5, fontStyle: 'italic' }}>{d.text.substring(0, 45)}...</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                          <button className="glass-button" style={{ padding: '0.3rem' }} onClick={() => copyToClipboard(d.text)}><Copy size={12} /></button>
                          <button className="glass-button" style={{ padding: '0.3rem', color: '#ff6b35' }} onClick={() => deleteSample(d.id)}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                    {expandedRow === d.id && (
                      <tr>
                        <td colSpan="7" style={{ padding: '2rem', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                            <div>
                              <h4 style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>FULL TEXT</h4>
                              <p style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>{d.text}</p>
                            </div>
                            <div>
                              <h4 style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>FEATURE VECTOR</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {Object.entries(d.features).map(([k, v]) => (
                                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.2rem' }}>
                                    <span style={{ opacity: 0.6 }}>{k.replace(/_/g, ' ')}</span>
                                    <span style={{ fontWeight: 600 }}>{typeof v === 'number' ? v.toFixed(3) : v.toString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.2 }}>
                <Database size={48} style={{ margin: '0 auto 1rem' }} />
                <p>No samples found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetBuilder;
