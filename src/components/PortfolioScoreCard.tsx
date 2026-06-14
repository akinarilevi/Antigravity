'use client'

import { useEffect, useState } from 'react'

interface ScoreData {
  score: {
    totalScore: number
    rating: string
    breakdown: {
      expectedReturn: number
      diversification: number
      liquidity: number
      volatilityManagement: number
      drawdownResistance: number
      goalAlignment: number
    }
    improvementSuggestions: string[]
  }
  metrics: {
    totalAsset: number
    assetClassCount: number
    cashPercentage: string
    maxDrawdown: string
  }
}

export default function PortfolioScoreCard() {
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/portfolio/score')
        if (!res.ok) throw new Error('Failed to fetch portfolio score')
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

  const ratingColor = ratingColors[score.rating as keyof typeof ratingColors] || ratingColors.Fair
  const ratingEmoji = ratingEmojis[score.rating as keyof typeof ratingEmojis] || '❓'

  // スコアバーを描画
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
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6">ポートフォリオスコア</h2>

      {/* スコア概要 */}
      <div className={`rounded-lg p-6 mb-6 border-l-4 ${ratingColor}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-600 mb-2">総合スコア</div>
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

      {/* 6軸の詳細スコア */}
      <div className="mb-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-6">評価項目</h3>

        <ScoreBar value={score.breakdown.expectedReturn} max={20} label="期待リターン" />
        <ScoreBar value={score.breakdown.diversification} max={20} label="分散性" />
        <ScoreBar value={score.breakdown.liquidity} max={15} label="流動性" />
        <ScoreBar value={score.breakdown.volatilityManagement} max={15} label="ボラティリティ管理" />
        <ScoreBar value={score.breakdown.drawdownResistance} max={15} label="ドローダウン耐性" />
        <ScoreBar value={score.breakdown.goalAlignment} max={15} label="目標適合性" />
      </div>

      {/* メトリクス表示 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-600 mb-1">資産クラス数</div>
          <div className="text-2xl font-bold">{metrics.assetClassCount}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-600 mb-1">現金比率</div>
          <div className="text-2xl font-bold">{metrics.cashPercentage}%</div>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-600 mb-1">最大ドローダウン</div>
          <div className="text-2xl font-bold text-red-600">{metrics.maxDrawdown}%</div>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-600 mb-1">総資産</div>
          <div className="text-lg font-bold">
            ¥{(metrics.totalAsset / 10000).toFixed(0)}万円
          </div>
        </div>
      </div>

      {/* 改善提案 */}
      {score.improvementSuggestions.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <h3 className="font-bold mb-3 text-blue-900">改善提案</h3>
          <ul className="space-y-2">
            {score.improvementSuggestions.map((suggestion, idx) => (
              <li key={idx} className="text-sm text-blue-900 flex gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
