// ─── Contract State Types ─────────────────────────────────────────────────────

export interface ContractState {
  activeRegionRate: bigint | null;   // USD/kWh × 1e8
  ltcUsdPrice:      bigint | null;   // USD × 1e8
  activeRegion:     string | null;   // bytes32 hex
  ltcBalance:       bigint | null;   // wei
  powerTokens:      bigint | null;   // wei-equivalent
  isSolvent:        boolean | null;
  isPaused:         boolean | null;
}

export interface ContractTxState {
  status:  'idle' | 'pending' | 'mining' | 'confirmed' | 'failed';
  hash:    string | null;
  error:   string | null;
}

// ─── Event Log Types ──────────────────────────────────────────────────────────

export interface DepositedEvent {
  user:     string;
  amount:   bigint;
  currency: string;
  txHash:   string;
  blockNumber: number;
}

export interface WithdrawnEvent {
  user:     string;
  amount:   bigint;
  currency: string;
  txHash:   string;
  blockNumber: number;
}

export interface RegionRateUpdatedEvent {
  regionId: string;
  newRate:  bigint;
  txHash:   string;
  blockNumber: number;
}

export interface SwappedToPowerTokensEvent {
  user:             string;
  ltcAmount:        bigint;
  powerTokenAmount: bigint;
  region:           string;
  txHash:           string;
  blockNumber:      number;
}

export type ContractEvent =
  | ({ kind: 'Deposited' }             & DepositedEvent)
  | ({ kind: 'Withdrawn' }             & WithdrawnEvent)
  | ({ kind: 'RegionRateUpdated' }     & RegionRateUpdatedEvent)
  | ({ kind: 'SwappedToPowerTokens' }  & SwappedToPowerTokensEvent);
