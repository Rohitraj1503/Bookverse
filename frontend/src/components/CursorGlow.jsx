import React, { useEffect, useRef } from 'react';

const CursorGlow = () => {
  const glowRef = useRef(null);

  useEffect(() => {
    if (window.innerWidth < 1024) return;

    const handleMouseMove = (e) => {
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={glowRef}
      style={{
        position: 'fixed',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0,
        background: 'radial-gradient(circle, rgba(124,58,237,0.06), transparent 70%)',
        transition: 'transform 0.15s ease-out',
        willChange: 'transform',
        top: 0,
        left: 0,
      }}
      aria-hidden="true"
    />
  );
};

export default CursorGlow;
