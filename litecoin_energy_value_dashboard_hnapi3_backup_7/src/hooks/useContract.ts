import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, LITBREAK_ABI } from '../config/contract';
import type { ContractState, ContractTxState } from '../types/contract';

// ─── Constants ────────────────────────────────────────────────────────────────

const ZERO_ADDRESS         = '0x0000000000000000000000000000000000000000';
const DEADLINE_BUFFER_SECS = 300;   // 5 minutes
const DEFAULT_SLIPPAGE_BPS = 50;    // 0.5 % — well within the 5 % contract floor

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseContractReturn {
  contractState:  ContractState;
  txState:        ContractTxState;
  isDeployed:     boolean;
  isInitialising: boolean;

  deposit:              (amountEth: string) => Promise<string | null>;
  withdraw:             (amountEth: string) => Promise<string | null>;
  swapToPowerTokens:    (ltcAmountEth: string, slippageBps?: number) => Promise<string | null>;
  swapPowerTokensToLtc: (powerAmountEth: string, slippageBps?: number) => Promise<string | null>;

  refreshState: (address?: string | null) => Promise<void>;
  resetTx:      () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useContract(connectedAddress?: string | null): UseContractReturn {
  const [contractState, setContractState] = useState<ContractState>({
    activeRegionRate: null,
    ltcUsdPrice:      null,
    activeRegion:     null,
    ltcBalance:       null,
    powerTokens:      null,
    isSolvent:        null,
    isPaused:         null,
  });

  const [txState, setTxState] = useState<ContractTxState>({
    status: 'idle',
    hash:   null,
    error:  null,
  });

  const [isInitialising, setIsInitialising] = useState(false);
  const providerRef = useRef<ethers.BrowserProvider | null>(null);

  const isDeployed = CONTRACT_ADDRESS !== ZERO_ADDRESS;

  // ── Provider / contract helpers ───────────────────────────────────────────

  function getProvider(): ethers.BrowserProvider {
    if (!window.ethereum) throw new Error('No injected provider found. Install MetaMask.');
    if (!providerRef.current) {
      providerRef.current = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
    }
    return providerRef.current;
  }

  async function getReadContract(): Promise<ethers.Contract> {
    return new ethers.Contract(CONTRACT_ADDRESS, LITBREAK_ABI, getProvider());
  }

  async function getWriteContract(): Promise<ethers.Contract> {
    const signer = await getProvider().getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, LITBREAK_ABI, signer);
  }

  function deadline(): bigint {
    return BigInt(Math.floor(Date.now() / 1000) + DEADLINE_BUFFER_SECS);
  }

  // ── Read state ────────────────────────────────────────────────────────────

  const refreshState = useCallback(async (address?: string | null) => {
    if (!isDeployed) return;
    setIsInitialising(true);
    try {
      const contract = await getReadContract();

      const [activeRegionRate, ltcUsdPrice, activeRegion, isSolvent, isPaused] =
        await Promise.all([
          contract.getActiveRegionRate() as Promise<bigint>,
          contract.ltcUsdPrice()         as Promise<bigint>,
          contract.activeRegion()        as Promise<string>,
          contract.isSolvent()           as Promise<boolean>,
          contract.paused()              as Promise<boolean>,
        ]);

      let ltcBalance:    bigint | null = null;
      let powerTokenBal: bigint | null = null;

      const addr = address ?? connectedAddress;
      if (addr) {
        [ltcBalance, powerTokenBal] = await Promise.all([
          contract.ltcBalances(addr) as Promise<bigint>,
          contract.powerTokens(addr) as Promise<bigint>,
        ]);
      }

      setContractState({
        activeRegionRate,
        ltcUsdPrice,
        activeRegion,
        ltcBalance,
        powerTokens: powerTokenBal,
        isSolvent,
        isPaused,
      });
    } catch (err) {
      console.error('[useContract] refreshState error:', err);
    } finally {
      setIsInitialising(false);
    }
  }, [connectedAddress, isDeployed]);

  useEffect(() => {
    refreshState(connectedAddress);
  }, [connectedAddress, refreshState]);

  // ── Tx state helpers ──────────────────────────────────────────────────────

  const setTxPending   = () => setTxState({ status: 'pending',   hash: null, error: null });
  const setTxMining    = (h: string) => setTxState({ status: 'mining',    hash: h,    error: null });
  const setTxConfirmed = (h: string) => setTxState({ status: 'confirmed', hash: h,    error: null });
  const setTxFailed    = (e: string) => setTxState({ status: 'failed',    hash: null, error: e    });
  const resetTx = useCallback(() => setTxState({ status: 'idle', hash: null, error: null }), []);

  // ── deposit() ─────────────────────────────────────────────────────────────

  const deposit = useCallback(async (amountEth: string): Promise<string | null> => {
    setTxPending();
    try {
      const contract = await getWriteContract();
      const tx       = await contract.deposit({ value: ethers.parseEther(amountEth) });
      setTxMining(tx.hash);
      await tx.wait();
      setTxConfirmed(tx.hash);
      await refreshState();
      return tx.hash;
    } catch (err: unknown) {
      setTxFailed(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, [refreshState]);

  // ── withdraw() ────────────────────────────────────────────────────────────

  const withdraw = useCallback(async (amountEth: string): Promise<string | null> => {
    setTxPending();
    try {
      const contract = await getWriteContract();
      const tx       = await contract.withdraw(ethers.parseEther(amountEth));
      setTxMining(tx.hash);
      await tx.wait();
      setTxConfirmed(tx.hash);
      await refreshState();
      return tx.hash;
    } catch (err: unknown) {
      setTxFailed(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, [refreshState]);

  // ── swapToPowerTokens() ───────────────────────────────────────────────────
  //
  // [SWC-114-CLOSED v18] Now passes expectedPrice + expectedNonce to the contract.
  //
  // Flow:
  //   1. Read ltcUsdPrice and swapNonce[caller] atomically from the contract.
  //   2. Compute quoted output using the live price.
  //   3. Apply slippage to derive minOut (must be ≥ contract's slippage floor).
  //   4. Submit swap with (ltcAmount, minOut, deadline, expectedPrice, expectedNonce).
  //
  // If an attacker front-runs a price change between steps 1 and 4, the
  // contract's price-deviation guard (MAX_PRICE_DEVIATION_BPS = 150 bps) will
  // revert the transaction, protecting the user.

  const swapToPowerTokens = useCallback(
    async (ltcAmountEth: string, slippageBps = DEFAULT_SLIPPAGE_BPS): Promise<string | null> => {
      setTxPending();
      try {
        const readContract  = await getReadContract();
        const writeContract = await getWriteContract();
        const ltcAmount     = ethers.parseEther(ltcAmountEth);

        // Read price and nonce atomically before constructing the call
        const signerAddress = await (await getProvider().getSigner()).getAddress();
        const [quoted, expectedPrice, expectedNonce]: [bigint, bigint, bigint] =
          await Promise.all([
            readContract.quotePowerTokensForLtc(ltcAmount) as Promise<bigint>,
            readContract.ltcUsdPrice()                     as Promise<bigint>,
            readContract.getSwapNonce(signerAddress)       as Promise<bigint>,
          ]);

        // Apply caller slippage on top of the contract's floor
        const minOut = (quoted * BigInt(10_000 - slippageBps)) / BigInt(10_000);

        const tx = await writeContract.swapToPowerTokens(
          ltcAmount,
          minOut,
          deadline(),
          expectedPrice,
          expectedNonce,
        );
        setTxMining(tx.hash);
        await tx.wait();
        setTxConfirmed(tx.hash);
        await refreshState();
        return tx.hash;
      } catch (err: unknown) {
        setTxFailed(err instanceof Error ? err.message : String(err));
        return null;
      }
    },
    [refreshState],
  );

  // ── swapPowerTokensToLtc() ────────────────────────────────────────────────

  const swapPowerTokensToLtc = useCallback(
    async (powerAmountEth: string, slippageBps = DEFAULT_SLIPPAGE_BPS): Promise<string | null> => {
      setTxPending();
      try {
        const readContract  = await getReadContract();
        const writeContract = await getWriteContract();
        const powerAmount   = ethers.parseEther(powerAmountEth);

        const signerAddress = await (await getProvider().getSigner()).getAddress();
        const [quoted, expectedPrice, expectedNonce]: [bigint, bigint, bigint] =
          await Promise.all([
            readContract.quoteLtcForPowerTokens(powerAmount) as Promise<bigint>,
            readContract.ltcUsdPrice()                       as Promise<bigint>,
            readContract.getSwapNonce(signerAddress)         as Promise<bigint>,
          ]);

        const minOut = (quoted * BigInt(10_000 - slippageBps)) / BigInt(10_000);

        const tx = await writeContract.swapPowerTokensToLtc(
          powerAmount,
          minOut,
          deadline(),
          expectedPrice,
          expectedNonce,
        );
        setTxMining(tx.hash);
        await tx.wait();
        setTxConfirmed(tx.hash);
        await refreshState();
        return tx.hash;
      } catch (err: unknown) {
        setTxFailed(err instanceof Error ? err.message : String(err));
        return null;
      }
    },
    [refreshState],
  );

  return {
    contractState,
    txState,
    isDeployed,
    isInitialising,
    deposit,
    withdraw,
    swapToPowerTokens,
    swapPowerTokensToLtc,
    refreshState,
    resetTx,
  };
}
