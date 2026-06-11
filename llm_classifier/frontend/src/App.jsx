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
          borderBottom: '1px solid rgba(255, 253, 242, 0.08)',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(24px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }} className="animate-float">
            <div style={{ 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(148, 199, 255, 0.2)',
              overflow: 'hidden',
              background: '#0a0e17'
            }}>
              <img 
                src="/logo.png" 
                alt="LLM Forensics Logo" 
                style={{ 
                  height: '56px', 
                  width: '56px', 
                  objectFit: 'cover',
                  objectPosition: 'center 15%' // crop to the shield part if it has text at the bottom
                }} 
              />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '-4px' }} className="text-gradient">
                LLM Forensics
              </h1>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
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
      background: active ? 'rgba(255, 253, 242, 0.1)' : 'transparent',
      border: '1px solid',
      borderColor: active ? 'rgba(255,253,242,0.2)' : 'transparent',
      color: active ? 'var(--cream)' : 'var(--text-secondary)',
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      backdropFilter: active ? 'blur(8px)' : 'none',
    }}
    onMouseEnter={(e) => {
      if (!active) Object.assign(e.currentTarget.style, { background: 'rgba(255,253,242,0.06)', color: 'var(--cream)', borderColor: 'rgba(255,253,242,0.12)' });
    }}
    onMouseLeave={(e) => {
      if (!active) Object.assign(e.currentTarget.style, { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'transparent' });
    }}
  >
    {React.cloneElement(icon, { color: active ? 'var(--cream)' : 'currentColor' })}
    {label}
  </button>
);

export default App;
