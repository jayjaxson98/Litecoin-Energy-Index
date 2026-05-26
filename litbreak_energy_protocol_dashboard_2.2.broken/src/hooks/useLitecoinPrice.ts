import { useState, useEffect } from 'react';
import { generateChartData } from '../lib/mockData';
import type { ChartDataPoint } from '../types';

export function useLitecoinPrice() {
  const [price, setPrice] = useState(85.42);
  const [priceChange24h, setPriceChange24h] = useState(2.34);
  const [priceHistory, setPriceHistory] = useState<ChartDataPoint[]>(generateChartData(30, 85, 0.03));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrice(prev => {
        const change = (Math.random() - 0.5) * 0.5;
        return parseFloat((prev + change).toFixed(2));
      });
      setPriceChange24h((Math.random() - 0.4) * 8);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return { price, priceChange24h, priceHistory, isLoading };
}
