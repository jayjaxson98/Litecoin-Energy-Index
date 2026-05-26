// ─── TokenActions ─── Mint / Redeem panel

import { useState } from 'react';
import { ArrowDownUp, Coins, ArrowRight } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useContract } from '../hooks/useContract';
import { GlowButton } from './GlowButton';

type Tab = 'mint' | 'redeem';

export function TokenActions() {
  const { isConnected, balance, tokenBalance } = useWallet();
  const { mint, redeem, loading } = useContract();
  const [tab, setTab] = useState<Tab>('mint');
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    try {
      if (tab === 'mint') {
        await mint(amount);
      } else {
        await redeem(amount);
      }
      setAmount('');
    } catch {
      // handled by hook
    }
  };

  const maxAmount = tab === 'mint' ? balance : tokenBalance;

  return (
    <div className="glass rounded-2xl p-6 hover:shadow-[0_0_40px_rgba(158,127,255,0.1)] transition-all duration-500">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Token Actions</h3>
        <ArrowDownUp className="w-5 h-5 text-primary/50" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 mb-5">
        {(['mint', 'redeem'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all
              ${tab === t
                ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 text-white border border-primary/30'
                : 'text-white/30 hover:text-white/50'
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-mono
              placeholder:text-white/15 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20
              transition-all"
          />
          <button
            onClick={() => setAmount(maxAmount.replace(/,/g, ''))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/60 hover:text-primary
              uppercase tracking-wider transition-colors"
          >
            Max
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-white/25 px-1">
          <span>Available: {maxAmount} {tab === 'mint' ? 'LTC' : 'LBT'}</span>
          <span className="flex items-center gap-1">
            <Coins className="w-3 h-3" />
            Rate: {tab === 'mint' ? '1.00' : '0.98'}
          </span>
        </div>

        {/* Preview */}
        {amount && parseFloat(amount) > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-center">
              <p className="text-xs text-white/30">{tab === 'mint' ? 'You Pay' : 'You Burn'}</p>
              <p className="text-sm font-semibold text-white">{amount} {tab === 'mint' ? 'LTC' : 'LBT'}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary/40" />
            <div className="text-center">
              <p className="text-xs text-white/30">{tab === 'mint' ? 'You Receive' : 'You Get'}</p>
              <p className="text-sm font-semibold text-emerald-400">
                {(parseFloat(amount) * (tab === 'mint' ? 1.0 : 0.98)).toFixed(4)} {tab === 'mint' ? 'LBT' : 'LTC'}
              </p>
            </div>
          </div>
        )}

        <GlowButton
          onClick={handleSubmit}
          disabled={!isConnected || !amount || parseFloat(amount) <= 0}
          loading={loading}
          variant={tab === 'mint' ? 'primary' : 'secondary'}
          size="lg"
          className="w-full"
        >
          {!isConnected ? 'Connect Wallet' : tab === 'mint' ? 'Mint LBT' : 'Redeem LBT'}
        </GlowButton>
      </div>
    </div>
  );
}
