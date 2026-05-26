# Litbreak Energy Protocol — Configuration Guide

## 1. Chainlink Oracle Feed Configuration

### Setting Feed Addresses

The PowerToken contract accepts Chainlink-compatible oracle addresses in the constructor:

```solidity
constructor(
    address _wLTC,           // Wrapped LTC token address
    address _ltcUsdFeed,     // Chainlink LTC/USD price feed
    address _energyIndexFeed,// Chainlink energy index feed
    address _feeRecipient,   // Protocol fee recipient
    uint256 _initialMiningEfficiency // Mining efficiency ×1e8
)
```

### Updating Oracles Post-Deployment

```solidity
// Only GOVERNANCE_ROLE can update
powerToken.setOracles(newLtcUsdFeed, newEnergyIndexFeed);
```

### Staleness Configuration

```solidity
// Set max oracle data age (60s to 86400s)
powerToken.setOracleMaxStaleness(3600); // 1 hour

// Check if oracle is currently fresh
bool fresh = powerToken.isOracleFresh();
```

### Fallback Behavior

When the oracle returns stale data:
1. The contract uses the last cached valid price
2. An `OracleFallbackUsed` event is emitted
3. If no cached price exists, the transaction reverts

---

## 2. LitVM Wallet Adapter Setup

### Installation

The wallet adapter is integrated via React Context in `src/contexts/WalletContext.tsx`.

### Configuration in `main.tsx`

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletProvider } from './contexts/WalletContext';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <App />
    </WalletProvider>
  </QueryClientProvider>
);
```

### Using the Wallet Hook

```tsx
import { useWallet } from './hooks/useWalletContext';

function MyComponent() {
  const { connected, address, balance, connect, disconnect, mintPower, redeemPower } = useWallet();
  // All components share the same wallet state
}
```

### Network Configuration

LitVM Testnet parameters (in `WalletContext.tsx`):
- **Chain ID:** 421611
- **RPC URL:** https://rpc.litvm-testnet.io
- **Explorer:** https://explorer.litvm-testnet.io

For mainnet, update these constants when available.

---

## 3. Calling `updateEnergyIndex()` via Governance

### Function Signature

```solidity
function updateEnergyIndex(
    uint256 newGlobalIndex,        // New index in USD/kWh ×1e8
    uint256 newMiningEfficiency,   // New efficiency in J/MH ×1e8 (0 = no change)
    bytes32[] calldata countryCodes, // Country codes to update
    uint256[] calldata rates        // Matching rates ×1e8
) external onlyRole(GOVERNANCE_ROLE)
```

### Example Transaction (ethers.js)

```javascript
const { ethers } = require('ethers');

// Connect to LitVM
const provider = new ethers.JsonRpcProvider('https://rpc.litvm-testnet.io');
const signer = new ethers.Wallet(GOVERNANCE_PRIVATE_KEY, provider);
const powerToken = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

// Prepare country data
const countryCodes = [
  ethers.encodeBytes32String('USA'),
  ethers.encodeBytes32String('CHN'),
  ethers.encodeBytes32String('DEU'),
];
const rates = [
  15900000n,  // $0.159/kWh × 1e8
  8200000n,   // $0.082/kWh × 1e8
  37400000n,  // $0.374/kWh × 1e8
];

// Push update
const tx = await powerToken.updateEnergyIndex(
  14830000n,   // Global index: $0.1483/kWh × 1e8
  11230000n,   // Mining efficiency: 0.1123 J/MH × 1e8
  countryCodes,
  rates
);

await tx.wait();
console.log('Energy index updated:', tx.hash);
```

---

## 4. Environment Variables

Create a `.env` file for deployment:

```env
# LitVM Network
LITVM_RPC_URL=https://rpc.litvm-testnet.io
DEPLOYER_PRIVATE_KEY=0x...

# Contract Constructor Args
WLTC_ADDRESS=0x...
LTC_USD_FEED=0x...
ENERGY_INDEX_FEED=0x...
FEE_RECIPIENT=0x...
INITIAL_MINING_EFF=11230000

# Frontend
VITE_CONTRACT_ADDRESS=0x...
VITE_CHAIN_ID=421611
```

---

## 5. TanStack Query Configuration

The `useEnergyIndex` hook uses TanStack Query with:
- **Auto-refetch:** Every 10 seconds
- **Stale time:** 5 seconds
- **GC time:** 30 seconds
- **Retry:** 2 attempts on failure

To customize, modify the query options in `src/hooks/useEnergyIndex.ts`.
