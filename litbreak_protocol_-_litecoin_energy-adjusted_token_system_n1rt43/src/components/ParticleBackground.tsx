import React, { useMemo } from 'react';

const ParticleBackground: React.FC = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * 10,
      opacity: 0.1 + Math.random() * 0.3,
    }));
  }, []);

  const lines = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x1: Math.random() * 100,
      y1: Math.random() * 100,
      angle: Math.random() * 360,
      length: 50 + Math.random() * 150,
      duration: 20 + Math.random() * 15,
      delay: Math.random() * 8,
      opacity: 0.03 + Math.random() * 0.06,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Gradient orbs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full animate-pulse-slow"
        style={{
          top: '-10%',
          right: '-5%',
          background: 'radial-gradient(circle, rgba(158, 127, 255, 0.08) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full animate-pulse-slow"
        style={{
          bottom: '10%',
          left: '-5%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
          animationDelay: '2s',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full animate-pulse-slow"
        style={{
          top: '40%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.05) 0%, transparent 70%)',
          animationDelay: '4s',
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'linear-gradient(rgba(158, 127, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(158, 127, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating particles */}
      <svg className="absolute inset-0 w-full h-full">
        {particles.map(p => (
          <circle
            key={p.id}
            cx={`${p.x}%`}
            cy={`${p.y}%`}
            r={p.size}
            fill="#9E7FFF"
            opacity={p.opacity}
          >
            <animate
              attributeName="cy"
              values={`${p.y}%;${p.y - 5}%;${p.y}%`}
              dur={`${p.duration}s`}
              begin={`${p.delay}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values={`${p.opacity};${p.opacity * 0.3};${p.opacity}`}
              dur={`${p.duration * 0.7}s`}
              begin={`${p.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* Circuit lines */}
        {lines.map(l => {
          const rad = (l.angle * Math.PI) / 180;
          const x2 = l.x1 + Math.cos(rad) * (l.length / 10);
          const y2 = l.y1 + Math.sin(rad) * (l.length / 10);
          return (
            <line
              key={`line-${l.id}`}
              x1={`${l.x1}%`}
              y1={`${l.y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke="#9E7FFF"
              strokeWidth="0.5"
              opacity={l.opacity}
            >
              <animate
                attributeName="opacity"
                values={`${l.opacity};${l.opacity * 2};${l.opacity}`}
                dur={`${l.duration}s`}
                begin={`${l.delay}s`}
                repeatCount="indefinite"
              />
            </line>
          );
        })}
      </svg>
    </div>
  );
};

export default ParticleBackground;
