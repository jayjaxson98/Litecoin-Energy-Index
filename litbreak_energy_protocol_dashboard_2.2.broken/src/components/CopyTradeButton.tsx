import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Loader2, CheckCircle2 } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

interface CopyTradeButtonProps {
  agentId: string;
  agentName: string;
}

export function CopyTradeButton({ agentId, agentName }: CopyTradeButtonProps) {
  const wallet = useWallet();
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyTrade = async () => {
    if (!wallet.connected) {
      await wallet.connect();
      return;
    }

    setCopying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } finally {
      setCopying(false);
    }
  };

  return (
    <motion.button
      onClick={handleCopyTrade}
      disabled={copying}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {copying ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Subscribing...</span>
        </>
      ) : copied ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>Subscribed to {agentName}</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>Copy Trade</span>
        </>
      )}
    </motion.button>
  );
}
