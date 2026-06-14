'use client'

import { useEffect, useState } from 'react'
import { GoalGapAnalysis, SolutionOption } from '@/lib/goal-gap-analyzer'
import { formatJpyReadable } from '@/lib/format'

export default function GoalGapAnalysisCard({ targetAge = 35 }: { targetAge?: number }) {
  const [analysis, setAnalysis] = useState<GoalGapAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`/api/goals/gap-analysis?targetAge=${targetAge}`)
        if (!res.ok) throw new Error('Failed to fetch analysis')
        const data = await res.json()
        setAnalysis(data.analysis)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [targetAge])

  if (loading) return <div className="p-4">分析中...</div>
  if (error) return <div className="p-4 text-red-600">エラー: {error}</div>
  if (!analysis) return null

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6">
        {targetAge}歳 目標達成ギャップ分析
      </h2>

      {/* メトリクス表示 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-600">目標資産</div>
          <div className="text-xl font-bold">
            {formatJpyReadable(analysis.targetAsset)}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-600">現在資産</div>
          <div className="text-xl font-bold">
            {formatJpyReadable(analysis.currentAsset)}
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded border-l-4 border-red-500">
          <div className="text-sm text-gray-600">残り必要資産</div>
          <div className="text-xl font-bold text-red-600">
            {formatJpyReadable(analysis.remainingAmount)}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded">
          <div className="text-sm text-gray-600">達成率</div>
          <div className="text-xl font-bold text-blue-600">
            {analysis.achievementRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 達成確率と必要利回り */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-green-50 p-4 rounded">
          <div className="text-sm text-gray-600">達成確率</div>
          <div className="text-2xl font-bold text-green-600">
            {analysis.successProbability.toFixed(0)}%
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded">
          <div className="text-sm text-gray-600">必要利回り</div>
          <div className="text-2xl font-bold text-orange-600">
            {analysis.requiredReturn.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* 解決方法 */}
      <div>
        <h3 className="text-lg font-bold mb-4">解決方法</h3>
        <div className="space-y-4">
          {analysis.solutions.map((solution, idx) => (
            <SolutionCard key={idx} solution={solution} />
          ))}
        </div>
      </div>
    </div>
  )
}

function SolutionCard({ solution }: { solution: SolutionOption }) {
  const typeLabel = {
    INCREASE_INVESTMENT: '投資額増加',
    IMPROVE_RETURN: '利回り改善',
    COMBINED: '組み合わせ案',
  }[solution.type]

  const feasibilityColor = {
    high: 'bg-green-50 border-l-4 border-green-500',
    medium: 'bg-yellow-50 border-l-4 border-yellow-500',
    low: 'bg-red-50 border-l-4 border-red-500',
  }[
    solution.feasibilityScore >= 80 ? 'high' : solution.feasibilityScore >= 60 ? 'medium' : 'low'
  ]

  return (
    <div className={`p-4 rounded ${feasibilityColor}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-lg">{typeLabel}</h4>
        <span className="text-sm bg-white px-2 py-1 rounded">
          実現可能性: {solution.feasibilityScore}点
        </span>
      </div>

      <p className="text-gray-700 mb-3">{solution.description}</p>
      <p className="text-sm text-gray-600 mb-4">{solution.feasibilityComment}</p>

      {/* 詳細情報 */}
      {solution.type === 'INCREASE_INVESTMENT' && solution.increaseAmount && (
        <div className="bg-white bg-opacity-50 p-3 rounded text-sm mb-3">
          <div>
            現在: ¥{(solution.currentAnnualInvestment / 10000).toFixed(0)}万円/年
          </div>
          <div className="font-bold">
            必要: ¥{(solution.requiredAnnualInvestment! / 10000).toFixed(0)}万円/年
            ({solution.increaseAmount >= 0 ? '+' : ''}
            {(solution.increaseAmount / 10000).toFixed(0)}万円)
          </div>
        </div>
      )}

      {solution.type === 'IMPROVE_RETURN' && solution.returnImprovement && (
        <div className="bg-white bg-opacity-50 p-3 rounded text-sm mb-3">
          <div>現在の期待利回り: 8%</div>
          <div className="font-bold">
            必要な期待利回り: {solution.requiredReturn?.toFixed(2)}%
            (+{solution.returnImprovement.toFixed(1)}%)
          </div>
        </div>
      )}

      {/* 組み合わせシナリオ */}
      {solution.combinedScenarios && solution.combinedScenarios.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <p className="text-sm font-semibold mb-2">実現パターン:</p>
          <div className="space-y-2">
            {solution.combinedScenarios.map((scenario, idx) => (
              <div key={idx} className="text-sm bg-white bg-opacity-50 p-2 rounded">
                <div className="font-semibold">{scenario.name}</div>
                <div className="text-gray-700">
                  {scenario.annualInvestmentIncrease > 0 && (
                    <span>
                      投資額 +¥{(scenario.annualInvestmentIncrease / 10000).toFixed(0)}万円
                    </span>
                  )}
                  {scenario.annualInvestmentIncrease > 0 &&
                    scenario.returnImprovement > 0 && <span> / </span>}
                  {scenario.returnImprovement > 0 && (
                    <span>利回り +{scenario.returnImprovement.toFixed(1)}%</span>
                  )}
                </div>
                <div className="text-gray-600 text-xs">{scenario.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
