// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LitbreakToken v2 (LBT)
 * @notice Energy-indexed stablecoin backed by Wrapped Litecoin (WLTC).
 *         Mint LBT by depositing WLTC; redeem WLTC by burning LBT.
 *         Price is adjusted by the Global Energy Index (GEI).
 *
 * @dev ORACLE ARCHITECTURE:
 *      - Primary oracle: On-chain Chainlink-style price feed (IPriceFeed interface)
 *      - Fallback oracle: Secondary on-chain price feed (same interface)
 *      - Staleness threshold: If primary data is older than STALENESS_THRESHOLD (5 min),
 *        the contract automatically switches to the fallback feed.
 *      - Deviation band: New prices must be within MAX_PRICE_DEVIATION (20%) of the
 *        last known good price to prevent flash-loan or manipulation attacks.
 *      - Events: FallbackActivated / PrimaryRestored emitted on oracle source changes.
 *
 *      Flat contract — no external imports. All interfaces, modifiers, and helpers inline.
 *      Compatible with LitVM testnet EVM (Shanghai fork, Solidity 0.8.20+).
 */

/* ───────────────────────── Interfaces ───────────────────────── */

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @dev Chainlink-compatible price feed interface.
 *      Both primary and fallback oracles must implement this.
 */
interface IPriceFeed {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function decimals() external view returns (uint8);
}

/* ──────────────────────── Main Contract ─────────────────────── */

contract LitbreakTokenV2 {

    /* ══════════════════════ ERC-20 Metadata ══════════════════════ */

    string  public constant name     = "LitbreakToken";
    string  public constant symbol   = "LBT";
    uint8   public constant decimals = 18;

    uint256 public totalSupply;

    mapping(address => uint256)                      public balanceOf;
    mapping(address => mapping(address => uint256))  public allowance;

    /* ══════════════════════ Oracle State ══════════════════════ */

    /// @notice Primary on-chain price feed (Chainlink-style)
    IPriceFeed public primaryOracle;

    /// @notice Fallback on-chain price feed (activated when primary is stale/invalid)
    IPriceFeed public fallbackOracle;

    /// @notice Authorized address that can push GEI updates
    address public geiOracle;

    /// @notice Whether the contract is currently using the fallback oracle
    bool public usingFallback;

    /// @notice Last known good LTC/USD price (18 decimals) — used for deviation checks
    uint256 public lastGoodPrice;

    /// @notice Timestamp of the last successful price fetch
    uint256 public lastPriceUpdate;

    /// @notice Staleness threshold: if oracle data is older than this, switch to fallback
    /// @dev    Default 5 minutes (300 seconds). Configurable by owner.
    uint256 public stalenessThreshold = 300;

    /// @notice Maximum allowed deviation from last known good price (basis points)
    /// @dev    2000 = 20%. Prevents flash-loan / manipulation attacks.
    uint256 public constant MAX_PRICE_DEVIATION = 2000;

    /* ══════════════════════ Protocol State ══════════════════════ */

    address public owner;
    address public pendingOwner;
    IERC20  public immutable wltc;

    /// @notice Global Energy Index (18 decimals, 1e18 = 100%)
    uint256 public gei;

    /// @notice Cached LTC/USD price (18 decimals) — updated on every mint/redeem
    uint256 public ltcPriceUsd;

    /// @notice Timestamp of last GEI oracle update
    uint256 public lastGeiUpdate;

    uint256 public mintFee;             // basis points (e.g. 30 = 0.30%)
    uint256 public redeemFee;           // basis points
    uint256 public constant MAX_FEE = 500; // 5% hard cap

    bool    public paused;

    /* ══════════════════════ Staking State ══════════════════════ */

    struct StakeInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 lockEnd;
    }

    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;
    uint256 public rewardPerTokenStored;
    uint256 public lastRewardTimestamp;
    uint256 public rewardRate;          // LBT per second (18 dec)

    /* ══════════════════════ Reentrancy Guard ══════════════════════ */

    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED     = 2;

    /* ══════════════════════ Events ══════════════════════ */

    // ERC-20
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // Protocol operations
    event Minted(address indexed user, uint256 wltcIn, uint256 lbtOut, uint256 fee);
    event Redeemed(address indexed user, uint256 lbtIn, uint256 wltcOut, uint256 fee);
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 reward);

    // Oracle events
    event GeiUpdated(uint256 newGei, uint256 timestamp);
    event PriceUpdated(uint256 newPrice, bool fromFallback, uint256 timestamp);

    /// @notice Emitted when the fallback oracle is activated due to primary failure
    event FallbackActivated(uint256 timestamp, string reason);

    /// @notice Emitted when the primary oracle is restored after fallback period
    event PrimaryRestored(uint256 timestamp);

    /// @notice Emitted when oracle addresses are changed
    event OracleAddressesUpdated(
        address indexed newPrimary,
        address indexed newFallback,
        address indexed newGeiOracle
    );

    // Admin events
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event FeesUpdated(uint256 mintFee, uint256 redeemFee);
    event Paused(address account);
    event Unpaused(address account);
    event RewardRateUpdated(uint256 newRate);
    event StalenessThresholdUpdated(uint256 newThreshold);

    /* ══════════════════════ Modifiers ══════════════════════ */

    modifier onlyOwner() {
        require(msg.sender == owner, "LBT: caller is not the owner");
        _;
    }

    modifier onlyGeiOracle() {
        require(msg.sender == geiOracle, "LBT: caller is not the GEI oracle");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "LBT: protocol is paused");
        _;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "LBT: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    /* ══════════════════════ Constructor ══════════════════════ */

    /**
     * @notice Deploy LitbreakToken v2.
     * @param _wltc            Address of the Wrapped Litecoin (WLTC) ERC-20 token
     * @param _primaryOracle   Address of the primary Chainlink-style LTC/USD price feed
     * @param _fallbackOracle  Address of the fallback LTC/USD price feed
     * @param _geiOracle       Address authorized to push GEI updates
     * @param _initialGei      Initial Global Energy Index (18 decimals)
     *
     * @dev All addresses are parameterized — nothing is hardcoded for any specific network.
     *      Deploy with testnet-specific addresses for LitVM testnet.
     */
    constructor(
        address _wltc,
        address _primaryOracle,
        address _fallbackOracle,
        address _geiOracle,
        uint256 _initialGei
    ) {
        require(_wltc            != address(0), "LBT: zero WLTC address");
        require(_primaryOracle   != address(0), "LBT: zero primary oracle");
        require(_fallbackOracle  != address(0), "LBT: zero fallback oracle");
        require(_geiOracle       != address(0), "LBT: zero GEI oracle");
        require(_initialGei      > 0,           "LBT: zero GEI");

        owner           = msg.sender;
        wltc            = IERC20(_wltc);
        primaryOracle   = IPriceFeed(_primaryOracle);
        fallbackOracle  = IPriceFeed(_fallbackOracle);
        geiOracle       = _geiOracle;
        gei             = _initialGei;
        lastGeiUpdate   = block.timestamp;
        mintFee         = 0;        // 0% at launch
        redeemFee       = 30;       // 0.30%
        _status         = _NOT_ENTERED;
        rewardRate      = 0;
        lastRewardTimestamp = block.timestamp;

        // Fetch initial price from primary oracle
        (uint256 initialPrice, bool fromFallback) = _fetchPrice();
        require(initialPrice > 0, "LBT: cannot fetch initial price");
        ltcPriceUsd   = initialPrice;
        lastGoodPrice = initialPrice;
        lastPriceUpdate = block.timestamp;

        emit PriceUpdated(initialPrice, fromFallback, block.timestamp);
        emit GeiUpdated(_initialGei, block.timestamp);
    }

    /* ═══════════════════════ ERC-20 Core ═══════════════════════ */

    /// @notice Transfer tokens to `to`.
    function transfer(address to, uint256 amount) external returns (bool) {
        require(to != address(0), "LBT: transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "LBT: insufficient balance");

        balanceOf[msg.sender] -= amount;
        balanceOf[to]         += amount;

        emit Transfer(msg.sender, to, amount);
        return true;
    }

    /// @notice Approve `spender` to spend `amount` on behalf of caller.
    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "LBT: approve to zero address");

        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /// @notice Transfer `amount` from `from` to `to` using allowance.
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(to   != address(0), "LBT: transfer to zero address");
        require(from != address(0), "LBT: transfer from zero address");
        require(balanceOf[from] >= amount, "LBT: insufficient balance");

        uint256 currentAllowance = allowance[from][msg.sender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "LBT: insufficient allowance");
            allowance[from][msg.sender] = currentAllowance - amount;
        }

        balanceOf[from] -= amount;
        balanceOf[to]   += amount;

        emit Transfer(from, to, amount);
        return true;
    }

    /* ═══════════════════ Oracle — Price Fetching ═══════════════════ */

    /**
     * @dev Internal: Attempt to fetch price from primary oracle first.
     *      If primary is stale, returns zero, returns negative, or reverts,
     *      automatically switch to fallback oracle.
     *
     * @return price        The validated LTC/USD price in 18 decimals
     * @return fromFallback Whether the price came from the fallback oracle
     */
    function _fetchPrice() internal returns (uint256 price, bool fromFallback) {
        // --- Step 1: Try primary oracle ---
        (bool primarySuccess, uint256 primaryPrice) = _tryOracle(primaryOracle);

        if (primarySuccess) {
            if (usingFallback) {
                usingFallback = false;
                emit PrimaryRestored(block.timestamp);
            }
            return (primaryPrice, false);
        }

        // --- Step 2: Primary failed — try fallback ---
        (bool fallbackSuccess, uint256 fallbackPrice) = _tryOracle(fallbackOracle);

        if (fallbackSuccess) {
            if (!usingFallback) {
                usingFallback = true;
                emit FallbackActivated(block.timestamp, "Primary oracle stale or invalid");
            }
            return (fallbackPrice, true);
        }

        // --- Step 3: Both oracles failed ---
        revert("LBT: both oracles unavailable");
    }

    /**
     * @dev Try to read from a single oracle. Returns (success, normalizedPrice).
     *      Catches reverts from the oracle call. Validates staleness, positivity,
     *      and deviation band.
     */
    function _tryOracle(IPriceFeed oracle) internal view returns (bool success, uint256 normalizedPrice) {
        try oracle.latestRoundData() returns (
            uint80 roundId,
            int256 answer,
            uint256 /* startedAt */,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            // Validation 1: Answer must be positive
            if (answer <= 0) return (false, 0);

            // Validation 2: Round must be complete
            if (answeredInRound < roundId) return (false, 0);

            // Validation 3: Data must not be stale
            if (block.timestamp - updatedAt > stalenessThreshold) return (false, 0);

            // Validation 4: updatedAt must be in the past (sanity)
            if (updatedAt > block.timestamp) return (false, 0);

            // Normalize to 18 decimals
            uint8 oracleDecimals = oracle.decimals();
            uint256 price;
            if (oracleDecimals < 18) {
                price = uint256(answer) * (10 ** (18 - oracleDecimals));
            } else if (oracleDecimals > 18) {
                price = uint256(answer) / (10 ** (oracleDecimals - 18));
            } else {
                price = uint256(answer);
            }

            // Validation 5: Deviation band check (skip if no lastGoodPrice yet)
            if (lastGoodPrice > 0) {
                uint256 deviation;
                if (price > lastGoodPrice) {
                    deviation = ((price - lastGoodPrice) * 10000) / lastGoodPrice;
                } else {
                    deviation = ((lastGoodPrice - price) * 10000) / lastGoodPrice;
                }
                if (deviation > MAX_PRICE_DEVIATION) return (false, 0);
            }

            return (true, price);
        } catch {
            return (false, 0);
        }
    }

    /**
     * @notice Refresh the cached LTC/USD price from oracles.
     *         Can be called by anyone (gas cost borne by caller).
     */
    function refreshPrice() external {
        (uint256 newPrice, bool fromFallback) = _fetchPrice();

        ltcPriceUsd     = newPrice;
        lastGoodPrice   = newPrice;
        lastPriceUpdate = block.timestamp;

        emit PriceUpdated(newPrice, fromFallback, block.timestamp);
    }

    /**
     * @dev Internal helper: refresh price before any mint/redeem operation.
     */
    function _refreshPriceInternal() internal {
        (uint256 newPrice, bool fromFallback) = _fetchPrice();
        ltcPriceUsd     = newPrice;
        lastGoodPrice   = newPrice;
        lastPriceUpdate = block.timestamp;

        emit PriceUpdated(newPrice, fromFallback, block.timestamp);
    }

    /* ═══════════════════ Mint / Redeem ═══════════════════ */

    /**
     * @notice Deposit WLTC and receive LBT.
     *         LBT output = wltcAmount * ltcPriceUsd * (gei / 1e18)
     * @param wltcAmount Amount of WLTC to deposit (18 decimals).
     */
    function mint(uint256 wltcAmount) external nonReentrant whenNotPaused {
        require(wltcAmount > 0, "LBT: zero amount");

        _refreshPriceInternal();
        require(ltcPriceUsd > 0 && gei > 0, "LBT: oracle not set");

        uint256 rawOutput = (wltcAmount * ltcPriceUsd / 1e18) * gei / 1e18;
        uint256 fee       = rawOutput * mintFee / 10000;
        uint256 lbtOut    = rawOutput - fee;
        require(lbtOut > 0, "LBT: output too small");

        _mint(msg.sender, lbtOut);
        if (fee > 0) _mint(owner, fee);

        bool success = wltc.transferFrom(msg.sender, address(this), wltcAmount);
        require(success, "LBT: WLTC transfer failed");

        emit Minted(msg.sender, wltcAmount, lbtOut, fee);
    }

    /**
     * @notice Burn LBT and receive WLTC back.
     * @param lbtAmount Amount of LBT to burn (18 decimals).
     */
    function redeem(uint256 lbtAmount) external nonReentrant whenNotPaused {
        require(lbtAmount > 0, "LBT: zero amount");
        require(balanceOf[msg.sender] >= lbtAmount, "LBT: insufficient LBT balance");

        _refreshPriceInternal();
        require(ltcPriceUsd > 0 && gei > 0, "LBT: oracle not set");

        uint256 rawOutput = (lbtAmount * 1e18 / ltcPriceUsd) * 1e18 / gei;
        uint256 fee       = rawOutput * redeemFee / 10000;
        uint256 wltcOut   = rawOutput - fee;
        require(wltcOut > 0, "LBT: output too small");
        require(wltc.balanceOf(address(this)) >= rawOutput, "LBT: insufficient WLTC reserves");

        _burn(msg.sender, lbtAmount);

        bool success = wltc.transfer(msg.sender, wltcOut);
        require(success, "LBT: WLTC transfer failed");

        if (fee > 0) {
            bool feeSuccess = wltc.transfer(owner, fee);
            require(feeSuccess, "LBT: fee transfer failed");
        }

        emit Redeemed(msg.sender, lbtAmount, wltcOut, fee);
    }

    /* ═══════════════════ Staking ═══════════════════ */

    /// @notice Stake LBT to earn rewards.
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "LBT: zero stake amount");
        require(balanceOf[msg.sender] >= amount, "LBT: insufficient balance to stake");

        _updateRewards(msg.sender);

        balanceOf[msg.sender] -= amount;
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].lockEnd = block.timestamp + 30 days;
        totalStaked += amount;

        emit Transfer(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    /// @notice Unstake LBT after lock period.
    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage info = stakes[msg.sender];
        require(amount > 0, "LBT: zero unstake amount");
        require(info.amount >= amount, "LBT: insufficient staked balance");
        require(block.timestamp >= info.lockEnd, "LBT: tokens still locked");

        _updateRewards(msg.sender);

        info.amount -= amount;
        totalStaked -= amount;
        balanceOf[msg.sender] += amount;

        emit Transfer(address(this), msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    /// @notice Claim accumulated staking rewards.
    function claimRewards() external nonReentrant {
        _updateRewards(msg.sender);

        uint256 reward = _pendingReward(msg.sender);
        require(reward > 0, "LBT: no rewards to claim");

        stakes[msg.sender].rewardDebt = rewardPerTokenStored;
        _mint(msg.sender, reward);

        emit RewardsClaimed(msg.sender, reward);
    }

    /// @notice View pending rewards for a user.
    function pendingReward(address user) external view returns (uint256) {
        return _pendingReward(user);
    }

    /* ═══════════════════ GEI Oracle ═══════════════════ */

    /**
     * @notice Update the Global Energy Index. Only callable by the GEI oracle.
     * @param _gei New GEI value (18 decimals).
     */
    function updateGei(uint256 _gei) external onlyGeiOracle {
        require(_gei > 0, "LBT: zero GEI");
        gei          = _gei;
        lastGeiUpdate = block.timestamp;
        emit GeiUpdated(_gei, block.timestamp);
    }

    /* ═══════════════════ Admin Functions ═══════════════════ */

    /**
     * @notice Update oracle addresses. All three can be changed atomically.
     * @param _primaryOracle  New primary LTC/USD price feed
     * @param _fallbackOracle New fallback LTC/USD price feed
     * @param _geiOracle      New GEI oracle address
     */
    function setOracles(
        address _primaryOracle,
        address _fallbackOracle,
        address _geiOracle
    ) external onlyOwner {
        require(_primaryOracle  != address(0), "LBT: zero primary oracle");
        require(_fallbackOracle != address(0), "LBT: zero fallback oracle");
        require(_geiOracle      != address(0), "LBT: zero GEI oracle");

        primaryOracle  = IPriceFeed(_primaryOracle);
        fallbackOracle = IPriceFeed(_fallbackOracle);
        geiOracle      = _geiOracle;

        usingFallback = false;

        emit OracleAddressesUpdated(_primaryOracle, _fallbackOracle, _geiOracle);
    }

    /// @notice Update staleness threshold (in seconds).
    function setStalenessThreshold(uint256 _threshold) external onlyOwner {
        require(_threshold >= 60, "LBT: threshold too low (min 60s)");
        require(_threshold <= 3600, "LBT: threshold too high (max 1h)");
        stalenessThreshold = _threshold;
        emit StalenessThresholdUpdated(_threshold);
    }

    /// @notice Update mint and redeem fees (in basis points).
    function setFees(uint256 _mintFee, uint256 _redeemFee) external onlyOwner {
        require(_mintFee <= MAX_FEE, "LBT: mint fee exceeds max");
        require(_redeemFee <= MAX_FEE, "LBT: redeem fee exceeds max");
        mintFee   = _mintFee;
        redeemFee = _redeemFee;
        emit FeesUpdated(_mintFee, _redeemFee);
    }

    /// @notice Set staking reward rate (LBT per second, 18 decimals).
    function setRewardRate(uint256 _rate) external onlyOwner {
        _updateRewards(address(0));
        rewardRate = _rate;
        emit RewardRateUpdated(_rate);
    }

    /// @notice Pause the protocol (emergency stop).
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Unpause the protocol.
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /// @notice Begin two-step ownership transfer.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "LBT: zero address");
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// @notice Accept ownership (must be called by pendingOwner).
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "LBT: caller is not pending owner");
        address old = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipTransferred(old, owner);
    }

    /* ═══════════════════ View Helpers ═══════════════════ */

    /// @notice Get the current backing ratio (WLTC value / LBT supply).
    function backingRatio() external view returns (uint256) {
        if (totalSupply == 0) return 1e18;
        uint256 wltcValue = wltc.balanceOf(address(this)) * ltcPriceUsd / 1e18;
        return wltcValue * 1e18 / totalSupply;
    }

    /// @notice Calculate how much LBT you get for a given WLTC deposit.
    function quoteMint(uint256 wltcAmount) external view returns (uint256 lbtOut, uint256 fee) {
        uint256 raw = (wltcAmount * ltcPriceUsd / 1e18) * gei / 1e18;
        fee    = raw * mintFee / 10000;
        lbtOut = raw - fee;
    }

    /// @notice Calculate how much WLTC you get for burning a given LBT amount.
    function quoteRedeem(uint256 lbtAmount) external view returns (uint256 wltcOut, uint256 fee) {
        uint256 raw = (lbtAmount * 1e18 / ltcPriceUsd) * 1e18 / gei;
        fee     = raw * redeemFee / 10000;
        wltcOut = raw - fee;
    }

    /// @notice Get current oracle status for off-chain monitoring.
    function getOracleStatus() external view returns (
        bool _usingFallback,
        uint256 _lastPriceUpdate,
        uint256 _lastGoodPrice,
        uint256 _stalenessThreshold,
        uint256 _currentPrice
    ) {
        return (
            usingFallback,
            lastPriceUpdate,
            lastGoodPrice,
            stalenessThreshold,
            ltcPriceUsd
        );
    }

    /* ═══════════════════ Internal ═══════════════════ */

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "LBT: mint to zero address");
        totalSupply    += amount;
        balanceOf[to]  += amount;
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        require(from != address(0), "LBT: burn from zero address");
        require(balanceOf[from] >= amount, "LBT: burn exceeds balance");
        balanceOf[from] -= amount;
        totalSupply     -= amount;
        emit Transfer(from, address(0), amount);
    }

    function _updateRewards(address user) internal {
        if (totalStaked > 0) {
            uint256 elapsed = block.timestamp - lastRewardTimestamp;
            rewardPerTokenStored += (elapsed * rewardRate * 1e18) / totalStaked;
        }
        lastRewardTimestamp = block.timestamp;

        if (user != address(0)) {
            stakes[user].rewardDebt = rewardPerTokenStored;
        }
    }

    function _pendingReward(address user) internal view returns (uint256) {
        StakeInfo storage info = stakes[user];
        if (info.amount == 0) return 0;

        uint256 currentRewardPerToken = rewardPerTokenStored;
        if (totalStaked > 0) {
            uint256 elapsed = block.timestamp - lastRewardTimestamp;
            currentRewardPerToken += (elapsed * rewardRate * 1e18) / totalStaked;
        }

        return (info.amount * (currentRewardPerToken - info.rewardDebt)) / 1e18;
    }
}
