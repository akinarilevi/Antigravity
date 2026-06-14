import type { TimePeriod, AssetId, AssetConfig } from './types';

export const ASSET_CONFIGS: Record<AssetId, AssetConfig> = {
  BTC: { id: 'BTC', label: 'Bitcoin', ticker: 'BTC', color: '#f97316' },
  SPY: { id: 'SPY', label: 'S&P 500', ticker: 'SPY', color: '#3b82f6' },
  ACWI: { id: 'ACWI', label: 'All Country', ticker: 'ACWI', color: '#10b981' },
  GLD: { id: 'GLD', label: 'Gold', ticker: 'GLD', color: '#f59e0b' },
  QQQ: { id: 'QQQ', label: 'NASDAQ', ticker: 'QQQ', color: '#8b5cf6' },
  TLT: { id: 'TLT', label: 'US Bonds', ticker: 'TLT', color: '#ef4444' },
  VNQ: { id: 'VNQ', label: 'REIT', ticker: 'VNQ', color: '#ec4899' },
};

interface YahooParams {
  range: string;
  interval: string;
}

export function periodToYahooParams(period: TimePeriod): YahooParams {
  const map: Record<TimePeriod, YahooParams> = {
    '1D': { range: '1d', interval: '5m' },
    '1W': { range: '5d', interval: '1h' },
    '1M': { range: '1mo', interval: '1d' },
    '3M': { range: '3mo', interval: '1d' },
    '6M': { range: '6mo', interval: '1d' },
    '1Y': { range: '1y', interval: '1d' },
    '5Y': { range: '5y', interval: '1wk' },
    'ALL': { range: 'max', interval: '1mo' },
  };
  return map[period];
}

const BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

export async function fetchYahooHistory(
  ticker: string,
  period: TimePeriod
): Promise<[number, number][]> {
  const { range, interval } = periodToYahooParams(period);
  const url = `${BASE}/${ticker}?interval=${interval}&range=${range}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Yahoo Finance error ${res.status} for ${ticker}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as any;

  const result = data.chart.result?.[0];
  if (!result) throw new Error(`No data from Yahoo Finance for ${ticker}`);

  const timestamps = result.timestamp as number[];
  const closes: (number | null)[] =
    result.indicators.adjclose?.[0]?.adjclose ??
    result.indicators.quote[0]?.close ??
    [];

  const pairs: [number, number][] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const price = closes[i];
    if (price !== null && price !== undefined && isFinite(price)) {
      pairs.push([timestamps[i] * 1000, price]);
    }
  }
  return pairs;
}

export async function fetchYahooRaw(
  ticker: string,
  range: string,
  interval: string
): Promise<[number, number][]> {
  const url = `${BASE}/${ticker}?interval=${interval}&range=${range}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Yahoo Finance error ${res.status} for ${ticker}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as any;

  const result = data.chart.result?.[0];
  if (!result) throw new Error(`No data from Yahoo Finance for ${ticker}`);

  const timestamps = result.timestamp as number[];
  const closes: (number | null)[] =
    result.indicators.adjclose?.[0]?.adjclose ??
    result.indicators.quote[0]?.close ??
    [];

  const pairs: [number, number][] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const price = closes[i];
    if (price !== null && price !== undefined && isFinite(price)) {
      pairs.push([timestamps[i] * 1000, price]);
    }
  }
  return pairs;
}
