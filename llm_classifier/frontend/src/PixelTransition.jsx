import React, { useEffect, useState } from 'react';

const PixelTransition = ({ isTransitioning, onTransitionComplete }) => {
  const [pixels, setPixels] = useState([]);
  
  useEffect(() => {
    if (isTransitioning) {
      // Create a grid of pixels
      const columns = Math.ceil(window.innerWidth / 50);
      const rows = Math.ceil(window.innerHeight / 50);
      const totalPixels = columns * rows;
      
      const newPixels = Array.from({ length: totalPixels }).map((_, i) => {
        // Randomize the delay and color for a more dynamic effect
        const colors = ['#8b5cf6', '#d946ef', '#3b82f6', '#09090b'];
        return {
          id: i,
          delay: Math.random() * 0.5,
          color: colors[Math.floor(Math.random() * colors.length)]
        };
      });
      
      setPixels(newPixels);
      
      // End transition after animation completes
      setTimeout(() => {
        if (onTransitionComplete) onTransitionComplete();
        setPixels([]); // Clear pixels to reveal underneath
      }, 1200);
    }
  }, [isTransitioning, onTransitionComplete]);

  if (!isTransitioning && pixels.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 9999,
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, 40px)`,
      gridAutoRows: '40px',
      pointerEvents: 'none'
    }}>
      {pixels.map((pixel) => (
        <div 
          key={pixel.id}
          style={{
            background: pixel.color,
            animation: `pixelFade 0.8s cubic-bezier(0.19, 1, 0.22, 1) ${pixel.delay}s forwards`,
            opacity: 0
          }}
        />
      ))}
      <style>{`
        @keyframes pixelFade {
          0% { opacity: 0; transform: scale(0) rotate(-10deg); }
          50% { opacity: 0.8; transform: scale(1.1) rotate(0deg); }
          100% { opacity: 0; transform: scale(0.9) rotate(10deg); }
        }
      `}</style>
    </div>
  );
};

export default PixelTransition;
