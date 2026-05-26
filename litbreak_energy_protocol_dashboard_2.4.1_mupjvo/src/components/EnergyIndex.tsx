import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock } from 'lucide-react';

type TF = '1H' | '24H' | '7D' | '30D' | '1Y';

function gen(tf: TF) {
  const pts: { time: string; value: number; volume: number }[] = [];
  const n =
    tf === '1H' ? 60 : tf === '24H' ? 96 : tf === '7D' ? 168 : tf === '30D' ? 120 : 365;
  let v = 0.142;
  for (let i = 0; i < n; i++) {
    v += (Math.random() - 0.48) * 0.002;
    v = Math.max(0.08, Math.min(0.22, v));
    const d = new Date(Date.now() - (n - i) * 3600000);
    pts.push({
      time:
        tf === '1H' || tf === '24H'
          ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      value: parseFloat(v.toFixed(4)),
      volume: Math.floor(Math.random() * 50000 + 10000),
    });
  }
  return pts;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl p-3 border border-white/10 shadow-xl">
      <p className="text-[10px] text-neutral-400 mb-1">{label}</p>
      <p className="text-sm font-bold font-mono text-primary">${payload[0].value}/kWh</p>
    </div>
  );
}

export function EnergyIndex() {
  const [tf, setTf] = useState<TF>('24H');
  const [data, setData] = useState<ReturnType<typeof gen>>([]);

  useEffect(() => {
    setData(gen(tf));
  }, [tf]);

  const cur = data.length ? data[data.length - 1].value : 0.142;
  const start = data.length ? data[0].value : 0.142;
  const chg = ((cur - start) / start) * 100;
  const pos = chg >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl glass border border-white/5 p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold">Global Energy Index</h2>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-neutral-400">
              <Clock className="w-3 h-3" />
              Live
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold font-mono">${cur.toFixed(4)}</span>
            <span className="text-xs text-neutral-400">/kWh</span>
            <span
              className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                pos ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
              }`}
            >
              <TrendingUp className={`w-3 h-3 ${!pos ? 'rotate-180' : ''}`} />
              {Math.abs(chg).toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5">
          {(['1H', '24H', '7D', '30D', '1Y'] as TF[]).map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                tf === t
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[280px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9E7FFF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#9E7FFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#525252', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#525252', fontSize: 10 }}
              domain={['auto', 'auto']}
              tickFormatter={(v: number) => `$${v}`}
              width={50}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#9E7FFF"
              strokeWidth={2}
              fill="url(#eg)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
