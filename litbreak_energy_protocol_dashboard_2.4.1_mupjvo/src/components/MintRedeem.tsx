import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowDownUp, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useWeb3 } from '@/contexts/Web3Context';
import { useWallet } from '@/contexts/WalletContext';
import type { TokenData } from '@/types';

interface MintRedeemProps {
  tokenData: TokenData;
}

type Mode = 'mint' | 'redeem';

export function MintRedeem({ tokenData }: MintRedeemProps) {
  const { isConnected, connect, isSimulation } = useWeb3();
  const { addTransaction, tokenBalance, setTokenBalance } = useWallet();
  const [mode, setMode] = useState<Mode>('mint');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const exchangeRate = parseFloat(tokenData.exchangeRate);
  const feeBps = tokenData.feeBps;

  const outputAmount = useMemo(() => {
    const input = parseFloat(amount);
    if (isNaN(input) || input <= 0) return '0';
    if (mode === 'mint') {
      const gross = input * exchangeRate;
      const fee = gross * feeBps / 10000;
      return (gross - fee).toFixed(4);
    } else {
      const gross = input / exchangeRate;
      const fee = gross * feeBps / 10000;
      return (gross - fee).toFixed(6);
    }
  }, [amount, mode, exchangeRate, feeBps]);

  const feeAmount = useMemo(() => {
    const input = parseFloat(amount);
    if (isNaN(input) || input <= 0) return '0';
    if (mode === 'mint') {
      return (input * exchangeRate * feeBps / 10000).toFixed(4);
    } else {
      return (input / exchangeRate * feeBps / 10000).toFixed(6);
    }
  }, [amount, mode, exchangeRate, feeBps]);

  const handleSubmit = async () => {
    if (!isConnected) {
      connect();
      return;
    }
    const input = parseFloat(amount);
    if (isNaN(input) || input <= 0) return;

    setIsProcessing(true);
    setTxStatus('pending');

    // Simulate transaction
    const fakeHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    addTransaction({
      hash: fakeHash,
      type: mode,
      amount: amount,
      status: 'pending',
    });

    await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));

    setTxStatus('success');
    if (mode === 'mint') {
      setTokenBalance((parseFloat(tokenBalance) + parseFloat(outputAmount)).toFixed(4));
    }

    setTimeout(() => {
      setIsProcessing(false);
      setTxStatus('idle');
      setAmount('');
    }, 2000);
  };

  const toggleMode = () => {
    setMode(m => m === 'mint' ? 'redeem' : 'mint');
    setAmount('');
    setTxStatus('idle');
  };

  return (
    <motion.div
      id="mint"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="rounded-2xl glass p-4 sm:p-6"
    >
      {/* Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-white">
          {mode === 'mint' ? 'Mint LITB' : 'Redeem LITB'}
        </h3>
        <div className="flex items-center rounded-lg bg-white/5 p-1">
          <button
            onClick={() => { setMode('mint'); setAmount(''); setTxStatus('idle'); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'mint' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            Mint
          </button>
          <button
            onClick={() => { setMode('redeem'); setAmount(''); setTxStatus('idle'); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'redeem' ? 'bg-accent text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            Redeem
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">You {mode === 'mint' ? 'pay' : 'send'}</span>
            <span className="text-xs text-gray-500">
              Balance: {mode === 'mint' ? '—' : `${parseFloat(tokenBalance).toFixed(2)} LITB`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl sm:text-3xl font-bold text-white outline-none placeholder:text-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              disabled={isProcessing}
            />
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
              {mode === 'mint' ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold">Ξ</div>
                  <span className="text-sm font-semibold text-white">ETH</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-white">LITB</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center -my-1">
          <motion.button
            onClick={toggleMode}
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:border-primary/30 transition-colors"
          >
            <ArrowDownUp className="w-4 h-4 text-gray-400" />
          </motion.button>
        </div>

        {/* Output */}
        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">You receive</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex-1 text-2xl sm:text-3xl font-bold text-white">
              {outputAmount}
            </span>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
              {mode === 'mint' ? (
                <>
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-white">LITB</span>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold">Ξ</div>
                  <span className="text-sm font-semibold text-white">ETH</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <AnimatePresence>
          {parseFloat(amount) > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-2 overflow-hidden"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Exchange Rate
                </span>
                <span className="text-gray-300 font-mono">1 ETH = {exchangeRate} LITB</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Protocol Fee ({feeBps / 100}%)</span>
                <span className="text-gray-300 font-mono">
                  {feeAmount} {mode === 'mint' ? 'LITB' : 'ETH'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Est. Gas</span>
                <span className="text-gray-300 font-mono">~0.003 ETH</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <motion.button
          onClick={handleSubmit}
          disabled={isProcessing || (!isConnected && false)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-4 rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            txStatus === 'success'
              ? 'bg-emerald-500 text-white'
              : txStatus === 'error'
              ? 'bg-red-500 text-white'
              : mode === 'mint'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40'
              : 'bg-gradient-to-r from-accent to-primary text-white shadow-lg shadow-accent/20 hover:shadow-accent/40'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            {!isConnected ? (
              <>
                <Zap className="w-5 h-5" />
                Connect Wallet to {mode === 'mint' ? 'Mint' : 'Redeem'}
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {txStatus === 'pending' ? 'Processing Transaction...' : 'Confirming...'}
              </>
            ) : txStatus === 'success' ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Transaction Successful!
              </>
            ) : txStatus === 'error' ? (
              <>
                <AlertCircle className="w-5 h-5" />
                Transaction Failed
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                {mode === 'mint' ? 'Mint LITB' : 'Redeem LITB'}
              </>
            )}
          </span>
        </motion.button>

        {isSimulation && isConnected && (
          <p className="text-center text-xs text-warning/60">
            Simulation mode — no real transactions will be sent
          </p>
        )}
      </div>
    </motion.div>
  );
}
