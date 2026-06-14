export type TimePeriod = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface BitcoinPrice {
  usd: number;
  usd_24h_change: number;
  last_updated_at: number;
}

export type AlertDirection = 'above' | 'below';

export interface PriceAlert {
  id: string;
  targetPrice: number;
  direction: AlertDirection;
  createdAt: number;
  triggered: boolean;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export type AssetId = 'BTC' | 'SPY' | 'ACWI' | 'GLD' | 'QQQ' | 'TLT' | 'VNQ';

export interface AssetConfig {
  id: AssetId;
  label: string;
  ticker: string;
  color: string;
}

export interface AssetSeries {
  assetId: AssetId;
  points: PricePoint[];
}

export type RiskRegime = 'Risk On' | 'Neutral' | 'Risk Off';
export type CrashRisk = '暴落リスク低' | '暴落リスク中' | '暴落リスク高';

export interface AssetReturn {
  assetId: AssetId;
  label: string;
  oneMonthReturn: number;
}

export interface AllocationSlice {
  label: string;
  pct: number;
}

export interface BacktestResult {
  matchingMonths: number;
  winRate1M: number;
  winRate3M: number;
  winRate6M: number;
  winRate12M: number;
}

export interface MarketStatus {
  score: number;
  regime: RiskRegime;
  assetRankings: AssetReturn[];
  allocation: AllocationSlice[];
  backtest: BacktestResult;
  crashRisk: CrashRisk;
  calculatedAt: number;
}
