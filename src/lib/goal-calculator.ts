/**
 * Goal-Based Wealth OS: 目標達成確率計算エンジン
 *
 * モンテカルロシミュレーションで達成確率を計算
 */

interface GoalCalculationInput {
  currentAge: number
  currentAsset: number // JPY
  targetAge: number
  targetAsset: number // JPY
  annualAddInvestment?: number // JPY
  expectedAnnualReturn?: number // %
}

interface GoalCalculationResult {
  achievementRate: number // %
  remainingAmount: number // JPY
  requiredReturn: number // %
  successProbability: number // %
  projectedAsset: number // JPY at targetAge
}

/**
 * 目標達成確率を計算
 */
export function calculateGoalMetrics(
  input: GoalCalculationInput
): GoalCalculationResult {
  const { currentAge, currentAsset, targetAge, targetAsset, annualAddInvestment = 0, expectedAnnualReturn = 8 } = input

  const yearsToTarget = targetAge - currentAge
  if (yearsToTarget <= 0) {
    return {
      achievementRate: currentAsset >= targetAsset ? 100 : (currentAsset / targetAsset) * 100,
      remainingAmount: Math.max(0, targetAsset - currentAsset),
      requiredReturn: 0,
      successProbability: currentAsset >= targetAsset ? 100 : 0,
      projectedAsset: currentAsset,
    }
  }

  // 単純複利計算（ベースケース）
  let projectedAsset = currentAsset
  for (let i = 0; i < yearsToTarget; i++) {
    projectedAsset = projectedAsset * (1 + expectedAnnualReturn / 100) + annualAddInvestment
  }

  const achievementRate = (currentAsset / targetAsset) * 100

  // 必要利回り計算（Newton法で近似）
  let requiredReturn = calculateRequiredReturn(currentAsset, annualAddInvestment, targetAsset, yearsToTarget)

  // 達成確率計算（モンテカルロシミュレーション）
  const successProbability = calculateSuccessProbability(
    currentAsset,
    annualAddInvestment,
    targetAsset,
    yearsToTarget,
    expectedAnnualReturn
  )

  return {
    achievementRate,
    remainingAmount: Math.max(0, targetAsset - currentAsset),
    requiredReturn,
    successProbability,
    projectedAsset,
  }
}

/**
 * 必要利回りを計算（年間追加投資を考慮）
 */
function calculateRequiredReturn(
  currentAsset: number,
  annualAddInvestment: number,
  targetAsset: number,
  years: number
): number {
  // FV = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
  // targetAsset = currentAsset * (1 + r)^n + annualAddInvestment * [((1 + r)^n - 1) / r]

  if (currentAsset + annualAddInvestment * years >= targetAsset) {
    return 0 // すでに達成可能
  }

  // Newton法で求解
  let r = 0.08 // 初期値 8%
  for (let iter = 0; iter < 10; iter++) {
    const term1 = currentAsset * Math.pow(1 + r, years)
    const term2 = annualAddInvestment * ((Math.pow(1 + r, years) - 1) / r)
    const fv = term1 + term2
    const diff = fv - targetAsset

    if (Math.abs(diff) < 1000) break

    // 導関数で更新
    const dr = 0.0001
    const term1Next = currentAsset * Math.pow(1 + r + dr, years)
    const term2Next = annualAddInvestment * ((Math.pow(1 + r + dr, years) - 1) / (r + dr))
    const fvNext = term1Next + term2Next
    const derivative = (fvNext - fv) / dr

    r = r - diff / derivative
    r = Math.max(-0.5, Math.min(0.5, r)) // 上限・下限設定
  }

  return Math.max(0, r * 100)
}

/**
 * 達成確率をモンテカルロシミュレーションで計算
 */
function calculateSuccessProbability(
  currentAsset: number,
  annualAddInvestment: number,
  targetAsset: number,
  years: number,
  expectedReturn: number
): number {
  const simulations = 1000
  const volatility = 0.15 // 年間変動率を15%と仮定
  let successes = 0

  for (let sim = 0; sim < simulations; sim++) {
    let asset = currentAsset
    for (let year = 0; year < years; year++) {
      // 正規分布に基づくランダムリターン
      const randomReturn = expectedReturn + volatility * 100 * (Math.random() + Math.random() - 1)
      asset = asset * (1 + randomReturn / 100) + annualAddInvestment
    }

    if (asset >= targetAsset) {
      successes++
    }
  }

  return (successes / simulations) * 100
}
