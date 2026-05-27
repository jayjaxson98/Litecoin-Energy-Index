// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockOracle
 * @notice Mock Chainlink-style price feed for LitVM testnet deployment.
 *         Owner can push price updates. Used as both primary and fallback oracle
 *         during testnet phase.
 * @dev    Implements IPriceFeed interface expected by LitbreakTokenV2.
 */
contract MockOracle {
    uint8   public decimals;
    string  public description;
    address public owner;

    int256  private _answer;
    uint256 private _updatedAt;
    uint80  private _roundId;

    event AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "MockOracle: not owner");
        _;
    }

    /**
     * @param _decimals     Number of decimals for the price (e.g., 8 for Chainlink LTC/USD)
     * @param _description  Human-readable description (e.g., "LTC / USD")
     * @param _initialPrice Initial price answer (e.g., 8742000000 for $87.42 with 8 decimals)
     */
    constructor(uint8 _decimals, string memory _description, int256 _initialPrice) {
        require(_initialPrice > 0, "MockOracle: initial price must be positive");
        owner       = msg.sender;
        decimals    = _decimals;
        description = _description;
        _answer     = _initialPrice;
        _updatedAt  = block.timestamp;
        _roundId    = 1;

        emit AnswerUpdated(_initialPrice, 1, block.timestamp);
    }

    /**
     * @notice Push a new price update.
     * @param answer New price value (in oracle's native decimals).
     */
    function updateAnswer(int256 answer) external onlyOwner {
        require(answer > 0, "MockOracle: price must be positive");
        _roundId++;
        _answer    = answer;
        _updatedAt = block.timestamp;

        emit AnswerUpdated(answer, _roundId, block.timestamp);
    }

    /**
     * @notice Chainlink-compatible latestRoundData().
     */
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (
            _roundId,
            _answer,
            _updatedAt,     // startedAt = updatedAt for mock
            _updatedAt,
            _roundId        // answeredInRound = roundId (complete)
        );
    }

    /// @notice Transfer ownership.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "MockOracle: zero address");
        address old = owner;
        owner = newOwner;
        emit OwnershipTransferred(old, newOwner);
    }
}
