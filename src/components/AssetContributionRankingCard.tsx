'use client'

import { useEffect, useState } from 'react'
import { formatJpyReadable } from '@/lib/format'

interface ContributionRank {
  rank: number
  assetClass: string
  contributionAmount: number
  percentage: number
  type: string
}

interface RankingData {
  requested: {
    period: string
    totalContribution: number
    rankings: ContributionRank[]
    topThree: ContributionRank[]
  }
  allPeriods: {
    monthly: {
      period: string
      totalContribution: number
      rankings: ContributionRank[]
    }
    yearly: {
      period: string
      totalContribution: number
      rankings: ContributionRank[]
    }
    cumulative: {
      period: string
      totalContribution: number
      rankings: ContributionRank[]
    }
  }
}

export default function AssetContributionRankingCard({ defaultPeriod = 'monthly' }: { defaultPeriod?: string }) {
  const [data, setData] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly' | 'cumulative'>(
    (defaultPeriod as any) || 'monthly'
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/assets/contribution-ranking?period=${selectedPeriod}`)
        if (!res.ok) throw new Error('Failed to fetch contribution ranking')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedPeriod])

  if (loading) return <div className="p-4">ランキング計算中...</div>
  if (error) return <div className="p-4 text-red-600">エラー: {error}</div>
  if (!data) return null

  const ranking = data.allPeriods[selectedPeriod]
  const totalContribution = ranking.totalContribution

  const periodLabels = {
    monthly: '月間',
    yearly: '年間',
    cumulative: '累計',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6">資産別貢献度ランキング</h2>

      {/* 期間選択ボタン */}
      <div className="flex gap-3 mb-6">
        {(['monthly', 'yearly', 'cumulative'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded font-semibold transition ${
              selectedPeriod === period
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {periodLabels[period]}
          </button>
        ))}
      </div>

      {/* 合計貢献額 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg mb-6 border-l-4 border-purple-500">
        <div className="text-sm text-gray-600 mb-2">{periodLabels[selectedPeriod]}合計貢献額</div>
        <div className="text-3xl font-bold text-purple-600">
          {formatJpyReadable(totalContribution)}
        </div>
      </div>

      {/* ランキング表示 */}
      <div className="space-y-3">
        {ranking.rankings.slice(0, 10).map((rank) => {
          const color = getRankingColor(rank.rank)
          const isPositive = rank.contributionAmount >= 0

          return (
            <div key={rank.rank} className={`p-4 rounded-lg border-l-4 ${color}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-sm">
                    {rank.rank}
                  </div>
                  <div>
                    <div className="font-bold">{rank.assetClass}</div>
                    <div className="text-xs text-gray-600">
                      {rank.type === 'price' && '価格変動'}
                      {rank.type === 'contribution' && '投資額'}
                      {rank.type === 'fx' && '為替差益'}
                      {rank.type === 'dividend' && '配当金'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-bold text-lg ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {formatJpyReadable(rank.contributionAmount)}
                  </div>
                  <div className="text-sm text-gray-600">{rank.percentage.toFixed(1)}%</div>
                </div>
              </div>

              {/* プログレスバー */}
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${getProgressBarColor(rank.type)}`}
                  style={{ width: `${Math.abs(rank.percentage)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Top 3 ハイライト */}
      {ranking.rankings.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-bold mb-4">Top 3 資産</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ranking.rankings
              .filter((r) => r.rank <= 3)
              .map((rank) => (
                <div
                  key={rank.rank}
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg border-2 border-yellow-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-3xl">{'🥇🥈🥉'[rank.rank - 1]}</div>
                    <div className="text-xs font-bold text-gray-600">第{rank.rank}位</div>
                  </div>
                  <div className="font-bold text-lg mb-1">{rank.assetClass}</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatJpyReadable(rank.contributionAmount)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getRankingColor(rank: number): string {
  if (rank === 1) return 'bg-yellow-50 border-yellow-500'
  if (rank === 2) return 'bg-gray-100 border-gray-500'
  if (rank === 3) return 'bg-orange-50 border-orange-500'
  return 'bg-gray-50 border-gray-300'
}

function getProgressBarColor(type: string): string {
  if (type === 'price') return 'bg-blue-500'
  if (type === 'contribution') return 'bg-green-500'
  if (type === 'fx') return 'bg-purple-500'
  return 'bg-orange-500'
}
