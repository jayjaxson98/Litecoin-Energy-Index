import { useState, useEffect, useCallback } from 'react';
import type { MiningStats } from '../types';
import { generateMiningStats } from '../lib/mockData';

export function useMiningStats(refreshInterval = 15_000) {
  const [stats, setStats]     = useState<MiningStats>(generateMiningStats);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    setStats(generateMiningStats());
    setLoading(false);
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, refreshInterval);
    return () => clearInterval(id);
  }, [refresh, refreshInterval]);

  return { stats, loading, refresh };
}
