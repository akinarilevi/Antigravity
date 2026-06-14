'use client'

import { useEffect, useState } from 'react'

interface ScoreData {
  score: {
    totalScore: number
    rating: string
    breakdown: {
      assetGrowth: number
      cashflow: number
      growthRate: number
      achievementRate: number
      investmentEfficiency: number
      diversificationStability: number
    }
  }
  metrics: {
    currentAsset: number
    previousYearAsset: number
    assetGrowth: number
    cagr: string
    achievementRate: string
  }
}

export default function WealthScoreCard() {
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/portfolio/wealth-score')
        if (!res.ok) throw new Error('Failed to fetch wealth score')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div className="p-4">スコア計算中...</div>
  if (error) return <div className="p-4 text-red-600">エラー: {error}</div>
  if (!data) return null

  const { score, metrics } = data

  const ratingColors = {
    Excellent: 'bg-green-50 border-l-green-500',
    Good: 'bg-blue-50 border-l-blue-500',
    Fair: 'bg-yellow-50 border-l-yellow-500',
    Poor: 'bg-orange-50 border-l-orange-500',
    Critical: 'bg-red-50 border-l-red-500',
  }

  const ratingEmojis = {
    Excellent: '🌟',
    Good: '👍',
    Fair: '⚠️',
    Poor: '📉',
    Critical: '🚨',
  }

  const ratingColor =
    ratingColors[score.rating as keyof typeof ratingColors] || ratingColors.Fair
  const ratingEmoji = ratingEmojis[score.rating as keyof typeof ratingEmojis] || '❓'

  const ScoreBar = ({ value, max, label }: { value: number; max: number; label: string }) => {
    const percentage = (value / max) * 100
    return (
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-semibold">{label}</span>
          <span className="font-bold">{value}/{max}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6">Wealth Score - 資産形成スコア</h2>

      {/* スコア概要 */}
      <div className={`rounded-lg p-6 mb-6 border-l-4 ${ratingColor}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-600 mb-2">資産形成スコア</div>
            <div className="flex items-baseline gap-3">
              <div className="text-5xl font-bold">{score.totalScore}</div>
              <div className="text-2xl">/100</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-6xl">{ratingEmoji}</div>
            <div className="text-xl font-bold mt-2">{score.rating}</div>
          </div>
        </div>
      </div>

      {/* 成長指標 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">年間資産成長</div>
          <div className="text-2xl font-bold text-blue-600">
            ¥{(metrics.assetGrowth / 10000).toFixed(0)}万円
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">複合年間成長率(CAGR)</div>
          <div className="text-2xl font-bold text-green-600">{metrics.cagr}%</div>
        </div>
      </div>

      {/* 6軸の詳細スコア */}
      <div className="mb-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-6">評価項目</h3>

        <ScoreBar value={score.breakdown.assetGrowth} max={20} label="総資産成長" />
        <ScoreBar value={score.breakdown.cashflow} max={20} label="キャッシュフロー" />
        <ScoreBar value={score.breakdown.growthRate} max={20} label="資産成長率" />
        <ScoreBar value={score.breakdown.achievementRate} max={20} label="目標達成率" />
        <ScoreBar
          value={score.breakdown.investmentEfficiency}
          max={10}
          label="投資効率"
        />
        <ScoreBar
          value={score.breakdown.diversificationStability}
          max={10}
          label="分散維持"
        />
      </div>

      {/* 達成状況 */}
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
        <h3 className="font-bold text-purple-900 mb-3">資産形成進捗</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-600">現在資産</div>
            <div className="font-bold">¥{(metrics.currentAsset / 10000).toFixed(0)}万円</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">達成率</div>
            <div className="font-bold text-purple-600">{metrics.achievementRate}%</div>
          </div>
        </div>

        {/* プログレスバー */}
        <div className="mt-3">
          <div className="w-full bg-gray-300 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(parseFloat(metrics.achievementRate), 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
