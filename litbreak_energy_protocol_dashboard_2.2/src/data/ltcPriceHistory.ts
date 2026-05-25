/**
 * Mock LTC price history data for charts.
 * In production, this would come from a CoinGecko/CryptoCompare API.
 */

export interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
}

function generatePriceHistory(days: number, basePrice: number): PricePoint[] {
  const points: PricePoint[] = [];
  const now = Date.now();
  const msPerDay = 86400000;
  let price = basePrice * 0.85;

  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * msPerDay;
    const change = (Math.random() - 0.48) * basePrice * 0.04;
    price = Math.max(price + change, basePrice * 0.5);
    price = Math.min(price, basePrice * 1.5);
    const volume = 50_000_000 + Math.random() * 200_000_000;
    points.push({
      timestamp,
      price: parseFloat(price.toFixed(2)),
      volume: parseFloat(volume.toFixed(0)),
    });
  }

  return points;
}

export const ltcPriceHistory30d = generatePriceHistory(30, 95);
export const ltcPriceHistory90d = generatePriceHistory(90, 95);
export const ltcPriceHistory365d = generatePriceHistory(365, 95);

export function getLatestPrice(): number {
  const history = ltcPriceHistory30d;
  return history[history.length - 1]?.price ?? 95;
}

export function get24hChange(): number {
  const history = ltcPriceHistory30d;
  if (history.length < 2) return 0;
  const current = history[history.length - 1].price;
  const previous = history[history.length - 2].price;
  return ((current - previous) / previous) * 100;
}
