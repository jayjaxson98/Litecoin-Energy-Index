import React, { useState } from 'react';
import { X, Search, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchTokenByContract, type TokenData } from '../hooks/useTokenData';

interface AddTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (token: TokenData) => void;
}

const POPULAR = [
  { address: '0xLTC',  symbol: 'LTC',  name: 'Litecoin' },
  { address: '0xWBTC', symbol: 'WBTC', name: 'Wrapped Bitcoin' },
  { address: '0xUSDC', symbol: 'USDC', name: 'USD Coin' },
  { address: '0xETH',  symbol: 'ETH',  name: 'Ethereum' },
];

const AddTokenModal: React.FC<AddTokenModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [query, setQuery]     = useState('');
  const [result, setResult]   = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [added, setAdded]     = useState(false);

  if (!isOpen) return null;

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(null); setResult(null); setAdded(false);
    const data = await fetchTokenByContract(query.trim());
    if (!data) setError('Token not found. Try a valid contract address.');
    else setResult(data);
    setLoading(false);
  };

  const handleAdd = (token: TokenData) => {
    onAdd(token);
    setAdded(true);
    setTimeout(onClose, 800);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#1e1e1e', border: '1px solid #2F2F2F', borderRadius: 16, padding: 24, width: 420, maxWidth: '95vw' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>Add Token</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#A3A3A3' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Contract address or symbol…"
            style={{ flex: 1, background: '#262626', border: '1px solid #2F2F2F', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
          <button onClick={search} disabled={loading}
            style={{ background: 'rgba(158,127,255,0.15)', border: '1px solid #9E7FFF', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: '#9E7FFF' }}>
            <Search size={16} />
          </button>
        </div>

        {loading && <div style={{ color: '#A3A3A3', fontSize: '0.82rem', textAlign: 'center', padding: 12 }}>Searching…</div>}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontSize: '0.82rem', marginBottom: 12 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {result && !added && (
          <div style={{ background: '#262626', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid #9E7FFF33' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(158,127,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9E7FFF', fontWeight: 800 }}>
                {result.symbol[0]}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700 }}>{result.symbol}</div>
                <div style={{ color: '#A3A3A3', fontSize: '0.75rem' }}>{result.name}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ color: '#fff', fontWeight: 700 }}>${result.price.toLocaleString()}</div>
                <div style={{ color: result.priceChange24h >= 0 ? '#10b981' : '#ef4444', fontSize: '0.75rem' }}>
                  {result.priceChange24h >= 0 ? '+' : ''}{result.priceChange24h.toFixed(2)}%
                </div>
              </div>
            </div>
            <button onClick={() => handleAdd(result)}
              style={{ width: '100%', marginTop: 12, padding: '8px 0', background: 'rgba(158,127,255,0.15)', border: '1px solid #9E7FFF', borderRadius: 8, color: '#9E7FFF', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.85rem' }}>
              <Plus size={14} /> Add Token
            </button>
          </div>
        )}

        {added && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: '0.85rem', marginBottom: 12 }}>
            <CheckCircle size={14} /> Token added successfully!
          </div>
        )}

        <div>
          <div style={{ color: '#A3A3A3', fontSize: '0.75rem', marginBottom: 8 }}>Popular Tokens</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {POPULAR.map((t) => (
              <button key={t.address} onClick={() => { setQuery(t.address); }}
                style={{ background: '#262626', border: '1px solid #2F2F2F', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.82rem' }}>{t.symbol}</div>
                <div style={{ color: '#A3A3A3', fontSize: '0.7rem' }}>{t.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTokenModal;
