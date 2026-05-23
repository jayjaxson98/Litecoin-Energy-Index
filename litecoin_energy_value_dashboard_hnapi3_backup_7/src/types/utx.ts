export type TimeRange = '1H' | '4H' | '24H' | '7D' | '30D' | '90D';

export interface PricePoint {
  time: number;
  price: number;
  volume?: number;
}

export interface EnergyIndex {
  value: number;
  change24h: number;
  changePercent: number;
  hashRate: number;
  difficulty: number;
  blockReward: number;
  networkFee: number;
  energyCost: number;
}
