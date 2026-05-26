import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Globe, ArrowUpDown, ArrowUp, ArrowDown, Search, Info, ExternalLink } from 'lucide-react';
import { countries, DATA_SOURCE } from '../data/countries';

type SortDir = 'asc' | 'desc';
type SortField = 'rank' | 'name' | 'rate' | 'consumption' | 'region';

export default function ElectricityPriceTable() {
  const [sortField, setSortField] = useState<SortField>('rate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  const regions = useMemo(() => {
    const r = new Set(countries.map(c => c.region));
    return ['All', ...Array.from(r).sort()];
  }, []);

  const sortedCountries = useMemo(() => {
    let filtered = [...countries];

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
      );
    }

    // Filter by region
    if (selectedRegion !== 'All') {
      filtered = filtered.filter(c => c.region === selectedRegion);
    }

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'rate':
          cmp = a.rate - b.rate;
          break;
        case 'consumption':
          cmp = a.consumption - b.consumption;
          break;
        case 'region':
          cmp = a.region.localeCompare(b.region);
          break;
        default:
          cmp = a.rate - b.rate;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return filtered;
  }, [sortField, sortDir, search, selectedRegion]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'rate' ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-600" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-primary" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary" />
    );
  };

  // Price bar width calculation
  const maxRate = Math.max(...countries.map(c => c.rate));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Globe className="w-4 h-4 text-emerald-400" />
            </div>
            Global Electricity Prices
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Top 30 nations by residential electricity cost (USD/kWh)
          </p>
        </div>

        {/* Search + Region Filter */}
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-3 py-2 rounded-lg bg-background/80 border border-border/50 text-sm text-white
                         placeholder:text-gray-600 focus:outline-none focus:border-primary/50 w-36 sm:w-44"
            />
          </div>
          <select
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            className="px-3 py-2 rounded-lg bg-background/80 border border-border/50 text-sm text-white
                       focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
          >
            {regions.map(r => (
              <option key={r} value={r} className="bg-surface text-white">
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left py-3 px-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider w-12">
                #
              </th>
              <th
                className="text-left py-3 px-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors"
                onClick={() => handleSort('name')}
              >
                <span className="flex items-center gap-1">
                  Country <SortIcon field="name" />
                </span>
              </th>
              <th
                className="text-right py-3 px-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors"
                onClick={() => handleSort('rate')}
              >
                <span className="flex items-center gap-1 justify-end">
                  USD/kWh <SortIcon field="rate" />
                </span>
              </th>
              <th className="text-right py-3 px-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell w-48">
                Price Bar
              </th>
              <th
                className="text-right py-3 px-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors hidden md:table-cell"
                onClick={() => handleSort('consumption')}
              >
                <span className="flex items-center gap-1 justify-end">
                  TWh/yr <SortIcon field="consumption" />
                </span>
              </th>
              <th
                className="text-right py-3 px-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors hidden lg:table-cell"
                onClick={() => handleSort('region')}
              >
                <span className="flex items-center gap-1 justify-end">
                  Region <SortIcon field="region" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCountries.map((country, idx) => {
              const barWidth = (country.rate / maxRate) * 100;
              const isExpensive = country.rate >= 0.25;
              const isCheap = country.rate <= 0.08;

              return (
                <motion.tr
                  key={country.code}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="border-b border-border/10 hover:bg-surface/30 transition-colors group"
                >
                  <td className="py-3 px-2 text-xs text-gray-500 font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg leading-none">{country.flag}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{country.name}</p>
                        <p className="text-[10px] text-gray-600 font-mono">{country.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className={`text-sm font-mono font-semibold ${
                      isExpensive ? 'text-error' : isCheap ? 'text-success' : 'text-white'
                    }`}>
                      ${country.rate.toFixed(3)}
                    </span>
                  </td>
                  <td className="py-3 px-2 hidden sm:table-cell">
                    <div className="w-full h-2 rounded-full bg-background/60 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.02 }}
                        className={`h-full rounded-full ${
                          isExpensive
                            ? 'bg-gradient-to-r from-error/60 to-error'
                            : isCheap
                            ? 'bg-gradient-to-r from-success/60 to-success'
                            : 'bg-gradient-to-r from-primary/60 to-primary'
                        }`}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right hidden md:table-cell">
                    <span className="text-xs font-mono text-gray-400">
                      {country.consumption.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right hidden lg:table-cell">
                    <span className="text-[10px] text-gray-500 bg-surface/60 px-2 py-0.5 rounded-full">
                      {country.region}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedCountries.length === 0 && (
        <div className="text-center py-8">
          <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No countries match your search</p>
        </div>
      )}

      {/* Footer / Citation */}
      <div className="mt-4 pt-4 border-t border-border/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-start gap-1.5 text-[10px] text-gray-600">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <p>
            Data: {DATA_SOURCE.name} • Last updated: {DATA_SOURCE.lastUpdated}
          </p>
        </div>
        <a
          href={DATA_SOURCE.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
        >
          View Source <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </motion.div>
  );
}
