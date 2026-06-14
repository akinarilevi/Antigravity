import { NextResponse } from 'next/server';
import { fetchYahooRaw, ASSET_CONFIGS } from '@/lib/yahoo';
import { fetchPriceHistory } from '@/lib/coingecko';
import type { MarketStatus, AssetReturn, AllocationSlice, RiskRegime, CrashRisk } from '@/lib/types';

interface MonthlyRow {
  monthKey: string;
  btc: number;
  spy: number;
  qqq: number;
  gld: number;
  tlt: number;
  vnq: number;
}

function toMonthKey(tsMs: number): string {
  const d = new Date(tsMs);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function downsampleBtcToMonthly(raw: [number, number][]): Map<string, number> {
  const byMonth = new Map<string, number>();
  for (const [ts, price] of raw) {
    const key = toMonthKey(ts);
    byMonth.set(key, price);
  }
  return byMonth;
}

function buildAlignedSeries(
  btcMonthly: Map<string, number>,
  spy: [number, number][],
  qqq: [number, number][],
  gld: [number, number][],
  tlt: [number, number][],
  vnq: [number, number][]
): MonthlyRow[] {
  const spyMap = new Map(spy.map(([ts, p]) => [toMonthKey(ts), p]));
  const qqqMap = new Map(qqq.map(([ts, p]) => [toMonthKey(ts), p]));
  const gldMap = new Map(gld.map(([ts, p]) => [toMonthKey(ts), p]));
  const tltMap = new Map(tlt.map(([ts, p]) => [toMonthKey(ts), p]));
  const vnqMap = new Map(vnq.map(([ts, p]) => [toMonthKey(ts), p]));

  const allKeys = [...spyMap.keys()].filter(
    (k) => btcMonthly.has(k) && qqqMap.has(k) && gldMap.has(k) && tltMap.has(k) && vnqMap.has(k)
  );
  allKeys.sort();

  return allKeys.map((k) => ({
    monthKey: k,
    btc: btcMonthly.get(k)!,
    spy: spyMap.get(k)!,
    qqq: qqqMap.get(k)!,
    gld: gldMap.get(k)!,
    tlt: tltMap.get(k)!,
    vnq: vnqMap.get(k)!,
  }));
}

function calcOneMonthReturn(current: number, prev: number): number {
  return (current / prev) - 1;
}

function calcScore(
  btcRet: number,
  qqqRet: number,
  spyRet: number,
  vnqRet: number,
  gldRet: number,
  tltRet: number
): number {
  const riskOn = (btcRet + qqqRet + spyRet + vnqRet) / 4;
  const riskOff = (gldRet + tltRet) / 2;
  const spread = riskOn - riskOff;
  return Math.min(100, Math.max(0, 50 + spread * 250));
}

function getRegime(score: number): RiskRegime {
  if (score > 65) return 'Risk On';
  if (score < 35) return 'Risk Off';
  return 'Neutral';
}

function getAllocation(regime: RiskRegime): AllocationSlice[] {
  if (regime === 'Risk On') {
    return [
      { label: 'BTC', pct: 15 },
      { label: 'NASDAQ', pct: 35 },
      { label: 'S&P500', pct: 25 },
      { label: 'REIT', pct: 10 },
      { label: '金', pct: 5 },
      { label: '現金', pct: 10 },
    ];
  }
  if (regime === 'Neutral') {
    return [
      { label: 'BTC', pct: 5 },
      { label: 'NASDAQ', pct: 20 },
      { label: 'S&P500', pct: 30 },
      { label: 'REIT', pct: 15 },
      { label: '金', pct: 15 },
      { label: '現金', pct: 15 },
    ];
  }
  return [
    { label: 'BTC', pct: 0 },
    { label: 'NASDAQ', pct: 10 },
    { label: 'S&P500', pct: 15 },
    { label: 'REIT', pct: 5 },
    { label: '金', pct: 30 },
    { label: '米国債', pct: 30 },
    { label: '現金', pct: 10 },
  ];
}

function runBacktest(aligned: MonthlyRow[], currentScore: number) {
  const TOLERANCE = 10;
  const n = aligned.length;
  let matchCount = 0;
  let win1M = 0,
    win3M = 0,
    win6M = 0,
    win12M = 0;
  let valid1M = 0,
    valid3M = 0,
    valid6M = 0,
    valid12M = 0;

  for (let i = 1; i < n - 1; i++) {
    const btcRet = calcOneMonthReturn(aligned[i].btc, aligned[i - 1].btc);
    const qqqRet = calcOneMonthReturn(aligned[i].qqq, aligned[i - 1].qqq);
    const spyRet = calcOneMonthReturn(aligned[i].spy, aligned[i - 1].spy);
    const vnqRet = calcOneMonthReturn(aligned[i].vnq, aligned[i - 1].vnq);
    const gldRet = calcOneMonthReturn(aligned[i].gld, aligned[i - 1].gld);
    const tltRet = calcOneMonthReturn(aligned[i].tlt, aligned[i - 1].tlt);
    const histScore = calcScore(btcRet, qqqRet, spyRet, vnqRet, gldRet, tltRet);

    if (Math.abs(histScore - currentScore) > TOLERANCE) continue;

    matchCount++;

    if (i + 1 < n) {
      valid1M++;
      if (aligned[i + 1].spy > aligned[i].spy) win1M++;
    }
    if (i + 3 < n) {
      valid3M++;
      if (aligned[i + 3].spy > aligned[i].spy) win3M++;
    }
    if (i + 6 < n) {
      valid6M++;
      if (aligned[i + 6].spy > aligned[i].spy) win6M++;
    }
    if (i + 12 < n) {
      valid12M++;
      if (aligned[i + 12].spy > aligned[i].spy) win12M++;
    }
  }

  return {
    matchingMonths: matchCount,
    winRate1M: valid1M > 0 ? win1M / valid1M : 0,
    winRate3M: valid3M > 0 ? win3M / valid3M : 0,
    winRate6M: valid6M > 0 ? win6M / valid6M : 0,
    winRate12M: valid12M > 0 ? win12M / valid12M : 0,
  };
}

async function calcCrashRisk(
  aligned: MonthlyRow[],
  currentScore: number,
  btcRaw: [number, number][]
): Promise<CrashRisk> {
  const n = aligned.length;

  if (n >= 3) {
    const prevBtcRet = calcOneMonthReturn(aligned[n - 2].btc, aligned[n - 3].btc);
    const prevQqqRet = calcOneMonthReturn(aligned[n - 2].qqq, aligned[n - 3].qqq);
    const prevSpyRet = calcOneMonthReturn(aligned[n - 2].spy, aligned[n - 3].spy);
    const prevVnqRet = calcOneMonthReturn(aligned[n - 2].vnq, aligned[n - 3].vnq);
    const prevGldRet = calcOneMonthReturn(aligned[n - 2].gld, aligned[n - 3].gld);
    const prevTltRet = calcOneMonthReturn(aligned[n - 2].tlt, aligned[n - 3].tlt);
    const prevScore = calcScore(prevBtcRet, prevQqqRet, prevSpyRet, prevVnqRet, prevGldRet, prevTltRet);
    const scoreDrop = prevScore - currentScore;

    if (scoreDrop > 20) return '暴落リスク高';
    if (scoreDrop > 10) return '暴落リスク中';
  }

  const threeMonthsAgoMs = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recent = btcRaw.filter(([ts]) => ts >= threeMonthsAgoMs);
  if (recent.length > 0) {
    const high3M = Math.max(...recent.map(([, p]) => p));
    const currentBtc = btcRaw[btcRaw.length - 1][1];
    if (currentBtc < high3M * 0.7) return '暴落リスク高';
  }

  return '暴落リスク低';
}

export async function GET() {
  try {
    // CoinGecko free API is limited to 365 days max
    const [btcRaw, spyRaw, qqqRaw, gldRaw, tltRaw, vnqRaw] = await Promise.all([
      fetchPriceHistory(365),
      fetchYahooRaw('SPY', 'max', '1mo'),
      fetchYahooRaw('QQQ', 'max', '1mo'),
      fetchYahooRaw('GLD', 'max', '1mo'),
      fetchYahooRaw('TLT', 'max', '1mo'),
      fetchYahooRaw('VNQ', 'max', '1mo'),
    ]);

    const btcMonthly = downsampleBtcToMonthly(btcRaw);
    const aligned = buildAlignedSeries(btcMonthly, spyRaw, qqqRaw, gldRaw, tltRaw, vnqRaw);

    if (aligned.length < 3) {
      return NextResponse.json({ error: 'Insufficient data' }, { status: 500 });
    }

    const n = aligned.length;
    const prev = aligned[n - 2];
    const curr = aligned[n - 1];

    const btcRet1M = calcOneMonthReturn(curr.btc, prev.btc);
    const qqqRet1M = calcOneMonthReturn(curr.qqq, prev.qqq);
    const spyRet1M = calcOneMonthReturn(curr.spy, prev.spy);
    const vnqRet1M = calcOneMonthReturn(curr.vnq, prev.vnq);
    const gldRet1M = calcOneMonthReturn(curr.gld, prev.gld);
    const tltRet1M = calcOneMonthReturn(curr.tlt, prev.tlt);

    const currentScore = calcScore(btcRet1M, qqqRet1M, spyRet1M, vnqRet1M, gldRet1M, tltRet1M);
    const regime = getRegime(currentScore);

    const assetRankings: AssetReturn[] = [
      { assetId: 'BTC' as const, label: 'Bitcoin', oneMonthReturn: btcRet1M },
      { assetId: 'QQQ' as const, label: 'NASDAQ', oneMonthReturn: qqqRet1M },
      { assetId: 'SPY' as const, label: 'S&P 500', oneMonthReturn: spyRet1M },
      { assetId: 'VNQ' as const, label: 'REIT', oneMonthReturn: vnqRet1M },
      { assetId: 'GLD' as const, label: 'Gold', oneMonthReturn: gldRet1M },
      { assetId: 'TLT' as const, label: 'US Bonds', oneMonthReturn: tltRet1M },
    ].sort((a, b) => b.oneMonthReturn - a.oneMonthReturn);

    const allocation = getAllocation(regime);
    const backtest = runBacktest(aligned, currentScore);
    const crashRisk = await calcCrashRisk(aligned, currentScore, btcRaw);

    const status: MarketStatus = {
      score: Math.round(currentScore),
      regime,
      assetRankings,
      allocation,
      backtest,
      crashRisk,
      calculatedAt: Date.now(),
    };

    return NextResponse.json(status, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Market status error:', msg);
    return NextResponse.json({ error: 'Calculation failed', details: msg }, { status: 500 });
  }
}
