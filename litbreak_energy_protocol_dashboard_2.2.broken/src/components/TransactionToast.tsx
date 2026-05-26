// ─── TransactionToast ─── Toast notification system

import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { formatHash } from '../lib/format';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  success: 'border-emerald-500/30 bg-emerald-500/5',
  error: 'border-red-500/30 bg-red-500/5',
  info: 'border-secondary/30 bg-secondary/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
};

const iconColorMap = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  info: 'text-secondary',
  warning: 'text-amber-400',
};

export function TransactionToast() {
  const { toasts, removeToast } = useWallet();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={`glass rounded-xl p-4 border ${colorMap[toast.type]}
              animate-[slideIn_0.3s_ease-out] shadow-lg`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColorMap[toast.type]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{toast.title}</p>
                <p className="text-xs text-white/50 mt-0.5">{toast.message}</p>
                {toast.txHash && (
                  <p className="text-[10px] text-primary/60 font-mono mt-1">
                    TX: {formatHash(toast.txHash)}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/20 hover:text-white/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
