import { useState } from 'react';
import { Brain, RefreshCw, Loader2 } from 'lucide-react';

const INSIGHTS = [
  { title: 'Bullish Momentum', confidence: 78, description: 'LTC showing strong upward momentum with increasing volume. RSI at 62 suggests room for growth.' },
  { title: 'Energy Efficiency Up', confidence: 85, description: 'Network energy efficiency improved 3.2% this week. Mining profitability trending positive.' },
  { title: 'Whale Accumulation', confidence: 71, description: 'Large wallets (>10K LTC) have increased holdings by 2.1% in the past 48 hours.' },
];

export function AIAnalysis() {
  const [loading, setLoading] = useState(false);
  const [activeInsight, setActiveInsight] = useState(0);

  const refresh = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
  };

  const insight = INSIGHTS[activeInsight];

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent" />
          <h3 className="text-sm font-semibold text-white">AI Analysis</h3>
        </div>
        <button onClick={refresh} disabled={loading} className="p-1.5 rounded-lg hover:bg-white/5 text-neutral-400 transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-medium text-white">{insight.title}</h4>
          <span className="text-xs font-medium text-success">{insight.confidence}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all" style={{ width: `${insight.confidence}%` }} />
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">{insight.description}</p>
      </div>

      <div className="flex gap-1">
        {INSIGHTS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveInsight(i)}
            className={`flex-1 h-1 rounded-full transition-colors ${i === activeInsight ? 'bg-primary' : 'bg-white/10'}`}
          />
        ))}
      </div>
    </div>
  );
}
