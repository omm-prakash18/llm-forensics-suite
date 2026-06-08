import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const DomeGallery = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '350px',
      perspective: '1000px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    }}>
      {items.map((item, index) => {
        // Calculate position in the "dome"
        const offset = (index - activeIndex + items.length) % items.length;
        const normalizedOffset = offset > items.length / 2 ? offset - items.length : offset;
        
        const isActive = normalizedOffset === 0;
        
        // Mathematical transform for the dome/cylinder effect
        const rotateY = normalizedOffset * 35; // degrees
        const translateZ = Math.abs(normalizedOffset) * -150;
        const translateX = normalizedOffset * 180;
        const scale = isActive ? 1.05 : 0.85 - Math.abs(normalizedOffset) * 0.1;
        const opacity = isActive ? 1 : Math.max(0, 0.8 - Math.abs(normalizedOffset) * 0.3);
        const boxShadow = isActive 
          ? `0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px var(--accent-${item.model.toLowerCase()}, rgba(139, 92, 246, 0.3))` 
          : '0 8px 32px rgba(0, 0, 0, 0.4)';

        return (
          <motion.div
            key={index}
            animate={{
              rotateY,
              z: translateZ,
              x: translateX,
              scale,
              opacity,
              boxShadow
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
              position: 'absolute',
              width: '320px',
              padding: '2rem',
              transformStyle: 'preserve-3d',
              cursor: isActive ? 'default' : 'pointer',
              border: isActive ? `1px solid var(--accent-${item.model.toLowerCase()}, rgba(139, 92, 246, 0.5))` : '1px solid var(--border)'
            }}
            className="glass-panel"
            onClick={() => setActiveIndex(index)}
          >
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={`data-tag model-${item.model.toLowerCase()}`}>{item.model}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.category}</span>
            </div>
            
            <p style={{ 
              fontSize: '0.9rem', 
              color: 'var(--text-primary)', 
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              "{item.text}"
            </p>
            
            {isActive && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Em-dashes:</span>
                  <span>{item.features.em_dash_density.toFixed(1)} / 100w</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Hedging:</span>
                  <span>{item.features.hedging_frequency.toFixed(1)} / 100w</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default DomeGallery;
