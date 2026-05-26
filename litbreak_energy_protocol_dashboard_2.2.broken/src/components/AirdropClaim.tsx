import { useState } from 'react';
import { Gift, Loader2, CheckCircle } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useWeb3 } from '../contexts/Web3Context';

export function AirdropClaim() {
  const { isConnected, connect } = useWallet();
  const { showToast } = useWeb3();
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);

  const claimableAmount = 250;

  const handleClaim = async () => {
    if (!isConnected) { connect(); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setClaimed(true);
    setLoading(false);
    showToast(`Claimed ${claimableAmount} LBT tokens!`, 'success');
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-5 h-5 text-accent" />
        <h3 className="text-sm font-semibold text-white">Airdrop</h3>
      </div>

      <div className="text-center py-3">
        {claimed ? (
          <>
            <CheckCircle className="w-10 h-10 text-success mx-auto mb-2" />
            <p className="text-sm font-medium text-success">Claimed!</p>
            <p className="text-xs text-neutral-400 mt-1">{claimableAmount} LBT added to your wallet</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-white mb-1">{claimableAmount} LBT</p>
            <p className="text-xs text-neutral-400 mb-4">Available to claim</p>
            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent to-primary text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Claiming…</> : isConnected ? 'Claim Airdrop' : 'Connect to Claim'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
