import { useQuery } from '@tanstack/react-query';
import type { CountryRate, EnergyIndexData } from '../types/utx';

const MOCK_COUNTRIES: CountryRate[] = [
  { code: 'US', name: 'United States', rate: 0.1650, currency: 'USD', change24h: -0.8, region: 'North America' },
  { code: 'CN', name: 'China', rate: 0.0830, currency: 'USD', change24h: 1.2, region: 'Asia' },
  { code: 'DE', name: 'Germany', rate: 0.3920, currency: 'USD', change24h: -0.3, region: 'Europe' },
  { code: 'JP', name: 'Japan', rate: 0.2640, currency: 'USD', change24h: 0.5, region: 'Asia' },
  { code: 'KR', name: 'South Korea', rate: 0.1120, currency: 'USD', change24h: -1.1, region: 'Asia' },
  { code: 'RU', name: 'Russia', rate: 0.0540, currency: 'USD', change24h: 2.3, region: 'Europe' },
  { code: 'CA', name: 'Canada', rate: 0.1280, currency: 'USD', change24h: -0.2, region: 'North America' },
  { code: 'AU', name: 'Australia', rate: 0.2870, currency: 'USD', change24h: 0.7, region: 'Oceania' },
  { code: 'BR', name: 'Brazil', rate: 0.1430, currency: 'USD', change24h: -1.5, region: 'South America' },
  { code: 'IN', name: 'India', rate: 0.0850, currency: 'USD', change24h: 0.9, region: 'Asia' },
  { code: 'GB', name: 'United Kingdom', rate: 0.3380, currency: 'USD', change24h: -0.6, region: 'Europe' },
  { code: 'FR', name: 'France', rate: 0.2290, currency: 'USD', change24h: 0.4, region: 'Europe' },
  { code: 'IT', name: 'Italy', rate: 0.3150, currency: 'USD', change24h: -0.1, region: 'Europe' },
  { code: 'ES', name: 'Spain', rate: 0.2780, currency: 'USD', change24h: 1.8, region: 'Europe' },
  { code: 'SE', name: 'Sweden', rate: 0.1890, currency: 'USD', change24h: -2.1, region: 'Europe' },
  { code: 'NO', name: 'Norway', rate: 0.1120, currency: 'USD', change24h: 0.3, region: 'Europe' },
  { code: 'KZ', name: 'Kazakhstan', rate: 0.0420, currency: 'USD', change24h: 1.4, region: 'Asia' },
  { code: 'PY', name: 'Paraguay', rate: 0.0380, currency: 'USD', change24h: -0.5, region: 'South America' },
  { code: 'IS', name: 'Iceland', rate: 0.0950, currency: 'USD', change24h: 0.1, region: 'Europe' },
  { code: 'GE', name: 'Georgia', rate: 0.0680, currency: 'USD', change24h: -0.7, region: 'Asia' },
  { code: 'AE', name: 'UAE', rate: 0.0810, currency: 'USD', change24h: 0.2, region: 'Middle East' },
  { code: 'SG', name: 'Singapore', rate: 0.2340, currency: 'USD', change24h: -0.4, region: 'Asia' },
  { code: 'MY', name: 'Malaysia', rate: 0.0690, currency: 'USD', change24h: 1.0, region: 'Asia' },
  { code: 'TH', name: 'Thailand', rate: 0.1180, currency: 'USD', change24h: -0.9, region: 'Asia' },
  { code: 'AR', name: 'Argentina', rate: 0.0520, currency: 'USD', change24h: 3.2, region: 'South America' },
  { code: 'CL', name: 'Chile', rate: 0.1560, currency: 'USD', change24h: -0.3, region: 'South America' },
  { code: 'ZA', name: 'South Africa', rate: 0.1340, currency: 'USD', change24h: 0.8, region: 'Africa' },
  { code: 'NG', name: 'Nigeria', rate: 0.0780, currency: 'USD', change24h: -1.2, region: 'Africa' },
  { code: 'EG', name: 'Egypt', rate: 0.0430, currency: 'USD', change24h: 0.6, region: 'Africa' },
  { code: 'PK', name: 'Pakistan', rate: 0.0910, currency: 'USD', change24h: -0.4, region: 'Asia' },
];

function generateHistoricalData(): { timestamp: number; value: number }[] {
  const data: { timestamp: number; value: number }[] = [];
  const now = Date.now();
  let value = 0.145;

  for (let i = 168; i >= 0; i--) {
    const timestamp = now - i * 3600000;
    value += (Math.random() - 0.5) * 0.003;
    value = Math.max(0.08, Math.min(0.25, value));
    data.push({ timestamp, value: parseFloat(value.toFixed(6)) });
  }

  return data;
}

async function fetchEnergyIndex(): Promise<EnergyIndexData> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));

  const countries = MOCK_COUNTRIES.map(c => ({
    ...c,
    rate: c.rate * (1 + (Math.random() - 0.5) * 0.02),
    change24h: c.change24h + (Math.random() - 0.5) * 0.5,
  }));

  const avgRate = countries.reduce((sum, c) => sum + c.rate, 0) / countries.length;
  const previousIndex = avgRate * (1 + (Math.random() - 0.5) * 0.01);

  return {
    globalIndex: avgRate,
    previousIndex,
    change24h: ((avgRate - previousIndex) / previousIndex) * 100,
    lastUpdate: Date.now(),
    countries,
    historicalData: generateHistoricalData(),
  };
}

export function useEnergyIndex() {
  return useQuery<EnergyIndexData>({
    queryKey: ['energyIndex'],
    queryFn: fetchEnergyIndex,
    refetchInterval: 30000,
    staleTime: 15000,
  });
}
