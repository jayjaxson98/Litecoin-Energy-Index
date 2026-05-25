/**
 * UTX (Unspent Transaction) and Collection types used across the application.
 * These types support the protocol's transaction tracking and NFT collection features.
 */

// ─── UTX Types ───────────────────────────────────────────────────────────────

export interface UTXRecord {
  id: string;
  txHash: string;
  type: 'mint' | 'redeem' | 'transfer';
  from: string;
  to: string;
  amount: number;
  token: string;
  timestamp: number;
  blockNumber: number;
  status: 'pending' | 'confirmed' | 'failed';
  fee?: number;
  gasUsed?: number;
}

export interface UTXFilter {
  type?: UTXRecord['type'];
  status?: UTXRecord['status'];
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
  startTime?: number;
  endTime?: number;
}

// ─── Collection Types ────────────────────────────────────────────────────────

export interface Collection {
  id: string;
  name: string;
  description: string;
  totalSupply: number;
  holders: number;
  floorPrice: number;
  volume24h: number;
  change24h: number;
  imageUrl?: string;
  verified: boolean;
  createdAt: number;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  tokenId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  owner: string;
  price?: number;
  lastSalePrice?: number;
  rarity?: number;
  attributes?: Record<string, string | number>;
}
