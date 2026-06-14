'use client'

import { useEffect, useState } from 'react'
import { formatJpyReadable } from '@/lib/format'

interface WealthProjectionData {
  age: number
  year: number
  projectedAsset: number
  capitalContribution: number
  investmentGain: number
}

interface TimelineData {
  projections: WealthProjectionData[]
  metadata: {
    userId: string
    currentAge: number
    currentAsset: number
    annualAddableInvestment: number
    expectedReturn: number
  }
}

export default function FutureWealthTimelineCard({ endAge = 50 }: { endAge?: number }) {
  const [data, setData] = useState<TimelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjections = async () => {
      try {
        const res = await fetch(`/api/wealth-projection?endAge=${endAge}`)
        if (!res.ok) throw new Error('Failed to fetch projections')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchProjections()
  }, [endAge])

  if (loading) return <div className="p-4">予測中...</div>
  if (error) return <div className="p-4 text-red-600">エラー: {error}</div>
  if (!data) return null

  const { projections, metadata } = data

  // 5年ごとのデータポイントを取得
  const displayPoints = projections.filter(
    (p) => p.age === metadata.currentAge || p.age % 5 === 0 || p.age === endAge
  )

  // グラフの最大値
  const maxAsset = Math.max(...projections.map((p) => p.projectedAsset))
  const graphHeight = 200

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-2xl font-bold mb-2">将来資産予測タイムライン</h2>
      <p className="text-sm text-gray-600 mb-6">
        年間投資: ¥{(metadata.annualAddableInvestment / 10000).toFixed(0)}万円
        / 期待利回り: {metadata.expectedReturn}%
      </p>

      {/* グラフエリア */}
      <div className="bg-gray-50 p-6 rounded mb-6">
        <div className="relative" style={{ height: `${graphHeight}px` }}>
          {/* グリッドライン */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <div
              key={pct}
              className="absolute w-full border-b border-gray-300"
              style={{
                bottom: `${pct * 100}%`,
                opacity: pct === 0 || pct === 1 ? 1 : 0.3,
              }}
            />
          ))}

          {/* Y軸ラベル */}
          <div className="absolute -left-20 top-0 h-full flex flex-col justify-between text-xs text-gray-600">
            <div>{formatJpyReadable(maxAsset)}</div>
            <div></div>
            <div>{formatJpyReadable(maxAsset / 2)}</div>
            <div></div>
            <div>¥0</div>
          </div>

          {/* 棒グラフ */}
          <div className="flex items-end h-full gap-2 justify-around">
            {displayPoints.map((point, idx) => {
              const height = (point.projectedAsset / maxAsset) * 100
              const gainPct = (point.investmentGain / point.projectedAsset) * 100

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-1"
                  title={`${point.age}歳: ${formatJpyReadable(point.projectedAsset)}`}
                >
                  {/* スタックバー（資本 + 利益） */}
                  <div className="w-full flex flex-col-reverse bg-gray-200 rounded relative group hover:opacity-75 cursor-pointer"
                    style={{
                      height: `${height}%`,
                      minHeight: '4px',
                    }}>
                    {/* 投資利益部分（緑） */}
                    <div
                      className="bg-green-400 w-full"
                      style={{ height: `${gainPct}%` }}
                    />
                    {/* 資本部分（青） */}
                    <div className="bg-blue-400 w-full flex-1" />

                    {/* ホバーツールチップ */}
                    <div className="hidden group-hover:block absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      <div className="font-bold">{point.age}歳</div>
                      <div>{formatJpyReadable(point.projectedAsset)}</div>
                      <div className="text-gray-300 text-xs">
                        資本: {formatJpyReadable(point.capitalContribution)} / 利益: {formatJpyReadable(point.investmentGain)}
                      </div>
                    </div>
                  </div>

                  {/* X軸ラベル */}
                  <div className="text-xs font-semibold text-gray-700 mt-2">
                    {point.age}歳
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 凡例 */}
      <div className="flex gap-6 justify-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-400 rounded" />
          <span className="text-sm">資本投下</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-400 rounded" />
          <span className="text-sm">投資利益</span>
        </div>
      </div>

      {/* 詳細テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">年齢</th>
              <th className="px-4 py-2 text-right font-semibold">予測資産</th>
              <th className="px-4 py-2 text-right font-semibold">資本投下</th>
              <th className="px-4 py-2 text-right font-semibold">投資利益</th>
            </tr>
          </thead>
          <tbody>
            {displayPoints.map((point, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2 font-semibold">{point.age}歳</td>
                <td className="px-4 py-2 text-right font-bold">
                  {formatJpyReadable(point.projectedAsset)}
                </td>
                <td className="px-4 py-2 text-right text-blue-600">
                  {formatJpyReadable(point.capitalContribution)}
                </td>
                <td className="px-4 py-2 text-right text-green-600">
                  +{formatJpyReadable(point.investmentGain)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
