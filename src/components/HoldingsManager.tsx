'use client'

import { useState } from 'react'

interface Props {
  onUpdated?: () => void
}

export function HoldingsManager({ onUpdated }: Props) {
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    ticker: '',
    name: '',
    quantity: '',
    purchasePrice: '',
    priceSource: 'COINGECKO',
    assetClass: 'OTHER',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: formData.ticker,
          name: formData.name,
          quantity: parseFloat(formData.quantity),
          purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
          priceSource: formData.priceSource,
          assetClass: formData.assetClass,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add holding')
      }

      setFormData({
        ticker: '',
        name: '',
        quantity: '',
        purchasePrice: '',
        priceSource: 'COINGECKO',
        assetClass: 'OTHER',
      })
      setIsAdding(false)
      onUpdated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">保有資産管理</h3>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition"
        >
          + 資産を追加
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ティッカー*</label>
              <input
                type="text"
                required
                value={formData.ticker}
                onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
                placeholder="BTC, SPY, USDJPY..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名前*</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Bitcoin, S&P 500..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">数量*</label>
              <input
                type="number"
                required
                step="0.00000001"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="1.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">取得単価 (JPY)</label>
              <input
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="8000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">価格ソース*</label>
              <select
                value={formData.priceSource}
                onChange={(e) => setFormData({ ...formData, priceSource: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="COINGECKO">CoinGecko (仮想通貨)</option>
                <option value="YAHOO_USD">Yahoo Finance USD</option>
                <option value="YAHOO_JPY">Yahoo Finance JPY</option>
                <option value="MANUAL_JPY">手動入力 (JPY)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">資産クラス</label>
              <select
                value={formData.assetClass}
                onChange={(e) => setFormData({ ...formData, assetClass: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="OTHER">その他</option>
                <option value="CRYPTO">仮想通貨</option>
                <option value="STOCK_US">米国株</option>
                <option value="STOCK_JP">日本株</option>
                <option value="BOND">債券</option>
                <option value="COMMODITY">商品</option>
                <option value="REAL_ESTATE">不動産</option>
                <option value="CASH">現金</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              {isLoading ? '追加中...' : '追加'}
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium py-2 px-4 rounded-lg transition"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
