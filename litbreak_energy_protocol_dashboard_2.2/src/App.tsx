import { WalletProvider } from './contexts/WalletContext';
import { Background } from './components/Background';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { EnergyIndex } from './components/EnergyIndex';
import { MintRedeem } from './components/MintRedeem';
import { CountryRates } from './components/CountryRates';
import { MiningStats } from './components/MiningStats';
import { NetworkBadge } from './components/NetworkBadge';

export default function App() {
  return (
    <WalletProvider>
      <div className="min-h-screen relative">
        <Background />
        <div className="relative z-10">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            <StatsCards />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <EnergyIndex />
              </div>
              <div>
                <MintRedeem />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CountryRates />
              </div>
              <div className="space-y-6">
                <MiningStats />
                <NetworkBadge />
              </div>
            </div>
          </main>
        </div>
      </div>
    </WalletProvider>
  );
}
