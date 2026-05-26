/**
 * UTX (Unspent Transaction) and Collection types for the Litbreak Protocol.
 */

// ─── Agent ────────────────────────────────────────────────────────────────────

export type AgentRiskLevel = 'low' | 'medium' | 'high';
export type AgentStatus = 'active' | 'paused' | 'stopped';

export interface Agent {
  id: string;
  name: string;
  description: string;
  /** Annualised return-on-investment percentage */
  performance: number;
  /** Total value locked in USD */
  tvl: number;
  /** Number of wallets following this agent */
  followers: number;
  riskLevel: AgentRiskLevel;
  status: AgentStatus;
  /** Strategy tags, e.g. ["yield", "arbitrage"] */
  tags?: string[];
  /** ISO timestamp of last activity */
  lastActive?: string;
}

// ─── UTX Records ──────────────────────────────────────────────────────────────

export interface UTXRecord {
  id: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  amount: number;
  token: string;
  type: 'mint' | 'redeem' | 'transfer';
  status: 'confirmed' | 'pending' | 'failed';
  fee: number;
  gasUsed: number;
}

export interface UTXFilter {
  type?: UTXRecord['type'];
  status?: UTXRecord['status'];
  token?: string;
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
  startTime?: number;
  endTime?: number;
}

// ─── Collections ──────────────────────────────────────────────────────────────

export interface Collection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  totalSupply: number;
  holders: number;
  floorPrice: number;
  volume24h: number;
  volumeChange24h: number;
  marketCap: number;
  iconUrl?: string;
  /** Banner / card image URL */
  imageUrl?: string;
  /** Whether this collection is officially verified */
  verified?: boolean;
  /** Total number of items in the collection */
  items?: number;
  /** Number of unique owners */
  owners?: number;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  tokenId: number;
  name: string;
  description: string;
  imageUrl: string;
  owner: string;
  price: number;
  lastSalePrice: number;
  rarity: number;
  attributes: Record<string, string | number>;
}
