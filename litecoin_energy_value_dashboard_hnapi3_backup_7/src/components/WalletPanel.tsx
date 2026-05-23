import React, { useState } from 'react';
import { useWalletContext } from '../context/WalletContext';

const WALLET_TYPES = [
  { id: 'metamask', label: 'MetaMask', icon: '🦊' },
  { id: 'walletconnect', label: 'WalletConnect', icon: '🔗' },
  { id: 'coinbase', label: 'Coinbase', icon: '🔵' },
];

export const WalletPanel: React.FC = () => {
  const { status, address, network, balances, transactions, isLoading, connect, disconnect, refreshBalances } = useWalletContext();
  const [open, setOpen] = useState(false);

  const shortAddr = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';

  return (
    <>
      {/* Trigger button */}
      <button type="button" onClick={() => setOpen(true)}
        style={{ position: 'fixed', top: 16, right: 16, zIndex: 100,
          padding: '8px 16px', borderRadius: 10, border: '1px solid #2F2F2F',
          background: status === 'connected' ? 'rgba(16,185,129,0.15)' : '#1e1e1e',
          color: status === 'connected' ? '#10b981' : '#fff',
          cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'connected' ? '#10b981' : '#A3A3A3', display: 'inline-block' }} />
        {status === 'connected' ? shortAddr : status === 'connecting' ? 'Connecting…' : 'Connect Wallet'}
      </button>

      {/* Panel overlay */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div style={{ width: 360, background: '#1a1a1a', borderLeft: '1px solid #2F2F2F', height: '100%', overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>Wallet</span>
              <button type="button" onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', color: '#A3A3A3', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {status === 'disconnected' && (
              <div>
                <p style={{ color: '#A3A3A3', fontSize: '0.85rem', marginBottom: 16 }}>Choose a wallet to connect</p>
                {WALLET_TYPES.map((w) => (
                  <button key={w.id} type="button" onClick={() => connect(w.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 10,
                      background: '#262626', border: '1px solid #2F2F2F', borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                    <span style={{ fontSize: '1.3rem' }}>{w.icon}</span>{w.label}
                  </button>
                ))}
              </div>
            )}

            {status === 'connecting' && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#A3A3A3' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
                <div>Connecting…</div>
              </div>
            )}

            {status === 'connected' && (
              <div>
                {/* Address */}
                <div style={{ background: '#262626', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ color: '#A3A3A3', fontSize: '0.75rem', marginBottom: 4 }}>Address</div>
                  <div style={{ color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{address}</div>
                </div>

                {/* Network */}
                <div style={{ background: '#262626', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ color: '#A3A3A3', fontSize: '0.75rem', marginBottom: 4 }}>Network</div>
                  <div style={{ color: '#10b981', fontWeight: 600 }}>{network?.name}</div>
                </div>

                {/* Balances */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>Balances</span>
                    <button type="button" onClick={refreshBalances} disabled={isLoading}
                      style={{ background: 'none', border: 'none', color: '#9E7FFF', cursor: 'pointer', fontSize: '0.8rem' }}>
                      {isLoading ? '…' : '↻ Refresh'}
                    </button>
                  </div>
                  {balances.map((b) => (
                    <div key={b.symbol} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#262626', borderRadius: 8, marginBottom: 8 }}>
                      <span style={{ color: '#fff', fontWeight: 600 }}>{b.symbol}</span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#fff', fontSize: '0.9rem' }}>{b.amount}</div>
                        <div style={{ color: '#A3A3A3', fontSize: '0.75rem' }}>${(parseFloat(b.amount) * b.usdValue).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Transactions */}
                {transactions.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: '#fff', fontWeight: 600, marginBottom: 10 }}>Recent Transactions</div>
                    {transactions.slice(0, 5).map((tx) => (
                      <div key={tx.hash} style={{ padding: '10px 14px', background: '#262626', borderRadius: 8, marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ color: '#fff', fontSize: '0.8rem', textTransform: 'capitalize' }}>{tx.type}</span>
                          <span style={{ fontSize: '0.75rem', color: tx.status === 'confirmed' ? '#10b981' : tx.status === 'pending' ? '#f59e0b' : '#ef4444' }}>
                            {tx.status}
                          </span>
                        </div>
                        <div style={{ color: '#A3A3A3', fontSize: '0.75rem' }}>{tx.amount} {tx.symbol}</div>
                        <div style={{ color: '#2F2F2F', fontSize: '0.65rem', fontFamily: 'monospace', marginTop: 2 }}>{tx.hash.slice(0, 20)}…</div>
                      </div>
                    ))}
                  </div>
                )}

                <button type="button" onClick={disconnect}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
