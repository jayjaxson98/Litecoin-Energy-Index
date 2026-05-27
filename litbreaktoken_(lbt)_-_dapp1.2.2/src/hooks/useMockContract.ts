import { create } from 'zustand';
import { getLtcApiPrice, useLtcPrice } from './useLtcPrice';

/* ─────────────────────── Types ─────────────────────── */

export interface OracleData {
  ltcPrice: number;
  geiIndex: number;
  lastUpdate: number;
  status: 'active' | 'stale' | 'error';
  gasPrice: number;
  blockHeight: number;
  usingFallback: boolean;
  fallbackReason: string;
  stalenessThreshold: number;
  lastGoodPrice: number;
  primaryHealth: 'healthy' | 'stale' | 'error' | 'deviation';
  fallbackHealth: 'healthy' | 'stale' | 'error' | 'standby';
  /** true when oracle price is sourced from API rather than on-chain oracle */
  usingApiPrice: boolean;
}

export interface EmissionsData {
  circulatingSupply: number;
  totalMinted: number;
  totalBurned: number;
  dailyMinted: number;
  dailyBurned: number;
  backingRatio: number;
}

export interface StakingData {
  stakedAmount: number;
  pendingRewards: number;
  lockEnd: number;
  apr: number;
  tier: 'None' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
}

export interface Transaction {
  id: string;
  type: 'mint' | 'redeem' | 'stake' | 'unstake' | 'claim';
  amount: number;
  outputAmount: number;
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
  hash: string;
}

interface ContractState {
  /* Wallet */
  isConnected: boolean;
  address: string;
  network: string;
  chainId: number;

  /* Balances */
  wltcBalance: number;
  lbtBalance: number;

  /* Oracle */
  gei: number;
  oracleData: OracleData;

  /* Emissions */
  emissions: EmissionsData;

  /* Staking */
  staking: StakingData;

  /* Protocol */
  totalSupply: number;
  totalStaked: number;
  backingRatio: number;
  wltcReserves: number;

  /* Transactions */
  transactions: Transaction[];
  pendingTx: boolean;

  /* Actions */
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  mint: (wltcAmount: number) => Promise<Transaction>;
  redeem: (lbtAmount: number) => Promise<Transaction>;
  stake: (amount: number) => Promise<Transaction>;
  unstake: (amount: number) => Promise<Transaction>;
  claimRewards: () => Promise<Transaction>;
}

/* ─────────────────────── Helpers ─────────────────────── */

const randomHash = () =>
  '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

const randomAddress = () =>
  '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

const getTier = (staked: number): StakingData['tier'] => {
  if (staked >= 100000) return 'Diamond';
  if (staked >= 50000) return 'Gold';
  if (staked >= 10000) return 'Silver';
  if (staked >= 1000) return 'Bronze';
  return 'None';
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ─────────────────────── Store ─────────────────────── */

export const useMockContract = create<ContractState>((set, get) => {
  /* ── Oracle simulation interval ── */
  let oracleInterval: ReturnType<typeof setInterval> | null = null;

  const startOracleSimulation = () => {
    if (oracleInterval) return;

    let staleTicks = 0;

    oracleInterval = setInterval(() => {
      const state = get();
      const currentGei = state.gei;

      // ── Price source: always sync with API price from useLtcPrice ──
      // This ensures Dashboard and LtcKwhCalculator show the same LTC price.
      // The API price is the single source of truth; the oracle simulation
      // only adds small noise on top of it to simulate on-chain oracle jitter.
      const { price: apiPrice, isApiPrice } = getLtcApiPrice();

      let newPrice: number;
      let usingApiPriceFallback = false;

      if (apiPrice !== null) {
        // API price available — use it as the base, add tiny oracle jitter (±0.05%)
        // This keeps the oracle price nearly identical to the API price
        // while still simulating realistic on-chain oracle behavior
        const jitter = apiPrice * (Math.random() * 0.001 - 0.0005);
        newPrice = apiPrice + jitter;
        usingApiPriceFallback = !isApiPrice; // true if API itself fell back to simulation
      } else {
        // No API price yet (still loading) — use existing oracle price with random walk
        const currentPrice = state.oracleData.ltcPrice;
        const priceChange = currentPrice * (Math.random() * 0.01 - 0.005);
        newPrice = Math.max(10, currentPrice + priceChange);
        usingApiPriceFallback = true;
      }

      // GEI drift: ±0.1%
      const geiChange = currentGei * (Math.random() * 0.002 - 0.001);
      const newGei = Math.max(0.5, Math.min(2.0, currentGei + geiChange));

      // Gas price simulation (8-80 Gwei range)
      const gasChange = (Math.random() - 0.5) * 4;
      const newGasPrice = Math.max(8, Math.min(80, state.oracleData.gasPrice + gasChange));

      // Block height increments 1-2 per tick
      const newBlockHeight = state.oracleData.blockHeight + Math.floor(Math.random() * 2) + 1;

      // ── Primary oracle health simulation ──
      let primaryHealth: OracleData['primaryHealth'] = 'healthy';
      let usingFallback = false;
      let fallbackReason = '';
      let fallbackHealth: OracleData['fallbackHealth'] = 'standby';

      if (staleTicks > 0) {
        staleTicks--;
        if (staleTicks > 0) {
          primaryHealth = 'stale';
          usingFallback = true;
          fallbackReason = 'Primary oracle data stale (>5 min)';
          fallbackHealth = 'healthy';
        } else {
          primaryHealth = 'healthy';
          usingFallback = false;
          fallbackReason = '';
          fallbackHealth = 'standby';
        }
      } else {
        if (Math.random() < 0.05) {
          staleTicks = Math.floor(Math.random() * 3) + 2;
          primaryHealth = 'stale';
          usingFallback = true;
          fallbackReason = 'Primary oracle data stale (>5 min)';
          fallbackHealth = 'healthy';
        }
      }

      // If primary oracle is stale/error AND we have API price, note the API fallback
      if (usingFallback && apiPrice !== null) {
        fallbackReason = 'Primary oracle stale — using API price fallback';
      }

      // Reward accrual for staking
      let newRewards = state.staking.pendingRewards;
      if (state.staking.stakedAmount > 0) {
        const rewardPerSecond = (state.staking.stakedAmount * state.staking.apr) / 100 / 365 / 24 / 3600;
        newRewards += rewardPerSecond * 3; // 3-second interval
      }

      // Update backing ratio
      const newBackingRatio = state.totalSupply > 0
        ? (state.wltcReserves * newPrice) / state.totalSupply
        : 1.0;

      // Emissions drift: small random changes to daily figures
      const prevEmissions = state.emissions;
      const dailyMintedDrift = prevEmissions.dailyMinted * (1 + (Math.random() * 0.004 - 0.002));
      const dailyBurnedDrift = prevEmissions.dailyBurned * (1 + (Math.random() * 0.004 - 0.002));

      set({
        gei: newGei,
        oracleData: {
          ltcPrice: newPrice,
          geiIndex: newGei,
          lastUpdate: Date.now(),
          status: usingFallback ? 'stale' : 'active',
          gasPrice: parseFloat(newGasPrice.toFixed(1)),
          blockHeight: newBlockHeight,
          usingFallback,
          fallbackReason,
          stalenessThreshold: 300,
          lastGoodPrice: newPrice,
          primaryHealth,
          fallbackHealth,
          usingApiPrice: usingApiPriceFallback || (apiPrice !== null),
        },
        backingRatio: newBackingRatio,
        emissions: {
          circulatingSupply: state.totalSupply - state.totalStaked,
          totalMinted: prevEmissions.totalMinted,
          totalBurned: prevEmissions.totalBurned,
          dailyMinted: parseFloat(dailyMintedDrift.toFixed(2)),
          dailyBurned: parseFloat(dailyBurnedDrift.toFixed(2)),
          backingRatio: newBackingRatio,
        },
        staking: {
          ...state.staking,
          pendingRewards: newRewards,
        },
      });
    }, 3000);
  };

  // Start simulation immediately
  startOracleSimulation();

  // ── Subscribe to useLtcPrice changes to immediately sync price ──
  // When the API fetches a new price, update the oracle price right away
  // instead of waiting for the next 3s tick.
  // useLtcPrice is already imported statically at the top — no dynamic import needed.
  useLtcPrice.subscribe((ltcState) => {
    if (ltcState.currentPrice !== null) {
      const state = get();
      const jitter = ltcState.currentPrice * (Math.random() * 0.001 - 0.0005);
      const syncedPrice = ltcState.currentPrice + jitter;

      // Only update price-related fields to avoid overwriting ongoing state changes
      set({
        oracleData: {
          ...state.oracleData,
          ltcPrice: syncedPrice,
          lastGoodPrice: syncedPrice,
          lastUpdate: Date.now(),
          usingApiPrice: true,
        },
      });
    }
  });

  return {
    /* ── Initial state ── */
    isConnected: false,
    address: '',
    network: 'LitVM Testnet',
    chainId: 1001,

    wltcBalance: 0,
    lbtBalance: 0,

    gei: 1.0,
    oracleData: {
      ltcPrice: 87.42,
      geiIndex: 1.0,
      lastUpdate: Date.now(),
      status: 'active',
      gasPrice: 24.3,
      blockHeight: 19847562,
      usingFallback: false,
      fallbackReason: '',
      stalenessThreshold: 300,
      lastGoodPrice: 87.42,
      primaryHealth: 'healthy',
      fallbackHealth: 'standby',
      usingApiPrice: false,
    },

    emissions: {
      circulatingSupply: 791_622,
      totalMinted: 1_523_400,
      totalBurned: 275_568,
      dailyMinted: 12_450,
      dailyBurned: 8_320,
      backingRatio: 1.02,
    },

    staking: {
      stakedAmount: 0,
      pendingRewards: 0,
      lockEnd: 0,
      apr: 12.5,
      tier: 'None',
    },

    totalSupply: 1_247_832,
    totalStaked: 456_210,
    backingRatio: 1.02,
    wltcReserves: 14_250,

    transactions: [],
    pendingTx: false,

    /* ── Actions ── */

    connectWallet: async () => {
      set({ pendingTx: true });
      await delay(1200);
      const addr = randomAddress();
      set({
        isConnected: true,
        address: addr,
        wltcBalance: 25.5,
        lbtBalance: 2150.75,
        pendingTx: false,
        staking: {
          stakedAmount: 5000,
          pendingRewards: 12.34,
          lockEnd: Date.now() + 15 * 24 * 3600 * 1000,
          apr: 12.5,
          tier: 'Silver',
        },
      });
    },

    disconnectWallet: () => {
      set({
        isConnected: false,
        address: '',
        wltcBalance: 0,
        lbtBalance: 0,
        staking: { stakedAmount: 0, pendingRewards: 0, lockEnd: 0, apr: 12.5, tier: 'None' },
        transactions: [],
      });
    },

    mint: async (wltcAmount: number) => {
      set({ pendingTx: true });
      await delay(2000);

      const state = get();
      const lbtOut = wltcAmount * state.oracleData.ltcPrice * state.gei;

      const tx: Transaction = {
        id: randomHash().slice(0, 18),
        type: 'mint',
        amount: wltcAmount,
        outputAmount: lbtOut,
        timestamp: Date.now(),
        status: 'confirmed',
        hash: randomHash(),
      };

      const newTotalSupply = state.totalSupply + lbtOut;
      const newWltcReserves = state.wltcReserves + wltcAmount;

      set({
        wltcBalance: state.wltcBalance - wltcAmount,
        lbtBalance: state.lbtBalance + lbtOut,
        totalSupply: newTotalSupply,
        wltcReserves: newWltcReserves,
        emissions: {
          ...state.emissions,
          totalMinted: state.emissions.totalMinted + lbtOut,
          circulatingSupply: newTotalSupply - state.totalStaked,
        },
        transactions: [tx, ...state.transactions].slice(0, 50),
        pendingTx: false,
      });

      return tx;
    },

    redeem: async (lbtAmount: number) => {
      set({ pendingTx: true });
      await delay(2000);

      const state = get();
      const wltcOut = lbtAmount / (state.oracleData.ltcPrice * state.gei) * 0.997;

      const tx: Transaction = {
        id: randomHash().slice(0, 18),
        type: 'redeem',
        amount: lbtAmount,
        outputAmount: wltcOut,
        timestamp: Date.now(),
        status: 'confirmed',
        hash: randomHash(),
      };

      const newTotalSupply = state.totalSupply - lbtAmount;
      const newWltcReserves = state.wltcReserves - wltcOut;

      set({
        lbtBalance: state.lbtBalance - lbtAmount,
        wltcBalance: state.wltcBalance + wltcOut,
        totalSupply: newTotalSupply,
        wltcReserves: newWltcReserves,
        emissions: {
          ...state.emissions,
          totalBurned: state.emissions.totalBurned + lbtAmount,
          circulatingSupply: newTotalSupply - state.totalStaked,
        },
        transactions: [tx, ...state.transactions].slice(0, 50),
        pendingTx: false,
      });

      return tx;
    },

    stake: async (amount: number) => {
      set({ pendingTx: true });
      await delay(1500);

      const state = get();
      const newStaked = state.staking.stakedAmount + amount;
      const newTotalStaked = state.totalStaked + amount;

      const tx: Transaction = {
        id: randomHash().slice(0, 18),
        type: 'stake',
        amount,
        outputAmount: amount,
        timestamp: Date.now(),
        status: 'confirmed',
        hash: randomHash(),
      };

      set({
        lbtBalance: state.lbtBalance - amount,
        totalStaked: newTotalStaked,
        staking: {
          ...state.staking,
          stakedAmount: newStaked,
          lockEnd: Date.now() + 30 * 24 * 3600 * 1000,
          tier: getTier(newStaked),
        },
        emissions: {
          ...state.emissions,
          circulatingSupply: state.totalSupply - newTotalStaked,
        },
        transactions: [tx, ...state.transactions].slice(0, 50),
        pendingTx: false,
      });

      return tx;
    },

    unstake: async (amount: number) => {
      set({ pendingTx: true });
      await delay(1500);

      const state = get();
      const newStaked = state.staking.stakedAmount - amount;
      const newTotalStaked = state.totalStaked - amount;

      const tx: Transaction = {
        id: randomHash().slice(0, 18),
        type: 'unstake',
        amount,
        outputAmount: amount,
        timestamp: Date.now(),
        status: 'confirmed',
        hash: randomHash(),
      };

      set({
        lbtBalance: state.lbtBalance + amount,
        totalStaked: newTotalStaked,
        staking: {
          ...state.staking,
          stakedAmount: newStaked,
          tier: getTier(newStaked),
        },
        emissions: {
          ...state.emissions,
          circulatingSupply: state.totalSupply - newTotalStaked,
        },
        transactions: [tx, ...state.transactions].slice(0, 50),
        pendingTx: false,
      });

      return tx;
    },

    claimRewards: async () => {
      set({ pendingTx: true });
      await delay(1500);

      const state = get();
      const rewards = state.staking.pendingRewards;

      const tx: Transaction = {
        id: randomHash().slice(0, 18),
        type: 'claim',
        amount: rewards,
        outputAmount: rewards,
        timestamp: Date.now(),
        status: 'confirmed',
        hash: randomHash(),
      };

      const newTotalSupply = state.totalSupply + rewards;

      set({
        lbtBalance: state.lbtBalance + rewards,
        totalSupply: newTotalSupply,
        staking: { ...state.staking, pendingRewards: 0 },
        emissions: {
          ...state.emissions,
          totalMinted: state.emissions.totalMinted + rewards,
          circulatingSupply: newTotalSupply - state.totalStaked,
        },
        transactions: [tx, ...state.transactions].slice(0, 50),
        pendingTx: false,
      });

      return tx;
    },
  };
});
