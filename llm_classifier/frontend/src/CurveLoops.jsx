import React, { useEffect, useRef } from 'react';

const CurveLoops = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)'; // Fade effect for trails
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.lineWidth = 1.5;

      // Draw intersecting glowing loops
      for (let i = 0; i < 4; i++) {
        const t = time + i * Math.PI / 2;
        ctx.beginPath();
        
        // Colors — cream variants on black
        const colors = ['rgba(255,253,242,0.9)', 'rgba(255,253,242,0.5)', 'rgba(255,253,242,0.3)', 'rgba(255,253,242,0.15)'];
        ctx.strokeStyle = colors[i]; // cream opacity already baked in
        
        for (let a = 0; a < Math.PI * 2; a += 0.05) {
          const radius = 200 + Math.sin(a * 3 + t) * 100 + Math.cos(a * 2 - t) * 50;
          
          // Add 3D-like rotation
          const x = cx + Math.cos(a + t * 0.2) * radius * (1 + i * 0.1);
          const y = cy + Math.sin(a - t * 0.3) * radius * (0.6 + i * 0.1);
          
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        ctx.stroke();
      }

      time += 0.005;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        background: '#000000'
      }}
    />
  );
};

export default CurveLoops;
