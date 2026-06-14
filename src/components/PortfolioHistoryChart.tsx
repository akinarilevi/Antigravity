'use client'

import { useEffect, useState } from 'react'

interface Snapshot {
  id: string
  date: string
  totalValueJpy: number
}

export function PortfolioHistoryChart() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/portfolio/history?days=30')
        if (response.ok) {
          const data = await response.json()
          setSnapshots(data)
        }
      } catch (error) {
        console.error('Failed to fetch history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-32 mb-4"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (snapshots.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">資産推移（30日）</h3>
        <div className="h-48 flex items-center justify-center text-gray-500">
          グラフデータがありません
        </div>
      </div>
    )
  }

  const minValue = Math.min(...snapshots.map((s) => s.totalValueJpy))
  const maxValue = Math.max(...snapshots.map((s) => s.totalValueJpy))
  const range = maxValue - minValue || 1

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">資産推移（30日）</h3>
      <div className="h-48 flex items-end justify-between gap-1">
        {snapshots.map((snapshot) => {
          const height = ((snapshot.totalValueJpy - minValue) / range) * 100
          const date = new Date(snapshot.date)
          const dateStr = `${date.getMonth() + 1}/${date.getDate()}`

          return (
            <div
              key={snapshot.id}
              className="flex-1 flex flex-col items-center"
              title={`${dateStr}: ¥${Math.round(snapshot.totalValueJpy).toLocaleString('ja-JP')}`}
            >
              <div
                className="w-full bg-blue-400 rounded-t opacity-80 hover:opacity-100 transition"
                style={{ height: `${Math.max(5, height)}%` }}
              ></div>
              <span className="text-xs text-gray-500 mt-2">{dateStr}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex justify-between text-xs text-gray-500">
        <span>¥{Math.round(minValue).toLocaleString('ja-JP')}</span>
        <span>¥{Math.round(maxValue).toLocaleString('ja-JP')}</span>
      </div>
    </div>
  )
}
