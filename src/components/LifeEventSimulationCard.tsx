'use client'

import { useEffect, useState } from 'react'
import { formatJpyReadable } from '@/lib/format'

interface SimulationScenario {
  scenario: {
    name: string
    description: string
    eventCount: number
  }
  result: {
    scenarioName: string
    projectedAssetAt35: number
    projectedAssetAt40: number
    achievementProbability35: number
    achievementProbability40: number
    totalCashflowImpact: number
    riskAssessment: string
  }
}

interface SimulationData {
  allScenarios: SimulationScenario[]
  bestScenario: {
    name: string
    probability35: number
    asset35: number
  }
  worstScenario: {
    name: string
    probability35: number
    asset35: number
  }
  recommendation: string
}

export default function LifeEventSimulationCard() {
  const [data, setData] = useState<SimulationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedScenario, setExpandedScenario] = useState<number | null>(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/scenarios/life-event-simulation')
        if (!res.ok) throw new Error('Failed to fetch simulation')
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

  if (loading) return <div className="p-4">シミュレーション中...</div>
  if (error) return <div className="p-4 text-red-600">エラー: {error}</div>
  if (!data) return null

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6">Life Event Simulator - 人生イベント分析</h2>

      {/* ベスト・ワーストシナリオ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* ベストシナリオ */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-600">最高シナリオ</div>
              <div className="text-2xl font-bold text-green-700">🌟 {data.bestScenario.name}</div>
            </div>
            <div className="text-4xl">✅</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">35歳達成確率</span>
              <span className="font-bold text-green-600">{data.bestScenario.probability35.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">予測資産</span>
              <span className="font-bold">{formatJpyReadable(data.bestScenario.asset35)}</span>
            </div>
          </div>
        </div>

        {/* ワーストシナリオ */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-lg border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-600">最悪シナリオ</div>
              <div className="text-2xl font-bold text-red-700">⚠️ {data.worstScenario.name}</div>
            </div>
            <div className="text-4xl">⛔</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">35歳達成確率</span>
              <span className="font-bold text-red-600">{data.worstScenario.probability35.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">予測資産</span>
              <span className="font-bold">{formatJpyReadable(data.worstScenario.asset35)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 推奨 */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
        <h3 className="font-bold text-blue-900 mb-2">推奨アクション</h3>
        <p className="text-blue-800">{data.recommendation}</p>
      </div>

      {/* シナリオ詳細 */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-4">シナリオ別詳細</h3>
        <div className="space-y-3">
          {data.allScenarios.map((scenario, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-l-4 cursor-pointer transition ${
                expandedScenario === idx
                  ? 'bg-blue-50 border-l-blue-500'
                  : 'bg-gray-50 border-l-gray-300 hover:bg-gray-100'
              }`}
              onClick={() => setExpandedScenario(expandedScenario === idx ? null : idx)}
            >
              {/* ヘッダー */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-lg">{scenario.scenario.name}</div>
                  <div className="text-sm text-gray-600">{scenario.scenario.description}</div>
                </div>
                <div className="text-right mr-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {scenario.result.achievementProbability35.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500">35歳達成確率</div>
                </div>
                <div className="text-2xl">
                  {expandedScenario === idx ? '▼' : '▶'}
                </div>
              </div>

              {/* 展開時の詳細 */}
              {expandedScenario === idx && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-600">35歳時予測資産</div>
                      <div className="font-bold">
                        {formatJpyReadable(scenario.result.projectedAssetAt35)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">40歳時予測資産</div>
                      <div className="font-bold">
                        {formatJpyReadable(scenario.result.projectedAssetAt40)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-600">35歳達成確率</div>
                      <div className="font-bold text-green-600">
                        {scenario.result.achievementProbability35.toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">40歳達成確率</div>
                      <div className="font-bold text-green-600">
                        {scenario.result.achievementProbability40.toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-600 mb-1">キャッシュフロー影響</div>
                    <div
                      className={`font-bold ${
                        scenario.result.totalCashflowImpact >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {scenario.result.totalCashflowImpact >= 0 ? '+' : ''}
                      {formatJpyReadable(scenario.result.totalCashflowImpact)}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded">
                    <div className="text-xs font-semibold text-gray-600 mb-1">リスク評価</div>
                    <div className="text-sm">{scenario.result.riskAssessment}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 説明 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-bold mb-2">シミュレーション説明</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>
            • <strong>順調シナリオ</strong>: 昇進と家族増加が予定通り進むケース
          </li>
          <li>
            • <strong>保守的シナリオ</strong>: 転職や家族計画がないシンプルなケース
          </li>
          <li>
            • <strong>積極的シナリオ</strong>: 複数回の昇進と相続を想定するケース
          </li>
        </ul>
      </div>
    </div>
  )
}
