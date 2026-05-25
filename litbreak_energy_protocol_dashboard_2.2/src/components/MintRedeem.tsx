/**
 * MintRedeem — Primary user-facing component for minting POWER tokens
 * and redeeming them for LTC.
 *
 * Fixes applied:
 * - Fix #7:  Gas estimate now uses `estimateGas()` instead of hardcoded `~0.001 LTC`
 * - Fix #8:  Pause state gating — submit button disabled when protocol is paused
 * - Fix #9:  Remaining supply display + hard cap progress bar added
 * - Fix #10: Error messages now persist with manual dismiss (X button) instead of 4s auto-dismiss
 * - Fix #14: Error messages decoded through RevertDecoder for user-friendly text
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownUp, Zap, Coins, Loader2, CheckCircle2, AlertCircle, ExternalLink, Fuel, X, AlertTriangle } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useTokenData } from '../hooks/useTokenData';
import { usePauseState } from '../hooks/usePauseState';
import { shortenTxHash, getExplorerTxUrl, PROTOCOL_CONSTANTS } from '../lib/ContractRegistry';
import { decodeRevertReason } from '../lib/RevertDecoder';

type Tab = 'mint' | 'redeem';
type TxState = 'idle' | 'confirming' | 'success' | 'error';

export function MintRedeem() {
  const { connected, address, connect, connecting, balance, powerBalance, estimateGas, contractAddress } = useWallet();
  const { mint, redeem, getMintQuote, getRedeemQuote, getExchangeRate, getProtocolFeeBps, getEscalatorState, loading: txLoading } = useTokenData();
  const { isPaused } = usePauseState();

  const [tab, setTab] = useState<Tab>('mint');
  const [amount, setAmount] = useState('');
  const [txState, setTxState] = useState<TxState>('idle');
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const exchangeRate = getExchangeRate();
  const feeBps = getProtocolFeeBps();

  // ─── Remaining supply calculation (Fix #9) ─────────────────────────────
  const escalatorState = getEscalatorState();
  const remainingSupply = useMemo(() => {
    return Math.max(0, PROTOCOL_CONSTANTS.HARD_CAP - escalatorState.totalSupply);
  }, [escalatorState.totalSupply]);

  const supplyUsedPct = useMemo(() => {
    return (escalatorState.totalSupply / PROTOCOL_CONSTANTS.HARD_CAP) * 100;
  }, [escalatorState.totalSupply]);

  const isHardCapReached = remainingSupply <= 0;

  // ─── Dynamic gas estimation (Fix #7) ───────────────────────────────────
  const estimatedGasLtc = useMemo(() => {
    const selector = tab === 'mint' ? '0x1249c58b' : '0xdb006a75';
    const gasUnits = estimateGas(contractAddress, selector);
    // Convert gas units to LTC cost (simulated gas price: 25 gwei equivalent)
    const gasPrice = 0.000000025;
    return (gasUnits * gasPrice).toFixed(6);
  }, [tab, estimateGas, contractAddress]);

  // Compute quote based on current input
  const quote = useMemo(() => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return null;
    return tab === 'mint' ? getMintQuote(val) : getRedeemQuote(val);
  }, [amount, tab, getMintQuote, getRedeemQuote]);

  const outputAmount = useMemo(() => {
    if (!quote) return '0.00';
    if (tab === 'mint' && 'powerAmount' in quote) {
      return quote.powerAmount.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    if (tab === 'redeem' && 'ltcAmount' in quote) {
      return quote.ltcAmount.toLocaleString(undefined, { maximumFractionDigits: 6 });
    }
    return '0.00';
  }, [quote, tab]);

  const feeDisplay = useMemo(() => {
    if (!quote) return '0.000000';
    return quote.fee.toFixed(6);
  }, [quote]);

  // ─── Check if mint would exceed remaining supply ───────────────────────
  const wouldExceedCap = useMemo(() => {
    if (tab !== 'mint' || !quote || !('powerAmount' in quote)) return false;
    return quote.powerAmount > remainingSupply;
  }, [tab, quote, remainingSupply]);

  // Reset state on tab change
  useEffect(() => {
    setTxState('idle');
    setAmount('');
    setLastTxHash(null);
    setErrorMsg(null);
  }, [tab]);

  // ─── Manual error dismiss (Fix #10) ────────────────────────────────────
  const dismissError = useCallback(() => {
    setTxState('idle');
    setErrorMsg(null);
  }, []);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0 || !address) return;

    setTxState('confirming');
    setErrorMsg(null);
    setLastTxHash(null);

    try {
      if (tab === 'mint') {
        const result = await mint({
          ltcAmount: parseFloat(amount),
          userAddress: address,
          slippageBps: 100,
        });

        if (result.success) {
          setTxState('success');
          setLastTxHash(result.txHash);
          setTimeout(() => {
            setTxState('idle');
            setAmount('');
            setLastTxHash(null);
          }, 5000);
        } else {
          setTxState('error');
          setErrorMsg(decodeRevertReason(new Error(result.error || 'Transaction failed')));
        }
      } else {
        const result = await redeem({
          powerAmount: parseFloat(amount),
          userAddress: address,
          slippageBps: 100,
        });

        if (result.success) {
          setTxState('success');
          setLastTxHash(result.txHash);
          setTimeout(() => {
            setTxState('idle');
            setAmount('');
            setLastTxHash(null);
          }, 5000);
        } else {
          setTxState('error');
          setErrorMsg(decodeRevertReason(new Error(result.error || 'Transaction failed')));
        }
      }
    } catch (err) {
      setTxState('error');
      setErrorMsg(decodeRevertReason(err));
    }
  };

  const handleMaxClick = () => {
    if (tab === 'mint') {
      setAmount(Math.max(0, balance - 0.01).toFixed(4)); // Reserve gas
    } else {
      setAmount(powerBalance.toFixed(2));
    }
  };

  // ─── Determine if submit should be disabled ────────────────────────────
  const isSubmitDisabled = useMemo(() => {
    if (!connected) return false; // "Connect Wallet" button is always enabled
    if (isPaused) return true;
    if (isHardCapReached && tab === 'mint') return true;
    if (wouldExceedCap) return true;
    if (!amount || parseFloat(amount) <= 0) return true;
    if (connecting || txLoading) return true;
    return false;
  }, [connected, isPaused, isHardCapReached, tab, wouldExceedCap, amount, connecting, txLoading]);

  // ─── Submit button label ───────────────────────────────────────────────
  const submitLabel = useMemo(() => {
    if (connecting) return null; // handled by spinner
    if (!connected) return 'Connect Wallet';
    if (isPaused) return '⚠️ Protocol Paused';
    if (isHardCapReached && tab === 'mint') return '🚫 Hard Cap Reached';
    if (wouldExceedCap) return '⚠️ Exceeds Remaining Supply';
    return tab === 'mint' ? 'Mint POWER' : 'Redeem LTC';
  }, [connecting, connected, isPaused, isHardCapReached, tab, wouldExceedCap]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card overflow-hidden"
    >
      {/* Tabs */}
      <div className="flex border-b border-white/[0.06]">
        {(['mint', 'redeem'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-all relative ${
              tab === t ? 'text-white' : 'text-textSecondary hover:text-white'
            }`}
          >
            {t === 'mint' ? '⚡ Mint POWER' : '🔄 Redeem LTC'}
            {tab === t && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary"
              />
            )}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {/* ─── Pause Warning (Fix #8) ─────────────────────────────────────── */}
        {isPaused && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
            <span className="text-xs text-warning font-medium">
              Protocol is paused — transactions are disabled
            </span>
          </div>
        )}

        {/* ─── Supply Progress (Fix #9) ───────────────────────────────────── */}
        {tab === 'mint' && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-textSecondary">Supply Minted</span>
              <span className="text-white font-mono">
                {escalatorState.totalSupply.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                <span className="text-textSecondary"> / {PROTOCOL_CONSTANTS.HARD_CAP.toLocaleString()}</span>
              </span>
            </div>
            <div className="w-full h-1.5 bg-surface/60 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-all duration-700 ${
                  supplyUsedPct > 95
                    ? 'bg-gradient-to-r from-error/80 to-error'
                    : supplyUsedPct > 80
                      ? 'bg-gradient-to-r from-warning/80 to-warning'
                      : 'bg-gradient-to-r from-primary to-secondary'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, supplyUsedPct)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-textSecondary">
                {supplyUsedPct.toFixed(2)}% minted
              </span>
              <span className={`font-mono ${remainingSupply < 1_000_000 ? 'text-warning' : 'text-success'}`}>
                {remainingSupply.toLocaleString(undefined, { maximumFractionDigits: 0 })} remaining
              </span>
            </div>
          </div>
        )}

        {/* Balance Display */}
        {connected && (
          <div className="flex justify-between text-xs text-textSecondary">
            <span>Available Balance</span>
            <button onClick={handleMaxClick} className="text-primary hover:text-primary/80 transition-colors font-medium">
              {tab === 'mint'
                ? `${balance.toFixed(4)} LTC`
                : `${powerBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} POWER`
              }
              <span className="ml-1 text-[10px] opacity-60">(MAX)</span>
            </button>
          </div>
        )}

        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs text-textSecondary">
            {tab === 'mint' ? 'LTC Amount' : 'POWER Amount'}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="any"
              disabled={isPaused}
              className="w-full bg-surface/60 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-lg font-mono placeholder:text-textSecondary/40 focus:outline-none focus:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.04]">
              {tab === 'mint' ? (
                <Coins className="w-3.5 h-3.5 text-secondary" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-primary" />
              )}
              <span className="text-xs font-medium text-white">
                {tab === 'mint' ? 'LTC' : 'POWER'}
              </span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <button
            onClick={() => setTab(tab === 'mint' ? 'redeem' : 'mint')}
            className="w-8 h-8 rounded-full bg-surface/80 border border-white/[0.08] flex items-center justify-center hover:border-primary/30 transition-colors group"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-textSecondary group-hover:text-primary transition-colors" />
          </button>
        </div>

        {/* Output */}
        <div className="space-y-2">
          <label className="text-xs text-textSecondary">
            {tab === 'mint' ? 'POWER Received' : 'LTC Received'}
          </label>
          <div className="bg-surface/40 border border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-lg font-mono text-white">{outputAmount}</span>
            <span className="text-xs text-textSecondary">
              {tab === 'mint' ? 'POWER' : 'LTC'}
            </span>
          </div>
        </div>

        {/* ─── Exceeds Cap Warning ────────────────────────────────────────── */}
        {wouldExceedCap && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-error/10 border border-error/20">
            <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
            <span className="text-xs text-error">
              This mint would exceed the remaining supply of {remainingSupply.toLocaleString()} POWER. Reduce the amount.
            </span>
          </div>
        )}

        {/* Rate & Fee Info */}
        <div className="bg-surface/30 rounded-lg p-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-textSecondary">Exchange Rate</span>
            <span className="text-white font-mono">1 LTC = {exchangeRate.toFixed(2)} POWER</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-textSecondary">Protocol Fee</span>
            <span className="text-white font-mono">{(feeBps / 100).toFixed(1)}% ({feeDisplay} LTC)</span>
          </div>
          {tab === 'mint' && quote && 'energyAdjustment' in quote && (
            <div className="flex justify-between text-xs">
              <span className="text-textSecondary">Energy Adjustment</span>
              <span className="text-success font-mono">+{quote.energyAdjustment.toFixed(1)}%</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-textSecondary flex items-center gap-1">
              <Fuel className="w-3 h-3" /> Est. Gas
            </span>
            <span className="text-white font-mono">~{estimatedGasLtc} LTC</span>
          </div>
        </div>

        {/* Action Button */}
        <AnimatePresence mode="wait">
          {txState === 'idle' && (
            <motion.button
              key="action"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={connected ? handleSubmit : connect}
              disabled={isSubmitDisabled}
              className="w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
            >
              {connecting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </span>
              ) : (
                submitLabel
              )}
            </motion.button>
          )}

          {txState === 'confirming' && (
            <motion.div
              key="confirming"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full py-3 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center gap-1"
            >
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm text-primary font-medium">Confirming Transaction...</span>
              </div>
              <span className="text-[10px] text-primary/60">Waiting for block confirmation</span>
            </motion.div>
          )}

          {txState === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full py-3 rounded-xl bg-success/10 border border-success/20 flex flex-col items-center gap-1"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm text-success font-medium">Transaction Successful!</span>
              </div>
              {lastTxHash && (
                <a
                  href={getExplorerTxUrl(lastTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-success/70 hover:text-success flex items-center gap-1 transition-colors"
                >
                  {shortenTxHash(lastTxHash)}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </motion.div>
          )}

          {/* Fix #10: Error now persists with manual dismiss button */}
          {txState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full py-3 px-4 rounded-xl bg-error/10 border border-error/20 relative"
            >
              <button
                onClick={dismissError}
                className="absolute top-2 right-2 text-error/50 hover:text-error transition-colors"
                aria-label="Dismiss error"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex flex-col items-center gap-1 pr-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-error" />
                  <span className="text-sm text-error font-medium">Transaction Failed</span>
                </div>
                {errorMsg && (
                  <span className="text-[11px] text-error/80 text-center leading-relaxed">{errorMsg}</span>
                )}
                <button
                  onClick={dismissError}
                  className="mt-1 text-[10px] text-error/50 hover:text-error/80 transition-colors underline"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
