import { useState } from 'react';
import { FileCode, Loader2, Copy, Check } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useWeb3 } from '../contexts/Web3Context';

const FUNCTIONS = [
  { name: 'totalSupply', type: 'view', returns: 'uint256' },
  { name: 'energyIndex', type: 'view', returns: 'uint256' },
  { name: 'balanceOf', type: 'view', returns: 'uint256', params: ['address'] },
  { name: 'mint', type: 'write', params: ['uint256'] },
  { name: 'redeem', type: 'write', params: ['uint256'] },
];

export function ContractInteraction() {
  const { isConnected } = useWallet();
  const { showToast } = useWeb3();
  const [selectedFn, setSelectedFn] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fn = FUNCTIONS[selectedFn];

  const execute = async () => {
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 1500));

    if (fn.type === 'view') {
      const mockResults: Record<string, string> = {
        totalSupply: '8420000000000000000000000',
        energyIndex: '84700000000000000',
        balanceOf: '15000000000000000000',
      };
      setResult(mockResults[fn.name] ?? '0');
    } else {
      setResult('Transaction confirmed ✓');
      showToast(`${fn.name}() executed successfully`, 'success');
    }
    setLoading(false);
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileCode className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-white">Contract</h3>
      </div>

      <div className="space-y-3">
        <select
          value={selectedFn}
          onChange={e => { setSelectedFn(Number(e.target.value)); setResult(null); }}
          className="w-full bg-white/5 border border-border rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
        >
          {FUNCTIONS.map((f, i) => (
            <option key={f.name} value={i}>
              {f.name}() — {f.type}
            </option>
          ))}
        </select>

        <button
          onClick={execute}
          disabled={loading || (fn.type === 'write' && !isConnected)}
          className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/80 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Executing…</> : `Call ${fn.name}()`}
        </button>

        {result && (
          <div className="bg-white/5 rounded-xl p-3 flex items-start justify-between gap-2">
            <code className="text-xs text-success font-mono break-all">{result}</code>
            <button onClick={copyResult} className="shrink-0 p-1 rounded hover:bg-white/5 text-neutral-400">
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
