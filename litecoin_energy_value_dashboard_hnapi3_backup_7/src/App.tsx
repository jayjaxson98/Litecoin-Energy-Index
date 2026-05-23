import React, { useState, useCallback } from 'react';
import { WalletProvider } from './context/WalletContext';
import { RegionProvider } from './context/RegionContext';
import { useWalletContext } from './context/WalletContext';
import { useDeFiData } from './hooks/useDeFiData';
import type { TimeRange } from './types/utx';
import type { WalletTransaction } from './types/wallet';

import { HomeView }            from './components/HomeView';
import { EnergyIndexView }     from './components/EnergyIndexView';
import { DeFiChartsView }      from './components/DeFiChartsView';
import { EnergySwapsView }     from './components/EnergySwapsView';
import { RegionalMarketsView } from './components/RegionalMarketsView';
import { WalletPanel }         from './components/WalletPanel';
import { NetworkVolumeView }   from './components/NetworkVolumeView';
import RankSystem              from './pages/RankSystem';

type DashboardTab =
  | 'home' | 'energy-index' | 'defi-charts' | 'energy-swaps'
  | 'regional-markets' | 'network-volume' | 'rank-system';

const NAV_ITEMS = [
  { id: 'home'             as DashboardTab, label: 'Home',             icon: '🏠' },
  { id: 'energy-index'     as DashboardTab, label: 'Energy Index',     icon: '⚡' },
  { id: 'defi-charts'      as DashboardTab, label: 'DeFi Charts',      icon: '📈' },
  { id: 'energy-swaps'     as DashboardTab, label: 'Energy Swaps',     icon: '🔄' },
  { id: 'regional-markets' as DashboardTab, label: 'Regional Markets', icon: '🌍' },
  { id: 'network-volume'   as DashboardTab, label: 'Network Volume',   icon: '📊' },
  { id: 'rank-system'      as DashboardTab, label: 'Rank System',      icon: '🏆' },
];

const AppShell: React.FC = () => {
  const [activeTab, setActiveTab]       = useState<DashboardTab>('home');
  const [currentRange, setCurrentRange] = useState<TimeRange>('24H');
  const wallet = useWalletContext();

  const { ltcPrice, priceHistory, isLoading, energyIndex } = useDeFiData(currentRange);

  const handleRangeChange    = useCallback((range: TimeRange) => setCurrentRange(range), []);
  const handleAddTransaction = useCallback((tx: WalletTransaction) => wallet.addTransaction(tx), [wallet]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#171717', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      {/* Sidebar */}
      <nav
        aria-label="Main navigation"
        style={{ width: 200, flexShrink: 0, background: '#1a1a1a', borderRight: '1px solid #2F2F2F', display: 'flex', flexDirection: 'column', padding: '0 0 16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 16px 16px', borderBottom: '1px solid #2F2F2F', marginBottom: 8 }}>
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>Litbreak</span>
        </div>
        <div style={{ flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              aria-current={activeTab === item.id ? 'page' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 16px', border: 'none', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.15s ease', textAlign: 'left',
                background: activeTab === item.id ? 'rgba(158,127,255,0.15)' : 'transparent',
                borderLeft: activeTab === item.id ? '3px solid #9E7FFF' : '3px solid transparent',
                color: activeTab === item.id ? '#9E7FFF' : '#A3A3A3',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: '12px 16px 0', borderTop: '1px solid #2F2F2F', marginTop: 8 }}>
          <div style={{ color: '#A3A3A3', fontSize: '0.7rem' }}>Litbreak v1.0</div>
          <div style={{ color: '#3F3F3F', fontSize: '0.65rem', marginTop: 2 }}>Litecoin Energy Protocol</div>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', background: '#171717' }}>
        {activeTab === 'home'             && <HomeView energyIndex={energyIndex} isLoading={isLoading} onNavigate={(t) => setActiveTab(t as DashboardTab)} walletConnected={wallet.status === 'connected'} />}
        {activeTab === 'energy-index'     && <EnergyIndexView energyIndex={energyIndex} priceHistory={priceHistory} isLoading={isLoading} onRangeChange={handleRangeChange} currentRange={currentRange} />}
        {activeTab === 'defi-charts'      && <DeFiChartsView priceHistory={priceHistory} ltcPrice={ltcPrice} isLoading={isLoading} onRangeChange={handleRangeChange} currentRange={currentRange} regionRate={0.12} />}
        {activeTab === 'energy-swaps'     && <EnergySwapsView energyIndex={energyIndex} walletAddress={wallet.address} onAddTransaction={handleAddTransaction} />}
        {activeTab === 'regional-markets' && <RegionalMarketsView energyIndex={energyIndex} />}
        {activeTab === 'network-volume'   && <NetworkVolumeView externalRange={currentRange} onRangeChange={handleRangeChange} />}
        {activeTab === 'rank-system'      && <RankSystem />}
      </main>

      <WalletPanel />
    </div>
  );
};

const App: React.FC = () => (
  <WalletProvider>
    <RegionProvider>
      <AppShell />
    </RegionProvider>
  </WalletProvider>
);

export default App;
