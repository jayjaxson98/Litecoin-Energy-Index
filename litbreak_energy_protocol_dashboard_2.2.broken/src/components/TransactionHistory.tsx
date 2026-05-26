// ─── TransactionHistory ─── Recent transaction list

import { Clock, ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useWeb3 } from '../contexts/Web3Context';
import { formatHash, formatTimeAgo } from '../lib/format';

const statusIcons = {
  pending: Loader2,
  confirmed: CheckCircle,
  failed: XCircle,
};

const statusColors = {
  pending: 'text-amber-400',
  confirmed: 'text-emerald-400',
  failed: 'text-red-400',
};

const typeLabels: Record<string, string> = {
  mint: 'Mint LBT',
  redeem: 'Redeem LBT',
  stake: 'Stake',
  unstake: 'Unstake',
  claim: 'Claim Rewards',
};

export function TransactionHistory() {
  const { transactions } = useWallet();
  const { network } = useWeb3();

  return (
    <div className="glass rounded-2xl p-6 hover:shadow-[0_0_40px_rgba(158,127,255,0.1)] transition-all duration-500">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Recent Transactions</h3>
        <Clock className="w-5 h-5 text-primary/50" />
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-white/10 mx-auto mb-2" />
          <p className="text-xs text-white/20">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.slice(0, 8).map((tx) => {
            const StatusIcon = statusIcons[tx.status];
            return (
              <div
                key={tx.hash}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5
                  hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center gap-3">
                  <StatusIcon className={`w-4 h-4 ${statusColors[tx.status]} ${tx.status === 'pending' ? 'animate-spin' : ''}`} />
                  <div>
                    <p className="text-xs font-semibold text-white">{typeLabels[tx.type] ?? tx.type}</p>
                    <p className="text-[10px] text-white/25 font-mono">{formatHash(tx.hash)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-white">{tx.amount} LBT</p>
                    <p className="text-[10px] text-white/20">{formatTimeAgo(tx.timestamp)}</p>
                  </div>
                  <a
                    href={`${network.explorerUrl}/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/15 hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
