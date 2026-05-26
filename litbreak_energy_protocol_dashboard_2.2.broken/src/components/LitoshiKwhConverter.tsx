import { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';

export function LitoshiKwhConverter() {
  const [litoshi, setLitoshi] = useState('');
  const [direction, setDirection] = useState<'toKwh' | 'toLitoshi'>('toKwh');

  const rate = 0.0847;
  const result = litoshi
    ? direction === 'toKwh'
      ? (parseFloat(litoshi) * rate).toFixed(6)
      : (parseFloat(litoshi) / rate).toFixed(6)
    : '0.000000';

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <ArrowRightLeft className="w-5 h-5 text-secondary" />
        <h3 className="text-sm font-semibold text-white">Litoshi ↔ kWh</h3>
      </div>

      <div className="space-y-3">
        <div className="bg-white/5 rounded-xl p-3">
          <label className="text-[10px] text-neutral-400 block mb-1">
            {direction === 'toKwh' ? 'Litoshi' : 'kWh'}
          </label>
          <input
            type="number"
            value={litoshi}
            onChange={e => setLitoshi(e.target.value)}
            placeholder="0.00"
            className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-neutral-600"
          />
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setDirection(d => d === 'toKwh' ? 'toLitoshi' : 'toKwh')}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        <div className="bg-white/5 rounded-xl p-3">
          <label className="text-[10px] text-neutral-400 block mb-1">
            {direction === 'toKwh' ? 'kWh' : 'Litoshi'}
          </label>
          <p className="text-lg font-bold text-white">{result}</p>
        </div>
      </div>

      <p className="text-[10px] text-neutral-500 mt-3 text-center">
        Rate: 1 Litoshi = {rate} kWh
      </p>
    </div>
  );
}
