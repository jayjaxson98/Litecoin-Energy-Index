import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownUp, Zap, Loader2, CheckCircle2, AlertCircle, Info, Wallet, Lock } from 'lucide-react';
import { useWeb3 } from '@/contexts/Web3Context';
import { useWallet } from '@/contexts/WalletContext';
import { useReadOnly } from '@/contexts/ReadOnlyContext';
import { useLtcPrice } from '@/hooks/useLtcPrice';
import { formatWithCommas } from '@/utils/calculations';
import type { TokenData } from '@/types';

interface Props {
  tokenData: TokenData;
}

type Mode = 'mint' | 'redeem';

export function LitecoinExchange({ tokenData }: Props) {
  const { isConnected, connect, isSimulation } = useWeb3();
  const { addTransaction, tokenBalance, setTokenBalance } = useWallet();
  const { isReadOnly, guardWrite } = useReadOnly();
  const { data: ltcData, isLive } = useLtcPrice();
  const [mode, setMode] = useState<Mode>('mint');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const exchangeRate = parseFloat(tokenData.exchangeRate);
  const feeBps = tokenData.feeBps;

  // LTC-centered calculations
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
      return (gross - fee).toFixed(8);
    }
  }, [amount, mode, exchangeRate, feeBps]);

  const feeAmount = useMemo(() => {
    const input = parseFloat(amount);
    if (isNaN(input) || input <= 0) return '0';
    if (mode === 'mint') {
      return (input * exchangeRate * feeBps / 10000).toFixed(4);
    } else {
      return (input / exchangeRate * feeBps / 10000).toFixed(8);
    }
  }, [amount, mode, exchangeRate, feeBps]);

  const usdEquivalent = useMemo(() => {
    const input = parseFloat(amount);
    if (isNaN(input) || input <= 0) return '0.00';
    if (mode === 'mint') {
      return (input * ltcData.price).toFixed(2);
    } else {
      return (parseFloat(outputAmount) * ltcData.price).toFixed(2);
    }
  }, [amount, mode, ltcData.price, outputAmount]);

  const handleSubmit = async () => {
    // Read-only guard
    if (isReadOnly) {
      if (!guardWrite('exchange:submit')) return;
    }

    if (!isConnected) { connect(); return; }
    const input = parseFloat(amount);
    if (isNaN(input) || input <= 0) return;

    setIsProcessing(true);
    setTxStatus('pending');

    const fakeHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    addTransaction({ hash: fakeHash, type: mode, amount, status: 'pending' });

    await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
    setTxStatus('success');

    if (mode === 'mint') {
      setTokenBalance((parseFloat(tokenBalance) + parseFloat(outputAmount)).toFixed(4));
    }

    setTimeout(() => { setIsProcessing(false); setTxStatus('idle'); setAmount(''); }, 2000);
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
      className="rounded-2xl glass p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
            <Zap className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {mode === 'mint' ? 'Mint LITB' : 'Redeem LITB'}
            </h3>
            <p className="text-[11px] text-gray-500">Litecoin-powered exchange</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isReadOnly && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
              <Lock className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] text-amber-400 font-medium">View Only</span>
            </div>
          )}
          <div className="flex items-center rounded-lg bg-white/5 p-0.5">
            <button
              onClick={() => { setMode('mint'); setAmount(''); setTxStatus('idle'); }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                mode === 'mint' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white'
              }`}
            >
              Mint
            </button>
            <button
              onClick={() => { setMode('redeem'); setAmount(''); setTxStatus('idle'); }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                mode === 'redeem' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-gray-400 hover:text-white'
              }`}
            >
              Redeem
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Input */}
        <div className={`rounded-xl bg-white/[0.03] border p-4 ${isReadOnly ? 'border-amber-500/10 opacity-60' : 'border-white/5'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider">
              You {mode === 'mint' ? 'pay' : 'send'}
            </span>
            <span className="text-[11px] text-gray-500">
              {mode === 'redeem' ? `Balance: ${parseFloat(tokenBalance).toFixed(2)} LITB` : ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder:text-gray-600 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              disabled={isProcessing || isReadOnly}
            />
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 flex-shrink-0">
              {mode === 'mint' ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-[9px] font-black text-white">Ł</span>
                  </div>
                  <span className="text-sm font-semibold text-white">LTC</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-white">LITB</span>
                </>
              )}
            </div>
          </div>
          {parseFloat(amount) > 0 && mode === 'mint' && (
            <p className="text-[11px] text-gray-500 mt-1.5 font-mono">≈ ${usdEquivalent} USD</p>
          )}
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center -my-0.5">
          <motion.button
            onClick={toggleMode}
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="w-10 h-10 rounded-xl bg-surface border border-white/5 flex items-center justify-center hover:border-primary/30 transition-colors"
          >
            <ArrowDownUp className="w-4 h-4 text-gray-400" />
          </motion.button>
        </div>

        {/* Output */}
        <div className={`rounded-xl bg-white/[0.03] border p-4 ${isReadOnly ? 'border-amber-500/10 opacity-60' : 'border-white/5'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider">You receive</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex-1 text-2xl font-bold text-white font-mono">
              {outputAmount}
            </span>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 flex-shrink-0">
              {mode === 'mint' ? (
                <>
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-white">LITB</span>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-[9px] font-black text-white">Ł</span>
                  </div>
                  <span className="text-sm font-semibold text-white">LTC</span>
                </>
              )}
            </div>
          </div>
          {parseFloat(amount) > 0 && mode === 'redeem' && (
            <p className="text-[11px] text-gray-500 mt-1.5 font-mono">≈ ${usdEquivalent} USD</p>
          )}
        </div>

        {/* Details */}
        <AnimatePresence>
          {parseFloat(amount) > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-white/[0.02] border border-white/5 p-3.5 space-y-2 overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Exchange Rate
                </span>
                <span className="text-gray-300 font-mono">1 LTC = {exchangeRate} LITB</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">LTC/USD</span>
                <span className="text-gray-300 font-mono">${ltcData.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Protocol Fee ({feeBps / 100}%)</span>
                <span className="text-gray-300 font-mono">
                  {feeAmount} {mode === 'mint' ? 'LITB' : 'LTC'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Est. Network Fee</span>
                <span className="text-gray-300 font-mono">~0.001 LTC</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.button
          onClick={handleSubmit}
          disabled={isProcessing || isReadOnly}
          whileHover={isReadOnly ? {} : { scale: 1.02 }}
          whileTap={isReadOnly ? {} : { scale: 0.98 }}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isReadOnly
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : txStatus === 'success'
              ? 'bg-emerald-500 text-white'
              : txStatus === 'error'
              ? 'bg-red-500 text-white'
              : mode === 'mint'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40'
              : 'bg-gradient-to-r from-accent to-primary text-white shadow-lg shadow-accent/20 hover:shadow-accent/40'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            {isReadOnly ? (
              <>
                <Lock className="w-4 h-4" />
                Read-Only Mode
              </>
            ) : !isConnected ? (
              <>
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {txStatus === 'pending' ? 'Processing...' : 'Confirming...'}
              </>
            ) : txStatus === 'success' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Success!
              </>
            ) : txStatus === 'error' ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Failed
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                {mode === 'mint' ? 'Mint with LTC' : 'Redeem to LTC'}
              </>
            )}
          </span>
        </motion.button>

        {isReadOnly && (
          <p className="text-center text-[11px] text-amber-500/60">
            Write operations are disabled during LTC migration
          </p>
        )}

        {!isReadOnly && isSimulation && isConnected && (
          <p className="text-center text-[11px] text-amber-500/50">
            Simulation mode — no real transactions
          </p>
        )}
      </div>
    </motion.div>
  );
}
