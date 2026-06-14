/**
 * Portfolio Score Calculator
 * ポートフォリオを6つの評価軸で採点（0-100点）
 */

export interface PortfolioScoreBreakdown {
  expectedReturn: number // 期待リターン（20点満点）
  diversification: number // 分散性（20点満点）
  liquidity: number // 流動性（15点満点）
  volatilityManagement: number // ボラティリティ管理（15点満点）
  drawdownResistance: number // ドローダウン耐性（15点満点）
  goalAlignment: number // 目標適合性（15点満点）
}

export interface PortfolioScoreResult {
  totalScore: number // 0-100
  breakdown: PortfolioScoreBreakdown
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical'
  improvementSuggestions: string[]
}

export interface PortfolioMetrics {
  // 期待リターン関連
  expectedAnnualReturn: number // %

  // 分散関連
  assetClassCount: number // 資産クラス数（1-5）
  herfindahlIndex: number // 集中度指数（0-1）

  // 流動性
  cashPercentage: number // 現金・債券比率（%）
  liquidAssetPercentage: number // 流動資産比率（%）

  // ボラティリティ
  portfolioVolatility: number // ボラティリオティ（%年率）
  riskFreeRate: number // リスクフリーレート（%）
  sharpeRatio: number // シャープレシオ

  // ドローダウン
  maxDrawdown: number // 過去1年の最大下落率（負の値）

  // 目標適合
  successProbability: number // 達成確率（%）
  yearsToTarget: number // 目標までの年数
}

/**
 * ポートフォリオスコアを計算
 */
export function calculatePortfolioScore(metrics: PortfolioMetrics): PortfolioScoreResult {
  const breakdown = calculateScoreBreakdown(metrics)
  const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0)
  const rating = getRating(totalScore)
  const improvementSuggestions = generateImprovements(breakdown, metrics)

  return {
    totalScore,
    breakdown,
    rating,
    improvementSuggestions,
  }
}

/**
 * 各評価軸のスコアを計算
 */
function calculateScoreBreakdown(metrics: PortfolioMetrics): PortfolioScoreBreakdown {
  return {
    expectedReturn: calculateExpectedReturnScore(metrics.expectedAnnualReturn),
    diversification: calculateDiversificationScore(
      metrics.assetClassCount,
      metrics.herfindahlIndex
    ),
    liquidity: calculateLiquidityScore(metrics.cashPercentage),
    volatilityManagement: calculateVolatilityScore(metrics.sharpeRatio),
    drawdownResistance: calculateDrawdownScore(metrics.maxDrawdown),
    goalAlignment: calculateGoalAlignmentScore(metrics.successProbability),
  }
}

/**
 * 期待リターンスコア（20点満点）
 * 計算式：年率利回り ÷ 10% × 20
 */
function calculateExpectedReturnScore(expectedReturn: number): number {
  const score = (expectedReturn / 10) * 20
  return Math.min(Math.max(score, 0), 20) // 0-20点
}

/**
 * 分散性スコア（20点満点）
 * 資産クラス数とHerfindahl指数から計算
 */
function calculateDiversificationScore(
  assetClassCount: number,
  herfindahlIndex: number
): number {
  let score = 0

  // 資産クラス数による配点
  if (assetClassCount >= 5) {
    score += 15
  } else if (assetClassCount === 4) {
    score += 12
  } else if (assetClassCount === 3) {
    score += 9
  } else if (assetClassCount === 2) {
    score += 5
  } else {
    score += 2
  }

  // Herfindahl指数による追加配点
  // 指数が小さいほど良い（0に近い = 分散している）
  const diversificationBonus = Math.max(5 - herfindahlIndex * 5, 0)
  score += diversificationBonus

  return Math.min(score, 20)
}

/**
 * 流動性スコア（15点満点）
 * 現金・債券比率から計算
 */
function calculateLiquidityScore(cashPercentage: number): number {
  if (cashPercentage >= 15) return 15
  if (cashPercentage >= 10) return 10
  if (cashPercentage >= 5) return 5
  return 0
}

/**
 * ボラティリティ管理スコア（15点満点）
 * シャープレシオから計算
 */
function calculateVolatilityScore(sharpeRatio: number): number {
  if (sharpeRatio >= 1.5) return 15
  if (sharpeRatio >= 1.0) return 10
  if (sharpeRatio >= 0.5) return 5
  return 0
}

/**
 * ドローダウン耐性スコア（15点満点）
 * 過去1年の最大下落率から計算
 */
function calculateDrawdownScore(maxDrawdown: number): number {
  // maxDrawdownは負の値（-5%, -15%等）
  const drawdownAbs = Math.abs(maxDrawdown)

  if (drawdownAbs < 5) return 15
  if (drawdownAbs < 15) return 10
  if (drawdownAbs < 30) return 5
  return 0
}

/**
 * 目標適合性スコア（15点満点）
 * 達成確率から計算
 */
function calculateGoalAlignmentScore(successProbability: number): number {
  if (successProbability >= 80) return 15
  if (successProbability >= 60) return 10
  if (successProbability >= 40) return 5
  return 0
}

/**
 * スコアからレーティングを判定
 */
function getRating(score: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical' {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Fair'
  if (score >= 30) return 'Poor'
  return 'Critical'
}

/**
 * スコア改善提案を生成
 */
function generateImprovements(
  breakdown: PortfolioScoreBreakdown,
  metrics: PortfolioMetrics
): string[] {
  const suggestions: string[] = []

  // 期待リターンが低い場合
  if (breakdown.expectedReturn < 10) {
    suggestions.push(
      'リスク資産（Bitcoin、NASDAQ100等）の比率を増やすことで、期待リターンを向上させることができます。'
    )
  }

  // 分散が不足している場合
  if (breakdown.diversification < 10) {
    suggestions.push(
      metrics.assetClassCount < 5
        ? '新しい資産クラス（REIT、債券等）を追加することで、分散度を向上させることができます。'
        : '現在の資産配分をより均等にリバランスすることで、リスク削減ができます。'
    )
  }

  // 流動性が不足している場合
  if (breakdown.liquidity < 10) {
    suggestions.push(
      '現金・債券比率を増やすことで、流動性リスクを軽減できます。目安は総資産の10-15%です。'
    )
  }

  // ボラティリティが高い場合
  if (breakdown.volatilityManagement < 8) {
    suggestions.push(
      'ディフェンシブ資産（Gold、債券）の比率を増やすことで、ボラティリティを低減できます。'
    )
  }

  // ドローダウン耐性が弱い場合
  if (breakdown.drawdownResistance < 8) {
    suggestions.push(
      '過去1年の最大下落率が大きいため、リスク資産の比率を調整するか、防御的な資産を追加することをお勧めします。'
    )
  }

  // 目標適合性が低い場合
  if (breakdown.goalAlignment < 10) {
    suggestions.push(
      '現在の投資計画では目標達成確率が低いため、年間投資額の増加またはリターン向上が必要です。'
    )
  }

  return suggestions.length > 0 ? suggestions : ['現在のポートフォリオは良好な状態です。戦略を維持してください。']
}

/**
 * Wealth Score（資産形成スコア）計算用の型
 */
export interface WealthMetrics {
  // 総資産の成長
  currentAsset: number
  previousYearAsset: number

  // キャッシュフロー
  annualAddableInvestment: number
  targetAnnualInvestment: number

  // 資産成長率
  cagr: number // 複合年間成長率（%）
  inflationRate: number // インフレ率（%）

  // 目標達成率
  targetAsset: number
  achievementRate: number // %

  // 投資効率
  totalInvested: number // 累計投資額
  assetGrowth: number // 資産成長額

  // 分散維持
  diversificationStability: number // 過去3ヶ月の分散スコア平均
}

export interface WealthScoreResult {
  totalScore: number
  breakdown: {
    assetGrowth: number // 20点
    cashflow: number // 20点
    growthRate: number // 20点
    achievementRate: number // 20点
    investmentEfficiency: number // 10点
    diversificationStability: number // 10点
  }
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical'
}

/**
 * Wealth Score（資産形成スコア）を計算
 */
export function calculateWealthScore(metrics: WealthMetrics): WealthScoreResult {
  const breakdown = {
    assetGrowth: calculateAssetGrowthScore(metrics.currentAsset, metrics.previousYearAsset),
    cashflow: calculateCashflowScore(
      metrics.annualAddableInvestment,
      metrics.targetAnnualInvestment
    ),
    growthRate: calculateGrowthRateScore(metrics.cagr, metrics.inflationRate),
    achievementRate: calculateAchievementRateScore(metrics.achievementRate),
    investmentEfficiency: calculateInvestmentEfficiencyScore(
      metrics.assetGrowth,
      metrics.totalInvested
    ),
    diversificationStability: calculateDiversificationStabilityScore(
      metrics.diversificationStability
    ),
  }

  const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0)
  const rating = getRating(totalScore)

  return {
    totalScore,
    breakdown,
    rating,
  }
}

function calculateAssetGrowthScore(current: number, previous: number): number {
  const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0
  if (growth >= 50) return 20
  if (growth >= 30) return 15
  if (growth >= 10) return 10
  if (growth >= 0) return 5
  return 0
}

function calculateCashflowScore(annual: number, target: number): number {
  if (target === 0) return 20
  const ratio = annual / target
  if (ratio >= 1) return 20
  if (ratio >= 0.8) return 15
  if (ratio >= 0.6) return 10
  if (ratio >= 0.4) return 5
  return 0
}

function calculateGrowthRateScore(cagr: number, inflation: number): number {
  const realGrowth = cagr - inflation
  if (realGrowth >= 10) return 20
  if (realGrowth >= 5) return 15
  if (realGrowth >= 0) return 10
  return 0
}

function calculateAchievementRateScore(rate: number): number {
  if (rate >= 100) return 20
  if (rate >= 80) return 15
  if (rate >= 50) return 10
  if (rate >= 30) return 5
  return 0
}

function calculateInvestmentEfficiencyScore(growth: number, invested: number): number {
  if (invested === 0) return 5
  const ratio = growth / invested
  if (ratio >= 1.5) return 10
  if (ratio >= 1.2) return 7
  if (ratio >= 1.0) return 5
  return 0
}

function calculateDiversificationStabilityScore(stability: number): number {
  // 過去3ヶ月の分散スコア平均が変動 < 3% なら満点
  if (stability > 90) return 10
  if (stability > 80) return 7
  if (stability > 70) return 5
  return 0
}

/**
 * Wealth Score トレンド分析用
 */
export interface WealthScoreTrend {
  month: string
  score: number
  trend: 'up' | 'down' | 'stable'
}

/**
 * 複数月のWealth Score トレンドを分析
 */
export function analyzeWealthScoreTrend(monthlyScores: WealthScoreTrend[]): {
  currentScore: number
  trend: 'improving' | 'declining' | 'stable'
  momentum: number // -1 to 1
  recommendation: string
} {
  if (monthlyScores.length === 0) {
    return {
      currentScore: 0,
      trend: 'stable',
      momentum: 0,
      recommendation: 'データが不足しています。',
    }
  }

  const currentScore = monthlyScores[monthlyScores.length - 1].score

  // トレンド分析：直近3ヶ月
  const recentScores = monthlyScores.slice(-3).map((s) => s.score)
  let momentum = 0

  if (recentScores.length >= 2) {
    const firstHalf = recentScores.slice(0, Math.ceil(recentScores.length / 2))
    const secondHalf = recentScores.slice(Math.ceil(recentScores.length / 2))

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

    momentum = (secondAvg - firstAvg) / 100 // -1 to 1
  }

  let trend: 'improving' | 'declining' | 'stable' = 'stable'
  if (momentum > 0.05) trend = 'improving'
  if (momentum < -0.05) trend = 'declining'

  let recommendation = ''
  if (trend === 'improving') {
    recommendation = '資産形成が加速しています。現在の戦略を継続してください。'
  } else if (trend === 'declining') {
    recommendation = '資産形成が減速しています。キャッシュフロー分析を見直してください。'
  } else {
    recommendation = '現在のペースで推移しています。四半期ごとの見直しをお勧めします。'
  }

  return {
    currentScore,
    trend,
    momentum,
    recommendation,
  }
}
