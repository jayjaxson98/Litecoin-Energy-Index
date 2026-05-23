export type WalletStatus = 'disconnected' | 'connecting' | 'connected';
export type NetworkId = 'litecoin-mainnet' | 'litecoin-testnet' | 'ethereum-mainnet';

export interface WalletNetwork {
  id: NetworkId;
  name: string;
  symbol: string;
  chainId: number;
}

export interface WalletBalance {
  symbol: string;
  amount: string;
  usdValue: number;
  decimals: number;
  contractAddress?: string;
}

export interface WalletTransaction {
  hash: string;
  type: 'send' | 'receive' | 'swap' | 'stake' | 'unstake';
  status: 'pending' | 'confirmed' | 'failed';
  amount: string;
  symbol: string;
  toAddress?: string;
  fromAddress?: string;
  timestamp: number;
  blockNumber?: number;
  fee?: string;
}

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  network: WalletNetwork | null;
  balances: WalletBalance[];
  transactions: WalletTransaction[];
  isLoading: boolean;
  error: string | null;
}

export interface WalletContextValue extends WalletState {
  connect: (walletType?: string) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (networkId: NetworkId) => Promise<void>;
  sendTransaction: (to: string, amount: string, symbol: string) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  refreshBalances: () => Promise<void>;
  addTransaction: (tx: WalletTransaction) => void;
}

export const SUPPORTED_NETWORKS: WalletNetwork[] = [
  { id: 'litecoin-mainnet', name: 'Litecoin Mainnet', symbol: 'LTC', chainId: 1 },
  { id: 'litecoin-testnet', name: 'Litecoin Testnet', symbol: 'tLTC', chainId: 2 },
  { id: 'ethereum-mainnet', name: 'Ethereum Mainnet', symbol: 'ETH', chainId: 1 },
];
