import React, { useState, useMemo } from 'react';
import { useWalletContext } from '../context/WalletContext';

// ─── Mock rewards data ────────────────────────────────────────────────────────

const REWARD_TIERS = [
  { tier: 'Bronze',   minLTC: 0,    maxLTC: 9,    apy: '4.2%',  color: '#cd7f32', icon: '🥉' },
  { tier: 'Silver',   minLTC: 10,   maxLTC: 49,   apy: '6.8%',  color: '#C0C0C0', icon: '🥈' },
  { tier: 'Gold',     minLTC: 50,   maxLTC: 199,  apy: '9.5%',  color: '#FFD700', icon: '🥇' },
  { tier: 'Platinum', minLTC: 200,  maxLTC: 999,  apy: '13.2%', color: '#38bdf8', icon: '💎' },
  { tier: 'Diamond',  minLTC: 1000, maxLTC: null, apy: '18.0%', color: '#9E7FFF', icon: '🔮' },
];

const MOCK_REWARDS_HISTORY = [
  { id: 1, date: '2025-07-10', amount: '0.42 LTC', type: 'Staking Reward',  status: 'claimed'  },
  { id: 2, date: '2025-07-08', amount: '0.18 LTC', type: 'Energy Bonus',    status: 'claimed'  },
  { id: 3, date: '2025-07-05', amount: '0.61 LTC', type: 'Staking Reward',  status: 'claimed'  },
  { id: 4, date: '2025-07-01', amount: '0.09 LTC', type: 'Referral Bonus',  status: 'pending'  },
  { id: 5, date: '2025-06-28', amount: '0.33 LTC', type: 'Staking Reward',  status: 'claimed'  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const Rewards = () => {
  const { status, address, balances } = useWalletContext();
  const isConnected = status === 'connected';

  const [activeTab, setActiveTab] = useState('overview');

  const ltcBalance = useMemo(() => {
    const ltc = balances?.find((b) => b.symbol === 'LTC');
    return ltc ? parseFloat(ltc.amount) : 0;
  }, [balances]);

  const currentTier = useMemo(() => {
    for (let i = REWARD_TIERS.length - 1; i >= 0; i--) {
      if (ltcBalance >= REWARD_TIERS[i].minLTC) return REWARD_TIERS[i];
    }
    return REWARD_TIERS[0];
  }, [ltcBalance]);

  const pendingRewards = MOCK_REWARDS_HISTORY.filter((r) => r.status === 'pending');
  const claimedRewards = MOCK_REWARDS_HISTORY.filter((r) => r.status === 'claimed');

  return (
    <div style={pageStyle}>
      <h2 style={headingStyle}>⚡ Rewards</h2>
      <p style={subheadStyle}>Earn LTC rewards by staking and participating in the energy protocol.</p>

      {/* ── Tabs ── */}
      <div style={tabBarStyle}>
        {['overview', 'tiers', 'history'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              ...tabBtnStyle,
              background: activeTab === tab ? 'rgba(158,127,255,0.15)' : 'transparent',
              color: activeTab === tab ? '#9E7FFF' : '#A3A3A3',
              borderBottom: activeTab === tab ? '2px solid #9E7FFF' : '2px solid transparent',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        <div>
          {isConnected ? (
            <>
              {/* Current tier card */}
              <div style={{ ...cardStyle, borderColor: currentTier.color, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#A3A3A3', fontSize: '0.72rem', marginBottom: 4 }}>CURRENT TIER</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1.5rem' }}>{currentTier.icon}</span>
                      <span style={{ color: currentTier.color, fontWeight: 700, fontSize: '1.2rem' }}>
                        {currentTier.tier}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#A3A3A3', fontSize: '0.72rem', marginBottom: 4 }}>APY</div>
                    <div style={{ color: '#10b981', fontWeight: 700, fontSize: '1.4rem' }}>
                      {currentTier.apy}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12, color: '#A3A3A3', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                  {address?.slice(0, 20)}…
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={cardStyle}>
                  <div style={{ color: '#A3A3A3', fontSize: '0.72rem', marginBottom: 4 }}>LTC STAKED</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>{ltcBalance.toFixed(4)} LTC</div>
                </div>
                <div style={cardStyle}>
                  <div style={{ color: '#A3A3A3', fontSize: '0.72rem', marginBottom: 4 }}>PENDING REWARDS</div>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '1.1rem' }}>
                    {pendingRewards.length > 0 ? pendingRewards[0].amount : '0.00 LTC'}
                  </div>
                </div>
              </div>

              {/* Claim button */}
              {pendingRewards.length > 0 && (
                <button
                  type="button"
                  style={claimBtnStyle}
                  onClick={() => alert('Claim transaction simulated!')}
                >
                  Claim {pendingRewards.length} Pending Reward{pendingRewards.length > 1 ? 's' : ''}
                </button>
              )}
            </>
          ) : (
            <div style={emptyStyle}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔒</div>
              <div style={{ color: '#A3A3A3', fontSize: '0.9rem' }}>
                Connect your wallet to view your rewards.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tiers ── */}
      {activeTab === 'tiers' && (
        <div>
          {REWARD_TIERS.map((tier) => {
            const isActive = isConnected && currentTier.tier === tier.tier;
            return (
              <div
                key={tier.tier}
                style={{
                  ...cardStyle,
                  marginBottom: 10,
                  borderColor: isActive ? tier.color : '#2F2F2F',
                  background: isActive ? `${tier.color}18` : '#262626',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.3rem' }}>{tier.icon}</span>
                    <div>
                      <div style={{ color: tier.color, fontWeight: 700, fontSize: '0.95rem' }}>{tier.tier}</div>
                      <div style={{ color: '#A3A3A3', fontSize: '0.72rem' }}>
                        {tier.minLTC} – {tier.maxLTC ?? '∞'} LTC
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#10b981', fontWeight: 700 }}>{tier.apy}</div>
                    <div style={{ color: '#A3A3A3', fontSize: '0.7rem' }}>APY</div>
                  </div>
                </div>
                {isActive && (
                  <div style={{ marginTop: 8, color: tier.color, fontSize: '0.72rem', fontWeight: 600 }}>
                    ✓ Your current tier
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── History ── */}
      {activeTab === 'history' && (
        <div>
          {isConnected ? (
            <>
              <div style={{ color: '#A3A3A3', fontSize: '0.72rem', marginBottom: 8 }}>
                {claimedRewards.length} claimed · {pendingRewards.length} pending
              </div>
              {MOCK_REWARDS_HISTORY.map((r) => (
                <div key={r.id} style={{ ...cardStyle, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{r.type}</div>
                      <div style={{ color: '#A3A3A3', fontSize: '0.72rem', marginTop: 2 }}>{r.date}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#9E7FFF', fontWeight: 700, fontSize: '0.9rem' }}>{r.amount}</div>
                      <div
                        style={{
                          fontSize: '0.68rem',
                          marginTop: 2,
                          color: r.status === 'claimed' ? '#10b981' : '#f59e0b',
                        }}
                      >
                        {r.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={emptyStyle}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
              <div style={{ color: '#A3A3A3', fontSize: '0.9rem' }}>
                Connect your wallet to view reward history.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Rewards;

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageStyle = {
  padding: 24,
  color: '#fff',
  fontFamily: 'sans-serif',
  maxWidth: 640,
};

const headingStyle = {
  color: '#9E7FFF',
  marginBottom: 4,
  fontSize: '1.4rem',
  fontWeight: 700,
};

const subheadStyle = {
  color: '#A3A3A3',
  fontSize: '0.85rem',
  marginBottom: 20,
};

const tabBarStyle = {
  display: 'flex',
  gap: 0,
  borderBottom: '1px solid #2F2F2F',
  marginBottom: 20,
};

const tabBtnStyle = {
  padding: '8px 18px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: 500,
  transition: 'all 0.15s ease',
};

const cardStyle = {
  padding: '12px 16px',
  background: '#262626',
  borderRadius: 10,
  border: '1px solid #2F2F2F',
};

const claimBtnStyle = {
  width: '100%',
  padding: '12px',
  background: 'linear-gradient(135deg, #9E7FFF, #38bdf8)',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
  marginTop: 4,
};

const emptyStyle = {
  textAlign: 'center',
  padding: '40px 20px',
  color: '#A3A3A3',
};
