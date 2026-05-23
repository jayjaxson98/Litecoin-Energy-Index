import React, { useState, useCallback } from 'react';
import { Brain, TrendingUp, TrendingDown, Zap, RefreshCw, AlertCircle } from 'lucide-react';

interface Prediction {
  direction: 'up' | 'down';
  magnitude: number;
  confidence: number;
  horizon: string;
  rationale: string;
}

interface AITradingPanelProps {
  ltcPrice?: number;
  energyIndex?: number;
  onSignal?: (signal: Prediction) => void;
}

const makePrediction = (price: number, energy: number): Prediction => {
  const r = Math.random();
  const direction: 'up' | 'down' = energy > 50 ? (r > 0.35 ? 'up' : 'down') : (r > 0.6 ? 'up' : 'down');
  return {
    direction,
    magnitude: parseFloat((1 + Math.random() * 8).toFixed(2)),
    confidence: Math.floor(55 + Math.random() * 38),
    horizon: ['1H', '4H', '1D', '3D'][Math.floor(Math.random() * 4)],
    rationale: direction === 'up'
      ? `Energy index at ${energy.toFixed(1)} supports upward momentum. Price at $${price.toFixed(2)} shows accumulation.`
      : `Energy index at ${energy.toFixed(1)} signals distribution. Resistance near $${(price * 1.03).toFixed(2)}.`,
  };
};

const AITradingPanel: React.FC<AITradingPanelProps> = ({ ltcPrice = 87.42, energyIndex = 62, onSignal }) => {
  const [prediction, setPrediction] = useState<Prediction>(() => makePrediction(ltcPrice, energyIndex));
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Prediction[]>([]);

  const refresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const p: Prediction = makePrediction(ltcPrice, energyIndex);
      setPrediction(p);
      setHistory((prev) => [p, ...prev].slice(0, 5));
      onSignal?.(p);
      setLoading(false);
    }, 1400);
  }, [ltcPrice, energyIndex, onSignal]);

  const color = prediction.direction === 'up' ? '#10b981' : '#ef4444';
  const Icon = prediction.direction === 'up' ? TrendingUp : TrendingDown;

  return (
    <div style={{ background: '#1e1e1e', border: '1px solid #2F2F2F', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Brain size={18} color="#9E7FFF" />
        <span style={{ color: '#fff', fontWeight: 700 }}>AI Trading Panel</span>
        <button onClick={refresh} disabled={loading}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', color: '#9E7FFF' }}>
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div style={{ background: '#262626', borderRadius: 10, padding: 16, marginBottom: 12, border: `1px solid ${color}33` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Icon size={22} color={color} />
          <span style={{ color, fontWeight: 800, fontSize: '1.15rem' }}>
            {prediction.direction.toUpperCase()} {prediction.magnitude}%
          </span>
          <span style={{ marginLeft: 'auto', background: '#1e1e1e', borderRadius: 4, padding: '2px 8px', color: '#A3A3A3', fontSize: '0.72rem' }}>
            {prediction.horizon}
          </span>
        </div>
        <p style={{ color: '#A3A3A3', fontSize: '0.8rem', margin: 0 }}>{prediction.rationale}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Zap size={13} color="#f59e0b" />
        <span style={{ color: '#A3A3A3', fontSize: '0.78rem' }}>Confidence</span>
        <div style={{ flex: 1, height: 5, background: '#2F2F2F', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${prediction.confidence}%`, height: '100%', background: color, transition: 'width 0.5s ease' }} />
        </div>
        <span style={{ color, fontSize: '0.78rem', fontWeight: 700 }}>{prediction.confidence}%</span>
      </div>

      {history.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <AlertCircle size={13} color="#A3A3A3" />
            <span style={{ color: '#A3A3A3', fontSize: '0.75rem' }}>Recent Signals</span>
          </div>
          {history.map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: i < history.length - 1 ? '1px solid #2F2F2F' : 'none' }}>
              {h.direction === 'up' ? <TrendingUp size={12} color="#10b981" /> : <TrendingDown size={12} color="#ef4444" />}
              <span style={{ color: h.direction === 'up' ? '#10b981' : '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                {h.direction.toUpperCase()} {h.magnitude}%
              </span>
              <span style={{ color: '#3F3F3F', fontSize: '0.7rem', marginLeft: 'auto' }}>{h.horizon}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AITradingPanel;
