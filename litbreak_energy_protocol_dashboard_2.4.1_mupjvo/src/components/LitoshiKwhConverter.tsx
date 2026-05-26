import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Zap, Battery } from 'lucide-react';
import { litoshiToKwh, kwhToLitoshi } from '../utils/calculations';
import { useEnergyIndex } from '../hooks/useEnergyIndex';

type Direction = 'litoshi-to-kwh' | 'kwh-to-litoshi';

export function LitoshiKwhConverter() {
  const { globalIndex, ltcPrice } = useEnergyIndex();
  const [direction, setDirection] = useState<Direction>('litoshi-to-kwh');
  const [inputValue, setInputValue] = useState('');

  const numericInput = parseFloat(inputValue) || 0;

  const result = useMemo(() => {
    if (numericInput <= 0) return 0;
    if (direction === 'litoshi-to-kwh') {
      return litoshiToKwh(numericInput, ltcPrice, globalIndex);
    } else {
      return kwhToLitoshi(numericInput, ltcPrice, globalIndex);
    }
  }, [numericInput, direction, ltcPrice, globalIndex]);

  const toggleDirection = () => {
    setDirection(d => d === 'litoshi-to-kwh' ? 'kwh-to-litoshi' : 'litoshi-to-kwh');
    setInputValue('');
  };

  const inputLabel = direction === 'litoshi-to-kwh' ? 'Litoshi' : 'kWh';
  const outputLabel = direction === 'litoshi-to-kwh' ? 'kWh' : 'Litoshi';
  const inputIcon = direction === 'litoshi-to-kwh'
    ? <Zap className="w-4 h-4 text-warning" />
    : <Battery className="w-4 h-4 text-success" />;
  const outputIcon = direction === 'litoshi-to-kwh'
    ? <Battery className="w-4 h-4 text-success" />
    : <Zap className="w-4 h-4 text-warning" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <ArrowLeftRight className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-white">Litoshi ↔ kWh Converter</h3>
      </div>

      {/* Input */}
      <div className="glass-card-inner p-3 mb-3">
        <div className="flex items-center gap-2 mb-1.5">
          {inputIcon}
          <span className="text-xs text-textSecondary uppercase tracking-wider">{inputLabel}</span>
        </div>
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="0"
          className="w-full bg-transparent text-lg font-bold font-mono text-white placeholder-white/20 outline-none"
        />
      </div>

      {/* Toggle */}
      <div className="flex justify-center -my-1 relative z-10">
        <motion.button
          onClick={toggleDirection}
          className="w-8 h-8 rounded-full bg-navy-800 border border-primary/30 flex items-center justify-center hover:border-primary/60 transition-colors"
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
        </motion.button>
      </div>

      {/* Output */}
      <div className="glass-card-inner p-3 mt-1">
        <div className="flex items-center gap-2 mb-1.5">
          {outputIcon}
          <span className="text-xs text-textSecondary uppercase tracking-wider">{outputLabel}</span>
        </div>
        <div className="text-lg font-bold font-mono text-white">
          {numericInput > 0
            ? direction === 'litoshi-to-kwh'
              ? result.toFixed(6)
              : result.toLocaleString(undefined, { maximumFractionDigits: 0 })
            : '0'}
        </div>
      </div>

      {/* Live rates */}
      <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-textSecondary">LTC Price</span>
          <span className="font-mono text-white">${ltcPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-textSecondary">Energy Index</span>
          <span className="font-mono text-white">${globalIndex.toFixed(4)}/kWh</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-textSecondary">1 LTC =</span>
          <span className="font-mono text-primary">
            {(ltcPrice / globalIndex).toFixed(2)} kWh
          </span>
        </div>
      </div>
    </motion.div>
  );
}
