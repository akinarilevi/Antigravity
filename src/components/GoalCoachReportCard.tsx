'use client'

import { useEffect, useState } from 'react'
import { GoalCoachReport } from '@/lib/goal-coach-generator'

interface GoalCoachReportData {
  targetAge: number
  report: GoalCoachReport
  metadata: {
    generatedAt: string
    userAge: number
    yearsToTarget: number
    currentAsset: number
  }
}

export default function GoalCoachReportCard({ targetAge = 35 }: { targetAge?: number }) {
  const [data, setData] = useState<GoalCoachReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/goals/coach-report?targetAge=${targetAge}`)
        if (!res.ok) throw new Error('Failed to fetch coach report')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [targetAge])

  if (loading) return <div className="p-4">レポート生成中...</div>
  if (error) return <div className="p-4 text-red-600">エラー: {error}</div>
  if (!data) return null

  const { report, metadata } = data
  const emotionalColors = {
    positive: 'bg-green-50 border-l-4 border-green-500',
    neutral: 'bg-blue-50 border-l-4 border-blue-500',
    alert: 'bg-orange-50 border-l-4 border-orange-500',
  }

  const emotionalEmojis = {
    positive: '🎯',
    neutral: '📊',
    alert: '⚠️',
  }

  const probabilityChangeColor =
    report.probabilityChange >= 0 ? 'text-green-600' : 'text-red-600'
  const probabilityChangeSign = report.probabilityChange >= 0 ? '+' : ''

  return (
    <div className={`rounded-lg shadow p-6 mb-6 ${emotionalColors[report.emotionalTone]}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {emotionalEmojis[report.emotionalTone]} AIコーチ朝レポート
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {metadata.userAge}歳 → {targetAge}歳（残り{metadata.yearsToTarget}年）
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">達成確率</div>
          <div className="text-3xl font-bold">
            {report.successProbability.toFixed(0)}%
          </div>
          <div className={`text-sm font-semibold ${probabilityChangeColor}`}>
            {probabilityChangeSign}{report.probabilityChange.toFixed(1)}% (前日比)
          </div>
        </div>
      </div>

      {/* Claude生成レポート */}
      <div className="bg-white bg-opacity-60 p-4 rounded mb-4 border-l-4 border-indigo-500 whitespace-pre-wrap">
        {report.content}
      </div>

      {/* 推奨アクション */}
      <div className="bg-white bg-opacity-60 p-4 rounded border-t-2 border-gray-300">
        <h3 className="font-bold text-lg mb-2">推奨アクション</h3>
        <p className="text-gray-700 leading-relaxed">{report.recommendation}</p>
      </div>

      {/* メタデータ */}
      <div className="text-xs text-gray-600 mt-4 pt-4 border-t">
        レポート生成: {new Date(metadata.generatedAt).toLocaleString('ja-JP')}
      </div>
    </div>
  )
}
