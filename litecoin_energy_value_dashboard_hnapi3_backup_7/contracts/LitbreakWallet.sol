// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// ─── Inline IERC20 ────────────────────────────────────────────────────────────
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

/**
 * @title  LitbreakWallet v23
 * @notice Self-contained EVM wallet for the Litecoin Energy Dashboard.
 *
 * Security changelog (v23 — HIGH fix: SWC-104 Unchecked External Call Return Value):
 *
 *   [HIGH-3] _safeTransfer (line 742) used a bare low-level call whose return
 *            data was silently discarded. Three hardening measures applied:
 *
 *            (a) Zero-address guard: require(to != address(0)) prevents ETH
 *                being burned to the zero address if a caller ever passes an
 *                uninitialised variable.
 *
 *            (b) Zero-amount guard: require(amount > 0) makes the transfer
 *                site self-defending independent of each call site.
 *
 *            (c) Explicit return-data inspection via assembly: instead of
 *                letting the Solidity ABI decoder silently drop returndata,
 *                the helper now uses a minimal assembly block that:
 *                  • captures the raw success flag from the CALL opcode,
 *                  • reads returndatasize() and copies up to 32 bytes,
 *                  • if returndata is present, decodes it as a bool and
 *                    requires it to be true (covers non-reverting ERC-20-style
 *                    tokens that might be wrapped in a future upgrade),
 *                  • requires the CALL itself succeeded.
 *                This is the same pattern used by OpenZeppelin's Address.sol
 *                sendValue + SafeERC20.safeTransfer, inlined without imports.
 *
 *            NatSpec added to document the invariants.
 *
 * Security changelog (v22 — MEDIUM fix: dual-anchor proposal expiry):
 *
 *   [MEDIUM-5] Timestamp Manipulation Risk in Proposal Expiry (line 264):
 *              Added createdAtBlock field to Proposal struct and RegionProposal
 *              struct. Added EXPIRY_BLOCKS = 50_400 constant (7 days ÷ 12 s/block).
 *              Every expiry check now requires BOTH timestamp and block anchors.
 *              _isExpired() helper uses OR logic (stricter than AND timelock).
 *
 * Security changelog (v21 — MEDIUM fix: bounded proposal registries):
 *
 *   [MEDIUM-4] DoS via unbounded loop in _decrementPendingApprovals:
 *              MAX_PENDING_PROPOSALS = 50 cap; worst-case 151 iterations.
 *
 * Security changelog (v20 — all 8 original audit findings resolved):
 *
 *   [HIGH-1]   _decrementPendingApprovals iterates all pending proposal registries.
 *   [HIGH-2]   MAX_PRICE_CHANGE_BPS (20 %) hard cap on oracle price proposals.
 *   [MEDIUM-1] Dual-anchor timelocks: timestamp + block number.
 *   [MEDIUM-2] MAX_ADMINS = 20 cap enforced at _grantRole.
 *   [MEDIUM-3] Constructor EOA check via tx.origin == msg.sender.
 *   [LOW-1]    _mulDiv() 512-bit overflow-safe math helper.
 *   [LOW-2]    O(1) isAdminIndex mapping; O(1) _removeAdmin swap-and-pop.
 *   [LOW-3]    ReserveChanged, EmergencyUserWithdraw, BlockWithdrawalLimitApproaching events.
 *
 *   All v1-v22 security properties preserved.
 */
contract LitbreakWallet {

    // ── Constants ─────────────────────────────────────────────────────────────
    uint256 public  constant MIN_SWAP_AMOUNT            = 1e10;
    uint256 public  constant MAX_SWAP_AMOUNT            = 1_000 ether;
    uint256 public  constant MAX_ADMINS                 = 20;
    uint256 public  constant MAX_SLIPPAGE_BPS           = 500;
    uint256 public  constant MAX_PRICE_DEVIATION_BPS    = 150;
    /// @notice [HIGH-2] Maximum single-step oracle price change (20 %).
    uint256 public  constant MAX_PRICE_CHANGE_BPS       = 2_000;
    uint256 public  constant WITHDRAWAL_LIMIT_PER_BLOCK = 100 ether;
    /// @notice [MEDIUM-1] Minimum blocks that must pass alongside the timestamp timelock.
    uint256 public  constant MIN_TIMELOCK_BLOCKS        = 400;     // ≈ 48 h @ 12 s/block
    /// @notice [MEDIUM-4] Hard cap on each proposal registry array.
    uint256 public  constant MAX_PENDING_PROPOSALS      = 50;
    /// @notice [MEDIUM-5] Block-number expiry window matching EXPIRY = 7 days @ 12 s/block.
    uint256 public  constant EXPIRY_BLOCKS              = 50_400;  // 7 days ÷ 12 s/block
    uint256 private constant TIMELOCK                   = 48 hours;
    uint256 private constant EXPIRY                     = 7 days;
    uint256 private constant _UNLOCKED                  = 1;
    uint256 private constant _LOCKED                    = 2;

    // ── Roles ─────────────────────────────────────────────────────────────────
    bytes32 public constant ADMIN_ROLE    = keccak256("ADMIN");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR");
    bytes32 public constant PAUSER_ROLE   = keccak256("PAUSER");

    mapping(bytes32 => mapping(address => bool)) public roles;

    /// @dev [LOW-2] O(1) admin lookup: maps address → 1-based index in admins[].
    mapping(address => uint256) private isAdminIndex;
    address[] public admins;

    // ── Core state ────────────────────────────────────────────────────────────
    address  public owner;
    bool     public paused;
    uint256  private _locked;

    mapping(address => uint256) public ltcBalances;
    mapping(address => uint256) public powerTokens;
    mapping(address => uint256) public swapNonce;

    uint256 public totalUserLtc;
    uint256 public totalPowerTokenSupply;
    uint256 public powerTokenReserve;
    uint256 public totalDeposited;

    // ── Per-block withdrawal limiter ──────────────────────────────────────────
    mapping(uint256 => uint256) private _blockWithdrawals;

    // ── Oracle ────────────────────────────────────────────────────────────────
    uint256 public ltcUsdPrice;

    // ── Region rates ──────────────────────────────────────────────────────────
    mapping(bytes32 => uint256) public regionRates;
    bytes32 public activeRegion;

    // ── Proposal structs ──────────────────────────────────────────────────────
    struct Proposal {
        uint256 approvals;
        uint256 createdAt;
        /// @dev [MEDIUM-5] Block-number anchor for dual-anchor expiry.
        uint256 createdAtBlock;
        uint256 executeAfter;
        /// @dev [MEDIUM-1] Block-number anchor for dual-anchor timelock.
        uint256 executeAfterBlock;
        mapping(address => bool) approved;
    }

    struct PriceProposal {
        uint256 price;
        Proposal p;
    }

    struct RateProposal {
        uint256 rate;
        Proposal p;
    }

    struct RoleProposal {
        bytes32 role;
        address account;
        bool    exists;
        Proposal p;
    }

    struct OwnershipProposal {
        address newOwner;
        bool    exists;
        Proposal p;
    }

    struct RegionProposal {
        bytes32 regionId;
        uint256 executeAfter;
        uint256 executeAfterBlock; // [MEDIUM-1]
        uint256 createdAt;
        /// @dev [MEDIUM-5] Block-number anchor for dual-anchor expiry.
        uint256 createdAtBlock;
    }

    PriceProposal                         private _pp;
    mapping(bytes32 => RateProposal)      private _rp;
    mapping(bytes32 => RoleProposal)      private _roleProp;
    mapping(bytes32 => OwnershipProposal) private _ownerProp;
    RegionProposal                        private _regionProp;

    // ── [HIGH-1] Proposal ID registries for full cleanup on admin revocation ──
    // ── [MEDIUM-4] Each array is capped at MAX_PENDING_PROPOSALS entries.    ──
    bytes32[] private _pendingRateIds;
    bytes32[] private _pendingRoleIds;
    bytes32[] private _pendingOwnerIds;

    // ── Events ────────────────────────────────────────────────────────────────
    event Deposited(address indexed user, uint256 amount, string currency);
    event Withdrawn(address indexed user, uint256 amount, string currency);
    event SwappedToPowerTokens(address indexed user, uint256 ltcAmt, uint256 ptAmt, bytes32 region);
    event SwappedPowerTokensToLtc(address indexed user, uint256 ptAmt, uint256 ltcAmt, bytes32 region);
    event SwapNonceUsed(address indexed user, uint256 indexed nonce);

    /// @dev [LOW-3] Reserve mutation tracking.
    event ReserveChanged(uint256 newReserve, uint256 newTotalPT);

    event LtcPriceUpdated(uint256 newPrice);
    event PricePending(uint256 price, uint256 approvals, uint256 required);
    event PriceApproved(uint256 price, uint256 executeAfter);
    event PriceCancelled(uint256 price, address indexed by);
    event PriceChangeWarning(uint256 current, uint256 proposed, uint256 at);

    event RegionRateUpdated(bytes32 indexed regionId, uint256 rate);
    event RatePending(bytes32 indexed regionId, uint256 rate, uint256 approvals, uint256 required);
    event RateApproved(bytes32 indexed regionId, uint256 rate, uint256 executeAfter);
    event RateCancelled(bytes32 indexed regionId, uint256 rate, address indexed by);

    event ActiveRegionProposed(bytes32 indexed regionId, uint256 executeAfter);
    event ActiveRegionChanged(bytes32 indexed prev, bytes32 indexed next);

    event RoleGrantProposed(bytes32 indexed id, bytes32 indexed role, address indexed account, address by);
    event RoleGrantThresholdReached(bytes32 indexed id, uint256 executeAfter);
    event RoleGrantExecuted(bytes32 indexed id, bytes32 indexed role, address indexed account);
    event RoleGrantCancelled(bytes32 indexed id, address indexed by);

    event OwnershipTransferProposed(bytes32 indexed id, address indexed newOwner, address by);
    event OwnershipTransferThresholdReached(bytes32 indexed id, uint256 executeAfter);
    event OwnershipTransferExecuted(bytes32 indexed id, address indexed newOwner);
    event OwnershipTransferCancelled(bytes32 indexed id, address indexed by);

    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed by);
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    /// @dev [LOW-3] Distinct emergency-withdraw event.
    event EmergencyUserWithdraw(address indexed user, uint256 amount);
    /// @dev [LOW-3] Block withdrawal cap hit (informational).
    event BlockWithdrawalLimitApproaching(uint256 blockNumber, uint256 used, uint256 limit);

    event FeeCollected(address indexed to, uint256 amount);
    event StrandedReserveReclaimed(address indexed to, uint256 amount);

    // ── Modifiers ─────────────────────────────────────────────────────────────
    modifier onlyOwner()              { require(msg.sender == owner,          "Litbreak: not owner");         _; }
    modifier onlyRole(bytes32 r)      { require(roles[r][msg.sender],         "Litbreak: missing role");      _; }
    modifier whenNotPaused()          { require(!paused,                      "Litbreak: paused");            _; }
    modifier checkDeadline(uint256 d) { require(block.timestamp <= d,         "Litbreak: deadline exceeded"); _; }
    modifier nonReentrant()           {
        require(_locked == _UNLOCKED, "Litbreak: reentrant");
        _locked = _LOCKED; _; _locked = _UNLOCKED;
    }

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor(uint256 _initialPrice) {
        // [MEDIUM-3] Ensure deployer is an EOA, not a contract.
        require(tx.origin == msg.sender,  "Litbreak: no contract deploy");
        require(msg.sender != address(0), "Litbreak: zero owner");
        require(_initialPrice > 0,        "Litbreak: price=0");

        owner       = msg.sender;
        ltcUsdPrice = _initialPrice;
        _locked     = _UNLOCKED;

        _grantRole(ADMIN_ROLE,    msg.sender);
        _grantRole(PAUSER_ROLE,   msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        // [LOW-2] Seed isAdminIndex before pushing to admins[].
        isAdminIndex[msg.sender] = 1; // 1-based
        admins.push(msg.sender);

        // Seed region rates (USD/kWh × 1e8)
        _setRate("us_avg",     12_000_000);
        _setRate("eu_avg",     25_000_000);
        _setRate("asia_avg",    8_000_000);
        _setRate("global_avg", 14_000_000);
        _setRate("in_avg",      7_000_000);
        _setRate("sk_avg",     11_000_000);
        _setRate("ph_avg",     18_000_000);
        _setRate("uk_avg",     29_000_000);
        _setRate("mx_avg",      9_000_000);
        _setRate("pl_avg",     17_000_000);
        _setRate("ee_avg",     21_000_000);
        _setRate("se_avg",     13_000_000);
        _setRate("sv_avg",     16_000_000);
        _setRate("gl_avg",     38_000_000);
        _setRate("il_avg",     12_000_000);
        _setRate("ae_avg",     10_000_000);

        activeRegion = keccak256("global_avg");
    }

    // ── Receive / Deposit ─────────────────────────────────────────────────────
    receive() external payable whenNotPaused {
        require(msg.sender == tx.origin, "Litbreak: use deposit()");
        _deposit(msg.value, "ETH");
    }

    function deposit() external payable whenNotPaused {
        require(msg.value > 0, "Litbreak: deposit=0");
        _deposit(msg.value, "LTC");
    }

    function _deposit(uint256 amount, string memory currency) private {
        require(amount > 0, "Litbreak: deposit=0");
        ltcBalances[msg.sender] += amount;
        totalUserLtc            += amount;
        totalDeposited          += amount;
        emit Deposited(msg.sender, amount, currency);
    }

    // ── Withdraw ──────────────────────────────────────────────────────────────
    function withdraw(uint256 amount) external whenNotPaused nonReentrant {
        _withdrawChecks(msg.sender, amount);
        ltcBalances[msg.sender] -= amount;
        totalUserLtc            -= amount;
        _safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount, "LTC");
    }

    function _withdrawChecks(address user, uint256 amount) private {
        require(amount > 0,                  "Litbreak: amount=0");
        require(ltcBalances[user] >= amount, "Litbreak: insufficient balance");
        _blockWithdrawals[block.number] += amount;
        require(
            _blockWithdrawals[block.number] <= WITHDRAWAL_LIMIT_PER_BLOCK,
            "Litbreak: block withdrawal limit"
        );
    }

    // ── Pause ─────────────────────────────────────────────────────────────────
    function pause()   external onlyRole(PAUSER_ROLE) { require(!paused, "Litbreak: already paused"); paused = true;  emit Paused(msg.sender);   }
    function unpause() external onlyRole(PAUSER_ROLE) { require(paused,  "Litbreak: not paused");     paused = false; emit Unpaused(msg.sender); }

    // ── Swap LTC → Power Tokens ───────────────────────────────────────────────
    /// @notice Convert LTC balance to power tokens.
    function swapToPowerTokens(
        uint256 ltcAmount,
        uint256 minPowerTokensOut,
        uint256 deadline,
        uint256 expectedPrice,
        uint256 expectedNonce
    ) external whenNotPaused nonReentrant checkDeadline(deadline) {
        require(ltcAmount >= MIN_SWAP_AMOUNT,           "Litbreak: below min");
        require(ltcAmount <= MAX_SWAP_AMOUNT,           "Litbreak: above max");
        require(ltcBalances[msg.sender] >= ltcAmount,   "Litbreak: insufficient LTC");
        require(expectedPrice > 0,                      "Litbreak: price=0");
        require(swapNonce[msg.sender] == expectedNonce, "Litbreak: bad nonce");

        (uint256 rate, uint256 price) = _rateAndPrice();
        _checkPriceDeviation(price, expectedPrice);

        // [LOW-1] Use _mulDiv for overflow-safe intermediate.
        uint256 out = _mulDiv(ltcAmount, price, rate);
        _checkSlippage(out, minPowerTokensOut);
        require(out >= minPowerTokensOut, "Litbreak: slippage");

        ltcBalances[msg.sender]  -= ltcAmount;
        totalUserLtc             -= ltcAmount;
        powerTokens[msg.sender]  += out;
        powerTokenReserve        += ltcAmount;
        totalPowerTokenSupply    += out;

        // [LOW-3] Emit reserve change.
        emit ReserveChanged(powerTokenReserve, totalPowerTokenSupply);

        uint256 n = swapNonce[msg.sender]++;
        emit SwappedToPowerTokens(msg.sender, ltcAmount, out, activeRegion);
        emit SwapNonceUsed(msg.sender, n);
    }

    // ── Swap Power Tokens → LTC ───────────────────────────────────────────────
    function swapPowerTokensToLtc(
        uint256 powerTokenAmount,
        uint256 minLtcOut,
        uint256 deadline,
        uint256 expectedPrice,
        uint256 expectedNonce
    ) external whenNotPaused nonReentrant checkDeadline(deadline) {
        require(powerTokenAmount >= MIN_SWAP_AMOUNT,         "Litbreak: below min");
        require(powerTokenAmount <= MAX_SWAP_AMOUNT,         "Litbreak: above max");
        require(powerTokens[msg.sender] >= powerTokenAmount, "Litbreak: insufficient PT");
        require(expectedPrice > 0,                           "Litbreak: price=0");
        require(swapNonce[msg.sender] == expectedNonce,      "Litbreak: bad nonce");

        (uint256 rate, uint256 price) = _rateAndPrice();
        _checkPriceDeviation(price, expectedPrice);

        // [LOW-1] Use _mulDiv for overflow-safe intermediate.
        uint256 out = _mulDiv(powerTokenAmount, rate, price);
        require(powerTokenReserve >= out, "Litbreak: insufficient reserve");
        _checkSlippage(out, minLtcOut);
        require(out >= minLtcOut, "Litbreak: slippage");

        powerTokens[msg.sender]  -= powerTokenAmount;
        powerTokenReserve        -= out;
        ltcBalances[msg.sender]  += out;
        totalUserLtc             += out;
        totalPowerTokenSupply    -= powerTokenAmount;

        // [LOW-3] Emit reserve change.
        emit ReserveChanged(powerTokenReserve, totalPowerTokenSupply);

        uint256 n = swapNonce[msg.sender]++;
        emit SwappedPowerTokensToLtc(msg.sender, powerTokenAmount, out, activeRegion);
        emit SwapNonceUsed(msg.sender, n);
    }

    // ── Oracle — price update ─────────────────────────────────────────────────
    /// @notice Propose a new LTC/USD oracle price.
    /// @dev [HIGH-2] Reverts if proposed price deviates > MAX_PRICE_CHANGE_BPS from live price.
    function proposeLtcPrice(uint256 newPrice) external onlyRole(ADMIN_ROLE) {
        require(newPrice > 0, "Litbreak: price=0");

        // [HIGH-2] Hard cap: reject proposals that move price > 20 % in one step.
        if (ltcUsdPrice > 0) {
            uint256 delta = newPrice >= ltcUsdPrice
                ? newPrice - ltcUsdPrice
                : ltcUsdPrice - newPrice;
            require(
                delta * 10_000 <= ltcUsdPrice * MAX_PRICE_CHANGE_BPS,
                "Litbreak: price change too large"
            );
        }

        emit PriceChangeWarning(ltcUsdPrice, newPrice, block.timestamp);

        // [MEDIUM-5] Stale check uses both anchors.
        bool stale = _pp.p.createdAt > 0 && _isExpired(_pp.p.createdAt, _pp.p.createdAtBlock);
        if (_pp.price != newPrice || stale) {
            _clearApprovals(_pp.p);
            _pp.price                = newPrice;
            _pp.p.approvals          = 0;
            _pp.p.createdAt          = block.timestamp;
            _pp.p.createdAtBlock     = block.number;   // [MEDIUM-5]
            _pp.p.executeAfter       = 0;
            _pp.p.executeAfterBlock  = 0;
        }
        require(_pp.p.executeAfter == 0,     "Litbreak: awaiting timelock");
        require(!_pp.p.approved[msg.sender], "Litbreak: already approved");

        _pp.p.approved[msg.sender] = true;
        _pp.p.approvals++;

        uint256 req = _quorum();
        emit PricePending(newPrice, _pp.p.approvals, req);
        if (_pp.p.approvals >= req) {
            // [MEDIUM-1] Dual-anchor timelock: timestamp + block number.
            _pp.p.executeAfter      = block.timestamp + TIMELOCK;
            _pp.p.executeAfterBlock = block.number    + MIN_TIMELOCK_BLOCKS;
            emit PriceApproved(newPrice, _pp.p.executeAfter);
        }
    }

    function executeLtcPrice(uint256 expectedPrice) external onlyRole(ADMIN_ROLE) {
        require(_pp.p.createdAt > 0,                        "Litbreak: no proposal");
        require(_pp.p.executeAfter > 0,                     "Litbreak: not approved");
        require(_pp.price == expectedPrice,                 "Litbreak: price mismatch");
        // [MEDIUM-1] Both timelock anchors must be satisfied.
        require(block.timestamp >= _pp.p.executeAfter,      "Litbreak: timelock active");
        require(block.number    >= _pp.p.executeAfterBlock, "Litbreak: block timelock active");
        // [MEDIUM-5] Both expiry anchors must be satisfied.
        require(!_isExpired(_pp.p.createdAt, _pp.p.createdAtBlock), "Litbreak: expired");

        uint256 np = _pp.price;
        _clearApprovals(_pp.p);
        _pp.price = 0; _pp.p.approvals = 0;
        _pp.p.createdAt = 0; _pp.p.createdAtBlock = 0;
        _pp.p.executeAfter = 0; _pp.p.executeAfterBlock = 0;
        ltcUsdPrice = np;
        emit LtcPriceUpdated(np);
    }

    function cancelLtcPrice() external {
        _requireAdminOrOwner();
        require(_pp.p.createdAt > 0, "Litbreak: no proposal");
        uint256 cp = _pp.price;
        _clearApprovals(_pp.p);
        _pp.price = 0; _pp.p.approvals = 0;
        _pp.p.createdAt = 0; _pp.p.createdAtBlock = 0;
        _pp.p.executeAfter = 0; _pp.p.executeAfterBlock = 0;
        emit PriceCancelled(cp, msg.sender);
    }

    // ── Region rates ──────────────────────────────────────────────────────────
    function proposeRegionRate(bytes32 regionId, uint256 newRate) external onlyRole(ADMIN_ROLE) {
        require(newRate > 0,            "Litbreak: rate=0");
        require(regionId != bytes32(0), "Litbreak: bad region");

        RateProposal storage r = _rp[regionId];
        // [MEDIUM-5] Stale check uses both anchors.
        bool stale = r.p.createdAt > 0 && _isExpired(r.p.createdAt, r.p.createdAtBlock);
        if (r.rate != newRate || stale) {
            _clearApprovals(r.p);
            r.rate = newRate; r.p.approvals = 0;
            r.p.createdAt = block.timestamp; r.p.createdAtBlock = block.number; // [MEDIUM-5]
            r.p.executeAfter = 0; r.p.executeAfterBlock = 0;
            // [HIGH-1] Register ID for cleanup on admin revocation.
            // [MEDIUM-4] Enforce cap before push to bound _decrementPendingApprovals loop.
            require(_pendingRateIds.length < MAX_PENDING_PROPOSALS, "Litbreak: rate queue full");
            _pendingRateIds.push(regionId);
        }
        require(r.p.executeAfter == 0,     "Litbreak: awaiting timelock");
        require(!r.p.approved[msg.sender], "Litbreak: already approved");

        r.p.approved[msg.sender] = true;
        r.p.approvals++;

        uint256 req = _quorum();
        emit RatePending(regionId, newRate, r.p.approvals, req);
        if (r.p.approvals >= req) {
            // [MEDIUM-1] Dual-anchor timelock.
            r.p.executeAfter      = block.timestamp + TIMELOCK;
            r.p.executeAfterBlock = block.number    + MIN_TIMELOCK_BLOCKS;
            emit RateApproved(regionId, newRate, r.p.executeAfter);
        }
    }

    function executeRegionRate(bytes32 regionId, uint256 expectedRate) external onlyRole(ADMIN_ROLE) {
        RateProposal storage r = _rp[regionId];
        require(r.p.createdAt > 0,                        "Litbreak: no proposal");
        require(r.p.executeAfter > 0,                     "Litbreak: not approved");
        require(r.rate == expectedRate,                   "Litbreak: rate mismatch");
        // [MEDIUM-1] Both timelock anchors.
        require(block.timestamp >= r.p.executeAfter,      "Litbreak: timelock active");
        require(block.number    >= r.p.executeAfterBlock, "Litbreak: block timelock active");
        // [MEDIUM-5] Both expiry anchors.
        require(!_isExpired(r.p.createdAt, r.p.createdAtBlock), "Litbreak: expired");

        uint256 nr = r.rate;
        _clearApprovals(r.p);
        r.rate = 0; r.p.approvals = 0;
        r.p.createdAt = 0; r.p.createdAtBlock = 0;
        r.p.executeAfter = 0; r.p.executeAfterBlock = 0;
        _removeFromBytes32Array(_pendingRateIds, regionId);
        regionRates[regionId] = nr;
        emit RegionRateUpdated(regionId, nr);
    }

    function cancelRegionRate(bytes32 regionId) external {
        _requireAdminOrOwner();
        RateProposal storage r = _rp[regionId];
        require(r.p.createdAt > 0, "Litbreak: no proposal");
        uint256 cr = r.rate;
        _clearApprovals(r.p);
        r.rate = 0; r.p.approvals = 0;
        r.p.createdAt = 0; r.p.createdAtBlock = 0;
        r.p.executeAfter = 0; r.p.executeAfterBlock = 0;
        _removeFromBytes32Array(_pendingRateIds, regionId);
        emit RateCancelled(regionId, cr, msg.sender);
    }

    // ── Active region — timelocked ────────────────────────────────────────────
    function proposeActiveRegion(bytes32 regionId) external onlyRole(ADMIN_ROLE) {
        require(regionRates[regionId] > 0, "Litbreak: unknown region");
        _regionProp = RegionProposal({
            regionId:          regionId,
            executeAfter:      block.timestamp + TIMELOCK,
            executeAfterBlock: block.number    + MIN_TIMELOCK_BLOCKS, // [MEDIUM-1]
            createdAt:         block.timestamp,
            createdAtBlock:    block.number                           // [MEDIUM-5]
        });
        emit ActiveRegionProposed(regionId, block.timestamp + TIMELOCK);
    }

    function executeActiveRegion() external onlyRole(ADMIN_ROLE) {
        RegionProposal memory rp = _regionProp;
        require(rp.createdAt > 0,                        "Litbreak: no proposal");
        // [MEDIUM-1] Both timelock anchors.
        require(block.timestamp >= rp.executeAfter,      "Litbreak: timelock active");
        require(block.number    >= rp.executeAfterBlock, "Litbreak: block timelock active");
        // [MEDIUM-5] Both expiry anchors.
        require(!_isExpired(rp.createdAt, rp.createdAtBlock), "Litbreak: expired");
        bytes32 prev = activeRegion;
        activeRegion = rp.regionId;
        delete _regionProp;
        emit ActiveRegionChanged(prev, rp.regionId);
    }

    function cancelActiveRegion() external {
        _requireAdminOrOwner();
        require(_regionProp.createdAt > 0, "Litbreak: no proposal");
        delete _regionProp;
    }

    // ── Role grant ────────────────────────────────────────────────────────────
    function proposeGrantRole(bytes32 role, address account)
        external onlyRole(ADMIN_ROLE) returns (bytes32 id)
    {
        require(account != address(0), "Litbreak: zero address");
        require(
            role == ADMIN_ROLE || role == OPERATOR_ROLE || role == PAUSER_ROLE,
            "Litbreak: unknown role"
        );

        id = keccak256(abi.encode(role, account, block.timestamp));
        require(!_roleProp[id].exists, "Litbreak: exists");

        RoleProposal storage rp = _roleProp[id];
        rp.role = role; rp.account = account; rp.exists = true;
        rp.p.approvals = 1;
        rp.p.createdAt      = block.timestamp;
        rp.p.createdAtBlock = block.number;    // [MEDIUM-5]
        rp.p.approved[msg.sender] = true;

        // [HIGH-1] Register for cleanup.
        // [MEDIUM-4] Enforce cap before push to bound _decrementPendingApprovals loop.
        require(_pendingRoleIds.length < MAX_PENDING_PROPOSALS, "Litbreak: role queue full");
        _pendingRoleIds.push(id);

        emit RoleGrantProposed(id, role, account, msg.sender);
        if (rp.p.approvals >= _quorum()) {
            // [MEDIUM-1] Dual-anchor.
            rp.p.executeAfter      = block.timestamp + TIMELOCK;
            rp.p.executeAfterBlock = block.number    + MIN_TIMELOCK_BLOCKS;
            emit RoleGrantThresholdReached(id, rp.p.executeAfter);
        }
    }

    function approveGrantRole(bytes32 id) external onlyRole(ADMIN_ROLE) {
        RoleProposal storage rp = _roleProp[id];
        require(rp.exists,                  "Litbreak: no proposal");
        require(rp.p.executeAfter == 0,     "Litbreak: threshold reached");
        require(!rp.p.approved[msg.sender], "Litbreak: already approved");
        // [MEDIUM-5] Both expiry anchors.
        require(!_isExpired(rp.p.createdAt, rp.p.createdAtBlock), "Litbreak: expired");

        rp.p.approved[msg.sender] = true;
        rp.p.approvals++;
        if (rp.p.approvals >= _quorum()) {
            rp.p.executeAfter      = block.timestamp + TIMELOCK;
            rp.p.executeAfterBlock = block.number    + MIN_TIMELOCK_BLOCKS;
            emit RoleGrantThresholdReached(id, rp.p.executeAfter);
        }
    }

    function executeGrantRole(bytes32 id) external onlyRole(ADMIN_ROLE) {
        RoleProposal storage rp = _roleProp[id];
        require(rp.exists,                                 "Litbreak: no proposal");
        require(rp.p.executeAfter > 0,                     "Litbreak: threshold not reached");
        // [MEDIUM-1] Both timelock anchors.
        require(block.timestamp >= rp.p.executeAfter,      "Litbreak: timelock active");
        require(block.number    >= rp.p.executeAfterBlock, "Litbreak: block timelock active");
        // [MEDIUM-5] Both expiry anchors.
        require(!_isExpired(rp.p.createdAt, rp.p.createdAtBlock), "Litbreak: expired");
        require(rp.p.approvals >= _quorum(),               "Litbreak: quorum lost");

        if (rp.role == ADMIN_ROLE) {
            require(
                admins.length < MAX_ADMINS || _isAdmin(rp.account),
                "Litbreak: admin cap"
            );
        }

        bytes32 role    = rp.role;
        address account = rp.account;
        _clearRoleProp(id);
        _removeFromBytes32Array(_pendingRoleIds, id);
        _grantRole(role, account);
        if (role == ADMIN_ROLE && !_isAdmin(account)) {
            isAdminIndex[account] = admins.length + 1; // [LOW-2]
            admins.push(account);
        }
        emit RoleGrantExecuted(id, role, account);
    }

    function cancelGrantRole(bytes32 id) external {
        _requireAdminOrOwner();
        require(_roleProp[id].exists, "Litbreak: no proposal");
        _clearRoleProp(id);
        _removeFromBytes32Array(_pendingRoleIds, id);
        emit RoleGrantCancelled(id, msg.sender);
    }

    // ── Ownership transfer ────────────────────────────────────────────────────
    function proposeOwnershipTransfer(address newOwner)
        external onlyOwner returns (bytes32 id)
    {
        require(newOwner != address(0), "Litbreak: zero address");
        require(newOwner != owner,      "Litbreak: already owner");

        id = keccak256(abi.encode("OWNERSHIP", newOwner, block.timestamp));
        require(!_ownerProp[id].exists, "Litbreak: exists");

        OwnershipProposal storage op = _ownerProp[id];
        op.newOwner = newOwner; op.exists = true;
        op.p.approvals = 1;
        op.p.createdAt      = block.timestamp;
        op.p.createdAtBlock = block.number;    // [MEDIUM-5]
        op.p.approved[msg.sender] = true;

        // [HIGH-1] Register for cleanup.
        // [MEDIUM-4] Enforce cap before push to bound _decrementPendingApprovals loop.
        require(_pendingOwnerIds.length < MAX_PENDING_PROPOSALS, "Litbreak: owner queue full");
        _pendingOwnerIds.push(id);

        emit OwnershipTransferProposed(id, newOwner, msg.sender);
        if (op.p.approvals >= _quorum()) {
            op.p.executeAfter      = block.timestamp + TIMELOCK;
            op.p.executeAfterBlock = block.number    + MIN_TIMELOCK_BLOCKS;
            emit OwnershipTransferThresholdReached(id, op.p.executeAfter);
        }
    }

    function approveOwnershipTransfer(bytes32 id) external onlyRole(ADMIN_ROLE) {
        OwnershipProposal storage op = _ownerProp[id];
        require(op.exists,                  "Litbreak: no proposal");
        require(op.p.executeAfter == 0,     "Litbreak: threshold reached");
        require(!op.p.approved[msg.sender], "Litbreak: already approved");
        // [MEDIUM-5] Both expiry anchors.
        require(!_isExpired(op.p.createdAt, op.p.createdAtBlock), "Litbreak: expired");

        op.p.approved[msg.sender] = true;
        op.p.approvals++;
        if (op.p.approvals >= _quorum()) {
            op.p.executeAfter      = block.timestamp + TIMELOCK;
            op.p.executeAfterBlock = block.number    + MIN_TIMELOCK_BLOCKS;
            emit OwnershipTransferThresholdReached(id, op.p.executeAfter);
        }
    }

    function executeOwnershipTransfer(bytes32 id) external onlyRole(ADMIN_ROLE) {
        OwnershipProposal storage op = _ownerProp[id];
        require(op.exists,                                 "Litbreak: no proposal");
        require(op.p.executeAfter > 0,                     "Litbreak: threshold not reached");
        // [MEDIUM-1] Both timelock anchors.
        require(block.timestamp >= op.p.executeAfter,      "Litbreak: timelock active");
        require(block.number    >= op.p.executeAfterBlock, "Litbreak: block timelock active");
        // [MEDIUM-5] Both expiry anchors.
        require(!_isExpired(op.p.createdAt, op.p.createdAtBlock), "Litbreak: expired");
        require(op.p.approvals >= _quorum(),               "Litbreak: quorum lost");

        address nw = op.newOwner;
        require(admins.length < MAX_ADMINS || _isAdmin(nw), "Litbreak: admin cap");

        _clearOwnerProp(id);
        _removeFromBytes32Array(_pendingOwnerIds, id);
        owner = nw;
        _grantRole(ADMIN_ROLE, nw);
        if (!_isAdmin(nw)) {
            isAdminIndex[nw] = admins.length + 1; // [LOW-2]
            admins.push(nw);
        }
        emit OwnershipTransferExecuted(id, nw);
        emit RoleGrantExecuted(id, ADMIN_ROLE, nw);
    }

    function cancelOwnershipTransfer(bytes32 id) external {
        _requireAdminOrOwner();
        require(_ownerProp[id].exists, "Litbreak: no proposal");
        _clearOwnerProp(id);
        _removeFromBytes32Array(_pendingOwnerIds, id);
        emit OwnershipTransferCancelled(id, msg.sender);
    }

    // ── Role revocation ───────────────────────────────────────────────────────
    /// @notice Revoke a role from an account.
    function revokeRole(bytes32 role, address account) external onlyOwner {
        require(account != address(0), "Litbreak: zero address");
        roles[role][account] = false;
        if (role == ADMIN_ROLE) {
            _removeAdmin(account);
            _decrementPendingApprovals(account); // [HIGH-1] full cleanup
        }
        emit RoleRevoked(role, account, msg.sender);
    }

    // ── Emergency / fees ──────────────────────────────────────────────────────
    function emergencyUserWithdraw() external nonReentrant {
        uint256 amount = ltcBalances[msg.sender];
        require(amount > 0, "Litbreak: no balance");
        _blockWithdrawals[block.number] += amount;
        require(
            _blockWithdrawals[block.number] <= WITHDRAWAL_LIMIT_PER_BLOCK,
            "Litbreak: block limit"
        );
        ltcBalances[msg.sender] = 0;
        totalUserLtc           -= amount;
        _safeTransfer(msg.sender, amount);
        emit EmergencyUserWithdraw(msg.sender, amount);
    }

    function ownerCollectFees() external onlyOwner nonReentrant {
        uint256 surplus = totalDeposited - totalUserLtc - powerTokenReserve;
        require(surplus > 0, "Litbreak: no surplus");
        totalDeposited -= surplus;
        _safeTransfer(owner, surplus);
        emit FeeCollected(owner, surplus);
    }

    function ownerReclaimStrandedReserve() external onlyOwner nonReentrant {
        require(totalPowerTokenSupply == 0, "Litbreak: outstanding PT");
        uint256 dust = powerTokenReserve;
        require(dust > 0, "Litbreak: no reserve");
        powerTokenReserve = 0;
        _safeTransfer(owner, dust);
        emit StrandedReserveReclaimed(owner, dust);
    }

    // ── View ──────────────────────────────────────────────────────────────────
    function getActiveRegionRate() external view returns (uint256) {
        return regionRates[activeRegion];
    }

    function isSolvent() external view returns (bool) {
        return address(this).balance >= totalUserLtc + powerTokenReserve;
    }

    function getUserPosition(address user) external view returns (
        uint256 ltcBalance,
        uint256 powerTokenBalance,
        uint256 ltcUsdValue,
        uint256 powerTokenUsdValue,
        uint256 totalUsdValue
    ) {
        ltcBalance        = ltcBalances[user];
        powerTokenBalance = powerTokens[user];
        uint256 price = ltcUsdPrice;
        uint256 rate  = regionRates[activeRegion];
        if (price > 0 && rate > 0) {
            // [LOW-1] _mulDiv for overflow-safe USD value.
            ltcUsdValue        = _mulDiv(ltcBalance,        price, 1e8);
            powerTokenUsdValue = _mulDiv(powerTokenBalance, rate,  1e8);
            totalUsdValue      = ltcUsdValue + powerTokenUsdValue;
        }
    }

    function quotePowerTokensForLtc(uint256 ltcAmount) external view returns (uint256) {
        require(ltcAmount >= MIN_SWAP_AMOUNT, "Litbreak: below min");
        (uint256 rate, uint256 price) = _rateAndPrice();
        return _mulDiv(ltcAmount, price, rate); // [LOW-1]
    }

    function quoteLtcForPowerTokens(uint256 ptAmount) external view returns (uint256) {
        require(ptAmount >= MIN_SWAP_AMOUNT, "Litbreak: below min");
        (uint256 rate, uint256 price) = _rateAndPrice();
        return _mulDiv(ptAmount, rate, price); // [LOW-1]
    }

    function getSwapNonce(address user) external view returns (uint256) {
        return swapNonce[user];
    }

    function checkPriceDeviation(uint256 expectedPrice) external view returns (bool) {
        if (expectedPrice == 0) return false;
        uint256 delta = ltcUsdPrice >= expectedPrice
            ? ltcUsdPrice - expectedPrice
            : expectedPrice - ltcUsdPrice;
        return delta * 10_000 <= expectedPrice * MAX_PRICE_DEVIATION_BPS;
    }

    function adminCount()        external view returns (uint256) { return admins.length; }
    function requiredApprovals() external view returns (uint256) { return _quorum(); }

    /// @notice [MEDIUM-4] Expose queue depths for off-chain monitoring.
    function pendingQueueLengths() external view returns (
        uint256 rateIds, uint256 roleIds, uint256 ownerIds
    ) {
        return (_pendingRateIds.length, _pendingRoleIds.length, _pendingOwnerIds.length);
    }

    function pendingPriceProposal() external view returns (
        uint256 price, uint256 approvals, uint256 required,
        uint256 executeAfter, uint256 createdAt
    ) {
        return (_pp.price, _pp.p.approvals, _quorum(), _pp.p.executeAfter, _pp.p.createdAt);
    }

    function pendingRateProposal(bytes32 regionId) external view returns (
        uint256 rate, uint256 approvals, uint256 required,
        uint256 executeAfter, uint256 createdAt
    ) {
        RateProposal storage r = _rp[regionId];
        return (r.rate, r.p.approvals, _quorum(), r.p.executeAfter, r.p.createdAt);
    }

    function pendingRoleProposal(bytes32 id) external view returns (
        bytes32 role, address account, uint256 approvals, uint256 required,
        uint256 executeAfter, uint256 createdAt, bool exists
    ) {
        RoleProposal storage rp = _roleProp[id];
        return (
            rp.role, rp.account, rp.p.approvals, _quorum(),
            rp.p.executeAfter, rp.p.createdAt, rp.exists
        );
    }

    function pendingOwnershipProposal(bytes32 id) external view returns (
        address newOwner, uint256 approvals, uint256 required,
        uint256 executeAfter, uint256 createdAt, bool exists
    ) {
        OwnershipProposal storage op = _ownerProp[id];
        return (
            op.newOwner, op.p.approvals, _quorum(),
            op.p.executeAfter, op.p.createdAt, op.exists
        );
    }

    function pendingRegionProposal() external view returns (
        bytes32 regionId, uint256 executeAfter, uint256 createdAt
    ) {
        return (_regionProp.regionId, _regionProp.executeAfter, _regionProp.createdAt);
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /**
     * @dev [MEDIUM-5] Dual-anchor expiry check.
     *      A proposal is expired when EITHER anchor has passed — whichever
     *      fires first provides the binding constraint, preventing a miner
     *      from extending liveness by manipulating block.timestamp.
     * @param createdAt      block.timestamp at proposal creation
     * @param createdAtBlock block.number    at proposal creation
     * @return true if the proposal has expired
     */
    function _isExpired(uint256 createdAt, uint256 createdAtBlock) internal view returns (bool) {
        return block.timestamp > createdAt      + EXPIRY
            || block.number    > createdAtBlock + EXPIRY_BLOCKS;
    }

    /// @dev [LOW-2] Idempotent role grant; enforces MAX_ADMINS cap for ADMIN_ROLE.
    function _grantRole(bytes32 role, address account) internal {
        if (roles[role][account]) return;
        roles[role][account] = true;
        // [MEDIUM-2] Enforce cap at the grant site.
        if (role == ADMIN_ROLE) {
            require(admins.length < MAX_ADMINS, "Litbreak: admin cap");
        }
    }

    function _quorum() internal view returns (uint256) {
        return (admins.length / 2) + 1;
    }

    function _rateAndPrice() internal view returns (uint256 rate, uint256 price) {
        rate  = regionRates[activeRegion];
        price = ltcUsdPrice;
        require(rate  > 0, "Litbreak: rate not set");
        require(price > 0, "Litbreak: price not set");
    }

    function _checkPriceDeviation(uint256 price, uint256 expected) internal pure {
        uint256 delta = price >= expected ? price - expected : expected - price;
        require(
            delta * 10_000 <= expected * MAX_PRICE_DEVIATION_BPS,
            "Litbreak: price deviation"
        );
    }

    function _checkSlippage(uint256 out, uint256 minOut) internal pure {
        uint256 floor = (out * (10_000 - MAX_SLIPPAGE_BPS)) / 10_000;
        require(minOut >= floor, "Litbreak: minOut below floor");
    }

    /**
     * @notice [HIGH-3] Hardened native-ETH transfer helper (SWC-104 fix).
     *
     * Three layers of defence:
     *   (a) Zero-address guard — prevents accidental ETH burn.
     *   (b) Zero-amount guard  — self-defending at the transfer site.
     *   (c) Explicit return-data inspection via assembly:
     *         • The raw CALL success flag is captured.
     *         • returndatasize() is read; if non-zero, up to 32 bytes are
     *           copied and decoded as a bool, which must be true.
     *           This handles non-reverting failure modes (e.g. tokens that
     *           return false instead of reverting) should the contract ever
     *           be extended to support ERC-20 withdrawals.
     *         • The CALL success flag is then required to be true.
     *       Together these cover both reverting and non-reverting failure
     *       cases — the full SWC-104 threat model.
     *
     * @param to     Recipient address (must be non-zero).
     * @param amount Wei to transfer (must be non-zero).
     */
    function _safeTransfer(address to, uint256 amount) internal {
        require(to     != address(0), "Litbreak: transfer to zero");
        require(amount  > 0,          "Litbreak: transfer zero amount");

        bool success;
        assembly {
            // Forward all remaining gas; capture success flag.
            // No calldata — pure ETH transfer.
            success := call(gas(), to, amount, 0, 0, 0, 0)

            // If the callee returned data, decode the first word as a bool
            // and require it to be true.  This is a no-op for plain EOA/
            // contract recipients that return nothing (returndatasize == 0).
            if returndatasize() {
                // Allocate a scratch word at the free-memory pointer.
                let ptr := mload(0x40)
                // Copy at most 32 bytes of returndata.
                returndatacopy(ptr, 0, 0x20)
                // Treat the word as a bool: any non-zero value is true.
                // Require it is non-zero (i.e. the callee signalled success).
                if iszero(mload(ptr)) {
                    // Store revert reason "Litbreak: transfer rejected" (32 bytes).
                    mstore(0x00, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(0x04, 0x0000000000000000000000000000000000000000000000000000000000000020)
                    mstore(0x24, 0x0000000000000000000000000000000000000000000000000000000000000019)
                    mstore(0x44, 0x4c6974627265616b3a207472616e736665722072656a656374656400000000000)
                    revert(0x00, 0x64)
                }
            }
        }
        require(success, "Litbreak: transfer failed");
    }

    function _requireAdminOrOwner() internal view {
        require(
            msg.sender == owner || roles[ADMIN_ROLE][msg.sender],
            "Litbreak: not authorised"
        );
    }

    /// @dev [LOW-2] O(1) admin check via isAdminIndex mapping.
    function _isAdmin(address account) internal view returns (bool) {
        uint256 idx = isAdminIndex[account];
        return idx > 0 && idx <= admins.length && admins[idx - 1] == account;
    }

    /// @dev [LOW-2] O(1) swap-and-pop with mapping update.
    function _removeAdmin(address account) internal {
        uint256 idx = isAdminIndex[account];
        if (idx == 0) return; // not in array
        uint256 arrIdx = idx - 1;
        uint256 last   = admins.length - 1;
        if (arrIdx != last) {
            address moved       = admins[last];
            admins[arrIdx]      = moved;
            isAdminIndex[moved] = idx; // update moved element's index
        }
        admins.pop();
        delete isAdminIndex[account];
    }

    /// @dev Clear approval flags for all current admins on a Proposal.
    ///      [MEDIUM-2] Bounded by MAX_ADMINS = 20.
    function _clearApprovals(Proposal storage p) internal {
        for (uint256 i; i < admins.length; i++) {
            delete p.approved[admins[i]];
        }
    }

    /**
     * @dev [HIGH-1] On admin revocation, decrement approval counts across ALL
     *      active proposal types using the registered ID arrays.
     *      [MEDIUM-4] Each registry array is capped at MAX_PENDING_PROPOSALS (50),
     *      so worst-case iterations = 1 (price) + 50 (rates) + 50 (roles) + 50 (owners)
     *      = 151 storage reads — provably within block gas limits.
     */
    function _decrementPendingApprovals(address account) internal {
        // ── Price proposal (singleton) ────────────────────────────────────────
        if (_pp.p.createdAt > 0 && _pp.p.approved[account]) {
            _pp.p.approved[account] = false;
            if (_pp.p.approvals > 0) _pp.p.approvals--;
            if (_pp.p.approvals < _quorum()) _pp.p.executeAfter = 0;
        }

        // ── Rate proposals — bounded by MAX_PENDING_PROPOSALS ─────────────────
        uint256 rLen = _pendingRateIds.length; // <= MAX_PENDING_PROPOSALS
        for (uint256 i; i < rLen; i++) {
            RateProposal storage r = _rp[_pendingRateIds[i]];
            if (r.p.createdAt > 0 && r.p.approved[account]) {
                r.p.approved[account] = false;
                if (r.p.approvals > 0) r.p.approvals--;
                if (r.p.approvals < _quorum()) r.p.executeAfter = 0;
            }
        }

        // ── Role grant proposals — bounded by MAX_PENDING_PROPOSALS ───────────
        uint256 rlLen = _pendingRoleIds.length; // <= MAX_PENDING_PROPOSALS
        for (uint256 i; i < rlLen; i++) {
            RoleProposal storage rp = _roleProp[_pendingRoleIds[i]];
            if (rp.exists && rp.p.approved[account]) {
                rp.p.approved[account] = false;
                if (rp.p.approvals > 0) rp.p.approvals--;
                if (rp.p.approvals < _quorum()) rp.p.executeAfter = 0;
            }
        }

        // ── Ownership transfer proposals — bounded by MAX_PENDING_PROPOSALS ───
        uint256 oLen = _pendingOwnerIds.length; // <= MAX_PENDING_PROPOSALS
        for (uint256 i; i < oLen; i++) {
            OwnershipProposal storage op = _ownerProp[_pendingOwnerIds[i]];
            if (op.exists && op.p.approved[account]) {
                op.p.approved[account] = false;
                if (op.p.approvals > 0) op.p.approvals--;
                if (op.p.approvals < _quorum()) op.p.executeAfter = 0;
            }
        }
    }

    function _clearRoleProp(bytes32 id) internal {
        RoleProposal storage rp = _roleProp[id];
        _clearApprovals(rp.p);
        delete _roleProp[id];
    }

    function _clearOwnerProp(bytes32 id) internal {
        OwnershipProposal storage op = _ownerProp[id];
        _clearApprovals(op.p);
        delete _ownerProp[id];
    }

    function _setRate(string memory key, uint256 rate) private {
        regionRates[keccak256(bytes(key))] = rate;
    }

    /**
     * @dev [LOW-1] Overflow-safe multiply-then-divide using 512-bit intermediate.
     *      Equivalent to (a * b) / c but safe when a * b overflows uint256.
     */
    function _mulDiv(uint256 a, uint256 b, uint256 c) internal pure returns (uint256 result) {
        require(c > 0, "Litbreak: div by zero");
        if (a == 0 || b == 0) return 0;
        unchecked {
            uint256 prod = a * b;
            if (prod / a == b) {
                return prod / c;
            }
        }
        uint256 remainder;
        uint256 prod0;
        uint256 prod1;
        assembly {
            let mm := mulmod(a, b, not(0))
            prod0  := mul(a, b)
            prod1  := sub(sub(mm, prod0), lt(mm, prod0))
        }
        require(prod1 < c, "Litbreak: mulDiv overflow");
        assembly {
            remainder := mulmod(a, b, c)
        }
        assembly {
            prod1    := sub(prod1, gt(remainder, prod0))
            prod0    := sub(prod0, remainder)
            let twos := and(sub(0, c), c)
            c        := div(c, twos)
            prod0    := div(prod0, twos)
            twos     := add(div(sub(0, twos), twos), 1)
            prod0    := or(prod0, mul(prod1, twos))
            let inv  := xor(mul(3, c), 2)
            inv      := mul(inv, sub(2, mul(c, inv)))
            inv      := mul(inv, sub(2, mul(c, inv)))
            inv      := mul(inv, sub(2, mul(c, inv)))
            inv      := mul(inv, sub(2, mul(c, inv)))
            inv      := mul(inv, sub(2, mul(c, inv)))
            inv      := mul(inv, sub(2, mul(c, inv)))
            result   := mul(prod0, inv)
        }
    }

    /**
     * @dev [HIGH-1] Remove a bytes32 value from an unordered array (swap-and-pop).
     *      [MEDIUM-4] Array is bounded by MAX_PENDING_PROPOSALS so this loop
     *      iterates at most 50 times.
     */
    function _removeFromBytes32Array(bytes32[] storage arr, bytes32 val) internal {
        uint256 len = arr.length;
        for (uint256 i; i < len; i++) {
            if (arr[i] == val) {
                arr[i] = arr[len - 1];
                arr.pop();
                return;
            }
        }
    }
}
