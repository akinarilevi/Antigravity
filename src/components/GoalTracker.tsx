'use client'

import { useEffect, useState } from 'react'
import { formatJpyReadable, formatJpyFull, formatPercent } from '@/lib/format'

interface Goal {
  id: string
  targetAge: number
  targetAsset: number
  achievementRate: number
  successProbability: number
  requiredReturn: number
  remainingAmount: number
  projectedAsset: number
}

interface UserProfile {
  currentAge: number
  currentAsset: number
}

interface GoalTrackerData {
  userProfile: UserProfile
  goals: Goal[]
}

export function GoalTracker() {
  const [data, setData] = useState<GoalTrackerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch('/api/goals')
        if (!response.ok) throw new Error('Failed to fetch goals')
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading goals')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGoals()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mb-6 animate-pulse">
        <div className="h-4 bg-blue-300 rounded w-32 mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-blue-200 rounded"></div>
          <div className="h-12 bg-blue-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <p className="text-red-700">{error || 'Failed to load goals'}</p>
      </div>
    )
  }

  const { userProfile, goals } = data

  const getProgressColor = (rate: number) => {
    if (rate >= 100) return 'from-green-400 to-green-600'
    if (rate >= 70) return 'from-blue-400 to-blue-600'
    if (rate >= 40) return 'from-yellow-400 to-yellow-600'
    return 'from-red-400 to-red-600'
  }

  const getSuccessProbabilityColor = (prob: number) => {
    if (prob >= 80) return 'text-green-600 bg-green-50'
    if (prob >= 60) return 'text-blue-600 bg-blue-50'
    if (prob >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="space-y-4 mb-6">
      {/* ユーザー情報 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">現在の年齢</p>
            <p className="text-2xl font-bold text-gray-900">{userProfile.currentAge}歳</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">現在の総資産</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatJpyReadable(userProfile.currentAsset)}
            </p>
          </div>
        </div>
      </div>

      {/* 目標カード */}
      {goals.map((goal) => (
        <div
          key={goal.id}
          className="bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 p-6"
        >
          {/* タイトル */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {goal.targetAge}歳目標
          </h3>

          {/* 主要メトリクス */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* 目標資産 */}
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 font-semibold mb-1">目標資産</p>
              <p className="text-lg font-bold text-blue-600">
                {formatJpyReadable(goal.targetAsset)}
              </p>
            </div>

            {/* 現在資産 */}
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="text-xs text-gray-600 font-semibold mb-1">現在</p>
              <p className="text-lg font-bold text-gray-900">
                {formatJpyReadable(userProfile.currentAsset)}
              </p>
            </div>

            {/* 残り必要資産 */}
            <div className="bg-orange-50 rounded-lg p-3 col-span-2">
              <p className="text-xs text-gray-600 font-semibold mb-1">あと</p>
              <p className="text-xl font-bold text-orange-600">
                {formatJpyReadable(goal.remainingAmount)}
              </p>
            </div>
          </div>

          {/* プログレスバー */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold text-gray-700">達成率</p>
              <p className={`text-lg font-bold bg-gradient-to-r ${getProgressColor(goal.achievementRate)} bg-clip-text text-transparent`}>
                {formatPercent(goal.achievementRate, 1)}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 bg-gradient-to-r ${getProgressColor(goal.achievementRate)} rounded-full transition-all`}
                style={{ width: `${Math.min(100, goal.achievementRate)}%` }}
              ></div>
            </div>
          </div>

          {/* 詳細メトリクス */}
          <div className="grid grid-cols-3 gap-2">
            {/* 達成確率 */}
            <div className={`rounded-lg p-3 text-center ${getSuccessProbabilityColor(goal.successProbability)}`}>
              <p className="text-xs font-semibold mb-1">達成確率</p>
              <p className="text-lg font-bold">{formatPercent(goal.successProbability, 0)}</p>
            </div>

            {/* 必要利回り */}
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-xs font-semibold text-purple-900 mb-1">必要利回り</p>
              <p className="text-lg font-bold text-purple-600">
                {formatPercent(goal.requiredReturn, 1)}
              </p>
            </div>

            {/* 予測資産 */}
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs font-semibold text-green-900 mb-1">{goal.targetAge}歳予測</p>
              <p className="text-sm font-bold text-green-600">
                {formatJpyReadable(goal.projectedAsset)}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* 凡例 */}
      <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 border border-gray-200">
        <p className="font-semibold mb-2">計算条件</p>
        <ul className="space-y-1">
          <li>• 年間追加投資: {formatJpyReadable(12000000)}</li>
          <li>• 期待利回り: {formatPercent(8, 0)}</li>
          <li>• シミュレーション: モンテカルロ (1,000回)</li>
        </ul>
      </div>
    </div>
  )
}
