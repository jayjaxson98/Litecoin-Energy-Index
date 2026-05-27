import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowUpDown, Globe, TrendingDown, TrendingUp, RefreshCw, Search } from 'lucide-react';
import { useEnergyIndex } from '../hooks/useEnergyIndex';
import { getCategoryColor, getCategoryLabel, type CountryEnergy } from '../data/energyData';
import { formatNumber } from '../utils/format';

const EnergyIndexView: React.FC = () => {
  const { globalIndex, energyFactor, countries, lastUpdated, loading, sortField, sortDirection, sortCountries, refreshIndex } = useEnergyIndex();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCountries = countries.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'very-low', 'low', 'medium', 'high', 'very-high'];

  const SortIcon = ({ field }: { field: keyof CountryEnergy }) => (
    <ArrowUpDown className={`w-3 h-3 inline ml-1 transition-colors ${sortField === field ? 'text-primary' : 'text-white/20'}`} />
  );

  return (
    <div className="space-y-6">
      {/* Global Energy Index Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl neon-border p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(158, 127, 255, 0.05) 50%, rgba(56, 189, 248, 0.08) 100%)',
        }}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#10b981" strokeWidth="0.5" strokeDasharray="5 5">
              <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="30s" repeatCount="indefinite" />
            </circle>
            <circle cx="100" cy="100" r="60" fill="none" stroke="#9E7FFF" strokeWidth="0.5" strokeDasharray="3 7">
              <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="20s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-energy/20 energy-glow">
                <Globe className="w-6 h-6 text-energy" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Global Energy Index</h2>
                <p className="text-xs text-white/50">Real-time electricity cost aggregation</p>
              </div>
            </div>
            <p className="text-sm text-white/60 max-w-lg">
              The Global Energy Index tracks electricity prices across 30 countries to dynamically adjust LBT minting rates. 
              Lower energy costs increase the Energy Efficiency Factor, making minting more favorable.
            </p>
          </div>

          <div className="flex gap-4">
            {/* Global Index */}
            <div className="text-center p-5 rounded-xl glass neon-border min-w-[140px]">
              <div className="text-xs text-white/50 mb-1 uppercase tracking-wider">Index Value</div>
              {loading ? (
                <div className="h-10 w-20 mx-auto rounded bg-white/10 animate-pulse" />
              ) : (
                <div className="text-3xl font-bold text-energy font-mono">
                  {formatNumber(globalIndex, 1)}
                </div>
              )}
              <div className="text-xs text-white/40 mt-1">¢/kWh weighted avg</div>
            </div>

            {/* Energy Factor */}
            <div className="text-center p-5 rounded-xl glass neon-border min-w-[140px]">
              <div className="text-xs text-white/50 mb-1 uppercase tracking-wider">Efficiency Factor</div>
              {loading ? (
                <div className="h-10 w-20 mx-auto rounded bg-white/10 animate-pulse" />
              ) : (
                <div className="text-3xl font-bold text-primary font-mono">
                  {formatNumber(energyFactor, 2)}x
                </div>
              )}
              <div className="flex items-center justify-center gap-1 text-xs mt-1">
                {energyFactor >= 1 ? (
                  <><TrendingUp className="w-3 h-3 text-success" /><span className="text-success">Favorable</span></>
                ) : (
                  <><TrendingDown className="w-3 h-3 text-warning" /><span className="text-warning">Reduced</span></>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <span className="text-xs text-white/30">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={refreshIndex}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search countries..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass border border-white/10 focus:border-primary/50 outline-none text-sm text-white placeholder-white/30 transition-colors"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'glass border border-white/5 text-white/50 hover:text-white/80 hover:border-white/15'
              }`}
            >
              {cat === 'all' ? 'All' : getCategoryLabel(cat as any)}
            </button>
          ))}
        </div>
      </div>

      {/* Country Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl neon-border overflow-hidden"
        style={{ background: 'rgba(18, 18, 26, 0.8)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th
                  onClick={() => sortCountries('rank')}
                  className="text-left px-5 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors"
                >
                  Rank <SortIcon field="rank" />
                </th>
                <th
                  onClick={() => sortCountries('name')}
                  className="text-left px-5 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors"
                >
                  Country <SortIcon field="name" />
                </th>
                <th
                  onClick={() => sortCountries('electricityRate')}
                  className="text-right px-5 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors"
                >
                  Rate (¢/kWh) <SortIcon field="electricityRate" />
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Cost Level
                </th>
                <th
                  onClick={() => sortCountries('region')}
                  className="text-left px-5 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors hidden lg:table-cell"
                >
                  Region <SortIcon field="region" />
                </th>
                <th className="text-right px-5 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Mint Factor
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCountries.map((country, idx) => {
                const mintFactor = Math.min(5.0, Math.max(0.1, 15 / country.electricityRate));
                const catColor = getCategoryColor(country.category);
                return (
                  <motion.tr
                    key={country.code}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-mono font-semibold text-white/70 group-hover:text-white transition-colors">
                        #{country.rank}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{country.flag}</span>
                        <div>
                          <div className="text-sm font-medium text-white group-hover:text-white transition-colors">
                            {country.name}
                          </div>
                          <div className="text-xs font-mono text-white/30">{country.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-mono font-semibold" style={{ color: catColor }}>
                        {formatNumber(country.electricityRate, 1)}¢
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${catColor}15`,
                          color: catColor,
                          border: `1px solid ${catColor}30`,
                        }}
                      >
                        <Zap className="w-3 h-3" />
                        {getCategoryLabel(country.category)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-white/40">{country.region}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, (mintFactor / 5) * 100)}%`,
                              background: `linear-gradient(90deg, ${catColor}, #9E7FFF)`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-mono font-semibold text-primary">
                          {formatNumber(mintFactor, 2)}x
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCountries.length === 0 && (
          <div className="text-center py-12 text-white/30 text-sm">
            No countries match your search criteria
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EnergyIndexView;
