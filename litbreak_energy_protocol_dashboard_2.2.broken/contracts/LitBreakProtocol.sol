// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title LitBreakProtocol
/// @notice Litecoin energy index token with oracle-driven pricing, agent staking, and minting/redeeming.
/// @dev Flat contract — no imports. All interfaces, modifiers, and logic inline.
///      Audited: FIX-01 through FIX-15 applied.

// ─── Interfaces ───

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

// ─── Contract ───

contract LitBreakProtocol is IERC20 {
    // ── ERC-20 State ──
    string public constant name = "LitBreak Token";
    string public constant symbol = "LBT";
    uint8 public constant decimals = 18;
    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // ── Ownership ──
    address public owner;
    bool public paused;

    // ── Reentrancy Guard ──
    uint256 private _reentrancyStatus;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // ── Protocol State ──
    uint256 public energyIndex;
    uint256 public hashRate;
    uint256 public difficulty;
    uint256 public blockReward;
    uint256 public mintRate;
    uint256 public redeemRate;
    uint256 public totalStaked;
    uint256 public totalValueLocked;

    // ── Oracle State ──
    int256 public oraclePrice;
    uint256 public oracleLastUpdate;
    bool public oracleIsStale;
    uint256 public oracleDeviation;
    int256 public oracleCachePrice;
    uint256 public oracleCacheTimestamp;
    uint256 public oracleCacheBlockNumber;
    address public oracleKeeper;
    int256 public constant MAX_ORACLE_PRICE = 1000000 * 1e8; // FIX-07: int256

    // ── Agent State ──
    struct AgentConfig {
        uint256 id;
        string name;
        string strategy;
        bool isActive;
        int256 performance;
        uint256 totalStaked;
        uint256 rewardRate;
        uint256 lastUpdate;
    }

    uint256 public activeAgentCount;
    mapping(uint256 => AgentConfig) private _agents;
    mapping(address => mapping(uint256 => uint256)) private _userStakes;

    // ── Events ──
    event Minted(address indexed to, uint256 amount, uint256 cost);
    event Redeemed(address indexed from, uint256 amount, uint256 payout);
    event Staked(address indexed user, uint256 indexed agentId, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed agentId, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 indexed agentId, uint256 amount);
    event OracleCacheRefreshed(int256 newPrice, int256 previousPrice, uint256 timestamp);
    event OracleKeeperUpdated(address indexed previousKeeper, address indexed newKeeper);
    event Paused(address account);
    event Unpaused(address account);

    // ── Modifiers ──
    modifier onlyOwner() {
        require(msg.sender == owner, "LBP: caller is not the owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "LBP: paused");
        _;
    }

    modifier nonReentrant() {
        require(_reentrancyStatus != _ENTERED, "LBP: reentrant call");
        _reentrancyStatus = _ENTERED;
        _;
        _reentrancyStatus = _NOT_ENTERED;
    }

    // ── Constructor ──
    constructor() {
        owner = msg.sender;
        _reentrancyStatus = _NOT_ENTERED;
        paused = false;

        // Initialize protocol defaults
        energyIndex = 75e18;
        hashRate = 485e18;
        difficulty = 12e18;
        blockReward = 625e16; // 6.25 LTC
        mintRate = 1e18;
        redeemRate = 98e16; // 0.98

        // Initialize oracle
        oraclePrice = 85e8;
        oracleLastUpdate = block.timestamp;
        oracleKeeper = msg.sender;
        oracleCachePrice = 85e8;
        oracleCacheTimestamp = block.timestamp;
        oracleCacheBlockNumber = block.number;
    }

    // ── ERC-20 Implementation ──

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external override whenNotPaused returns (bool) {
        require(to != address(0), "LBP: transfer to zero address");
        require(_balances[msg.sender] >= amount, "LBP: insufficient balance");

        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address _owner, address spender) external view override returns (uint256) {
        return _allowances[_owner][spender];
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        require(spender != address(0), "LBP: approve to zero address");
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override whenNotPaused returns (bool) {
        require(from != address(0), "LBP: transfer from zero address");
        require(to != address(0), "LBP: transfer to zero address");
        require(_balances[from] >= amount, "LBP: insufficient balance");
        require(_allowances[from][msg.sender] >= amount, "LBP: insufficient allowance");

        _balances[from] -= amount;
        _balances[to] += amount;
        _allowances[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }

    // ── Mint ──
    /// @notice Mint LBT tokens by sending LTC
    function mint(uint256 amount) external payable whenNotPaused nonReentrant {
        require(amount > 0, "LBP: amount must be > 0");
        require(msg.value >= amount, "LBP: insufficient LTC sent");

        uint256 tokensToMint = (amount * mintRate) / 1e18;
        require(tokensToMint > 0, "LBP: mint amount too small");

        _balances[msg.sender] += tokensToMint;
        _totalSupply += tokensToMint;
        totalValueLocked += msg.value;

        emit Transfer(address(0), msg.sender, tokensToMint);
        emit Minted(msg.sender, tokensToMint, msg.value);
    }

    // ── Redeem ──
    /// @notice Redeem LBT tokens for LTC
    function redeem(uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "LBP: amount must be > 0");
        require(_balances[msg.sender] >= amount, "LBP: insufficient LBT balance");

        uint256 payout = (amount * redeemRate) / 1e18;
        require(address(this).balance >= payout, "LBP: insufficient contract balance");

        // Checks-effects-interactions (FIX-01)
        _balances[msg.sender] -= amount;
        _totalSupply -= amount;
        totalValueLocked -= payout;

        emit Transfer(msg.sender, address(0), amount);
        emit Redeemed(msg.sender, amount, payout);

        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "LBP: LTC transfer failed");
    }

    // ── Staking ──
    function stake(uint256 agentId, uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "LBP: amount must be > 0");
        require(_agents[agentId].isActive, "LBP: agent not active");
        require(_balances[msg.sender] >= amount, "LBP: insufficient balance");

        _balances[msg.sender] -= amount;
        _userStakes[msg.sender][agentId] += amount;
        _agents[agentId].totalStaked += amount;
        totalStaked += amount;

        emit Transfer(msg.sender, address(this), amount);
        emit Staked(msg.sender, agentId, amount);
    }

    function unstake(uint256 agentId, uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "LBP: amount must be > 0");
        require(_userStakes[msg.sender][agentId] >= amount, "LBP: insufficient stake");

        _userStakes[msg.sender][agentId] -= amount;
        _agents[agentId].totalStaked -= amount;
        totalStaked -= amount;
        _balances[msg.sender] += amount;

        emit Transfer(address(this), msg.sender, amount);
        emit Unstaked(msg.sender, agentId, amount);
    }

    function claimRewards(uint256 agentId) external whenNotPaused nonReentrant {
        uint256 userStake = _userStakes[msg.sender][agentId];
        require(userStake > 0, "LBP: no stake in agent");

        uint256 reward = (userStake * _agents[agentId].rewardRate) / 1e18;
        require(reward > 0, "LBP: no rewards to claim");

        _balances[msg.sender] += reward;
        _totalSupply += reward;

        emit Transfer(address(0), msg.sender, reward);
        emit RewardsClaimed(msg.sender, agentId, reward);
    }

    // ── Oracle ──
    /// @notice Refresh oracle cache — keeper only (SWC-114: no user tx can write oracle state)
    function refreshOracleCache() external returns (bool success, int256 newPrice, int256 previousPrice, uint256 timestamp) {
        require(msg.sender == oracleKeeper, "LBP: caller is not oracle keeper");

        previousPrice = oracleCachePrice;
        newPrice = oraclePrice;
        timestamp = block.timestamp;

        oracleCachePrice = newPrice;
        oracleCacheTimestamp = timestamp;
        oracleCacheBlockNumber = block.number;

        emit OracleCacheRefreshed(newPrice, previousPrice, timestamp);
        return (true, newPrice, previousPrice, timestamp);
    }

    function setOracleKeeper(address keeper) external onlyOwner {
        require(keeper != address(0), "LBP: keeper is zero address");
        address previous = oracleKeeper;
        oracleKeeper = keeper;
        emit OracleKeeperUpdated(previous, keeper);
    }

    // ── Views ──
    function getAgentConfig(uint256 agentId) external view returns (AgentConfig memory) {
        return _agents[agentId];
    }

    struct OracleStateView {
        int256 currentPrice;
        uint256 lastUpdate;
        bool isStale;
        uint256 deviation;
    }

    function getOracleState() external view returns (OracleStateView memory) {
        return OracleStateView(oraclePrice, oracleLastUpdate, oracleIsStale, oracleDeviation);
    }

    struct OraclePriceCacheView {
        int256 price;
        uint256 timestamp;
        uint256 blockNumber;
    }

    function getOraclePriceCache() external view returns (OraclePriceCacheView memory) {
        return OraclePriceCacheView(oracleCachePrice, oracleCacheTimestamp, oracleCacheBlockNumber);
    }

    // ── Admin ──
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // ── Receive LTC ──
    receive() external payable {}
}
