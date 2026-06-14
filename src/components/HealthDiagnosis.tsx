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

interface Score {
  category: string
  points: number
  maxPoints: number
  description: string
}

export function HealthDiagnosis({ holdings, totalJpy }: Props) {
  const calculateScores = (): Score[] => {
    const scores: Score[] = []

    // 分散度スコア
    const assetClasses = new Set(holdings.map((h) => h.assetClass))
    let diversificationPoints = 0
    if (assetClasses.size >= 5) {
      diversificationPoints = 30
    } else if (assetClasses.size >= 3) {
      diversificationPoints = 20
    } else if (assetClasses.size >= 1) {
      diversificationPoints = 10
    }
    scores.push({
      category: '分散度',
      points: diversificationPoints,
      maxPoints: 30,
      description: `${assetClasses.size}個の資産クラス`,
    })

    // 集中リスク
    let concentrationPoints = 0
    const maxAllocationPercent = holdings.length > 0
      ? Math.max(...holdings.map((h) => (h.valueJpy / totalJpy) * 100))
      : 100

    if (maxAllocationPercent < 50) {
      concentrationPoints = 30
    } else if (maxAllocationPercent < 70) {
      concentrationPoints = 20
    } else if (maxAllocationPercent < 90) {
      concentrationPoints = 10
    }
    scores.push({
      category: '集中リスク',
      points: concentrationPoints,
      maxPoints: 30,
      description: `最大銘柄比率: ${maxAllocationPercent.toFixed(1)}%`,
    })

    // 現金バッファー
    const cashHoldings = holdings.filter((h) => h.assetClass === 'CASH')
    const cashValue = cashHoldings.reduce((sum, h) => sum + h.valueJpy, 0)
    const cashPercent = (cashValue / totalJpy) * 100
    let cashPoints = 0
    if (cashPercent >= 10) {
      cashPoints = 20
    } else if (cashPercent >= 5) {
      cashPoints = 10
    }
    scores.push({
      category: '現金バッファー',
      points: cashPoints,
      maxPoints: 20,
      description: `現金保有率: ${cashPercent.toFixed(1)}%`,
    })

    // 仮想通貨リスク
    const cryptoHoldings = holdings.filter((h) => h.assetClass === 'CRYPTO')
    const cryptoValue = cryptoHoldings.reduce((sum, h) => sum + h.valueJpy, 0)
    const cryptoPercent = (cryptoValue / totalJpy) * 100
    let cryptoPoints = 0
    if (cryptoPercent < 20) {
      cryptoPoints = 20
    } else if (cryptoPercent < 40) {
      cryptoPoints = 10
    }
    scores.push({
      category: '仮想通貨リスク',
      points: cryptoPoints,
      maxPoints: 20,
      description: `仮想通貨比率: ${cryptoPercent.toFixed(1)}%`,
    })

    return scores
  }

  const scores = calculateScores()
  const totalPoints = scores.reduce((sum, s) => sum + s.points, 0)
  const maxTotalPoints = scores.reduce((sum, s) => sum + s.maxPoints, 0)
  const healthScore = Math.round((totalPoints / maxTotalPoints) * 100)

  const getHealthLevel = (score: number) => {
    if (score >= 80) return { level: '優秀', color: 'text-green-600', bgColor: 'bg-green-50' }
    if (score >= 60) return { level: '良好', color: 'text-blue-600', bgColor: 'bg-blue-50' }
    if (score >= 40) return { level: '注意', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    return { level: 'リスク高', color: 'text-red-600', bgColor: 'bg-red-50' }
  }

  const health = getHealthLevel(healthScore)

  return (
    <div className={`${health.bgColor} rounded-lg border border-gray-200 p-6`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">ポートフォリオ健康診断</h3>
        <div className="flex items-center gap-3">
          <div className="text-4xl font-bold">
            <span className={health.color}>{healthScore}</span>
            <span className="text-lg text-gray-600">/100</span>
          </div>
          <div>
            <p className={`text-lg font-semibold ${health.color}`}>{health.level}</p>
            <p className="text-sm text-gray-600">{totalPoints} / {maxTotalPoints} ポイント</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {scores.map((score) => (
          <div key={score.category} className="bg-white rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium text-gray-900">{score.category}</p>
                <p className="text-xs text-gray-600">{score.description}</p>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {score.points}/{score.maxPoints}
              </span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${(score.points / score.maxPoints) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
