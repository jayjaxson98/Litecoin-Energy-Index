// ─────────────────────────────────────────────────────────────────────────────
// LitBreakProtocol ABI — Synced with audited contract v2
// Fixes applied:
//   - EnergyIndexUpdated: added missing ltcPerKwh param (was 2 params, now 3)
//   - Redeem event: renamed kwhValue → ethValue to match contract
//   - ETHWithdrawn event: added (new in audited contract)
//   - MerkleRootUpdated event: added (new in audited contract)
//   - OracleUpdated event: added (new in audited contract)
//   - increaseAllowance / decreaseAllowance: added (new in audited contract)
//   - isEnergyIndexStale: added view function
//   - setOracle: added admin function
//   - Custom errors: listed for off-chain decoding
// ─────────────────────────────────────────────────────────────────────────────

export const LITBREAK_ABI = [
  // ── ERC20 Standard ──────────────────────────────────────────────────────
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',

  // [FIX-11] Safe allowance management — prevents front-running race condition
  'function increaseAllowance(address spender, uint256 addedValue) returns (bool)',
  'function decreaseAllowance(address spender, uint256 subtractedValue) returns (bool)',

  // ── LitBreak Protocol ───────────────────────────────────────────────────
  'function mint(uint256 kwhAmount) payable returns (uint256 tokenAmount)',
  'function redeem(uint256 tokenAmount) returns (uint256 ethValue)',

  // [FIX-09] Returns all 3 values — was missing ltcPerKwh in original ABI
  'function getEnergyIndex() view returns (uint256 kwhPerLtc, uint256 ltcPerKwh, uint256 timestamp)',

  'function getMintPrice(uint256 kwhAmount) view returns (uint256)',
  'function getRedeemValue(uint256 tokenAmount) view returns (uint256)',
  'function paused() view returns (bool)',
  'function owner() view returns (address)',

  // [FIX-07] New view: check if energy index is stale
  'function isEnergyIndexStale() view returns (bool)',

  // ── Constants ───────────────────────────────────────────────────────────
  'function MIN_MINT_AMOUNT() view returns (uint256)',
  'function MAX_BATCH_SIZE() view returns (uint256)',
  'function MIN_PRICE() view returns (uint256)',
  'function MAX_PRICE() view returns (uint256)',
  'function MAX_INDEX_AGE() view returns (uint256)',
  'function MAX_KWH_PER_LTC() view returns (uint256)',

  // ── State Variables ─────────────────────────────────────────────────────
  'function kwhPerLtc() view returns (uint256)',
  'function ltcPerKwh() view returns (uint256)',
  'function energyIndexTimestamp() view returns (uint256)',
  'function mintPricePerKwh() view returns (uint256)',
  'function redeemRatePerToken() view returns (uint256)',
  'function merkleRoot() view returns (bytes32)',
  'function airdropClaimed(address account) view returns (bool)',
  'function airdropAmount(address account) view returns (uint256)',
  'function priceOracle() view returns (address)',
  'function priceOracleEnabled() view returns (bool)',

  // ── Admin Functions ──────────────────────────────────────────────────────
  'function pause() returns (bool)',
  'function unpause() returns (bool)',
  'function updateEnergyIndex(uint256 newKwhPerLtc) returns (bool)',
  'function updateMintPrice(uint256 newPrice)',
  'function updateRedeemRate(uint256 newRate)',
  'function setAirdropAllocations(address[] calldata recipients, uint256[] calldata amounts)',
  'function updateMerkleRoot(bytes32 newRoot)',
  'function transferOwnership(address newOwner)',
  'function withdrawETH(uint256 amount)',

  // [FIX-14] Oracle configuration
  'function setOracle(address oracle, bool enabled)',

  // ── Events ───────────────────────────────────────────────────────────────
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event Mint(address indexed user, uint256 kwhAmount, uint256 tokenAmount)',

  // [FIX-09] Corrected: was 'kwhValue', now matches contract param 'ethValue'
  'event Redeem(address indexed user, uint256 tokenAmount, uint256 ethValue)',

  // [FIX-09] Corrected: now includes all 3 params (was missing ltcPerKwh)
  'event EnergyIndexUpdated(uint256 kwhPerLtc, uint256 ltcPerKwh, uint256 timestamp)',

  'event AirdropClaimed(address indexed user, uint256 amount)',
  'event Paused(address indexed account)',
  'event Unpaused(address indexed account)',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
  'event MintPriceUpdated(uint256 newPrice)',
  'event RedeemRateUpdated(uint256 newRate)',

  // [FIX-09] New event — ETH withdrawal audit trail
  'event ETHWithdrawn(address indexed to, uint256 amount)',

  // [FIX-10] New event — merkle root change audit trail
  'event MerkleRootUpdated(bytes32 indexed newRoot)',

  // [FIX-14] New event — oracle config change
  'event OracleUpdated(address indexed oracle, bool enabled)',

  // ── Custom Errors (for off-chain decoding) ───────────────────────────────
  'error NotOwner()',
  'error ContractPaused()',
  'error ReentrantCall()',
  'error InvalidEnergyIndex()',
  'error EnergyIndexTooLarge()',
  'error EnergyIndexStale()',
  'error InsufficientETH()',
  'error ETHRefundFailed()',
  'error ETHTransferFailed()',
  'error ETHWithdrawFailed()',
  'error InsufficientBalance()',
  'error InsufficientContractBalance()',
  'error ZeroAmount()',
  'error ZeroAddress()',
  'error InvalidPrice()',
  'error PriceTooLow()',
  'error PriceTooHigh()',
  'error AlreadyClaimed()',
  'error NoAirdropAllocation()',
  'error InvalidMerkleProof()',
  'error AlreadyPaused()',
  'error NotPaused()',
  'error BatchTooLarge()',
  'error ArrayLengthMismatch()',
  'error InsufficientAllowance()',
  'error AllowanceUnderflow()',
  'error AmountTooSmall()',
];
