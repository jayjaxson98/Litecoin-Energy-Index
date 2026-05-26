import type { MiningStats, EnergyIndex, AgentConfig, ChartDataPoint, Transaction } from '../types';

export function generateMiningStats(): MiningStats {
  return {
    hashrate:          798.4e12 + (Math.random() - 0.5) * 50e12,
    difficulty:        23_456_789 + Math.floor((Math.random() - 0.5) * 1_000_000),
    blockReward:       6.25,
    blockTime:         150 + Math.floor((Math.random() - 0.5) * 20),
    networkHashrate:   798.4e12,
    energyConsumption: 1_847 + Math.floor((Math.random() - 0.5) * 100),
    efficiency:        0.098 + (Math.random() - 0.5) * 0.01,
  };
}

export function generateEnergyIndex(): EnergyIndex {
  const ltcPrice  = 85 + (Math.random() - 0.5) * 10;
  const energyCost = 0.08 + (Math.random() - 0.5) * 0.02;
  const kwhPerLtc  = (energyCost * 1000) / ltcPrice;

  return {
    kwhPerLtc,
    ltcPerKwh:          1 / kwhPerLtc,
    totalNetworkPower:  1_847 + Math.floor((Math.random() - 0.5) * 100),
    renewablePercentage: 42 + (Math.random() - 0.5) * 5,
    carbonIntensity:    0.45 + (Math.random() - 0.5) * 0.05,
    timestamp:          Date.now(),
  };
}

export function generateChartData(
  points    = 30,
  baseValue = 100,
  volatility = 0.05,
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let value = baseValue;
  const now = Date.now();

  for (let i = points - 1; i >= 0; i--) {
    value = value * (1 + (Math.random() - 0.5) * volatility * 2);
    value = Math.max(value, baseValue * 0.5);
    data.push({
      timestamp: now - i * 3_600_000,
      value:     parseFloat(value.toFixed(4)),
      label:     new Date(now - i * 3_600_000).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit',
      }),
    });
  }

  return data;
}

export function generateAgents(): AgentConfig[] {
  return [
    {
      id:         '1',
      name:       'Alpha Miner',
      strategy:   'aggressive',
      status:     'active',
      allocation: 35,
      pnl:        12.4,
      trades:     847,
      winRate:    68.2,
      createdAt:  Date.now() - 30 * 24 * 3_600_000,
    },
    {
      id:         '2',
      name:       'Beta Hedger',
      strategy:   'conservative',
      status:     'active',
      allocation: 25,
      pnl:        4.8,
      trades:     234,
      winRate:    74.5,
      createdAt:  Date.now() - 15 * 24 * 3_600_000,
    },
    {
      id:         '3',
      name:       'Gamma Arb',
      strategy:   'moderate',
      status:     'paused',
      allocation: 20,
      pnl:        -2.1,
      trades:     512,
      winRate:    55.8,
      createdAt:  Date.now() - 7 * 24 * 3_600_000,
    },
  ];
}

export function generateTransactions(): Transaction[] {
  const types:    Transaction['type'][]   = ['mint', 'redeem', 'transfer', 'stake', 'claim'];
  const statuses: Transaction['status'][] = ['confirmed', 'confirmed', 'confirmed', 'pending', 'failed'];

  return Array.from({ length: 10 }, () => ({
    hash:        `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`,
    type:        types[Math.floor(Math.random() * types.length)],
    amount:      (Math.random() * 1000).toFixed(4),
    token:       ['LBKWH', 'LTC', 'ETH'][Math.floor(Math.random() * 3)],
    status:      statuses[Math.floor(Math.random() * statuses.length)],
    timestamp:   Date.now() - Math.floor(Math.random() * 7 * 24 * 3_600_000),
    gasUsed:     (Math.random() * 0.01).toFixed(6),
    blockNumber: 18_000_000 + Math.floor(Math.random() * 100_000),
  }));
}
