import { motion } from 'framer-motion';
import { Globe, TrendingUp, TrendingDown } from 'lucide-react';

const countries = [
  { name: 'United States', code: 'US', rate: 0.168, change: 2.1, flag: '🇺🇸' },
  { name: 'Germany', code: 'DE', rate: 0.387, change: -1.3, flag: '🇩🇪' },
  { name: 'Japan', code: 'JP', rate: 0.214, change: 0.8, flag: '🇯🇵' },
  { name: 'Australia', code: 'AU', rate: 0.298, change: 3.2, flag: '🇦🇺' },
  { name: 'Brazil', code: 'BR', rate: 0.142, change: -0.5, flag: '🇧🇷' },
  { name: 'United Kingdom', code: 'GB', rate: 0.342, change: 1.7, flag: '🇬🇧' },
  { name: 'Canada', code: 'CA', rate: 0.128, change: -2.1, flag: '🇨🇦' },
  { name: 'South Korea', code: 'KR', rate: 0.112, change: 0.4, flag: '🇰🇷' },
];

export function CountryRates() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-cyan-400 flex items-center justify-center">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Country Energy Rates</h3>
          <p className="text-[10px] text-textSecondary">$/kWh · Updated hourly</p>
        </div>
      </div>

      <div className="space-y-1">
        {countries.map((country, i) => (
          <motion.div
            key={country.code}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.05 }}
            className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">{country.flag}</span>
              <div>
                <p className="text-xs font-medium text-white">{country.name}</p>
                <p className="text-[10px] text-textSecondary">{country.code}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-white">${country.rate.toFixed(3)}</p>
              <div className={`flex items-center gap-0.5 justify-end ${
                country.change >= 0 ? 'text-success' : 'text-error'
              }`}>
                {country.change >= 0 ? (
                  <TrendingUp className="w-2.5 h-2.5" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5" />
                )}
                <span className="text-[10px] font-medium">
                  {country.change >= 0 ? '+' : ''}{country.change}%
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
