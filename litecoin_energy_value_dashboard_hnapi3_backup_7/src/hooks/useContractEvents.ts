import { useEffect, useRef, useCallback, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, LITBREAK_ABI } from '../config/contract';
import type { ContractEvent } from '../types/contract';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseContractEventsReturn {
  events:             ContractEvent[];
  isListening:        boolean;
  clearEvents:        () => void;
  /** bytes32-hex → live USD/kWh (scaled ×1e8) from RegionRateUpdated events */
  regionRateOverrides: Record<string, bigint>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalise a bytes32 value to a consistent lowercase hex key.
 * ethers v6 returns bytes32 as a 0x-prefixed 66-char hex string.
 */
function toBytes32Key(raw: string): string {
  return raw.toLowerCase();
}

/**
 * Attempt to decode a bytes32 value as a UTF-8 string (null-terminated).
 * Returns the trimmed string, or the raw hex if decoding fails / produces
 * non-printable characters.
 */
export function decodeBytes32(raw: string): string {
  try {
    const decoded = ethers.decodeBytes32String(raw);
    if (decoded.length > 0) return decoded;
  } catch {
    // fall through
  }
  return raw;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useContractEvents(
  connectedAddress?: string | null,
  maxEvents = 50,
): UseContractEventsReturn {
  const [events, setEvents]                         = useState<ContractEvent[]>([]);
  const [isListening, setIsListening]               = useState(false);
  const [regionRateOverrides, setRegionRateOverrides] = useState<Record<string, bigint>>({});
  const contractRef = useRef<ethers.Contract | null>(null);

  const pushEvent = useCallback((ev: ContractEvent) => {
    setEvents((prev) => [ev, ...prev].slice(0, maxEvents));
  }, [maxEvents]);

  const clearEvents = useCallback(() => setEvents([]), []);

  // ── Seed overrides from on-chain active rate on mount ─────────────────────
  // This ensures the table shows the current on-chain rate immediately,
  // even before any RegionRateUpdated event fires in this session.
  const seedActiveRate = useCallback(async (contract: ethers.Contract) => {
    try {
      const [activeRegionBytes32, activeRate]: [string, bigint] = await Promise.all([
        contract.activeRegion() as Promise<string>,
        contract.getActiveRegionRate() as Promise<bigint>,
      ]);
      const key = toBytes32Key(activeRegionBytes32);
      if (key && activeRate > 0n) {
        setRegionRateOverrides((prev) => ({ ...prev, [key]: activeRate }));
      }
    } catch (err) {
      console.warn('[useContractEvents] seedActiveRate failed:', err);
    }
  }, []);

  useEffect(() => {
    const ZERO = '0x0000000000000000000000000000000000000000';
    if (CONTRACT_ADDRESS === ZERO || !window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, LITBREAK_ABI, provider);
    contractRef.current = contract;
    setIsListening(true);

    // Seed the active region rate immediately on mount
    seedActiveRate(contract);

    // ── Deposited ────────────────────────────────────────────────────────────
    const onDeposited = (
      user: string,
      amount: bigint,
      currency: string,
      ev: ethers.EventLog,
    ) => {
      if (connectedAddress && user.toLowerCase() !== connectedAddress.toLowerCase()) return;
      pushEvent({
        kind:        'Deposited',
        user,
        amount,
        currency,
        txHash:      ev.transactionHash,
        blockNumber: ev.blockNumber,
      });
    };

    // ── Withdrawn ────────────────────────────────────────────────────────────
    const onWithdrawn = (
      user: string,
      amount: bigint,
      currency: string,
      ev: ethers.EventLog,
    ) => {
      if (connectedAddress && user.toLowerCase() !== connectedAddress.toLowerCase()) return;
      pushEvent({
        kind:        'Withdrawn',
        user,
        amount,
        currency,
        txHash:      ev.transactionHash,
        blockNumber: ev.blockNumber,
      });
    };

    // ── RegionRateUpdated ─────────────────────────────────────────────────────
    // CRITICAL: This is the primary sync point.
    // When the contract owner calls setRegionRate(), this event fires with the
    // new rate. We update regionRateOverrides so every table row that matches
    // this regionId immediately reflects the live on-chain value.
    const onRegionRateUpdated = (
      regionId: string,
      newRate: bigint,
      ev: ethers.EventLog,
    ) => {
      const key = toBytes32Key(regionId);

      // Update the live rate map — this triggers a re-render of any row
      // whose bytes32 key matches, replacing the static prop rate with the
      // on-chain value.
      setRegionRateOverrides((prev) => ({ ...prev, [key]: newRate }));

      pushEvent({
        kind:        'RegionRateUpdated',
        regionId,
        newRate,
        txHash:      ev.transactionHash,
        blockNumber: ev.blockNumber,
      });
    };

    // ── SwappedToPowerTokens ─────────────────────────────────────────────────
    const onSwappedToPowerTokens = (
      user: string,
      ltcAmount: bigint,
      powerTokenAmount: bigint,
      region: string,
      ev: ethers.EventLog,
    ) => {
      if (connectedAddress && user.toLowerCase() !== connectedAddress.toLowerCase()) return;
      pushEvent({
        kind:             'SwappedToPowerTokens',
        user,
        ltcAmount,
        powerTokenAmount,
        region,
        txHash:           ev.transactionHash,
        blockNumber:      ev.blockNumber,
      });
    };

    contract.on('Deposited',            onDeposited);
    contract.on('Withdrawn',            onWithdrawn);
    contract.on('RegionRateUpdated',    onRegionRateUpdated);
    contract.on('SwappedToPowerTokens', onSwappedToPowerTokens);

    return () => {
      contract.off('Deposited',            onDeposited);
      contract.off('Withdrawn',            onWithdrawn);
      contract.off('RegionRateUpdated',    onRegionRateUpdated);
      contract.off('SwappedToPowerTokens', onSwappedToPowerTokens);
      setIsListening(false);
    };
  }, [connectedAddress, pushEvent, seedActiveRate]);

  return { events, isListening, clearEvents, regionRateOverrides };
}
