import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, Zap, Shield, Clock, CheckCircle2, XCircle, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useLitbreakToken } from '../hooks/useLitbreakToken';
import { useEnergyIndex } from '../hooks/useEnergyIndex';
import { formatNumber } from '../utils/format';

const MintRedeem: React.FC = () => {
  const { connected, connect } = useWallet();
  const { lbtBalance, ltcBalance, mint, redeem, txStatus, txHash, resetTx, previewMint, previewRedeem, totalSupply, totalLtcLocked, minting, redeeming } = useLitbreakToken();
  const { energyFactor, globalIndex } = useEnergyIndex();

  const [mode, setMode] = useState<'mint' | 'redeem'>('mint');
  const [inputAmount, setInputAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const amount = parseFloat(inputAmount) || 0;

  const mintPreview = useMemo(() => previewMint(amount, energyFactor), [amount, energyFactor, previewMint]);
  const redeemPreview = useMemo(() => previewRedeem(amount), [amount, previewRedeem]);

  const handleSubmit = async () => {
    if (!connected) {
      connect();
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    try {
      if (mode === 'mint') {
        await mint(amount, energyFactor);
      } else {
        await redeem(amount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const maxAmount = mode === 'mint' ? ltcBalance : lbtBalance;

  const setPercentage = (pct: number) => {
    setInputAmount((maxAmount * pct / 100).toFixed(mode === 'mint' ? 8 : 4));
  };

  const isValid = amount > 0 && amount <= maxAmount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl neon-border overflow-hidden"
      style={{ background: 'rgba(18, 18, 26, 0.8)' }}
    >
      {/* Mode Toggle */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => { setMode('mint'); setInputAmount(''); resetTx(); }}
          className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
            mode === 'mint' ? 'text-energy' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            Mint LBT
          </span>
          {mode === 'mint' && (
            <motion.div layoutId="mintTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-energy" />
          )}
        </button>
        <button
          onClick={() => { setMode('redeem'); setInputAmount(''); resetTx(); }}
          className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
            mode === 'redeem' ? 'text-accent' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Redeem LTC
          </span>
          {mode === 'redeem' && (
            <motion.div layoutId="mintTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>
      </div>

      <div className="p-6">
        {/* Transaction Status */}
        <AnimatePresence mode="wait">
          {txStatus !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5"
            >
              <div className={`p-4 rounded-xl border ${
                txStatus === 'success' ? 'bg-success/10 border-success/20' :
                txStatus === 'error' ? 'bg-error/10 border-error/20' :
                'bg-primary/10 border-primary/20'
              }`}>
                <div className="flex items-center gap-3">
                  {txStatus === 'pending' && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                  {txStatus === 'confirming' && <Clock className="w-5 h-5 text-warning animate-pulse" />}
                  {txStatus === 'success' && <CheckCircle2 className="w-5 h-5 text-success" />}
                  {txStatus === 'error' && <XCircle className="w-5 h-5 text-error" />}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {txStatus === 'pending' && 'Awaiting signature...'}
                      {txStatus === 'confirming' && 'Confirming transaction...'}
                      {txStatus === 'success' && 'Transaction successful!'}
                      {txStatus === 'error' && 'Transaction failed'}
                    </div>
                    {txHash && (
                      <a href="#" className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary mt-1">
                        <span className="font-mono">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {(txStatus === 'success' || txStatus === 'error') && (
                    <button onClick={resetTx} className="text-xs text-white/40 hover:text-white/70">
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl glass border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50">
                {mode === 'mint' ? 'You deposit' : 'You burn'}
              </span>
              <span className="text-xs text-white/30">
                Balance: <span className="text-white/60 font-mono">
                  {formatNumber(maxAmount, mode === 'mint' ? 4 : 2)} {mode === 'mint' ? 'LTC' : 'LBT'}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={inputAmount}
                onChange={e => setInputAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-mono font-bold text-white outline-none placeholder-white/15"
              />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass border border-white/10">
                <span className="text-lg">{mode === 'mint' ? 'Ł' : '⚡'}</span>
                <span className="text-sm font-semibold text-white/80">
                  {mode === 'mint' ? 'LTC' : 'LBT'}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              {[25, 50, 75, 100].map(pct => (
                <button
                  key={pct}
                  onClick={() => setPercentage(pct)}
                  className="flex-1 py-1 rounded-md text-xs font-medium glass border border-white/5 text-white/40 hover:text-white/70 hover:border-white/15 transition-all"
                >
                  {pct === 100 ? 'MAX' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center -my-1">
            <div className="p-2 rounded-full glass border border-white/10">
              <ArrowDown className="w-4 h-4 text-white/40" />
            </div>
          </div>

          {/* Output */}
          <div className="p-4 rounded-xl glass border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50">
                {mode === 'mint' ? 'You receive' : 'You receive'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-2xl font-mono font-bold" style={{ color: mode === 'mint' ? '#10b981' : '#38bdf8' }}>
                {mode === 'mint'
                  ? formatNumber(mintPreview, 4)
                  : formatNumber(redeemPreview.ltcAmount, 8)
                }
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass border border-white/10">
                <span className="text-lg">{mode === 'mint' ? '⚡' : 'Ł'}</span>
                <span className="text-sm font-semibold text-white/80">
                  {mode === 'mint' ? 'LBT' : 'LTC'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="mt-4 space-y-2 p-3 rounded-xl bg-white/[0.02]">
          {mode === 'mint' ? (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Energy Efficiency Factor</span>
                <span className="text-energy font-mono">{formatNumber(energyFactor, 2)}x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Global Energy Index</span>
                <span className="text-white/60 font-mono">{formatNumber(globalIndex, 1)}¢/kWh</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Exchange Rate</span>
                <span className="text-white/60 font-mono">1 LTC = {formatNumber(energyFactor, 4)} LBT</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Redemption Fee</span>
                <span className="text-warning font-mono">0.30%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Fee Amount</span>
                <span className="text-white/60 font-mono">{formatNumber(redeemPreview.fee, 8)} LTC</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Protocol TVL</span>
                <span className="text-white/60 font-mono">{formatNumber(totalLtcLocked, 2)} LTC</span>
              </div>
            </>
          )}
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={isValid || !connected ? { scale: 1.02 } : {}}
          whileTap={isValid || !connected ? { scale: 0.98 } : {}}
          onClick={handleSubmit}
          disabled={connected && (!isValid || minting || redeeming)}
          className={`w-full mt-5 py-4 rounded-xl font-semibold text-sm transition-all ${
            !connected
              ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/20'
              : isValid
                ? mode === 'mint'
                  ? 'bg-gradient-to-r from-energy to-energy/80 text-white shadow-lg shadow-energy/20'
                  : 'bg-gradient-to-r from-accent to-accent/80 text-white shadow-lg shadow-accent/20'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}
        >
          {!connected
            ? 'Connect Wallet'
            : minting || redeeming
              ? 'Processing...'
              : !isValid && amount > maxAmount
                ? 'Insufficient Balance'
                : !isValid
                  ? 'Enter Amount'
                  : mode === 'mint'
                    ? `Mint ${formatNumber(mintPreview, 4)} LBT`
                    : `Redeem for ${formatNumber(redeemPreview.ltcAmount, 6)} LTC`
          }
        </motion.button>

        {/* Warning */}
        {connected && amount > 0 && amount <= maxAmount && (
          <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-warning/5 border border-warning/10">
            <AlertTriangle className="w-3.5 h-3.5 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-xs text-warning/70">
              {mode === 'mint'
                ? 'LBT minting rate is dynamically adjusted based on the Global Energy Index. Rates may change between transactions.'
                : 'Redemption includes a 0.30% protocol fee. LTC returned is proportional to your share of total supply.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl glass-strong neon-border p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">
                Confirm {mode === 'mint' ? 'Mint' : 'Redemption'}
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-sm text-white/50">{mode === 'mint' ? 'Depositing' : 'Burning'}</span>
                  <span className="text-sm font-mono font-semibold text-white">
                    {formatNumber(amount, mode === 'mint' ? 8 : 4)} {mode === 'mint' ? 'LTC' : 'LBT'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/50">Receiving</span>
                  <span className="text-sm font-mono font-semibold" style={{ color: mode === 'mint' ? '#10b981' : '#38bdf8' }}>
                    {mode === 'mint'
                      ? `${formatNumber(mintPreview, 4)} LBT`
                      : `${formatNumber(redeemPreview.ltcAmount, 8)} LTC`
                    }
                  </span>
                </div>
                {mode === 'redeem' && (
                  <div className="flex justify-between">
                    <span className="text-sm text-white/50">Fee</span>
                    <span className="text-sm font-mono text-warning">{formatNumber(redeemPreview.fee, 8)} LTC</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-xl glass border border-white/10 text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm text-white ${
                    mode === 'mint'
                      ? 'bg-gradient-to-r from-energy to-energy/80'
                      : 'bg-gradient-to-r from-accent to-accent/80'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MintRedeem;
