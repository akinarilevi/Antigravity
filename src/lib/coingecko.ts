import type { TimePeriod } from './types';

const BASE = 'https://api.coingecko.com/api/v3';

export function periodToDays(period: TimePeriod): number | 'max' {
  const map: Record<TimePeriod, number | 'max'> = {
    '1D': 1,
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '6M': 180,
    '1Y': 365,
    '5Y': 1825,
    'ALL': 'max',
  };
  return map[period];
}

export async function fetchCurrentPrice(): Promise<number> {
  const url = `${BASE}/simple/price?ids=bitcoin&vs_currencies=usd&include_last_updated_at=true`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  const data = await res.json();
  return data.bitcoin.usd as number;
}

export async function fetchPriceHistory(days: number | 'max'): Promise<[number, number][]> {
  const url = `${BASE}/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  const data = await res.json();
  return data.prices as [number, number][];
}
