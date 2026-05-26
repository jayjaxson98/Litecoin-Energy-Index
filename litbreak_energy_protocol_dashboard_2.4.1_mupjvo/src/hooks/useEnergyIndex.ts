import { useMemo } from 'react';
import { computeWeightedAverage } from '@/data/countries';
import { useLtcPrice } from './useLtcPrice';

export function useEnergyIndex() {
  const { data: ltcData, isLoading, isLive } = useLtcPrice();

  const globalIndex = useMemo(() => computeWeightedAverage(), []);
  const ltcPrice = ltcData.price;

  const kwhPerLtc = useMemo(() => {
    if (globalIndex <= 0) return 0;
    return ltcPrice / globalIndex;
  }, [ltcPrice, globalIndex]);

  return {
    globalIndex,
    ltcPrice,
    kwhPerLtc,
    isLoading,
    isLive,
    ltcData,
  };
}
