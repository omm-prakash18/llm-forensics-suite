import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Plus, Download, Trash2, Search, Activity, AlertTriangle, CheckCircle, Play, Layers, Copy, X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const PRESET_TOPICS = [
  "Explain quantum entanglement", "The ethics of AI in hiring", "How does a transformer model work",
  "Climate change policy tradeoffs", "How vaccines trigger immunity", "The philosophy of free will",
  "How does compound interest work", "Explain recursion with an example", "Pros and cons of remote work",
  "What is consciousness", "The future of space exploration", "How does machine learning work",
  "The impact of social media on democracy", "Explain blockchain technology", "The science of sleep"
];

const MODELS = ['GPT-4', 'Claude', 'Gemini', 'LLaMA', 'Mistral'];
const TYPES = ['Essay', 'Technical', 'Opinion', 'Creative', 'News', 'Code', 'Email'];
const LENGTHS = [
  { label: 'Short', range: '50-80' },
  { label: 'Medium', range: '120-160' },
  { label: 'Long', range: '250-300' }
];

const MODEL_COLORS = {
  'GPT-4': '#b8f5a0',
  'Claude': '#d4b0ff',
  'Gemini': '#94c7ff',
  'LLaMA': '#ffaa6b',
  'Mistral': '#ffe07a'
};

// ── Toast Component ──────────────────────────────────
const Toast = ({ toast }) => (
  <AnimatePresence>
    {toast && (
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 20, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999,
          background: toast.type === 'success'
            ? 'rgba(184, 245, 160, 0.15)'
            : 'rgba(255, 170, 107, 0.15)',
          border: `1px solid ${toast.type === 'success' ? '#b8f5a0' : '#ffaa6b'}`,
          backdropFilter: 'blur(20px)',
          color: toast.type === 'success' ? '#b8f5a0' : '#ffaa6b',
          padding: '0.75rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          fontWeight: 600, fontSize: '0.9rem'
        }}
      >
        {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
        {toast.message}
      </motion.div>
    )}
  </AnimatePresence>
);

// ── Stat Badge ────────────────────────────────────────
const StatBadge = ({ label, value, color }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.6rem 0.9rem', borderRadius: '8px',
    background: 'rgba(255,253,242,0.03)',
    border: `1px solid ${color ? color + '33' : 'rgba(255,253,242,0.08)'}`,
    fontSize: '0.8rem'
  }}>
    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
    <strong style={{ color: color || 'var(--cream)' }}>{value}</strong>
  </div>
);

// ── Main Component ────────────────────────────────────
const DatasetBuilder = () => {
  const [dataset, setDataset] = useState([]);
  const [fullDataset, setFullDataset] = useState([]); // For global stats
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
  const [deletingRows, setDeletingRows] = useState([]); // ← FIX: was undefined

  // Batch state
  const [batchMode, setBatchMode] = useState(false);
  const [batchModels, setBatchModels] = useState(MODELS);
  const [samplesPerModel, setSamplesPerModel] = useState(3);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, model: '', topic: '', success: 0, failed: 0 });
  const [topicSource, setTopicSource] = useState('presets');

  const fetchDataset = useCallback(async (query = '') => {
    try {
      const resp = await fetch(`http://127.0.0.1:8000/dataset${query ? `?search=${encodeURIComponent(query)}` : ''}`);
      if (!resp.ok) throw new Error('Failed to fetch dataset');
      const data = await resp.json();
      setDataset(data);
      if (!query) setFullDataset(data);
    } catch (err) {
      // showToast(`Fetch error: ${err.message}`);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchDataset(); // updates fullDataset
    if (search) fetchDataset(search); // updates filtered dataset
  }, [fetchDataset, search]);

  // Initial load + Search sync
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDataset(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchDataset]);

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── API Call ─────────────────────────────────────────
  const generateSample = async (topic, selectedModel, textType, lengthTargetLabel) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_label: selectedModel,
          topic,
          text_type: textType,
          length_target: lengthTargetLabel
        })
      });

      if (!response.ok) {
        let detail = `Server Error: ${response.status}`;
        try { const e = await response.json(); detail = e.detail || detail; } catch (_) {}
        throw new Error(detail);
      }

      return await response.json();
    } catch (error) {
      showToast(`Generation failed: ${error.message}`);
      return null;
    }
  };

  // ── Single Generate ──────────────────────────────────
  const handleSingleGenerate = async () => {
    const topic = topicInput.trim() || selectedTopic;
    if (!topic) {
      setShakeTopic(true);
      setTimeout(() => setShakeTopic(false), 500);
      showToast('Please select or enter a topic');
      return;
    }

    setLoading(true);
    try {
      const sample = await generateSample(topic, model, type, lengthLabel);
      if (sample) {
        refreshAll();
        showToast(`Generated: ${sample.model_label} — "${topic.substring(0, 30)}..."`, 'success');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Batch Generate ───────────────────────────────────
  const startBatchGenerate = async () => {
    if (batchModels.length === 0) {
      showToast('Select at least one model');
      return;
    }

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
          : (topicInput.trim() || selectedTopic || PRESET_TOPICS[0]);

        setBatchProgress(prev => ({ ...prev, current: prev.current + 1, model: m, topic }));

        const sample = await generateSample(topic, m, 'Essay', 'Medium');
        if (sample) {
          successCount++;
        } else {
          failedCount++;
        }
        setBatchProgress(prev => ({ ...prev, success: successCount, failed: failedCount }));
        await new Promise(r => setTimeout(r, 800));
      }
    }

    refreshAll();
    setLoading(false);
    showToast(
      `Batch done: ${successCount} generated${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      failedCount === 0 ? 'success' : 'error'
    );
  };

  // ── Delete (animated) ────────────────────────────────
  const deleteRow = useCallback(async (id) => {
    try {
      const resp = await fetch(`http://127.0.0.1:8000/dataset/${id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Failed to delete item');
      
      setDeletingRows(prev => [...prev, id]);
      setTimeout(() => {
        setDeletingRows(prev => prev.filter(r => r !== id));
        setDataset(prev => prev.filter(s => s.id !== id));
      }, 400);
    } catch (err) {
      showToast(`Delete failed: ${err.message}`);
    }
  }, []);

  const clearAll = async () => {
    if (!window.confirm('Clear all samples from the backend database?')) return;
    try {
      const resp = await fetch('http://127.0.0.1:8000/dataset', { method: 'DELETE' });
      if (!resp.ok) throw new Error('Failed to clear dataset');
      
      setDataset([]);
      setExpandedRow(null);
      showToast('Dataset cleared from backend', 'success');
    } catch (err) {
      showToast(`Clear failed: ${err.message}`);
    }
  };

  // ── Export ───────────────────────────────────────────
  const exportJSON = async () => {
    try {
      const resp = await fetch('http://127.0.0.1:8000/dataset');
      const allData = await resp.json();
      if (allData.length === 0) { showToast('No data to export'); return; }
      
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `llm_dataset_${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${allData.length} samples as JSON`, 'success');
    } catch (err) {
      showToast(`Export failed: ${err.message}`);
    }
  };

  const exportCSV = async () => {
    try {
      const resp = await fetch('http://127.0.0.1:8000/dataset');
      const allData = await resp.json();
      if (allData.length === 0) { showToast('No data to export'); return; }

      const headers = ['id', 'model_label', 'topic', 'text_type', 'length_target', 'word_count', 'char_count', 'timestamp', 'text'];
      const csvRows = allData.map(d => headers.map(h => {
        let val = (d[h] ?? '').toString();
        if (h === 'text') val = `"${val.replace(/"/g, '""')}"`;
        return val;
      }).join(','));
      
      const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `llm_dataset_${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${allData.length} samples as CSV`, 'success');
    } catch (err) {
      showToast(`Export failed: ${err.message}`);
    }
  };

  // ── Stats ────────────────────────────────────────────
  const stats = useMemo(() => {
    const counts = MODELS.reduce((acc, m) => {
      acc[m] = fullDataset.filter(d => d.model_label === m).length;
      return acc;
    }, {});
    const avgWords = fullDataset.length
      ? Math.round(fullDataset.reduce((s, d) => s + (d.word_count || 0), 0) / fullDataset.length)
      : 0;
    const uniqueTopics = new Set(fullDataset.map(d => d.topic)).size;

    let quality = 'Poor'; let qualityColor = '#ffaa6b';
    if (fullDataset.length >= 300) { quality = 'Excellent'; qualityColor = '#b8f5a0'; }
    else if (fullDataset.length >= 150) { quality = 'Good'; qualityColor = '#94c7ff'; }
    else if (fullDataset.length >= 50)  { quality = 'Fair'; qualityColor = '#ffe07a'; }

    return { counts, avgWords, uniqueTopics, quality, qualityColor };
  }, [fullDataset]);

  const lowSamples = MODELS.filter(m => stats.counts[m] < 10);
  const allHealthy = MODELS.every(m => stats.counts[m] >= 30);

  // ── Shared button style ──────────────────────────────
  const primaryBtn = {
    width: '100%', padding: '0.85rem',
    background: 'rgba(255, 253, 242, 0.1)',
    border: '1px solid rgba(255, 253, 242, 0.25)',
    color: 'var(--cream)',
    borderRadius: '10px', cursor: 'pointer',
    fontFamily: 'var(--font-sans)', fontWeight: 600,
    fontSize: '0.9rem', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '0.5rem',
    marginTop: '1rem', transition: 'all 0.2s ease',
    backdropFilter: 'blur(8px)'
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      <Toast toast={toast} />

      <div className="section-header">
        <h2>Dataset Builder</h2>
        <p>Build high-quality training datasets for model attribution.</p>
      </div>

      {/* Health Alerts */}
      <AnimatePresence>
        {!allHealthy && lowSamples.length > 0 && fullDataset.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: 'rgba(255,170,107,0.08)', border: '1px solid rgba(255,170,107,0.3)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--accent-llama)' }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.9rem' }}>
              <strong>Low sample count:</strong> {lowSamples.join(', ')} {'<'} 10 samples each.
            </span>
          </motion.div>
        )}
        {allHealthy && fullDataset.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: 'rgba(184,245,160,0.08)', border: '1px solid rgba(184,245,160,0.3)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--accent-gpt)' }}
          >
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.9rem' }}><strong>Dataset looks healthy!</strong> All models have 30+ samples.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2rem' }}>
        {/* ── Left Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Generator Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                {batchMode ? <Layers size={16} /> : <Plus size={16} />}
                {batchMode ? 'Batch Panel' : 'Single Generate'}
              </h3>
              <button
                className="glass-button"
                style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem' }}
                onClick={() => setBatchMode(b => !b)}
              >
                {batchMode ? 'Switch to Single' : 'Switch to Batch'}
              </button>
            </div>

            {/* Single Mode */}
            {!batchMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <motion.div animate={shakeTopic ? { x: [-6, 6, -6, 6, 0] } : {}}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Topic</label>
                  <select
                    className="glass-input"
                    value={selectedTopic}
                    onChange={e => { setSelectedTopic(e.target.value); setTopicInput(''); }}
                  >
                    <option value="">Select a preset...</option>
                    {PRESET_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    className="glass-input"
                    style={{ marginTop: '0.5rem', borderColor: shakeTopic ? 'rgba(255,170,107,0.6)' : '' }}
                    placeholder="Or custom topic (takes priority)..."
                    value={topicInput}
                    onChange={e => { setTopicInput(e.target.value); setSelectedTopic(''); }}
                  />
                </motion.div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Model</label>
                  <select className="glass-input" value={model} onChange={e => setModel(e.target.value)}>
                    {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</label>
                    <select className="glass-input" value={type} onChange={e => setType(e.target.value)}>
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Length</label>
                    <select className="glass-input" value={lengthLabel} onChange={e => setLengthLabel(e.target.value)}>
                      {LENGTHS.map(l => <option key={l.label} value={l.label}>{l.label} ({l.range}w)</option>)}
                    </select>
                  </div>
                </div>

                <button
                  style={{ ...primaryBtn, opacity: loading ? 0.6 : 1 }}
                  onClick={handleSingleGenerate}
                  disabled={loading}
                  onMouseEnter={e => { if (!loading) Object.assign(e.target.style, { background: 'rgba(255,253,242,0.18)', borderColor: 'rgba(255,253,242,0.4)' }); }}
                  onMouseLeave={e => Object.assign(e.target.style, { background: 'rgba(255,253,242,0.1)', borderColor: 'rgba(255,253,242,0.25)' })}
                >
                  {loading ? <Activity size={16} className="animate-spin" /> : <Plus size={16} />}
                  {loading ? 'Generating...' : 'Generate Sample'}
                </button>
              </div>
            ) : (
              /* Batch Mode */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Models to Include</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {MODELS.map(m => (
                      <label key={m} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.4rem 0.6rem', borderRadius: '8px', border: `1px solid ${batchModels.includes(m) ? MODEL_COLORS[m] + '44' : 'rgba(255,253,242,0.08)'}`, background: batchModels.includes(m) ? MODEL_COLORS[m] + '11' : 'transparent', transition: 'all 0.2s' }}>
                        <input
                          type="checkbox"
                          checked={batchModels.includes(m)}
                          onChange={e => setBatchModels(e.target.checked ? [...batchModels, m] : batchModels.filter(bm => bm !== m))}
                          style={{ accentColor: MODEL_COLORS[m] }}
                        />
                        <span style={{ color: batchModels.includes(m) ? MODEL_COLORS[m] : 'var(--text-secondary)', fontWeight: 600 }}>{m}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Samples per Model</label>
                  <input
                    type="number" min="1" max="10"
                    className="glass-input"
                    value={samplesPerModel}
                    onChange={e => setSamplesPerModel(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    Total: {batchModels.length * samplesPerModel} samples
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Topic Source</label>
                  <select className="glass-input" value={topicSource} onChange={e => setTopicSource(e.target.value)}>
                    <option value="presets">Random from {PRESET_TOPICS.length} presets</option>
                    <option value="input">Use current topic input</option>
                  </select>
                </div>

                <button
                  style={{ ...primaryBtn, opacity: (loading || batchModels.length === 0) ? 0.5 : 1 }}
                  onClick={startBatchGenerate}
                  disabled={loading || batchModels.length === 0}
                >
                  {loading ? <Activity size={16} className="animate-spin" /> : <Play size={16} />}
                  {loading ? `Generating... (${batchProgress.current}/${batchProgress.total})` : 'Start Batch Job'}
                </button>

                {/* Batch Progress */}
                <AnimatePresence>
                  {loading && batchProgress.total > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div style={{ height: '4px', background: 'rgba(255,253,242,0.06)', borderRadius: '2px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                        <motion.div
                          animate={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                          style={{ height: '100%', background: MODEL_COLORS[batchProgress.model] || 'rgba(255,253,242,0.5)', borderRadius: '2px', transition: 'width 0.5s ease' }}
                        />
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: MODEL_COLORS[batchProgress.model], fontWeight: 700 }}>{batchProgress.model}</span>
                        {' · '}{batchProgress.topic?.substring(0, 28)}...
                      </div>
                      <div style={{ fontSize: '0.65rem', marginTop: '0.3rem', display: 'flex', gap: '1rem', color: 'var(--text-muted)' }}>
                        <span style={{ color: '#b8f5a0' }}>✓ {batchProgress.success}</span>
                        {batchProgress.failed > 0 && <span style={{ color: '#ffaa6b' }}>✗ {batchProgress.failed}</span>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Health & Stats Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem' }}>Health & Stats</h3>
              {fullDataset.length > 0 && (
                <button className="glass-button" style={{ fontSize: '0.65rem', padding: '0.25rem 0.6rem', color: 'var(--accent-llama)', borderColor: 'rgba(255,170,107,0.2)' }} onClick={clearAll}>
                  <Trash2 size={11} /> Clear All
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Per-model bars */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.6rem', color: 'var(--text-secondary)' }}>
                  <span>Samples per model</span>
                  <strong style={{ color: 'var(--cream)' }}>{fullDataset.length} total</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {MODELS.map(m => {
                    const target = Math.max(...Object.values(stats.counts), 30);
                    const pct = Math.min(100, (stats.counts[m] / target) * 100);
                    return (
                      <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.72rem' }}>
                        <span style={{ width: '52px', color: MODEL_COLORS[m], fontWeight: 700, flexShrink: 0 }}>{m}</span>
                        <div style={{ flex: 1, height: '5px', background: 'rgba(255,253,242,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: MODEL_COLORS[m], borderRadius: '3px', transition: 'width 0.5s ease', opacity: 0.8 }} />
                        </div>
                        <span style={{ width: '18px', textAlign: 'right', color: 'var(--text-muted)' }}>{stats.counts[m]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,253,242,0.06)', margin: '0.25rem 0' }} />

              <StatBadge label="Avg Words" value={stats.avgWords || '—'} />
              <StatBadge label="Unique Topics" value={stats.uniqueTopics || '—'} />
              <StatBadge label="Training Quality" value={stats.quality} color={stats.qualityColor} />
            </div>
          </div>
        </div>

        {/* ── Right Column: Dataset Table ── */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
          {/* Search + Export bar */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: fullDataset.length === 0 ? 0.15 : 0.4, pointerEvents: 'none' }} />
              <input
                className="glass-input"
                style={{ paddingLeft: '2.5rem', paddingRight: search ? '2.5rem' : '1rem', opacity: fullDataset.length === 0 ? 0.4 : 1 }}
                placeholder={fullDataset.length === 0 ? "Generate samples first to search..." : `Search ${fullDataset.length} samples...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                disabled={fullDataset.length === 0}
              />
              {search && fullDataset.length > 0 && (
                <X
                  size={14}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', opacity: 0.5 }}
                  onClick={() => setSearch('')}
                />
              )}
              {search && fullDataset.length > 0 && (
                <div style={{ fontSize: '0.7rem', color: dataset.length > 0 ? 'var(--text-secondary)' : 'var(--accent-llama)', marginTop: '0.35rem', paddingLeft: '0.25rem' }}>
                  {dataset.length} result{dataset.length !== 1 ? 's' : ''} found
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button className="glass-button" style={{ fontSize: '0.8rem', opacity: fullDataset.length === 0 ? 0.4 : 1 }} onClick={exportJSON} disabled={fullDataset.length === 0}>
                <Download size={14} /> JSON
              </button>
              <button className="glass-button" style={{ fontSize: '0.8rem', opacity: fullDataset.length === 0 ? 0.4 : 1 }} onClick={exportCSV} disabled={fullDataset.length === 0}>
                <Download size={14} /> CSV
              </button>
            </div>
          </div>

          {/* Table / Empty State */}
          <div style={{ flex: 1, overflowX: 'auto' }}>
            {fullDataset.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-muted)' }}>
                <Database size={56} style={{ margin: '0 auto 1.25rem', opacity: 0.25 }} />
                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', opacity: 0.4 }}>No samples yet</h3>
                <p style={{ fontSize: '0.9rem', opacity: 0.3 }}>Use the generator panel on the left to start building your dataset.</p>
              </div>
            ) : dataset.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                <Search size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                <p style={{ opacity: 0.4 }}>No results for "{search}"</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{
                    textAlign: 'left',
                    borderBottom: '1px solid rgba(255,253,242,0.07)',
                    color: 'var(--text-muted)',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}>
                    <th style={{ padding: '0.75rem 1rem' }}>#</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Model</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Topic</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Words</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Preview</th>
                    <th style={{ padding: '0.75rem 1rem' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {dataset.map((d, index) => {
                    const isDeleting = deletingRows.includes(d.id);
                    const isExpanded = expandedRow === d.id;
                    return (
                      <React.Fragment key={d.id}>
                        <tr
                          onClick={() => setExpandedRow(isExpanded ? null : d.id)}
                          style={{
                            borderBottom: '1px solid rgba(255,253,242,0.04)',
                            cursor: 'pointer',
                            background: isDeleting
                              ? 'rgba(255,170,107,0.08)'
                              : isExpanded
                                ? 'rgba(255,253,242,0.04)'
                                : 'transparent',
                            opacity: isDeleting ? 0 : 1,
                            transform: isDeleting ? 'translateX(20px)' : 'none',
                            transition: 'all 0.4s ease',
                          }}
                        >
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            {dataset.length - index}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{
                              padding: '0.2rem 0.55rem', borderRadius: '6px',
                              fontSize: '0.68rem', fontWeight: 800,
                              color: '#000',
                              background: MODEL_COLORS[d.model_label] || 'rgba(255,253,242,0.3)',
                              letterSpacing: '0.02em'
                            }}>
                              {d.model_label}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--cream)', maxWidth: '160px' }}>
                            {d.topic?.length > 28 ? d.topic.substring(0, 28) + '…' : d.topic}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{d.text_type}</td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{d.word_count}</td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '200px' }}>
                            {d.text?.substring(0, 50)}…
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                              <button
                                className="glass-button"
                                style={{ padding: '0.3rem 0.5rem', color: 'var(--accent-llama)', borderColor: 'rgba(255,170,107,0.2)', fontSize: '0' }}
                                title="Delete"
                                onClick={e => { e.stopPropagation(); deleteRow(d.id); }}
                              >
                                <Trash2 size={13} />
                              </button>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Row */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} style={{ padding: 0 }}>
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25 }}
                                  style={{ overflow: 'hidden' }}
                                >
                                  <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,253,242,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        <span>Topic: <strong style={{ color: 'var(--cream)' }}>{d.topic}</strong></span>
                                        <span>·</span>
                                        <span>{d.word_count} words · {d.char_count} chars</span>
                                        <span>·</span>
                                        <span>{new Date(d.timestamp).toLocaleString()}</span>
                                      </div>
                                      <button
                                        className="glass-button"
                                        style={{ fontSize: '0.7rem', padding: '0.3rem 0.7rem' }}
                                        onClick={e => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(d.text);
                                          showToast('Copied to clipboard', 'success');
                                        }}
                                      >
                                        <Copy size={12} /> Copy
                                      </button>
                                    </div>
                                    <pre style={{
                                      whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)',
                                      lineHeight: 1.65, fontSize: '0.88rem',
                                      color: 'var(--cream)', margin: 0,
                                      maxHeight: '300px', overflowY: 'auto',
                                      padding: '1rem',
                                      background: 'rgba(255,253,242,0.02)',
                                      borderRadius: '8px',
                                      border: '1px solid rgba(255,253,242,0.06)'
                                    }}>
                                      {d.text}
                                    </pre>

                                    {/* Feature Tags */}
                                    {d.features && (
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.85rem' }}>
                                        {Object.entries(d.features)
                                          .filter(([, v]) => typeof v === 'number' && v > 0)
                                          .sort(([, a], [, b]) => b - a)
                                          .slice(0, 8)
                                          .map(([k, v]) => (
                                            <span key={k} style={{
                                              fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '6px',
                                              background: 'rgba(255,253,242,0.05)',
                                              border: '1px solid rgba(255,253,242,0.1)',
                                              color: 'var(--text-secondary)'
                                            }}>
                                              {k.replace(/_/g, ' ')}: {typeof v === 'number' ? v.toFixed(2) : v}
                                            </span>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          {fullDataset.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,253,242,0.06)', paddingTop: '0.85rem', marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>Showing {dataset.length} of {fullDataset.length} samples</span>
              <span style={{ display: 'flex', gap: '1rem' }}>
                {MODELS.map(m => stats.counts[m] > 0 && (
                  <span key={m} style={{ color: MODEL_COLORS[m] }}>{m}: {stats.counts[m]}</span>
                ))}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatasetBuilder;
