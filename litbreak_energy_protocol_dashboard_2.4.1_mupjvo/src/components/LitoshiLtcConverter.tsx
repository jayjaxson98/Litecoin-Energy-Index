import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Copy, Check, Info } from 'lucide-react';

const LITOSHI_PER_LTC = 100_000_000;

export default function LitoshiLtcConverter() {
  const [litoshiValue, setLitoshiValue] = useState('100000000');
  const [ltcValue, setLtcValue] = useState('1.00000000');
  const [lastEdited, setLastEdited] = useState<'litoshi' | 'ltc'>('litoshi');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatLitoshi = (val: string): string => {
    const num = parseInt(val.replace(/,/g, ''), 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US');
  };

  const handleLitoshiChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setLitoshiValue(raw);
    setLastEdited('litoshi');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const num = parseInt(raw, 10);
      if (!isNaN(num) && num >= 0) {
        setLtcValue((num / LITOSHI_PER_LTC).toFixed(8));
      } else {
        setLtcValue('');
      }
    }, 150);
  }, []);

  const handleLtcChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw && !/^\d*\.?\d{0,8}$/.test(raw)) return;
    setLtcValue(raw);
    setLastEdited('ltc');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const num = parseFloat(raw);
      if (!isNaN(num) && num >= 0) {
        setLitoshiValue(Math.round(num * LITOSHI_PER_LTC).toString());
      } else {
        setLitoshiValue('');
      }
    }, 150);
  }, []);

  const handleSwap = useCallback(() => {
    if (lastEdited === 'litoshi') {
      setLastEdited('ltc');
    } else {
      setLastEdited('litoshi');
    }
  }, [lastEdited]);

  const handleCopy = useCallback((field: string, value: string) => {
    navigator.clipboard.writeText(value.replace(/,/g, ''));
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const litoshiNum = parseInt(litoshiValue.replace(/,/g, ''), 10);
  const isValid = !isNaN(litoshiNum) && litoshiNum >= 0;

  // Quick presets
  const presets = [
    { label: '1 LTC', litoshi: '100000000' },
    { label: '0.1 LTC', litoshi: '10000000' },
    { label: '0.01 LTC', litoshi: '1000000' },
    { label: '1000 sat', litoshi: '1000' },
    { label: '1 sat', litoshi: '1' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-card p-6"
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/20 to-blue-500/20 border border-secondary/30 flex items-center justify-center">
            <ArrowUpDown className="w-4 h-4 text-secondary" />
          </div>
          Litoshi ↔ LTC Converter
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          1 LTC = 100,000,000 Litoshi (fixed rate)
        </p>
      </div>

      {/* Converter */}
      <div className="space-y-3">
        {/* Litoshi Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm text-gray-400">Litoshi</label>
            <button
              onClick={() => handleCopy('litoshi', litoshiValue)}
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-primary transition-colors"
            >
              {copiedField === 'litoshi' ? (
                <><Check className="w-3 h-3 text-success" /> Copied</>
              ) : (
                <><Copy className="w-3 h-3" /> Copy</>
              )}
            </button>
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={litoshiValue ? formatLitoshi(litoshiValue) : ''}
            onChange={handleLitoshiChange}
            placeholder="0"
            className={`w-full px-4 py-3 rounded-xl bg-background/80 border text-white
                       font-mono text-lg placeholder:text-gray-600 focus:outline-none
                       focus:ring-1 transition-all duration-200 ${
                         lastEdited === 'litoshi'
                           ? 'border-primary/40 focus:border-primary/60 focus:ring-primary/20'
                           : 'border-border/50 focus:border-primary/50 focus:ring-primary/20'
                       }`}
          />
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            className="p-2 rounded-full bg-surface border border-border/50 hover:border-primary/30
                       hover:bg-primary/5 transition-all duration-200 group"
          >
            <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
          </button>
        </div>

        {/* LTC Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm text-gray-400">Litecoin (LTC)</label>
            <button
              onClick={() => handleCopy('ltc', ltcValue)}
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-primary transition-colors"
            >
              {copiedField === 'ltc' ? (
                <><Check className="w-3 h-3 text-success" /> Copied</>
              ) : (
                <><Copy className="w-3 h-3" /> Copy</>
              )}
            </button>
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={ltcValue}
            onChange={handleLtcChange}
            placeholder="0.00000000"
            className={`w-full px-4 py-3 rounded-xl bg-background/80 border text-white
                       font-mono text-lg placeholder:text-gray-600 focus:outline-none
                       focus:ring-1 transition-all duration-200 ${
                         lastEdited === 'ltc'
                           ? 'border-secondary/40 focus:border-secondary/60 focus:ring-secondary/20'
                           : 'border-border/50 focus:border-primary/50 focus:ring-primary/20'
                       }`}
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="mt-4">
        <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Quick Values</p>
        <div className="flex flex-wrap gap-1.5">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => {
                setLitoshiValue(p.litoshi);
                setLtcValue((parseInt(p.litoshi) / LITOSHI_PER_LTC).toFixed(8));
                setLastEdited('litoshi');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                litoshiValue === p.litoshi
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-surface/60 text-gray-400 border border-border/30 hover:border-primary/20 hover:text-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Validation */}
      {litoshiValue && !isValid && (
        <p className="mt-3 text-xs text-error flex items-center gap-1">
          <Info className="w-3 h-3" />
          Litoshi must be a non-negative integer
        </p>
      )}

      {/* Info */}
      <div className="mt-4 flex items-start gap-2 text-[10px] text-gray-600">
        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <p>
          Litoshi is the smallest unit of Litecoin, similar to Satoshi for Bitcoin.
          1 Litecoin = 100,000,000 Litoshi (10⁸).
        </p>
      </div>
    </motion.div>
  );
}
