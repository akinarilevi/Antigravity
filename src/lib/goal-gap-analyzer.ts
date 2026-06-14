/**
 * Goal Gap Analysis Engine
 * 目標との差分を分析し、解決方法を提案する
 */

export interface GoalGapAnalysis {
  targetAge: number
  targetAsset: number // JPY
  currentAsset: number // JPY
  remainingAmount: number // JPY
  achievementRate: number // %
  successProbability: number // %
  requiredReturn: number // %

  // 解決方法
  solutions: SolutionOption[]
}

export interface SolutionOption {
  type: 'INCREASE_INVESTMENT' | 'IMPROVE_RETURN' | 'COMBINED'
  description: string

  // 現在の年間追加投資額
  currentAnnualInvestment: number

  // 必要な年間追加投資額（この方法を単独で使う場合）
  requiredAnnualInvestment?: number
  increaseAmount?: number // 現在値からの増加額

  // 必要な期待利回り（この方法を単独で使う場合）
  requiredReturn?: number
  returnImprovement?: number // 現在値からの改善度

  // 組み合わせ案
  combinedScenarios?: CombinedScenario[]

  // 実現可能性評価
  feasibilityScore: number // 0-100
  feasibilityComment: string
}

export interface CombinedScenario {
  name: string
  annualInvestmentIncrease: number // 追加投資額の増加
  returnImprovement: number // 利回り改善（%）
  description: string
}

/**
 * 目標との差分を分析
 */
export function analyzeGoalGap(
  currentAsset: number,
  targetAsset: number,
  currentAge: number,
  targetAge: number,
  currentAnnualInvestment: number,
  currentExpectedReturn: number,
  successProbability: number
): GoalGapAnalysis {
  const remainingAmount = Math.max(0, targetAsset - currentAsset)
  const achievementRate = (currentAsset / targetAsset) * 100
  const yearsToTarget = targetAge - currentAge

  // 解決方法を生成
  const solutions = generateSolutions(
    remainingAmount,
    yearsToTarget,
    currentAnnualInvestment,
    currentExpectedReturn,
    successProbability
  )

  return {
    targetAge,
    targetAsset,
    currentAsset,
    remainingAmount,
    achievementRate,
    successProbability,
    requiredReturn: calculateRequiredReturn(
      currentAsset,
      currentAnnualInvestment,
      targetAsset,
      yearsToTarget
    ),
    solutions,
  }
}

/**
 * 解決方法を生成
 */
function generateSolutions(
  remainingAmount: number,
  yearsToTarget: number,
  currentAnnualInvestment: number,
  currentExpectedReturn: number,
  successProbability: number
): SolutionOption[] {
  const solutions: SolutionOption[] = []

  // 方法1: 年間追加投資を増やす
  const investmentSolution = generateInvestmentSolution(
    remainingAmount,
    yearsToTarget,
    currentAnnualInvestment,
    currentExpectedReturn
  )
  if (investmentSolution) solutions.push(investmentSolution)

  // 方法2: 期待利回りを改善する
  const returnSolution = generateReturnSolution(
    remainingAmount,
    yearsToTarget,
    currentAnnualInvestment,
    currentExpectedReturn
  )
  if (returnSolution) solutions.push(returnSolution)

  // 方法3: 組み合わせ案
  const combinedSolution = generateCombinedSolution(
    remainingAmount,
    yearsToTarget,
    currentAnnualInvestment,
    currentExpectedReturn
  )
  if (combinedSolution) solutions.push(combinedSolution)

  return solutions
}

/**
 * 投資額増加による解決方法
 */
function generateInvestmentSolution(
  remainingAmount: number,
  yearsToTarget: number,
  currentAnnualInvestment: number,
  expectedReturn: number
): SolutionOption | null {
  // 複利計算で必要な年間投資額を逆算
  let requiredAnnual = remainingAmount / yearsToTarget

  // より正確な複利計算
  const rate = expectedReturn / 100
  if (rate !== 0) {
    const future = remainingAmount
    const annuityFactor = ((Math.pow(1 + rate, yearsToTarget) - 1) / rate)
    requiredAnnual = future / annuityFactor
  }

  const increaseAmount = Math.max(0, requiredAnnual - currentAnnualInvestment)
  const feasibilityScore = calculateInvestmentFeasibility(increaseAmount, currentAnnualInvestment)

  return {
    type: 'INCREASE_INVESTMENT',
    description: `年間追加投資を${formatJpyAmount(increaseAmount)}増やす`,
    currentAnnualInvestment,
    requiredAnnualInvestment: requiredAnnual,
    increaseAmount,
    feasibilityScore,
    feasibilityComment: getFeasibilityComment(feasibilityScore),
    combinedScenarios: [
      {
        name: '年間投資額を+500万円に引き上げる',
        annualInvestmentIncrease: 5000000,
        returnImprovement: 0,
        description: '段階的に投資額を増やすことで実現可能性を高める',
      },
      {
        name: '年間投資額を+1000万円に引き上げる',
        annualInvestmentIncrease: 10000000,
        returnImprovement: 0,
        description: '事業利益の大幅増加や支出削減が必要',
      },
    ],
  }
}

/**
 * 期待利回り改善による解決方法
 */
function generateReturnSolution(
  remainingAmount: number,
  yearsToTarget: number,
  currentAnnualInvestment: number,
  currentExpectedReturn: number
): SolutionOption | null {
  const currentRate = currentExpectedReturn / 100
  const targetValue = calculateFutureValue(
    currentAnnualInvestment,
    currentRate,
    yearsToTarget
  )

  // 必要な利回りを逆算
  let requiredRate = currentRate
  let low = 0
  let high = 0.5

  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2
    const fv = calculateFutureValue(currentAnnualInvestment, mid, yearsToTarget)
    if (fv < remainingAmount) {
      low = mid
    } else {
      high = mid
    }
  }
  requiredRate = high

  const returnImprovement = (requiredRate - currentRate) * 100
  const feasibilityScore = calculateReturnFeasibility(returnImprovement)

  return {
    type: 'IMPROVE_RETURN',
    description: `期待利回りを${returnImprovement.toFixed(1)}%改善する`,
    currentAnnualInvestment,
    requiredReturn: requiredRate * 100,
    returnImprovement,
    feasibilityScore,
    feasibilityComment: getFeasibilityComment(feasibilityScore),
    combinedScenarios: [
      {
        name: 'ポートフォリオをよりリスク高めにリバランス',
        annualInvestmentIncrease: 0,
        returnImprovement: 2,
        description: 'Bitcoin比率を増やすなど、より高リターンの資産へ配分',
      },
      {
        name: '事業投資からのリターン向上',
        annualInvestmentIncrease: 0,
        returnImprovement: 3,
        description: '事業の成長によってリターンを向上させる',
      },
    ],
  }
}

/**
 * 組み合わせ案
 */
function generateCombinedSolution(
  remainingAmount: number,
  yearsToTarget: number,
  currentAnnualInvestment: number,
  currentExpectedReturn: number
): SolutionOption | null {
  return {
    type: 'COMBINED',
    description: '投資額と利回りの両方を改善する',
    currentAnnualInvestment,
    feasibilityScore: 85,
    feasibilityComment: '現実的で実現可能性が高い',
    combinedScenarios: [
      {
        name: 'バランス案A（推奨）',
        annualInvestmentIncrease: 3000000,
        returnImprovement: 1.5,
        description: '年間投資を3,000万円増やしつつ、ポートフォリオをリバランス',
      },
      {
        name: 'バランス案B',
        annualInvestmentIncrease: 5000000,
        returnImprovement: 1,
        description: '年間投資を5,000万円増やし、利回り改善は1%程度',
      },
      {
        name: 'バランス案C',
        annualInvestmentIncrease: 2000000,
        returnImprovement: 2.5,
        description: '投資額は控えめに増やし、リスク資産への配分を大幅に増加',
      },
    ],
  }
}

/**
 * 投資額増加の実現可能性スコア
 */
function calculateInvestmentFeasibility(
  increaseAmount: number,
  currentAmount: number
): number {
  const ratio = increaseAmount / currentAmount

  if (ratio <= 0.5) return 95 // 50%以下の増加
  if (ratio <= 1.0) return 80 // 100%以下
  if (ratio <= 1.5) return 60 // 150%以下
  return 30 // 150%以上（難しい）
}

/**
 * 利回り改善の実現可能性スコア
 */
function calculateReturnFeasibility(improvement: number): number {
  if (improvement <= 1) return 90
  if (improvement <= 2) return 75
  if (improvement <= 3) return 50
  return 20
}

function getFeasibilityComment(score: number): string {
  if (score >= 80) return '現実的で実現可能性が高い'
  if (score >= 60) return '実現には努力が必要'
  if (score >= 40) return '相当な努力が必要'
  return 'かなり難しい'
}

function calculateFutureValue(
  annualInvestment: number,
  annualRate: number,
  years: number
): number {
  let value = 0
  for (let i = 0; i < years; i++) {
    value = value * (1 + annualRate) + annualInvestment
  }
  return value
}

function calculateRequiredReturn(
  currentAsset: number,
  annualInvestment: number,
  targetAsset: number,
  years: number
): number {
  // 二分探索で必要利回りを求める
  let low = 0
  let high = 0.5

  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2
    const fv = calculateFutureValue(annualInvestment, mid, years) + currentAsset * Math.pow(1 + mid, years)
    if (fv < targetAsset) {
      low = mid
    } else {
      high = mid
    }
  }

  return high * 100
}

function formatJpyAmount(amount: number): string {
  if (amount >= 100000000) {
    return `¥${(amount / 100000000).toFixed(1)}億円`
  } else if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(0)}万円`
  }
  return `¥${amount.toFixed(0)}`
}
