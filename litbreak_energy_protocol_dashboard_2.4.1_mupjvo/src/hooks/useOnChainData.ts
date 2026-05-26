/**
 * useOnChainData — React hook for on-chain state synchronization.
 *
 * Subscribes to the OnChainEventListener polling system and provides
 * reactive state updates to components.
 *
 * Falls back to simulation data when not connected to a real blockchain.
 */

import { useState, useEffect, useCallback } from 'react';
import { getEventListener, type PollingState } from '../lib/web3/events';
import { isContractConfigured } from '../lib/web3/config';

export interface UseOnChainDataReturn {
  state: PollingState | null;
  isPolling: boolean;
  isLive: boolean;
  refresh: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

export function useOnChainData(): UseOnChainDataReturn {
  const [state, setState] = useState<PollingState | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const isLive = isContractConfigured();

  useEffect(() => {
    if (!isLive) return;

    const listener = getEventListener();

    const unsub = listener.onStateChange((newState) => {
      setState(newState);
    });

    setIsPolling(listener.isPolling);

    return unsub;
  }, [isLive]);

  const refresh = useCallback(async () => {
    if (!isLive) return;
    const result = await getEventListener().refresh();
    if (result) setState(result);
  }, [isLive]);

  const startPolling = useCallback(() => {
    if (!isLive) return;
    getEventListener().startPolling();
    setIsPolling(true);
  }, [isLive]);

  const stopPolling = useCallback(() => {
    getEventListener().stopPolling();
    setIsPolling(false);
  }, []);

  return {
    state,
    isPolling,
    isLive,
    refresh,
    startPolling,
    stopPolling,
  };
}
