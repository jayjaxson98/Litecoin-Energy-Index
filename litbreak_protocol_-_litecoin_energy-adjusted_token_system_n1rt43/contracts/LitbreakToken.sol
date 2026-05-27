// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Litbreak Protocol Token (LBT)
/// @notice ERC20 token with energy-adjusted minting linked to real-world electricity prices
/// @dev Litecoin-native energy-adjusted token system

// ============================================================
//                     INTERFACES
// ============================================================

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

interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

interface AggregatorV3Interface {
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

// ============================================================
//                     MAIN CONTRACT
// ============================================================

contract LitbreakToken is IERC20, IERC20Metadata {

    // --------------------------------------------------------
    //                    ERC20 STORAGE
    // --------------------------------------------------------

    string private _name;
    string private _symbol;
    uint8 private constant _decimals = 8;
    uint256 private _totalSupply;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // --------------------------------------------------------
    //                    CONSTANTS
    // --------------------------------------------------------

    /// @notice Hard cap: 84,000,000 LBT (matching Litecoin's supply cap)
    uint256 public constant HARD_CAP = 84_000_000 * 10**8;

    /// @notice Base energy efficiency factor (scaled to 8 decimals)
    uint256 public constant BASE_ENERGY_FACTOR = 1_00000000; // 1.0 * 10^8

    /// @notice Maximum staleness for oracle data (2 hours)
    uint256 public constant MAX_ORACLE_STALENESS = 7200;

    /// @notice Minimum deposit amount in Litoshi (0.001 LTC)
    uint256 public constant MIN_DEPOSIT = 100_000; // 0.001 LTC in litoshi

    /// @notice Redemption fee basis points (0.3%)
    uint256 public constant REDEMPTION_FEE_BPS = 30;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10_000;

    // --------------------------------------------------------
    //                    ROLES
    // --------------------------------------------------------

    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    mapping(bytes32 => mapping(address => bool)) private _roles;
    address public owner;

    // --------------------------------------------------------
    //                    REENTRANCY GUARD
    // --------------------------------------------------------

    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _reentrancyStatus;

    // --------------------------------------------------------
    //                    PAUSABLE
    // --------------------------------------------------------

    bool public paused;

    // --------------------------------------------------------
    //                    ENERGY INDEX
    // --------------------------------------------------------

    /// @notice Global Energy Index (scaled to 8 decimals)
    /// @dev Represents the global average electricity cost factor
    uint256 public globalEnergyIndex;

    /// @notice Last update timestamp for the energy index
    uint256 public energyIndexLastUpdated;

    /// @notice Country code => electricity price in USD cents per kWh (scaled to 8 decimals)
    mapping(bytes3 => uint256) public countryElectricityRate;

    /// @notice List of tracked country codes
    bytes3[] public trackedCountries;

    /// @notice Country code => rank (1 = cheapest)
    mapping(bytes3 => uint256) public countryRank;

    // --------------------------------------------------------
    //                    ORACLE
    // --------------------------------------------------------

    /// @notice Chainlink LTC/USD price feed address
    AggregatorV3Interface public ltcUsdPriceFeed;

    /// @notice Fallback LTC/USD price (scaled to 8 decimals)
    uint256 public fallbackLtcPrice;

    /// @notice Last known good LTC/USD price
    uint256 public lastKnownLtcPrice;

    // --------------------------------------------------------
    //                    DEPOSIT TRACKING
    // --------------------------------------------------------

    /// @notice User => total LTC deposited (in litoshi)
    mapping(address => uint256) public userDeposits;

    /// @notice User => total LBT minted
    mapping(address => uint256) public userMinted;

    /// @notice Total LTC locked in the protocol (in litoshi)
    uint256 public totalLtcLocked;

    /// @notice Accumulated protocol fees (in litoshi)
    uint256 public protocolFees;

    // --------------------------------------------------------
    //                    EVENTS
    // --------------------------------------------------------

    event Minted(
        address indexed user,
        uint256 ltcDeposited,
        uint256 lbtMinted,
        uint256 energyFactor,
        uint256 ltcPriceUsed
    );

    event Redeemed(
        address indexed user,
        uint256 lbtBurned,
        uint256 ltcWithdrawn,
        uint256 feeCharged
    );

    event EnergyIndexUpdated(
        uint256 newIndex,
        uint256 timestamp,
        address indexed updatedBy
    );

    event CountryRateUpdated(
        bytes3 indexed countryCode,
        uint256 newRate,
        uint256 newRank
    );

    event OraclePriceFeedUpdated(address indexed newFeed);
    event FallbackPriceUpdated(uint256 newPrice);
    event Paused(address indexed account);
    event Unpaused(address indexed account);
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event FeesWithdrawn(address indexed to, uint256 amount);

    // --------------------------------------------------------
    //                    MODIFIERS
    // --------------------------------------------------------

    modifier nonReentrant() {
        require(_reentrancyStatus != _ENTERED, "LBT: reentrant call");
        _reentrancyStatus = _ENTERED;
        _;
        _reentrancyStatus = _NOT_ENTERED;
    }

    modifier whenNotPaused() {
        require(!paused, "LBT: protocol is paused");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "LBT: caller is not the owner");
        _;
    }

    modifier onlyRole(bytes32 role) {
        require(_roles[role][msg.sender] || msg.sender == owner, "LBT: missing required role");
        _;
    }

    // --------------------------------------------------------
    //                    CONSTRUCTOR
    // --------------------------------------------------------

    /// @notice Initializes the Litbreak Token with default energy index
    /// @param _ltcUsdPriceFeed Address of the Chainlink LTC/USD price feed
    /// @param _initialEnergyIndex Initial Global Energy Index (scaled to 8 decimals)
    constructor(address _ltcUsdPriceFeed, uint256 _initialEnergyIndex) {
        require(_initialEnergyIndex > 0, "LBT: invalid energy index");

        _name = "Litbreak Token";
        _symbol = "LBT";
        owner = msg.sender;
        _reentrancyStatus = _NOT_ENTERED;

        // Grant roles to deployer
        _roles[GOVERNANCE_ROLE][msg.sender] = true;
        _roles[ORACLE_ROLE][msg.sender] = true;

        emit RoleGranted(GOVERNANCE_ROLE, msg.sender, msg.sender);
        emit RoleGranted(ORACLE_ROLE, msg.sender, msg.sender);

        // Set oracle
        if (_ltcUsdPriceFeed != address(0)) {
            ltcUsdPriceFeed = AggregatorV3Interface(_ltcUsdPriceFeed);
        }

        // Set initial energy index
        globalEnergyIndex = _initialEnergyIndex;
        energyIndexLastUpdated = block.timestamp;

        // Set fallback price (e.g., $80 USD)
        fallbackLtcPrice = 80_00000000; // $80.00 scaled to 8 decimals
        lastKnownLtcPrice = fallbackLtcPrice;

        emit EnergyIndexUpdated(_initialEnergyIndex, block.timestamp, msg.sender);
    }

    // --------------------------------------------------------
    //                    ERC20 IMPLEMENTATION
    // --------------------------------------------------------

    /// @notice Returns the token name
    function name() external view override returns (string memory) {
        return _name;
    }

    /// @notice Returns the token symbol
    function symbol() external view override returns (string memory) {
        return _symbol;
    }

    /// @notice Returns the number of decimals
    function decimals() external pure override returns (uint8) {
        return _decimals;
    }

    /// @notice Returns the total supply
    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    /// @notice Returns the balance of an account
    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    /// @notice Transfers tokens to a recipient
    /// @param to Recipient address
    /// @param amount Amount to transfer
    /// @return success True if transfer succeeded
    function transfer(address to, uint256 amount) external override returns (bool) {
        require(to != address(0), "LBT: transfer to zero address");
        require(_balances[msg.sender] >= amount, "LBT: insufficient balance");

        _balances[msg.sender] -= amount;
        _balances[to] += amount;

        emit Transfer(msg.sender, to, amount);
        return true;
    }

    /// @notice Returns the allowance for a spender
    function allowance(address _owner, address spender) external view override returns (uint256) {
        return _allowances[_owner][spender];
    }

    /// @notice Approves a spender to spend tokens
    /// @param spender Spender address
    /// @param amount Amount to approve
    /// @return success True if approval succeeded
    function approve(address spender, uint256 amount) external override returns (bool) {
        require(spender != address(0), "LBT: approve to zero address");

        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /// @notice Transfers tokens from one address to another
    /// @param from Sender address
    /// @param to Recipient address
    /// @param amount Amount to transfer
    /// @return success True if transfer succeeded
    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(from != address(0), "LBT: transfer from zero address");
        require(to != address(0), "LBT: transfer to zero address");
        require(_balances[from] >= amount, "LBT: insufficient balance");
        require(_allowances[from][msg.sender] >= amount, "LBT: insufficient allowance");

        _allowances[from][msg.sender] -= amount;
        _balances[from] -= amount;
        _balances[to] += amount;

        emit Transfer(from, to, amount);
        return true;
    }

    // --------------------------------------------------------
    //                    CORE PROTOCOL
    // --------------------------------------------------------

    /// @notice Deposit LTC and mint energy-adjusted LBT tokens
    /// @dev LBT minted = (LTC deposited * energyEfficiencyFactor) / BASE_ENERGY_FACTOR
    /// @dev The energy efficiency factor is inversely proportional to electricity cost
    function mintWithLtc() external payable nonReentrant whenNotPaused {
        require(msg.value >= MIN_DEPOSIT, "LBT: deposit below minimum (0.001 LTC)");

        uint256 energyFactor = calculateEnergyEfficiencyFactor();
        uint256 ltcPrice = getLtcUsdPrice();

        // Calculate LBT to mint: deposit * energyFactor / BASE
        // Higher energy efficiency (cheaper electricity) = more LBT per LTC
        uint256 lbtToMint = (msg.value * energyFactor) / BASE_ENERGY_FACTOR;

        require(lbtToMint > 0, "LBT: mint amount is zero");
        require(_totalSupply + lbtToMint <= HARD_CAP, "LBT: would exceed hard cap");

        // Effects
        _balances[msg.sender] += lbtToMint;
        _totalSupply += lbtToMint;
        userDeposits[msg.sender] += msg.value;
        userMinted[msg.sender] += lbtToMint;
        totalLtcLocked += msg.value;

        emit Transfer(address(0), msg.sender, lbtToMint);
        emit Minted(msg.sender, msg.value, lbtToMint, energyFactor, ltcPrice);
    }

    /// @notice Redeem LBT tokens for LTC
    /// @param lbtAmount Amount of LBT to redeem
    function redeemForLtc(uint256 lbtAmount) external nonReentrant whenNotPaused {
        require(lbtAmount > 0, "LBT: redeem amount is zero");
        require(_balances[msg.sender] >= lbtAmount, "LBT: insufficient LBT balance");
        require(totalLtcLocked > 0, "LBT: no LTC locked in protocol");

        // Calculate LTC to return: proportional to share of total supply
        uint256 ltcToReturn = (lbtAmount * totalLtcLocked) / _totalSupply;
        require(ltcToReturn > 0, "LBT: withdrawal amount is zero");

        // Calculate fee
        uint256 fee = (ltcToReturn * REDEMPTION_FEE_BPS) / BPS_DENOMINATOR;
        uint256 ltcAfterFee = ltcToReturn - fee;

        require(ltcAfterFee > 0, "LBT: amount after fee is zero");
        require(address(this).balance >= ltcToReturn, "LBT: insufficient protocol LTC balance");

        // Effects
        _balances[msg.sender] -= lbtAmount;
        _totalSupply -= lbtAmount;
        totalLtcLocked -= ltcToReturn;
        protocolFees += fee;

        // Interaction
        (bool success, ) = payable(msg.sender).call{value: ltcAfterFee}("");
        require(success, "LBT: LTC transfer failed");

        emit Transfer(msg.sender, address(0), lbtAmount);
        emit Redeemed(msg.sender, lbtAmount, ltcAfterFee, fee);
    }

    // --------------------------------------------------------
    //                    ENERGY INDEX
    // --------------------------------------------------------

    /// @notice Calculate the Energy Efficiency Factor based on Global Energy Index
    /// @dev Factor = BASE * (globalAverageRate / currentGlobalIndex)
    /// @dev Lower electricity costs → higher factor → more LBT minted
    /// @return factor The energy efficiency factor (scaled to 8 decimals)
    function calculateEnergyEfficiencyFactor() public view returns (uint256) {
        require(globalEnergyIndex > 0, "LBT: energy index not set");

        // Global average electricity rate: ~15 cents/kWh (scaled to 8 decimals)
        uint256 globalAverage = 15_00000000;

        // If global index < average, energy is cheaper → factor > 1.0
        // If global index > average, energy is more expensive → factor < 1.0
        uint256 factor = (globalAverage * BASE_ENERGY_FACTOR) / globalEnergyIndex;

        // Clamp factor between 0.1x and 5.0x
        uint256 minFactor = BASE_ENERGY_FACTOR / 10; // 0.1x
        uint256 maxFactor = BASE_ENERGY_FACTOR * 5;  // 5.0x

        if (factor < minFactor) return minFactor;
        if (factor > maxFactor) return maxFactor;

        return factor;
    }

    /// @notice Update the Global Energy Index
    /// @param newIndex New energy index value (scaled to 8 decimals)
    function updateEnergyIndex(uint256 newIndex) external onlyRole(GOVERNANCE_ROLE) {
        require(newIndex > 0, "LBT: invalid energy index");
        require(newIndex != globalEnergyIndex, "LBT: index unchanged");

        globalEnergyIndex = newIndex;
        energyIndexLastUpdated = block.timestamp;

        emit EnergyIndexUpdated(newIndex, block.timestamp, msg.sender);
    }

    /// @notice Update electricity rate for a specific country
    /// @param countryCode ISO 3166-1 alpha-3 country code as bytes3
    /// @param rate Electricity rate in USD cents per kWh (scaled to 8 decimals)
    /// @param rank Country rank (1 = cheapest)
    function updateCountryRate(
        bytes3 countryCode,
        uint256 rate,
        uint256 rank
    ) external onlyRole(ORACLE_ROLE) {
        require(rate > 0, "LBT: invalid rate");
        require(rank > 0 && rank <= 30, "LBT: invalid rank");

        // Add to tracked list if new
        if (countryElectricityRate[countryCode] == 0) {
            trackedCountries.push(countryCode);
        }

        countryElectricityRate[countryCode] = rate;
        countryRank[countryCode] = rank;

        emit CountryRateUpdated(countryCode, rate, rank);
    }

    /// @notice Batch update country rates
    /// @param codes Array of country codes
    /// @param rates Array of electricity rates
    /// @param ranks Array of ranks
    function batchUpdateCountryRates(
        bytes3[] calldata codes,
        uint256[] calldata rates,
        uint256[] calldata ranks
    ) external onlyRole(ORACLE_ROLE) {
        require(codes.length == rates.length && rates.length == ranks.length, "LBT: array length mismatch");
        require(codes.length <= 30, "LBT: max 30 countries");

        for (uint256 i = 0; i < codes.length; i++) {
            require(rates[i] > 0, "LBT: invalid rate");
            require(ranks[i] > 0 && ranks[i] <= 30, "LBT: invalid rank");

            if (countryElectricityRate[codes[i]] == 0) {
                trackedCountries.push(codes[i]);
            }

            countryElectricityRate[codes[i]] = rates[i];
            countryRank[codes[i]] = ranks[i];

            emit CountryRateUpdated(codes[i], rates[i], ranks[i]);
        }
    }

    /// @notice Get the number of tracked countries
    function getTrackedCountryCount() external view returns (uint256) {
        return trackedCountries.length;
    }

    // --------------------------------------------------------
    //                    ORACLE
    // --------------------------------------------------------

    /// @notice Get the current LTC/USD price from Chainlink oracle with fallback
    /// @return price LTC price in USD (scaled to 8 decimals)
    function getLtcUsdPrice() public view returns (uint256) {
        if (address(ltcUsdPriceFeed) == address(0)) {
            return fallbackLtcPrice;
        }

        try ltcUsdPriceFeed.latestRoundData() returns (
            uint80,
            int256 answer,
            uint256,
            uint256 updatedAt,
            uint80
        ) {
            // Staleness check
            if (block.timestamp - updatedAt > MAX_ORACLE_STALENESS) {
                return lastKnownLtcPrice > 0 ? lastKnownLtcPrice : fallbackLtcPrice;
            }

            // Sanity check
            if (answer <= 0) {
                return lastKnownLtcPrice > 0 ? lastKnownLtcPrice : fallbackLtcPrice;
            }

            return uint256(answer);
        } catch {
            return lastKnownLtcPrice > 0 ? lastKnownLtcPrice : fallbackLtcPrice;
        }
    }

    /// @notice Update the Chainlink price feed address
    /// @param newFeed New price feed address
    function updatePriceFeed(address newFeed) external onlyRole(GOVERNANCE_ROLE) {
        require(newFeed != address(0), "LBT: invalid feed address");
        ltcUsdPriceFeed = AggregatorV3Interface(newFeed);
        emit OraclePriceFeedUpdated(newFeed);
    }

    /// @notice Update the fallback LTC price
    /// @param newPrice New fallback price (scaled to 8 decimals)
    function updateFallbackPrice(uint256 newPrice) external onlyRole(GOVERNANCE_ROLE) {
        require(newPrice > 0, "LBT: invalid price");
        fallbackLtcPrice = newPrice;
        lastKnownLtcPrice = newPrice;
        emit FallbackPriceUpdated(newPrice);
    }

    // --------------------------------------------------------
    //                    ACCESS CONTROL
    // --------------------------------------------------------

    /// @notice Grant a role to an account
    function grantRole(bytes32 role, address account) external onlyOwner {
        require(account != address(0), "LBT: grant to zero address");
        require(!_roles[role][account], "LBT: role already granted");

        _roles[role][account] = true;
        emit RoleGranted(role, account, msg.sender);
    }

    /// @notice Revoke a role from an account
    function revokeRole(bytes32 role, address account) external onlyOwner {
        require(_roles[role][account], "LBT: role not granted");

        _roles[role][account] = false;
        emit RoleRevoked(role, account, msg.sender);
    }

    /// @notice Check if an account has a role
    function hasRole(bytes32 role, address account) external view returns (bool) {
        return _roles[role][account];
    }

    /// @notice Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "LBT: new owner is zero address");

        address previousOwner = owner;
        owner = newOwner;

        // Grant roles to new owner
        _roles[GOVERNANCE_ROLE][newOwner] = true;
        _roles[ORACLE_ROLE][newOwner] = true;

        emit OwnershipTransferred(previousOwner, newOwner);
    }

    // --------------------------------------------------------
    //                    ADMIN
    // --------------------------------------------------------

    /// @notice Pause the protocol
    function pause() external onlyRole(GOVERNANCE_ROLE) {
        require(!paused, "LBT: already paused");
        paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Unpause the protocol
    function unpause() external onlyRole(GOVERNANCE_ROLE) {
        require(paused, "LBT: not paused");
        paused = false;
        emit Unpaused(msg.sender);
    }

    /// @notice Withdraw accumulated protocol fees
    /// @param to Recipient address
    function withdrawFees(address payable to) external onlyOwner nonReentrant {
        require(to != address(0), "LBT: withdraw to zero address");
        require(protocolFees > 0, "LBT: no fees to withdraw");

        uint256 amount = protocolFees;
        protocolFees = 0;

        (bool success, ) = to.call{value: amount}("");
        require(success, "LBT: fee withdrawal failed");

        emit FeesWithdrawn(to, amount);
    }

    // --------------------------------------------------------
    //                    VIEW FUNCTIONS
    // --------------------------------------------------------

    /// @notice Get protocol statistics
    /// @return _totalSupply Total LBT supply
    /// @return _totalLtcLocked Total LTC locked
    /// @return _energyIndex Current energy index
    /// @return _energyFactor Current energy efficiency factor
    /// @return _ltcPrice Current LTC/USD price
    function getProtocolStats() external view returns (
        uint256,
        uint256,
        uint256,
        uint256,
        uint256
    ) {
        return (
            _totalSupply,
            totalLtcLocked,
            globalEnergyIndex,
            calculateEnergyEfficiencyFactor(),
            getLtcUsdPrice()
        );
    }

    /// @notice Preview how much LBT would be minted for a given LTC deposit
    /// @param ltcAmount Amount of LTC in litoshi
    /// @return lbtAmount Amount of LBT that would be minted
    function previewMint(uint256 ltcAmount) external view returns (uint256) {
        require(ltcAmount >= MIN_DEPOSIT, "LBT: below minimum deposit");
        uint256 energyFactor = calculateEnergyEfficiencyFactor();
        return (ltcAmount * energyFactor) / BASE_ENERGY_FACTOR;
    }

    /// @notice Preview how much LTC would be returned for a given LBT redemption
    /// @param lbtAmount Amount of LBT to redeem
    /// @return ltcAmount Amount of LTC after fees
    /// @return fee Fee amount in LTC
    function previewRedeem(uint256 lbtAmount) external view returns (uint256, uint256) {
        require(lbtAmount > 0, "LBT: zero amount");
        require(_totalSupply > 0, "LBT: no supply");

        uint256 ltcToReturn = (lbtAmount * totalLtcLocked) / _totalSupply;
        uint256 fee = (ltcToReturn * REDEMPTION_FEE_BPS) / BPS_DENOMINATOR;
        return (ltcToReturn - fee, fee);
    }

    /// @notice Receive LTC deposits
    receive() external payable {}
}
