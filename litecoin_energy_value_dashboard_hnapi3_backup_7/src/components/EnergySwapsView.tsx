import React, { useState } from 'react';
import type { EnergyIndex } from '../types/utx';
import type { WalletTransaction } from '../types/wallet';

interface Props {
  energyIndex: EnergyIndex;
  walletAddress: string | null;
  onAddTransaction: (tx: WalletTransaction) => void;
}

const card: React.CSSProperties = { background: '#1e1e1e', border: '1px solid #2F2F2F', borderRadius: 12, padding: '20px 24px' };

const TOKENS = ['LTC', 'WLTC', 'USDT', 'ETH'];

export const EnergySwapsView: React.FC<Props> = ({ energyIndex, walletAddress, onAddTransaction }) => {
  const [fromToken, setFromToken] = useState('LTC');
  const [toToken, setToToken] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [swapping, setSwapping] = useState(false);
  const [lastTx, setLastTx] = useState<string | null>(null);

  const rate = fromToken === 'LTC' && toToken === 'USDT' ? 82.45
    : fromToken === 'USDT' && toToken === 'LTC' ? 1 / 82.45
    : 1;

  const estimated = amount ? (parseFloat(amount) * rate).toFixed(4) : '';

  const handleSwap = async () => {
    if (!walletAddress) return alert('Connect wallet first');
    if (!amount || parseFloat(amount) <= 0) return;
    setSwapping(true);
    await new Promise((r) => setTimeout(r, 1800));
    const hash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    onAddTransaction({
      hash, type: 'swap', status: 'confirmed',
      amount, symbol: fromToken,
      fromAddress: walletAddress, timestamp: Date.now(),
    });
    setLastTx(hash);
    setAmount('');
    setSwapping(false);
  };

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>🔄 Energy Swaps</h1>
      <p style={{ color: '#A3A3A3', marginBottom: 24 }}>Swap tokens at energy-adjusted rates</p>

      <div style={card}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#A3A3A3', fontSize: '0.8rem', display: 'block', marginBottom: 6 }}>From</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <select value={fromToken} onChange={(e) => setFromToken(e.target.value)}
              style={{ background: '#2F2F2F', border: '1px solid #3F3F3F', borderRadius: 8, color: '#fff', padding: '8px 12px', fontSize: '0.9rem' }}>
              {TOKENS.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
              style={{ flex: 1, background: '#2F2F2F', border: '1px solid #3F3F3F', borderRadius: 8, color: '#fff', padding: '8px 12px', fontSize: '0.9rem', outline: 'none' }} />
          </div>
        </div>

        <div style={{ textAlign: 'center', color: '#9E7FFF', fontSize: '1.2rem', marginBottom: 16, cursor: 'pointer' }}
          onClick={() => { setFromToken(toToken); setToToken(fromToken); }}>⇅</div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ color: '#A3A3A3', fontSize: '0.8rem', display: 'block', marginBottom: 6 }}>To</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <select value={toToken} onChange={(e) => setToToken(e.target.value)}
              style={{ background: '#2F2F2F', border: '1px solid #3F3F3F', borderRadius: 8, color: '#fff', padding: '8px 12px', fontSize: '0.9rem' }}>
              {TOKENS.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input readOnly value={estimated} placeholder="0.00"
              style={{ flex: 1, background: '#262626', border: '1px solid #3F3F3F', borderRadius: 8, color: '#A3A3A3', padding: '8px 12px', fontSize: '0.9rem' }} />
          </div>
        </div>

        <div style={{ background: '#262626', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: '0.8rem', color: '#A3A3A3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Rate</span><span style={{ color: '#fff' }}>1 {fromToken} = {rate.toFixed(4)} {toToken}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Energy Index</span><span style={{ color: '#9E7FFF' }}>{energyIndex.value.toFixed(2)} EVI</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Network Fee</span><span style={{ color: '#fff' }}>{energyIndex.networkFee.toFixed(4)} LTC</span>
          </div>
        </div>

        <button type="button" onClick={handleSwap} disabled={swapping || !amount}
          style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: swapping || !amount ? 'not-allowed' : 'pointer',
            background: swapping || !amount ? '#2F2F2F' : 'linear-gradient(135deg, #9E7FFF, #38bdf8)',
            color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
          {swapping ? 'Swapping…' : 'Swap'}
        </button>

        {lastTx && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: '0.75rem', color: '#10b981' }}>
            ✅ Swap confirmed! Tx: {lastTx.slice(0, 18)}…
          </div>
        )}
      </div>
    </div>
  );
};
