'use client'

interface HoldingValue {
  id: string
  ticker: string
  name: string
  quantity: number
  valueJpy: number
  purchaseCostJpy: number | null
  priceSource: string
  assetClass: string
}

interface Props {
  holdings: HoldingValue[]
  totalJpy: number
}

export function AssetBreakdown({ holdings, totalJpy }: Props) {
  if (holdings.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">資産構成</h3>
        <p className="text-gray-500">保有資産がありません</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">資産構成</h3>
      <div className="space-y-3">
        {holdings.map((holding) => {
          const percent = totalJpy > 0 ? (holding.valueJpy / totalJpy) * 100 : 0
          const gainLoss = holding.purchaseCostJpy
            ? holding.valueJpy - holding.purchaseCostJpy
            : null
          const gainLossPercent =
            gainLoss && holding.purchaseCostJpy
              ? (gainLoss / holding.purchaseCostJpy) * 100
              : null

          return (
            <div key={holding.id} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-900">
                    {holding.name} ({holding.ticker})
                  </span>
                  <span className="text-sm text-gray-600">
                    ¥{Math.round(holding.valueJpy).toLocaleString('ja-JP')}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                  <span>{percent.toFixed(1)}%</span>
                  <span>
                    {gainLossPercent !== null ? (
                      <span className={gainLoss && gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {gainLoss && gainLoss >= 0 ? '+' : ''}
                        {gainLossPercent.toFixed(2)}%
                      </span>
                    ) : (
                      '利益率不明'
                    )}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
