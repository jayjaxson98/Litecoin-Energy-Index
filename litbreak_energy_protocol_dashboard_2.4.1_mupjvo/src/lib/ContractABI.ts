/**
 * ContractABI.ts — LitbreakProtocol ABI and deployment config
 *
 * Pass 13 changes (P13-01 through P13-06):
 *   - P13-01: Added cleanupExpiredProposal(uint256) function signature + event
 *   - P13-02: Added mintWithMinOutput(uint256) and redeemWithMinOutput(uint256,uint256)
 *   - P13-03: Fixed getGuardianStatus return type from (bool,uint256) to (bool,address)
 *   - Added new method selectors for P13 functions
 *   - CONTRACT_VERSION bumped to 13
 */

export const LITBREAK_ABI = [
  // ─── ERC-20 ────────────────────────────────────────────────────
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)",
  "function transferFrom(address,address,uint256) returns (bool)",

  // ERC-20 Race Protection (P3-10)
  "function increaseAllowance(address,uint256) returns (bool)",
  "function decreaseAllowance(address,uint256) returns (bool)",

  // ─── Core ──────────────────────────────────────────────────────
  "function mint() payable",
  "function redeem(uint256)",
  "function submitOraclePrice(uint256)",
  "function updateEnergyPrice(uint256)",

  // P13-02: Slippage-protected mint/redeem overloads
  "function mintWithMinOutput(uint256) payable",
  "function redeemWithMinOutput(uint256,uint256)",

  // ─── Admin ─────────────────────────────────────────────────────
  "function addOracle(address)",
  "function removeOracle(address)",
  "function setExchangeRate(uint256)",
  "function setFee(uint256)",
  "function pause()",
  "function unpause()",
  "function transferOwnership(address)",
  "function resolveOracleStaleness()",

  // Emergency (Pass 10: renamed from emergencyWithdrawEth)
  "function emergencyWithdrawLtc(address,uint256)",

  // Baseline Management (P6-01, P10.4-01: now change-capped)
  "function resetOracleBaseline(address,uint256)",

  // ─── Auto Recovery (EXT-04, P5-03, P8-01) ─────────────────────
  "function triggerAutoRecovery()",

  // ─── Guardian System (P12-01) ──────────────────────────────────
  "function setGuardian(address)",
  "function createProposal(uint8,address,uint256) returns (uint256)",
  "function confirmProposal(uint256)",
  "function cancelProposal(uint256)",

  // P13-01: Permissionless expired proposal cleanup
  "function cleanupExpiredProposal(uint256)",

  // ─── Timelock System (EXT-05, P5-02, P10.4-01) ────────────────
  "function queueTimelockAction(bytes32,string)",
  "function cancelTimelockAction(bytes32)",
  "function executeTimelockSetExchangeRate(bytes32,uint256)",
  "function executeTimelockSetFee(bytes32,uint256)",
  "function executeTimelockAddOracle(bytes32,address)",
  "function executeTimelockRemoveOracle(bytes32,address)",

  // Pass 10.4: Timelock-gated baseline reset
  "function executeTimelockResetOracleBaseline(bytes32,address,uint256)",

  // ─── Views ─────────────────────────────────────────────────────
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
  "function energyPriceUsd() view returns (uint256)",
  "function exchangeRate() view returns (uint256)",
  "function feeBps() view returns (uint256)",
  "function lastPriceUpdate() view returns (uint256)",
  "function oracleStalenessPaused() view returns (bool)",
  "function isOracle(address) view returns (bool)",
  "function oracleLastPrice(address) view returns (uint256)",
  "function oracleLastUpdate(address) view returns (uint256)",
  "function oracleBaselinePrice(address) view returns (uint256)",
  "function getTwapPrice() view returns (uint256)",
  "function getOracleCount() view returns (uint256)",
  "function getOracleList() view returns (address[])",

  // Views (P3-03/P3-04, P3-09)
  "function isDataFresh() view returns (bool)",
  // Pass 10: renamed from getEthBalance
  "function getLtcBalance() view returns (uint256)",

  // TWAP array and index accessors (Pass 11 — A-11)
  "function twapPrices(uint256) view returns (uint256)",
  "function twapIndex() view returns (uint256)",

  // TWAP Rate Limiting Views (P3-12)
  "function oracleTwapWindowEpoch(address) view returns (uint256)",
  "function oracleTwapUpdatesInEpoch(address) view returns (uint256)",

  // Pass 4/5 Views (EXT-04, EXT-05, EXT-07, P5-04)
  "function stalenessTriggeredAt() view returns (uint256)",
  "function oracleIndex(address) view returns (uint256)",
  "function timelockQueue(bytes32) view returns (uint256)",
  "function isTimelockReady(bytes32) view returns (bool,uint256)",
  "function getAutoRecoveryStatus() view returns (bool,uint256)",

  // Global TWAP Views (P5-04)
  "function globalTwapUpdatesInEpoch() view returns (uint256)",
  "function globalTwapWindowEpoch() view returns (uint256)",

  // Baseline Views (P6-01)
  "function oracleBaselineLastUpdate(address) view returns (uint256)",
  "function getBaselineUpdateStatus(address) view returns (bool,uint256)",

  // Auto Recovery Views (P8-01)
  "function lastAutoRecoveryAttempt() view returns (uint256)",

  // TWAP Epoch Views (P9-01)
  "function twapEpochStartTime() view returns (uint256)",
  "function currentTwapEpoch() view returns (uint256)",
  "function getTwapEpochStatus() view returns (uint256,uint256,uint256)",

  // Guardian Views (P12-01)
  // P13-03: Fixed return type from (bool,uint256) to (bool,address)
  "function guardian() view returns (address)",
  "function proposalCount() view returns (uint256)",
  "function activeProposalCount() view returns (uint256)",
  "function getProposal(uint256) view returns (uint8,address,address,uint256,uint256,bool,bool,bool)",
  "function getGuardianStatus() view returns (bool,address)",

  // ─── Constants ─────────────────────────────────────────────────
  "function MAX_FEE_BPS() view returns (uint256)",
  "function BPS_DENOMINATOR() view returns (uint256)",
  "function HARD_CAP() view returns (uint256)",
  "function MIN_ENERGY_PRICE() view returns (uint256)",
  "function MAX_ENERGY_PRICE() view returns (uint256)",
  "function MAX_RATE_CHANGE_BPS() view returns (uint256)",
  "function CONTRACT_VERSION() view returns (uint256)",
  "function MAX_TWAP_UPDATES_PER_ORACLE_PER_WINDOW() view returns (uint256)",
  "function MAX_GLOBAL_TWAP_UPDATES_PER_WINDOW() view returns (uint256)",

  // Pass 4/5 Constants (EXT-04, EXT-05)
  "function AUTO_RECOVERY_TIMEOUT() view returns (uint256)",
  "function TIMELOCK_DELAY() view returns (uint256)",

  // Pass 6 Constants (P6-01)
  "function BASELINE_UPDATE_INTERVAL() view returns (uint256)",

  // Pass 8 Constants (P8-01)
  "function AUTO_RECOVERY_COOLDOWN() view returns (uint256)",

  // Pass 9 Constants (P9-01)
  "function TWAP_EPOCH_DURATION() view returns (uint256)",

  // Pass 10.4 Constants (P10.4-01)
  "function MAX_BASELINE_CHANGE_BPS() view returns (uint256)",

  // Pass 12 Constants (P12-01)
  "function PROPOSAL_EXPIRY() view returns (uint256)",
  "function MAX_ACTIVE_PROPOSALS() view returns (uint256)",
  "function PROPOSAL_ADD_ORACLE() view returns (uint8)",
  "function PROPOSAL_REMOVE_ORACLE() view returns (uint8)",
  "function PROPOSAL_RESET_BASELINE() view returns (uint8)",
  "function PROPOSAL_TRANSFER_OWNERSHIP() view returns (uint8)",
  "function PROPOSAL_EMERGENCY_WITHDRAW() view returns (uint8)",
  "function PROPOSAL_SET_GUARDIAN() view returns (uint8)",

  // Additional constants exposed as public (Pass 11 — completeness)
  "function MAX_PRICE_CHANGE_RATIO() view returns (uint256)",
  "function MAX_ORACLE_SELF_CHANGE_RATIO() view returns (uint256)",
  "function MAX_ORACLES() view returns (uint256)",
  "function MIN_ORACLE_QUORUM() view returns (uint256)",
  "function ORACLE_STALENESS_THRESHOLD() view returns (uint256)",
  "function MAX_STALENESS() view returns (uint256)",
  "function TIMESTAMP_SAFETY_BUFFER() view returns (uint256)",
  "function MAX_ORACLE_DEVIATION_BPS() view returns (uint256)",
  "function TWAP_WINDOW() view returns (uint256)",
  "function ORACLE_SUBMISSION_COOLDOWN() view returns (uint256)",
  "function MIN_EXCHANGE_RATE() view returns (uint256)",
  "function MAX_EXCHANGE_RATE() view returns (uint256)",

  // ─── Events ────────────────────────────────────────────────────
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event Minted(address indexed to, uint256 ltcAmount, uint256 indexed powerAmount, uint256 fee)",
  "event Redeemed(address indexed from, uint256 indexed powerAmount, uint256 ltcAmount, uint256 fee)",
  "event EnergyPriceUpdated(uint256 oldPrice, uint256 newPrice, address indexed oracle)",
  "event ExchangeRateUpdated(uint256 oldRate, uint256 newRate)",
  "event FeeUpdated(uint256 oldFee, uint256 newFee)",
  "event OracleAdded(address indexed oracle)",
  "event OracleRemoved(address indexed oracle)",
  "event OracleSubmission(address indexed oracle, uint256 indexed price, uint256 timestamp)",
  "event Paused(address indexed by)",
  "event Unpaused(address indexed by)",
  "event OwnershipTransferred(address indexed oldOwner, address indexed newOwner)",
  "event OracleStalenessPauseTriggered(uint256 timestamp)",
  "event OracleStalenessPauseResolved(address indexed by, uint256 timestamp)",
  "event LtcReceived(address indexed sender, uint256 amount)",
  "event EmergencyWithdrawal(address indexed to, uint256 amount)",
  "event OracleDeviationSkipped(uint256 minPrice, uint256 maxPrice, uint256 deviationBps)",
  "event OracleTwapRateLimited(address indexed oracle, uint256 epoch, uint256 count)",
  "event StalenessAutoRecovered(address indexed triggeredBy, uint256 timestamp)",
  "event TimelockQueued(bytes32 indexed actionId, uint256 executeAfter, string description)",
  "event TimelockExecuted(bytes32 indexed actionId, uint256 timestamp)",
  "event TimelockCancelled(bytes32 indexed actionId)",
  "event GlobalTwapRateLimited(uint256 epoch, uint256 count)",
  "event BaselineUpdated(address indexed oracle, uint256 oldBaseline, uint256 newBaseline, uint256 timestamp)",
  "event BaselineReset(address indexed oracle, uint256 oldBaseline, uint256 newBaseline, address indexed resetBy)",
  "event TwapEpochAdvanced(uint256 indexed newEpoch, uint256 startTime)",
  "event BaselineResetViaTimelock(address indexed oracle, uint256 oldBaseline, uint256 newBaseline, bytes32 indexed actionId)",

  // Guardian Events (P12-01)
  "event GuardianSet(address indexed oldGuardian, address indexed newGuardian, address indexed setBy)",
  "event ProposalCreated(uint256 indexed proposalId, uint8 actionType, address indexed proposer, address target, uint256 value)",
  "event ProposalExecuted(uint256 indexed proposalId, uint8 actionType, address indexed confirmedBy)",
  "event ProposalCancelled(uint256 indexed proposalId, address indexed cancelledBy)",

  // P13-01: Expired proposal cleanup event
  "event ProposalExpiredAndCleaned(uint256 indexed proposalId, address indexed cleanedBy)",
] as const;

/**
 * Method selectors for gas estimation and transaction simulation.
 * Computed as first 4 bytes of keccak256(signature).
 */
export const METHOD_SELECTORS = {
  // Core
  mint: '0x1249c58b',
  redeem: '0xdb006a75',
  transfer: '0xa9059cbb',
  approve: '0x095ea7b3',
  submitOraclePrice: '0x7d1b8c4a',
  updateEnergyPrice: '0x3b7d0946',
  triggerAutoRecovery: '0xe5d1c8a2',
  // P13-02: Slippage-protected overloads
  mintWithMinOutput: '0x2bfda312',
  redeemWithMinOutput: '0x8e15f473',
  // Admin (Pass 11 — A-9)
  addOracle: '0xdf5dd1a5',
  removeOracle: '0x66a67a0e',
  setExchangeRate: '0xdb068e0e',
  setFee: '0x69fe0e2d',
  pause: '0x8456cb59',
  unpause: '0x3f4ba83a',
  resetOracleBaseline: '0xa1c5d318',
  queueTimelockAction: '0xb1c94d8e',
  executeTimelockResetOracleBaseline: '0xf4e2a5c7',
  // Guardian (Pass 12 — P12-01)
  setGuardian: '0x8a0dac4a',
  createProposal: '0xc1e40329',
  confirmProposal: '0xc01a8c84',
  cancelProposal: '0xe0a8f6f5',
  // P13-01: Expired proposal cleanup
  cleanupExpiredProposal: '0x7c2d27d6',
} as const;

/**
 * Proposal action type constants matching contract (P12-01).
 */
export const PROPOSAL_TYPES = {
  ADD_ORACLE: 1,
  REMOVE_ORACLE: 2,
  RESET_BASELINE: 3,
  TRANSFER_OWNERSHIP: 4,
  EMERGENCY_WITHDRAW: 5,
  SET_GUARDIAN: 6,
} as const;

export type ProposalActionType = typeof PROPOSAL_TYPES[keyof typeof PROPOSAL_TYPES];

/**
 * Human-readable labels for proposal types.
 */
export const PROPOSAL_TYPE_LABELS: Record<number, string> = {
  [PROPOSAL_TYPES.ADD_ORACLE]: 'Add Oracle',
  [PROPOSAL_TYPES.REMOVE_ORACLE]: 'Remove Oracle',
  [PROPOSAL_TYPES.RESET_BASELINE]: 'Reset Oracle Baseline',
  [PROPOSAL_TYPES.TRANSFER_OWNERSHIP]: 'Transfer Ownership',
  [PROPOSAL_TYPES.EMERGENCY_WITHDRAW]: 'Emergency LTC Withdrawal',
  [PROPOSAL_TYPES.SET_GUARDIAN]: 'Set Guardian',
};

/**
 * Human-readable ABI for ethers.js v6 Interface parsing.
 */
export const LITBREAK_PROTOCOL_ABI = LITBREAK_ABI;

/**
 * Recommended deployment parameters.
 */
export const RECOMMENDED_DEPLOYMENT_PARAMS = {
  initialExchangeRate: "125000000000000000000",
  initialFeeBps: 30,
  initialEnergyPriceUsd: 142000,
} as const;

/**
 * Type-safe BigInt deployment parameters for programmatic use.
 */
export const DEPLOYMENT_PARAMS_BIGINT = {
  initialExchangeRate: BigInt("125000000000000000000"),
  initialFeeBps: BigInt(30),
  initialEnergyPriceUsd: BigInt(142000),
} as const;

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
