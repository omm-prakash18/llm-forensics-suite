import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, LayoutDashboard, Database, Fingerprint, Target } from 'lucide-react';
import CurveLoops from './CurveLoops';
import PixelTransition from './PixelTransition';
import ClassifierDashboard from './ClassifierDashboard';
import DatasetBuilder from './DatasetBuilder';
import SignalExplainer from './SignalExplainer';
import AccuracyBoard from './AccuracyBoard';

function App() {
  const [activeTab, setActiveTab] = useState('live');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextTab, setNextTab] = useState(null);

  const handleTabChange = (tab) => {
    if (tab === activeTab || isTransitioning) return;
    setNextTab(tab);
    setIsTransitioning(true);
  };

  const onTransitionComplete = () => {
    setActiveTab(nextTab);
    setIsTransitioning(false);
  };

  return (
    <>
      <CurveLoops />
      <PixelTransition isTransitioning={isTransitioning} onTransitionComplete={onTransitionComplete} />
      
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header/Nav */}
        <header style={{ 
          padding: '1.5rem 2rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} className="animate-float">
            <div style={{ 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', 
              padding: '0.6rem', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
            }}>
              <Shield size={28} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '-4px' }} className="text-gradient">
                LLM Forensics
              </h1>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Stylometric Intelligence
              </span>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            <NavButton 
              active={activeTab === 'live'} 
              onClick={() => handleTabChange('live')}
              icon={<LayoutDashboard size={18} />}
              label="Live Classifier"
            />
            <NavButton 
              active={activeTab === 'dataset'} 
              onClick={() => handleTabChange('dataset')}
              icon={<Database size={18} />}
              label="Dataset Builder"
            />
            <NavButton 
              active={activeTab === 'signals'} 
              onClick={() => handleTabChange('signals')}
              icon={<Fingerprint size={18} />}
              label="Signal Explainer"
            />
            <NavButton 
              active={activeTab === 'accuracy'} 
              onClick={() => handleTabChange('accuracy')}
              icon={<Target size={18} />}
              label="Accuracy Board"
            />
          </nav>
        </header>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '4rem 2rem' }}>
          <AnimatePresence mode="wait">
            {!isTransitioning && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'live' && <ClassifierDashboard />}
                {activeTab === 'dataset' && <DatasetBuilder />}
                {activeTab === 'signals' && <SignalExplainer />}
                {activeTab === 'accuracy' && <AccuracyBoard />}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}

const NavButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    style={{
      background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
      border: 'none',
      color: active ? '#fff' : 'var(--text-secondary)',
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={(e) => {
      if (!active) Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.05)', color: '#fff' });
    }}
    onMouseLeave={(e) => {
      if (!active) Object.assign(e.currentTarget.style, { background: 'transparent', color: 'var(--text-secondary)' });
    }}
  >
    {React.cloneElement(icon, { color: active ? 'var(--accent-primary)' : 'currentColor' })}
    {label}
  </button>
);

export default App;
