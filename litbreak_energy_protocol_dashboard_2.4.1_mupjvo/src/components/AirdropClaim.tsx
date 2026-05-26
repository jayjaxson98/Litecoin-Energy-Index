import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

export function AirdropClaim() {
  const wallet = useWallet();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claimableAmount = 1250.00;

  const handleClaim = async () => {
    if (!wallet.connected) return;
    setClaiming(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setClaimed(true);
    } catch (err) {
      setError('Claim failed. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Gift className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">POWER Airdrop</h3>
          <p className="text-xs text-textSecondary">Claim your testnet POWER tokens</p>
        </div>
      </div>

      <div className="glass-card-inner p-4 mb-4 text-center">
        <div className="text-xs text-textSecondary mb-1">Claimable Amount</div>
        <div className="flex items-center justify-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <span className="text-3xl font-bold font-mono text-white">{claimableAmount.toFixed(2)}</span>
          <span className="text-sm text-primary font-semibold">POWER</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20 mb-4">
          <AlertCircle className="w-4 h-4 text-error" />
          <span className="text-sm text-error">{error}</span>
        </div>
      )}

      {claimed ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <div>
            <div className="text-sm font-semibold text-success">Airdrop Claimed!</div>
            <div className="text-xs text-textSecondary">{claimableAmount} POWER added to your wallet</div>
          </div>
        </div>
      ) : (
        <motion.button
          onClick={wallet.connected ? handleClaim : wallet.connect}
          disabled={claiming}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-primary text-white font-bold text-sm"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {claiming ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Claiming...
            </span>
          ) : wallet.connected ? (
            'Claim Airdrop'
          ) : (
            'Connect Wallet to Claim'
          )}
        </motion.button>
      )}
    </motion.div>
  );
}
