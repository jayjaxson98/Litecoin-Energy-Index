import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ArrowUpDown, ArrowUp, ArrowDown, Search, Zap, CheckCircle2 } from 'lucide-react';
import { countries, computeWeightedAverage } from '@/data/countries';
import type { CountryData } from '@/types';

type SortKey = 'rank' | 'name' | 'rate' | 'consumption' | 'region';
type SortDir = 'asc' | 'desc';

interface Props {
  onSelectCountry?: (country: CountryData) => void;
  selectedCountryCode?: string;
}

export function CountryEnergyTable({ onSelectCountry, selectedCountryCode }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('rate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const globalAvg = useMemo(() => computeWeightedAverage(), []);

  const sorted = useMemo(() => {
    let filtered = countries.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.region.toLowerCase().includes(search.toLowerCase())
    );

    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'rate': cmp = a.rate - b.rate; break;
        case 'consumption': cmp = a.consumption - b.consumption; break;
        case 'region': cmp = a.region.localeCompare(b.region); break;
        default: cmp = a.rate - b.rate;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [sortKey, sortDir, search]);

  const displayed = showAll ? sorted : sorted.slice(0, 15);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-gray-600" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-primary" />
      : <ArrowDown className="w-3 h-3 text-primary" />;
  };

  const getRateColor = (rate: number) => {
    if (rate < 0.08) return 'text-emerald-400';
    if (rate < 0.15) return 'text-secondary';
    if (rate < 0.25) return 'text-amber-400';
    return 'text-red-400';
  };

  const getRateBar = (rate: number) => {
    const maxRate = 0.4;
    return Math.min((rate / maxRate) * 100, 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="rounded-2xl glass p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Globe className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Global Energy Prices</h3>
            <p className="text-[11px] text-gray-500">
              Top 30 countries • Avg: <span className="text-primary font-mono">${globalAvg.toFixed(3)}/kWh</span>
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search countries..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-primary/30 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-2">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-2 py-2.5">
                <button onClick={() => toggleSort('rank')} className="flex items-center gap-1 text-[11px] text-gray-500 uppercase tracking-wider font-semibold hover:text-white transition-colors">
                  # <SortIcon col="rank" />
                </button>
              </th>
              <th className="text-left px-2 py-2.5">
                <button onClick={() => toggleSort('name')} className="flex items-center gap-1 text-[11px] text-gray-500 uppercase tracking-wider font-semibold hover:text-white transition-colors">
                  Country <SortIcon col="name" />
                </button>
              </th>
              <th className="text-right px-2 py-2.5">
                <button onClick={() => toggleSort('rate')} className="flex items-center gap-1 text-[11px] text-gray-500 uppercase tracking-wider font-semibold hover:text-white transition-colors ml-auto">
                  $/kWh <SortIcon col="rate" />
                </button>
              </th>
              <th className="text-right px-2 py-2.5 hidden sm:table-cell">
                <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Rate</span>
              </th>
              <th className="text-right px-2 py-2.5 hidden md:table-cell">
                <button onClick={() => toggleSort('region')} className="flex items-center gap-1 text-[11px] text-gray-500 uppercase tracking-wider font-semibold hover:text-white transition-colors ml-auto">
                  Region <SortIcon col="region" />
                </button>
              </th>
              {onSelectCountry && (
                <th className="text-right px-2 py-2.5 w-10"></th>
              )}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {displayed.map((country, i) => (
                <motion.tr
                  key={country.code}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => onSelectCountry?.(country)}
                  className={`border-b border-white/[0.03] transition-colors ${
                    onSelectCountry ? 'cursor-pointer hover:bg-white/[0.03]' : ''
                  } ${selectedCountryCode === country.code ? 'bg-primary/5' : ''}`}
                >
                  <td className="px-2 py-2.5 text-xs text-gray-500 font-mono">{i + 1}</td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{country.flag}</span>
                      <span className="text-sm font-medium text-white">{country.name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <span className={`text-sm font-mono font-semibold ${getRateColor(country.rate)}`}>
                      ${country.rate.toFixed(3)}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-right hidden sm:table-cell">
                    <div className="w-20 h-1.5 rounded-full bg-white/5 ml-auto overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          country.rate < 0.08 ? 'bg-emerald-400' :
                          country.rate < 0.15 ? 'bg-secondary' :
                          country.rate < 0.25 ? 'bg-amber-400' : 'bg-red-400'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${getRateBar(country.rate)}%` }}
                        transition={{ duration: 0.5, delay: i * 0.03 }}
                      />
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-right hidden md:table-cell">
                    <span className="text-xs text-gray-500 px-2 py-0.5 rounded-md bg-white/[0.03]">
                      {country.region}
                    </span>
                  </td>
                  {onSelectCountry && (
                    <td className="px-2 py-2.5 text-right">
                      {selectedCountryCode === country.code && (
                        <CheckCircle2 className="w-4 h-4 text-primary inline" />
                      )}
                    </td>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Show more */}
      {sorted.length > 15 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {showAll ? 'Show Less' : `Show All ${sorted.length} Countries`}
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center gap-4">
        {[
          { color: 'bg-emerald-400', label: '< $0.08' },
          { color: 'bg-sky-400', label: '$0.08–0.15' },
          { color: 'bg-amber-400', label: '$0.15–0.25' },
          { color: 'bg-red-400', label: '> $0.25' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${l.color}`} />
            <span className="text-[10px] text-gray-500">{l.label}/kWh</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
