// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title LitbreakProtocol
 * @author Litbreak Team
 * @notice Energy-indexed token with multi-oracle price consensus on LitVM (Litecoin L2)
 * @dev Fully self-contained — no external imports.
 *      Native value token on LitVM is LTC (bridged Litecoin).
 *
 * Security Audit History:
 *   Pass 1 — 8 findings resolved
 *   Pass 2 — 11 findings resolved (VULN-01 through VULN-11)
 *   Pass 3 — 14 findings resolved (VULN-P3-01 through VULN-P3-14)
 *   Pass 4 — 14 findings resolved (EXT-01 through EXT-08, dApp-01 through dApp-06)
 *   Pass 5 — 11 findings resolved (P5-01 through P5-07 contract, P5-08 through P5-11 dApp)
 *   Pass 6 — 1 finding resolved (P6-01)
 *   Pass 7 — 2 findings resolved (P7-01, P7-02)
 *   Pass 8 — 1 finding resolved (P8-01)
 *   Pass 9 — 1 finding resolved (P9-01)
 *   Pass 10 — ETH→LTC migration (comments, events, error messages, NatSpec)
 *   Pass 10.3 — 1 finding resolved (P10.3-01: strict CEI in mint())
 *   Pass 10.4 — 1 finding resolved (P10.4-01: timelock + change cap for resetOracleBaseline)
 *   Pass 12 — 1 finding resolved (P12-01: guardian co-signer for critical oracle management)
 *   Pass 13 — 6 findings resolved (P13-01 through P13-06)
 *
 * Pass 13 Changelog:
 *   P13-01 (MEDIUM) — Expired Proposal Counter Inflation DoS:
 *     - Added permissionless `cleanupExpiredProposal()` to decrement `activeProposalCount`
 *       for proposals past PROPOSAL_EXPIRY, preventing proposal system DoS.
 *     - New event: ProposalExpiredAndCleaned.
 *   P13-02 (MEDIUM) — No Slippage Protection on Mint/Redeem:
 *     - Extracted core logic into `_mintCore(uint256)` and `_redeemCore(uint256,uint256)`.
 *     - Added `mintWithMinOutput(uint256)` and `redeemWithMinOutput(uint256,uint256)`.
 *     - Existing `mint()` and `redeem()` signatures preserved (delegate to core with 0 slippage).
 *   P13-03 (MEDIUM) — ABI Type Mismatch (frontend-only fix in ContractABI.ts).
 *   P13-04 (LOW) — Zero-Amount Transfers:
 *     - Added `require(amount > 0)` to `transfer()` and `transferFrom()`.
 *   P13-05 (LOW) — Redundant Storage Write:
 *     - Removed `delete oracleIndex[_oracle]` in `_executeAddOracle()` (immediately overwritten).
 *   P13-06 (LOW) — State Variable Coupling:
 *     - `_tryAggregatePrice()` now receives submitter as parameter instead of reading
 *       `_lastSubmittingOracle` from storage. Saves ~2,100 gas per oracle submission.
 *     - `_lastSubmittingOracle` still set in `submitOraclePrice` for storage layout preservation.
 *   CONTRACT_VERSION bumped to 13.
 */
contract LitbreakProtocol {
    // ─── Constants ───────────────────────────────────────────────────
    string public constant name = "Litbreak Token";
    string public constant symbol = "LITB";
    uint8 public constant decimals = 18;

    /// @notice Contract version for upgrade coordination (bumped for Pass 13)
    uint256 public constant CONTRACT_VERSION = 13;

    uint256 public constant MAX_FEE_BPS = 500;
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant HARD_CAP = 21_000_000 * 1e18;
    uint256 public constant MIN_ENERGY_PRICE = 10_000;
    uint256 public constant MAX_ENERGY_PRICE = 1_000_000;
    uint256 public constant MAX_PRICE_CHANGE_RATIO = 200;
    uint256 public constant MAX_ORACLE_SELF_CHANGE_RATIO = 150;
    uint256 public constant MAX_ORACLES = 5;
    uint256 public constant MIN_ORACLE_QUORUM = 2;
    uint256 public constant ORACLE_STALENESS_THRESHOLD = 3600;
    uint256 public constant MAX_STALENESS = 3600;
    uint256 public constant TIMESTAMP_SAFETY_BUFFER = 15;
    uint256 public constant MAX_ORACLE_DEVIATION_BPS = 1000;
    uint256 public constant TWAP_WINDOW = 6;
    uint256 public constant ORACLE_SUBMISSION_COOLDOWN = 60;
    uint256 public constant MIN_EXCHANGE_RATE = 1e18;
    uint256 public constant MAX_EXCHANGE_RATE = 10_000 * 1e18;
    uint256 public constant MAX_RATE_CHANGE_BPS = 2000;

    /// @notice Maximum TWAP updates any single oracle can trigger per window (P3-12)
    uint256 public constant MAX_TWAP_UPDATES_PER_ORACLE_PER_WINDOW = 3;

    /// @notice Maximum TWAP updates across ALL oracles per window (P5-04)
    uint256 public constant MAX_GLOBAL_TWAP_UPDATES_PER_WINDOW = 6;

    /// @notice Automatic staleness recovery timeout: 24 hours (EXT-04)
    uint256 public constant AUTO_RECOVERY_TIMEOUT = 86400;

    /// @notice Timelock delay for critical parameter changes: 48 hours (EXT-05)
    uint256 public constant TIMELOCK_DELAY = 172800;

    /// @notice Minimum interval between oracle baseline price updates: 24 hours (P6-01)
    uint256 public constant BASELINE_UPDATE_INTERVAL = 86400;

    /// @notice Cooldown between auto-recovery attempts: 1 hour (P8-01)
    uint256 public constant AUTO_RECOVERY_COOLDOWN = 3600;

    /// @notice Duration of a TWAP rate-limiting epoch in seconds (P9-01)
    uint256 public constant TWAP_EPOCH_DURATION = 360;

    /// @notice Maximum baseline change per direct reset in basis points: 50% (P10.4-01)
    uint256 public constant MAX_BASELINE_CHANGE_BPS = 5000;

    /// @notice Proposal expiry duration: 7 days (P12-01)
    /// @dev Proposals not confirmed within this window are considered expired.
    uint256 public constant PROPOSAL_EXPIRY = 604800;

    /// @notice Maximum number of active (non-expired, non-executed) proposals (P12-01)
    uint256 public constant MAX_ACTIVE_PROPOSALS = 10;

    // ─── Proposal Types (P12-01) ─────────────────────────────────────
    /// @dev Enum-like constants for proposal action types.
    ///      Using uint8 constants instead of enum for gas efficiency and ABI clarity.
    uint8 public constant PROPOSAL_ADD_ORACLE = 1;
    uint8 public constant PROPOSAL_REMOVE_ORACLE = 2;
    uint8 public constant PROPOSAL_RESET_BASELINE = 3;
    uint8 public constant PROPOSAL_TRANSFER_OWNERSHIP = 4;
    uint8 public constant PROPOSAL_EMERGENCY_WITHDRAW = 5;
    uint8 public constant PROPOSAL_SET_GUARDIAN = 6;

    // ─── State ───────────────────────────────────────────────────────
    // CRITICAL: Storage layout must be preserved — new variables go at the END only.
    address public owner;
    bool public paused;
    bool private _locked;

    /// @notice Guardian address for dual-approval on critical operations (P12-01)
    address public guardian;

    uint256 public totalSupply;
    uint256 public energyPriceUsd;
    uint256 public exchangeRate;
    uint256 public feeBps;
    uint256 public lastPriceUpdate;
    bool public oracleStalenessPaused;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // Oracle state
    address[] public oracleList;
    mapping(address => bool) public isOracle;
    mapping(address => uint256) public oracleLastPrice;
    mapping(address => uint256) public oracleLastUpdate;
    mapping(address => uint256) public oracleBaselinePrice;

    /// @notice Timestamp when each oracle's baseline was last updated (P6-01)
    mapping(address => uint256) public oracleBaselineLastUpdate;

    // TWAP
    uint256[6] public twapPrices;
    uint256 public twapIndex;

    /// @notice Tracks TWAP update count per oracle per TWAP epoch (P3-12, P9-01)
    mapping(address => uint256) public oracleTwapWindowEpoch;
    mapping(address => uint256) public oracleTwapUpdatesInEpoch;

    /// @notice Address of the last oracle that submitted a price (EXT-02)
    /// @dev P13-06: Kept for storage layout preservation; _tryAggregatePrice now uses parameter.
    address private _lastSubmittingOracle;

    /// @notice Timestamp when staleness pause was triggered (EXT-04)
    uint256 public stalenessTriggeredAt;

    /// @notice Oracle index mapping for O(1) removal (EXT-07)
    mapping(address => uint256) public oracleIndex;

    /// @notice Timelock queue for critical parameter changes (EXT-05)
    mapping(bytes32 => uint256) public timelockQueue;

    /// @notice Global TWAP update count across all oracles per epoch (P5-04, P9-01)
    uint256 public globalTwapUpdatesInEpoch;

    /// @notice Current global TWAP window epoch — monotonic counter (P5-04, P9-01)
    uint256 public globalTwapWindowEpoch;

    /// @notice Timestamp of the last auto-recovery attempt (P8-01)
    uint256 public lastAutoRecoveryAttempt;

    /// @notice Timestamp when the current TWAP epoch started (P9-01)
    uint256 public twapEpochStartTime;

    /// @notice Monotonically increasing TWAP epoch counter (P9-01)
    uint256 public currentTwapEpoch;

    // ─── Guardian Proposal State (P12-01) ────────────────────────────

    /// @notice Monotonically increasing proposal ID counter
    uint256 public proposalCount;

    /// @notice Number of currently active (pending) proposals
    uint256 public activeProposalCount;

    /// @notice Proposal data structure
    struct Proposal {
        uint8 actionType;
        address proposer;
        address target;        // oracle address, new owner, or withdrawal recipient
        uint256 value;         // baseline price, withdrawal amount, or 0
        uint256 createdAt;
        bool executed;
        bool cancelled;
    }

    /// @notice Proposal storage by ID
    mapping(uint256 => Proposal) public proposals;

    // ─── Events ──────────────────────────────────────────────────────
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    /// @notice Pass 10: parameter renamed ethAmount → ltcAmount
    event Minted(address indexed to, uint256 ltcAmount, uint256 indexed powerAmount, uint256 fee);
    /// @notice Pass 10: parameter renamed ethAmount → ltcAmount
    event Redeemed(address indexed from, uint256 indexed powerAmount, uint256 ltcAmount, uint256 fee);
    event EnergyPriceUpdated(uint256 oldPrice, uint256 newPrice, address indexed oracle);
    event ExchangeRateUpdated(uint256 oldRate, uint256 newRate);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event OracleAdded(address indexed oracle);
    event OracleRemoved(address indexed oracle);
    event OracleSubmission(address indexed oracle, uint256 indexed price, uint256 timestamp);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
    event OracleStalenessPauseTriggered(uint256 timestamp);
    event OracleStalenessPauseResolved(address indexed by, uint256 timestamp);
    /// @notice Pass 10: renamed from EthReceived → LtcReceived
    event LtcReceived(address indexed sender, uint256 amount);
    event EmergencyWithdrawal(address indexed to, uint256 amount);
    event OracleDeviationSkipped(uint256 minPrice, uint256 maxPrice, uint256 deviationBps);
    event OracleTwapRateLimited(address indexed oracle, uint256 epoch, uint256 count);
    event StalenessAutoRecovered(address indexed triggeredBy, uint256 timestamp);
    event TimelockQueued(bytes32 indexed actionId, uint256 executeAfter, string description);
    event TimelockExecuted(bytes32 indexed actionId, uint256 timestamp);
    event TimelockCancelled(bytes32 indexed actionId);
    event GlobalTwapRateLimited(uint256 epoch, uint256 count);

    /// @notice Emitted when an oracle's baseline is automatically updated after interval (P6-01)
    event BaselineUpdated(address indexed oracle, uint256 oldBaseline, uint256 newBaseline, uint256 timestamp);

    /// @notice Emitted when the owner manually resets an oracle's baseline (P6-01, P10.4-01: now change-capped)
    event BaselineReset(address indexed oracle, uint256 oldBaseline, uint256 newBaseline, address indexed resetBy);

    /// @notice Emitted when a baseline is reset via the timelock path (P10.4-01)
    event BaselineResetViaTimelock(address indexed oracle, uint256 oldBaseline, uint256 newBaseline, bytes32 indexed actionId);

    /// @notice Emitted when a TWAP epoch transition occurs (P9-01)
    event TwapEpochAdvanced(uint256 indexed newEpoch, uint256 startTime);

    // ─── Guardian Events (P12-01) ────────────────────────────────────

    /// @notice Emitted when the guardian address is changed
    event GuardianSet(address indexed oldGuardian, address indexed newGuardian, address indexed setBy);

    /// @notice Emitted when a dual-approval proposal is created
    event ProposalCreated(uint256 indexed proposalId, uint8 actionType, address indexed proposer, address target, uint256 value);

    /// @notice Emitted when a proposal is confirmed and executed by the co-signer
    event ProposalExecuted(uint256 indexed proposalId, uint8 actionType, address indexed confirmedBy);

    /// @notice Emitted when a proposal is cancelled by owner or guardian
    event ProposalCancelled(uint256 indexed proposalId, address indexed cancelledBy);

    /// @notice Emitted when an expired proposal is cleaned up by anyone (P13-01)
    event ProposalExpiredAndCleaned(uint256 indexed proposalId, address indexed cleanedBy);

    // ─── Modifiers ───────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "Reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    /// @notice Restricts access to registered oracles or the contract owner (P8-01)
    modifier onlyOracleOrOwner() {
        require(isOracle[msg.sender] || msg.sender == owner, "Not oracle or owner");
        _;
    }

    /// @notice Restricts access to owner or guardian (P12-01)
    modifier onlyOwnerOrGuardian() {
        require(msg.sender == owner || msg.sender == guardian, "Not owner or guardian");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────
    /// @notice Deploy the LitbreakProtocol with initial configuration
    /// @param _initialOracle Initial oracle address (validated non-zero)
    /// @param _initialExchangeRate Initial LTC → LITB exchange rate scaled by 1e18
    /// @param _initialFeeBps Initial fee in basis points
    /// @param _initialEnergyPriceUsd Initial energy price scaled by 1e6
    constructor(
        address _initialOracle,
        uint256 _initialExchangeRate,
        uint256 _initialFeeBps,
        uint256 _initialEnergyPriceUsd
    ) {
        require(_initialOracle != address(0), "Zero oracle");
        require(
            _initialExchangeRate >= MIN_EXCHANGE_RATE && _initialExchangeRate <= MAX_EXCHANGE_RATE,
            "Bad rate"
        );
        require(_initialFeeBps <= MAX_FEE_BPS, "Fee too high");
        require(
            _initialEnergyPriceUsd >= MIN_ENERGY_PRICE && _initialEnergyPriceUsd <= MAX_ENERGY_PRICE,
            "Bad price"
        );

        owner = msg.sender;
        // guardian starts as address(0) — opt-in system
        exchangeRate = _initialExchangeRate;
        feeBps = _initialFeeBps;
        energyPriceUsd = _initialEnergyPriceUsd;
        lastPriceUpdate = block.timestamp;

        oracleList.push(_initialOracle);
        isOracle[_initialOracle] = true;
        oracleIndex[_initialOracle] = 0;
        oracleLastPrice[_initialOracle] = _initialEnergyPriceUsd;
        oracleLastUpdate[_initialOracle] = block.timestamp;
        oracleBaselinePrice[_initialOracle] = _initialEnergyPriceUsd;
        oracleBaselineLastUpdate[_initialOracle] = block.timestamp;

        for (uint256 i = 0; i < TWAP_WINDOW; i++) {
            twapPrices[i] = _initialEnergyPriceUsd;
        }

        // P9-01: Initialize monotonic epoch system
        twapEpochStartTime = block.timestamp;
        currentTwapEpoch = 0;

        emit OracleAdded(_initialOracle);
    }

    // ─── ERC-20 ──────────────────────────────────────────────────────

    /// @notice Transfer tokens to a recipient
    /// @dev P13-04: Added zero-amount check to prevent misleading Transfer events.
    function transfer(address to, uint256 amount) external whenNotPaused returns (bool) {
        require(to != address(0), "Zero address");
        require(amount > 0, "Zero amount");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "Zero address");
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) external returns (bool) {
        require(spender != address(0), "Zero address");
        uint256 newAllowance = allowance[msg.sender][spender] + addedValue;
        allowance[msg.sender][spender] = newAllowance;
        emit Approval(msg.sender, spender, newAllowance);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool) {
        require(spender != address(0), "Zero address");
        uint256 currentAllowance = allowance[msg.sender][spender];
        require(currentAllowance >= subtractedValue, "Decreased below zero");
        uint256 newAllowance = currentAllowance - subtractedValue;
        allowance[msg.sender][spender] = newAllowance;
        emit Approval(msg.sender, spender, newAllowance);
        return true;
    }

    /// @notice Transfer tokens from one address to another (requires allowance)
    /// @dev P13-04: Added zero-amount check to prevent misleading Transfer events.
    function transferFrom(address from, address to, uint256 amount) external whenNotPaused returns (bool) {
        require(to != address(0), "Zero address");
        require(amount > 0, "Zero amount");
        require(balanceOf[from] >= amount, "Insufficient balance");
        if (msg.sender != from) {
            require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
            allowance[from][msg.sender] -= amount;
        }
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    // ─── Mint / Redeem ───────────────────────────────────────────────

    /// @notice Mint LITB tokens by depositing LTC (native value on LitVM)
    /// @dev P13-02: Delegates to _mintCore with no slippage check (backward compatible).
    function mint() external payable whenNotPaused nonReentrant {
        _mintCore(0);
    }

    /// @notice Mint LITB tokens with slippage protection (P13-02)
    /// @param minOutput Minimum LITB tokens to receive; reverts if output is less
    function mintWithMinOutput(uint256 minOutput) external payable whenNotPaused nonReentrant {
        _mintCore(minOutput);
    }

    /// @notice Internal mint logic shared by mint() and mintWithMinOutput() (P13-02)
    /// @param minOutput Minimum acceptable output; 0 disables the check
    /// @dev P10.3-01: Strict CEI ordering enforced for audit consistency.
    function _mintCore(uint256 minOutput) internal {
        // ── 1. CHECKS ────────────────────────────────────────────────
        require(msg.value > 0, "Zero LTC");
        _requireFreshData();
        require(!oracleStalenessPaused, "Oracle staleness pause active");

        uint256 gross = (msg.value * exchangeRate) / 1e18;
        uint256 fee = (gross * feeBps) / BPS_DENOMINATOR;
        uint256 net = gross - fee;

        // P13-02: Slippage protection — revert if output below caller's minimum
        if (minOutput > 0) {
            require(net >= minOutput, "Slippage exceeded");
        }

        require(totalSupply + net <= HARD_CAP, "Exceeds hard cap");

        // ── 2. EFFECTS ───────────────────────────────────────────────
        totalSupply += net;
        balanceOf[msg.sender] += net;

        // ── 3. EVENTS ────────────────────────────────────────────────
        emit Transfer(address(0), msg.sender, net);
        emit Minted(msg.sender, msg.value, net, fee);
    }

    /// @notice Burn LITB tokens to receive LTC
    /// @param amount Amount of LITB tokens to redeem (18 decimals)
    /// @dev P13-02: Delegates to _redeemCore with no slippage check (backward compatible).
    function redeem(uint256 amount) external whenNotPaused nonReentrant {
        _redeemCore(amount, 0);
    }

    /// @notice Burn LITB tokens to receive LTC with slippage protection (P13-02)
    /// @param amount Amount of LITB tokens to redeem (18 decimals)
    /// @param minLtcOutput Minimum LTC to receive; reverts if output is less
    function redeemWithMinOutput(uint256 amount, uint256 minLtcOutput) external whenNotPaused nonReentrant {
        _redeemCore(amount, minLtcOutput);
    }

    /// @notice Internal redeem logic shared by redeem() and redeemWithMinOutput() (P13-02)
    /// @param amount Amount of LITB tokens to redeem
    /// @param minLtcOutput Minimum acceptable LTC output; 0 disables the check
    /// @dev P7-01: Strict CEI ordering — events emitted AFTER successful external call.
    function _redeemCore(uint256 amount, uint256 minLtcOutput) internal {
        // ── 1. CHECKS ────────────────────────────────────────────────
        require(amount > 0, "Zero amount");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        _requireFreshData();
        require(!oracleStalenessPaused, "Oracle staleness pause active");

        uint256 grossLtc = (amount * 1e18) / exchangeRate;
        uint256 fee = (grossLtc * feeBps) / BPS_DENOMINATOR;
        uint256 netLtc = grossLtc - fee;

        // P13-02: Slippage protection — revert if LTC output below caller's minimum
        if (minLtcOutput > 0) {
            require(netLtc >= minLtcOutput, "Slippage exceeded");
        }

        require(address(this).balance >= netLtc, "Insufficient LTC reserves");

        // ── 2. EFFECTS ───────────────────────────────────────────────
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;

        // ── 3. INTERACTIONS ──────────────────────────────────────────
        (bool success, ) = payable(msg.sender).call{value: netLtc}("");
        require(success, "LTC transfer failed");

        // ── 4. EVENTS (P7-01: emitted only after confirmed success) ─
        emit Transfer(msg.sender, address(0), amount);
        emit Redeemed(msg.sender, amount, netLtc, fee);
    }

    // ─── Oracle System ───────────────────────────────────────────────

    /// @notice Submit a new energy price from an authorized oracle
    /// @param _price Energy price in USD scaled by 1e6 (e.g., 142000 = $0.142/kWh)
    function submitOraclePrice(uint256 _price) public whenNotPaused {
        require(isOracle[msg.sender], "Not oracle");
        require(_price >= MIN_ENERGY_PRICE && _price <= MAX_ENERGY_PRICE, "Price out of range");

        require(
            block.timestamp >= oracleLastUpdate[msg.sender] + ORACLE_SUBMISSION_COOLDOWN,
            "Cooldown active"
        );

        uint256 baseline = oracleBaselinePrice[msg.sender];
        if (baseline > 0) {
            uint256 maxSelfChange = (baseline * MAX_ORACLE_SELF_CHANGE_RATIO) / 100;
            require(_price <= maxSelfChange, "Exceeds self-change cap");
        }

        oracleLastPrice[msg.sender] = _price;
        oracleLastUpdate[msg.sender] = block.timestamp;

        uint256 baselineLastSet = oracleBaselineLastUpdate[msg.sender];
        if (baselineLastSet == 0 || block.timestamp >= baselineLastSet + BASELINE_UPDATE_INTERVAL) {
            uint256 oldBaseline = oracleBaselinePrice[msg.sender];
            oracleBaselinePrice[msg.sender] = _price;
            oracleBaselineLastUpdate[msg.sender] = block.timestamp;
            emit BaselineUpdated(msg.sender, oldBaseline, _price, block.timestamp);
        }

        // P13-06: Keep setting for storage layout preservation; parameter used in aggregation
        _lastSubmittingOracle = msg.sender;

        emit OracleSubmission(msg.sender, _price, block.timestamp);

        // P13-06: Pass submitter directly instead of reading from storage
        _tryAggregatePrice(msg.sender);
    }

    /// @notice Convenience wrapper — delegates to submitOraclePrice internally (P3-01)
    function updateEnergyPrice(uint256 _price) external {
        submitOraclePrice(_price);
    }

    /// @notice Owner can manually reset an oracle's baseline price (P6-01)
    /// @dev P10.4-01: Enforces MAX_BASELINE_CHANGE_BPS (50%) cap.
    ///      P12-01: When guardian is set, requires dual-approval via proposal system.
    ///      When guardian is address(0), retains owner-only behavior (backward compatible).
    /// @param _oracle Address of the oracle whose baseline to reset
    /// @param _newBaseline New baseline price (must be within global range and change cap)
    function resetOracleBaseline(address _oracle, uint256 _newBaseline) external onlyOwner {
        // P12-01: If guardian is active, require proposal system for this action
        require(guardian == address(0), "Guardian active: use proposal system");

        require(isOracle[_oracle], "Not oracle");
        require(
            _newBaseline >= MIN_ENERGY_PRICE && _newBaseline <= MAX_ENERGY_PRICE,
            "Baseline out of range"
        );

        uint256 oldBaseline = oracleBaselinePrice[_oracle];

        // P10.4-01: Enforce change cap
        if (oldBaseline > 0) {
            uint256 maxDelta = (oldBaseline * MAX_BASELINE_CHANGE_BPS) / BPS_DENOMINATOR;
            uint256 delta = _newBaseline > oldBaseline
                ? _newBaseline - oldBaseline
                : oldBaseline - _newBaseline;
            require(delta <= maxDelta, "Baseline change exceeds cap, use timelock");
        }

        oracleBaselinePrice[_oracle] = _newBaseline;
        oracleBaselineLastUpdate[_oracle] = block.timestamp;

        emit BaselineReset(_oracle, oldBaseline, _newBaseline, msg.sender);
    }

    /// @notice Internal aggregation — computes consensus price from fresh oracle data
    /// @param submitter Address of the oracle that triggered this aggregation (P13-06)
    function _tryAggregatePrice(address submitter) internal {
        uint256 len = oracleList.length;
        if (len < MIN_ORACLE_QUORUM) return;

        uint256 freshCount;
        uint256 sum;
        uint256 minP = type(uint256).max;
        uint256 maxP;

        for (uint256 i = 0; i < len; i++) {
            address oracle = oracleList[i];
            bool isFresh = block.timestamp <= oracleLastUpdate[oracle] + MAX_STALENESS + TIMESTAMP_SAFETY_BUFFER;

            if (isFresh) {
                uint256 p = oracleLastPrice[oracle];
                sum += p;
                freshCount++;
                if (p < minP) minP = p;
                if (p > maxP) maxP = p;
            }

            uint256 remaining = len - i - 1;
            if (freshCount + remaining < MIN_ORACLE_QUORUM) {
                break;
            }
        }

        if (freshCount < MIN_ORACLE_QUORUM) {
            if (!oracleStalenessPaused) {
                oracleStalenessPaused = true;
                stalenessTriggeredAt = block.timestamp;
                emit OracleStalenessPauseTriggered(block.timestamp);
            }
            return;
        }

        if (oracleStalenessPaused) {
            oracleStalenessPaused = false;
            stalenessTriggeredAt = 0;
        }

        if (minP > 0) {
            uint256 deviationBps = ((maxP - minP) * BPS_DENOMINATOR) / minP;
            if (deviationBps > MAX_ORACLE_DEVIATION_BPS) {
                emit OracleDeviationSkipped(minP, maxP, deviationBps);
                return;
            }
        }

        uint256 avgPrice = sum / freshCount;

        if (energyPriceUsd > 0) {
            uint256 maxChange = (energyPriceUsd * MAX_PRICE_CHANGE_RATIO) / 100;
            if (avgPrice > maxChange) {
                return;
            }
        }

        // P9-01: Advance epoch if duration has elapsed
        _advanceEpochIfNeeded();

        // P13-06: Use parameter directly instead of SLOAD from _lastSubmittingOracle
        uint256 epochNow = currentTwapEpoch;

        if (oracleTwapWindowEpoch[submitter] != epochNow) {
            oracleTwapWindowEpoch[submitter] = epochNow;
            oracleTwapUpdatesInEpoch[submitter] = 0;
        }
        oracleTwapUpdatesInEpoch[submitter]++;

        if (globalTwapWindowEpoch != epochNow) {
            globalTwapWindowEpoch = epochNow;
            globalTwapUpdatesInEpoch = 0;
        }
        globalTwapUpdatesInEpoch++;

        uint256 oldPrice = energyPriceUsd;
        energyPriceUsd = avgPrice;
        lastPriceUpdate = block.timestamp;

        bool oracleUnderLimit = oracleTwapUpdatesInEpoch[submitter] <= MAX_TWAP_UPDATES_PER_ORACLE_PER_WINDOW;
        bool globalUnderLimit = globalTwapUpdatesInEpoch <= MAX_GLOBAL_TWAP_UPDATES_PER_WINDOW;

        if (oracleUnderLimit && globalUnderLimit) {
            twapPrices[twapIndex] = avgPrice;
            twapIndex = (twapIndex + 1) % TWAP_WINDOW;
        } else if (!oracleUnderLimit) {
            emit OracleTwapRateLimited(submitter, epochNow, oracleTwapUpdatesInEpoch[submitter]);
        } else {
            emit GlobalTwapRateLimited(epochNow, globalTwapUpdatesInEpoch);
        }

        emit EnergyPriceUpdated(oldPrice, avgPrice, submitter);
    }

    /// @notice Advance the TWAP epoch if the minimum duration has elapsed (P9-01)
    function _advanceEpochIfNeeded() internal {
        if (block.timestamp >= twapEpochStartTime + TWAP_EPOCH_DURATION) {
            currentTwapEpoch++;
            twapEpochStartTime = block.timestamp;
            emit TwapEpochAdvanced(currentTwapEpoch, block.timestamp);
        }
    }

    function _requireFreshData() internal view {
        require(
            block.timestamp <= lastPriceUpdate + ORACLE_STALENESS_THRESHOLD + TIMESTAMP_SAFETY_BUFFER,
            "Stale price data"
        );
    }

    function resolveOracleStaleness() external onlyOwner {
        require(oracleStalenessPaused, "Not stale-paused");
        oracleStalenessPaused = false;
        stalenessTriggeredAt = 0;
        emit OracleStalenessPauseResolved(msg.sender, block.timestamp);
    }

    /// @notice Trigger automatic recovery from oracle staleness pause (P8-01)
    function triggerAutoRecovery() external onlyOracleOrOwner {
        require(oracleStalenessPaused, "Not stale-paused");
        require(stalenessTriggeredAt > 0, "No staleness timestamp");
        require(
            block.timestamp >= stalenessTriggeredAt + AUTO_RECOVERY_TIMEOUT,
            "Recovery timeout not reached"
        );
        require(
            block.timestamp >= lastAutoRecoveryAttempt + AUTO_RECOVERY_COOLDOWN,
            "Recovery cooldown active"
        );

        lastAutoRecoveryAttempt = block.timestamp;

        bool hasFreshOracle = false;
        uint256 len = oracleList.length;
        for (uint256 i = 0; i < len; i++) {
            if (block.timestamp <= oracleLastUpdate[oracleList[i]] + MAX_STALENESS + TIMESTAMP_SAFETY_BUFFER) {
                hasFreshOracle = true;
                break;
            }
        }
        require(hasFreshOracle, "No fresh oracle data available");

        oracleStalenessPaused = false;
        stalenessTriggeredAt = 0;

        emit StalenessAutoRecovered(msg.sender, block.timestamp);
    }

    // ─── Admin (Owner-Only — Operational) ────────────────────────────

    /// @notice Add an oracle — owner-only when no guardian, dual-approval when guardian is set (P12-01)
    function addOracle(address _oracle) external onlyOwner {
        // P12-01: If guardian is active, require proposal system
        require(guardian == address(0), "Guardian active: use proposal system");

        _executeAddOracle(_oracle);
    }

    /// @notice Remove an oracle — owner-only when no guardian, dual-approval when guardian is set (P12-01)
    function removeOracle(address _oracle) external onlyOwner {
        // P12-01: If guardian is active, require proposal system
        require(guardian == address(0), "Guardian active: use proposal system");

        _executeRemoveOracle(_oracle);
    }

    function setExchangeRate(uint256 _rate) external onlyOwner {
        require(_rate >= MIN_EXCHANGE_RATE && _rate <= MAX_EXCHANGE_RATE, "Rate out of range");
        if (exchangeRate > 0) {
            uint256 maxDelta = (exchangeRate * MAX_RATE_CHANGE_BPS) / BPS_DENOMINATOR;
            uint256 delta = _rate > exchangeRate ? _rate - exchangeRate : exchangeRate - _rate;
            require(delta <= maxDelta, "Rate change exceeds cap");
        }
        uint256 old = exchangeRate;
        exchangeRate = _rate;
        emit ExchangeRateUpdated(old, _rate);
    }

    function setFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= MAX_FEE_BPS, "Fee too high");
        uint256 old = feeBps;
        feeBps = _feeBps;
        emit FeeUpdated(old, _feeBps);
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /// @notice Transfer ownership — owner-only when no guardian, dual-approval when guardian is set (P12-01)
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");

        // P12-01: If guardian is active, require proposal system
        require(guardian == address(0), "Guardian active: use proposal system");

        address old = owner;
        owner = newOwner;
        emit OwnershipTransferred(old, newOwner);
    }

    /// @notice Emergency LTC withdrawal (only when paused)
    /// @dev P7-02: Strict CEI ordering.
    ///      P12-01: When guardian is set, requires dual-approval via proposal system.
    function emergencyWithdrawLtc(address payable to, uint256 amount) external onlyOwner nonReentrant {
        require(paused, "Must be paused");
        require(to != address(0), "Zero address");
        require(amount > 0, "Zero amount");
        require(address(this).balance >= amount, "Insufficient balance");

        // P12-01: If guardian is active, require proposal system
        require(guardian == address(0), "Guardian active: use proposal system");

        (bool success, ) = to.call{value: amount}("");
        require(success, "LTC transfer failed");

        emit EmergencyWithdrawal(to, amount);
    }

    // ─── Guardian System (P12-01) ────────────────────────────────────

    /// @notice Set the guardian address. First guardian is set by owner alone.
    ///         Subsequent changes require dual-approval via proposal system.
    /// @param _guardian New guardian address (can be address(0) to disable)
    function setGuardian(address _guardian) external onlyOwner {
        // If guardian already exists, changing it requires dual-approval
        require(guardian == address(0), "Guardian active: use proposal system");

        address old = guardian;
        guardian = _guardian;
        emit GuardianSet(old, _guardian, msg.sender);
    }

    /// @notice Create a proposal for a critical action requiring dual-approval (P12-01)
    /// @dev Can be called by owner or guardian. The OTHER party must confirm.
    /// @param _actionType One of PROPOSAL_ADD_ORACLE through PROPOSAL_SET_GUARDIAN
    /// @param _target Target address (oracle, new owner, withdrawal recipient, or new guardian)
    /// @param _value Associated value (baseline price, withdrawal amount, or 0)
    /// @return proposalId The ID of the created proposal
    function createProposal(
        uint8 _actionType,
        address _target,
        uint256 _value
    ) external onlyOwnerOrGuardian returns (uint256 proposalId) {
        require(guardian != address(0), "No guardian set");
        require(
            _actionType >= PROPOSAL_ADD_ORACLE && _actionType <= PROPOSAL_SET_GUARDIAN,
            "Invalid action type"
        );
        require(activeProposalCount < MAX_ACTIVE_PROPOSALS, "Too many active proposals");

        // Validate target based on action type
        if (_actionType == PROPOSAL_ADD_ORACLE) {
            require(_target != address(0), "Zero address");
            require(!isOracle[_target], "Already oracle");
            require(oracleList.length < MAX_ORACLES, "Max oracles reached");
        } else if (_actionType == PROPOSAL_REMOVE_ORACLE) {
            require(isOracle[_target], "Not oracle");
            require(oracleList.length > MIN_ORACLE_QUORUM, "Would break quorum");
        } else if (_actionType == PROPOSAL_RESET_BASELINE) {
            require(isOracle[_target], "Not oracle");
            require(
                _value >= MIN_ENERGY_PRICE && _value <= MAX_ENERGY_PRICE,
                "Baseline out of range"
            );
        } else if (_actionType == PROPOSAL_TRANSFER_OWNERSHIP) {
            require(_target != address(0), "Zero address");
        } else if (_actionType == PROPOSAL_EMERGENCY_WITHDRAW) {
            require(paused, "Must be paused");
            require(_target != address(0), "Zero address");
            require(_value > 0, "Zero amount");
            require(address(this).balance >= _value, "Insufficient balance");
        } else if (_actionType == PROPOSAL_SET_GUARDIAN) {
            // _target is the new guardian (can be address(0) to disable)
            // No additional validation needed
        }

        proposalId = proposalCount;
        proposalCount++;
        activeProposalCount++;

        proposals[proposalId] = Proposal({
            actionType: _actionType,
            proposer: msg.sender,
            target: _target,
            value: _value,
            createdAt: block.timestamp,
            executed: false,
            cancelled: false
        });

        emit ProposalCreated(proposalId, _actionType, msg.sender, _target, _value);
    }

    /// @notice Confirm and execute a pending proposal (P12-01)
    /// @dev Must be called by the OTHER party (not the proposer).
    ///      Owner proposes → guardian confirms, or guardian proposes → owner confirms.
    /// @param _proposalId ID of the proposal to confirm
    function confirmProposal(uint256 _proposalId) external onlyOwnerOrGuardian nonReentrant {
        require(_proposalId < proposalCount, "Invalid proposal ID");

        Proposal storage p = proposals[_proposalId];
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Already cancelled");
        require(block.timestamp <= p.createdAt + PROPOSAL_EXPIRY, "Proposal expired");

        // Dual-approval: confirmer must be different from proposer
        require(msg.sender != p.proposer, "Cannot confirm own proposal");

        // Mark as executed BEFORE performing the action (CEI pattern)
        p.executed = true;
        if (activeProposalCount > 0) {
            activeProposalCount--;
        }

        // Execute the action
        if (p.actionType == PROPOSAL_ADD_ORACLE) {
            _executeAddOracle(p.target);
        } else if (p.actionType == PROPOSAL_REMOVE_ORACLE) {
            _executeRemoveOracle(p.target);
        } else if (p.actionType == PROPOSAL_RESET_BASELINE) {
            _executeResetBaseline(p.target, p.value);
        } else if (p.actionType == PROPOSAL_TRANSFER_OWNERSHIP) {
            address old = owner;
            owner = p.target;
            emit OwnershipTransferred(old, p.target);
        } else if (p.actionType == PROPOSAL_EMERGENCY_WITHDRAW) {
            require(paused, "Must be paused");
            require(address(this).balance >= p.value, "Insufficient balance");
            (bool success, ) = payable(p.target).call{value: p.value}("");
            require(success, "LTC transfer failed");
            emit EmergencyWithdrawal(p.target, p.value);
        } else if (p.actionType == PROPOSAL_SET_GUARDIAN) {
            address old = guardian;
            guardian = p.target;
            emit GuardianSet(old, p.target, msg.sender);
        }

        emit ProposalExecuted(_proposalId, p.actionType, msg.sender);
    }

    /// @notice Cancel a pending proposal (P12-01)
    /// @dev Can be cancelled by either owner or guardian.
    /// @param _proposalId ID of the proposal to cancel
    function cancelProposal(uint256 _proposalId) external onlyOwnerOrGuardian {
        require(_proposalId < proposalCount, "Invalid proposal ID");

        Proposal storage p = proposals[_proposalId];
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Already cancelled");

        p.cancelled = true;
        if (activeProposalCount > 0) {
            activeProposalCount--;
        }

        emit ProposalCancelled(_proposalId, msg.sender);
    }

    /// @notice Permissionless cleanup of expired proposals (P13-01)
    /// @dev Anyone can call this to decrement activeProposalCount for proposals
    ///      that have passed PROPOSAL_EXPIRY without being confirmed or cancelled.
    ///      Prevents DoS on the proposal system from counter inflation.
    /// @param _proposalId ID of the expired proposal to clean up
    function cleanupExpiredProposal(uint256 _proposalId) external {
        require(_proposalId < proposalCount, "Invalid proposal ID");

        Proposal storage p = proposals[_proposalId];
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Already cancelled");
        require(block.timestamp > p.createdAt + PROPOSAL_EXPIRY, "Not expired");

        p.cancelled = true;
        if (activeProposalCount > 0) {
            activeProposalCount--;
        }

        emit ProposalExpiredAndCleaned(_proposalId, msg.sender);
    }

    // ─── Internal Execution Helpers (P12-01) ─────────────────────────

    /// @notice Internal: execute addOracle logic (shared by direct call and proposal)
    /// @dev P13-05: Removed redundant `delete oracleIndex[_oracle]` (immediately overwritten).
    function _executeAddOracle(address _oracle) internal {
        require(_oracle != address(0), "Zero address");
        require(!isOracle[_oracle], "Already oracle");
        require(oracleList.length < MAX_ORACLES, "Max oracles reached");

        isOracle[_oracle] = true;
        oracleIndex[_oracle] = oracleList.length;
        oracleList.push(_oracle);
        oracleBaselineLastUpdate[_oracle] = block.timestamp;

        emit OracleAdded(_oracle);
    }

    /// @notice Internal: execute removeOracle logic (shared by direct call and proposal)
    function _executeRemoveOracle(address _oracle) internal {
        require(isOracle[_oracle], "Not oracle");
        require(oracleList.length > MIN_ORACLE_QUORUM, "Would break quorum");

        isOracle[_oracle] = false;
        oracleLastPrice[_oracle] = 0;
        oracleLastUpdate[_oracle] = 0;
        oracleBaselinePrice[_oracle] = 0;
        oracleBaselineLastUpdate[_oracle] = 0;

        uint256 idx = oracleIndex[_oracle];
        uint256 lastIdx = oracleList.length - 1;
        if (idx != lastIdx) {
            address lastOracle = oracleList[lastIdx];
            oracleList[idx] = lastOracle;
            oracleIndex[lastOracle] = idx;
        }
        oracleList.pop();
        delete oracleIndex[_oracle];

        emit OracleRemoved(_oracle);
    }

    /// @notice Internal: execute resetOracleBaseline logic (shared by direct call and proposal)
    /// @dev P10.4-01 change cap is enforced here. Proposal path also enforces it.
    function _executeResetBaseline(address _oracle, uint256 _newBaseline) internal {
        require(isOracle[_oracle], "Not oracle");
        require(
            _newBaseline >= MIN_ENERGY_PRICE && _newBaseline <= MAX_ENERGY_PRICE,
            "Baseline out of range"
        );

        uint256 oldBaseline = oracleBaselinePrice[_oracle];

        // P10.4-01: Enforce change cap even through proposal path
        if (oldBaseline > 0) {
            uint256 maxDelta = (oldBaseline * MAX_BASELINE_CHANGE_BPS) / BPS_DENOMINATOR;
            uint256 delta = _newBaseline > oldBaseline
                ? _newBaseline - oldBaseline
                : oldBaseline - _newBaseline;
            require(delta <= maxDelta, "Baseline change exceeds cap, use timelock");
        }

        oracleBaselinePrice[_oracle] = _newBaseline;
        oracleBaselineLastUpdate[_oracle] = block.timestamp;

        emit BaselineReset(_oracle, oldBaseline, _newBaseline, msg.sender);
    }

    // ─── Timelock System (EXT-05, P5-02) ─────────────────────────────

    function queueTimelockAction(bytes32 actionId, string calldata description) external onlyOwner {
        require(timelockQueue[actionId] == 0, "Action already queued");
        uint256 executeAfter = block.timestamp + TIMELOCK_DELAY;
        timelockQueue[actionId] = executeAfter;
        emit TimelockQueued(actionId, executeAfter, description);
    }

    function isTimelockReady(bytes32 actionId) external view returns (bool ready, uint256 executeAfter) {
        executeAfter = timelockQueue[actionId];
        ready = executeAfter > 0 && block.timestamp >= executeAfter;
    }

    function cancelTimelockAction(bytes32 actionId) external onlyOwner {
        require(timelockQueue[actionId] > 0, "Action not queued");
        delete timelockQueue[actionId];
        emit TimelockCancelled(actionId);
    }

    function executeTimelockSetExchangeRate(bytes32 actionId, uint256 _rate) external onlyOwner {
        require(timelockQueue[actionId] > 0, "Action not queued");
        require(block.timestamp >= timelockQueue[actionId], "Timelock not expired");
        require(
            actionId == keccak256(abi.encode("setExchangeRate", _rate)),
            "Action ID mismatch"
        );

        delete timelockQueue[actionId];
        emit TimelockExecuted(actionId, block.timestamp);

        require(_rate >= MIN_EXCHANGE_RATE && _rate <= MAX_EXCHANGE_RATE, "Rate out of range");
        if (exchangeRate > 0) {
            uint256 maxDelta = (exchangeRate * MAX_RATE_CHANGE_BPS) / BPS_DENOMINATOR;
            uint256 delta = _rate > exchangeRate ? _rate - exchangeRate : exchangeRate - _rate;
            require(delta <= maxDelta, "Rate change exceeds cap");
        }
        uint256 old = exchangeRate;
        exchangeRate = _rate;
        emit ExchangeRateUpdated(old, _rate);
    }

    function executeTimelockSetFee(bytes32 actionId, uint256 _feeBps) external onlyOwner {
        require(timelockQueue[actionId] > 0, "Action not queued");
        require(block.timestamp >= timelockQueue[actionId], "Timelock not expired");
        require(
            actionId == keccak256(abi.encode("setFee", _feeBps)),
            "Action ID mismatch"
        );

        delete timelockQueue[actionId];
        emit TimelockExecuted(actionId, block.timestamp);

        require(_feeBps <= MAX_FEE_BPS, "Fee too high");
        uint256 old = feeBps;
        feeBps = _feeBps;
        emit FeeUpdated(old, _feeBps);
    }

    function executeTimelockAddOracle(bytes32 actionId, address _oracle) external onlyOwner {
        require(timelockQueue[actionId] > 0, "Action not queued");
        require(block.timestamp >= timelockQueue[actionId], "Timelock not expired");
        require(
            actionId == keccak256(abi.encode("addOracle", _oracle)),
            "Action ID mismatch"
        );

        delete timelockQueue[actionId];
        emit TimelockExecuted(actionId, block.timestamp);

        _executeAddOracle(_oracle);
    }

    function executeTimelockRemoveOracle(bytes32 actionId, address _oracle) external onlyOwner {
        require(timelockQueue[actionId] > 0, "Action not queued");
        require(block.timestamp >= timelockQueue[actionId], "Timelock not expired");
        require(
            actionId == keccak256(abi.encode("removeOracle", _oracle)),
            "Action ID mismatch"
        );

        delete timelockQueue[actionId];
        emit TimelockExecuted(actionId, block.timestamp);

        _executeRemoveOracle(_oracle);
    }

    /// @notice Timelock-gated baseline reset — allows resets exceeding the 50% change cap (P10.4-01)
    function executeTimelockResetOracleBaseline(
        bytes32 actionId,
        address _oracle,
        uint256 _newBaseline
    ) external onlyOwner {
        require(timelockQueue[actionId] > 0, "Action not queued");
        require(block.timestamp >= timelockQueue[actionId], "Timelock not expired");
        require(
            actionId == keccak256(abi.encode("resetOracleBaseline", _oracle, _newBaseline)),
            "Action ID mismatch"
        );

        delete timelockQueue[actionId];
        emit TimelockExecuted(actionId, block.timestamp);

        require(isOracle[_oracle], "Not oracle");
        require(
            _newBaseline >= MIN_ENERGY_PRICE && _newBaseline <= MAX_ENERGY_PRICE,
            "Baseline out of range"
        );

        uint256 oldBaseline = oracleBaselinePrice[_oracle];
        oracleBaselinePrice[_oracle] = _newBaseline;
        oracleBaselineLastUpdate[_oracle] = block.timestamp;

        emit BaselineResetViaTimelock(_oracle, oldBaseline, _newBaseline, actionId);
    }

    // ─── Views ───────────────────────────────────────────────────────

    function getTwapPrice() external view returns (uint256) {
        uint256 sum;
        for (uint256 i = 0; i < TWAP_WINDOW; i++) {
            sum += twapPrices[i];
        }
        return sum / TWAP_WINDOW;
    }

    function getOracleCount() external view returns (uint256) {
        return oracleList.length;
    }

    function getOracleList() external view returns (address[] memory) {
        return oracleList;
    }

    function isDataFresh() external view returns (bool) {
        return block.timestamp <= lastPriceUpdate + ORACLE_STALENESS_THRESHOLD + TIMESTAMP_SAFETY_BUFFER;
    }

    /// @notice Returns the contract's LTC balance (native token on LitVM)
    function getLtcBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getAutoRecoveryStatus() external view returns (bool eligible, uint256 timeRemaining) {
        if (!oracleStalenessPaused || stalenessTriggeredAt == 0) {
            return (false, 0);
        }
        uint256 recoveryTime = stalenessTriggeredAt + AUTO_RECOVERY_TIMEOUT;
        if (block.timestamp >= recoveryTime) {
            if (block.timestamp < lastAutoRecoveryAttempt + AUTO_RECOVERY_COOLDOWN) {
                return (false, lastAutoRecoveryAttempt + AUTO_RECOVERY_COOLDOWN - block.timestamp);
            }
            bool hasFresh = false;
            for (uint256 i = 0; i < oracleList.length; i++) {
                if (block.timestamp <= oracleLastUpdate[oracleList[i]] + MAX_STALENESS + TIMESTAMP_SAFETY_BUFFER) {
                    hasFresh = true;
                    break;
                }
            }
            return (hasFresh, 0);
        }
        return (false, recoveryTime - block.timestamp);
    }

    function getBaselineUpdateStatus(address _oracle) external view returns (bool canUpdate, uint256 timeRemaining) {
        uint256 lastSet = oracleBaselineLastUpdate[_oracle];
        if (lastSet == 0) {
            return (true, 0);
        }
        uint256 nextUpdate = lastSet + BASELINE_UPDATE_INTERVAL;
        if (block.timestamp >= nextUpdate) {
            return (true, 0);
        }
        return (false, nextUpdate - block.timestamp);
    }

    /// @notice Get the current TWAP epoch status (P9-01)
    function getTwapEpochStatus() external view returns (uint256 epoch, uint256 epochStart, uint256 epochTimeRemaining) {
        epoch = currentTwapEpoch;
        epochStart = twapEpochStartTime;
        uint256 nextTransition = twapEpochStartTime + TWAP_EPOCH_DURATION;
        if (block.timestamp >= nextTransition) {
            epochTimeRemaining = 0;
        } else {
            epochTimeRemaining = nextTransition - block.timestamp;
        }
    }

    /// @notice Get proposal details by ID (P12-01)
    /// @param _proposalId Proposal ID to query
    /// @return actionType The type of action (1-6)
    /// @return proposer Address that created the proposal
    /// @return target Target address for the action
    /// @return value Associated value (amount, price, etc.)
    /// @return createdAt Timestamp when proposal was created
    /// @return executed Whether the proposal has been executed
    /// @return cancelled Whether the proposal has been cancelled
    /// @return expired Whether the proposal has expired
    function getProposal(uint256 _proposalId) external view returns (
        uint8 actionType,
        address proposer,
        address target,
        uint256 value,
        uint256 createdAt,
        bool executed,
        bool cancelled,
        bool expired
    ) {
        require(_proposalId < proposalCount, "Invalid proposal ID");
        Proposal storage p = proposals[_proposalId];
        return (
            p.actionType,
            p.proposer,
            p.target,
            p.value,
            p.createdAt,
            p.executed,
            p.cancelled,
            block.timestamp > p.createdAt + PROPOSAL_EXPIRY
        );
    }

    /// @notice Check if the guardian system is active (P12-01)
    /// @return active True if a guardian address is set
    /// @return guardianAddr The current guardian address
    function getGuardianStatus() external view returns (bool active, address guardianAddr) {
        return (guardian != address(0), guardian);
    }

    // ─── Receive ─────────────────────────────────────────────────────

    /// @notice Receive LTC deposits (native token on LitVM)
    receive() external payable {
        emit LtcReceived(msg.sender, msg.value);
    }
}
