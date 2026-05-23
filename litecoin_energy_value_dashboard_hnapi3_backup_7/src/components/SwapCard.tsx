import React, { useState, useCallback } from 'react';
import type { EnergyIndex } from '../types/utx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SwapCardProps {
  energyIndex: EnergyIndex | null;
  onSwap: (amount: number) => void;
  isProcessing?: boolean;
}

type SwapDirection = 'ltcToKwh' | 'kwhToLtc';

// ─── Component ────────────────────────────────────────────────────────────────

export const SwapCard: React.FC<SwapCardProps> = ({
  energyIndex,
  onSwap,
  isProcessing = false,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [direction, setDirection] = useState<SwapDirection>('ltcToKwh');

  const handleSwap = useCallback(() => {
    const val = parseFloat(amount);
    if (!Number.isFinite(val) || val <= 0) return;
    onSwap(val);
  }, [amount, onSwap]);

  const litoshiPerKwh = energyIndex?.litoshiPerKwh ?? 0;
  const kwhPerLtc = energyIndex?.kwhPerLtc ?? 0;
  const ltcPrice = energyIndex?.ltcPrice ?? 0;

  const parsed = parseFloat(amount);
  const isValid = Number.isFinite(parsed) && parsed > 0;

  const computed = (() => {
    if (!isValid || !energyIndex) return null;
    if (direction === 'ltcToKwh') {
      const kwh = parsed * kwhPerLtc;
      return { result: kwh.toFixed(4), unit: 'kWh', label: 'Energy Output' };
    } else {
      const ltc = parsed / kwhPerLtc;
      return { result: ltc.toFixed(8), unit: 'LTC', label: 'LTC Needed' };
    }
  })();

  return (
    <div style={{ border: '1px solid #2F2F2F', borderRadius: 16, padding: 24, background: '#262626' }}>
      <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '1.1rem' }}>Litbreak Swap</h3>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setDirection('ltcToKwh')}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #2F2F2F',
            background: direction === 'ltcToKwh' ? '#9E7FFF' : '#1f1f1f',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          LTC → kWh
        </button>
        <button
          type="button"
          onClick={() => setDirection('kwhToLtc')}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #2F2F2F',
            background: direction === 'kwhToLtc' ? '#38bdf8' : '#1f1f1f',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          kWh → LTC
        </button>
      </div>

      <label style={{ display: 'block', marginBottom: 8, color: '#A3A3A3', fontSize: '0.85rem' }}>
        {direction === 'ltcToKwh' ? 'Amount (LTC)' : 'Amount (kWh)'}
      </label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 8,
          border: '1px solid #2F2F2F',
          background: '#171717',
          color: '#fff',
          fontSize: '1rem',
          marginBottom: 16,
          outline: 'none',
        }}
      />

      {computed && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: 'rgba(56,189,248,0.08)' }}>
          <div style={{ fontSize: '0.8rem', color: '#A3A3A3' }}>{computed.label}</div>
          <div style={{ fontSize: '1.2rem', color: '#38bdf8', fontWeight: 700 }}>
            {computed.result} {computed.unit}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!isValid || isProcessing}
        onClick={handleSwap}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 8,
          border: 'none',
          background: 'linear-gradient(135deg, #9E7FFF, #38bdf8)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '1rem',
          cursor: isValid && !isProcessing ? 'pointer' : 'not-allowed',
          opacity: isValid && !isProcessing ? 1 : 0.6,
        }}
      >
        {isProcessing ? 'Processing...' : 'Execute Swap'}
      </button>

      <div style={{ marginTop: 12, fontSize: '0.75rem', color: '#A3A3A3' }}>
        LTC Price: ${ltcPrice.toFixed(4)} · Index: {litoshiPerKwh.toFixed(0)} Litoshi/kWh
      </div>
    </div>
  );
};

export default SwapCard;
