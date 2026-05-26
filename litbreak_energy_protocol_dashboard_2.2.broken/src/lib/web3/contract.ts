/**
 * contract.ts — Typed service wrappers for audited LitBreakProtocol.sol
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VERSION 3.0.0 — SWC-114 Fix (FIX-15)
 *
 * CHANGES vs v2.0.0:
 *
 *   [SVC-01] ADDED: refreshOracleCache()
 *     Calls contract.refreshOracleCache() — the ONLY function that writes
 *     oracle price state. Returns { success, price, hash, receipt, error }.
 *     Callable by owner or designated keeper.
 *     Invalidates oracle-related cache entries on success.
 *
 *   [SVC-02] ADDED: setOracleKeeper(address)
 *     Calls contract.setOracleKeeper(keeper) — owner-only.
 *     Sets the minimal-privilege keeper address for oracle cache refresh.
 *     Pass address(0) to disable keeper role.
 *
 *   [SVC-03] ADDED: getOracleKeeper()
 *     Calls contract.oracleKeeper() — returns current keeper address.
 *     Cached with 60s TTL (keeper changes are infrequent).
 *
 *   [SVC-04] ADDED: isOracleCacheFresh()
 *     Calls contract.isOracleCacheFresh() — returns bool.
 *     UI should display a warning when false (oracle pricing inactive).
 *     Cached with 5s TTL.
 *
 *   [SVC-05] ADDED: OracleCacheRefreshResult interface
 *     Return type for refreshOracleCache() — extends TransactionResult
 *     with success (bool) and price (bigint) fields from the contract return.
 *
 * PRESERVED FROM v2.0.0:
 *   All methods from AUDIT-01 and AUDIT-02
 *   assertNotPaused(), _validateAddress()
 *   All cache TTL values
 *   ProtocolStats, OracleState, OraclePriceCache interfaces
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { ethers } from 'ethers';
import { LITBREAK_PROTOCOL_ABI } from '../ContractABI';
import { web3Config } from './config';
import { getWeb3Provider } from './provider';
import { getRpcCache } from './cache';
import { decodeWeb3Error, type DecodedError } from './errors';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProtocolStats {
  totalSupply: bigint;
  kwhPerLtc: bigint;
  ltcPerKwh: bigint;
  energyIndexTimestamp: bigint;
  mintPricePerKwh: bigint;
  redeemRatePerToken: bigint;
  isPaused: boolean;
  isStale: boolean;
  contractEthBalance: bigint;
}

export interface EnergyIndex {
  kwhPerLtc: bigint;
  ltcPerKwh: bigint;
  timestamp: bigint;
}

export interface MintEstimate {
  tokenAmount: bigint;
  ethRequired: bigint;
}

export interface RedeemEstimate {
  ethValue: bigint;
}

export interface AirdropStatus {
  claimed: boolean;
  allocation: bigint;
}

export interface TransactionResult {
  hash: string;
  receipt: ethers.TransactionReceipt | null;
  error: DecodedError | null;
}

export interface OracleState {
  enabled: boolean;
  oracles: string[];
  count: bigint;
}

export interface OraclePriceCache {
  price: bigint;
  timestamp: bigint;
}

/**
 * [SVC-05] Return type for refreshOracleCache().
 * Extends TransactionResult with the contract's return values.
 *
 * success — true if the oracle median was computed and cached on-chain
 * price   — the new cached price in litoshi-per-kWh (0n if success == false)
 *
 * Note: error == null does NOT imply success == true.
 * The transaction can succeed (no revert) but return success=false if
 * the oracle circuit breaker tripped (insufficient valid feeds, etc.).
 */
export interface OracleCacheRefreshResult extends TransactionResult {
  /** Whether the oracle cache was successfully updated on-chain */
  success: boolean;
  /** New cached price in litoshi-per-kWh (0n if success == false) */
  price: bigint;
}

// ─── Contract Service ─────────────────────────────────────────────────────────

class ContractService {
  private _contractAddress: string;

  constructor() {
    this._contractAddress = ContractService._validateAddress(
      web3Config.activeNetwork.contractAddress,
      'web3Config.activeNetwork.contractAddress'
    );
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private static _validateAddress(address: string, source: string): string {
    if (!address || typeof address !== 'string' || address.trim() === '') {
      throw new Error(
        `[ContractService] Invalid contract address from ${source}: ` +
        `received empty or non-string value "${address}". ` +
        `Set a valid 0x-prefixed Ethereum address in your .env file.`
      );
    }
    if (!ethers.isAddress(address)) {
      throw new Error(
        `[ContractService] Invalid contract address from ${source}: ` +
        `"${address}" is not a valid Ethereum address. ` +
        `Expected a 0x-prefixed 40-character hex string.`
      );
    }
    return ethers.getAddress(address);
  }

  /**
   * [MEDIUM] Pre-flight pause guard for all write operations.
   * Queries contract.paused() DIRECTLY (no cache) for live on-chain state.
   */
  private async assertNotPaused(): Promise<void> {
    const contract = this.getReadContract();
    const paused = await contract.paused() as boolean;
    if (paused) {
      throw new Error('LitbreakProtocol: paused');
    }
  }

  // ─── Contract Instances ──────────────────────────────────────────────────

  getReadContract(): ethers.Contract {
    const provider = getWeb3Provider().getReadProvider();
    return new ethers.Contract(this._contractAddress, LITBREAK_PROTOCOL_ABI, provider);
  }

  getWriteContract(): ethers.Contract {
    const signer = getWeb3Provider().getSigner();
    if (!signer) {
      throw new Error('Wallet not connected. Please connect your wallet to execute transactions.');
    }
    return new ethers.Contract(this._contractAddress, LITBREAK_PROTOCOL_ABI, signer);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // READ METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  async getProtocolStats(): Promise<ProtocolStats> {
    const cache = getRpcCache();
    return cache.getOrFetch('protocolStats', async () => {
      try {
        const contract = this.getReadContract();
        const provider = getWeb3Provider().getReadProvider();

        const [
          totalSupply,
          energyIndex,
          mintPricePerKwh,
          redeemRatePerToken,
          isPaused,
          isStale,
          contractEthBalance,
        ] = await Promise.all([
          contract.totalSupply()                     as Promise<bigint>,
          contract.getEnergyIndex()                  as Promise<[bigint, bigint, bigint]>,
          contract.mintPricePerKwh()                 as Promise<bigint>,
          contract.redeemRatePerToken()              as Promise<bigint>,
          contract.paused()                          as Promise<boolean>,
          contract.isEnergyIndexStale()              as Promise<boolean>,
          provider.getBalance(this._contractAddress) as Promise<bigint>,
        ]);

        return {
          totalSupply,
          kwhPerLtc:            energyIndex[0],
          ltcPerKwh:            energyIndex[1],
          energyIndexTimestamp: energyIndex[2],
          mintPricePerKwh,
          redeemRatePerToken,
          isPaused,
          isStale,
          contractEthBalance,
        };
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    }, 10_000);
  }

  async getEnergyIndex(): Promise<EnergyIndex> {
    const cache = getRpcCache();
    return cache.getOrFetch('energyIndex', async () => {
      try {
        const contract = this.getReadContract();
        const result = await contract.getEnergyIndex() as [bigint, bigint, bigint];
        return {
          kwhPerLtc: result[0],
          ltcPerKwh: result[1],
          timestamp: result[2],
        };
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    }, 15_000);
  }

  async balanceOf(address: string): Promise<bigint> {
    const cache = getRpcCache();
    return cache.getOrFetch(`balance:${address}`, async () => {
      try {
        const contract = this.getReadContract();
        return await contract.balanceOf(address) as bigint;
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    }, 5_000);
  }

  async totalSupply(): Promise<bigint> {
    const cache = getRpcCache();
    return cache.getOrFetch('totalSupply', async () => {
      try {
        const contract = this.getReadContract();
        return await contract.totalSupply() as bigint;
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    });
  }

  async mintPricePerKwh(): Promise<bigint> {
    const cache = getRpcCache();
    return cache.getOrFetch('mintPricePerKwh', async () => {
      try {
        const contract = this.getReadContract();
        return await contract.mintPricePerKwh() as bigint;
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    });
  }

  async redeemRatePerToken(): Promise<bigint> {
    const cache = getRpcCache();
    return cache.getOrFetch('redeemRatePerToken', async () => {
      try {
        const contract = this.getReadContract();
        return await contract.redeemRatePerToken() as bigint;
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    });
  }

  async estimateMint(kwhAmountWei: bigint): Promise<MintEstimate> {
    try {
      const contract = this.getReadContract();
      const ethRequired = await contract.getMintPrice(kwhAmountWei) as bigint;
      return { tokenAmount: kwhAmountWei, ethRequired };
    } catch (error) {
      throw decodeWeb3Error(error);
    }
  }

  async estimateRedeem(tokenAmountWei: bigint): Promise<RedeemEstimate> {
    try {
      const contract = this.getReadContract();
      const ethValue = await contract.getRedeemValue(tokenAmountWei) as bigint;
      return { ethValue };
    } catch (error) {
      throw decodeWeb3Error(error);
    }
  }

  async isEnergyIndexStale(): Promise<boolean> {
    const cache = getRpcCache();
    return cache.getOrFetch('isEnergyIndexStale', async () => {
      try {
        const contract = this.getReadContract();
        return await contract.isEnergyIndexStale() as boolean;
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    }, 5_000);
  }

  async isPaused(): Promise<boolean> {
    const cache = getRpcCache();
    return cache.getOrFetch('paused', async () => {
      try {
        const contract = this.getReadContract();
        return await contract.paused() as boolean;
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    }, 5_000);
  }

  async owner(): Promise<string> {
    const cache = getRpcCache();
    return cache.getOrFetch('owner', async () => {
      try {
        const contract = this.getReadContract();
        return await contract.owner() as string;
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    }, 60_000);
  }

  async getAirdropStatus(address: string): Promise<AirdropStatus> {
    const cache = getRpcCache();
    return cache.getOrFetch(`airdrop:${address}`, async () => {
      try {
        const contract = this.getReadContract();
        const [claimed, allocation] = await Promise.all([
          contract.airdropClaimed(address) as Promise<boolean>,
          contract.airdropAmount(address)  as Promise<bigint>,
        ]);
        return { claimed, allocation };
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    }, 10_000);
  }

  async allowance(owner: string, spender: string): Promise<bigint> {
    try {
      const contract = this.getReadContract();
      return await contract.allowance(owner, spender) as bigint;
    } catch (error) {
      throw decodeWeb3Error(error);
    }
  }

  async merkleRoot(): Promise<string> {
    const cache = getRpcCache();
    return cache.getOrFetch('merkleRoot', async () => {
      try {
        const contract = this.getReadContract();
        return await contract.merkleRoot() as string;
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    }, 30_000);
  }

  // ── Oracle Read Methods (AUDIT-01) ────────────────────────────────────────

  async getOracleEnabled(): Promise<boolean> {
    const cache = getRpcCache();
    return cache.getOrFetch('priceOracleEnabled', async () => {
      try {
        const contract = this.getReadContract();
        return await contract.priceOracleEnabled() as boolean;
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    }, 15_000);
  }

  async getOracleState(): Promise<OracleState> {
    const cache = getRpcCache();
    return cache.getOrFetch('oracleState', async () => {
      try {
        const contract = this.getReadContract();
        const [enabled, oracles, count] = await Promise.all([
          contract.priceOracleEnabled() as Promise<boolean>,
          contract.getOracles()         as Promise<string[]>,
          contract.oracleCount()        as Promise<bigint>,
        ]);
        return { enabled, oracles, count };
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    }, 15_000);
  }

  async getOracles(): Promise<string[]> {
    const cache = getRpcCache();
    return cache.getOrFetch('oracles', async () => {
      try {
        const contract = this.getReadContract();
        return await contract.getOracles() as string[];
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    }, 15_000);
  }

  async getOracleCount(): Promise<bigint> {
    const cache = getRpcCache();
    return cache.getOrFetch('oracleCount', async () => {
      try {
        const contract = this.getReadContract();
        return await contract.oracleCount() as bigint;
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    }, 15_000);
  }

  async getLastValidOraclePrice(): Promise<OraclePriceCache> {
    const cache = getRpcCache();
    return cache.getOrFetch('lastValidOraclePrice', async () => {
      try {
        const contract = this.getReadContract();
        const result = await contract.getLastValidOraclePrice() as [bigint, bigint];
        return { price: result[0], timestamp: result[1] };
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    }, 10_000);
  }

  /**
   * [SVC-04] Check whether the oracle price cache is fresh enough to be used by mint().
   * Maps to: isOracleCacheFresh() → bool
   *
   * Returns true if:
   *   • _lastValidOraclePrice > 0 (refreshOracleCache() has been called at least once)
   *   • block.timestamp - _lastValidOraclePriceTime <= MAX_CACHE_AGE (2 hours)
   *
   * When false, mint() uses manual mintPricePerKwh. The UI should display a
   * warning prompting the keeper to call refreshOracleCache().
   *
   * [FIX-15] SWC-114: This view reflects the state written by refreshOracleCache().
   * It does NOT trigger any oracle calls.
   */
  async isOracleCacheFresh(): Promise<boolean> {
    const cache = getRpcCache();
    return cache.getOrFetch('isOracleCacheFresh', async () => {
      try {
        const contract = this.getReadContract();
        return await contract.isOracleCacheFresh() as boolean;
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    }, 5_000); // 5s TTL — freshness changes as time passes
  }

  /**
   * [SVC-03] Get the current oracle keeper address.
   * Maps to: oracleKeeper() → address
   *
   * Returns address(0) if no keeper is set (owner-only refresh mode).
   * Cached with 60s TTL — keeper changes are infrequent admin operations.
   */
  async getOracleKeeper(): Promise<string> {
    const cache = getRpcCache();
    return cache.getOrFetch('oracleKeeper', async () => {
      try {
        const contract = this.getReadContract();
        return await contract.oracleKeeper() as string;
      } catch (error) {
        throw decodeWeb3Error(error);
      }
    }, 60_000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  async mint(kwhAmountWei: bigint, ethValueWei: bigint): Promise<TransactionResult> {
    try {
      await this.assertNotPaused();
      const contract = this.getWriteContract();
      const gasEstimate = await contract.mint.estimateGas(kwhAmountWei, { value: ethValueWei });
      const gasLimit = (gasEstimate * 120n) / 100n;
      const tx = await contract.mint(kwhAmountWei, { value: ethValueWei, gasLimit });
      const receipt = await tx.wait();
      getRpcCache().invalidateAll();
      return { hash: tx.hash, receipt, error: null };
    } catch (err) {
      return { hash: '', receipt: null, error: decodeWeb3Error(err) };
    }
  }

  async redeem(tokenAmountWei: bigint): Promise<TransactionResult> {
    try {
      await this.assertNotPaused();
      const contract = this.getWriteContract();
      const gasEstimate = await contract.redeem.estimateGas(tokenAmountWei);
      const gasLimit = (gasEstimate * 120n) / 100n;
      const tx = await contract.redeem(tokenAmountWei, { gasLimit });
      const receipt = await tx.wait();
      getRpcCache().invalidateAll();
      return { hash: tx.hash, receipt, error: null };
    } catch (err) {
      return { hash: '', receipt: null, error: decodeWeb3Error(err) };
    }
  }

  async claimAirdrop(proof: string[]): Promise<TransactionResult> {
    try {
      await this.assertNotPaused();
      const contract = this.getWriteContract();
      const gasEstimate = await contract.claimAirdrop.estimateGas(proof);
      const gasLimit = (gasEstimate * 120n) / 100n;
      const tx = await contract.claimAirdrop(proof, { gasLimit });
      const receipt = await tx.wait();
      getRpcCache().invalidateAll();
      return { hash: tx.hash, receipt, error: null };
    } catch (err) {
      return { hash: '', receipt: null, error: decodeWeb3Error(err) };
    }
  }

  async approve(spender: string, amountWei: bigint): Promise<TransactionResult> {
    try {
      await this.assertNotPaused();
      const contract = this.getWriteContract();
      const gasEstimate = await contract.approve.estimateGas(spender, amountWei);
      const gasLimit = (gasEstimate * 120n) / 100n;
      const tx = await contract.approve(spender, amountWei, { gasLimit });
      const receipt = await tx.wait();
      getRpcCache().invalidateAll();
      return { hash: tx.hash, receipt, error: null };
    } catch (err) {
      return { hash: '', receipt: null, error: decodeWeb3Error(err) };
    }
  }

  async transfer(to: string, amountWei: bigint): Promise<TransactionResult> {
    try {
      await this.assertNotPaused();
      const contract = this.getWriteContract();
      const gasEstimate = await contract.transfer.estimateGas(to, amountWei);
      const gasLimit = (gasEstimate * 120n) / 100n;
      const tx = await contract.transfer(to, amountWei, { gasLimit });
      const receipt = await tx.wait();
      getRpcCache().invalidateAll();
      return { hash: tx.hash, receipt, error: null };
    } catch (err) {
      return { hash: '', receipt: null, error: decodeWeb3Error(err) };
    }
  }

  async increaseAllowance(spender: string, addedValueWei: bigint): Promise<TransactionResult> {
    try {
      await this.assertNotPaused();
      const contract = this.getWriteContract();
      const gasEstimate = await contract.increaseAllowance.estimateGas(spender, addedValueWei);
      const gasLimit = (gasEstimate * 120n) / 100n;
      const tx = await contract.increaseAllowance(spender, addedValueWei, { gasLimit });
      const receipt = await tx.wait();
      getRpcCache().invalidateAll();
      return { hash: tx.hash, receipt, error: null };
    } catch (err) {
      return { hash: '', receipt: null, error: decodeWeb3Error(err) };
    }
  }

  // ── Oracle Admin Write Methods (AUDIT-02) ─────────────────────────────────

  async addOracle(oracle: string): Promise<TransactionResult> {
    try {
      await this.assertNotPaused();
      const contract = this.getWriteContract();
      const gasEstimate = await contract.addOracle.estimateGas(oracle);
      const gasLimit = (gasEstimate * 120n) / 100n;
      const tx = await contract.addOracle(oracle, { gasLimit });
      const receipt = await tx.wait();
      getRpcCache().invalidate('oracleState');
      getRpcCache().invalidate('oracles');
      getRpcCache().invalidate('oracleCount');
      return { hash: tx.hash, receipt, error: null };
    } catch (err) {
      return { hash: '', receipt: null, error: decodeWeb3Error(err) };
    }
  }

  async removeOracle(oracle: string): Promise<TransactionResult> {
    try {
      await this.assertNotPaused();
      const contract = this.getWriteContract();
      const gasEstimate = await contract.removeOracle.estimateGas(oracle);
      const gasLimit = (gasEstimate * 120n) / 100n;
      const tx = await contract.removeOracle(oracle, { gasLimit });
      const receipt = await tx.wait();
      getRpcCache().invalidate('oracleState');
      getRpcCache().invalidate('oracles');
      getRpcCache().invalidate('oracleCount');
      return { hash: tx.hash, receipt, error: null };
    } catch (err) {
      return { hash: '', receipt: null, error: decodeWeb3Error(err) };
    }
  }

  async setOracleEnabled(enabled: boolean): Promise<TransactionResult> {
    try {
      await this.assertNotPaused();
      const contract = this.getWriteContract();
      const gasEstimate = await contract.setOracleEnabled.estimateGas(enabled);
      const gasLimit = (gasEstimate * 120n) / 100n;
      const tx = await contract.setOracleEnabled(enabled, { gasLimit });
      const receipt = await tx.wait();
      getRpcCache().invalidate('oracleState');
      getRpcCache().invalidate('priceOracleEnabled');
      return { hash: tx.hash, receipt, error: null };
    } catch (err) {
      return { hash: '', receipt: null, error: decodeWeb3Error(err) };
    }
  }

  // ── [SVC-01] refreshOracleCache() — SWC-114 fix ───────────────────────────

  /**
   * Refresh the oracle price cache on-chain.
   * Maps to: refreshOracleCache() → (bool success, uint256 price)
   *
   * [FIX-15] SWC-114: This is the ONLY function that writes oracle price state.
   * It should be called by the keeper bot at least once per MAX_CACHE_AGE (2h).
   * Recommended interval: every 1 hour (MAX_CACHE_AGE / 2).
   *
   * The transaction will NOT revert if oracle feeds are unavailable — it returns
   * (false, 0) instead. Check result.success to determine if the cache was updated.
   *
   * Access: owner or designated oracleKeeper
   * Reverts with NotKeeper() if caller is neither.
   *
   * Cache invalidation:
   *   Always invalidates lastValidOraclePrice, isOracleCacheFresh, oracleState.
   *   Also invalidates protocolStats (which includes oracle-derived pricing info).
   *
   * @returns OracleCacheRefreshResult with success, price, hash, receipt, error
   */
  async refreshOracleCache(): Promise<OracleCacheRefreshResult> {
    try {
      await this.assertNotPaused();

      const contract = this.getWriteContract();
      const gasEstimate = await contract.refreshOracleCache.estimateGas();
      const gasLimit = (gasEstimate * 120n) / 100n;

      const tx = await contract.refreshOracleCache({ gasLimit });
      const receipt = await tx.wait();

      // Decode the return values from the transaction receipt.
      // refreshOracleCache() returns (bool success, uint256 price).
      // We use the contract interface to decode the return data from the receipt.
      let onChainSuccess = false;
      let onChainPrice   = 0n;

      if (receipt && receipt.logs) {
        // Parse return value from the transaction trace if available.
        // Fallback: check for OraclePriceCacheUpdated event in logs.
        // If the event is present, success = true and price = event.price.
        const iface = contract.interface;
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
            if (parsed && parsed.name === 'OraclePriceCacheUpdated') {
              onChainSuccess = true;
              onChainPrice   = parsed.args[0] as bigint; // price
              break;
            }
          } catch {
            // Not a matching log — continue
          }
        }
      }

      // Invalidate all oracle-related cache entries.
      // Even if success == false, the on-chain state may have changed
      // (e.g., circuit breaker event was emitted).
      getRpcCache().invalidate('lastValidOraclePrice');
      getRpcCache().invalidate('isOracleCacheFresh');
      getRpcCache().invalidate('oracleState');
      getRpcCache().invalidate('protocolStats');

      return {
        hash:    tx.hash,
        receipt,
        error:   null,
        success: onChainSuccess,
        price:   onChainPrice,
      };
    } catch (err) {
      return {
        hash:    '',
        receipt: null,
        error:   decodeWeb3Error(err),
        success: false,
        price:   0n,
      };
    }
  }

  // ── [SVC-02] setOracleKeeper() — SWC-114 fix ─────────────────────────────

  /**
   * Set the oracle keeper address.
   * Maps to: setOracleKeeper(address keeper) — onlyOwner
   *
   * [FIX-15] SWC-114: The keeper is a minimal-privilege role that may ONLY
   * call refreshOracleCache(). It cannot call any other admin function.
   *
   * Pass ethers.ZeroAddress (address(0)) to disable the keeper role,
   * reverting to owner-only oracle cache refresh.
   *
   * Emits KeeperUpdated(previousKeeper, newKeeper) on-chain.
   *
   * @param keeper New keeper address, or ethers.ZeroAddress to disable
   */
  async setOracleKeeper(keeper: string): Promise<TransactionResult> {
    try {
      await this.assertNotPaused();

      const contract = this.getWriteContract();
      const gasEstimate = await contract.setOracleKeeper.estimateGas(keeper);
      const gasLimit = (gasEstimate * 120n) / 100n;

      const tx = await contract.setOracleKeeper(keeper, { gasLimit });
      const receipt = await tx.wait();

      // Invalidate keeper cache — the keeper address has changed.
      getRpcCache().invalidate('oracleKeeper');
      return { hash: tx.hash, receipt, error: null };
    } catch (err) {
      return { hash: '', receipt: null, error: decodeWeb3Error(err) };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GAS ESTIMATION
  // ═══════════════════════════════════════════════════════════════════════════

  async estimateMintGas(kwhAmountWei: bigint, ethValueWei: bigint): Promise<bigint> {
    try {
      const contract = this.getWriteContract();
      return await contract.mint.estimateGas(kwhAmountWei, { value: ethValueWei });
    } catch {
      return 150_000n;
    }
  }

  async estimateRedeemGas(tokenAmountWei: bigint): Promise<bigint> {
    try {
      const contract = this.getWriteContract();
      return await contract.redeem.estimateGas(tokenAmountWei);
    } catch {
      return 120_000n;
    }
  }

  /**
   * Estimate gas for refreshOracleCache().
   * Returns a safe fallback (200,000) if estimation fails.
   * The actual gas cost depends on the number of registered oracles
   * and the complexity of the median computation.
   */
  async estimateRefreshOracleCacheGas(): Promise<bigint> {
    try {
      const contract = this.getWriteContract();
      return await contract.refreshOracleCache.estimateGas();
    } catch {
      // Conservative fallback: 5 oracles × ~30k gas each + overhead
      return 200_000n;
    }
  }

  async getGasPrice(): Promise<bigint> {
    try {
      const provider = getWeb3Provider().getReadProvider();
      const feeData = await provider.getFeeData();
      return feeData.gasPrice ?? 1_000_000_000n;
    } catch {
      return 1_000_000_000n;
    }
  }

  async estimateTransactionCost(gasUnits: bigint): Promise<bigint> {
    const gasPrice = await this.getGasPrice();
    return gasUnits * gasPrice;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════════════════════

  get address(): string {
    return this._contractAddress;
  }

  setAddress(address: string): void {
    this._contractAddress = ContractService._validateAddress(address, 'setAddress');
    getRpcCache().invalidateAll();
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let instance: ContractService | null = null;

export function getContractService(): ContractService {
  if (!instance) {
    instance = new ContractService();
  }
  return instance;
}

export { ContractService };
