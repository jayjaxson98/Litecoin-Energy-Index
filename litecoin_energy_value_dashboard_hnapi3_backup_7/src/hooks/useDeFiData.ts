import { useState, useEffect, useCallback } from 'react';
import type { TimeRange, PricePoint, EnergyIndex } from '../types/utx';

function generatePriceHistory(range: TimeRange): PricePoint[] {
  const points: Record<TimeRange, number> = {
    '1H': 60, '4H': 96, '24H': 144, '7D': 168, '30D': 180, '90D': 180,
  };
  const count = points[range];
  const now = Date.now();
  const intervalMs: Record<TimeRange, number> = {
    '1H': 60_000, '4H': 150_000, '24H': 600_000,
    '7D': 3_600_000, '30D': 14_400_000, '90D': 43_200_000,
  };
  const interval = intervalMs[range];
  let price = 82 + Math.random() * 10;
  return Array.from({ length: count }, (_, i) => {
    price = price + (Math.random() - 0.48) * 1.5;
    price = Math.max(60, Math.min(120, price));
    return { time: now - (count - i) * interval, price: parseFloat(price.toFixed(2)), volume: Math.random() * 1_000_000 };
  });
}

function generateEnergyIndex(): EnergyIndex {
  return {
    value: 72 + Math.random() * 20,
    change24h: (Math.random() - 0.4) * 5,
    changePercent: (Math.random() - 0.4) * 3,
    hashRate: 500 + Math.random() * 200,
    difficulty: 18_000_000 + Math.random() * 2_000_000,
    blockReward: 6.25,
    networkFee: 0.001 + Math.random() * 0.002,
    energyCost: 0.08 + Math.random() * 0.04,
  };
}

export function useDeFiData(range: TimeRange) {
  const [ltcPrice, setLtcPrice] = useState(82.45);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [energyIndex, setEnergyIndex] = useState<EnergyIndex>(generateEnergyIndex());
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setPriceHistory(generatePriceHistory(range));
      setLtcPrice(parseFloat((80 + Math.random() * 10).toFixed(2)));
      setEnergyIndex(generateEnergyIndex());
      setIsLoading(false);
    }, 600);
  }, [range]);

  useEffect(() => { refetch(); }, [refetch]);

  return { ltcPrice, priceHistory, isLoading, energyIndex, refetch };
}
