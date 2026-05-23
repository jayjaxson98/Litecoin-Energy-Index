// ─── Contract Configuration ───────────────────────────────────────────────────

export const CONTRACT_ADDRESS: string =
  import.meta.env.VITE_CONTRACT_ADDRESS ?? '0x0000000000000000000000000000000000000000';

// ─── ABI ─────────────────────────────────────────────────────────────────────
// Updated for v18: swapToPowerTokens and swapPowerTokensToLtc now accept
// two additional parameters: expectedPrice (uint256) and expectedNonce (uint256).

export const LITBREAK_ABI = [
  // ── State-changing ──────────────────────────────────────────────────────────
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    // [v18] Added expectedPrice and expectedNonce parameters.
    name: 'swapToPowerTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'ltcAmount',         type: 'uint256' },
      { name: 'minPowerTokensOut', type: 'uint256' },
      { name: 'deadline',          type: 'uint256' },
      { name: 'expectedPrice',     type: 'uint256' },   // NEW v18
      { name: 'expectedNonce',     type: 'uint256' },   // NEW v18
    ],
    outputs: [],
  },
  {
    // [v18] Added expectedPrice and expectedNonce parameters.
    name: 'swapPowerTokensToLtc',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'powerTokenAmount', type: 'uint256' },
      { name: 'minLtcOut',        type: 'uint256' },
      { name: 'deadline',         type: 'uint256' },
      { name: 'expectedPrice',    type: 'uint256' },    // NEW v18
      { name: 'expectedNonce',    type: 'uint256' },    // NEW v18
    ],
    outputs: [],
  },
  // ── View ────────────────────────────────────────────────────────────────────
  {
    name: 'getActiveRegionRate',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'ltcUsdPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'activeRegion',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    name: 'ltcBalances',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'powerTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'quotePowerTokensForLtc',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'ltcAmount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'quoteLtcForPowerTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'powerTokenAmount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'isSolvent',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'paused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    // [v18] New: returns the caller's current swap nonce.
    name: 'getSwapNonce',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    // [v18] New: check whether a price is within the deviation band.
    name: 'checkPriceDeviation',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'expectedPrice', type: 'uint256' }],
    outputs: [{ name: 'within', type: 'bool' }],
  },
  // ── Events ──────────────────────────────────────────────────────────────────
  {
    name: 'Deposited',
    type: 'event',
    inputs: [
      { name: 'user',     type: 'address', indexed: true  },
      { name: 'amount',   type: 'uint256', indexed: false },
      { name: 'currency', type: 'string',  indexed: false },
    ],
  },
  {
    name: 'Withdrawn',
    type: 'event',
    inputs: [
      { name: 'user',     type: 'address', indexed: true  },
      { name: 'amount',   type: 'uint256', indexed: false },
      { name: 'currency', type: 'string',  indexed: false },
    ],
  },
  {
    name: 'RegionRateUpdated',
    type: 'event',
    inputs: [
      { name: 'regionId', type: 'bytes32', indexed: true  },
      { name: 'newRate',  type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'SwappedToPowerTokens',
    type: 'event',
    inputs: [
      { name: 'user',             type: 'address', indexed: true  },
      { name: 'ltcAmount',        type: 'uint256', indexed: false },
      { name: 'powerTokenAmount', type: 'uint256', indexed: false },
      { name: 'region',           type: 'bytes32', indexed: false },
    ],
  },
  {
    name: 'SwappedPowerTokensToLtc',
    type: 'event',
    inputs: [
      { name: 'user',             type: 'address', indexed: true  },
      { name: 'powerTokenAmount', type: 'uint256', indexed: false },
      { name: 'ltcAmount',        type: 'uint256', indexed: false },
      { name: 'region',           type: 'bytes32', indexed: false },
    ],
  },
  {
    name: 'ActiveRegionChanged',
    type: 'event',
    inputs: [
      { name: 'previousRegion', type: 'bytes32', indexed: true },
      { name: 'newRegion',      type: 'bytes32', indexed: true },
    ],
  },
  {
    // [v18] New event for off-chain nonce monitoring.
    name: 'SwapNonceUsed',
    type: 'event',
    inputs: [
      { name: 'user',  type: 'address', indexed: true  },
      { name: 'nonce', type: 'uint256', indexed: false },
    ],
  },
] as const;
