import React from 'react';
import { useWalletContext } from '../context/WalletContext';

const Dashboard = () => {
  const { status, address, balances, transactions } = useWalletContext();
  const isConnected = status === 'connected';

  return (
    <div style={{ padding: 24, color: '#fff', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#9E7FFF', marginBottom: 16 }}>Dashboard</h2>

      {isConnected ? (
        <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#A3A3A3', fontSize: '0.75rem', marginBottom: 4 }}>WALLET</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#38bdf8' }}>
              {address}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#A3A3A3', fontSize: '0.75rem', marginBottom: 8 }}>BALANCES</div>
            {balances.map((b) => (
              <div
                key={b.symbol}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#262626',
                  borderRadius: 8,
                  marginBottom: 6,
                  border: '1px solid #2F2F2F',
                }}
              >
                <span style={{ color: '#A3A3A3', fontSize: '0.85rem' }}>{b.symbol}</span>
                <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{b.amount}</span>
              </div>
            ))}
          </div>

          {transactions.length > 0 && (
            <div>
              <div style={{ color: '#A3A3A3', fontSize: '0.75rem', marginBottom: 8 }}>
                RECENT TRANSACTIONS
              </div>
              {transactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.hash}
                  style={{
                    padding: '8px 12px',
                    background: '#262626',
                    borderRadius: 8,
                    marginBottom: 6,
                    border: '1px solid #2F2F2F',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ color: '#9E7FFF', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                      {tx.type}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color:
                          tx.status === 'confirmed'
                            ? '#10b981'
                            : tx.status === 'pending'
                            ? '#f59e0b'
                            : '#ef4444',
                      }}
                    >
                      {tx.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#A3A3A3' }}>
                    {tx.hash.slice(0, 20)}…
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p style={{ color: '#A3A3A3', fontSize: '0.85rem' }}>
          Connect your wallet to view dashboard data.
        </p>
      )}
    </div>
  );
};

export default Dashboard;
