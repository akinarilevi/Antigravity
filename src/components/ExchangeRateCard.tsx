'use client'

import { useEffect, useState } from 'react'

interface ExchangeRateData {
  currentRate: number
  previousRate?: number
  lastUpdated?: string
}

export function ExchangeRateCard() {
  const [rate, setRate] = useState<ExchangeRateData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch('/api/exchange-rate')
        if (!response.ok) throw new Error('Failed to fetch rate')
        const data = await response.json()
        setRate(data)
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRate()
    // 30秒ごとに更新
    const interval = setInterval(fetchRate, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading || !rate) {
    return null // ローディング中は表示しない（別途スケルトン実装可能）
  }

  const diff = rate.previousRate ? rate.currentRate - rate.previousRate : 0
  const diffPercent = rate.previousRate ? (diff / rate.previousRate) * 100 : 0
  const isPositive = diff >= 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-600 font-semibold">USD/JPY</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {rate.currentRate.toFixed(2)}円
          </p>
        </div>
        {rate.previousRate && (
          <div className="text-right">
            <p className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{diff.toFixed(2)}円
            </p>
            <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{diffPercent.toFixed(2)}%
            </p>
          </div>
        )}
      </div>
      {rate.lastUpdated && (
        <p className="text-xs text-gray-500 mt-2">
          更新時刻: {new Date(rate.lastUpdated).toLocaleTimeString('ja-JP')}
        </p>
      )}
    </div>
  )
}
