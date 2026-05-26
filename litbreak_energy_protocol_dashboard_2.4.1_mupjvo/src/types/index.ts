// ─── Country Data ────────────────────────────────────────────
export interface CountryData {
  code: string;
  name: string;
  flag: string;
  rate: number;       // USD per kWh
  consumption: number; // TWh per year
  region: string;
}

// ─── LTC Price Data ──────────────────────────────────────────
export interface LtcPriceData {
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: number;
}

export interface LtcHistoricalPoint {
  timestamp: number;
  price: number;
  volume?: number;
}

// ─── Guardian Types (Pass 12) ────────────────────────────────
export interface BaselineResetInfo {
  oracle: string;
  currentBaseline: number;
  newBaseline: number;
  requiresTimelock: boolean;
  changeBps: number;
}

export interface GuardianStatus {
  isActive: boolean;
  guardianAddress: string;
  totalProposals: number;
  activeProposals: number;
}

export interface GuardianProposal {
  id: number;
  actionType: number;
  actionLabel: string;
  proposer: string;
  target: string;
  value: number;
  createdAt: number;
  expiresAt: number;
  executed: boolean;
  cancelled: boolean;
  expired: boolean;
  canConfirm: boolean;
  canCancel: boolean;
}
