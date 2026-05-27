import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Gift, Loader2, CheckCircle2, AlertCircle, TrendingUp, Star, Wallet } from 'lucide-react';
import { useMockContract } from '../hooks/useMockContract';
import { formatNumber } from '../utils/contractHelpers';

export default function StakingPanel() {
  const { isConnected, lbtBalance, staking, stake, unstake, claimRewards, pendingTx, connectWallet } = useMockContract();
  const [tab, setTab] = useState<'stake' | 'unstake'>('stake');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const numAmount = parseFloat(amount) || 0;
  const maxAmount = isConnected ? (tab === 'stake' ? lbtBalance : staking.stakedAmount) : 0;
  const isValid = isConnected && numAmount > 0 && numAmount <= maxAmount;

  const handleAction = async () => {
    if (!isValid || pendingTx) return;
    setStatus('pending');
    try {
      const tx = tab === 'stake' ? await stake(numAmount) : await unstake(numAmount);
      setStatus(tx.status === 'confirmed' ? 'success' : 'error');
      if (tx.status === 'confirmed') setAmount('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleClaim = async () => {
    if (!isConnected || staking.pendingRewards <= 0 || pendingTx) return;
    setStatus('pending');
    try {
      const tx = await claimRewards();
      setStatus(tx.status === 'confirmed' ? 'success' : 'error');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const tierColors: Record<string, string> = {
    None: 'text-neutral-500',
    Bronze: 'text-orange-400',
    Silver: 'text-neutral-300',
    Gold: 'text-amber-400',
    Diamond: 'text-cyan-300',
  };

  const displayStaked = isConnected ? staking.stakedAmount : 0;
  const displayRewards = isConnected ? staking.pendingRewards : 0;
  const displayTier = isConnected ? staking.tier : 'None';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-2xl p-4 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-400/10">
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="font-semibold text-sm">Staking</h3>
        </div>
        <div className="flex items-center gap-1">
          <Star className={`w-3.5 h-3.5 ${tierColors[displayTier]}`} />
          <span className={`text-xs font-semibold ${tierColors[displayTier]}`}>{displayTier}</span>
        </div>
      </div>

      <div className={`flex-1 flex flex-col ${!isConnected ? 'opacity-60' : ''}`}>
        {/* Staking Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="glass rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Staked</p>
            <p className="text-base font-bold font-mono text-amber-400">{formatNumber(displayStaked, 2)}</p>
            <p className="text-[9px] text-neutral-600">LBT</p>
          </div>
          <div className="glass rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Rewards</p>
            <motion.p
              key={displayRewards.toFixed(4)}
              className="text-base font-bold font-mono text-emerald-400"
            >
              {formatNumber(displayRewards, 4)}
            </motion.p>
            <p className="text-[9px] text-neutral-600">LBT</p>
          </div>
        </div>

        {/* APR */}
        <div className="glass rounded-xl p-2.5 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] text-neutral-400">Current APR</span>
          </div>
          <span className="text-sm font-bold font-mono text-emerald-400">{staking.apr}%</span>
        </div>

        {/* Claim Button */}
        {isConnected && staking.pendingRewards > 0.0001 && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleClaim}
            disabled={pendingTx}
            className="w-full mb-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors"
          >
            <Gift className="w-3.5 h-3.5" />
            Claim {formatNumber(staking.pendingRewards, 4)} LBT
          </motion.button>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-0.5 glass rounded-xl mb-3">
          {(['stake', 'unstake'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setAmount(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                tab === t ? 'bg-primary/15 text-primary' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {t === 'stake' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              {t === 'stake' ? 'Stake' : 'Unstake'}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="glass rounded-xl p-3 mb-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Amount</span>
            <button
              onClick={() => { if (isConnected) setAmount(maxAmount.toFixed(4)); }}
              disabled={!isConnected}
              className="text-[10px] text-primary hover:text-primary/80 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              MAX: {formatNumber(maxAmount, 2)}
            </button>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="input-field bg-transparent border-none p-0 text-lg font-bold w-full"
            min="0"
            disabled={!isConnected}
            aria-label={`LBT amount to ${tab}`}
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action button */}
        {!isConnected ? (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={connectWallet}
            className="w-full py-2.5 text-sm flex items-center justify-center gap-2 rounded-xl font-semibold bg-gradient-to-r from-amber-400/20 to-primary/20 border border-amber-400/30 text-amber-400 hover:border-amber-400/50 transition-all"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet to Stake
          </motion.button>
        ) : (
          <motion.button
            whileHover={isValid ? { scale: 1.01 } : {}}
            whileTap={isValid ? { scale: 0.99 } : {}}
            onClick={handleAction}
            disabled={!isValid || pendingTx}
            className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <AnimatePresence mode="wait">
              {status === 'pending' ? (
                <motion.span key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </motion.span>
              ) : status === 'success' ? (
                <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Done!
                </motion.span>
              ) : status === 'error' ? (
                <motion.span key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Failed
                </motion.span>
              ) : (
                <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {tab === 'stake' ? 'Stake LBT' : 'Unstake LBT'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
