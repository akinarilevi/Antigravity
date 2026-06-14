'use client'

import { useEffect, useState } from 'react'
import { formatJpyReadable } from '@/lib/format'

interface Projection {
  age: number
  year: number
  projectedAsset: number
  capitalContribution: number
  investmentGain: number
  investmentGainPercent: number
}

interface ProjectionData {
  userProfile: {
    age: number
    currentAsset: number
  }
  parameters: {
    annualAddInvestment: number
    expectedAnnualReturn: number
  }
  projections: Projection[]
}

export function WealthProjectionChart() {
  const [data, setData] = useState<ProjectionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjection = async () => {
      try {
        const response = await fetch('/api/wealth-projection?endAge=50')
        if (!response.ok) throw new Error('Failed to fetch projection')
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading projection')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjection()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-32 mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return null
  }

  const { userProfile, parameters, projections } = data

  // 表示用に5年ごとの予測を抽出
  const displayProjections = projections.filter(
    (p) => p.age === userProfile.age || p.age % 5 === 0 || p.age === 50
  )

  // グラフの最大値を計算
  const maxAsset = Math.max(...projections.map((p) => p.projectedAsset))
  const graphScale = maxAsset / 100

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">将来資産予測</h3>

      {/* パラメータ表示 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">現在年齢</p>
            <p className="font-bold text-gray-900">{userProfile.age}歳</p>
          </div>
          <div>
            <p className="text-gray-600">年間追加投資額</p>
            <p className="font-bold text-gray-900">
              {formatJpyReadable(parameters.annualAddInvestment)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">期待利回り</p>
            <p className="font-bold text-gray-900">{parameters.expectedAnnualReturn.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* 予測表示 */}
      <div className="space-y-4 mb-6">
        {displayProjections.map((proj, idx) => (
          <div key={idx}>
            {/* 年齢ラベル */}
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-semibold text-gray-900">
                {proj.age}歳
                {proj.age === userProfile.age && <span className="text-xs text-blue-600 ml-2">(現在)</span>}
              </p>
              <p className="text-sm font-bold text-gray-900">
                {formatJpyReadable(proj.projectedAsset)}
              </p>
            </div>

            {/* 横棒グラフ */}
            <div className="flex gap-2 items-end mb-3">
              {/* 投資元本（青） */}
              <div
                className="bg-blue-400 rounded-l"
                style={{
                  height: '24px',
                  width: `${(proj.capitalContribution / graphScale) * 2}px`,
                }}
                title={`投資元本: ${formatJpyReadable(proj.capitalContribution)}`}
              ></div>

              {/* 利益部分（緑） */}
              {proj.investmentGain > 0 && (
                <div
                  className="bg-green-400 rounded-r"
                  style={{
                    height: '24px',
                    width: `${(proj.investmentGain / graphScale) * 2}px`,
                  }}
                  title={`利益: ${formatJpyReadable(proj.investmentGain)}`}
                ></div>
              )}
            </div>

            {/* 詳細情報 */}
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                投資元本: {formatJpyReadable(proj.capitalContribution)} | 利益:{' '}
                {formatJpyReadable(proj.investmentGain)} ({proj.investmentGainPercent.toFixed(1)}%)
              </p>
            </div>

            {idx < displayProjections.length - 1 && <hr className="my-2" />}
          </div>
        ))}
      </div>

      {/* 注記 */}
      <div className="bg-blue-50 rounded-lg p-4 text-xs text-blue-800">
        <p className="font-semibold mb-1">📊 グラフの見方</p>
        <ul className="space-y-1">
          <li>• 青色: これまでの投資元本</li>
          <li>• 緑色: 投資による利益</li>
          <li>• 毎年 {parameters.expectedAnnualReturn.toFixed(1)}% の利回りで複利計算</li>
        </ul>
      </div>
    </div>
  )
}
