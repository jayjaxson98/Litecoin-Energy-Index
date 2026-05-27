export interface CountryEnergy {
  code: string;
  name: string;
  flag: string;
  electricityRate: number; // USD cents per kWh
  rank: number;
  category: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  region: string;
}

export const energyData: CountryEnergy[] = [
  { code: 'IRN', name: 'Iran', flag: '🇮🇷', electricityRate: 0.5, rank: 1, category: 'very-low', region: 'Middle East' },
  { code: 'LBY', name: 'Libya', flag: '🇱🇾', electricityRate: 1.2, rank: 2, category: 'very-low', region: 'Africa' },
  { code: 'SDN', name: 'Sudan', flag: '🇸🇩', electricityRate: 1.5, rank: 3, category: 'very-low', region: 'Africa' },
  { code: 'ETH', name: 'Ethiopia', flag: '🇪🇹', electricityRate: 1.8, rank: 4, category: 'very-low', region: 'Africa' },
  { code: 'KWT', name: 'Kuwait', flag: '🇰🇼', electricityRate: 2.1, rank: 5, category: 'very-low', region: 'Middle East' },
  { code: 'QAT', name: 'Qatar', flag: '🇶🇦', electricityRate: 2.6, rank: 6, category: 'very-low', region: 'Middle East' },
  { code: 'SAU', name: 'Saudi Arabia', flag: '🇸🇦', electricityRate: 3.2, rank: 7, category: 'low', region: 'Middle East' },
  { code: 'RUS', name: 'Russia', flag: '🇷🇺', electricityRate: 3.9, rank: 8, category: 'low', region: 'Europe' },
  { code: 'KAZ', name: 'Kazakhstan', flag: '🇰🇿', electricityRate: 4.1, rank: 9, category: 'low', region: 'Central Asia' },
  { code: 'ARE', name: 'UAE', flag: '🇦🇪', electricityRate: 4.5, rank: 10, category: 'low', region: 'Middle East' },
  { code: 'MYS', name: 'Malaysia', flag: '🇲🇾', electricityRate: 5.3, rank: 11, category: 'low', region: 'Southeast Asia' },
  { code: 'CHN', name: 'China', flag: '🇨🇳', electricityRate: 6.2, rank: 12, category: 'low', region: 'East Asia' },
  { code: 'IND', name: 'India', flag: '🇮🇳', electricityRate: 6.8, rank: 13, category: 'medium', region: 'South Asia' },
  { code: 'IDN', name: 'Indonesia', flag: '🇮🇩', electricityRate: 7.5, rank: 14, category: 'medium', region: 'Southeast Asia' },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦', electricityRate: 8.4, rank: 15, category: 'medium', region: 'North America' },
  { code: 'USA', name: 'United States', flag: '🇺🇸', electricityRate: 12.5, rank: 16, category: 'medium', region: 'North America' },
  { code: 'TUR', name: 'Turkey', flag: '🇹🇷', electricityRate: 13.2, rank: 17, category: 'medium', region: 'Europe' },
  { code: 'BRA', name: 'Brazil', flag: '🇧🇷', electricityRate: 14.8, rank: 18, category: 'medium', region: 'South America' },
  { code: 'KOR', name: 'South Korea', flag: '🇰🇷', electricityRate: 15.1, rank: 19, category: 'high', region: 'East Asia' },
  { code: 'FRA', name: 'France', flag: '🇫🇷', electricityRate: 18.5, rank: 20, category: 'high', region: 'Europe' },
  { code: 'JPN', name: 'Japan', flag: '🇯🇵', electricityRate: 21.3, rank: 21, category: 'high', region: 'East Asia' },
  { code: 'GBR', name: 'United Kingdom', flag: '🇬🇧', electricityRate: 24.7, rank: 22, category: 'high', region: 'Europe' },
  { code: 'ESP', name: 'Spain', flag: '🇪🇸', electricityRate: 26.1, rank: 23, category: 'high', region: 'Europe' },
  { code: 'ITA', name: 'Italy', flag: '🇮🇹', electricityRate: 28.4, rank: 24, category: 'high', region: 'Europe' },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺', electricityRate: 29.2, rank: 25, category: 'very-high', region: 'Oceania' },
  { code: 'NLD', name: 'Netherlands', flag: '🇳🇱', electricityRate: 31.5, rank: 26, category: 'very-high', region: 'Europe' },
  { code: 'BEL', name: 'Belgium', flag: '🇧🇪', electricityRate: 33.8, rank: 27, category: 'very-high', region: 'Europe' },
  { code: 'IRL', name: 'Ireland', flag: '🇮🇪', electricityRate: 36.2, rank: 28, category: 'very-high', region: 'Europe' },
  { code: 'DNK', name: 'Denmark', flag: '🇩🇰', electricityRate: 39.5, rank: 29, category: 'very-high', region: 'Europe' },
  { code: 'DEU', name: 'Germany', flag: '🇩🇪', electricityRate: 42.1, rank: 30, category: 'very-high', region: 'Europe' },
];

export const getCategoryColor = (category: CountryEnergy['category']): string => {
  switch (category) {
    case 'very-low': return '#10b981';
    case 'low': return '#34d399';
    case 'medium': return '#f59e0b';
    case 'high': return '#f97316';
    case 'very-high': return '#ef4444';
  }
};

export const getCategoryLabel = (category: CountryEnergy['category']): string => {
  switch (category) {
    case 'very-low': return 'Very Low';
    case 'low': return 'Low';
    case 'medium': return 'Medium';
    case 'high': return 'High';
    case 'very-high': return 'Very High';
  }
};

export const globalAverageRate = 15.0; // USD cents per kWh

// Mock LTC price history (30 days)
export const ltcPriceHistory = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const basePrice = 85;
  const variation = Math.sin(i * 0.3) * 12 + Math.cos(i * 0.15) * 8 + (Math.random() - 0.5) * 6;
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: Math.max(65, Math.round((basePrice + variation) * 100) / 100),
    volume: Math.round((500 + Math.random() * 800) * 100) / 100,
  };
});
