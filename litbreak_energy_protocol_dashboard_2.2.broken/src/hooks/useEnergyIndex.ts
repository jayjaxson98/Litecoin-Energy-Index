import { useState, useEffect, useCallback } from 'react';
import type { EnergyIndex } from '../types';
import { generateEnergyIndex } from '../lib/mockData';

export function useEnergyIndex(refreshInterval = 20_000) {
  const [index, setIndex]     = useState<EnergyIndex>(generateEnergyIndex);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    setIndex(generateEnergyIndex());
    setLoading(false);
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, refreshInterval);
    return () => clearInterval(id);
  }, [refresh, refreshInterval]);

  return { index, loading, refresh };
}
