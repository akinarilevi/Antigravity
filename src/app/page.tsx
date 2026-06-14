'use client';

import { useState, useEffect, useCallback } from 'react';
import CurrentPrice from '@/components/CurrentPrice';
import MultiAssetChart from '@/components/MultiAssetChart';
import AssetSelector from '@/components/AssetSelector';
import PeriodSelector from '@/components/PeriodSelector';
import PriceAlertPanel from '@/components/PriceAlertPanel';
import MarketStatusDashboard from '@/components/MarketStatusDashboard';
import { TotalAssetCard } from '@/components/TotalAssetCard';
import { MorningReport } from '@/components/MorningReport';
import { PortfolioHistoryChart } from '@/components/PortfolioHistoryChart';
import { AssetBreakdown } from '@/components/AssetBreakdown';
import { HoldingsManager } from '@/components/HoldingsManager';
import { HealthDiagnosis } from '@/components/HealthDiagnosis';
import { GoalTracker } from '@/components/GoalTracker';
import { ExchangeRateCard } from '@/components/ExchangeRateCard';
import { CashflowEngine } from '@/components/CashflowEngine';
import { WealthProjectionChart } from '@/components/WealthProjectionChart';
import GoalGapAnalysisCard from '@/components/GoalGapAnalysisCard';
import GoalCoachReportCard from '@/components/GoalCoachReportCard';
import FutureWealthTimelineCard from '@/components/FutureWealthTimelineCard';
import AssetGrowthAttributionCard from '@/components/AssetGrowthAttributionCard';
import AssetContributionRankingCard from '@/components/AssetContributionRankingCard';
import PortfolioScoreCard from '@/components/PortfolioScoreCard';
import MarketCycleCard from '@/components/MarketCycleCard';
import WealthScoreCard from '@/components/WealthScoreCard';
import LifeEventSimulationCard from '@/components/LifeEventSimulationCard';
import type { TimePeriod, PricePoint, AssetId, AssetSeries } from '@/lib/types';

const DEFAULT_ACTIVE: AssetId[] = ['BTC'];

interface PortfolioSummary {
  totalJpy: number;
  prevDayJpy: number | null;
  prevWeekJpy: number | null;
  prevMonthJpy: number | null;
  yearStartJpy: number | null;
  purchaseCostJpy: number;
  holdings: Array<{
    id: string;
    ticker: string;
    name: string;
    quantity: number;
    valueJpy: number;
    purchaseCostJpy: number | null;
    priceSource: string;
    assetClass: string;
  }>;
  usdJpy: number;
  calculatedAt: number;
}

export default function Home() {
  const [price, setPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('1M');
  const [activeAssets, setActiveAssets] = useState<Set<AssetId>>(new Set(DEFAULT_ACTIVE));
  const [assetSeries, setAssetSeries] = useState<Map<AssetId, PricePoint[]>>(new Map());
  const [assetLoading, setAssetLoading] = useState<Map<AssetId, boolean>>(new Map());
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch('/api/bitcoin/price');
      const data = await res.json();
      setPrice(data.price);
    } catch {
      // silent
    } finally {
      setPriceLoading(false);
    }
  }, []);

  const fetchPortfolioSummary = useCallback(async () => {
    setPortfolioLoading(true);
    try {
      const res = await fetch('/api/portfolio/summary');
      if (res.ok) {
        const data = await res.json();
        setPortfolioSummary(data);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio summary:', error);
    } finally {
      setPortfolioLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    fetchPortfolioSummary();
    const priceId = setInterval(fetchPrice, 30_000);
    const portfolioId = setInterval(fetchPortfolioSummary, 60_000);
    return () => {
      clearInterval(priceId);
      clearInterval(portfolioId);
    };
  }, [fetchPrice, fetchPortfolioSummary]);

  const fetchAsset = useCallback(async (assetId: AssetId, currentPeriod: TimePeriod) => {
    setAssetLoading((prev) => new Map(prev).set(assetId, true));
    try {
      const url = assetId === 'BTC'
        ? `/api/bitcoin/history?period=${currentPeriod}`
        : `/api/assets/${assetId}/history?period=${currentPeriod}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const points: PricePoint[] = (data.prices as [number, number][]).map(
        ([ts, p]) => ({ timestamp: ts, price: p })
      );
      setAssetSeries((prev) => new Map(prev).set(assetId, points));
    } catch {
      setAssetSeries((prev) => {
        const next = new Map(prev);
        next.delete(assetId);
        return next;
      });
    } finally {
      setAssetLoading((prev) => new Map(prev).set(assetId, false));
    }
  }, []);

  useEffect(() => {
    for (const id of activeAssets) {
      fetchAsset(id, period);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const handleToggle = useCallback((id: AssetId) => {
    setActiveAssets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        fetchAsset(id, period);
      }
      return next;
    });
  }, [fetchAsset, period]);

  useEffect(() => {
    fetchAsset('BTC', period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSeries: AssetSeries[] = Array.from(activeAssets)
    .filter((id) => assetSeries.has(id))
    .map((id) => ({ assetId: id, points: assetSeries.get(id)! }));

  const chartLoading = Array.from(activeAssets).some(
    (id) => assetLoading.get(id) === true
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <span className="text-2xl">₿</span>
          <h1 className="text-xl font-bold text-gray-900">Bitcoin Tracker</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* 為替レート表示（常時更新） */}
        <ExchangeRateCard />

        {/* Goal-Based Wealth OS: Goal Tracker (最優先) */}
        <GoalTracker />

        {/* Goal-Based Wealth OS: Cash Flow Engine */}
        <CashflowEngine />

        {/* Goal-Based Wealth OS: Wealth Projection */}
        <WealthProjectionChart />

        {/* Goal-Based Wealth OS: Wave 1 Features */}
        <GoalGapAnalysisCard targetAge={35} />
        <GoalCoachReportCard targetAge={35} />
        <FutureWealthTimelineCard endAge={50} />

        {/* Goal-Based Wealth OS: Wave 2 Features */}
        <PortfolioScoreCard />
        <AssetGrowthAttributionCard />
        <AssetContributionRankingCard defaultPeriod="monthly" />

        {/* Goal-Based Wealth OS: Wave 3 Features */}
        <MarketCycleCard />
        <WealthScoreCard />

        {/* Goal-Based Wealth OS: Wave 4 Features */}
        <LifeEventSimulationCard />

        {/* Personal Wealth OS Phase 1 */}
        <MorningReport />

        {portfolioSummary && (
          <TotalAssetCard
            totalJpy={portfolioSummary.totalJpy}
            prevDayJpy={portfolioSummary.prevDayJpy}
            prevWeekJpy={portfolioSummary.prevWeekJpy}
            prevMonthJpy={portfolioSummary.prevMonthJpy}
          />
        )}

        <PortfolioHistoryChart />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {portfolioSummary && (
            <AssetBreakdown holdings={portfolioSummary.holdings} totalJpy={portfolioSummary.totalJpy} />
          )}
          <HoldingsManager onUpdated={fetchPortfolioSummary} />
        </div>

        {portfolioSummary && (
          <HealthDiagnosis holdings={portfolioSummary.holdings} totalJpy={portfolioSummary.totalJpy} />
        )}

        {/* Bitcoin Tracker (Existing) */}
        <MarketStatusDashboard />

        <CurrentPrice price={price} loading={priceLoading} />

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-semibold text-gray-800">Performance Comparison</h2>
            <PeriodSelector selected={period} onChange={setPeriod} />
          </div>
          <AssetSelector active={activeAssets} onToggle={handleToggle} />
          <MultiAssetChart series={activeSeries} period={period} loading={chartLoading} />
        </div>

        <PriceAlertPanel currentPrice={price} />
      </main>
    </div>
  );
}
