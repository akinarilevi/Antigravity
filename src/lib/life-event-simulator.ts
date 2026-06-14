/**
 * Life Event Simulator
 * 人生イベント（結婚、子ども、転職等）のシミュレーション
 */

export type LifeEventType =
  | 'marriage'
  | 'child_birth'
  | 'job_change'
  | 'promotion'
  | 'home_purchase'
  | 'early_retirement'
  | 'sabbatical'
  | 'inheritance'
  | 'major_expense'

export interface LifeEvent {
  type: LifeEventType
  name: string
  description: string
  triggerAge: number
  duration: number // 年数
  cashflowImpact: {
    annualIncomeChange: number // JPY
    annualExpenseChange: number // JPY
  }
  wealthImpact: number // JPY (一次的な資産変化)
  successProbability: number // %
}

export interface LifeEventScenario {
  name: string
  description: string
  events: LifeEvent[]
  startAge: number
  endAge: number
}

export interface SimulationResult {
  scenarioName: string
  projectedAssetAt35: number // 35歳での予測資産
  projectedAssetAt40: number // 40歳での予測資産
  achievementProbability35: number // 35歳2億円達成確率
  achievementProbability40: number // 40歳3億円達成確率
  totalCashflowImpact: number // 累積キャッシュフロー影響
  riskAssessment: string
}

/**
 * 人生イベントのプリセット定義
 */
export const LIFE_EVENTS: Record<LifeEventType, Partial<LifeEvent>> = {
  marriage: {
    name: '結婚',
    description: '結婚に伴う支出増加と、パートナーの収入増加',
    duration: 0,
    cashflowImpact: {
      annualIncomeChange: 0, // パートナー次第
      annualExpenseChange: 2000000, // 生活費増加
    },
    wealthImpact: -3000000, // 式費用等
    successProbability: 80,
  },
  child_birth: {
    name: '子ども出産',
    description: '教育費、育児費による支出増加',
    duration: 18,
    cashflowImpact: {
      annualIncomeChange: -2000000, // 育休等による減収
      annualExpenseChange: 3000000, // 子育て費用
    },
    wealthImpact: -2000000, // 出産費用
    successProbability: 75,
  },
  job_change: {
    name: '転職',
    description: '新しい職場への転職',
    duration: 0,
    cashflowImpact: {
      annualIncomeChange: -2000000, // 通常は給与低下（スタート時）
      annualExpenseChange: 1000000, // 転居費用等
    },
    wealthImpact: -2000000,
    successProbability: 60,
  },
  promotion: {
    name: '昇進',
    description: '職場での昇進による給与増加',
    duration: 0,
    cashflowImpact: {
      annualIncomeChange: 5000000, // 給与増加
      annualExpenseChange: 1000000, // ライフスタイル向上
    },
    wealthImpact: 1000000,
    successProbability: 50,
  },
  home_purchase: {
    name: '住宅購入',
    description: '自宅購入に伴う費用と住宅ローン',
    duration: 30,
    cashflowImpact: {
      annualIncomeChange: 0,
      annualExpenseChange: 3000000, // 住宅ローン返済
    },
    wealthImpact: -10000000, // 頭金等
    successProbability: 70,
  },
  early_retirement: {
    name: '早期リタイア',
    description: '仕事を辞めて隠居生活',
    duration: 0,
    cashflowImpact: {
      annualIncomeChange: -25000000, // 給与喪失
      annualExpenseChange: -5000000, // 生活費削減
    },
    wealthImpact: 0,
    successProbability: 30,
  },
  sabbatical: {
    name: 'サバティカル休暇',
    description: '一時的な仕事休止',
    duration: 1,
    cashflowImpact: {
      annualIncomeChange: -15000000, // 給与一時停止
      annualExpenseChange: 2000000, // 旅行費用等
    },
    wealthImpact: -3000000,
    successProbability: 40,
  },
  inheritance: {
    name: '相続',
    description: '親からの相続金受け取り',
    duration: 0,
    cashflowImpact: {
      annualIncomeChange: 0,
      annualExpenseChange: 0,
    },
    wealthImpact: 50000000, // 相続金（仮値）
    successProbability: 20,
  },
  major_expense: {
    name: '大きな支出',
    description: '医療費、修理等の想定外の大きな支出',
    duration: 0,
    cashflowImpact: {
      annualIncomeChange: 0,
      annualExpenseChange: 0,
    },
    wealthImpact: -5000000, // 支出額
    successProbability: 60,
  },
}

/**
 * 事前定義されたシナリオ
 */
export function getPreDefinedScenarios(): LifeEventScenario[] {
  return [
    {
      name: '順調シナリオ',
      description: '昇進と家族増加が予定通り進む標準的なシナリオ',
      events: [
        {
          ...LIFE_EVENTS.promotion,
          triggerAge: 32,
        } as LifeEvent,
        {
          ...LIFE_EVENTS.marriage,
          triggerAge: 30,
        } as LifeEvent,
        {
          ...LIFE_EVENTS.child_birth,
          triggerAge: 32,
        } as LifeEvent,
      ],
      startAge: 30,
      endAge: 50,
    },
    {
      name: '保守的シナリオ',
      description: '転職と家族計画がないシナリオ',
      events: [
        {
          ...LIFE_EVENTS.promotion,
          triggerAge: 35,
        } as LifeEvent,
      ],
      startAge: 30,
      endAge: 50,
    },
    {
      name: '積極的シナリオ',
      description: '複数回の昇進と相続を想定するシナリオ',
      events: [
        {
          ...LIFE_EVENTS.promotion,
          triggerAge: 32,
        } as LifeEvent,
        {
          ...LIFE_EVENTS.promotion,
          triggerAge: 37,
          cashflowImpact: { annualIncomeChange: 8000000, annualExpenseChange: 1500000 },
        } as LifeEvent,
        {
          ...LIFE_EVENTS.inheritance,
          triggerAge: 45,
          wealthImpact: 100000000,
        } as LifeEvent,
      ],
      startAge: 30,
      endAge: 50,
    },
  ]
}

/**
 * シミュレーションを実行
 */
export function simulateScenario(
  scenario: LifeEventScenario,
  currentAsset: number,
  currentAge: number,
  baseAnnualInvestment: number,
  baseExpectedReturn: number
): SimulationResult {
  let asset = currentAsset
  let totalCashflowImpact = 0
  let cumulativeCashflowChange = 0

  // 各年齢でイベントを適用
  for (let age = currentAge + 1; age <= scenario.endAge; age++) {
    // イベント効果を適用
    const eventsThisYear = scenario.events.filter((e) => e.triggerAge === age)

    eventsThisYear.forEach((event) => {
      // 一次的な資産変化
      asset += event.wealthImpact

      // キャッシュフロー変化を計算
      cumulativeCashflowChange +=
        event.cashflowImpact.annualIncomeChange - event.cashflowImpact.annualExpenseChange

      totalCashflowImpact +=
        event.cashflowImpact.annualIncomeChange - event.cashflowImpact.annualExpenseChange
    })

    // 年間投資額を計算（キャッシュフロー影響を反映）
    const annualInvestment = Math.max(0, baseAnnualInvestment + cumulativeCashflowChange)

    // 複利成長を適用
    const returnRate = baseExpectedReturn / 100
    asset = asset * (1 + returnRate) + annualInvestment
  }

  // 35歳と40歳での資産を抽出
  let asset35 = 0,
    asset40 = 0
  asset = currentAsset

  for (let age = currentAge + 1; age <= 50; age++) {
    const eventsThisYear = scenario.events.filter((e) => e.triggerAge === age)
    eventsThisYear.forEach((event) => {
      asset += event.wealthImpact
      cumulativeCashflowChange +=
        event.cashflowImpact.annualIncomeChange - event.cashflowImpact.annualExpenseChange
    })

    const annualInvestment = Math.max(0, baseAnnualInvestment + cumulativeCashflowChange)
    const returnRate = baseExpectedReturn / 100
    asset = asset * (1 + returnRate) + annualInvestment

    if (age === 35) asset35 = asset
    if (age === 40) asset40 = asset
  }

  // 達成確率を計算（簡略版）
  const prob35 = asset35 >= 200000000 ? 80 : Math.min((asset35 / 200000000) * 80, 80)
  const prob40 = asset40 >= 300000000 ? 85 : Math.min((asset40 / 300000000) * 85, 85)

  // リスク評価
  const riskAssessment =
    totalCashflowImpact < -50000000
      ? '高リスク: 大きなキャッシュフロー減少が予想されます'
      : totalCashflowImpact < 0
        ? '中リスク: キャッシュフロー減少が予想されます'
        : 'ポジティブ: キャッシュフロー改善が予想されます'

  return {
    scenarioName: scenario.name,
    projectedAssetAt35: asset35,
    projectedAssetAt40: asset40,
    achievementProbability35: prob35,
    achievementProbability40: prob40,
    totalCashflowImpact,
    riskAssessment,
  }
}

/**
 * 複数シナリオを比較
 */
export function compareScenarios(
  scenarios: LifeEventScenario[],
  currentAsset: number,
  currentAge: number,
  baseAnnualInvestment: number,
  baseExpectedReturn: number
): SimulationResult[] {
  return scenarios.map((scenario) =>
    simulateScenario(scenario, currentAsset, currentAge, baseAnnualInvestment, baseExpectedReturn)
  )
}
