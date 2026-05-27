import { useState, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';

interface TokenState {
  minting: boolean;
  redeeming: boolean;
  txHash: string | null;
  txStatus: 'idle' | 'pending' | 'confirming' | 'success' | 'error';
  txError: string | null;
  totalSupply: number;
  totalLtcLocked: number;
  protocolFees: number;
}

export const useLitbreakToken = () => {
  const { connected, lbtBalance, ltcBalance, refreshBalances } = useWallet();
  const [state, setState] = useState<TokenState>({
    minting: false,
    redeeming: false,
    txHash: null,
    txStatus: 'idle',
    txError: null,
    totalSupply: 2_450_000,
    totalLtcLocked: 1_890,
    protocolFees: 12.5,
  });

  const generateTxHash = () => {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  };

  const mint = useCallback(async (ltcAmount: number, energyFactor: number) => {
    if (!connected) throw new Error('Wallet not connected');
    if (ltcAmount <= 0) throw new Error('Invalid amount');

    setState(prev => ({ ...prev, minting: true, txStatus: 'pending', txError: null }));

    // Simulate transaction signing
    await new Promise(resolve => setTimeout(resolve, 1000));
    const txHash = generateTxHash();
    setState(prev => ({ ...prev, txHash, txStatus: 'confirming' }));

    // Simulate block confirmation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const lbtMinted = ltcAmount * energyFactor;
    setState(prev => ({
      ...prev,
      minting: false,
      txStatus: 'success',
      totalSupply: prev.totalSupply + lbtMinted,
      totalLtcLocked: prev.totalLtcLocked + ltcAmount,
    }));

    refreshBalances();
    return { txHash, lbtMinted };
  }, [connected, refreshBalances]);

  const redeem = useCallback(async (lbtAmount: number) => {
    if (!connected) throw new Error('Wallet not connected');
    if (lbtAmount <= 0) throw new Error('Invalid amount');

    setState(prev => ({ ...prev, redeeming: true, txStatus: 'pending', txError: null }));

    await new Promise(resolve => setTimeout(resolve, 1000));
    const txHash = generateTxHash();
    setState(prev => ({ ...prev, txHash, txStatus: 'confirming' }));

    await new Promise(resolve => setTimeout(resolve, 2000));

    const ltcReturned = (lbtAmount / state.totalSupply) * state.totalLtcLocked;
    const fee = ltcReturned * 0.003;

    setState(prev => ({
      ...prev,
      redeeming: false,
      txStatus: 'success',
      totalSupply: prev.totalSupply - lbtAmount,
      totalLtcLocked: prev.totalLtcLocked - ltcReturned,
      protocolFees: prev.protocolFees + fee,
    }));

    refreshBalances();
    return { txHash, ltcReturned: ltcReturned - fee, fee };
  }, [connected, state.totalSupply, state.totalLtcLocked, refreshBalances]);

  const resetTx = useCallback(() => {
    setState(prev => ({ ...prev, txHash: null, txStatus: 'idle', txError: null }));
  }, []);

  const previewMint = useCallback((ltcAmount: number, energyFactor: number) => {
    return ltcAmount * energyFactor;
  }, []);

  const previewRedeem = useCallback((lbtAmount: number) => {
    if (state.totalSupply === 0) return { ltcAmount: 0, fee: 0 };
    const ltcReturned = (lbtAmount / state.totalSupply) * state.totalLtcLocked;
    const fee = ltcReturned * 0.003;
    return { ltcAmount: ltcReturned - fee, fee };
  }, [state.totalSupply, state.totalLtcLocked]);

  return {
    ...state,
    lbtBalance: lbtBalance / 1e8,
    ltcBalance: ltcBalance / 1e8,
    mint,
    redeem,
    resetTx,
    previewMint,
    previewRedeem,
  };
};
