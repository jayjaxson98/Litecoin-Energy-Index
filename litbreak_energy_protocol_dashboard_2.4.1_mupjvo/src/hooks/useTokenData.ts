import { useState, useEffect, useCallback } from 'react';
import type { TokenData, StatsData, ChartDataPoint } from '@/types';

const INITIAL_TOKEN_DATA: TokenData = {
  name: 'Litbreak Token',
  symbol: 'LITB',
  totalSupply: '4250000',
  energyPrice: '142000',
  exchangeRate: '125',
  feeBps: 30,
  isPaused: false,
  hardCap: '21000000',
};

function generateChartData(points: number): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let price = 1.42;
  const now = Date.now();
  for (let i = points; i >= 0; i--) {
    price += (Math.random() - 0.48) * 0.03;
    price = Math.max(0.8, Math.min(2.5, price));
    const time = new Date(now - i * 3600000);
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: parseFloat(price.toFixed(4)),
      volume: Math.floor(Math.random() * 50000 + 10000),
    });
  }
  return data;
}

export function useTokenData() {
  const [tokenData, setTokenData] = useState<TokenData>(INITIAL_TOKEN_DATA);
  const [stats, setStats] = useState<StatsData>({
    totalValueLocked: '6,037,500',
    totalMinted: '4,250,000',
    totalRedeemed: '1,125,000',
    currentPrice: '1.42',
    priceChange24h: 3.7,
    holders: 1847,
    transactions: 23456,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>(() => generateChartData(24));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Simulate live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => {
        const last = prev[prev.length - 1];
        const newPrice = last.price + (Math.random() - 0.48) * 0.02;
        const clampedPrice = Math.max(0.8, Math.min(2.5, newPrice));
        const newPoint: ChartDataPoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: parseFloat(clampedPrice.toFixed(4)),
          volume: Math.floor(Math.random() * 50000 + 10000),
        };
        return [...prev.slice(1), newPoint];
      });

      setStats(prev => {
        const change = prev.priceChange24h + (Math.random() - 0.5) * 0.3;
        return {
          ...prev,
          priceChange24h: parseFloat(change.toFixed(2)),
          transactions: prev.transactions + Math.floor(Math.random() * 3),
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const refreshData = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setChartData(generateChartData(24));
      setIsLoading(false);
    }, 800);
  }, []);

  return { tokenData, stats, chartData, isLoading, refreshData };
}
