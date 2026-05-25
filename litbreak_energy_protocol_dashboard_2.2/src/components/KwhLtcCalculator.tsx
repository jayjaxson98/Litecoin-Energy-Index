import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Battery, Coins } from 'lucide-react';
import { kwhToLtc } from '../utils/calculations';
import { useEnergyIndex } from '../hooks/useEnergyIndex';

export function KwhLtcCalculator() {
  const { globalIndex, ltcPrice } = useEnergyIndex();
  const [kwhInput, setKwhInput] = useState('');

  const numericKwh = parseFloat(kwhInput) || 0;

  const ltcResult = useMemo(() => {
    if (numericKwh <= 0) return 0;
    return kwhToLtc(numericKwh, ltcPrice, globalIndex);
  }, [numericKwh, ltcPrice, globalIndex]);

  const usdResult = ltcResult * ltcPrice;

  // Common household energy usage examples
  const examples = [
    { label: '1 hour LED bulb (10W)', kwh: 0.01 },
    { label: '1 hour AC unit', kwh: 1.5 },
    { label: 'Avg US daily usage', kwh: 30 },
    { label: 'Avg US monthly usage', kwh: 900 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-4 h-4 text-secondary" />
        <h3 className="text-sm font-semibold text-white">kWh → Litecoin Calculator</h3>
      </div>

      {/* Input */}
      <div className="glass-card-inner p-3 mb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Battery className="w-4 h-4 text-success" />
          <span className="text-xs text-textSecondary uppercase tracking-wider">Energy (kWh)</span>
        </div>
        <input
          type="number"
          value={kwhInput}
          onChange={(e) => setKwhInput(e.target.value)}
          placeholder="Enter kWh"
          className="w-full bg-transparent text-lg font-bold font-mono text-white placeholder-white/20 outline-none"
        />
      </div>

      {/* Quick examples */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {examples.map(ex => (
          <button
            key={ex.label}
            onClick={() => setKwhInput(ex.kwh.toString())}
            className="px-2 py-1 text-[10px] text-textSecondary bg-navy-900/50 rounded border border-white/5 hover:border-primary/30 hover:text-white transition-all"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-2">
        <div className="glass-card-inner p-3">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-warning" />
            <span className="text-xs text-textSecondary">Litecoin Value</span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {ltcResult.toFixed(8)} <span className="text-sm text-textSecondary">LTC</span>
          </div>
          <div className="text-xs font-mono text-textSecondary mt-0.5">
            ≈ ${usdResult.toFixed(4)} USD
          </div>
        </div>
      </div>

      {/* Rate info */}
      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="flex justify-between text-xs">
          <span className="text-textSecondary">Rate</span>
          <span className="font-mono text-primary">
            1 kWh = {(globalIndex / ltcPrice).toFixed(8)} LTC
          </span>
        </div>
      </div>
    </motion.div>
  );
}
