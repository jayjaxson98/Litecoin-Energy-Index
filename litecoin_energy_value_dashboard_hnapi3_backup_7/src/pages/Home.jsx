import React from 'react';
import { useWalletContext } from '../context/WalletContext';

const Home = () => {
  const { status, address, balances } = useWalletContext();
  const isConnected = status === 'connected';

  return (
    <div style={{ padding: 24, color: '#fff', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#9E7FFF', marginBottom: 16 }}>Home</h2>
      {isConnected ? (
        <div>
          <p style={{ color: '#A3A3A3', fontSize: '0.85rem', marginBottom: 8 }}>
            Connected: <span style={{ color: '#10b981', fontFamily: 'monospace' }}>{address}</span>
          </p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {balances.map((b) => (
              <li key={b.symbol} style={{ color: '#A3A3A3', fontSize: '0.85rem', marginBottom: 4 }}>
                {b.symbol}: <span style={{ color: '#fff' }}>{b.amount}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p style={{ color: '#A3A3A3', fontSize: '0.85rem' }}>Wallet not connected.</p>
      )}
    </div>
  );
};

export default Home;
