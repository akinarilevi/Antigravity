/**
 * Wealth Projection Engine
 * 将来資産予測（複利計算）
 */

export interface ProjectionInput {
  currentAge: number
  currentAsset: number // JPY
  annualAddInvestment: number // JPY
  expectedAnnualReturn: number // %
  endAge?: number // 予測終了年齢
}

export interface YearlyProjection {
  age: number
  year: number
  projectedAsset: number
  capitalContribution: number // その年までの投資額合計
  investmentGain: number // その年までの利益
  investmentGainPercent: number // 利益率
}

/**
 * 複数年の資産予測を計算
 */
export function calculateWealthProjection(input: ProjectionInput): YearlyProjection[] {
  const {
    currentAge,
    currentAsset,
    annualAddInvestment,
    expectedAnnualReturn,
    endAge = 50,
  } = input

  const projections: YearlyProjection[] = []
  let currentValue = currentAsset
  let totalContribution = currentAsset
  let yearsFromNow = 0

  for (let age = currentAge; age <= endAge; age++) {
    // 利益
    const investmentGain = currentValue - totalContribution
    const investmentGainPercent =
      totalContribution > 0 ? (investmentGain / totalContribution) * 100 : 0

    projections.push({
      age,
      year: new Date().getFullYear() + yearsFromNow,
      projectedAsset: currentValue,
      capitalContribution: totalContribution,
      investmentGain,
      investmentGainPercent,
    })

    // 次年度計算（最後の年齢は計算しない）
    if (age < endAge) {
      const yearlyReturn = currentValue * (expectedAnnualReturn / 100)
      currentValue = currentValue + yearlyReturn + annualAddInvestment
      totalContribution += annualAddInvestment
      yearsFromNow++
    }
  }

  return projections
}

/**
 * 指定年齢の予測資産を取得
 */
export function getProjectionAtAge(
  projections: YearlyProjection[],
  targetAge: number
): YearlyProjection | null {
  return projections.find((p) => p.age === targetAge) || null
}

/**
 * 複数の目標に対する予測結果を取得
 */
export function getProjectionsForGoals(
  currentAge: number,
  currentAsset: number,
  annualAddInvestment: number,
  expectedAnnualReturn: number,
  goalAges: number[]
): Record<number, YearlyProjection | null> {
  const maxGoalAge = Math.max(...goalAges)
  const projections = calculateWealthProjection({
    currentAge,
    currentAsset,
    annualAddInvestment,
    expectedAnnualReturn,
    endAge: maxGoalAge,
  })

  const result: Record<number, YearlyProjection | null> = {}
  goalAges.forEach((age) => {
    result[age] = getProjectionAtAge(projections, age)
  })

  return result
}
