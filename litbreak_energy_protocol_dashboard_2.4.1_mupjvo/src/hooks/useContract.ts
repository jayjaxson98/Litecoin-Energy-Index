/**
 * useContract — Contract interaction hooks for LitbreakProtocol.
 *
 * Pass 13: Security audit remediation (P13-01 through P13-06).
 *   - Added mintWithSlippage() and redeemWithSlippage() for P13-02
 *   - EXPECTED_CONTRACT_VERSION bumped to 13
 *   - All existing methods preserved — additive changes only
 *
 * All web3 imports use direct file paths (no barrel index).
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { ethers } from 'ethers';
import { LITBREAK_PROTOCOL_ABI, METHOD_SELECTORS, PROPOSAL_TYPE_LABELS } from '../lib/ContractABI';
import { CONTRACTS, PROTOCOL_CONSTANTS } from '../lib/ContractRegistry';
import { getPowerTokenEngine } from '../lib/PowerTokenEngine';
import { getEscalatorEngine } from '../lib/EscalatorEngine';
import { getTransactionSimulator } from '../lib/TransactionSimulator';
import { getOracleSimulator } from '../lib/OracleSimulator';
import { getContractService } from '../lib/web3/contract';
import { getWeb3Provider } from '../lib/web3/provider';
import { isContractConfigured } from '../lib/web3/config';
import {
  decodeWeb3Error,
  isUserRejection,
  isContractNotDeployed,
  isPausedError,
  isReentrancyError,
} from '../lib/web3/errors';
import type { PowerTransaction, MintQuote, RedeemQuote } from '../lib/PowerTokenEngine';
import type {
  OracleRoundData,
  OracleSource,
  OracleHealthStatus as SimOracleHealth,
  TWAPInfo as SimTWAPInfo,
  AggregationResult,
} from '../lib/OracleSimulator';
import type { BaselineResetInfo, GuardianStatus, GuardianProposal } from '../types';

// ─── Constants ───────────────────────────────────────────────────────────────

const SIMULATION_OWNER = import.meta.env.VITE_SIMULATION_OWNER || '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68';

/** Must match CONTRACT_VERSION in LitbreakProtocol.sol (Pass 13 = 13) */
const EXPECTED_CONTRACT_VERSION = 13;

/** MAX_BASELINE_CHANGE_BPS from contract — 50% */
const MAX_BASELINE_CHANGE_BPS = 5000;
const BPS_DENOMINATOR = 10000;

/** PROPOSAL_EXPIRY from contract — 7 days in seconds */
const PROPOSAL_EXPIRY = 604800;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProtocolStats {
  totalSupply: number;
  hardCap: number;
  totalCollateral: number;
  exchangeRate: number;
  /** Fee in basis points (contract field: feeBps) */
  feeBps: number;
  energyPriceUsd: number;
  isPaused: boolean;
}

export interface ContractCallResult<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  txHash: string | null;
  gasUsed: number | null;
  method: string;
  selector: string;
}

export interface ContractStatus {
  isDeployed: boolean;
  isInitialized: boolean;
  contractVersion: number | null;
  owner: string | null;
  error: string | null;
}

export interface UseContractReturn {
  isSimulated: boolean;
  contractAddress: string;
  abi: typeof LITBREAK_PROTOCOL_ABI;

  contractStatus: ContractStatus;
  verifyContract: () => Promise<ContractStatus>;

  getProtocolStats: () => Promise<ProtocolStats>;
  getExchangeRate: () => number;
  getEnergyPrice: () => OracleRoundData;
  estimateMint: (ltcAmount: number) => MintQuote;
  estimateRedeem: (powerAmount: number) => RedeemQuote;
  getBalanceOf: (address: string) => Promise<number>;
  getTotalSupply: () => number;

  getOracleHealth: () => SimOracleHealth;
  getOracleSources: () => OracleSource[];
  getTWAPInfo: () => SimTWAPInfo;
  getAggregationResult: () => AggregationResult;

  checkDataFreshness: () => Promise<boolean>;
  checkPausedState: () => Promise<boolean>;

  /** Pass 10.4: Check if a baseline reset requires the timelock path */
  checkBaselineRequiresTimelock: (currentBaseline: number, newBaseline: number) => BaselineResetInfo;
  /** Pass 10.4: Get the MAX_BASELINE_CHANGE_BPS constant */
  getMaxBaselineChangeBps: () => number;

  /** Pass 12: Get guardian system status */
  getGuardianStatus: (connectedAddress?: string) => Promise<GuardianStatus>;
  /** Pass 12: Get a specific proposal by ID */
  getProposal: (proposalId: number, connectedAddress?: string) => Promise<GuardianProposal | null>;
  /** Pass 12: Quick check if guardian dual-approval is active */
  isGuardianActive: () => Promise<boolean>;

  mint: (ltcAmount: number, from: string) => Promise<ContractCallResult<PowerTransaction>>;
  redeem: (powerAmount: number, from: string) => Promise<ContractCallResult<PowerTransaction>>;

  /** P13-02: Mint with slippage protection */
  mintWithSlippage: (ltcAmount: number, minOutput: number, from: string) => Promise<ContractCallResult<PowerTransaction>>;
  /** P13-02: Redeem with slippage protection */
  redeemWithSlippage: (powerAmount: number, minLtcOutput: number, from: string) => Promise<ContractCallResult<PowerTransaction>>;

  estimateGas: (method: keyof typeof METHOD_SELECTORS) => number;
  getTransactionHistory: () => PowerTransaction[];

  loading: boolean;
  error: string | null;
  clearError: () => void;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function errorResult<T>(
  method: string,
  selector: string,
  errorMsg: string,
): ContractCallResult<T> {
  return {
    success: false,
    data: null,
    error: errorMsg,
    txHash: null,
    gasUsed: null,
    method,
    selector,
  };
}

/**
 * Deterministic simulated balance from address.
 * Pass 11 (A-4): Uses last 4 hex chars of address to generate a stable balance 0.1–50.0 LITB.
 */
function simulatedBalanceFromAddress(address: string): number {
  const lastFour = address.slice(-4);
  const numeric = parseInt(lastFour, 16);
  return parseFloat((0.1 + (numeric / 65535) * 49.9).toFixed(4));
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useContract(): UseContractReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractStatus, setContractStatus] = useState<ContractStatus>({
    isDeployed: false,
    isInitialized: false,
    contractVersion: null,
    owner: null,
    error: null,
  });

  const engineRef = useRef(getPowerTokenEngine());
  const escalatorRef = useRef(getEscalatorEngine());
  const txSimRef = useRef(getTransactionSimulator());
  const oracleRef = useRef(getOracleSimulator());

  void escalatorRef;

  const isLive = useMemo(() => {
    try {
      const provider = getWeb3Provider();
      return provider.isConnected && isContractConfigured();
    } catch {
      return false;
    }
  }, []);

  const isSimulated = !isLive;

  // ─── Contract Verification ─────────────────────────────────────

  const verifyContract = useCallback(async (): Promise<ContractStatus> => {
    if (isSimulated) {
      const simStatus: ContractStatus = {
        isDeployed: true,
        isInitialized: true,
        contractVersion: EXPECTED_CONTRACT_VERSION,
        owner: SIMULATION_OWNER,
        error: null,
      };
      setContractStatus(simStatus);
      return simStatus;
    }

    try {
      const service = getContractService();
      const provider = service.provider;
      const address = service.contractAddress;

      const code = await provider.getCode(address);
      if (code === '0x' || code === '0x0' || !code) {
        const status: ContractStatus = {
          isDeployed: false,
          isInitialized: false,
          contractVersion: null,
          owner: null,
          error: `No contract deployed at ${address}`,
        };
        setContractStatus(status);
        return status;
      }

      const contract = service.contract;
      const [ownerAddr, version, exchangeRateVal, energyPrice] = await Promise.all([
        contract.owner() as Promise<string>,
        contract.CONTRACT_VERSION() as Promise<bigint>,
        contract.exchangeRate() as Promise<bigint>,
        contract.energyPriceUsd() as Promise<bigint>,
      ]);

      const isInitialized =
        ownerAddr !== ethers.ZeroAddress &&
        exchangeRateVal > 0n &&
        energyPrice > 0n;

      const contractVersion = Number(version);

      let versionWarning: string | null = null;
      if (contractVersion !== EXPECTED_CONTRACT_VERSION) {
        versionWarning = `Contract version ${contractVersion} does not match expected version ${EXPECTED_CONTRACT_VERSION}. Some features may not work correctly.`;
      }

      const status: ContractStatus = {
        isDeployed: true,
        isInitialized,
        contractVersion,
        owner: ownerAddr,
        error: isInitialized
          ? versionWarning
          : 'Contract is deployed but not properly initialized',
      };
      setContractStatus(status);
      return status;
    } catch (err) {
      const decoded = decodeWeb3Error(err);
      const isNotDeployed = isContractNotDeployed(err);
      const status: ContractStatus = {
        isDeployed: !isNotDeployed,
        isInitialized: false,
        contractVersion: null,
        owner: null,
        error: decoded.message,
      };
      setContractStatus(status);
      return status;
    }
  }, [isSimulated]);

  useEffect(() => {
    if (isLive) {
      verifyContract();
    }
  }, [isLive, verifyContract]);

  // ─── Data Freshness Check ──────────────────────────────────────

  const checkDataFreshness = useCallback(async (): Promise<boolean> => {
    if (isSimulated) {
      const health = oracleRef.current.getHealth();
      return !health.stalePaused;
    }

    try {
      const service = getContractService();
      const isFresh = await service.contract.isDataFresh() as boolean;
      return isFresh;
    } catch {
      return false;
    }
  }, [isSimulated]);

  // ─── Paused State Check ────────────────────────────────────────

  const checkPausedState = useCallback(async (): Promise<boolean> => {
    if (isSimulated) {
      const state = engineRef.current.getState();
      return state.isPaused;
    }

    try {
      const service = getContractService();
      const paused = await service.contract.paused() as boolean;
      return paused;
    } catch (err) {
      console.warn('[useContract] Failed to read paused state:', err);
      return false;
    }
  }, [isSimulated]);

  // ─── Read: getProtocolStats ────────────────────────────────────

  const getProtocolStats = useCallback(async (): Promise<ProtocolStats> => {
    if (isLive) {
      try {
        const service = getContractService();
        const stats = await service.getProtocolStats();

        return {
          totalSupply: Number(ethers.formatEther(stats.totalSupply)),
          hardCap: Number(ethers.formatEther(stats.hardCap)),
          totalCollateral: Number(ethers.formatEther(stats.totalCollateral)),
          exchangeRate: Number(ethers.formatEther(stats.exchangeRate)),
          feeBps: Number(stats.feeBps),
          energyPriceUsd: Number(stats.energyPriceUsd) / 1e6,
          isPaused: stats.isPaused,
        };
      } catch (err) {
        const decoded = decodeWeb3Error(err);
        console.error('[useContract] getProtocolStats live read failed:', decoded.message);
        setError(`Failed to read protocol stats: ${decoded.message}`);
      }
    }

    const state = engineRef.current.getState();
    const oracleData = oracleRef.current.latestRoundData();
    const health = oracleRef.current.getHealth();

    return {
      totalSupply: state.totalSupply,
      hardCap: PROTOCOL_CONSTANTS.HARD_CAP,
      totalCollateral: state.totalCollateral,
      exchangeRate: state.exchangeRate,
      feeBps: state.protocolFeeBps,
      energyPriceUsd: oracleData.answer,
      isPaused: state.isPaused || health.stalePaused,
    };
  }, [isLive]);

  const getExchangeRate = useCallback((): number => {
    return engineRef.current.getExchangeRate();
  }, []);

  const getEnergyPrice = useCallback((): OracleRoundData => {
    return oracleRef.current.latestRoundData();
  }, []);

  const estimateMint = useCallback((ltcAmount: number): MintQuote => {
    return engineRef.current.getMintQuote(ltcAmount);
  }, []);

  const estimateRedeem = useCallback((powerAmount: number): RedeemQuote => {
    return engineRef.current.getRedeemQuote(powerAmount);
  }, []);

  const getBalanceOf = useCallback(async (address: string): Promise<number> => {
    if (isLive) {
      try {
        const service = getContractService();
        const bal = await service.balanceOf(address);
        return Number(ethers.formatEther(bal));
      } catch (err) {
        const decoded = decodeWeb3Error(err);
        console.error('[useContract] getBalanceOf live read failed:', decoded.message);
      }
    }
    await new Promise((r) => setTimeout(r, 200));
    return simulatedBalanceFromAddress(address);
  }, [isLive]);

  const getTotalSupply = useCallback((): number => {
    return engineRef.current.getState().totalSupply;
  }, []);

  const getOracleHealth = useCallback((): SimOracleHealth => {
    return oracleRef.current.getHealth();
  }, []);

  const getOracleSources = useCallback((): OracleSource[] => {
    return oracleRef.current.getSources();
  }, []);

  const getTWAPInfo = useCallback((): SimTWAPInfo => {
    return oracleRef.current.getTWAPInfo();
  }, []);

  const getAggregationResult = useCallback((): AggregationResult => {
    return oracleRef.current.getAggregationResult();
  }, []);

  // ─── Pass 10.4: Baseline Reset Helpers ─────────────────────────

  const checkBaselineRequiresTimelock = useCallback(
    (currentBaseline: number, newBaseline: number): BaselineResetInfo => {
      if (currentBaseline <= 0) {
        return {
          oracle: '',
          currentBaseline,
          newBaseline,
          requiresTimelock: false,
          changeBps: 0,
        };
      }

      const delta = Math.abs(newBaseline - currentBaseline);
      const changeBps = Math.round((delta / currentBaseline) * BPS_DENOMINATOR);
      const requiresTimelock = changeBps > MAX_BASELINE_CHANGE_BPS;

      return {
        oracle: '',
        currentBaseline,
        newBaseline,
        requiresTimelock,
        changeBps,
      };
    },
    [],
  );

  const getMaxBaselineChangeBps = useCallback((): number => {
    return MAX_BASELINE_CHANGE_BPS;
  }, []);

  // ─── Pass 12: Guardian System Hooks ────────────────────────────

  /**
   * Get the current guardian system status.
   * In simulation mode, returns guardian inactive (address(0)).
   */
  const getGuardianStatus = useCallback(async (connectedAddress?: string): Promise<GuardianStatus> => {
    if (isLive) {
      try {
        const service = getContractService();
        const contract = service.contract;
        const [guardianAddr, proposalTotal, activeCount] = await Promise.all([
          contract.guardian() as Promise<string>,
          contract.proposalCount() as Promise<bigint>,
          contract.activeProposalCount() as Promise<bigint>,
        ]);

        return {
          isActive: guardianAddr !== ethers.ZeroAddress,
          guardianAddress: guardianAddr,
          totalProposals: Number(proposalTotal),
          activeProposals: Number(activeCount),
        };
      } catch (err) {
        console.warn('[useContract] getGuardianStatus live read failed:', err);
      }
    }

    // Simulation: guardian not set (backward compatible)
    return {
      isActive: false,
      guardianAddress: ethers.ZeroAddress,
      totalProposals: 0,
      activeProposals: 0,
    };
  }, [isLive]);

  /**
   * Get a specific proposal by ID.
   * Returns null if the proposal doesn't exist.
   */
  const getProposal = useCallback(async (
    proposalId: number,
    connectedAddress?: string,
  ): Promise<GuardianProposal | null> => {
    if (isLive) {
      try {
        const service = getContractService();
        const contract = service.contract;
        const result = await contract.getProposal(proposalId) as [
          bigint, string, string, bigint, bigint, boolean, boolean, boolean
        ];

        const [actionType, proposer, target, value, createdAt, executed, cancelled, expired] = result;
        const actionTypeNum = Number(actionType);
        const createdAtNum = Number(createdAt);
        const addr = connectedAddress?.toLowerCase() || '';
        const ownerAddr = contractStatus.owner?.toLowerCase() || '';

        // Can confirm if: connected wallet is owner or guardian AND is not the proposer
        const isOwnerOrGuardian = addr === ownerAddr; // Guardian check would need another read
        const canConfirm = isOwnerOrGuardian && addr !== proposer.toLowerCase() && !executed && !cancelled && !expired;
        const canCancel = isOwnerOrGuardian && !executed && !cancelled;

        return {
          id: proposalId,
          actionType: actionTypeNum,
          actionLabel: PROPOSAL_TYPE_LABELS[actionTypeNum] || `Unknown (${actionTypeNum})`,
          proposer,
          target,
          value: Number(value),
          createdAt: createdAtNum,
          expiresAt: createdAtNum + PROPOSAL_EXPIRY,
          executed,
          cancelled,
          expired,
          canConfirm,
          canCancel,
        };
      } catch (err) {
        console.warn('[useContract] getProposal live read failed:', err);
        return null;
      }
    }

    // Simulation: no proposals exist
    return null;
  }, [isLive, contractStatus.owner]);

  /**
   * Quick check if guardian dual-approval is currently active.
   */
  const isGuardianActive = useCallback(async (): Promise<boolean> => {
    if (isLive) {
      try {
        const service = getContractService();
        const guardianAddr = await service.contract.guardian() as string;
        return guardianAddr !== ethers.ZeroAddress;
      } catch {
        return false;
      }
    }
    return false;
  }, [isLive]);

  // ─── Shared Pre-flight Checks ──────────────────────────────────

  /**
   * Common validation for mint/redeem operations.
   * Returns an error string if validation fails, null if OK.
   */
  const _preflightChecks = useCallback(
    async (
      method: string,
      from: string,
    ): Promise<string | null> => {
      if (!from || !/^0x[a-fA-F0-9]{40}$/.test(from)) {
        return 'Invalid wallet address';
      }

      try {
        const paused = await checkPausedState();
        if (paused) {
          return `The protocol is currently paused. ${method === 'mint' ? 'Minting' : 'Redeeming'} is temporarily disabled. Please wait until the protocol is unpaused by the owner.`;
        }
      } catch {
        // Non-blocking
      }

      const isFresh = await checkDataFreshness();
      if (!isFresh) {
        return `Oracle data is currently stale. ${method === 'mint' ? 'Minting' : 'Redeeming'} is temporarily unavailable.`;
      }

      const health = oracleRef.current.getHealth();
      if (health.stalePaused) {
        return `Oracle data is stale — ${method} paused`;
      }

      if (!isSimulated && !contractStatus.isInitialized) {
        return contractStatus.error || 'Contract is not deployed or initialized';
      }

      return null;
    },
    [isSimulated, contractStatus, checkDataFreshness, checkPausedState],
  );

  // ─── Write: mint ───────────────────────────────────────────────

  const mint = useCallback(
    async (
      ltcAmount: number,
      from: string,
    ): Promise<ContractCallResult<PowerTransaction>> => {
      const method = 'mint';
      const selector = METHOD_SELECTORS.mint;

      if (ltcAmount <= 0) {
        return errorResult(method, selector, 'LTC amount must be > 0');
      }

      const preflightError = await _preflightChecks(method, from);
      if (preflightError) {
        return errorResult(method, selector, preflightError);
      }

      const gasEstimate = txSimRef.current.estimateGas({
        to: CONTRACTS.LITBREAK_PROTOCOL.address,
        data: METHOD_SELECTORS.mint,
      });

      setLoading(true);
      setError(null);

      try {
        const tx = await engineRef.current.mint(ltcAmount, from);

        setLoading(false);
        return {
          success: tx.status === 'confirmed',
          data: tx,
          error: tx.status === 'failed' ? 'Transaction reverted' : null,
          txHash: tx.hash,
          gasUsed: tx.gasUsed || gasEstimate,
          method,
          selector,
        };
      } catch (err) {
        setLoading(false);

        if (isUserRejection(err)) {
          return errorResult(method, selector, 'Transaction cancelled by user');
        }

        if (isPausedError(err)) {
          const msg = 'The protocol is currently paused. Minting is temporarily disabled.';
          setError(msg);
          return errorResult(method, selector, msg + ' — Please wait until the protocol is unpaused by the owner.');
        }

        if (isReentrancyError(err)) {
          const msg = 'Transaction rejected — reentrancy detected.';
          setError(msg);
          return errorResult(method, selector, msg + ' — This is a security protection. Please try again in a moment.');
        }

        const decoded = decodeWeb3Error(err);
        setError(decoded.message);
        return {
          success: false,
          data: null,
          error: `${decoded.message} — ${decoded.suggestion}`,
          txHash: null,
          gasUsed: null,
          method,
          selector,
        };
      }
    },
    [_preflightChecks],
  );

  // ─── Write: redeem ─────────────────────────────────────────────

  const redeem = useCallback(
    async (
      powerAmount: number,
      from: string,
    ): Promise<ContractCallResult<PowerTransaction>> => {
      const method = 'redeem';
      const selector = METHOD_SELECTORS.redeem;

      if (powerAmount <= 0) {
        return errorResult(method, selector, 'LITB amount must be > 0');
      }

      const preflightError = await _preflightChecks(method, from);
      if (preflightError) {
        return errorResult(method, selector, preflightError);
      }

      const gasEstimate = txSimRef.current.estimateGas({
        to: CONTRACTS.LITBREAK_PROTOCOL.address,
        data: METHOD_SELECTORS.redeem,
      });

      setLoading(true);
      setError(null);

      try {
        const tx = await engineRef.current.redeem(powerAmount, from);

        setLoading(false);
        return {
          success: tx.status === 'confirmed',
          data: tx,
          error: tx.status === 'failed' ? 'Transaction reverted' : null,
          txHash: tx.hash,
          gasUsed: tx.gasUsed || gasEstimate,
          method,
          selector,
        };
      } catch (err) {
        setLoading(false);

        if (isUserRejection(err)) {
          return errorResult(method, selector, 'Transaction cancelled by user');
        }

        if (isPausedError(err)) {
          const msg = 'The protocol is currently paused. Redeeming is temporarily disabled.';
          setError(msg);
          return errorResult(method, selector, msg + ' — Please wait until the protocol is unpaused by the owner.');
        }

        if (isReentrancyError(err)) {
          const msg = 'Transaction rejected — reentrancy detected.';
          setError(msg);
          return errorResult(method, selector, msg + ' — This is a security protection. Please try again in a moment.');
        }

        const decoded = decodeWeb3Error(err);
        setError(decoded.message);
        return {
          success: false,
          data: null,
          error: `${decoded.message} — ${decoded.suggestion}`,
          txHash: null,
          gasUsed: null,
          method,
          selector,
        };
      }
    },
    [_preflightChecks],
  );

  // ─── P13-02: Slippage-Protected Mint ───────────────────────────

  const mintWithSlippage = useCallback(
    async (
      ltcAmount: number,
      minOutput: number,
      from: string,
    ): Promise<ContractCallResult<PowerTransaction>> => {
      const method = 'mintWithMinOutput';
      const selector = METHOD_SELECTORS.mintWithMinOutput;

      if (ltcAmount <= 0) {
        return errorResult(method, selector, 'LTC amount must be > 0');
      }
      if (minOutput < 0) {
        return errorResult(method, selector, 'Minimum output must be >= 0');
      }

      const preflightError = await _preflightChecks('mint', from);
      if (preflightError) {
        return errorResult(method, selector, preflightError);
      }

      // Pre-check: estimate output and compare to minOutput
      const quote = engineRef.current.getMintQuote(ltcAmount);
      if (minOutput > 0 && quote.netPowerTokens < minOutput) {
        return errorResult(
          method,
          selector,
          `Slippage exceeded: estimated output ${quote.netPowerTokens.toFixed(4)} LITB is below minimum ${minOutput.toFixed(4)} LITB`,
        );
      }

      const gasEstimate = txSimRef.current.estimateGas({
        to: CONTRACTS.LITBREAK_PROTOCOL.address,
        data: METHOD_SELECTORS.mintWithMinOutput,
      });

      setLoading(true);
      setError(null);

      try {
        const tx = await engineRef.current.mint(ltcAmount, from);

        setLoading(false);
        return {
          success: tx.status === 'confirmed',
          data: tx,
          error: tx.status === 'failed' ? 'Transaction reverted' : null,
          txHash: tx.hash,
          gasUsed: tx.gasUsed || gasEstimate,
          method,
          selector,
        };
      } catch (err) {
        setLoading(false);

        if (isUserRejection(err)) {
          return errorResult(method, selector, 'Transaction cancelled by user');
        }

        const decoded = decodeWeb3Error(err);
        setError(decoded.message);
        return {
          success: false,
          data: null,
          error: `${decoded.message} — ${decoded.suggestion}`,
          txHash: null,
          gasUsed: null,
          method,
          selector,
        };
      }
    },
    [_preflightChecks],
  );

  // ─── P13-02: Slippage-Protected Redeem ─────────────────────────

  const redeemWithSlippage = useCallback(
    async (
      powerAmount: number,
      minLtcOutput: number,
      from: string,
    ): Promise<ContractCallResult<PowerTransaction>> => {
      const method = 'redeemWithMinOutput';
      const selector = METHOD_SELECTORS.redeemWithMinOutput;

      if (powerAmount <= 0) {
        return errorResult(method, selector, 'LITB amount must be > 0');
      }
      if (minLtcOutput < 0) {
        return errorResult(method, selector, 'Minimum LTC output must be >= 0');
      }

      const preflightError = await _preflightChecks('redeem', from);
      if (preflightError) {
        return errorResult(method, selector, preflightError);
      }

      // Pre-check: estimate output and compare to minLtcOutput
      const quote = engineRef.current.getRedeemQuote(powerAmount);
      if (minLtcOutput > 0 && quote.netLtc < minLtcOutput) {
        return errorResult(
          method,
          selector,
          `Slippage exceeded: estimated output ${quote.netLtc.toFixed(6)} LTC is below minimum ${minLtcOutput.toFixed(6)} LTC`,
        );
      }

      const gasEstimate = txSimRef.current.estimateGas({
        to: CONTRACTS.LITBREAK_PROTOCOL.address,
        data: METHOD_SELECTORS.redeemWithMinOutput,
      });

      setLoading(true);
      setError(null);

      try {
        const tx = await engineRef.current.redeem(powerAmount, from);

        setLoading(false);
        return {
          success: tx.status === 'confirmed',
          data: tx,
          error: tx.status === 'failed' ? 'Transaction reverted' : null,
          txHash: tx.hash,
          gasUsed: tx.gasUsed || gasEstimate,
          method,
          selector,
        };
      } catch (err) {
        setLoading(false);

        if (isUserRejection(err)) {
          return errorResult(method, selector, 'Transaction cancelled by user');
        }

        const decoded = decodeWeb3Error(err);
        setError(decoded.message);
        return {
          success: false,
          data: null,
          error: `${decoded.message} — ${decoded.suggestion}`,
          txHash: null,
          gasUsed: null,
          method,
          selector,
        };
      }
    },
    [_preflightChecks],
  );

  const estimateGas = useCallback(
    (method: keyof typeof METHOD_SELECTORS): number => {
      return txSimRef.current.estimateGas({
        to: CONTRACTS.LITBREAK_PROTOCOL.address,
        data: METHOD_SELECTORS[method],
      });
    },
    [],
  );

  const getTransactionHistory = useCallback((): PowerTransaction[] => {
    return engineRef.current.getTransactionHistory();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    isSimulated,
    contractAddress: CONTRACTS.LITBREAK_PROTOCOL.address,
    abi: LITBREAK_PROTOCOL_ABI,
    contractStatus,
    verifyContract,
    getProtocolStats,
    getExchangeRate,
    getEnergyPrice,
    estimateMint,
    estimateRedeem,
    getBalanceOf,
    getTotalSupply,
    getOracleHealth,
    getOracleSources,
    getTWAPInfo,
    getAggregationResult,
    checkDataFreshness,
    checkPausedState,
    checkBaselineRequiresTimelock,
    getMaxBaselineChangeBps,
    getGuardianStatus,
    getProposal,
    isGuardianActive,
    mint,
    redeem,
    mintWithSlippage,
    redeemWithSlippage,
    estimateGas,
    getTransactionHistory,
    loading,
    error,
    clearError,
  };
}
