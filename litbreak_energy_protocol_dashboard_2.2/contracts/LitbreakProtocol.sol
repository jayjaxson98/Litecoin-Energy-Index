// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ═══════════════════════════════════════════════════════════════════════════════
//  LitbreakProtocol — Reference Contract for Litbreak Energy Protocol
//  This contract serves as the canonical on-chain reference. All runtime logic
//  is implemented in the frontend via TypeScript simulation engines.
// ═══════════════════════════════════════════════════════════════════════════════

/// @title IERC20 — Standard ERC-20 interface
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

/// @title IERC20Metadata — ERC-20 metadata extension
interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

/// @title IAggregatorV3 — Minimal Chainlink AggregatorV3 interface
interface IAggregatorV3 {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
    function getRoundData(uint80 _roundId)
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

/// @title LitbreakProtocol
/// @author Litbreak Energy Protocol
/// @notice Combined POWER token + Escalator release system with oracle-driven annual escalation
/// @dev Flat contract — all interfaces, modifiers, and logic inline. No external imports.
///      Hard cap: 84,000,000 POWER tokens
///      Base monthly release: 4,605 tokens
///      Escalator bounds: 0–2000 bps (0%–20%)
///      Oracle staleness: 30 days default
///      Oracle feed timelock: 48 hours
///      Max catch-up: 3 months
contract LitbreakProtocol is IERC20Metadata {

    // ═════════════════════════════════════════════════════════════════════════
    //  CONSTANTS
    // ═════════════════════════════════════════════════════════════════════════

    string private constant _NAME = "POWER Token";
    string private constant _SYMBOL = "POWER";
    uint8 private constant _DECIMALS = 18;

    uint256 public constant HARD_CAP = 84_000_000 * 1e18;
    uint256 public constant BASE_MONTHLY_RELEASE = 4_605 * 1e18;
    uint256 private constant BPS_DENOMINATOR = 10_000;
    uint256 public constant ORACLE_TIMELOCK_DELAY = 48 hours;
    uint256 public constant MAX_CATCHUP_MONTHS = 3;

    // ═════════════════════════════════════════════════════════════════════════
    //  ACCESS CONTROL
    // ═════════════════════════════════════════════════════════════════════════

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ORACLE_ADMIN_ROLE = keccak256("ORACLE_ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct RoleData {
        mapping(address => bool) members;
        bytes32 adminRole;
    }

    mapping(bytes32 => RoleData) private _roles;

    // ═════════════════════════════════════════════════════════════════════════
    //  ERC-20 STATE
    // ═════════════════════════════════════════════════════════════════════════

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // ═════════════════════════════════════════════════════════════════════════
    //  OWNERSHIP
    // ═════════════════════════════════════════════════════════════════════════

    address private _owner;
    address private _pendingOwner;

    // ═════════════════════════════════════════════════════════════════════════
    //  SECURITY
    // ═════════════════════════════════════════════════════════════════════════

    bool private _locked;
    bool private _paused;

    // ═════════════════════════════════════════════════════════════════════════
    //  ESCALATOR STATE
    // ═════════════════════════════════════════════════════════════════════════

    uint256 public immutable deploymentTimestamp;
    uint256 public currentMonthlyRate;
    uint256 public lastEscalatorYear;
    mapping(uint256 => uint256) public escalatorHistory;
    mapping(uint256 => bool) public escalatorYearSet;
    uint256 public lastValidEscalatorBps;
    uint256 public minEscalatorBps;
    uint256 public maxEscalatorBps;

    // ═════════════════════════════════════════════════════════════════════════
    //  ORACLE STATE
    // ═════════════════════════════════════════════════════════════════════════

    address public priceFeedAddress;
    address public pendingPriceFeedAddress;
    uint256 public priceFeedProposalTimestamp;
    bool public priceFeedChangePending;
    uint256 public oracleStalenessThreshold;
    int256 public baseElectricityPrice;

    // ═════════════════════════════════════════════════════════════════════════
    //  RELEASE STATE
    // ═════════════════════════════════════════════════════════════════════════

    mapping(bytes32 => bool) public monthlyReleaseCompleted;
    uint256 public lastReleaseYear;
    uint256 public lastReleaseMonth;
    address public releaseRecipient;

    // ═════════════════════════════════════════════════════════════════════════
    //  MINT/REDEEM STATE (POWER-specific)
    // ═════════════════════════════════════════════════════════════════════════

    /// @notice Exchange rate: 1 LTC = exchangeRate POWER (scaled by 1e18)
    uint256 public exchangeRate;

    /// @notice Protocol fee in basis points (e.g., 50 = 0.5%)
    uint256 public protocolFeeBps;

    /// @notice Total LTC deposited (collateral backing)
    uint256 public totalCollateral;

    /// @notice Accumulated protocol fees
    uint256 public accumulatedFees;

    // ═════════════════════════════════════════════════════════════════════════
    //  EVENTS
    // ═════════════════════════════════════════════════════════════════════════

    event TokensReleased(uint256 amount, uint256 escalatorBps, uint256 totalSupplyAfter, uint256 year, uint256 month, uint256 timestamp);
    event OracleFallbackUsed(uint256 lastValidEscalator, uint256 timestamp);
    event ManualEscalatorOverride(uint256 newEscalatorBps, address admin);
    event EscalatorUpdated(uint256 year, uint256 escalatorBps, uint256 newMonthlyRate);
    event OracleFeedChangeProposed(address indexed proposedFeed, uint256 activationTime);
    event OracleFeedChangeExecuted(address indexed oldFeed, address indexed newFeed);
    event OracleFeedChangeCancelled(address indexed cancelledFeed);
    event EscalatorBoundsUpdated(uint256 newMin, uint256 newMax);
    event StalenessThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event BaseElectricityPriceUpdated(int256 oldPrice, int256 newPrice);
    event ReleaseRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferStarted(address indexed currentOwner, address indexed pendingOwner);
    event Paused(address account);
    event Unpaused(address account);
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    /// @notice Emitted when a user mints POWER by depositing LTC
    event PowerMinted(address indexed user, uint256 ltcAmount, uint256 powerAmount, uint256 fee, uint256 timestamp);

    /// @notice Emitted when a user redeems POWER for LTC
    event PowerRedeemed(address indexed user, uint256 powerAmount, uint256 ltcAmount, uint256 fee, uint256 timestamp);

    /// @notice Emitted when the exchange rate is updated
    event ExchangeRateUpdated(uint256 oldRate, uint256 newRate);

    // ═════════════════════════════════════════════════════════════════════════
    //  MODIFIERS
    // ═════════════════════════════════════════════════════════════════════════

    modifier onlyOwner() {
        require(msg.sender == _owner, "LitbreakProtocol: caller is not the owner");
        _;
    }

    modifier onlyRole(bytes32 role) {
        require(_roles[role].members[msg.sender], "LitbreakProtocol: missing required role");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "LitbreakProtocol: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    modifier whenNotPaused() {
        require(!_paused, "LitbreakProtocol: paused");
        _;
    }

    modifier whenPaused() {
        require(_paused, "LitbreakProtocol: not paused");
        _;
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  CONSTRUCTOR
    // ═════════════════════════════════════════════════════════════════════════

    /// @notice Deploys the LitbreakProtocol contract
    /// @param _priceFeedAddress Chainlink AggregatorV3 address for electricity kWh price
    /// @param _releaseRecipient Address that receives monthly token releases
    /// @param _baseElectricityPrice Baseline electricity price (oracle-scaled)
    /// @param _initialStalenessThreshold Oracle staleness threshold in seconds
    constructor(
        address _priceFeedAddress,
        address _releaseRecipient,
        int256 _baseElectricityPrice,
        uint256 _initialStalenessThreshold
    ) {
        require(_priceFeedAddress != address(0), "LitbreakProtocol: zero feed address");
        require(_releaseRecipient != address(0), "LitbreakProtocol: zero recipient");
        require(_baseElectricityPrice > 0, "LitbreakProtocol: base price must be positive");
        require(_initialStalenessThreshold >= 1 days, "LitbreakProtocol: staleness too low");
        require(_initialStalenessThreshold <= 365 days, "LitbreakProtocol: staleness too high");

        _owner = msg.sender;
        _paused = false;
        _locked = false;

        _roles[DEFAULT_ADMIN_ROLE].members[msg.sender] = true;
        _roles[MINTER_ROLE].members[msg.sender] = true;
        _roles[ORACLE_ADMIN_ROLE].members[msg.sender] = true;
        _roles[PAUSER_ROLE].members[msg.sender] = true;

        _roles[MINTER_ROLE].adminRole = DEFAULT_ADMIN_ROLE;
        _roles[ORACLE_ADMIN_ROLE].adminRole = DEFAULT_ADMIN_ROLE;
        _roles[PAUSER_ROLE].adminRole = DEFAULT_ADMIN_ROLE;

        priceFeedAddress = _priceFeedAddress;
        baseElectricityPrice = _baseElectricityPrice;
        oracleStalenessThreshold = _initialStalenessThreshold;

        currentMonthlyRate = BASE_MONTHLY_RELEASE;
        lastEscalatorYear = 0;
        minEscalatorBps = 0;
        maxEscalatorBps = 2000;
        lastValidEscalatorBps = 0;

        releaseRecipient = _releaseRecipient;
        deploymentTimestamp = block.timestamp;
        lastReleaseYear = 0;
        lastReleaseMonth = 0;

        // POWER token mint/redeem defaults
        exchangeRate = 102_370000000000000000; // 102.37 POWER per LTC (scaled 1e18)
        protocolFeeBps = 50; // 0.5%

        emit OwnershipTransferred(address(0), msg.sender);
        emit ReleaseRecipientUpdated(address(0), _releaseRecipient);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  ERC-20 METADATA
    // ═════════════════════════════════════════════════════════════════════════

    function name() external pure override returns (string memory) { return _NAME; }
    function symbol() external pure override returns (string memory) { return _SYMBOL; }
    function decimals() external pure override returns (uint8) { return _DECIMALS; }

    // ═════════════════════════════════════════════════════════════════════════
    //  ERC-20 CORE
    // ═════════════════════════════════════════════════════════════════════════

    function totalSupply() external view override returns (uint256) { return _totalSupply; }
    function balanceOf(address account) external view override returns (uint256) { return _balances[account]; }

    function transfer(address to, uint256 amount) external override nonReentrant whenNotPaused returns (bool) {
        require(to != address(0), "LitbreakProtocol: transfer to zero address");
        require(_balances[msg.sender] >= amount, "LitbreakProtocol: insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address owner_, address spender) external view override returns (uint256) {
        return _allowances[owner_][spender];
    }

    function approve(address spender, uint256 amount) external override nonReentrant whenNotPaused returns (bool) {
        require(spender != address(0), "LitbreakProtocol: approve to zero address");
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override nonReentrant whenNotPaused returns (bool) {
        require(from != address(0), "LitbreakProtocol: transfer from zero address");
        require(to != address(0), "LitbreakProtocol: transfer to zero address");
        require(_balances[from] >= amount, "LitbreakProtocol: insufficient balance");
        require(_allowances[from][msg.sender] >= amount, "LitbreakProtocol: insufficient allowance");
        _balances[from] -= amount;
        _balances[to] += amount;
        _allowances[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  INTERNAL MINTING
    // ═════════════════════════════════════════════════════════════════════════

    function _mint(address to, uint256 amount) internal returns (uint256 actualMinted) {
        require(to != address(0), "LitbreakProtocol: mint to zero address");
        if (_totalSupply >= HARD_CAP) return 0;
        uint256 remaining = HARD_CAP - _totalSupply;
        actualMinted = amount > remaining ? remaining : amount;
        if (actualMinted == 0) return 0;
        _totalSupply += actualMinted;
        _balances[to] += actualMinted;
        emit Transfer(address(0), to, actualMinted);
    }

    function _burn(address from, uint256 amount) internal {
        require(from != address(0), "LitbreakProtocol: burn from zero address");
        require(_balances[from] >= amount, "LitbreakProtocol: burn exceeds balance");
        _balances[from] -= amount;
        _totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  MINT / REDEEM (User-facing)
    // ═════════════════════════════════════════════════════════════════════════

    /// @notice Mint POWER tokens by depositing LTC
    /// @dev User sends LTC (msg.value), receives POWER at the current exchange rate minus fee
    function mint() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "LitbreakProtocol: zero LTC amount");

        uint256 fee = (msg.value * protocolFeeBps) / BPS_DENOMINATOR;
        uint256 netLtc = msg.value - fee;
        uint256 powerAmount = (netLtc * exchangeRate) / 1e18;

        require(powerAmount > 0, "LitbreakProtocol: mint amount too small");

        uint256 actualMinted = _mint(msg.sender, powerAmount);
        require(actualMinted > 0, "LitbreakProtocol: hard cap reached");

        totalCollateral += netLtc;
        accumulatedFees += fee;

        emit PowerMinted(msg.sender, msg.value, actualMinted, fee, block.timestamp);
    }

    /// @notice Redeem POWER tokens for LTC
    /// @param powerAmount The amount of POWER to redeem
    function redeem(uint256 powerAmount) external nonReentrant whenNotPaused {
        require(powerAmount > 0, "LitbreakProtocol: zero POWER amount");
        require(_balances[msg.sender] >= powerAmount, "LitbreakProtocol: insufficient POWER balance");

        uint256 ltcAmount = (powerAmount * 1e18) / exchangeRate;
        uint256 fee = (ltcAmount * protocolFeeBps) / BPS_DENOMINATOR;
        uint256 netLtc = ltcAmount - fee;

        require(netLtc > 0, "LitbreakProtocol: redeem amount too small");
        require(address(this).balance >= netLtc, "LitbreakProtocol: insufficient collateral");

        _burn(msg.sender, powerAmount);
        totalCollateral -= ltcAmount > totalCollateral ? totalCollateral : ltcAmount;
        accumulatedFees += fee;

        (bool success, ) = payable(msg.sender).call{value: netLtc}("");
        require(success, "LitbreakProtocol: LTC transfer failed");

        emit PowerRedeemed(msg.sender, powerAmount, netLtc, fee, block.timestamp);
    }

    /// @notice Get the current mint quote (how much POWER for a given LTC amount)
    /// @param ltcAmount The LTC amount to quote
    /// @return powerAmount The POWER tokens that would be received
    /// @return fee The protocol fee in LTC
    function getMintQuote(uint256 ltcAmount) external view returns (uint256 powerAmount, uint256 fee) {
        fee = (ltcAmount * protocolFeeBps) / BPS_DENOMINATOR;
        uint256 netLtc = ltcAmount - fee;
        powerAmount = (netLtc * exchangeRate) / 1e18;
    }

    /// @notice Get the current redeem quote (how much LTC for a given POWER amount)
    /// @param powerAmount The POWER amount to quote
    /// @return ltcAmount The LTC that would be received
    /// @return fee The protocol fee in LTC
    function getRedeemQuote(uint256 powerAmount) external view returns (uint256 ltcAmount, uint256 fee) {
        uint256 grossLtc = (powerAmount * 1e18) / exchangeRate;
        fee = (grossLtc * protocolFeeBps) / BPS_DENOMINATOR;
        ltcAmount = grossLtc - fee;
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  DATE UTILITIES
    // ═════════════════════════════════════════════════════════════════════════

    function getCurrentContractYear() public view returns (uint256) {
        if (block.timestamp < deploymentTimestamp) return 0;
        return (block.timestamp - deploymentTimestamp) / 365 days;
    }

    function _getYearMonth(uint256 timestamp) internal pure returns (uint256 year, uint256 month) {
        uint256 z = timestamp / 86400 + 719468;
        uint256 era = z / 146097;
        uint256 doe = z - era * 146097;
        uint256 yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
        year = yoe + era * 400;
        uint256 doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
        uint256 mp = (5 * doy + 2) / 153;
        month = mp < 10 ? mp + 3 : mp - 9;
        if (month <= 2) year += 1;
    }

    function getCurrentYearMonth() public view returns (uint256 year, uint256 month) {
        return _getYearMonth(block.timestamp);
    }

    function _monthKey(uint256 year, uint256 month) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(year, month));
    }

    function _nextMonth(uint256 year, uint256 month) internal pure returns (uint256, uint256) {
        if (month == 12) return (year + 1, 1);
        return (year, month + 1);
    }

    function _isBeforeOrEqual(uint256 y1, uint256 m1, uint256 y2, uint256 m2) internal pure returns (bool) {
        return (y1 < y2) || (y1 == y2 && m1 <= m2);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  ORACLE INTEGRATION
    // ═════════════════════════════════════════════════════════════════════════

    function _fetchEscalatorFromOracle() internal returns (uint256 escalatorBps, bool usedFallback) {
        if (priceFeedAddress == address(0)) {
            emit OracleFallbackUsed(lastValidEscalatorBps, block.timestamp);
            return (lastValidEscalatorBps, true);
        }
        try IAggregatorV3(priceFeedAddress).latestRoundData() returns (
            uint80, int256 answer, uint256, uint256 updatedAt, uint80
        ) {
            if (block.timestamp - updatedAt > oracleStalenessThreshold || answer <= 0) {
                emit OracleFallbackUsed(lastValidEscalatorBps, block.timestamp);
                return (lastValidEscalatorBps, true);
            }
            if (answer > baseElectricityPrice) {
                escalatorBps = (uint256(answer - baseElectricityPrice) * BPS_DENOMINATOR) / uint256(baseElectricityPrice);
            }
            if (escalatorBps < minEscalatorBps) escalatorBps = minEscalatorBps;
            if (escalatorBps > maxEscalatorBps) escalatorBps = maxEscalatorBps;
            lastValidEscalatorBps = escalatorBps;
            usedFallback = false;
        } catch {
            emit OracleFallbackUsed(lastValidEscalatorBps, block.timestamp);
            return (lastValidEscalatorBps, true);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  ESCALATOR MANAGEMENT
    // ═════════════════════════════════════════════════════════════════════════

    function _updateEscalatorIfNeeded() internal returns (uint256 escalatorBps) {
        uint256 currentYear = getCurrentContractYear();
        if (currentYear == 0) return 0;
        if (escalatorYearSet[currentYear]) return escalatorHistory[currentYear];

        uint256 rate = currentMonthlyRate;
        for (uint256 y = lastEscalatorYear + 1; y <= currentYear; y++) {
            if (!escalatorYearSet[y]) {
                (uint256 esc, ) = _fetchEscalatorFromOracle();
                escalatorHistory[y] = esc;
                escalatorYearSet[y] = true;
                rate = (rate * (BPS_DENOMINATOR + esc)) / BPS_DENOMINATOR;
                emit EscalatorUpdated(y, esc, rate);
            } else {
                rate = (rate * (BPS_DENOMINATOR + escalatorHistory[y])) / BPS_DENOMINATOR;
            }
        }
        currentMonthlyRate = rate;
        lastEscalatorYear = currentYear;
        return escalatorHistory[currentYear];
    }

    function manualEscalatorOverride(uint256 newEscalatorBps) external nonReentrant onlyRole(ORACLE_ADMIN_ROLE) {
        require(newEscalatorBps >= minEscalatorBps && newEscalatorBps <= maxEscalatorBps, "LitbreakProtocol: out of bounds");
        uint256 currentYear = getCurrentContractYear();
        if (escalatorYearSet[currentYear]) {
            uint256 oldEsc = escalatorHistory[currentYear];
            uint256 prevRate = (currentMonthlyRate * BPS_DENOMINATOR) / (BPS_DENOMINATOR + oldEsc);
            currentMonthlyRate = (prevRate * (BPS_DENOMINATOR + newEscalatorBps)) / BPS_DENOMINATOR;
        } else {
            escalatorYearSet[currentYear] = true;
            currentMonthlyRate = (currentMonthlyRate * (BPS_DENOMINATOR + newEscalatorBps)) / BPS_DENOMINATOR;
            lastEscalatorYear = currentYear;
        }
        escalatorHistory[currentYear] = newEscalatorBps;
        lastValidEscalatorBps = newEscalatorBps;
        emit ManualEscalatorOverride(newEscalatorBps, msg.sender);
        emit EscalatorUpdated(currentYear, newEscalatorBps, currentMonthlyRate);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  TOKEN RELEASE
    // ═════════════════════════════════════════════════════════════════════════

    function releaseTokens() external nonReentrant whenNotPaused onlyRole(MINTER_ROLE) {
        require(_totalSupply < HARD_CAP, "LitbreakProtocol: hard cap reached");
        _updateEscalatorIfNeeded();

        (uint256 currentCalYear, uint256 currentCalMonth) = getCurrentYearMonth();
        uint256 startYear;
        uint256 startMonth;

        if (lastReleaseYear == 0 && lastReleaseMonth == 0) {
            (startYear, startMonth) = _getYearMonth(deploymentTimestamp);
        } else {
            (startYear, startMonth) = _nextMonth(lastReleaseYear, lastReleaseMonth);
        }

        uint256 monthsToRelease = 0;
        {
            uint256 tY = startYear;
            uint256 tM = startMonth;
            while (_isBeforeOrEqual(tY, tM, currentCalYear, currentCalMonth) && monthsToRelease < MAX_CATCHUP_MONTHS) {
                monthsToRelease++;
                (tY, tM) = _nextMonth(tY, tM);
            }
        }
        require(monthsToRelease > 0, "LitbreakProtocol: no months to release");

        uint256 relYear = startYear;
        uint256 relMonth = startMonth;
        for (uint256 i = 0; i < monthsToRelease; i++) {
            if (_totalSupply >= HARD_CAP) break;
            bytes32 key = _monthKey(relYear, relMonth);
            require(!monthlyReleaseCompleted[key], "LitbreakProtocol: month already released");

            uint256 minted = _mint(releaseRecipient, currentMonthlyRate);
            monthlyReleaseCompleted[key] = true;
            lastReleaseYear = relYear;
            lastReleaseMonth = relMonth;

            uint256 activeEscalator = getCurrentContractYear() > 0 && escalatorYearSet[getCurrentContractYear()]
                ? escalatorHistory[getCurrentContractYear()] : 0;

            emit TokensReleased(minted, activeEscalator, _totalSupply, relYear, relMonth, block.timestamp);
            if (i < monthsToRelease - 1) (relYear, relMonth) = _nextMonth(relYear, relMonth);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  ORACLE FEED TIMELOCK
    // ═════════════════════════════════════════════════════════════════════════

    function proposeOracleFeedChange(address newFeed) external nonReentrant onlyRole(ORACLE_ADMIN_ROLE) {
        require(newFeed != address(0) && newFeed != priceFeedAddress, "LitbreakProtocol: invalid feed");
        pendingPriceFeedAddress = newFeed;
        priceFeedProposalTimestamp = block.timestamp;
        priceFeedChangePending = true;
        emit OracleFeedChangeProposed(newFeed, block.timestamp + ORACLE_TIMELOCK_DELAY);
    }

    function executeOracleFeedChange() external nonReentrant onlyRole(ORACLE_ADMIN_ROLE) {
        require(priceFeedChangePending, "LitbreakProtocol: no pending change");
        require(block.timestamp >= priceFeedProposalTimestamp + ORACLE_TIMELOCK_DELAY, "LitbreakProtocol: timelock active");
        address oldFeed = priceFeedAddress;
        priceFeedAddress = pendingPriceFeedAddress;
        pendingPriceFeedAddress = address(0);
        priceFeedProposalTimestamp = 0;
        priceFeedChangePending = false;
        emit OracleFeedChangeExecuted(oldFeed, priceFeedAddress);
    }

    function cancelOracleFeedChange() external nonReentrant onlyRole(ORACLE_ADMIN_ROLE) {
        require(priceFeedChangePending, "LitbreakProtocol: no pending change");
        address cancelled = pendingPriceFeedAddress;
        pendingPriceFeedAddress = address(0);
        priceFeedProposalTimestamp = 0;
        priceFeedChangePending = false;
        emit OracleFeedChangeCancelled(cancelled);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  ADMIN SETTERS
    // ═════════════════════════════════════════════════════════════════════════

    function setEscalatorBounds(uint256 newMin, uint256 newMax) external nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newMin <= newMax && newMax <= 5000, "LitbreakProtocol: invalid bounds");
        minEscalatorBps = newMin;
        maxEscalatorBps = newMax;
        emit EscalatorBoundsUpdated(newMin, newMax);
    }

    function setStalenessThreshold(uint256 newThreshold) external nonReentrant onlyRole(ORACLE_ADMIN_ROLE) {
        require(newThreshold >= 1 days && newThreshold <= 365 days, "LitbreakProtocol: invalid threshold");
        uint256 old = oracleStalenessThreshold;
        oracleStalenessThreshold = newThreshold;
        emit StalenessThresholdUpdated(old, newThreshold);
    }

    function setBaseElectricityPrice(int256 newPrice) external nonReentrant onlyRole(ORACLE_ADMIN_ROLE) {
        require(newPrice > 0, "LitbreakProtocol: price must be positive");
        int256 old = baseElectricityPrice;
        baseElectricityPrice = newPrice;
        emit BaseElectricityPriceUpdated(old, newPrice);
    }

    function setReleaseRecipient(address newRecipient) external nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRecipient != address(0), "LitbreakProtocol: zero address");
        address old = releaseRecipient;
        releaseRecipient = newRecipient;
        emit ReleaseRecipientUpdated(old, newRecipient);
    }

    function setExchangeRate(uint256 newRate) external nonReentrant onlyRole(ORACLE_ADMIN_ROLE) {
        require(newRate > 0, "LitbreakProtocol: zero rate");
        uint256 old = exchangeRate;
        exchangeRate = newRate;
        emit ExchangeRateUpdated(old, newRate);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  ACCESS CONTROL
    // ═════════════════════════════════════════════════════════════════════════

    function hasRole(bytes32 role, address account) public view returns (bool) { return _roles[role].members[account]; }
    function getRoleAdmin(bytes32 role) public view returns (bytes32) { return _roles[role].adminRole; }

    function grantRole(bytes32 role, address account) external nonReentrant onlyRole(getRoleAdmin(role)) {
        if (!_roles[role].members[account]) {
            _roles[role].members[account] = true;
            emit RoleGranted(role, account, msg.sender);
        }
    }

    function revokeRole(bytes32 role, address account) external nonReentrant onlyRole(getRoleAdmin(role)) {
        if (_roles[role].members[account]) {
            _roles[role].members[account] = false;
            emit RoleRevoked(role, account, msg.sender);
        }
    }

    function renounceRole(bytes32 role, address account) external nonReentrant {
        require(account == msg.sender, "LitbreakProtocol: can only renounce own role");
        if (_roles[role].members[account]) {
            _roles[role].members[account] = false;
            emit RoleRevoked(role, account, msg.sender);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  OWNERSHIP
    // ═════════════════════════════════════════════════════════════════════════

    function owner() external view returns (address) { return _owner; }
    function pendingOwner() external view returns (address) { return _pendingOwner; }

    function transferOwnership(address newOwner) external nonReentrant onlyOwner {
        require(newOwner != address(0), "LitbreakProtocol: zero address");
        _pendingOwner = newOwner;
        emit OwnershipTransferStarted(_owner, newOwner);
    }

    function acceptOwnership() external nonReentrant {
        require(msg.sender == _pendingOwner, "LitbreakProtocol: not pending owner");
        address old = _owner;
        _owner = _pendingOwner;
        _pendingOwner = address(0);
        _roles[DEFAULT_ADMIN_ROLE].members[old] = false;
        _roles[DEFAULT_ADMIN_ROLE].members[_owner] = true;
        emit RoleRevoked(DEFAULT_ADMIN_ROLE, old, msg.sender);
        emit RoleGranted(DEFAULT_ADMIN_ROLE, _owner, msg.sender);
        emit OwnershipTransferred(old, _owner);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  PAUSABILITY
    // ═════════════════════════════════════════════════════════════════════════

    function paused() external view returns (bool) { return _paused; }

    function pause() external nonReentrant onlyRole(PAUSER_ROLE) whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external nonReentrant onlyRole(PAUSER_ROLE) whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  VIEW HELPERS
    // ═════════════════════════════════════════════════════════════════════════

    function remainingSupply() external view returns (uint256) {
        return HARD_CAP > _totalSupply ? HARD_CAP - _totalSupply : 0;
    }

    function isMonthReleased(uint256 year, uint256 month) external view returns (bool) {
        return monthlyReleaseCompleted[_monthKey(year, month)];
    }

    function getEffectiveMonthlyRate() external view returns (uint256) { return currentMonthlyRate; }

    function getEscalatorForYear(uint256 contractYear) external view returns (uint256 bps, bool isSet) {
        return (escalatorHistory[contractYear], escalatorYearSet[contractYear]);
    }

    function getContractState() external view returns (
        uint256 totalSupply_, uint256 hardCap_, uint256 monthlyRate_,
        uint256 currentContractYear_, uint256 lastRelYear_, uint256 lastRelMonth_,
        bool isPaused_, uint256 exchangeRate_, uint256 totalCollateral_, uint256 accumulatedFees_
    ) {
        return (_totalSupply, HARD_CAP, currentMonthlyRate, getCurrentContractYear(),
            lastReleaseYear, lastReleaseMonth, _paused, exchangeRate, totalCollateral, accumulatedFees);
    }

    /// @notice Accept LTC deposits
    receive() external payable {}
}
