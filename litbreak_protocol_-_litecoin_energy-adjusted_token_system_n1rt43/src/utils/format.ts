export const formatNumber = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatCurrency = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatLTC = (litoshi: number): string => {
  const ltc = litoshi / 1e8;
  return `${formatNumber(ltc, 8)} LTC`;
};

export const formatLBT = (amount: number): string => {
  return `${formatNumber(amount, 4)} LBT`;
};

export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const litoshiToLtc = (litoshi: number): number => litoshi / 1e8;
export const ltcToLitoshi = (ltc: number): number => ltc * 1e8;

export const kWhToLitoshi = (kWh: number, electricityRate: number, ltcPrice: number): number => {
  // Cost in USD = kWh * rate (cents) / 100
  const costUsd = (kWh * electricityRate) / 100;
  // LTC equivalent = costUsd / ltcPrice
  const ltc = costUsd / ltcPrice;
  return ltcToLitoshi(ltc);
};

export const litoshiToKWh = (litoshi: number, electricityRate: number, ltcPrice: number): number => {
  const ltc = litoshiToLtc(litoshi);
  const costUsd = ltc * ltcPrice;
  // kWh = costUsd / (rate in dollars)
  return costUsd / (electricityRate / 100);
};
