import React, { useState, useEffect } from 'react';
import { useWalletContext } from '../context/WalletContext';

// ── Mock rank data ────────────────────────────────────────────────────────────
const RANK_TIERS = [
  { tier: 'Photon',    minLtc: 0,    color: '#A3A3A3', icon: '⚪', perks: ['Basic swap access', 'Energy index view'] },
  { tier: 'Electron',  minLtc: 0.5,  color: '#38bdf8', icon: '🔵', perks: ['Reduced swap fees (0.5%)', 'Regional market access'] },
  { tier: 'Watt',      minLtc: 2,    color: '#9E7FFF', icon: '🟣', perks: ['Reduced swap fees (0.3%)', 'Priority oracle updates'] },
  { tier: 'Kilowatt',  minLtc: 10,   color: '#f472b6', icon: '🩷', perks: ['Reduced swap fees (0.1%)', 'Governance voting'] },
  { tier: 'Megawatt',  minLtc: 50,   color: '#f59e0b', icon: '🟡', perks: ['Zero swap fees', 'Admin proposal rights'] },
  { tier: 'Gigawatt',  minLtc: 200,  color: '#10b981', icon: '🟢', perks: ['Zero swap fees', 'Multi-sig admin seat', 'Revenue share'] },
];

const MOCK_LEADERBOARD = [
  { address: '0xa1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', ltc: 312.4, tier: 'Gigawatt',  rank: 1 },
  { address: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef', ltc: 187.9, tier: 'Megawatt',  rank: 2 },
  { address: '0x1234567890abcdef1234567890abcdef12345678', ltc: 94.2,  tier: 'Kilowatt',  rank: 3 },
  { address: '0xfeedfacecafebabedeadbeefdeadbeeffeedface', ltc: 41.7,  tier: 'Kilowatt',  rank: 4 },
  { address: '0xabcdef1234567890abcdef1234567890abcdef12', ltc: 18.3,  tier: 'Watt',      rank: 5 },
  { address: '0x9876543210fedcba9876543210fedcba98765432', ltc: 7.6,   tier: 'Watt',      rank: 6 },
  { address: '0xc0ffee00c0ffee00c0ffee00c0ffee00c0ffee00', ltc: 3.1,   tier: 'Electron',  rank: 7 },
  { address: '0xbabe1234babe1234babe1234babe1234babe1234', ltc: 0.8,   tier: 'Electron',  rank: 8 },
  { address: '0xface0000face0000face0000face0000face0000', ltc: 0.2,   tier: 'Photon',    rank: 9 },
  { address: '0xdead0000dead0000dead0000dead0000dead0000', ltc: 0.05,  tier: 'Photon',    rank: 10 },
];

function getTierForLtc(ltc) {
  let current = RANK_TIERS[0];
  for (const t of RANK_TIERS) {
    if (ltc >= t.minLtc) current = t;
  }
  return current;
}

function shortAddr(addr) {
  if (!addr) return '—';
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

// ── Component ─────────────────────────────────────────────────────────────────
const RankSystem = () => {
  const { status, address, balances } = useWalletContext();
  const isConnected = status === 'connected';

  const [activeTab, setActiveTab] = useState('tiers'); // 'tiers' | 'leaderboard'
  const [userLtc, setUserLtc]     = useState(0);

  useEffect(() => {
    if (isConnected && balances.length > 0) {
      const ltcBal = balances.find((b) => b.symbol === 'LTC');
      setUserLtc(ltcBal ? parseFloat(ltcBal.amount) : 0);
    } else {
      setUserLtc(0);
    }
  }, [isConnected, balances]);

  const userTier = getTierForLtc(userLtc);
  const nextTier = RANK_TIERS[RANK_TIERS.indexOf(userTier) + 1] ?? null;
  const progress = nextTier
    ? Math.min(((userLtc - userTier.minLtc) / (nextTier.minLtc - userTier.minLtc)) * 100, 100)
    : 100;

  return (
    <div style={{ padding: 24, color: '#fff', fontFamily: 'sans-serif', maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '0.75rem', color: '#9E7FFF', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 6 }}>
          LITBREAK PROTOCOL
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.6rem', fontWeight: 800 }}>Rank System</h2>
        <p style={{ margin: 0, color: '#A3A3A3', fontSize: '0.85rem' }}>
          Your LTC holdings determine your tier, fee discounts, and governance rights.
        </p>
      </div>

      {/* User rank card */}
      {isConnected ? (
        <div style={cardStyle(userTier.color)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ fontSize: '2.2rem' }}>{userTier.icon}</div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#A3A3A3', marginBottom: 2 }}>YOUR TIER</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: userTier.color }}>{userTier.tier}</div>
              <div style={{ fontSize: '0.78rem', color: '#A3A3A3', fontFamily: 'monospace' }}>{shortAddr(address)}</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#A3A3A3', marginBottom: 2 }}>LTC BALANCE</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{userLtc.toFixed(4)}</div>
            </div>
          </div>

          {/* Progress bar */}
          {nextTier && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#A3A3A3', marginBottom: 6 }}>
                <span>{userTier.tier}</span>
                <span>{nextTier.tier} ({nextTier.minLtc} LTC)</span>
              </div>
              <div style={{ height: 6, background: '#2F2F2F', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${userTier.color}, ${nextTier.color})`, borderRadius: 99, transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: '#A3A3A3', marginTop: 4 }}>
                {(nextTier.minLtc - userLtc).toFixed(4)} LTC to {nextTier.tier}
              </div>
            </div>
          )}

          {/* Perks */}
          <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {userTier.perks.map((p) => (
              <span key={p} style={{ padding: '3px 10px', borderRadius: 99, background: userTier.color + '22', border: `1px solid ${userTier.color}44`, color: userTier.color, fontSize: '0.72rem' }}>
                ✓ {p}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ ...cardStyle('#9E7FFF'), textAlign: 'center', padding: '28px 20px' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🔐</div>
          <div style={{ color: '#A3A3A3', fontSize: '0.85rem' }}>Connect your wallet to view your rank and progress.</div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, marginTop: 24 }}>
        {['tiers', 'leaderboard'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              padding: '7px 18px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: activeTab === t ? '#9E7FFF' : '#262626',
              color: activeTab === t ? '#fff' : '#A3A3A3',
              transition: 'background 0.15s',
              textTransform: 'capitalize',
            }}
          >
            {t === 'tiers' ? '⚡ Tier Table' : '🏆 Leaderboard'}
          </button>
        ))}
      </div>

      {/* Tier table */}
      {activeTab === 'tiers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RANK_TIERS.map((tier) => {
            const isActive = isConnected && tier.tier === userTier.tier;
            return (
              <div
                key={tier.tier}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  background: isActive ? tier.color + '18' : '#262626',
                  borderRadius: 12,
                  border: `1px solid ${isActive ? tier.color + '55' : '#2F2F2F'}`,
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ fontSize: '1.4rem', width: 32, textAlign: 'center' }}>{tier.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: tier.color, fontSize: '0.95rem' }}>{tier.tier}</div>
                  <div style={{ color: '#A3A3A3', fontSize: '0.75rem' }}>≥ {tier.minLtc} LTC</div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'flex-end' }}>
                  {tier.perks.map((p) => (
                    <span key={p} style={{ padding: '2px 8px', borderRadius: 99, background: '#171717', border: '1px solid #2F2F2F', color: '#A3A3A3', fontSize: '0.7rem' }}>
                      {p}
                    </span>
                  ))}
                </div>
                {isActive && (
                  <span style={{ padding: '3px 10px', borderRadius: 99, background: tier.color, color: '#fff', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    YOUR TIER
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div style={{ background: '#262626', borderRadius: 12, border: '1px solid #2F2F2F', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2F2F2F' }}>
                {['Rank', 'Address', 'LTC', 'Tier'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#A3A3A3', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_LEADERBOARD.map((row) => {
                const tier = RANK_TIERS.find((t) => t.tier === row.tier) ?? RANK_TIERS[0];
                const isUser = isConnected && address?.toLowerCase() === row.address.toLowerCase();
                return (
                  <tr
                    key={row.address}
                    style={{
                      borderBottom: '1px solid #2F2F2F',
                      background: isUser ? '#9E7FFF18' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '10px 16px', color: row.rank <= 3 ? '#f59e0b' : '#A3A3A3', fontWeight: row.rank <= 3 ? 700 : 400, fontSize: '0.85rem' }}>
                      {row.rank <= 3 ? ['🥇','🥈','🥉'][row.rank - 1] : `#${row.rank}`}
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: '0.8rem', color: isUser ? '#9E7FFF' : '#fff' }}>
                      {shortAddr(row.address)}{isUser && <span style={{ marginLeft: 6, fontSize: '0.68rem', color: '#9E7FFF' }}>(you)</span>}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '0.85rem', fontWeight: 600 }}>
                      {row.ltc.toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ padding: '2px 10px', borderRadius: 99, background: tier.color + '22', border: `1px solid ${tier.color}44`, color: tier.color, fontSize: '0.72rem', fontWeight: 600 }}>
                        {tier.icon} {tier.tier}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const cardStyle = (color) => ({
  background: '#262626',
  borderRadius: 14,
  padding: '20px',
  border: `1px solid ${color}44`,
  boxShadow: `0 0 20px ${color}18`,
});

export default RankSystem;
