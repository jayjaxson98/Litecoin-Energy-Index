export interface CountryData {
  code: string;
  name: string;
  flag: string;
  rate: number; // USD/kWh residential electricity price
  consumption: number; // TWh annual consumption (for weighting)
  region: string;
}

// Top 30 countries by electricity consumption with residential rates
export const countries: CountryData[] = [
  { code: 'CHN', name: 'China', flag: '🇨🇳', rate: 0.082, consumption: 7538, region: 'Asia-Pacific' },
  { code: 'USA', name: 'United States', flag: '🇺🇸', rate: 0.159, consumption: 3902, region: 'Americas' },
  { code: 'IND', name: 'India', flag: '🇮🇳', rate: 0.080, consumption: 1490, region: 'Asia-Pacific' },
  { code: 'RUS', name: 'Russia', flag: '🇷🇺', rate: 0.071, consumption: 1023, region: 'Europe' },
  { code: 'JPN', name: 'Japan', flag: '🇯🇵', rate: 0.256, consumption: 936, region: 'Asia-Pacific' },
  { code: 'BRA', name: 'Brazil', flag: '🇧🇷', rate: 0.141, consumption: 605, region: 'Americas' },
  { code: 'KOR', name: 'South Korea', flag: '🇰🇷', rate: 0.114, consumption: 577, region: 'Asia-Pacific' },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦', rate: 0.117, consumption: 564, region: 'Americas' },
  { code: 'DEU', name: 'Germany', flag: '🇩🇪', rate: 0.374, consumption: 536, region: 'Europe' },
  { code: 'SAU', name: 'Saudi Arabia', flag: '🇸🇦', rate: 0.051, consumption: 353, region: 'Middle East' },
  { code: 'FRA', name: 'France', flag: '🇫🇷', rate: 0.206, consumption: 450, region: 'Europe' },
  { code: 'GBR', name: 'United Kingdom', flag: '🇬🇧', rate: 0.287, consumption: 314, region: 'Europe' },
  { code: 'ITA', name: 'Italy', flag: '🇮🇹', rate: 0.303, consumption: 298, region: 'Europe' },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺', rate: 0.254, consumption: 263, region: 'Asia-Pacific' },
  { code: 'MEX', name: 'Mexico', flag: '🇲🇽', rate: 0.096, consumption: 310, region: 'Americas' },
  { code: 'TUR', name: 'Turkey', flag: '🇹🇷', rate: 0.103, consumption: 308, region: 'Europe' },
  { code: 'IDN', name: 'Indonesia', flag: '🇮🇩', rate: 0.094, consumption: 285, region: 'Asia-Pacific' },
  { code: 'ESP', name: 'Spain', flag: '🇪🇸', rate: 0.265, consumption: 253, region: 'Europe' },
  { code: 'THA', name: 'Thailand', flag: '🇹🇭', rate: 0.107, consumption: 202, region: 'Asia-Pacific' },
  { code: 'ZAF', name: 'South Africa', flag: '🇿🇦', rate: 0.116, consumption: 215, region: 'Africa' },
  { code: 'SWE', name: 'Sweden', flag: '🇸🇪', rate: 0.195, consumption: 139, region: 'Europe' },
  { code: 'POL', name: 'Poland', flag: '🇵🇱', rate: 0.188, consumption: 170, region: 'Europe' },
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷', rate: 0.076, consumption: 149, region: 'Americas' },
  { code: 'NOR', name: 'Norway', flag: '🇳🇴', rate: 0.128, consumption: 131, region: 'Europe' },
  { code: 'EGY', name: 'Egypt', flag: '🇪🇬', rate: 0.042, consumption: 201, region: 'Africa' },
  { code: 'VNM', name: 'Vietnam', flag: '🇻🇳', rate: 0.092, consumption: 228, region: 'Asia-Pacific' },
  { code: 'ARE', name: 'UAE', flag: '🇦🇪', rate: 0.078, consumption: 159, region: 'Middle East' },
  { code: 'COL', name: 'Colombia', flag: '🇨🇴', rate: 0.104, consumption: 80, region: 'Americas' },
  { code: 'CHL', name: 'Chile', flag: '🇨🇱', rate: 0.168, consumption: 82, region: 'Americas' },
  { code: 'MYS', name: 'Malaysia', flag: '🇲🇾', rate: 0.089, consumption: 167, region: 'Asia-Pacific' },
];

// Historical simulated data for charts
export function generateHistoricalIndex(hours: number = 24): { time: string; index: number; factor: number }[] {
  const data: { time: string; index: number; factor: number }[] = [];
  const baseIndex = 0.148;
  const baseFactor = 1.32;
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const noise = (Math.random() - 0.5) * 0.02;
    const trend = Math.sin(i / 6) * 0.01;
    data.push({
      time: timeStr,
      index: parseFloat((baseIndex + noise + trend).toFixed(4)),
      factor: parseFloat((baseFactor + (noise * 5) + (trend * 3)).toFixed(4)),
    });
  }

  return data;
}

// Simulated LTC mining efficiency data
export const ltcMiningData = {
  currentEfficiency: 0.1123,
  networkHashrate: 923,
  blockReward: 12.5,
  blockTime: 150,
  difficulty: 76_432_198,
  energyPerLTC: 0.1123,
};

// Simulated protocol stats
export const protocolStats = {
  totalPowerMinted: 47_832_156,
  hardCap: 84_000_000,
  wLTCReserve: 478_321,
  currentRatio: 102.37,
  energyFactor: 1.3217,
  globalIndex: 0.1483,
  totalHolders: 12847,
  totalTransactions: 89432,
  mintFeeBps: 50,
  redeemFeeBps: 100,
  lastUpdateTime: Date.now(),
};
