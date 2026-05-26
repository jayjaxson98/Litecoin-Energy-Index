// ─── useContract Hook ─── v3.2.0
// Provides mocked contract interaction methods.

import { useState, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { fetchProtocolStats, fetchAgents, fetchOracleState, simulateMint, simulateRedeem, simulateStake } from '../lib/contract';
import type { ProtocolStats, AgentConfig, OracleState } from '../types';

export function useContract() {
  const { addTransaction, addToast } = useWallet();
  const [loading, setLoading] = useState(false);

  const getProtocolStats = useCallback(async (): Promise<ProtocolStats> => {
    return fetchProtocolStats();
  }, []);

  const getAgents = useCallback(async (): Promise<AgentConfig[]> => {
    return fetchAgents();
  }, []);

  const getOracleState = useCallback(async (): Promise<OracleState> => {
    return fetchOracleState();
  }, []);

  const mint = useCallback(async (amount: string) => {
    setLoading(true);
    try {
      const result = await simulateMint(amount);
      addTransaction({
        hash: result.hash,
        type: 'mint',
        amount,
        status: 'confirmed',
        timestamp: Math.floor(Date.now() / 1000),
      });
      addToast({
        type: 'success',
        title: 'Mint Successful',
        message: `Minted ${amount} LBT`,
        txHash: result.hash,
      });
      return result;
    } catch {
      addToast({
        type: 'error',
        title: 'Mint Failed',
        message: 'Transaction reverted',
      });
      throw new Error('Mint failed');
    } finally {
      setLoading(false);
    }
  }, [addTransaction, addToast]);

  const redeem = useCallback(async (amount: string) => {
    setLoading(true);
    try {
      const result = await simulateRedeem(amount);
      addTransaction({
        hash: result.hash,
        type: 'redeem',
        amount,
        status: 'confirmed',
        timestamp: Math.floor(Date.now() / 1000),
      });
      addToast({
        type: 'success',
        title: 'Redeem Successful',
        message: `Redeemed ${amount} LBT`,
        txHash: result.hash,
      });
      return result;
    } catch {
      addToast({
        type: 'error',
        title: 'Redeem Failed',
        message: 'Transaction reverted',
      });
      throw new Error('Redeem failed');
    } finally {
      setLoading(false);
    }
  }, [addTransaction, addToast]);

  const stake = useCallback(async (agentId: string, amount: string) => {
    setLoading(true);
    try {
      const result = await simulateStake(agentId, amount);
      addTransaction({
        hash: result.hash,
        type: 'stake',
        amount,
        status: 'confirmed',
        timestamp: Math.floor(Date.now() / 1000),
      });
      addToast({
        type: 'success',
        title: 'Stake Successful',
        message: `Staked ${amount} LBT to agent #${agentId}`,
        txHash: result.hash,
      });
      return result;
    } catch {
      addToast({
        type: 'error',
        title: 'Stake Failed',
        message: 'Transaction reverted',
      });
      throw new Error('Stake failed');
    } finally {
      setLoading(false);
    }
  }, [addTransaction, addToast]);

  return {
    loading,
    getProtocolStats,
    getAgents,
    getOracleState,
    mint,
    redeem,
    stake,
  };
}
