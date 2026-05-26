import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';

const DATA = [
  { country: 'United States', code: 'US', flag: '🇺🇸', rate: 0.168, change: 2.1, source: 'EIA' },
  { country: 'Germany', code: 'DE', flag: '🇩🇪', rate: 0.387, change: -1.3, source: 'BDEW' },
  { country: 'Japan', code: 'JP', flag: '🇯🇵', rate: 0.262, change: 0.8, source: 'TEPCO' },
  { country: 'United Kingdom', code: 'GB', flag: '🇬🇧', rate: 0.338, change: -2.4, source: 'Ofgem' },
  { country: 'Australia', code: 'AU', flag: '🇦🇺', rate: 0.231, change: 1.5, source: 'AER' },
  { country: 'Canada', code: 'CA', flag: '🇨🇦', rate: 0.129, change: 0.3, source: 'NEB' },
  { country: 'France', code: 'FR', flag: '🇫🇷', rate: 0.213, change: -0.7, source: 'CRE' },
  { country: 'South Korea', code: 'KR', flag: '🇰🇷', rate: 0.112, change: 1.9, source: 'KEPCO' },
  { country: 'Brazil', code: 'BR', flag: '🇧🇷', rate: 0.156, change: 3.2, source: 'ANEEL' },
  { country: 'India', code: 'IN', flag: '🇮🇳', rate: 0.082, change: -0.5, source: 'CERC' },
  { country: 'China', code: 'CN', flag: '🇨🇳', rate: 0.083, change: 0.1, source: 'NDRC' },
  { country: 'Norway', code: 'NO', flag: '🇳🇴', rate: 0.098, change: -4.1, source: 'NVE' },
];

export function CountryRates() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'rate' | 'change'>('rate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = DATA.filter(
    (c) =>
      c.country.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const v = sortBy === 'rate' ? a.rate - b.rate : a.change - b.change;
    return sortDir === 'asc' ? v : -v;
  });

  const toggle = (f: 'rate' | 'change') => {
    if (sortBy === f) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(f);
      setSortDir('desc');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-2xl glass border border-white/5 p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2 className="text-lg font-bold">Global Energy Rates</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country..."
            className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/5 text-sm outline-none focus:border-primary/30 w-full sm:w-56"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-neutral-500 uppercase tracking-wider">
              <th className="text-left pb-3 font-medium">Country</th>
              <th className="text-right pb-3 font-medium">
                <button
                  onClick={() => toggle('rate')}
                  className="flex items-center gap-1 ml-auto hover:text-neutral-300"
                >
                  Rate <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-right pb-3 font-medium">
                <button
                  onClick={() => toggle('change')}
                  className="flex items-center gap-1 ml-auto hover:text-neutral-300"
                >
                  24h <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-right pb-3 font-medium hidden sm:table-cell">Source</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <motion.tr
                key={c.code}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-t border-white/5 hover:bg-white/[0.02]"
              >
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{c.flag}</span>
                    <div>
                      <p className="text-sm font-medium">{c.country}</p>
                      <p className="text-[10px] text-neutral-500 font-mono">{c.code}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-right">
                  <span className="text-sm font-mono font-medium">${c.rate.toFixed(3)}</span>
                </td>
                <td className="py-3 text-right">
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                      c.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {c.change >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(c.change).toFixed(1)}%
                  </span>
                </td>
                <td className="py-3 text-right hidden sm:table-cell">
                  <span className="text-[10px] text-neutral-500 font-mono">{c.source}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-8 text-neutral-500 text-sm">No results</div>
      )}
    </motion.div>
  );
}
