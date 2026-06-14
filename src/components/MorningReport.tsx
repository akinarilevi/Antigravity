'use client'

import { useEffect, useState } from 'react'

interface Report {
  id: string
  date: string
  content: string
  marketScore: number
  totalValueJpy: number
}

export function MorningReport() {
  const [report, setReport] = useState<Report | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch('/api/morning-report')
        if (!response.ok) throw new Error('Failed to fetch report')
        const data = await response.json()
        setReport(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReport()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6 mb-6 animate-pulse">
        <div className="h-4 bg-purple-300 rounded w-20 mb-3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-purple-200 rounded w-full"></div>
          <div className="h-4 bg-purple-200 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <p className="text-yellow-700 text-sm">
          朝のレポートを読み込めませんでした: {error}
        </p>
      </div>
    )
  }

  const marketSentiment =
    report.marketScore >= 60
      ? '🟢 好調'
      : report.marketScore >= 40
        ? '🟡 中立'
        : '🔴 弱気'

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">おはようございます</h2>
        <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
          {marketSentiment}
        </span>
      </div>
      <p className="text-gray-700 leading-relaxed">{report.content}</p>
      <div className="mt-4 text-xs text-gray-500">
        生成時刻: {new Date(report.date).toLocaleDateString('ja-JP')}
      </div>
    </div>
  )
}
