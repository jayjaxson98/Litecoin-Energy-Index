import { useState, useEffect, useCallback } from 'react';
import type { ProtocolStats } from '../types';

function generateStats(): ProtocolStats {
  return {
    totalSupply:   (1_234_567 + Math.floor(Math.random() * 10_000)).toLocaleString(),
    totalMinted:   (2_345_678 + Math.floor(Math.random() * 10_000)).toLocaleString(),
    totalRedeemed: (1_111_111 + Math.floor(Math.random() * 5_000)).toLocaleString(),
    currentPrice:  (0.94 + (Math.random() - 0.5) * 0.05).toFixed(4),
    marketCap:     `$${(1_160_000 + Math.floor(Math.random() * 50_000)).toLocaleString()}`,
    volume24h:     `$${(234_567 + Math.floor(Math.random() * 20_000)).toLocaleString()}`,
    holders:       8_432 + Math.floor(Math.random() * 100),
    apr:           12.4 + (Math.random() - 0.5) * 2,
  };
}

export function useProtocolStats(refreshInterval = 30_000) {
  const [stats, setStats]     = useState<ProtocolStats>(generateStats);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 400));
      setStats(generateStats());
    } catch {
      setError('Failed to fetch protocol stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, refreshInterval);
    return () => clearInterval(id);
  }, [refresh, refreshInterval]);

  return { stats, loading, error, refresh };
}
