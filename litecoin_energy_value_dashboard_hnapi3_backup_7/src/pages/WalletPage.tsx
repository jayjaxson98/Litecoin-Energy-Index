import React from 'react';
import { WalletPanel } from '../components/WalletPanel';

const WalletPage: React.FC = () => {
  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>💼 Wallet</h1>
      <p style={{ color: '#A3A3A3', marginBottom: 24 }}>Manage your connected wallet and assets</p>
      <WalletPanel />
    </div>
  );
};

export default WalletPage;
