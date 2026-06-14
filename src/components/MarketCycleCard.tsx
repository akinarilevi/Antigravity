'use client'

import { useEffect, useState } from 'react'

interface CycleData {
  cycle: {
    stage: string
    stageScore: number
    confidence: number
    riskLevel: string
    recommendation: string
    positionAdjustment: string
  }
  stage: {
    name: string
    ja_name: string
    description: string
  }
}

export default function MarketCycleCard() {
  const [data, setData] = useState<CycleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/market/cycle')
        if (!res.ok) throw new Error('Failed to fetch market cycle')
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

  if (loading) return <div className="p-4">市場分析中...</div>
  if (error) return <div className="p-4 text-red-600">エラー: {error}</div>
  if (!data) return null

  const { cycle, stage } = data

  const stageColors: Record<string, string> = {
    Recovery: 'from-blue-50 to-cyan-50 border-l-blue-500',
    Expansion: 'from-green-50 to-emerald-50 border-l-green-500',
    Peak: 'from-yellow-50 to-amber-50 border-l-yellow-500',
    Slowdown: 'from-orange-50 to-amber-50 border-l-orange-500',
    Recession: 'from-red-50 to-pink-50 border-l-red-500',
    Crisis: 'from-purple-50 to-red-50 border-l-purple-500',
  }

  const riskColors: Record<string, string> = {
    Low: 'text-green-600 bg-green-100',
    Medium: 'text-yellow-600 bg-yellow-100',
    High: 'text-orange-600 bg-orange-100',
    'Very High': 'text-red-600 bg-red-100',
  }

  const stageEmojis: Record<string, string> = {
    Recovery: '📈',
    Expansion: '🚀',
    Peak: '⬆️',
    Slowdown: '⬇️',
    Recession: '📉',
    Crisis: '🔴',
  }

  const color = stageColors[cycle.stage] || stageColors.Expansion
  const emoji = stageEmojis[cycle.stage] || '📊'

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6">Market Cycle Engine - 市場環境分析</h2>

      {/* メイン表示 */}
      <div className={`bg-gradient-to-r ${color} rounded-lg p-6 mb-6 border-l-4`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-600 mb-2">現在の市場サイクル</div>
            <div className="flex items-baseline gap-3">
              <div className="text-4xl">{emoji}</div>
              <div>
                <div className="text-3xl font-bold">{stage.ja_name}</div>
                <div className="text-sm text-gray-600">({stage.name})</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`px-4 py-2 rounded-full font-bold ${riskColors[cycle.riskLevel]}`}>
              リスク: {cycle.riskLevel}
            </div>
            <div className="text-sm text-gray-600 mt-2">確度: {cycle.confidence}%</div>
          </div>
        </div>

        {/* ステージスコアバー */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">段階進度</span>
            <span className="font-bold">{cycle.stageScore}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
              style={{ width: `${cycle.stageScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* 説明 */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-bold mb-2">{stage.ja_name}の特徴</h3>
        <p className="text-gray-700">{stage.description}</p>
      </div>

      {/* アドバイス */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
        <h3 className="font-bold text-blue-900 mb-2">推奨アクション</h3>
        <p className="text-blue-800">{cycle.recommendation}</p>
      </div>

      {/* ポジション調整 */}
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg mb-6">
        <h3 className="font-bold text-purple-900 mb-2">ポートフォリオ調整</h3>
        <div className="bg-white p-3 rounded text-sm font-mono text-purple-900">
          {cycle.positionAdjustment}
        </div>
      </div>

      {/* ステージ説明 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {(['Recovery', 'Expansion', 'Peak', 'Slowdown', 'Recession', 'Crisis'] as const).map(
          (s) => (
            <div
              key={s}
              className={`p-3 rounded text-center font-semibold ${
                cycle.stage === s
                  ? 'bg-blue-500 text-white border-2 border-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {stageEmojis[s]} {s}
            </div>
          )
        )}
      </div>
    </div>
  )
}
