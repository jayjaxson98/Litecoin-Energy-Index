import { useState, useEffect, useCallback, useRef } from 'react';
import type { LtcPriceData, LtcHistoricalPoint } from '../types';

const COINGECKO_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_last_updated_at=true';

const COINGECKO_CHART_URL =
  'https://api.coingecko.com/api/v3/coins/litecoin/market_chart';

// ─── Simulated fallback data ─────────────────────────────────

function generateSimulatedHistory(days: number, basePrice: number): LtcHistoricalPoint[] {
  const points: LtcHistoricalPoint[] = [];
  const now = Date.now();
  const interval = days <= 1 ? 300_000 : days <= 7 ? 3_600_000 : 86_400_000;
  const totalPoints = days <= 1 ? 288 : days <= 7 ? 168 : days <= 30 ? 30 : days <= 365 ? 365 : 730;
  let price = basePrice * (0.85 + Math.random() * 0.1);

  for (let i = totalPoints; i >= 0; i--) {
    const drift = (Math.random() - 0.48) * (basePrice * 0.015);
    price = Math.max(30, price + drift);
    points.push({
      timestamp: now - i * interval,
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 500_000_000 + 100_000_000),
    });
  }
  // Ensure last point matches current price
  if (points.length > 0) {
    points[points.length - 1].price = basePrice;
  }
  return points;
}

function getSimulatedPrice(): LtcPriceData {
  const base = 85 + Math.random() * 30;
  const change = (Math.random() - 0.5) * 8;
  return {
    price: parseFloat(base.toFixed(2)),
    change24h: parseFloat(change.toFixed(2)),
    changePercent24h: parseFloat(((change / base) * 100).toFixed(2)),
    marketCap: base * 75_000_000,
    volume24h: 250_000_000 + Math.random() * 200_000_000,
    high24h: base * 1.03,
    low24h: base * 0.97,
    lastUpdated: Date.now(),
  };
}

// ─── Hook ────────────────────────────────────────────────────

export function useLtcPrice() {
  const [data, setData] = useState<LtcPriceData>(() => getSimulatedPrice());
  const [history, setHistory] = useState<LtcHistoricalPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [timeframe, setTimeframe] = useState<'1' | '7' | '30' | '365' | 'max'>('7');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ─── Fetch current price ───────────────────────────────────
  const fetchPrice = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(COINGECKO_PRICE_URL, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const ltc = json.litecoin;

      if (ltc && ltc.usd) {
        setData({
          price: ltc.usd,
          change24h: ltc.usd * (ltc.usd_24h_change || 0) / 100,
          changePercent24h: ltc.usd_24h_change || 0,
          marketCap: ltc.usd_market_cap || ltc.usd * 75_000_000,
          volume24h: ltc.usd_24h_vol || 250_000_000,
          high24h: ltc.usd * 1.03,
          low24h: ltc.usd * 0.97,
          lastUpdated: (ltc.last_updated_at || Math.floor(Date.now() / 1000)) * 1000,
        });
        setIsLive(true);
        setError(null);
      }
    } catch {
      // Fallback: drift simulated price
      setData(prev => {
        const drift = (Math.random() - 0.48) * 0.5;
        const newPrice = Math.max(50, prev.price + drift);
        return {
          ...prev,
          price: parseFloat(newPrice.toFixed(2)),
          lastUpdated: Date.now(),
        };
      });
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Fetch historical data ─────────────────────────────────
  const fetchHistory = useCallback(async (days: string) => {
    setIsHistoryLoading(true);

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const daysNum = days === 'max' ? 730 : parseInt(days);
      const url = `${COINGECKO_CHART_URL}?vs_currency=usd&days=${days === 'max' ? 'max' : daysNum}`;

      const res = await fetch(url, {
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json.prices && Array.isArray(json.prices)) {
        const points: LtcHistoricalPoint[] = json.prices.map(
          ([ts, price]: [number, number], idx: number) => ({
            timestamp: ts,
            price: parseFloat(price.toFixed(2)),
            volume: json.total_volumes?.[idx]?.[1] || 0,
          })
        );
        setHistory(points);
        setIsLive(true);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      // Fallback to simulated history
      const daysNum = days === 'max' ? 730 : parseInt(days);
      setHistory(generateSimulatedHistory(daysNum, data.price));
      setIsLive(false);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [data.price]);

  // ─── Initial load + polling ────────────────────────────────
  useEffect(() => {
    fetchPrice();
    intervalRef.current = setInterval(fetchPrice, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPrice]);

  // ─── Fetch history on timeframe change ─────────────────────
  useEffect(() => {
    fetchHistory(timeframe);
  }, [timeframe, fetchHistory]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchPrice();
    fetchHistory(timeframe);
  }, [fetchPrice, fetchHistory, timeframe]);

  return {
    data,
    history,
    isLoading,
    isHistoryLoading,
    error,
    isLive,
    timeframe,
    setTimeframe,
    refresh,
  };
}
