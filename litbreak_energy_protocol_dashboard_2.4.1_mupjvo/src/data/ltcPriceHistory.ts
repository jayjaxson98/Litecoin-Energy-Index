import type { PricePoint } from '@/types';

/**
 * Generate realistic LTC price history data
 */
function generatePriceHistory(days: number, basePrice: number): PricePoint[] {
  const points: PricePoint[] = [];
  const now = Date.now();
  const msPerDay = 86400000;
  const pointsPerDay = days <= 1 ? 24 : days <= 7 ? 4 : 1;
  const totalPoints = days * pointsPerDay;
  const msPerPoint = (days * msPerDay) / totalPoints;
  let price = basePrice * (0.85 + Math.random() * 0.15);

  for (let i = totalPoints; i >= 0; i--) {
    const timestamp = now - i * msPerPoint;
    const volatility = basePrice * 0.03;
    const change = (Math.random() - 0.48) * volatility;
    const trend = Math.sin(i / (totalPoints * 0.3)) * basePrice * 0.05;
    price = Math.max(price + change + trend * 0.01, basePrice * 0.4);
    price = Math.min(price, basePrice * 1.8);
    const volume = 50_000_000 + Math.random() * 300_000_000;
    points.push({
      timestamp,
      price: parseFloat(price.toFixed(2)),
      volume: parseFloat(volume.toFixed(0)),
    });
  }

  return points;
}

export const ltcPriceHistory1d = generatePriceHistory(1, 95);
export const ltcPriceHistory7d = generatePriceHistory(7, 95);
export const ltcPriceHistory30d = generatePriceHistory(30, 95);
export const ltcPriceHistory90d = generatePriceHistory(90, 95);
export const ltcPriceHistory365d = generatePriceHistory(365, 95);

export function getHistoryForTimeframe(tf: string): PricePoint[] {
  switch (tf) {
    case '24H': return ltcPriceHistory1d;
    case '7D': return ltcPriceHistory7d;
    case '30D': return ltcPriceHistory30d;
    case '90D': return ltcPriceHistory90d;
    case '1Y': return ltcPriceHistory365d;
    case 'ALL': return ltcPriceHistory365d;
    default: return ltcPriceHistory30d;
  }
}

export function getLatestPrice(): number {
  const h = ltcPriceHistory1d;
  return h[h.length - 1]?.price ?? 95;
}

export function get24hChange(): { absolute: number; percent: number } {
  const h = ltcPriceHistory1d;
  if (h.length < 2) return { absolute: 0, percent: 0 };
  const current = h[h.length - 1].price;
  const open = h[0].price;
  return {
    absolute: current - open,
    percent: ((current - open) / open) * 100,
  };
}
