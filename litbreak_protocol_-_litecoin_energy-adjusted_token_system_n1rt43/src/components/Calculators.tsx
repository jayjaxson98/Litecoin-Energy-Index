import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ArrowRightLeft, Zap, Coins } from 'lucide-react';
import { useEnergyIndex } from '../hooks/useEnergyIndex';
import { formatNumber } from '../utils/format';
import { ltcPriceHistory } from '../data/energyData';

const Calculators: React.FC = () => {
  const { globalIndex, energyFactor } = useEnergyIndex();
  const ltcPrice = ltcPriceHistory[ltcPriceHistory.length - 1].price;

  // Litoshi ↔ kWh Calculator
  const [litoshiInput, setLitoshiInput] = useState('100000000'); // 1 LTC
  const [kWhInput, setKWhInput] = useState('');
  const [litoshiDirection, setLitoshiDirection] = useState<'litoshi-to-kwh' | 'kwh-to-litoshi'>('litoshi-to-kwh');

  // kWh ↔ Litecoin Calculator
  const [kWhLtcInput, setKWhLtcInput] = useState('100');
  const [ltcInput, setLtcInput] = useState('');
  const [kWhLtcDirection, setKWhLtcDirection] = useState<'kwh-to-ltc' | 'ltc-to-kwh'>('kwh-to-ltc');

  // Litoshi ↔ kWh conversions
  const litoshiToKWhResult = useMemo(() => {
    const litoshi = parseFloat(litoshiInput) || 0;
    const ltcAmount = litoshi / 1e8;
    const usdValue = ltcAmount * ltcPrice;
    const kWh = usdValue / (globalIndex / 100);
    return { kWh, ltcAmount, usdValue };
  }, [litoshiInput, ltcPrice, globalIndex]);

  const kWhToLitoshiResult = useMemo(() => {
    const kWh = parseFloat(kWhInput) || 0;
    const usdCost = kWh * (globalIndex / 100);
    const ltcAmount = usdCost / ltcPrice;
    const litoshi = ltcAmount * 1e8;
    return { litoshi, ltcAmount, usdCost };
  }, [kWhInput, ltcPrice, globalIndex]);

  // kWh ↔ LTC conversions
  const kWhToLtcResult = useMemo(() => {
    const kWh = parseFloat(kWhLtcInput) || 0;
    const usdCost = kWh * (globalIndex / 100);
    const ltcAmount = usdCost / ltcPrice;
    const lbtEstimate = ltcAmount * energyFactor;
    return { ltcAmount, usdCost, lbtEstimate };
  }, [kWhLtcInput, ltcPrice, globalIndex, energyFactor]);

  const ltcToKWhResult = useMemo(() => {
    const ltc = parseFloat(ltcInput) || 0;
    const usdValue = ltc * ltcPrice;
    const kWh = usdValue / (globalIndex / 100);
    const lbtEstimate = ltc * energyFactor;
    return { kWh, usdValue, lbtEstimate };
  }, [ltcInput, ltcPrice, globalIndex, energyFactor]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Litoshi ↔ kWh Calculator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl neon-border p-6"
        style={{ background: 'rgba(18, 18, 26, 0.8)' }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-primary/20">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Litoshi ↔ kWh</h3>
            <p className="text-xs text-white/40">Convert between Litoshi and kilowatt-hours</p>
          </div>
        </div>

        {/* Direction Toggle */}
        <div className="flex items-center gap-2 mb-4 p-1 rounded-lg glass border border-white/5">
          <button
            onClick={() => setLitoshiDirection('litoshi-to-kwh')}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
              litoshiDirection === 'litoshi-to-kwh' ? 'bg-primary/20 text-primary' : 'text-white/40'
            }`}
          >
            Litoshi → kWh
          </button>
          <button
            onClick={() => setLitoshiDirection('kwh-to-litoshi')}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
              litoshiDirection === 'kwh-to-litoshi' ? 'bg-primary/20 text-primary' : 'text-white/40'
            }`}
          >
            kWh → Litoshi
          </button>
        </div>

        {litoshiDirection === 'litoshi-to-kwh' ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Litoshi Amount</label>
              <input
                type="number"
                value={litoshiInput}
                onChange={e => setLitoshiInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-primary/50 outline-none text-sm font-mono text-white placeholder-white/20 transition-colors"
                placeholder="Enter litoshi..."
              />
              <div className="text-xs text-white/30 mt-1">
                = {formatNumber(litoshiToKWhResult.ltcAmount, 8)} LTC
              </div>
            </div>

            <div className="flex justify-center">
              <div className="p-2 rounded-full glass border border-white/10">
                <ArrowRightLeft className="w-4 h-4 text-primary" />
              </div>
            </div>

            <div className="p-4 rounded-xl glass border border-energy/20">
              <div className="text-xs text-white/50 mb-1">Energy Equivalent</div>
              <div className="text-2xl font-mono font-bold text-energy">
                {formatNumber(litoshiToKWhResult.kWh, 2)} kWh
              </div>
              <div className="text-xs text-white/30 mt-1">
                ≈ ${formatNumber(litoshiToKWhResult.usdValue, 2)} USD at current rates
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">kWh Amount</label>
              <input
                type="number"
                value={kWhInput}
                onChange={e => setKWhInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-primary/50 outline-none text-sm font-mono text-white placeholder-white/20 transition-colors"
                placeholder="Enter kWh..."
              />
            </div>

            <div className="flex justify-center">
              <div className="p-2 rounded-full glass border border-white/10">
                <ArrowRightLeft className="w-4 h-4 text-primary" />
              </div>
            </div>

            <div className="p-4 rounded-xl glass border border-secondary/20">
              <div className="text-xs text-white/50 mb-1">Litoshi Equivalent</div>
              <div className="text-2xl font-mono font-bold text-secondary">
                {formatNumber(kWhToLitoshiResult.litoshi, 0)}
              </div>
              <div className="text-xs text-white/30 mt-1">
                = {formatNumber(kWhToLitoshiResult.ltcAmount, 8)} LTC (${formatNumber(kWhToLitoshiResult.usdCost, 2)})
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-white/20">
          <Zap className="w-3 h-3" />
          Using Global Energy Index: {formatNumber(globalIndex, 1)}¢/kWh
        </div>
      </motion.div>

      {/* kWh ↔ Litecoin Calculator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl neon-border p-6"
        style={{ background: 'rgba(18, 18, 26, 0.8)' }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-secondary/20">
            <Coins className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">kWh ↔ Litecoin</h3>
            <p className="text-xs text-white/40">Energy cost to LTC with LBT estimate</p>
          </div>
        </div>

        {/* Direction Toggle */}
        <div className="flex items-center gap-2 mb-4 p-1 rounded-lg glass border border-white/5">
          <button
            onClick={() => setKWhLtcDirection('kwh-to-ltc')}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
              kWhLtcDirection === 'kwh-to-ltc' ? 'bg-secondary/20 text-secondary' : 'text-white/40'
            }`}
          >
            kWh → LTC
          </button>
          <button
            onClick={() => setKWhLtcDirection('ltc-to-kwh')}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
              kWhLtcDirection === 'ltc-to-kwh' ? 'bg-secondary/20 text-secondary' : 'text-white/40'
            }`}
          >
            LTC → kWh
          </button>
        </div>

        {kWhLtcDirection === 'kwh-to-ltc' ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Energy (kWh)</label>
              <input
                type="number"
                value={kWhLtcInput}
                onChange={e => setKWhLtcInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-secondary/50 outline-none text-sm font-mono text-white placeholder-white/20 transition-colors"
                placeholder="Enter kWh..."
              />
              <div className="text-xs text-white/30 mt-1">
                Cost: ${formatNumber(kWhToLtcResult.usdCost, 2)} USD
              </div>
            </div>

            <div className="flex justify-center">
              <div className="p-2 rounded-full glass border border-white/10">
                <ArrowRightLeft className="w-4 h-4 text-secondary" />
              </div>
            </div>

            <div className="p-4 rounded-xl glass border border-secondary/20">
              <div className="text-xs text-white/50 mb-1">LTC Equivalent</div>
              <div className="text-2xl font-mono font-bold text-secondary">
                {formatNumber(kWhToLtcResult.ltcAmount, 8)} LTC
              </div>
              <div className="flex items-center gap-1 text-xs text-primary/70 mt-2">
                <Zap className="w-3 h-3" />
                Would mint ≈ {formatNumber(kWhToLtcResult.lbtEstimate, 4)} LBT
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">LTC Amount</label>
              <input
                type="number"
                value={ltcInput}
                onChange={e => setLtcInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-secondary/50 outline-none text-sm font-mono text-white placeholder-white/20 transition-colors"
                placeholder="Enter LTC..."
              />
              <div className="text-xs text-white/30 mt-1">
                Value: ${formatNumber(ltcToKWhResult.usdValue, 2)} USD
              </div>
            </div>

            <div className="flex justify-center">
              <div className="p-2 rounded-full glass border border-white/10">
                <ArrowRightLeft className="w-4 h-4 text-secondary" />
              </div>
            </div>

            <div className="p-4 rounded-xl glass border border-energy/20">
              <div className="text-xs text-white/50 mb-1">Energy Equivalent</div>
              <div className="text-2xl font-mono font-bold text-energy">
                {formatNumber(ltcToKWhResult.kWh, 2)} kWh
              </div>
              <div className="flex items-center gap-1 text-xs text-primary/70 mt-2">
                <Zap className="w-3 h-3" />
                Would mint ≈ {formatNumber(ltcToKWhResult.lbtEstimate, 4)} LBT
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-white/20">
          <Coins className="w-3 h-3" />
          LTC Price: ${formatNumber(ltcPrice, 2)} | Factor: {formatNumber(energyFactor, 2)}x
        </div>
      </motion.div>
    </div>
  );
};

export default Calculators;
