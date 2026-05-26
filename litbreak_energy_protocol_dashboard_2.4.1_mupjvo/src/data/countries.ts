import type { CountryData } from '../types';

/**
 * Top 30 countries by residential electricity price (USD per kWh, 2024/2025)
 * Sources: GlobalPetrolPrices, IEA, World Bank, Statista
 * Last updated: January 2025
 */
export const countries: CountryData[] = [
  { code: 'DEU', name: 'Germany', flag: '🇩🇪', rate: 0.374, consumption: 536, region: 'Europe' },
  { code: 'ITA', name: 'Italy', flag: '🇮🇹', rate: 0.303, consumption: 298, region: 'Europe' },
  { code: 'GBR', name: 'United Kingdom', flag: '🇬🇧', rate: 0.287, consumption: 314, region: 'Europe' },
  { code: 'ESP', name: 'Spain', flag: '🇪🇸', rate: 0.265, consumption: 253, region: 'Europe' },
  { code: 'JPN', name: 'Japan', flag: '🇯🇵', rate: 0.256, consumption: 936, region: 'Asia-Pacific' },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺', rate: 0.254, consumption: 263, region: 'Asia-Pacific' },
  { code: 'FRA', name: 'France', flag: '🇫🇷', rate: 0.206, consumption: 450, region: 'Europe' },
  { code: 'SWE', name: 'Sweden', flag: '🇸🇪', rate: 0.195, consumption: 139, region: 'Europe' },
  { code: 'POL', name: 'Poland', flag: '🇵🇱', rate: 0.188, consumption: 170, region: 'Europe' },
  { code: 'CHL', name: 'Chile', flag: '🇨🇱', rate: 0.168, consumption: 82, region: 'Americas' },
  { code: 'USA', name: 'United States', flag: '🇺🇸', rate: 0.159, consumption: 3902, region: 'Americas' },
  { code: 'BRA', name: 'Brazil', flag: '🇧🇷', rate: 0.141, consumption: 605, region: 'Americas' },
  { code: 'NOR', name: 'Norway', flag: '🇳🇴', rate: 0.128, consumption: 131, region: 'Europe' },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦', rate: 0.117, consumption: 564, region: 'Americas' },
  { code: 'ZAF', name: 'South Africa', flag: '🇿🇦', rate: 0.116, consumption: 215, region: 'Africa' },
  { code: 'KOR', name: 'South Korea', flag: '🇰🇷', rate: 0.114, consumption: 577, region: 'Asia-Pacific' },
  { code: 'THA', name: 'Thailand', flag: '🇹🇭', rate: 0.107, consumption: 202, region: 'Asia-Pacific' },
  { code: 'COL', name: 'Colombia', flag: '🇨🇴', rate: 0.104, consumption: 80, region: 'Americas' },
  { code: 'TUR', name: 'Turkey', flag: '🇹🇷', rate: 0.103, consumption: 308, region: 'Europe' },
  { code: 'MEX', name: 'Mexico', flag: '🇲🇽', rate: 0.096, consumption: 310, region: 'Americas' },
  { code: 'IDN', name: 'Indonesia', flag: '🇮🇩', rate: 0.094, consumption: 285, region: 'Asia-Pacific' },
  { code: 'VNM', name: 'Vietnam', flag: '🇻🇳', rate: 0.092, consumption: 228, region: 'Asia-Pacific' },
  { code: 'MYS', name: 'Malaysia', flag: '🇲🇾', rate: 0.089, consumption: 167, region: 'Asia-Pacific' },
  { code: 'CHN', name: 'China', flag: '🇨🇳', rate: 0.082, consumption: 7538, region: 'Asia-Pacific' },
  { code: 'IND', name: 'India', flag: '🇮🇳', rate: 0.080, consumption: 1490, region: 'Asia-Pacific' },
  { code: 'ARE', name: 'UAE', flag: '🇦🇪', rate: 0.078, consumption: 159, region: 'Middle East' },
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷', rate: 0.076, consumption: 149, region: 'Americas' },
  { code: 'RUS', name: 'Russia', flag: '🇷🇺', rate: 0.071, consumption: 1023, region: 'Europe' },
  { code: 'SAU', name: 'Saudi Arabia', flag: '🇸🇦', rate: 0.051, consumption: 353, region: 'Middle East' },
  { code: 'EGY', name: 'Egypt', flag: '🇪🇬', rate: 0.042, consumption: 201, region: 'Africa' },
];

/**
 * Compute consumption-weighted global average energy price
 */
export function computeWeightedAverage(): number {
  const totalConsumption = countries.reduce((sum, c) => sum + c.consumption, 0);
  const weightedSum = countries.reduce((sum, c) => sum + c.rate * c.consumption, 0);
  return weightedSum / totalConsumption;
}

/**
 * Data source metadata for citation
 */
export const DATA_SOURCE = {
  name: 'GlobalPetrolPrices, IEA, World Bank',
  lastUpdated: 'January 2025',
  url: 'https://www.globalpetrolprices.com/electricity_prices/',
};
