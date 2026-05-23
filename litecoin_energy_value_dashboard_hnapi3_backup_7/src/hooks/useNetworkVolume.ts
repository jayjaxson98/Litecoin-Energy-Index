import { useState, useEffect, useCallback, useRef } from 'react';
import type { VolumePoint, PriceCompPoint, TimeRange } from '../types/utx';
import { TIME_RANGE_OPTIONS } from '../types/utx';

// ─── Mock data generators ─────────────────────────────────────────────────────

/**
 * Generates mock Power Token network volume data.
 * In production, replace with a real API call.
 * Data is clearly labeled as MOCK throughout the UI.
 */
function generateMockVolume(range: TimeRange): VolumePoint[] {
  const now   = Date.now();
  const opt   = TIME_RANGE_OPTIONS.find((o) => o.value === range)!;
  const count =
    range === '24H' ? 24 :
    range === '7D'  ? 28 :
    range === '30D' ? 30 : 90;
  const step = opt.ms / count;

  const points: VolumePoint[] = [];
  let baseVol = 120_000 + Math.random() * 80_000; // PT units

  for (let i = 0; i < count; i++) {
    // Simulate realistic volume with trend + noise
    const trend   = Math.sin((i / count) * Math.PI * 2) * 0.15;
    const noise   = (Math.random() - 0.48) * 0.25;
    baseVol       = Math.max(10_000, baseVol * (1 + trend * 0.05 + noise * 0.08));
    const ptPrice = 0.12 + Math.random() * 0.04; // ~$0.12–$0.16 per PT

    points.push({
      t:         now - (count - i) * step,
      volumePT:  Math.round(baseVol),
      volumeUSD: parseFloat((baseVol * ptPrice).toFixed(2)),
      txCount:   Math.round(50 + Math.random() * 450),
    });
  }
  return points;
}

/**
 * Generates mock PT-price vs LTC-price comparison data.
 * In production, replace with a real API call.
 */
function generateMockPriceComp(range: TimeRange): PriceCompPoint[] {
  const now   = Date.now();
  const opt   = TIME_RANGE_OPTIONS.find((o) => o.value === range)!;
  const count =
    range === '24H' ? 24 :
    range === '7D'  ? 28 :
    range === '30D' ? 30 : 90;
  const step = opt.ms / count;

  const points: PriceCompPoint[] = [];
  let ptPrice  = 0.13 + Math.random() * 0.02;
  let ltcPrice = 78   + Math.random() * 12;

  for (let i = 0; i < count; i++) {
    ptPrice  = Math.max(0.05, ptPrice  * (1 + (Math.random() - 0.48) * 0.04));
    ltcPrice = Math.max(40,   ltcPrice * (1 + (Math.random() - 0.48) * 0.025));

    points.push({
      t:        now - (count - i) * step,
      ptPrice:  parseFloat(ptPrice.toFixed(6)),
      ltcPrice: parseFloat(ltcPrice.toFixed(4)),
    });
  }
  return points;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface NetworkVolumeData {
  volumePoints:    VolumePoint[];
  priceCompPoints: PriceCompPoint[];
  isLoading:       boolean;
  error:           string | null;
  lastUpdated:     number;
  refetch:         () => void;
}

export function useNetworkVolume(range: TimeRange = '24H'): NetworkVolumeData {
  const [volumePoints,    setVolumePoints]    = useState<VolumePoint[]>([]);
  const [priceCompPoints, setPriceCompPoints] = useState<PriceCompPoint[]>([]);
  const [isLoading,       setIsLoading]       = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [lastUpdated,     setLastUpdated]     = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate network latency
      await new Promise<void>((r) => setTimeout(r, 500));
      setVolumePoints(generateMockVolume(range));
      setPriceCompPoints(generateMockPriceComp(range));
      setLastUpdated(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load network volume data');
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    timerRef.current = setInterval(fetchData, 30_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchData]);

  return { volumePoints, priceCompPoints, isLoading, error, lastUpdated, refetch: fetchData };
}
