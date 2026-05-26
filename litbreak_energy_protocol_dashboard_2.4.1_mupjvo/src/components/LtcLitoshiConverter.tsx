import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownUp, Copy, Check } from 'lucide-react';
import { ltcToLitoshi, litoshiToLtc, formatWithCommas, formatLtc } from '@/utils/calculations';

type Direction = 'ltc-to-litoshi' | 'litoshi-to-ltc';

export function LtcLitoshiConverter() {
  const [direction, setDirection] = useState<Direction>('ltc-to-litoshi');
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);

  const numericInput = parseFloat(inputValue) || 0;

  const result = useMemo(() => {
    if (numericInput <= 0) return { value: 0, formatted: '0' };
    if (direction === 'ltc-to-litoshi') {
      const litoshi = ltcToLitoshi(numericInput);
      return { value: litoshi, formatted: formatWithCommas(litoshi) };
    } else {
      const ltc = litoshiToLtc(numericInput);
      return { value: ltc, formatted: formatLtc(ltc) };
    }
  }, [numericInput, direction]);

  const toggleDirection = () => {
    setDirection(d => d === 'ltc-to-litoshi' ? 'litoshi-to-ltc' : 'ltc-to-litoshi');
    setInputValue('');
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result.value.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputLabel = direction === 'ltc-to-litoshi' ? 'Litecoin (LTC)' : 'Litoshi';
  const outputLabel = direction === 'ltc-to-litoshi' ? 'Litoshi' : 'Litecoin (LTC)';

  const quickAmounts = direction === 'ltc-to-litoshi'
    ? [0.001, 0.01, 0.1, 0.5, 1, 10]
    : [1000, 10000, 100000, 1000000, 50000000, 100000000];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl glass p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center">
          <ArrowDownUp className="w-4.5 h-4.5 text-secondary" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">LTC ↔ Litoshi</h3>
          <p className="text-[11px] text-gray-500">1 LTC = 100,000,000 Litoshi</p>
        </div>
      </div>

      {/* Input */}
      <div className="mb-3">
        <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1.5 block">
          {inputLabel}
        </label>
        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3.5 focus-within:border-secondary/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-blue-400">
                {direction === 'ltc-to-litoshi' ? 'Ł' : 'ł'}
              </span>
            </div>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="0"
              className="flex-1 bg-transparent text-xl font-bold font-mono text-white outline-none placeholder:text-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {quickAmounts.map(a => (
          <button
            key={a}
            onClick={() => setInputValue(a.toString())}
            className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
              numericInput === a
                ? 'bg-secondary/20 text-secondary border border-secondary/30'
                : 'bg-white/[0.03] text-gray-400 border border-white/5 hover:border-white/10 hover:text-white'
            }`}
          >
            {direction === 'ltc-to-litoshi' ? a : formatWithCommas(a)}
          </button>
        ))}
      </div>

      {/* Toggle */}
      <div className="flex justify-center -my-0.5 relative z-10">
        <motion.button
          onClick={toggleDirection}
          className="w-10 h-10 rounded-xl bg-surface border border-white/5 flex items-center justify-center hover:border-secondary/30 transition-colors"
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowDownUp className="w-4 h-4 text-secondary" />
        </motion.button>
      </div>

      {/* Output */}
      <div className="mt-3">
        <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1.5 block">
          {outputLabel}
        </label>
        <div className="rounded-xl bg-gradient-to-br from-secondary/5 to-secondary/[0.02] border border-secondary/10 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-secondary">
                  {direction === 'ltc-to-litoshi' ? 'ł' : 'Ł'}
                </span>
              </div>
              <span className="text-xl font-bold font-mono text-white truncate">
                {numericInput > 0 ? result.formatted : '0'}
              </span>
            </div>
            {numericInput > 0 && (
              <motion.button
                onClick={copyResult}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Conversion reference */}
      <div className="mt-4 pt-3 border-t border-white/5">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex justify-between">
            <span className="text-gray-600">1 LTC</span>
            <span className="font-mono text-gray-400">100,000,000 ł</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">1 mLTC</span>
            <span className="font-mono text-gray-400">100,000 ł</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">1 μLTC</span>
            <span className="font-mono text-gray-400">100 ł</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">1 Litoshi</span>
            <span className="font-mono text-gray-400">0.00000001 Ł</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
