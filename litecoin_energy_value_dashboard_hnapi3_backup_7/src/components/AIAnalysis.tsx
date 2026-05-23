import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Brain, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface AISignal {
  type: 'buy' | 'sell' | 'hold';
  confidence: number;
  reason: string;
  timeframe: string;
}

interface AIAnalysisProps {
  ltcPrice?: number;
  energyIndex?: number;
}

const generateSignal = (price: number, energy: number): AISignal => {
  const rand = Math.random();
  if (energy > 70 && rand > 0.4) {
    return { type: 'buy', confidence: 72 + Math.floor(rand * 20), reason: 'High energy index with bullish momentum', timeframe: '4H' };
  } else if (energy < 30 && rand > 0.5) {
    return { type: 'sell', confidence: 65 + Math.floor(rand * 18), reason: 'Low energy index signals bearish pressure', timeframe: '1H' };
  }
  return { type: 'hold', confidence: 55 + Math.floor(rand * 25), reason: 'Neutral energy zone — await confirmation', timeframe: '1D' };
};

const AIAnalysis: React.FC<AIAnalysisProps> = ({ ltcPrice = 87.42, energyIndex = 62 }) => {
  const [signal, setSignal] = useState<AISignal>(() => generateSignal(ltcPrice, energyIndex));
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setSignal(generateSignal(ltcPrice, energyIndex));
      setIsAnalyzing(false);
    }, 1800);
  };

  useEffect(() => {
    const id = setInterval(runAnalysis, 30_000);
    return () => clearInterval(id);
  }, [ltcPrice, energyIndex]);

  const signalColor = signal.type === 'buy' ? '#10b981' : signal.type === 'sell' ? '#ef4444' : '#f59e0b';
  const SignalIcon = signal.type === 'buy' ? TrendingUp : signal.type === 'sell' ? TrendingDown : AlertTriangle;

  return (
    <div style={{ background: '#1e1e1e', border: '1px solid #2F2F2F', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Brain size={18} color="#9E7FFF" />
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>AI Analysis</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={14} color="#9E7FFF" />
          <span style={{ color: '#9E7FFF', fontSize: '0.75rem' }}>Live</span>
        </div>
      </div>

      <div style={{ background: '#262626', borderRadius: 8, padding: 16, marginBottom: 12, border: `1px solid ${signalColor}33` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <SignalIcon size={20} color={signalColor} />
          <span style={{ color: signalColor, fontWeight: 800, fontSize: '1.1rem', textTransform: 'uppercase' }}>
            {signal.type}
          </span>
          <span style={{ marginLeft: 'auto', color: '#A3A3A3', fontSize: '0.75rem' }}>{signal.timeframe}</span>
        </div>
        <p style={{ color: '#A3A3A3', fontSize: '0.82rem', margin: 0 }}>{signal.reason}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ color: '#A3A3A3', fontSize: '0.8rem' }}>Confidence</span>
        <div style={{ flex: 1, height: 6, background: '#2F2F2F', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${signal.confidence}%`, height: '100%', background: signalColor, borderRadius: 3, transition: 'width 0.6s ease' }} />
        </div>
        <span style={{ color: signalColor, fontSize: '0.8rem', fontWeight: 700 }}>{signal.confidence}%</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ background: '#262626', borderRadius: 6, padding: '8px 12px' }}>
          <div style={{ color: '#A3A3A3', fontSize: '0.7rem' }}>LTC Price</div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>${ltcPrice.toFixed(2)}</div>
        </div>
        <div style={{ background: '#262626', borderRadius: 6, padding: '8px 12px' }}>
          <div style={{ color: '#A3A3A3', fontSize: '0.7rem' }}>Energy Index</div>
          <div style={{ color: '#9E7FFF', fontWeight: 700, fontSize: '0.9rem' }}>{energyIndex.toFixed(1)}</div>
        </div>
      </div>

      <button
        onClick={runAnalysis}
        disabled={isAnalyzing}
        style={{ width: '100%', padding: '8px 0', background: isAnalyzing ? '#2F2F2F' : 'rgba(158,127,255,0.15)',
          border: '1px solid #9E7FFF', borderRadius: 8, color: '#9E7FFF', fontSize: '0.82rem',
          fontWeight: 600, cursor: isAnalyzing ? 'not-allowed' : 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {isAnalyzing ? (
          <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Analyzing…</>
        ) : (
          <><CheckCircle size={14} /> Re-analyze</>
        )}
      </button>
    </div>
  );
};

export default AIAnalysis;
