import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ExternalLink, X } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

interface ToastData {
  id: string;
  type: 'pending' | 'confirmed' | 'failed';
  message: string;
  hash?: string;
  autoClose?: number;
}

export function TransactionToast() {
  const { transactions } = useWallet();
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Watch for new transactions and create toasts
  useEffect(() => {
    if (transactions.length === 0) return;

    const latest = transactions[0];
    const toastId = `toast-${latest.id}`;

    // Check if toast already exists
    setToasts(prev => {
      if (prev.some(t => t.id === toastId)) return prev;

      const statusMap = {
        pending: { type: 'pending' as const, message: `Transaction ${latest.type}: ${latest.amount}` },
        confirmed: { type: 'confirmed' as const, message: `${latest.type} confirmed: ${latest.amount}` },
        failed: { type: 'failed' as const, message: `${latest.type} failed: ${latest.amount}` },
      };

      const info = statusMap[latest.status];
      return [
        ...prev,
        {
          id: toastId,
          type: info.type,
          message: info.message,
          hash: latest.hash,
          autoClose: latest.status === 'confirmed' ? 5000 : latest.status === 'failed' ? 8000 : undefined,
        },
      ];
    });
  }, [transactions]);

  // Auto-close toasts
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    toasts.forEach(toast => {
      if (toast.autoClose) {
        const timer = setTimeout(() => {
          removeToast(toast.id);
        }, toast.autoClose);
        timers.push(timer);
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getIcon = (type: ToastData['type']) => {
    switch (type) {
      case 'pending':
        return <Loader2 className="w-5 h-5 text-secondary animate-spin" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-error" />;
    }
  };

  const getBorderColor = (type: ToastData['type']) => {
    switch (type) {
      case 'pending': return 'border-secondary/30';
      case 'confirmed': return 'border-success/30';
      case 'failed': return 'border-error/30';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`glass-card p-4 border ${getBorderColor(toast.type)} flex items-start gap-3`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white capitalize">
                {toast.message}
              </p>
              {toast.hash && (
                <a
                  href={`https://explorer.litvm.test/tx/${toast.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 mt-1 transition-colors"
                >
                  View on Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
