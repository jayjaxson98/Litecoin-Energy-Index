import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, Zap, Loader2, CheckCircle2, AlertCircle, Info, Wallet } from 'lucide-react';
import { useMockContract } from '../hooks/useMockContract';
import { formatNumber, simulateGasEstimate, calculateMintOutput } from '../utils/contractHelpers';

export default function MintPanel() {
  const { isConnected, wltcBalance, gei, oracleData, mint, pendingTx, connectWallet } = useMockContract();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const displayBalance = isConnected ? wltcBalance : 0;
  const numAmount = parseFloat(amount) || 0;
  const output = calculateMintOutput(numAmount, gei, oracleData.ltcPrice);
  const gas = simulateGasEstimate();
  const isValid = isConnected && numAmount > 0 && numAmount <= displayBalance;

  const handleMint = async () => {
    if (!isValid || pendingTx) return;
    setStatus('pending');
    try {
      const tx = await mint(numAmount);
      setStatus(tx.status === 'confirmed' ? 'success' : 'error');
      if (tx.status === 'confirmed') setAmount('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const setPercentage = (pct: number) => {
    if (!isConnected) return;
    setAmount((displayBalance * pct).toFixed(6));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4 relative flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">Mint LBT</h3>
        </div>
        <span className="text-[10px] text-neutral-500 font-mono">WLTC → LBT</span>
      </div>

      {/* Body — flex-1 to fill equal height */}
      <div className={`space-y-2.5 flex-1 flex flex-col ${!isConnected ? 'opacity-60' : ''}`}>
        {/* Input card */}
        <div className="glass rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">You Pay</span>
            <span className="text-[10px] text-neutral-500">
              Balance: <span className="text-secondary font-mono">{formatNumber(displayBalance, 4)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="input-field flex-1 bg-transparent border-none p-0 text-xl font-bold"
              min="0"
              step="0.001"
              disabled={!isConnected}
              aria-label="WLTC amount to mint"
            />
            <span className="text-xs font-semibold text-secondary px-2.5 py-1 rounded-lg bg-secondary/10">
              WLTC
            </span>
          </div>
          <div className="flex gap-1.5 mt-2">
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <button
                key={pct}
                onClick={() => setPercentage(pct)}
                disabled={!isConnected}
                className="flex-1 text-[10px] py-1 rounded-md glass hover:bg-primary/10 hover:text-primary transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pct === 1 ? 'MAX' : `${pct * 100}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Arrow divider */}
        <div className="flex justify-center -my-0.5">
          <div className="p-1.5 rounded-lg glass neon-border">
            <ArrowDown className="w-3.5 h-3.5 text-primary" />
          </div>
        </div>

        {/* Output card */}
        <div className="glass rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">You Receive</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex-1 text-xl font-bold font-mono text-primary">
              {output > 0 ? formatNumber(output, 4) : '0.0'}
            </span>
            <span className="text-xs font-semibold text-primary px-2.5 py-1 rounded-lg bg-primary/10">
              LBT
            </span>
          </div>
        </div>

        {/* Details */}
        {numAmount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="glass rounded-xl p-2.5 space-y-1.5 text-[11px]"
          >
            <div className="flex justify-between">
              <span className="text-neutral-500 flex items-center gap-1">
                <Info className="w-3 h-3" /> Exchange Rate
              </span>
              <span className="font-mono">1 WLTC = {(oracleData.ltcPrice * gei).toFixed(2)} LBT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">GEI Factor</span>
              <span className="font-mono text-primary">{(gei * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Oracle</span>
              <span className={`font-mono ${oracleData.usingFallback ? 'text-amber-400' : 'text-emerald-400'}`}>
                {oracleData.usingFallback ? 'Fallback' : 'Primary'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Est. Gas</span>
              <span className="font-mono">{gas.gasPrice} Gwei (~${gas.totalUSD.toFixed(2)})</span>
            </div>
          </motion.div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-1" />

        {/* Action button */}
        {!isConnected ? (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={connectWallet}
            className="w-full py-2.5 text-sm flex items-center justify-center gap-2 rounded-xl font-semibold bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-primary hover:border-primary/50 transition-all"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet to Mint
          </motion.button>
        ) : (
          <motion.button
            whileHover={isValid ? { scale: 1.01 } : {}}
            whileTap={isValid ? { scale: 0.99 } : {}}
            onClick={handleMint}
            disabled={!isValid || pendingTx}
            className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <AnimatePresence mode="wait">
              {status === 'pending' ? (
                <motion.span key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Minting...
                </motion.span>
              ) : status === 'success' ? (
                <motion.span key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Minted!
                </motion.span>
              ) : status === 'error' ? (
                <motion.span key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Failed
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {numAmount > 0 ? `Mint ${formatNumber(output, 2)} LBT` : 'Enter Amount'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
