/**
 * usePauseState — Hook that tracks whether the LitbreakProtocol contract is paused.
 *
 * Fix #13 / #8: No pause state hook existed. The UI had no way to check or react
 * to the contract's paused() state, meaning users could attempt transactions on a
 * paused contract (which would revert).
 *
 * In the simulation environment, this polls a simulated pause state.
 * In a real deployment, this would call contract.paused() and subscribe to
 * Paused/Unpaused events.
 */

import { useState, useEffect, useCallback } from 'react';

// ─── Simulated Pause State ──────────────────────────────────────────────────
// In production, this would be replaced with actual contract reads + event subs.

let _simulatedPaused = false;
const _listeners = new Set<(paused: boolean) => void>();

/**
 * For testing/demo: programmatically set the pause state.
 * In production, this would be driven by on-chain events.
 */
export function __setSimulatedPauseState(paused: boolean): void {
  _simulatedPaused = paused;
  _listeners.forEach(fn => fn(paused));
}

/**
 * For testing/demo: toggle the pause state.
 */
export function __toggleSimulatedPauseState(): void {
  __setSimulatedPauseState(!_simulatedPaused);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface PauseState {
  /** Whether the contract is currently paused */
  isPaused: boolean;
  /** Whether the pause state is still being loaded */
  loading: boolean;
  /** Re-check the pause state manually */
  refresh: () => Promise<void>;
}

export function usePauseState(): PauseState {
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial check
  useEffect(() => {
    const checkPause = async () => {
      // Simulate async contract read
      await new Promise(r => setTimeout(r, 200));
      setIsPaused(_simulatedPaused);
      setLoading(false);
    };
    checkPause();
  }, []);

  // Subscribe to changes (simulates event subscription)
  useEffect(() => {
    const handler = (paused: boolean) => {
      setIsPaused(paused);
    };
    _listeners.add(handler);
    return () => {
      _listeners.delete(handler);
    };
  }, []);

  // Manual refresh
  const refresh = useCallback(async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 200));
    setIsPaused(_simulatedPaused);
    setLoading(false);
  }, []);

  return { isPaused, loading, refresh };
}
