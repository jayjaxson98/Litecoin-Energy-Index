import React from 'react';
import { WalletProvider } from './context/WalletContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ParticleBackground from './components/ParticleBackground';

const App: React.FC = () => {
  return (
    <WalletProvider>
      <ParticleBackground />
      <Layout>
        <Dashboard />
      </Layout>
    </WalletProvider>
  );
};

export default App;
