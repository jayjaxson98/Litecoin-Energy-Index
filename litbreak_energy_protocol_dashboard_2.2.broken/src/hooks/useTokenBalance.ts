// ─── useTokenBalance Hook ─── v3.2.0
// Returns the user's LBT token balance (mocked in simulation).

import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';

export function useTokenBalance() {
  const { isConnected, isSimulation, tokenBalance } = useWallet();
  const [balance, setBalance] = useState('0.00');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setBalance('0.00');
      return;
    }

    if (isSimulation) {
      setBalance(tokenBalance);
      return;
    }

    // In production, fetch from contract here
    setLoading(true);
    const timer = setTimeout(() => {
      setBalance(tokenBalance);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [isConnected, isSimulation, tokenBalance]);

  return { balance, loading };
}
