// ─── Contract Interaction Layer ─── v3.2.0
// Mocked contract calls for simulation mode.
// In production, replace with real ethers.js Contract instances.

import type { ProtocolStats, AgentConfig, OracleState } from '../types';

/** Simulated delay to mimic blockchain latency */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Generate mock protocol stats */
export async function fetchProtocolStats(): Promise<ProtocolStats> {
  await delay(800);
  return {
    totalSupply: '2450000000000000000000000',
    totalStaked: '1820000000000000000000000',
    energyIndex: 78.4 + Math.random() * 5,
    hashRate: '485.2',
    difficulty: '12.45',
    blockReward: '6.25',
    activeAgents: 12,
    totalValueLocked: '4250000000000000000000000',
    mintRate: '1.0',
    redeemRate: '0.98',
    oraclePrice: (85.5 + Math.random() * 10).toFixed(2),
    lastOracleUpdate: Math.floor(Date.now() / 1000) - 120,
  };
}

/** Generate mock agent configs */
export async function fetchAgents(): Promise<AgentConfig[]> {
  await delay(600);
  return [
    {
      id: '1',
      name: 'Alpha Miner',
      strategy: 'Aggressive Mining',
      isActive: true,
      performance: 12.5,
      totalStaked: '500000000000000000000000',
      rewardRate: '8.2',
      lastUpdate: Math.floor(Date.now() / 1000) - 300,
    },
    {
      id: '2',
      name: 'Beta Yield',
      strategy: 'Yield Optimization',
      isActive: true,
      performance: 8.3,
      totalStaked: '320000000000000000000000',
      rewardRate: '6.1',
      lastUpdate: Math.floor(Date.now() / 1000) - 600,
    },
    {
      id: '3',
      name: 'Gamma Guard',
      strategy: 'Risk Hedging',
      isActive: false,
      performance: -2.1,
      totalStaked: '150000000000000000000000',
      rewardRate: '3.5',
      lastUpdate: Math.floor(Date.now() / 1000) - 1200,
    },
    {
      id: '4',
      name: 'Delta Scout',
      strategy: 'Arbitrage',
      isActive: true,
      performance: 15.7,
      totalStaked: '280000000000000000000000',
      rewardRate: '9.8',
      lastUpdate: Math.floor(Date.now() / 1000) - 180,
    },
  ];
}

/** Fetch oracle state */
export async function fetchOracleState(): Promise<OracleState> {
  await delay(400);
  return {
    currentPrice: (85.5 + Math.random() * 10).toFixed(2),
    lastUpdate: Math.floor(Date.now() / 1000) - 120,
    isStale: false,
    deviation: parseFloat((Math.random() * 2).toFixed(3)),
  };
}

/** Simulate a mint transaction */
export async function simulateMint(amount: string): Promise<{ hash: string; success: boolean }> {
  await delay(2000);
  const hash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  console.log(`[Contract] Mint ${amount} LBT — tx: ${hash}`);
  return { hash, success: true };
}

/** Simulate a redeem transaction */
export async function simulateRedeem(amount: string): Promise<{ hash: string; success: boolean }> {
  await delay(2000);
  const hash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  console.log(`[Contract] Redeem ${amount} LBT — tx: ${hash}`);
  return { hash, success: true };
}

/** Simulate staking to an agent */
export async function simulateStake(agentId: string, amount: string): Promise<{ hash: string; success: boolean }> {
  await delay(2000);
  const hash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  console.log(`[Contract] Stake ${amount} to agent ${agentId} — tx: ${hash}`);
  return { hash, success: true };
}
