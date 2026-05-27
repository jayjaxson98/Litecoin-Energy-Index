import { motion } from 'framer-motion';

interface EnergyGaugeProps {
  value: number;
}

export default function EnergyGauge({ value }: EnergyGaugeProps) {
  const normalized = Math.min(Math.max(value, 0), 200);
  const percentage = normalized / 200;
  const rotation = -135 + percentage * 270;

  const getColor = () => {
    if (normalized < 60) return '#ef4444';
    if (normalized < 90) return '#f59e0b';
    if (normalized < 120) return '#10b981';
    if (normalized < 150) return '#38bdf8';
    return '#9E7FFF';
  };

  const getLabel = () => {
    if (normalized < 60) return 'Critical';
    if (normalized < 90) return 'Low';
    if (normalized < 120) return 'Optimal';
    if (normalized < 150) return 'High';
    return 'Peak';
  };

  const color = getColor();

  return (
    /* Reduced from w-40 h-40 → w-32 h-32 to save vertical space in the gauge card */
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        {/* Background arc */}
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="#2F2F2F"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="235.6"
          strokeDashoffset="78.5"
        />
        {/* Value arc */}
        <motion.circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="235.6"
          strokeDashoffset={235.6 - (percentage * 157.1)}
          initial={{ strokeDashoffset: 235.6 }}
          animate={{ strokeDashoffset: 235.6 - (percentage * 157.1) }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={value.toFixed(1)}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-black font-mono"
          style={{ color }}
        >
          {value.toFixed(1)}
        </motion.span>
        <span className="text-[9px] text-neutral-500 font-semibold uppercase tracking-wider">
          {getLabel()}
        </span>
      </div>
    </div>
  );
}
