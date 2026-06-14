'use client';

import { useState, useEffect } from 'react';
import type { MarketStatus, RiskRegime, CrashRisk } from '@/lib/types';

function ScoreBar({ score }: { score: number }) {
  const color = score >= 65 ? '#22c55e' : score >= 35 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
        style={{ width: `${score}%`, backgroundColor: color }}
      />
    </div>
  );
}

function RegimeBadge({ regime }: { regime: RiskRegime }) {
  const styles = {
    'Risk On': 'bg-green-100 text-green-700',
    'Neutral': 'bg-yellow-100 text-yellow-700',
    'Risk Off': 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[regime]}`}>
      {regime}
    </span>
  );
}

function CrashBadge({ risk }: { risk: CrashRisk }) {
  const styles: Record<CrashRisk, string> = {
    '暴落リスク低': 'bg-green-100 text-green-700',
    '暴落リスク中': 'bg-yellow-100 text-yellow-700',
    '暴落リスク高': 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[risk]}`}>
      {risk}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5 animate-pulse">
      <div className="h-5 w-24 bg-gray-200 rounded" />
      <div className="flex items-center gap-4">
        <div className="h-8 w-28 bg-gray-200 rounded-full" />
        <div className="h-5 w-20 bg-gray-200 rounded ml-auto" />
      </div>
      <div className="h-3 bg-gray-200 rounded-full" />
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MarketStatusDashboard() {
  const [status, setStatus] = useState<MarketStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/market-status')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data: MarketStatus) => setStatus(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (error || !status) {
    return (
      <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
        <p className="text-sm text-red-500">市場状態の取得に失敗しました</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
      <h2 className="text-base font-semibold text-gray-800">市場状態</h2>

      <div className="flex items-center gap-4 flex-wrap">
        <RegimeBadge regime={status.regime} />
        <div className="ml-auto text-right">
          <span className="text-sm text-gray-500">スコア </span>
          <span className="text-xl font-bold text-gray-900">{status.score}</span>
          <span className="text-sm text-gray-500">/100</span>
        </div>
      </div>
      <ScoreBar score={status.score} />

      <div className="grid grid-cols-2 gap-6 pt-1">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">資産ランキング</p>
          <ol className="space-y-1.5">
            {status.assetRankings.map((r, i) => {
              const positive = r.oneMonthReturn >= 0;
              return (
                <li key={r.assetId} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400 w-5">{i + 1}位</span>
                  <span className="font-medium text-gray-800 flex-1">{r.label}</span>
                  <span className={positive ? 'text-green-600' : 'text-red-500'}>
                    {positive ? '+' : ''}{(r.oneMonthReturn * 100).toFixed(1)}%
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">推奨配分</p>
          <ul className="space-y-1.5">
            {status.allocation.map((a) => (
              <li key={a.label} className="text-sm">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-gray-800 w-16">{a.label}</span>
                  <span className="text-gray-500 text-xs ml-auto">{a.pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded-full"
                    style={{ width: `${a.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">過去データ</p>
        <div className="grid grid-cols-2 gap-y-1.5 text-sm">
          <span className="text-gray-600">同条件発生回数</span>
          <span className="font-medium text-gray-900 text-right">{status.backtest.matchingMonths}回</span>
          <span className="text-gray-600">1ヶ月後勝率</span>
          <span className="font-medium text-gray-900 text-right">{(status.backtest.winRate1M * 100).toFixed(0)}%</span>
          <span className="text-gray-600">3ヶ月後勝率</span>
          <span className="font-medium text-gray-900 text-right">{(status.backtest.winRate3M * 100).toFixed(0)}%</span>
          <span className="text-gray-600">6ヶ月後勝率</span>
          <span className="font-medium text-gray-900 text-right">{(status.backtest.winRate6M * 100).toFixed(0)}%</span>
          <span className="text-gray-600">12ヶ月後勝率</span>
          <span className="font-medium text-gray-900 text-right">{(status.backtest.winRate12M * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
        <span className="text-sm text-gray-600">警告</span>
        <CrashBadge risk={status.crashRisk} />
      </div>
    </div>
  );
}
