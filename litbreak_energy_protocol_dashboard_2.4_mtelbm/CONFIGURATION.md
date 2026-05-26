# Litbreak Energy Protocol — Configuration Guide

> **Last Updated:** Pass 12 (Guardian Co-Signer System)
> **Contract Version:** 12 (`CONTRACT_VERSION = 12`)
> **Pragma:** `pragma solidity 0.8.20;` (pinned — EXT-06)
> **Native Token:** LTC (Litecoin, bridged to LitVM L2)

---

## 1. Oracle Feed Configuration

### Constructor Parameters

```solidity
constructor(
    address _initialOracle,       // Initial oracle address (validated non-zero)
    uint256 _initialExchangeRate, // LTC → LITB exchange rate scaled by 1e18 (e.g., 125e18)
    uint256 _initialFeeBps,       // Fee in basis points (e.g., 30 = 0.3%)
    uint256 _initialEnergyPriceUsd // Energy price scaled by 1e6 (e.g., 142000 = $0.142/kWh)
)
```

### Managing Oracles Post-Deployment

```solidity
// ─── Without Guardian (backward compatible) ───────────────────
litbreakProtocol.addOracle(newOracleAddress);
litbreakProtocol.removeOracle(oldOracleAddress);

// ─── With Guardian Active (P12-01: dual-approval required) ────
// Step 1: Owner creates proposal
uint256 proposalId = litbreakProtocol.createProposal(
    1,                    // PROPOSAL_ADD_ORACLE
    newOracleAddress,     // target
    0                     // value (unused for add oracle)
);

// Step 2: Guardian confirms and executes
litbreakProtocol.confirmProposal(proposalId);

// ─── Timelocked (recommended for production — EXT-05, P5-02) ──
bytes32 actionId = keccak256(abi.encode("addOracle", newOracleAddress));
litbreakProtocol.queueTimelockAction(actionId, "Add oracle 0x...");
// Wait 48 hours...
litbreakProtocol.executeTimelockAddOracle(actionId, newOracleAddress);
```

### Oracle Baseline System (P6-01)

- **Baseline freezes for 24 hours** after each update (`BASELINE_UPDATE_INTERVAL = 86400`)
- Oracle submissions are constrained to ≤150% of the **frozen** baseline
- Maximum drift: **50% per 24 hours** per oracle
- Owner can manually reset baselines via `resetOracleBaseline()` (when no guardian)
- With guardian active, baseline resets require dual-approval via proposal system

### Staleness Configuration

| Constant | Value | Description |
|---|---|---|
| `ORACLE_STALENESS_THRESHOLD` | 3600s (1 hour) | Max age for price data in mint/redeem |
| `MAX_STALENESS` | 3600s (1 hour) | Max age for oracle data in aggregation |
| `TIMESTAMP_SAFETY_BUFFER` | 15s | Buffer for miner timestamp manipulation |
| `ORACLE_SUBMISSION_COOLDOWN` | 60s | Min time between oracle submissions |
| `BASELINE_UPDATE_INTERVAL` | 86400s (24 hours) | Min time between baseline updates — **P6-01** |
| `AUTO_RECOVERY_TIMEOUT` | 86400s (24 hours) | Auto-recovery from staleness pause — **EXT-04** |
| `AUTO_RECOVERY_COOLDOWN` | 3600s (1 hour) | Min time between recovery attempts — **P8-01** |
| `TWAP_EPOCH_DURATION` | 360s (6 minutes) | Duration of a TWAP rate-limiting epoch — **P9-01** |

---

## 2. Guardian System (P12-01)

### Overview

The guardian system adds a **dual-approval requirement** for critical operations. When a guardian address is set, the following functions require both owner AND guardian to agree:

| Function | Without Guardian | With Guardian |
|---|---|---|
| `addOracle` | Owner-only | Proposal → Confirm |
| `removeOracle` | Owner-only | Proposal → Confirm |
| `resetOracleBaseline` | Owner-only | Proposal → Confirm |
| `transferOwnership` | Owner-only | Proposal → Confirm |
| `emergencyWithdrawLtc` | Owner-only | Proposal → Confirm |
| `setGuardian` (change) | Owner-only | Proposal → Confirm |
| `setExchangeRate` | Owner-only | Owner-only (timelocked) |
| `setFee` | Owner-only | Owner-only (timelocked) |
| `pause` / `unpause` | Owner-only | Owner-only (time-sensitive) |
| `resolveOracleStaleness` | Owner-only | Owner-only (time-sensitive) |

### Setup

```solidity
// Step 1: Owner sets initial guardian (one-time, no dual-approval needed)
litbreakProtocol.setGuardian(guardianAddress);

// Step 2: Verify guardian is active
(bool active, address addr) = litbreakProtocol.getGuardianStatus();
// active == true, addr == guardianAddress
```

### Proposal Flow

```
Owner/Guardian → createProposal(actionType, target, value)
                        ↓
              ProposalCreated event emitted
                        ↓
              Other party reviews proposal
                        ↓
Guardian/Owner → confirmProposal(proposalId)
                        ↓
              Action executed + ProposalExecuted event
```

### Proposal Types

| Type | Value | Description |
|---|---|---|
| `PROPOSAL_ADD_ORACLE` | 1 | Add a new oracle address |
| `PROPOSAL_REMOVE_ORACLE` | 2 | Remove an existing oracle |
| `PROPOSAL_RESET_BASELINE` | 3 | Reset oracle baseline price |
| `PROPOSAL_TRANSFER_OWNERSHIP` | 4 | Transfer contract ownership |
| `PROPOSAL_EMERGENCY_WITHDRAW` | 5 | Emergency LTC withdrawal |
| `PROPOSAL_SET_GUARDIAN` | 6 | Change guardian address |

### Constants

| Constant | Value | Description |
|---|---|---|
| `PROPOSAL_EXPIRY` | 604800s (7 days) | Proposals expire after this duration |
| `MAX_ACTIVE_PROPOSALS` | 10 | Maximum pending proposals at once |

### Changing or Removing Guardian

```solidity
// To change guardian (requires dual-approval):
uint256 pid = litbreakProtocol.createProposal(6, newGuardianAddress, 0);
// Other party confirms:
litbreakProtocol.confirmProposal(pid);

// To remove guardian (set to address(0)):
uint256 pid = litbreakProtocol.createProposal(6, address(0), 0);
litbreakProtocol.confirmProposal(pid);
```

---

## 3. Network Configuration

| Network | Chain ID | Env Variable | Native Token |
|---|---|---|---|
| LitVM Testnet | 1001 | `VITE_CONTRACT_ADDRESS` | LTC |
| LitVM Mainnet | 1000 | `VITE_CONTRACT_ADDRESS` | LTC |
| Localhost | 31337 | `VITE_CONTRACT_ADDRESS` | LTC |

---

## 4. Environment Variables

```env
VITE_RPC_URL=https://testnet-rpc.litvm.io
VITE_CONTRACT_ADDRESS=0x...
VITE_SIMULATION_OWNER=0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68
VITE_READ_ONLY_MODE=true

DEPLOYER_PRIVATE_KEY=0x...
INITIAL_ORACLE=0x...
INITIAL_EXCHANGE_RATE=125000000000000000000
INITIAL_FEE_BPS=30
INITIAL_ENERGY_PRICE_USD=142000
```

---

## 5. Security Audit Summary

### Pass 1–9 — 54 Findings (All Resolved)
See previous documentation for detailed breakdown.

### Pass 10 — ETH→LTC Migration (Non-Security)
5 changes: event/function renames, error messages, NatSpec, read-only mode, version bump.

### Pass 10.3 — CEI Pattern in mint()
1 finding: Added explicit CEI section markers and NatSpec.

### Pass 10.4 — Baseline Reset Hardening
1 finding: 50% change cap on direct `resetOracleBaseline()`, timelock path for larger resets.

### Pass 11 — Frontend Integration Audit
12 findings: ABI completeness, type fixes, network config, version alignment.

### Pass 12 — Guardian Co-Signer (P12-01: MEDIUM Centralization Risk)

| ID | Change | Type | Impact |
|---|---|---|---|
| P12-01 | Guardian dual-approval system | Security | Mitigates single-key compromise risk |

**Design Decisions:**
- **Opt-in**: Guardian starts as `address(0)` — no breaking changes for existing deployments
- **Backward compatible**: When guardian is not set, all functions work exactly as before
- **Tiered access**: Only critical functions require dual-approval; operational functions (pause/unpause) remain owner-only for incident response speed
- **Proposal expiry**: 7-day window prevents stale proposals from being executed after conditions change
- **Active proposal cap**: Maximum 10 pending proposals prevents storage bloat
- **CEI compliance**: `confirmProposal` marks proposal as executed BEFORE performing the action
- **Timelock coexistence**: Timelock system remains independent — it IS the second check for `setExchangeRate`/`setFee`

---

## 6. Complete Function Reference

### State-Changing Functions

| Function | Access | Description |
|---|---|---|
| `mint()` | Public (payable) | Mint LITB by sending LTC |
| `redeem(uint256)` | Public | Burn LITB to receive LTC |
| `transfer(address,uint256)` | Public | ERC-20 transfer |
| `approve(address,uint256)` | Public | ERC-20 approve |
| `transferFrom(address,address,uint256)` | Public | ERC-20 transferFrom |
| `increaseAllowance(address,uint256)` | Public | Atomic allowance increase |
| `decreaseAllowance(address,uint256)` | Public | Atomic allowance decrease |
| `submitOraclePrice(uint256)` | Oracle only | Submit energy price |
| `updateEnergyPrice(uint256)` | Oracle only | Alias for submitOraclePrice |
| `addOracle(address)` | Owner only (no guardian) | Add oracle |
| `removeOracle(address)` | Owner only (no guardian) | Remove oracle |
| `resetOracleBaseline(address,uint256)` | Owner only (no guardian) | Reset oracle baseline |
| `setExchangeRate(uint256)` | Owner only | Update exchange rate (±20% cap) |
| `setFee(uint256)` | Owner only | Update fee (max 5%) |
| `pause()` | Owner only | Pause contract |
| `unpause()` | Owner only | Unpause contract |
| `transferOwnership(address)` | Owner only (no guardian) | Transfer ownership |
| `resolveOracleStaleness()` | Owner only | Manually resolve staleness |
| `emergencyWithdrawLtc(address,uint256)` | Owner only (no guardian) | Emergency LTC withdraw |
| `triggerAutoRecovery()` | Oracle or Owner | Auto-recover from staleness |
| `setGuardian(address)` | Owner only (no guardian) | Set initial guardian |
| `createProposal(uint8,address,uint256)` | Owner or Guardian | Create dual-approval proposal |
| `confirmProposal(uint256)` | Owner or Guardian | Confirm and execute proposal |
| `cancelProposal(uint256)` | Owner or Guardian | Cancel pending proposal |
| `queueTimelockAction(bytes32,string)` | Owner only | Queue timelocked action |
| `cancelTimelockAction(bytes32)` | Owner only | Cancel queued action |
| `executeTimelockSetExchangeRate(bytes32,uint256)` | Owner only | Execute timelocked rate change |
| `executeTimelockSetFee(bytes32,uint256)` | Owner only | Execute timelocked fee change |
| `executeTimelockAddOracle(bytes32,address)` | Owner only | Execute timelocked oracle add |
| `executeTimelockRemoveOracle(bytes32,address)` | Owner only | Execute timelocked oracle remove |
| `executeTimelockResetOracleBaseline(bytes32,address,uint256)` | Owner only | Execute timelocked baseline reset |

### View Functions

| Function | Returns | Description |
|---|---|---|
| `name()` | string | Token name ("Litbreak Token") |
| `symbol()` | string | Token symbol ("LITB") |
| `decimals()` | uint8 | Token decimals (18) |
| `totalSupply()` | uint256 | Total minted supply |
| `balanceOf(address)` | uint256 | Token balance |
| `owner()` | address | Current owner |
| `guardian()` | address | Current guardian (P12-01) |
| `paused()` | bool | Pause state |
| `energyPriceUsd()` | uint256 | Current energy price (1e6 scaled) |
| `exchangeRate()` | uint256 | Current LTC→LITB exchange rate (1e18 scaled) |
| `feeBps()` | uint256 | Current fee in BPS |
| `isDataFresh()` | bool | Oracle data freshness |
| `getLtcBalance()` | uint256 | Contract LTC balance |
| `getAutoRecoveryStatus()` | (bool,uint256) | Auto-recovery eligibility |
| `getBaselineUpdateStatus(address)` | (bool,uint256) | Baseline update eligibility |
| `getTwapEpochStatus()` | (uint256,uint256,uint256) | TWAP epoch info |
| `getTwapPrice()` | uint256 | Time-weighted average price |
| `getOracleCount()` | uint256 | Number of oracles |
| `getOracleList()` | address[] | All oracle addresses |
| `getGuardianStatus()` | (bool,address) | Guardian active status (P12-01) |
| `getProposal(uint256)` | (uint8,...,bool) | Proposal details (P12-01) |
| `proposalCount()` | uint256 | Total proposals created (P12-01) |
| `activeProposalCount()` | uint256 | Currently pending proposals (P12-01) |
