import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, Calculator, RefreshCw, AlertCircle, ChevronDown, Info } from 'lucide-react';
import { useLtcPrice } from '../hooks/useLtcPrice';
import { computeWeightedAverage } from '../data/countries';

const LITOSHI_PER_LTC = 100_000_000;

const CURRENCIES: { code: string; symbol: string; rate: number }[] = [
  { code: 'USD', symbol: '$', rate: 1 },
  { code: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'GBP', symbol: '£', rate: 0.79 },
];

export default function LitoshiKwhCalculator() {
  const { data: ltcData, isLoading: priceLoading, isLive, refresh } = useLtcPrice();
  const [litoshiInput, setLitoshiInput] = useState('100000000');
  const [electricityRate, setElectricityRate] = useState(
    computeWeightedAverage().toFixed(3)
  );
  const [currency, setCurrency] = useState('USD');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [manualLtcPrice, setManualLtcPrice] = useState('');
  const [useManualPrice, setUseManualPrice] = useState(false);

  const selectedCurrency = useMemo(
    () => CURRENCIES.find(c => c.code === currency) || CURRENCIES[0],
    [currency]
  );

  const effectiveLtcPrice = useMemo(() => {
    if (useManualPrice && manualLtcPrice) {
      return parseFloat(manualLtcPrice);
    }
    return ltcData.price;
  }, [useManualPrice, manualLtcPrice, ltcData.price]);

  const result = useMemo(() => {
    const litoshi = parseFloat(litoshiInput);
    const rate = parseFloat(electricityRate);

    if (isNaN(litoshi) || litoshi < 0 || isNaN(rate) || rate <= 0 || !effectiveLtcPrice) {
      return null;
    }

    const ltcAmount = litoshi / LITOSHI_PER_LTC;
    const usdValue = ltcAmount * effectiveLtcPrice;
    const localValue = usdValue * selectedCurrency.rate;
    const localRate = rate * selectedCurrency.rate;
    const kWh = localValue / localRate;

    return {
      ltcAmount,
      usdValue,
      localValue,
      kWh,
    };
  }, [litoshiInput, electricityRate, effectiveLtcPrice, selectedCurrency]);

  const handleLitoshiChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setLitoshiInput(val);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            Litoshi → kWh Calculator
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Convert Litoshi to energy purchasing power
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
            isLive && !useManualPrice
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-warning/10 text-warning border border-warning/20'
          }`}>
            {isLive && !useManualPrice ? '● LIVE' : '○ SIMULATED'}
          </span>
          <button
            onClick={refresh}
            className="p-1.5 rounded-lg hover:bg-surface transition-colors"
            title="Refresh LTC price"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${priceLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* LTC Price Display */}
      <div className="mb-5 p-3 rounded-xl bg-background/60 border border-border/30">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">LTC/USD Price</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-semibold text-white">
              ${effectiveLtcPrice.toFixed(2)}
            </span>
            {!useManualPrice && (
              <span className={`text-[10px] font-mono ${
                ltcData.changePercent24h >= 0 ? 'text-success' : 'text-error'
              }`}>
                {ltcData.changePercent24h >= 0 ? '+' : ''}{ltcData.changePercent24h.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={useManualPrice}
              onChange={e => setUseManualPrice(e.target.checked)}
              className="w-3 h-3 rounded border-border accent-primary"
            />
            <span className="text-[10px] text-gray-500">Manual override</span>
          </label>
          {useManualPrice && (
            <input
              type="number"
              value={manualLtcPrice}
              onChange={e => setManualLtcPrice(e.target.value)}
              placeholder="Enter LTC price"
              className="flex-1 px-2 py-1 rounded-lg bg-surface border border-border/50 text-xs font-mono text-white
                         placeholder:text-gray-600 focus:outline-none focus:border-primary/50"
            />
          )}
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-4 mb-6">
        {/* Litoshi Input */}
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Litoshi Amount</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={litoshiInput}
              onChange={handleLitoshiChange}
              placeholder="100000000"
              className="w-full px-4 py-3 rounded-xl bg-background/80 border border-border/50 text-white
                         font-mono text-lg placeholder:text-gray-600 focus:outline-none focus:border-primary/50
                         focus:ring-1 focus:ring-primary/20 transition-all duration-200"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">
              litoshi
            </span>
          </div>
          {litoshiInput && (
            <p className="text-[10px] text-gray-600 mt-1 font-mono">
              = {(parseFloat(litoshiInput || '0') / LITOSHI_PER_LTC).toFixed(8)} LTC
            </p>
          )}
        </div>

        {/* Electricity Rate + Currency */}
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Electricity Rate (per kWh)</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                {selectedCurrency.symbol}
              </span>
              <input
                type="number"
                step="0.001"
                min="0"
                value={electricityRate}
                onChange={e => setElectricityRate(e.target.value)}
                placeholder="0.142"
                className="w-full pl-7 pr-4 py-3 rounded-xl bg-background/80 border border-border/50 text-white
                           font-mono text-lg placeholder:text-gray-600 focus:outline-none focus:border-primary/50
                           focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            {/* Currency Selector */}
            <div className="relative">
              <button
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                className="h-full px-4 rounded-xl bg-surface border border-border/50 text-sm font-medium text-white
                           hover:border-primary/30 transition-all flex items-center gap-1.5 min-w-[80px] justify-center"
              >
                {currency}
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {showCurrencyDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-1 w-24 glass-card p-1 z-20"
                >
                  {CURRENCIES.map(c => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrency(c.code);
                        setShowCurrencyDropdown(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                        currency === c.code
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-300 hover:bg-surface/80'
                      }`}
                    >
                      {c.symbol} {c.code}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Result */}
      {result ? (
        <motion.div
          key={result.kWh.toFixed(2)}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20"
        >
          <div className="text-center mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Energy Equivalent</p>
            <p className="text-3xl font-bold text-white">
              {result.kWh >= 1000
                ? `${(result.kWh / 1000).toFixed(2)} MWh`
                : `${result.kWh.toFixed(4)} kWh`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-2.5 rounded-lg bg-background/40 text-center">
              <p className="text-[10px] text-gray-500">LTC Value</p>
              <p className="text-sm font-mono text-white">{result.ltcAmount.toFixed(8)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-background/40 text-center">
              <p className="text-[10px] text-gray-500">{currency} Value</p>
              <p className="text-sm font-mono text-white">
                {selectedCurrency.symbol}{result.localValue.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="p-5 rounded-xl bg-background/40 border border-border/20 text-center">
          <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Enter valid values to see the conversion</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 flex items-start gap-2 text-[10px] text-gray-600">
        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <p>
          Formula: kWh = (litoshi ÷ 100,000,000) × LTC Price ÷ Electricity Rate.
          Default rate is the consumption-weighted global average.
        </p>
      </div>
    </motion.div>
  );
}
