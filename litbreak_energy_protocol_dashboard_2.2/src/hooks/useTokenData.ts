import { useState, useCallback, useEffect, useRef } from 'react';
import type { TokenInfo, TokenBalance } from '@/types/token';
import { getPowerTokenEngine, type PowerTransaction, type MintQuote, type RedeemQuote } from '@/lib/PowerTokenEngine';
import { getEscalatorEngine, type EscalatorState, type ReleaseRecord, type ProjectedRelease } from '@/lib/EscalatorEngine';
import { getTransactionSimulator } from '@/lib/TransactionSimulator';
import { getOracleSimulator, type OracleRoundData } from '@/lib/OracleSimulator';
import { CONTRACTS, PROTOCOL_CONSTANTS, shortenAddress } from '@/lib/ContractRegistry';

// ─── Known Tokens ────────────────────────────────────────────────────────────

const KNOWN_TOKENS: TokenInfo[] = [
  {
    address: CONTRACTS.POWER_TOKEN.address,
    symbol: 'POWER',
    name: 'POWER Token',
    decimals: 18,
    logoUrl: undefined,
    chainId: 421611,
  },
  {
    address: CONTRACTS.WLTC.address,
    symbol: 'wLTC',
    name: 'Wrapped Litecoin',
    decimals: 18,
    logoUrl: undefined,
    chainId: 421611,
  },
];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ContractCallResult<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  txHash: string | null;
  gasUsed: number | null;
}

export interface MintParams {
  ltcAmount: number;
  userAddress: string;
  slippageBps?: number;
}

export interface RedeemParams {
  powerAmount: number;
  userAddress: string;
  slippageBps?: number;
}

export interface UseTokenDataReturn {
  // Token registry
  tokens: TokenInfo[];
  customTokens: TokenInfo[];
  loading: boolean;
  error: string | null;

  // Token lookup & management
  lookupToken: (address: string) => Promise<TokenInfo | null>;
  addCustomToken: (token: TokenInfo) => void;
  removeCustomToken: (address: string) => void;
  getTokenBalances: () => Promise<TokenBalance[]>;

  // ─── Contract Interactions (CRITICAL) ────────────────────────────────────

  // Mint POWER tokens by depositing LTC
  mint: (params: MintParams) => Promise<ContractCallResult<PowerTransaction>>;

  // Redeem POWER tokens for LTC
  redeem: (params: RedeemParams) => Promise<ContractCallResult<PowerTransaction>>;

  // Get mint quote (read-only, no gas)
  getMintQuote: (ltcAmount: number) => MintQuote;

  // Get redeem quote (read-only, no gas)
  getRedeemQuote: (powerAmount: number) => RedeemQuote;

  // Release scheduled tokens (escalator system)
  releaseTokens: () => Promise<ContractCallResult<ReleaseRecord[]>>;

  // Get projected future releases
  getProjectedReleases: (monthsAhead: number) => ProjectedRelease[];

  // Get escalator engine state
  getEscalatorState: () => EscalatorState;

  // Get current oracle data
  getOracleData: () => OracleRoundData;

  // Get exchange rate
  getExchangeRate: () => number;

  // Get protocol fee (basis points)
  getProtocolFeeBps: () => number;

  // Get transaction history
  getTransactionHistory: () => PowerTransaction[];

  // Protocol constants
  protocolConstants: typeof PROTOCOL_CONSTANTS;

  // Transaction state
  pendingTx: PowerTransaction | null;
  txHistory: PowerTransaction[];
}

// ─── Hook Implementation ─────────────────────────────────────────────────────

export function useTokenData(): UseTokenDataReturn {
  const [customTokens, setCustomTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTx, setPendingTx] = useState<PowerTransaction | null>(null);
  const [txHistory, setTxHistory] = useState<PowerTransaction[]>([]);

  // Engine refs (singletons, stable across renders)
  const powerEngine = useRef(getPowerTokenEngine());
  const escalatorEngine = useRef(getEscalatorEngine());
  const txSimulator = useRef(getTransactionSimulator());
  const oracle = useRef(getOracleSimulator());

  const allTokens = [...KNOWN_TOKENS, ...customTokens];

  // ─── Sync transaction history from engine ────────────────────────────────
  useEffect(() => {
    const unsub = powerEngine.current.onChange(() => {
      setTxHistory(powerEngine.current.getTransactionHistory());
    });
    // Initial load
    setTxHistory(powerEngine.current.getTransactionHistory());
    return unsub;
  }, []);

  // ─── Token Lookup ────────────────────────────────────────────────────────

  const lookupToken = useCallback(async (address: string): Promise<TokenInfo | null> => {
    setLoading(true);
    setError(null);

    try {
      // Simulate network lookup delay
      await new Promise(resolve => setTimeout(resolve, 600));

      // Check known tokens
      const known = KNOWN_TOKENS.find(
        t => t.address.toLowerCase() === address.toLowerCase()
      );
      if (known) { setLoading(false); return known; }

      // Check custom tokens
      const custom = customTokens.find(
        t => t.address.toLowerCase() === address.toLowerCase()
      );
      if (custom) { setLoading(false); return custom; }

      // Validate address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        setError('Invalid token address format');
        setLoading(false);
        return null;
      }

      // Simulate ERC-20 contract call: name(), symbol(), decimals()
      await new Promise(resolve => setTimeout(resolve, 400));

      const mockToken: TokenInfo = {
        address,
        symbol: 'UNK',
        name: `Unknown Token (${shortenAddress(address)})`,
        decimals: 18,
        chainId: 421611,
      };

      setLoading(false);
      return mockToken;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Token lookup failed';
      setError(msg);
      setLoading(false);
      return null;
    }
  }, [customTokens]);

  // ─── Custom Token Management ─────────────────────────────────────────────

  const addCustomToken = useCallback((token: TokenInfo) => {
    setCustomTokens(prev => {
      if (prev.some(t => t.address.toLowerCase() === token.address.toLowerCase())) return prev;
      return [...prev, token];
    });
  }, []);

  const removeCustomToken = useCallback((address: string) => {
    setCustomTokens(prev =>
      prev.filter(t => t.address.toLowerCase() !== address.toLowerCase())
    );
  }, []);

  // ─── Token Balances ──────────────────────────────────────────────────────

  const getTokenBalances = useCallback(async (): Promise<TokenBalance[]> => {
    // Simulate multicall to get balances for all tokens
    await new Promise(resolve => setTimeout(resolve, 300));

    const powerState = powerEngine.current.getState();
    const escalatorState = escalatorEngine.current.getState();

    return allTokens.map(token => {
      if (token.symbol === 'POWER') {
        const balance = escalatorState.totalSupply * 0.15; // User holds ~15% of supply
        const priceUsd = 0.95 + (Math.random() - 0.5) * 0.1;
        return {
          token,
          balance,
          balanceUsd: balance * priceUsd,
          priceUsd,
          change24h: (Math.random() - 0.5) * 8,
        };
      }
      if (token.symbol === 'wLTC') {
        const balance = powerState.totalCollateral * 0.08;
        const priceUsd = 95 + (Math.random() - 0.5) * 10;
        return {
          token,
          balance,
          balanceUsd: balance * priceUsd,
          priceUsd,
          change24h: (Math.random() - 0.5) * 6,
        };
      }
      return {
        token,
        balance: 0,
        balanceUsd: 0,
        priceUsd: 0,
        change24h: 0,
      };
    });
  }, [allTokens]);

  // ═════════════════════════════════════════════════════════════════════════
  //  CONTRACT INTERACTIONS — CRITICAL IMPLEMENTATIONS
  // ═════════════════════════════════════════════════════════════════════════

  const mint = useCallback(async (params: MintParams): Promise<ContractCallResult<PowerTransaction>> => {
    const { ltcAmount, userAddress, slippageBps = 100 } = params;

    if (!userAddress || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return { success: false, data: null, error: 'Invalid wallet address', txHash: null, gasUsed: null };
    }
    if (ltcAmount <= 0) {
      return { success: false, data: null, error: 'LTC amount must be greater than 0', txHash: null, gasUsed: null };
    }
    if (ltcAmount > 10000) {
      return { success: false, data: null, error: 'Amount exceeds maximum single mint (10,000 LTC)', txHash: null, gasUsed: null };
    }

    const quote = powerEngine.current.getMintQuote(ltcAmount);
    if (quote.powerAmount <= 0) {
      return { success: false, data: null, error: 'Mint amount too small after fees', txHash: null, gasUsed: null };
    }

    const escalatorState = escalatorEngine.current.getState();
    if (escalatorState.totalSupply >= PROTOCOL_CONSTANTS.HARD_CAP) {
      return { success: false, data: null, error: 'Hard cap reached — no more POWER can be minted', txHash: null, gasUsed: null };
    }

    const minOutput = quote.powerAmount * (1 - slippageBps / 10000);
    if (quote.powerAmount < minOutput) {
      return { success: false, data: null, error: `Slippage exceeded: expected ${minOutput.toFixed(2)} POWER minimum`, txHash: null, gasUsed: null };
    }

    const estimatedGas = txSimulator.current.estimateGas({
      to: CONTRACTS.LITBREAK_PROTOCOL.address,
      data: `0x1249c58b`,
    });

    setLoading(true);
    setError(null);

    try {
      const tx = await powerEngine.current.mint(ltcAmount, userAddress);
      setPendingTx(tx);

      if (tx.status === 'confirmed') {
        setPendingTx(null);
        setLoading(false);
        return {
          success: true,
          data: tx,
          error: null,
          txHash: tx.hash,
          gasUsed: tx.gasUsed || estimatedGas,
        };
      } else {
        setPendingTx(null);
        setLoading(false);
        return {
          success: false,
          data: tx,
          error: 'Transaction reverted — check gas and try again',
          txHash: tx.hash,
          gasUsed: tx.gasUsed || estimatedGas,
        };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mint transaction failed';
      setError(msg);
      setPendingTx(null);
      setLoading(false);
      return { success: false, data: null, error: msg, txHash: null, gasUsed: null };
    }
  }, []);

  const redeem = useCallback(async (params: RedeemParams): Promise<ContractCallResult<PowerTransaction>> => {
    const { powerAmount, userAddress, slippageBps = 100 } = params;

    if (!userAddress || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return { success: false, data: null, error: 'Invalid wallet address', txHash: null, gasUsed: null };
    }
    if (powerAmount <= 0) {
      return { success: false, data: null, error: 'POWER amount must be greater than 0', txHash: null, gasUsed: null };
    }

    const quote = powerEngine.current.getRedeemQuote(powerAmount);
    if (quote.netLtc <= 0) {
      return { success: false, data: null, error: 'Redeem amount too small after fees', txHash: null, gasUsed: null };
    }

    const state = powerEngine.current.getState();
    if (quote.netLtc > state.totalCollateral) {
      return { success: false, data: null, error: 'Insufficient protocol collateral for this redemption', txHash: null, gasUsed: null };
    }

    const minOutput = quote.netLtc * (1 - slippageBps / 10000);
    if (quote.netLtc < minOutput) {
      return { success: false, data: null, error: `Slippage exceeded: expected ${minOutput.toFixed(6)} LTC minimum`, txHash: null, gasUsed: null };
    }

    const estimatedGas = txSimulator.current.estimateGas({
      to: CONTRACTS.LITBREAK_PROTOCOL.address,
      data: `0xdb006a75`,
    });

    setLoading(true);
    setError(null);

    try {
      const tx = await powerEngine.current.redeem(powerAmount, userAddress);
      setPendingTx(tx);

      if (tx.status === 'confirmed') {
        setPendingTx(null);
        setLoading(false);
        return {
          success: true,
          data: tx,
          error: null,
          txHash: tx.hash,
          gasUsed: tx.gasUsed || estimatedGas,
        };
      } else {
        setPendingTx(null);
        setLoading(false);
        return {
          success: false,
          data: tx,
          error: 'Transaction reverted — insufficient balance or collateral',
          txHash: tx.hash,
          gasUsed: tx.gasUsed || estimatedGas,
        };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Redeem transaction failed';
      setError(msg);
      setPendingTx(null);
      setLoading(false);
      return { success: false, data: null, error: msg, txHash: null, gasUsed: null };
    }
  }, []);

  const getMintQuote = useCallback((ltcAmount: number): MintQuote => {
    return powerEngine.current.getMintQuote(ltcAmount);
  }, []);

  const getRedeemQuote = useCallback((powerAmount: number): RedeemQuote => {
    return powerEngine.current.getRedeemQuote(powerAmount);
  }, []);

  const releaseTokens = useCallback(async (): Promise<ContractCallResult<ReleaseRecord[]>> => {
    setLoading(true);
    setError(null);

    try {
      const records = await escalatorEngine.current.releaseTokens();

      setLoading(false);
      return {
        success: true,
        data: records,
        error: null,
        txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        gasUsed: 120_000 + records.length * 45_000,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Release failed';
      setError(msg);
      setLoading(false);
      return { success: false, data: null, error: msg, txHash: null, gasUsed: null };
    }
  }, []);

  const getProjectedReleases = useCallback((monthsAhead: number): ProjectedRelease[] => {
    return escalatorEngine.current.getProjectedReleases(monthsAhead);
  }, []);

  const getEscalatorState = useCallback((): EscalatorState => {
    return escalatorEngine.current.getState();
  }, []);

  const getOracleData = useCallback((): OracleRoundData => {
    return oracle.current.latestRoundData();
  }, []);

  const getExchangeRate = useCallback((): number => {
    return powerEngine.current.getExchangeRate();
  }, []);

  const getProtocolFeeBps = useCallback((): number => {
    return powerEngine.current.getProtocolFeeBps();
  }, []);

  const getTransactionHistory = useCallback((): PowerTransaction[] => {
    return powerEngine.current.getTransactionHistory();
  }, []);

  return {
    tokens: allTokens,
    customTokens,
    loading,
    error,
    lookupToken,
    addCustomToken,
    removeCustomToken,
    getTokenBalances,
    mint,
    redeem,
    getMintQuote,
    getRedeemQuote,
    releaseTokens,
    getProjectedReleases,
    getEscalatorState,
    getOracleData,
    getExchangeRate,
    getProtocolFeeBps,
    getTransactionHistory,
    protocolConstants: PROTOCOL_CONSTANTS,
    pendingTx,
    txHistory,
  };
}
