export const SUPPORTED_CHAINS = {
  1: {
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  11155111: {
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  137: {
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },
};

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
export const DEFAULT_CHAIN_ID = 11155111;

export const ENERGY_CONSTANTS = {
  AVERAGE_MINER_EFFICIENCY: 0.098, // J/GH
  NETWORK_OVERHEAD: 1.15,
  KWH_CONVERSION: 2.778e-7,
};

export const SIMULATION_ADDRESSES = [
  '0x742d35Cc6634C0532925a3b8D4C9C5e3b1234567',
  '0x8ba1f109551bD432803012645Hac136c9876543',
  '0x1234567890AbCdEf1234567890AbCdEf12345678',
];

export const MOCK_TX_HASHES = [
  '0xabc123def456789012345678901234567890abcdef1234567890abcdef123456',
  '0xdef456abc789012345678901234567890abcdef1234567890abcdef456789012',
  '0x789012def456abc123456789012345678901234567890abcdef789012345678ab',
];
