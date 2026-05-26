import { useState } from 'react';
import { ArrowDownUp, Loader2 } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useWeb3 } from '../contexts/Web3Context';

type Mode = 'mint' | 'redeem';

export function MintRedeem() {
  const { isConnected, connect } = useWallet();
  const { showToast, setTxStatus, setPendingTxHash } = useWeb3();
  const [mode, setMode] = useState<Mode>('mint');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const rate = 0.0847;
  const output = amount ? (parseFloat(amount) * (mode === 'mint' ? 1 / rate : rate)).toFixed(4) : '0.0000';

  const handleSubmit = async () => {
    if (!isConnected) { connect(); return; }
    if (!amount || parseFloat(amount) <= 0) { showToast('Enter a valid amount', 'error'); return; }

    setLoading(true);
    setTxStatus('pending');
    const hash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    setPendingTxHash(hash);

    await new Promise(r => setTimeout(r, 2000));

    setTxStatus('confirmed');
    showToast(`${mode === 'mint' ? 'Minted' : 'Redeemed'} ${output} ${mode === 'mint' ? 'LBT' : 'LTC'} successfully!`, 'success');
    setAmount('');
    setLoading(false);
    setTimeout(() => { setTxStatus('idle'); setPendingTxHash(null); }, 3000);
  };

  return (
    <div className="glass rounded-2xl p-5">
      {/* Tabs */}
      <div className="flex rounded-xl bg-white/5 p-1 mb-4">
        {(['mint', 'redeem'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors capitalize ${
              mode === m ? 'bg-primary text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="space-y-3">
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-neutral-400">You {mode === 'mint' ? 'deposit' : 'burn'}</span>
            <span className="text-[10px] text-neutral-400">{mode === 'mint' ? 'LTC' : 'LBT'}</span>
          </div>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-transparent text-xl font-bold text-white outline-none placeholder:text-neutral-600"
          />
        </div>

        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <ArrowDownUp className="w-4 h-4 text-neutral-400" />
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-neutral-400">You receive</span>
            <span className="text-[10px] text-neutral-400">{mode === 'mint' ? 'LBT' : 'LTC'}</span>
          </div>
          <p className="text-xl font-bold text-white">{output}</p>
        </div>
      </div>

      {/* Rate */}
      <div className="flex items-center justify-between text-xs text-neutral-400 mt-3 mb-4">
        <span>Rate</span>
        <span>1 LTC = {(1 / rate).toFixed(2)} LBT</span>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : isConnected ? `${mode === 'mint' ? 'Mint' : 'Redeem'} Tokens` : 'Connect Wallet'}
      </button>
    </div>
  );
}
