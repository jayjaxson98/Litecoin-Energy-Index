import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { useContract } from '../../hooks/useContract';
import { useContractEvents, decodeBytes32 } from '../../hooks/useContractEvents';
import type { ContractEvent } from '../../types/contract';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EnergyRegion {
  id: string;
  flag: string;
  name: string;
  rate: number;          // USD / kWh (static display value from props)
  country?: string;
}

interface EnergyTableProps {
  regions:      EnergyRegion[];
  ltcPrice:     number;
  selectedId?:  string;
  onSelect?:    (id: string) => void;
  /** Connected wallet address — enables contract reads/writes */
  walletAddress?: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LITOSHI_PER_LTC = 1e8;
const MIN_SWAP_ETH    = '0.0001';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function litoshiPerKwh(ltcPrice: number, energyRate: number): number {
  if (ltcPrice <= 0) return 0;
  return energyRate / (ltcPrice / LITOSHI_PER_LTC);
}

function ltcPerKwh(ltcPrice: number, energyRate: number): number {
  if (ltcPrice <= 0) return 0;
  return energyRate / ltcPrice;
}

function fmtLitoshi(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toFixed(0);
}

function fmtWei(wei: bigint | null, decimals = 6): string {
  if (wei === null) return '—';
  return parseFloat(ethers.formatEther(wei)).toFixed(decimals);
}

/** Format a raw on-chain rate (USD/kWh × 1e8) as a display string */
function fmtOnChainRate(raw: bigint): string {
  return '$' + (Number(raw) / 1e8).toFixed(4);
}

function fmtPrice(raw: bigint | null): string {
  if (raw === null) return '—';
  return '$' + (Number(raw) / 1e8).toFixed(2);
}

function fmtRateNullable(raw: bigint | null): string {
  if (raw === null) return '—';
  return '$' + (Number(raw) / 1e8).toFixed(4);
}

function getRateCategory(rate: number): 'low' | 'medium' | 'high' {
  if (rate < 0.12) return 'low';
  if (rate < 0.25) return 'medium';
  return 'high';
}

function getRateBadgeStyle(category: 'low' | 'medium' | 'high'): React.CSSProperties {
  const map: Record<typeof category, React.CSSProperties> = {
    low:    { background: 'rgba(16,185,129,0.15)',  color: '#10b981', border: '1px solid rgba(16,185,129,0.3)'  },
    medium: { background: 'rgba(245,158,11,0.15)',  color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)'  },
    high:   { background: 'rgba(239,68,68,0.15)',   color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)'   },
  };
  return map[category];
}

function shortHash(hash: string): string {
  return hash.slice(0, 8) + '…' + hash.slice(-6);
}

function eventLabel(ev: ContractEvent): string {
  switch (ev.kind) {
    case 'Deposited':            return `⬇ Deposited ${fmtWei(ev.amount)} ETH`;
    case 'Withdrawn':            return `⬆ Withdrawn ${fmtWei(ev.amount)} ETH`;
    case 'RegionRateUpdated':    return `📡 Rate updated → ${fmtOnChainRate(ev.newRate)}/kWh`;
    case 'SwappedToPowerTokens': return `⚡ Swapped ${fmtWei(ev.ltcAmount)} LTC → ${fmtWei(ev.powerTokenAmount)} PWR`;
    default:                     return 'Unknown event';
  }
}

/**
 * Build a lookup map: region.id (string) → bytes32 hex key.
 * The contract stores region IDs as bytes32 (UTF-8 encoded, null-padded).
 * ethers.encodeBytes32String() converts a short ASCII string to that format.
 * We pre-compute this once so table rows can do O(1) lookups.
 */
function buildRegionKeyMap(regions: EnergyRegion[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of regions) {
    try {
      const bytes32 = ethers.encodeBytes32String(r.id).toLowerCase();
      map.set(r.id, bytes32);
    } catch {
      // id too long for bytes32 — skip; row will show no on-chain rate
    }
  }
  return map;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// ── Contract Status Banner ────────────────────────────────────────────────────

interface StatusBannerProps {
  isDeployed:     boolean;
  isInitialising: boolean;
  isPaused:       boolean | null;
  isSolvent:      boolean | null;
  isListening:    boolean;
  ltcUsdPrice:    bigint | null;
  activeRate:     bigint | null;
  ltcBalance:     bigint | null;
  powerTokens:    bigint | null;
  liveRateCount:  number;
}

const StatusBanner: React.FC<StatusBannerProps> = ({
  isDeployed,
  isInitialising,
  isPaused,
  isSolvent,
  isListening,
  ltcUsdPrice,
  activeRate,
  ltcBalance,
  powerTokens,
  liveRateCount,
}) => {
  if (!isDeployed) {
    return (
      <div style={bannerStyle('warning')}>
        <span style={{ fontWeight: 700 }}>⚠ Contract not deployed</span>
        <span style={{ color: '#A3A3A3', marginLeft: 8 }}>
          Set <code style={codeStyle}>VITE_CONTRACT_ADDRESS</code> in your{' '}
          <code style={codeStyle}>.env</code> file to enable on-chain features.
        </span>
      </div>
    );
  }

  if (isInitialising) {
    return (
      <div style={bannerStyle('info')}>
        <span style={pulseStyle}>●</span>
        <span style={{ marginLeft: 8 }}>Fetching on-chain state…</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
      <Pill label="Contract"    value={isPaused ? 'PAUSED' : 'LIVE'}                                    color={isPaused ? '#ef4444' : '#10b981'} />
      <Pill label="Solvency"    value={isSolvent === null ? '—' : isSolvent ? 'SOLVENT' : 'INSOLVENT'}  color={isSolvent === false ? '#ef4444' : '#10b981'} />
      <Pill label="LTC/USD"     value={fmtPrice(ltcUsdPrice)}                                           color="#38bdf8" />
      <Pill label="Active Rate" value={fmtRateNullable(activeRate) + '/kWh'}                            color="#9E7FFF" />
      {ltcBalance  !== null && <Pill label="LTC Balance"  value={fmtWei(ltcBalance)  + ' LTC'} color="#f472b6" />}
      {powerTokens !== null && <Pill label="Power Tokens" value={fmtWei(powerTokens) + ' PWR'} color="#f59e0b" />}
      <Pill label="Live Rates"  value={liveRateCount > 0 ? `${liveRateCount} synced` : 'pending'}       color={liveRateCount > 0 ? '#10b981' : '#A3A3A3'} />
      <Pill label="Events"      value={isListening ? 'LIVE' : 'OFF'}                                    color={isListening ? '#10b981' : '#A3A3A3'} />
    </div>
  );
};

// ── Pill ──────────────────────────────────────────────────────────────────────

const Pill: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div
    style={{
      display:      'flex',
      alignItems:   'center',
      gap:          6,
      padding:      '4px 10px',
      borderRadius: 20,
      background:   'rgba(255,255,255,0.04)',
      border:       `1px solid ${color}33`,
      fontSize:     '0.72rem',
      fontFamily:   'Inter, system-ui, sans-serif',
    }}
  >
    <span style={{ color: '#A3A3A3' }}>{label}</span>
    <span style={{ color, fontWeight: 700, fontFamily: 'monospace' }}>{value}</span>
  </div>
);

// ── On-Chain Rate Cell ────────────────────────────────────────────────────────
// Renders the "On-Chain Rate" column for a single region row.
// Shows the live rate from regionRateOverrides when available, with a visual
// diff indicator if it diverges from the static prop rate by ≥ 0.5%.

interface OnChainRateCellProps {
  staticRate:    number;          // USD/kWh from props
  liveRate:      bigint | null;   // USD/kWh × 1e8 from contract, or null
  isActiveRegion: boolean;
}

const OnChainRateCell: React.FC<OnChainRateCellProps> = ({ staticRate, liveRate, isActiveRegion }) => {
  if (liveRate === null) {
    return <span style={{ color: '#3a3a3a' }}>—</span>;
  }

  const liveRateFloat = Number(liveRate) / 1e8;
  const diffPct       = staticRate > 0 ? ((liveRateFloat - staticRate) / staticRate) * 100 : 0;
  const hasDiff       = Math.abs(diffPct) >= 0.5;
  const diffUp        = diffPct > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Live rate value */}
      <span
        style={{
          color:      isActiveRegion ? '#10b981' : '#9E7FFF',
          fontWeight: 700,
          fontFamily: 'monospace',
        }}
      >
        {fmtOnChainRate(liveRate)}
        {isActiveRegion && (
          <span style={{ color: '#A3A3A3', fontWeight: 400, marginLeft: 4, fontSize: '0.68rem' }}>
            ✓ active
          </span>
        )}
      </span>

      {/* Diff badge — only shown when live rate diverges from static prop */}
      {hasDiff && (
        <span
          style={{
            fontSize:   '0.65rem',
            fontFamily: 'monospace',
            color:      diffUp ? '#ef4444' : '#10b981',
            background: diffUp ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
            border:     `1px solid ${diffUp ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
            borderRadius: 3,
            padding:    '1px 5px',
            width:      'fit-content',
          }}
        >
          {diffUp ? '▲' : '▼'} {Math.abs(diffPct).toFixed(1)}% vs static
        </span>
      )}
    </div>
  );
};

// ── Action Panel ──────────────────────────────────────────────────────────────

interface ActionPanelProps {
  isDeployed:       boolean;
  walletAddress:    string | null | undefined;
  txState:          { status: string; hash: string | null; error: string | null };
  onDeposit:        (amount: string) => void;
  onWithdraw:       (amount: string) => void;
  onSwapToPower:    (amount: string) => void;
  onSwapPowerToLtc: (amount: string) => void;
  onResetTx:        () => void;
}

const ActionPanel: React.FC<ActionPanelProps> = ({
  isDeployed,
  walletAddress,
  txState,
  onDeposit,
  onWithdraw,
  onSwapToPower,
  onSwapPowerToLtc,
  onResetTx,
}) => {
  const [amount, setAmount]           = useState('');
  const [activeAction, setActiveAction] = useState<'deposit' | 'withdraw' | 'swapTo' | 'swapFrom'>('deposit');

  const disabled = !isDeployed || !walletAddress || txState.status === 'pending' || txState.status === 'mining';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = amount.trim();
    if (!val || parseFloat(val) <= 0) return;
    switch (activeAction) {
      case 'deposit':  onDeposit(val);        break;
      case 'withdraw': onWithdraw(val);       break;
      case 'swapTo':   onSwapToPower(val);    break;
      case 'swapFrom': onSwapPowerToLtc(val); break;
    }
  }

  const actions: { key: typeof activeAction; label: string; color: string }[] = [
    { key: 'deposit',  label: '⬇ Deposit',    color: '#10b981' },
    { key: 'withdraw', label: '⬆ Withdraw',   color: '#38bdf8' },
    { key: 'swapTo',   label: '⚡ LTC → PWR', color: '#9E7FFF' },
    { key: 'swapFrom', label: '↩ PWR → LTC',  color: '#f472b6' },
  ];

  return (
    <div
      style={{
        background:   'rgba(255,255,255,0.03)',
        border:       '1px solid #2f2f2f',
        borderRadius: 10,
        padding:      '16px 20px',
        marginBottom: 20,
      }}
    >
      <div style={{ fontSize: '0.75rem', color: '#A3A3A3', marginBottom: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Contract Actions
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {actions.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => { setActiveAction(key); onResetTx(); }}
            style={{
              padding:    '5px 12px',
              borderRadius: 6,
              border:     `1px solid ${activeAction === key ? color : '#3a3a3a'}`,
              background: activeAction === key ? `${color}18` : 'transparent',
              color:      activeAction === key ? color : '#A3A3A3',
              fontSize:   '0.75rem',
              fontWeight: 600,
              cursor:     'pointer',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="number"
          min={MIN_SWAP_ETH}
          step="any"
          placeholder={`Amount (ETH / LTC) — min ${MIN_SWAP_ETH}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={disabled}
          style={{
            flex:       1,
            padding:    '8px 12px',
            borderRadius: 6,
            border:     '1px solid #3a3a3a',
            background: '#1a1a1a',
            color:      '#fff',
            fontSize:   '0.82rem',
            fontFamily: 'monospace',
            outline:    'none',
          }}
        />
        <button
          type="submit"
          disabled={disabled || !amount}
          style={{
            padding:    '8px 18px',
            borderRadius: 6,
            border:     'none',
            background: disabled ? '#3a3a3a' : 'linear-gradient(135deg, #9E7FFF, #38bdf8)',
            color:      disabled ? '#666' : '#fff',
            fontWeight: 700,
            fontSize:   '0.82rem',
            cursor:     disabled ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.15s',
          }}
        >
          {txState.status === 'pending' ? 'Signing…' :
           txState.status === 'mining'  ? 'Mining…'  : 'Execute'}
        </button>
      </form>

      {!walletAddress && (
        <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#f59e0b' }}>
          ⚠ Connect your wallet to execute contract transactions.
        </div>
      )}

      <TxFeedback txState={txState} onReset={onResetTx} />
    </div>
  );
};

// ── Tx Feedback ───────────────────────────────────────────────────────────────

interface TxFeedbackProps {
  txState: { status: string; hash: string | null; error: string | null };
  onReset: () => void;
}

const TxFeedback: React.FC<TxFeedbackProps> = ({ txState, onReset }) => {
  if (txState.status === 'idle') return null;

  const map: Record<string, { color: string; icon: string; label: string }> = {
    pending:   { color: '#f59e0b', icon: '⏳', label: 'Waiting for signature…' },
    mining:    { color: '#38bdf8', icon: '⛏',  label: 'Transaction mining…'    },
    confirmed: { color: '#10b981', icon: '✓',   label: 'Confirmed'              },
    failed:    { color: '#ef4444', icon: '✗',   label: 'Transaction failed'     },
  };

  const meta = map[txState.status] ?? map.failed;

  return (
    <div
      style={{
        marginTop:    12,
        padding:      '10px 14px',
        borderRadius: 6,
        border:       `1px solid ${meta.color}44`,
        background:   `${meta.color}0d`,
        display:      'flex',
        alignItems:   'flex-start',
        gap:          10,
        fontSize:     '0.78rem',
      }}
    >
      <span style={{ fontSize: '1rem', lineHeight: 1.2 }}>{meta.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: meta.color, fontWeight: 700 }}>{meta.label}</div>
        {txState.hash && (
          <div style={{ color: '#A3A3A3', fontFamily: 'monospace', marginTop: 2 }}>
            Tx: {shortHash(txState.hash)}
          </div>
        )}
        {txState.error && (
          <div style={{ color: '#ef4444', marginTop: 4, wordBreak: 'break-word' }}>
            {txState.error.slice(0, 200)}
          </div>
        )}
      </div>
      {(txState.status === 'confirmed' || txState.status === 'failed') && (
        <button
          onClick={onReset}
          style={{ background: 'transparent', border: 'none', color: '#A3A3A3', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1 }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

// ── Event Log ─────────────────────────────────────────────────────────────────

interface EventLogProps {
  events:      ContractEvent[];
  isListening: boolean;
  onClear:     () => void;
}

const EventLog: React.FC<EventLogProps> = ({ events, isListening, onClear }) => (
  <div
    style={{
      background:   'rgba(255,255,255,0.02)',
      border:       '1px solid #2f2f2f',
      borderRadius: 10,
      padding:      '14px 18px',
      marginTop:    20,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <div style={{ fontSize: '0.75rem', color: '#A3A3A3', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isListening ? '#10b981' : '#3a3a3a',
            display: 'inline-block',
            boxShadow: isListening ? '0 0 6px #10b981' : 'none',
          }}
        />
        Live Event Log
      </div>
      {events.length > 0 && (
        <button
          onClick={onClear}
          style={{ background: 'transparent', border: 'none', color: '#A3A3A3', cursor: 'pointer', fontSize: '0.72rem' }}
        >
          Clear
        </button>
      )}
    </div>

    {events.length === 0 ? (
      <div style={{ color: '#3a3a3a', fontSize: '0.78rem', fontStyle: 'italic' }}>
        No events captured yet. Events will appear here in real-time.
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
        {events.map((ev, i) => (
          <div
            key={i}
            style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              padding:        '6px 10px',
              borderRadius:   6,
              background:     ev.kind === 'RegionRateUpdated'
                ? 'rgba(158,127,255,0.06)'
                : 'rgba(255,255,255,0.03)',
              fontSize:       '0.75rem',
              gap:            12,
              borderLeft:     ev.kind === 'RegionRateUpdated'
                ? '2px solid #9E7FFF'
                : '2px solid transparent',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ color: '#e2e8f0' }}>{eventLabel(ev)}</span>
              {ev.kind === 'RegionRateUpdated' && (
                <span style={{ color: '#9E7FFF', fontSize: '0.68rem', fontFamily: 'monospace' }}>
                  region: {decodeBytes32(ev.regionId)}
                </span>
              )}
            </div>
            <span style={{ color: '#A3A3A3', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
              #{ev.blockNumber} · {shortHash(ev.txHash)}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const EnergyTable: React.FC<EnergyTableProps> = ({
  regions,
  ltcPrice,
  selectedId,
  onSelect,
  walletAddress,
}) => {
  const {
    contractState,
    txState,
    isDeployed,
    isInitialising,
    deposit,
    withdraw,
    swapToPowerTokens,
    swapPowerTokensToLtc,
    refreshState,
    resetTx,
  } = useContract(walletAddress);

  const { events, isListening, clearEvents, regionRateOverrides } = useContractEvents(walletAddress);

  // Refresh on-chain state whenever a tx confirms
  useEffect(() => {
    if (txState.status === 'confirmed') {
      refreshState(walletAddress);
    }
  }, [txState.status, walletAddress, refreshState]);

  // ── Pre-compute bytes32 key map for all regions ───────────────────────────
  // Maps region.id → bytes32 hex key used in regionRateOverrides.
  // Memoised so it only recomputes when the regions array reference changes.
  const regionKeyMap = useMemo(() => buildRegionKeyMap(regions), [regions]);

  // ── Derive the active region's bytes32 key ────────────────────────────────
  const activeRegionKey = contractState.activeRegion?.toLowerCase() ?? null;

  const maxRate = Math.max(...regions.map((r) => r.rate));

  // ── Callbacks passed to ActionPanel ──────────────────────────────────────

  const handleDeposit        = useCallback((a: string) => deposit(a),            [deposit]);
  const handleWithdraw       = useCallback((a: string) => withdraw(a),           [withdraw]);
  const handleSwapToPower    = useCallback((a: string) => swapToPowerTokens(a),  [swapToPowerTokens]);
  const handleSwapPowerToLtc = useCallback((a: string) => swapPowerTokensToLtc(a), [swapPowerTokensToLtc]);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Contract Status Banner ── */}
      <StatusBanner
        isDeployed={isDeployed}
        isInitialising={isInitialising}
        isPaused={contractState.isPaused}
        isSolvent={contractState.isSolvent}
        isListening={isListening}
        ltcUsdPrice={contractState.ltcUsdPrice}
        activeRate={contractState.activeRegionRate}
        ltcBalance={contractState.ltcBalance}
        powerTokens={contractState.powerTokens}
        liveRateCount={Object.keys(regionRateOverrides).length}
      />

      {/* ── Action Panel ── */}
      <ActionPanel
        isDeployed={isDeployed}
        walletAddress={walletAddress}
        txState={txState}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
        onSwapToPower={handleSwapToPower}
        onSwapPowerToLtc={handleSwapPowerToLtc}
        onResetTx={resetTx}
      />

      {/* ── Region Table ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr
              style={{
                borderBottom:  '1px solid #3a3a3a',
                color:         '#A3A3A3',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                fontSize:      '0.68rem',
              }}
            >
              <th style={thStyle}>Region</th>
              <th style={thStyle}>Rate (USD/kWh)</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Litoshi / kWh</th>
              <th style={thStyle}>1 LTC = kWh</th>
              <th style={thStyle}>Relative Cost</th>
              {/* On-Chain Rate column — shows live rate from contract per region */}
              <th style={thStyle}>
                On-Chain Rate
                <span
                  style={{
                    marginLeft:   5,
                    fontSize:     '0.6rem',
                    color:        '#9E7FFF',
                    fontWeight:   400,
                    letterSpacing: 0,
                    textTransform: 'none',
                  }}
                >
                  (live)
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {regions.map((region) => {
              const isSelected = region.id === selectedId;

              // ── Region rate synchronization ──────────────────────────────
              // Look up the bytes32 key for this region, then check if we have
              // a live override from the contract (seeded on mount from
              // getActiveRegionRate(), then updated by RegionRateUpdated events).
              const bytes32Key  = regionKeyMap.get(region.id) ?? null;
              const liveRate    = bytes32Key !== null
                ? (regionRateOverrides[bytes32Key] ?? null)
                : null;

              // A region is "active on-chain" when its bytes32 key matches
              // the contract's activeRegion storage variable.
              const isActiveOnChain =
                bytes32Key !== null &&
                activeRegionKey !== null &&
                bytes32Key === activeRegionKey;

              // Use the live on-chain rate for derived calculations when available,
              // otherwise fall back to the static prop rate.
              const effectiveRate = liveRate !== null
                ? Number(liveRate) / 1e8
                : region.rate;

              const litoshiKwh = litoshiPerKwh(ltcPrice, effectiveRate);
              const kwhPerLtc  = 1 / ltcPerKwh(ltcPrice, effectiveRate);
              const barPct     = Math.round((effectiveRate / maxRate) * 100);
              const category   = getRateCategory(effectiveRate);
              const badgeStyle = getRateBadgeStyle(category);

              return (
                <tr
                  key={region.id}
                  onClick={() => onSelect?.(region.id)}
                  style={{
                    borderBottom: '1px solid #2f2f2f',
                    background:   isSelected
                      ? 'rgba(158,127,255,0.08)'
                      : isActiveOnChain
                        ? 'rgba(16,185,129,0.04)'
                        : 'transparent',
                    cursor:     onSelect ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                    borderLeft: isSelected
                      ? '3px solid #9E7FFF'
                      : isActiveOnChain
                        ? '3px solid #10b981'
                        : '3px solid transparent',
                  }}
                >
                  {/* Region name */}
                  <td style={tdStyle}>
                    <span style={{ marginRight: 6 }}>{region.flag}</span>
                    <strong style={{ color: '#fff' }}>{region.name}</strong>
                    {isActiveOnChain && (
                      <span
                        style={{
                          marginLeft:   6,
                          fontSize:     '0.62rem',
                          color:        '#10b981',
                          background:   'rgba(16,185,129,0.12)',
                          border:       '1px solid rgba(16,185,129,0.25)',
                          borderRadius: 3,
                          padding:      '1px 5px',
                          fontWeight:   600,
                        }}
                      >
                        ACTIVE
                      </span>
                    )}
                  </td>

                  {/* Rate — shows effective rate (live if available, else static) */}
                  <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 700 }}>
                    ${effectiveRate.toFixed(4)}
                    {liveRate !== null && effectiveRate !== region.rate && (
                      <span
                        style={{
                          marginLeft:   5,
                          fontSize:     '0.65rem',
                          color:        '#9E7FFF',
                          fontFamily:   'monospace',
                          opacity:      0.7,
                        }}
                      >
                        ↺
                      </span>
                    )}
                  </td>

                  {/* Category badge */}
                  <td style={tdStyle}>
                    <span
                      style={{
                        ...badgeStyle,
                        padding:      '2px 8px',
                        borderRadius: 4,
                        fontSize:     '0.7rem',
                        fontWeight:   600,
                      }}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                  </td>

                  {/* Litoshi / kWh */}
                  <td style={{ ...tdStyle, color: '#f472b6', fontWeight: 700 }}>
                    {fmtLitoshi(litoshiKwh)} Ł
                  </td>

                  {/* 1 LTC = kWh */}
                  <td style={{ ...tdStyle, color: '#9E7FFF', fontWeight: 700 }}>
                    {kwhPerLtc.toFixed(2)} kWh
                  </td>

                  {/* Relative cost bar */}
                  <td style={{ ...tdStyle, minWidth: 120 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          flex:         1,
                          height:       4,
                          background:   '#3a3a3a',
                          borderRadius: 2,
                          overflow:     'hidden',
                        }}
                      >
                        <div
                          style={{
                            width:        `${barPct}%`,
                            height:       '100%',
                            background:   'linear-gradient(90deg, #9E7FFF, #38bdf8)',
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#A3A3A3', whiteSpace: 'nowrap' }}>
                        {effectiveRate > 0.20 ? 'Expensive' : 'Affordable'}
                      </span>
                    </div>
                  </td>

                  {/* On-Chain Rate — live per-region sync */}
                  <td style={{ ...tdStyle, fontFamily: 'monospace' }}>
                    <OnChainRateCell
                      staticRate={region.rate}
                      liveRate={liveRate}
                      isActiveRegion={isActiveOnChain}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Live Event Log ── */}
      <EventLog events={events} isListening={isListening} onClear={clearEvents} />
    </div>
  );
};

// ─── Shared cell styles ───────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding:    '10px 14px',
  textAlign:  'left',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding:       '10px 14px',
  color:         '#A3A3A3',
  verticalAlign: 'middle',
};

// ─── Inline style helpers ─────────────────────────────────────────────────────

function bannerStyle(type: 'warning' | 'info'): React.CSSProperties {
  const colors = { warning: '#f59e0b', info: '#38bdf8' };
  const c = colors[type];
  return {
    padding:      '10px 16px',
    borderRadius: 8,
    border:       `1px solid ${c}44`,
    background:   `${c}0d`,
    marginBottom: 16,
    fontSize:     '0.8rem',
    display:      'flex',
    alignItems:   'center',
    flexWrap:     'wrap',
    gap:          6,
  };
}

const codeStyle: React.CSSProperties = {
  fontFamily:   'monospace',
  background:   'rgba(255,255,255,0.08)',
  padding:      '1px 5px',
  borderRadius: 3,
  fontSize:     '0.78rem',
};

const pulseStyle: React.CSSProperties = {
  color:     '#38bdf8',
  animation: 'pulse 1.2s infinite',
};

// ─── Export ───────────────────────────────────────────────────────────────────

export default EnergyTable;
export type { EnergyTableProps };
