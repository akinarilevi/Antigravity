/**
 * Asset Contribution Ranking Engine
 * 資産別の貢献度ランキング計算
 */

export interface ContributionRank {
  rank: number
  assetClass: string
  contributionAmount: number // JPY
  percentage: number // 全体に対する％
  type: 'price' | 'contribution' | 'fx' | 'dividend'
}

export interface ContributionRanking {
  period: 'monthly' | 'yearly' | 'cumulative'
  totalContribution: number
  rankings: ContributionRank[]
  topThree: ContributionRank[]
}

/**
 * 資産別の貢献度ランキングを計算
 */
export function calculateContributionRanking(
  growthBreakdown: {
    btcPrice?: number
    nasdaqPrice?: number
    sp500Price?: number
    goldPrice?: number
    businessProfit?: number
    fxGain?: number
    dividends?: number
  },
  period: 'monthly' | 'yearly' | 'cumulative' = 'monthly'
): ContributionRanking {
  const items = [
    { name: 'Bitcoin', amount: growthBreakdown.btcPrice || 0, type: 'price' as const },
    { name: 'NASDAQ100', amount: growthBreakdown.nasdaqPrice || 0, type: 'price' as const },
    { name: 'S&P500', amount: growthBreakdown.sp500Price || 0, type: 'price' as const },
    { name: 'Gold', amount: growthBreakdown.goldPrice || 0, type: 'price' as const },
    {
      name: '事業利益',
      amount: growthBreakdown.businessProfit || 0,
      type: 'contribution' as const,
    },
    { name: '為替差益', amount: growthBreakdown.fxGain || 0, type: 'fx' as const },
    { name: '配当金', amount: growthBreakdown.dividends || 0, type: 'dividend' as const },
  ]

  // 総貢献額（プラスのみ）
  const totalContribution = items.reduce((sum, item) => {
    return sum + (item.amount > 0 ? item.amount : 0)
  }, 0)

  // ランキングを作成（金額が0でない、またはマイナス含む）
  const rankings = items
    .filter((item) => item.amount !== 0)
    .map((item, index) => ({
      rank: index + 1,
      assetClass: item.name,
      contributionAmount: item.amount,
      percentage: totalContribution > 0 ? (item.amount / totalContribution) * 100 : 0,
      type: item.type,
    }))
    .sort((a, b) => b.contributionAmount - a.contributionAmount)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }))

  // Top 3 を抽出
  const topThree = rankings.filter((r) => r.contributionAmount > 0).slice(0, 3)

  return {
    period,
    totalContribution,
    rankings,
    topThree,
  }
}

/**
 * 複数期間のランキングを並べて表示用に生成
 */
export interface MultiPeriodRanking {
  monthly: ContributionRanking | null
  yearly: ContributionRanking | null
  cumulative: ContributionRanking | null
}

export function generateMultiPeriodRanking(
  monthlyBreakdown: { [key: string]: number } | null,
  yearlyBreakdown: { [key: string]: number } | null,
  cumulativeBreakdown: { [key: string]: number } | null
): MultiPeriodRanking {
  return {
    monthly: monthlyBreakdown ? calculateContributionRanking(monthlyBreakdown, 'monthly') : null,
    yearly: yearlyBreakdown ? calculateContributionRanking(yearlyBreakdown, 'yearly') : null,
    cumulative: cumulativeBreakdown
      ? calculateContributionRanking(cumulativeBreakdown, 'cumulative')
      : null,
  }
}

/**
 * ランキング表示用のテキストフォーマット
 */
export function formatRankingAsText(ranking: ContributionRanking): string {
  const lines: string[] = []

  const periodLabel = {
    monthly: '【月間】',
    yearly: '【年間】',
    cumulative: '【累計】',
  }[ranking.period]

  lines.push(periodLabel)

  ranking.rankings.forEach((item) => {
    if (item.contributionAmount !== 0) {
      const sign = item.contributionAmount >= 0 ? '+' : ''
      const amountStr = `¥${Math.abs(Math.round(item.contributionAmount / 10000))}万円`
      const percentStr = ranking.totalContribution > 0 ? `(${item.percentage.toFixed(1)}%)` : ''
      lines.push(`${item.rank}位 ${item.assetClass.padEnd(12)} ${sign}${amountStr} ${percentStr}`)
    }
  })

  lines.push('─'.repeat(40))
  const totalStr = `¥${Math.round(ranking.totalContribution / 10000)}万円`
  lines.push(`合計  ${totalStr}`)

  return lines.join('\n')
}
