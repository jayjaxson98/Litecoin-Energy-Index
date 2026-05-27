import { create } from 'zustand';

interface PricePoint {
  timestamp: number;
  price: number;
}

type TimeRange = '24h' | '7d' | '30d' | '90d';

interface LtcPriceState {
  currentPrice: number | null;
  priceChange24h: number | null;
  historicalData: PricePoint[];
  timeRange: TimeRange;
  isLoading: boolean;
  isHistoryLoading: boolean;
  error: string | null;
  historyError: string | null;
  lastFetch: number;
  isApiPrice: boolean; // true if price came from real API, false if simulated fallback
  setTimeRange: (range: TimeRange) => void;
  retry: () => void;
}

const TIME_RANGE_DAYS: Record<TimeRange, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

function generateSimulatedHistory(days: number, basePrice: number): PricePoint[] {
  const points: PricePoint[] = [];
  const now = Date.now();
  const interval = (days * 24 * 3600 * 1000) / 200;
  let price = basePrice * (0.85 + Math.random() * 0.15);

  for (let i = 200; i >= 0; i--) {
    const drift = (Math.random() - 0.48) * 1.5;
    price = Math.max(50, Math.min(150, price + drift));
    points.push({
      timestamp: now - i * interval,
      price: Math.round(price * 100) / 100,
    });
  }
  return points;
}

export const useLtcPrice = create<LtcPriceState>((set, get) => {
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const fetchPrice = async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd&include_24hr_change=true',
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const price = data?.litecoin?.usd;
      const change = data?.litecoin?.usd_24h_change;
      if (typeof price !== 'number') throw new Error('Invalid data');
      set({
        currentPrice: price,
        priceChange24h: typeof change === 'number' ? change : null,
        isLoading: false,
        isApiPrice: true,
        lastFetch: Date.now(),
        error: null,
      });
      return price;
    } catch (e: any) {
      // Use existing price if we have one, otherwise generate a simulated fallback
      const existingPrice = get().currentPrice;
      const fallback = existingPrice ?? (87.42 + (Math.random() - 0.5) * 6);
      set({
        currentPrice: fallback,
        priceChange24h: get().priceChange24h ?? (Math.random() - 0.5) * 5,
        isLoading: false,
        isApiPrice: false,
        error: 'Using simulated data',
        lastFetch: Date.now(),
      });
      return fallback;
    }
  };

  const fetchHistory = async () => {
    const { timeRange } = get();
    const days = TIME_RANGE_DAYS[timeRange];
    try {
      set({ isHistoryLoading: true, historyError: null });
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/litecoin/market_chart?vs_currency=usd&days=${days}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data?.prices)) throw new Error('Invalid data');
      const points: PricePoint[] = data.prices.map(([ts, p]: [number, number]) => ({
        timestamp: ts,
        price: Math.round(p * 100) / 100,
      }));
      set({ historicalData: points, isHistoryLoading: false });
    } catch {
      const base = get().currentPrice ?? 87;
      set({
        historicalData: generateSimulatedHistory(days, base),
        isHistoryLoading: false,
        historyError: 'Using simulated history',
      });
    }
  };

  const startPolling = () => {
    if (pollTimer) clearInterval(pollTimer);
    fetchPrice().then(() => fetchHistory());
    pollTimer = setInterval(() => {
      fetchPrice();
    }, 45000);
  };

  startPolling();

  return {
    currentPrice: null,
    priceChange24h: null,
    historicalData: [],
    timeRange: '7d',
    isLoading: true,
    isHistoryLoading: true,
    error: null,
    historyError: null,
    lastFetch: 0,
    isApiPrice: false,

    setTimeRange: (range: TimeRange) => {
      set({ timeRange: range });
      fetchHistory();
    },

    retry: () => {
      fetchPrice().then(() => fetchHistory());
    },
  };
});

/**
 * Get the current LTC price from the API store (non-hook access).
 * Used by useMockContract to sync oracle price with API data.
 */
export function getLtcApiPrice(): { price: number | null; isApiPrice: boolean } {
  const state = useLtcPrice.getState();
  return { price: state.currentPrice, isApiPrice: state.isApiPrice };
}
