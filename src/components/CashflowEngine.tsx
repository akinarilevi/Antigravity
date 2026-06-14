'use client'

import { useEffect, useState } from 'react'
import { formatJpyReadable } from '@/lib/format'

interface CashflowData {
  corporateProfit: number
  executiveComp: number
  otherIncome: number
  livingExpense: number
  fixedExpense: number
}

interface CashflowAnalysis {
  totalIncome: number
  totalExpense: number
  netCashFlow: number
  annualAddableInvestment: number
  monthlyAddableInvestment: number
}

export function CashflowEngine() {
  const [data, setData] = useState<CashflowData>({
    corporateProfit: 0,
    executiveComp: 0,
    otherIncome: 0,
    livingExpense: 0,
    fixedExpense: 0,
  })

  const [analysis, setAnalysis] = useState<CashflowAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchCashflow()
  }, [])

  const fetchCashflow = async () => {
    try {
      const response = await fetch('/api/cashflows')
      if (!response.ok) throw new Error('Failed to fetch cashflow')
      const result = await response.json()
      setData({
        corporateProfit: result.cashflow.corporateProfit || 0,
        executiveComp: result.cashflow.executiveComp || 0,
        otherIncome: result.cashflow.otherIncome || 0,
        livingExpense: result.cashflow.livingExpense || 0,
        fixedExpense: result.cashflow.fixedExpense || 0,
      })
      setAnalysis(result.analysis)
    } catch (error) {
      console.error('Failed to fetch cashflow:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/cashflows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to save cashflow')
      const result = await response.json()
      setAnalysis(result.analysis)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save cashflow:', error)
    } finally {
      setIsSaving(false)
    }
  }

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

  if (!analysis) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">キャッシュフロー分析</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
          >
            編集
          </button>
        )}
      </div>

      {isEditing ? (
        /* 編集フォーム */
        <div className="space-y-4">
          {/* 収入セクション */}
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">収入</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">法人利益</label>
                <input
                  type="number"
                  value={data.corporateProfit}
                  onChange={(e) => setData({ ...data, corporateProfit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">役員報酬</label>
                <input
                  type="number"
                  value={data.executiveComp}
                  onChange={(e) => setData({ ...data, executiveComp: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">その他収入</label>
                <input
                  type="number"
                  value={data.otherIncome}
                  onChange={(e) => setData({ ...data, otherIncome: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* 支出セクション */}
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">支出</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">生活費</label>
                <input
                  type="number"
                  value={data.livingExpense}
                  onChange={(e) => setData({ ...data, livingExpense: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">固定費</label>
                <input
                  type="number"
                  value={data.fixedExpense}
                  onChange={(e) => setData({ ...data, fixedExpense: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium py-2 px-4 rounded-lg transition"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        /* 表示モード */
        <div className="space-y-4">
          {/* 収入表示 */}
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">総収入</p>
            <p className="text-2xl font-bold text-green-600">
              {formatJpyReadable(analysis.totalIncome)}
            </p>
            <div className="mt-2 space-y-1 text-xs text-gray-600">
              <p>• 法人利益: {formatJpyReadable(data.corporateProfit)}</p>
              <p>• 役員報酬: {formatJpyReadable(data.executiveComp)}</p>
              <p>• その他: {formatJpyReadable(data.otherIncome)}</p>
            </div>
          </div>

          {/* 支出表示 */}
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">総支出</p>
            <p className="text-2xl font-bold text-red-600">
              {formatJpyReadable(analysis.totalExpense)}
            </p>
            <div className="mt-2 space-y-1 text-xs text-gray-600">
              <p>• 生活費: {formatJpyReadable(data.livingExpense)}</p>
              <p>• 固定費: {formatJpyReadable(data.fixedExpense)}</p>
            </div>
          </div>

          {/* 純キャッシュフロー */}
          <div className={`rounded-lg p-4 ${analysis.netCashFlow >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <p className="text-sm font-semibold text-gray-900 mb-3">純キャッシュフロー</p>
            <p className={`text-2xl font-bold ${analysis.netCashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatJpyReadable(analysis.netCashFlow)}
            </p>
          </div>

          {/* 年間追加投資可能額（最重要） */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border-2 border-purple-300">
            <p className="text-xs font-semibold text-purple-900 mb-1">年間追加投資可能額</p>
            <p className="text-3xl font-bold text-purple-600 mb-2">
              {formatJpyReadable(analysis.annualAddableInvestment)}
            </p>
            <p className="text-xs text-purple-700">
              月間: {formatJpyReadable(analysis.monthlyAddableInvestment)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
