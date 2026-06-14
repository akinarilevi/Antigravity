/**
 * Asset Growth Attribution Engine
 * 資産増加の要因分析（価格上昇、投資額、為替、配当）
 */

export interface AssetGrowthBreakdown {
  date: string
  period: 'daily' | 'monthly' | 'yearly'
  totalGrowth: number // JPY
  breakdown: {
    btcPrice: number // Bitcoin価格変動による増加
    nasdaqPrice: number // NASDAQ100価格変動
    sp500Price: number // S&P500価格変動
    goldPrice: number // Gold価格変動
    businessProfit: number // 事業利益からの投資
    fxGain: number // 為替差益
    dividends: number // 配当金
  }
  contributors: Array<{
    assetClass: string
    amount: number
    percentage: number
    type: 'price' | 'contribution' | 'fx' | 'dividend'
  }>
}

export interface HoldingSnapshot {
  ticker: string
  quantity: number
  priceJpy: number // 現在の価格（JPY）
  previousPriceJpy: number // 前日の価格（JPY）
  valueJpy: number // 現在の総額（JPY）
  previousValueJpy: number // 前日の総額（JPY）
}

/**
 * 資産増加の要因を分析
 * 各資産の価格変動による増加額を計算
 */
export function analyzeAssetGrowth(
  currentHoldings: HoldingSnapshot[],
  previousHoldings: HoldingSnapshot[],
  businessProfitToday: number = 0,
  dividendReceived: number = 0
): AssetGrowthBreakdown {
  const date = new Date().toISOString().split('T')[0]

  // 資産別の価格変動を計算
  const breakdown = {
    btcPrice: 0,
    nasdaqPrice: 0,
    sp500Price: 0,
    goldPrice: 0,
    businessProfit: businessProfitToday,
    fxGain: 0,
    dividends: dividendReceived,
  }

  // 各ホールディングの変動を計算
  const contributors: Array<{
    assetClass: string
    amount: number
    percentage: number
    type: 'price' | 'contribution' | 'fx' | 'dividend'
  }> = []

  currentHoldings.forEach((current) => {
    const previous = previousHoldings.find((h) => h.ticker === current.ticker)
    if (!previous) return

    const priceChange = current.valueJpy - previous.valueJpy

    // ティッカー別に分類
    if (current.ticker === 'BTC') {
      breakdown.btcPrice = priceChange
      if (priceChange !== 0) {
        contributors.push({
          assetClass: 'Bitcoin',
          amount: priceChange,
          percentage: 0, // 後で計算
          type: 'price',
        })
      }
    } else if (current.ticker === 'QQQ' || current.ticker === 'NASDAQ') {
      breakdown.nasdaqPrice = priceChange
      if (priceChange !== 0) {
        contributors.push({
          assetClass: 'NASDAQ100',
          amount: priceChange,
          percentage: 0,
          type: 'price',
        })
      }
    } else if (current.ticker === 'SPY' || current.ticker === 'SP500') {
      breakdown.sp500Price = priceChange
      if (priceChange !== 0) {
        contributors.push({
          assetClass: 'S&P500',
          amount: priceChange,
          percentage: 0,
          type: 'price',
        })
      }
    } else if (current.ticker === 'GLD' || current.ticker === 'GOLD') {
      breakdown.goldPrice = priceChange
      if (priceChange !== 0) {
        contributors.push({
          assetClass: 'Gold',
          amount: priceChange,
          percentage: 0,
          type: 'price',
        })
      }
    }
  })

  // 事業利益と配当を追加
  if (businessProfitToday > 0) {
    contributors.push({
      assetClass: '事業利益',
      amount: businessProfitToday,
      percentage: 0,
      type: 'contribution',
    })
  }

  if (dividendReceived > 0) {
    contributors.push({
      assetClass: '配当金',
      amount: dividendReceived,
      percentage: 0,
      type: 'dividend',
    })
  }

  // 総増加額を計算
  const totalGrowth = Object.values(breakdown).reduce((sum, val) => sum + val, 0)

  // パーセンテージを計算
  if (totalGrowth !== 0) {
    contributors.forEach((contributor) => {
      contributor.percentage = (contributor.amount / totalGrowth) * 100
    })
  }

  // 金額でソート（降順）
  contributors.sort((a, b) => b.amount - a.amount)

  return {
    date,
    period: 'daily',
    totalGrowth,
    breakdown,
    contributors,
  }
}

/**
 * 複数期間の成長分析（月間、年間、累計）
 */
export interface GrowthAnalysisByPeriod {
  daily: AssetGrowthBreakdown | null
  monthly: AssetGrowthBreakdown | null
  yearly: AssetGrowthBreakdown | null
  cumulative: AssetGrowthBreakdown | null
}

/**
 * 期間別の成長分析を生成
 */
export function analyzeGrowthByPeriod(
  dailyGrowths: AssetGrowthBreakdown[]
): GrowthAnalysisByPeriod {
  if (dailyGrowths.length === 0) {
    return {
      daily: null,
      monthly: null,
      yearly: null,
      cumulative: null,
    }
  }

  const today = new Date()
  const monthAgo = new Date(today)
  monthAgo.setDate(monthAgo.getDate() - 30)
  const yearAgo = new Date(today)
  yearAgo.setFullYear(yearAgo.getFullYear() - 1)

  const daily = dailyGrowths[dailyGrowths.length - 1] // 最新

  // 月間（過去30日）
  const monthlyGrowths = dailyGrowths.filter((g) => new Date(g.date) > monthAgo)
  const monthly = aggregateGrowths(monthlyGrowths, 'monthly')

  // 年間（過去365日）
  const yearlyGrowths = dailyGrowths.filter((g) => new Date(g.date) > yearAgo)
  const yearly = aggregateGrowths(yearlyGrowths, 'yearly')

  // 累計（全期間）
  const cumulative = aggregateGrowths(dailyGrowths, 'yearly')

  return {
    daily,
    monthly,
    yearly,
    cumulative,
  }
}

/**
 * 複数の成長記録を集計
 */
function aggregateGrowths(
  growths: AssetGrowthBreakdown[],
  period: 'daily' | 'monthly' | 'yearly'
): AssetGrowthBreakdown | null {
  if (growths.length === 0) return null

  const breakdown = {
    btcPrice: 0,
    nasdaqPrice: 0,
    sp500Price: 0,
    goldPrice: 0,
    businessProfit: 0,
    fxGain: 0,
    dividends: 0,
  }

  // 全期間の合計を計算
  growths.forEach((g) => {
    Object.keys(breakdown).forEach((key) => {
      breakdown[key as keyof typeof breakdown] += g.breakdown[key as keyof typeof g.breakdown]
    })
  })

  const totalGrowth = Object.values(breakdown).reduce((sum, val) => sum + val, 0)

  // コントリビューターを計算
  const contributors: Array<{
    assetClass: string
    amount: number
    percentage: number
    type: 'price' | 'contribution' | 'fx' | 'dividend'
  }> = []

  const assetMap = {
    btcPrice: { name: 'Bitcoin', type: 'price' as const },
    nasdaqPrice: { name: 'NASDAQ100', type: 'price' as const },
    sp500Price: { name: 'S&P500', type: 'price' as const },
    goldPrice: { name: 'Gold', type: 'price' as const },
    businessProfit: { name: '事業利益', type: 'contribution' as const },
    fxGain: { name: '為替差益', type: 'fx' as const },
    dividends: { name: '配当金', type: 'dividend' as const },
  }

  Object.entries(breakdown).forEach(([key, amount]) => {
    if (amount !== 0) {
      const asset = assetMap[key as keyof typeof assetMap]
      contributors.push({
        assetClass: asset.name,
        amount,
        percentage: totalGrowth !== 0 ? (amount / totalGrowth) * 100 : 0,
        type: asset.type,
      })
    }
  })

  contributors.sort((a, b) => b.amount - a.amount)

  return {
    date: growths[growths.length - 1].date,
    period,
    totalGrowth,
    breakdown,
    contributors,
  }
}
