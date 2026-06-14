'use client'

import { useEffect, useState } from 'react'
import { formatJpyReadable } from '@/lib/format'

interface GrowthData {
  daily: {
    totalGrowth: number
    breakdown: {
      btcPrice: number
      nasdaqPrice: number
      sp500Price: number
      goldPrice: number
      businessProfit: number
      fxGain: number
      dividends: number
    }
    contributors: Array<{
      assetClass: string
      amount: number
      percentage: number
      type: string
    }>
  }
  periods: {
    monthly: { totalGrowth: number; period: string }
    yearly: { totalGrowth: number; period: string }
    cumulative: { totalGrowth: number; period: string }
  }
  metadata: {
    currentAsset: number
    holdingsCount: number
  }
}

export default function AssetGrowthAttributionCard() {
  const [data, setData] = useState<GrowthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/assets/growth-attribution')
        if (!res.ok) throw new Error('Failed to fetch growth attribution')
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

  if (loading) return <div className="p-4">分析中...</div>
  if (error) return <div className="p-4 text-red-600">エラー: {error}</div>
  if (!data) return null

  const { daily, periods, metadata } = data
  const { totalGrowth, contributors } = daily

  const growthColor = totalGrowth >= 0 ? 'text-green-600' : 'text-red-600'
  const growthBg = totalGrowth >= 0 ? 'bg-green-50' : 'bg-red-50'

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6">資産増加の要因分析</h2>

      {/* 本日の成長サマリー */}
      <div className={`rounded-lg p-6 mb-6 border-l-4 ${growthBg} border-l-green-500`}>
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-gray-600 mb-2">本日の資産増加</div>
            <div className={`text-3xl font-bold ${growthColor}`}>
              {totalGrowth >= 0 ? '+' : ''}
              {formatJpyReadable(totalGrowth)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">月間</div>
            <div className="text-xl font-bold text-blue-600">
              {formatJpyReadable(periods.monthly.totalGrowth)}
            </div>
          </div>
        </div>
      </div>

      {/* 増加要因の内訳 */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-4">増加要因の内訳</h3>
        <div className="space-y-2">
          {contributors.slice(0, 5).map((contrib, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex-1">
                <div className="font-semibold">{contrib.assetClass}</div>
                <div className="text-sm text-gray-600">
                  {contrib.type === 'price' && '価格変動'}
                  {contrib.type === 'contribution' && '投資額'}
                  {contrib.type === 'fx' && '為替差益'}
                  {contrib.type === 'dividend' && '配当金'}
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${contrib.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {contrib.amount >= 0 ? '+' : ''}
                  {formatJpyReadable(contrib.amount)}
                </div>
                <div className="text-sm text-gray-600">{contrib.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 期間別サマリー */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">月間増加</div>
          <div className="text-lg font-bold text-blue-600">
            {formatJpyReadable(periods.monthly.totalGrowth)}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-500">
          <div className="text-sm text-gray-600 mb-1">年間増加</div>
          <div className="text-lg font-bold text-purple-600">
            {formatJpyReadable(periods.yearly.totalGrowth)}
          </div>
        </div>
        <div className="bg-indigo-50 p-4 rounded border-l-4 border-indigo-500">
          <div className="text-sm text-gray-600 mb-1">累計増加</div>
          <div className="text-lg font-bold text-indigo-600">
            {formatJpyReadable(periods.cumulative.totalGrowth)}
          </div>
        </div>
      </div>
    </div>
  )
}
