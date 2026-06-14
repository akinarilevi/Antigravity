/**
 * キャッシュフロー分析エンジン
 * 年間追加投資可能額を計算
 */

export interface CashflowInput {
  corporateProfit?: number // 法人利益（JPY）
  executiveComp?: number // 役員報酬（JPY）
  otherIncome?: number // その他収入（JPY）
  livingExpense?: number // 生活費（JPY）
  fixedExpense?: number // 固定費（JPY）
}

export interface CashflowResult {
  totalIncome: number // 総収入
  totalExpense: number // 総支出
  netCashFlow: number // 純キャッシュフロー
  annualAddableInvestment: number // 年間追加投資可能額
  monthlyAddableInvestment: number // 月間追加投資可能額
}

/**
 * キャッシュフロー分析を実行
 */
export function calculateCashflow(input: CashflowInput): CashflowResult {
  const corporateProfit = input.corporateProfit || 0
  const executiveComp = input.executiveComp || 0
  const otherIncome = input.otherIncome || 0
  const livingExpense = input.livingExpense || 0
  const fixedExpense = input.fixedExpense || 0

  // 総収入
  const totalIncome = corporateProfit + executiveComp + otherIncome

  // 総支出
  const totalExpense = livingExpense + fixedExpense

  // 純キャッシュフロー
  const netCashFlow = totalIncome - totalExpense

  // 年間追加投資可能額（純CF が負の場合は0）
  const annualAddableInvestment = Math.max(0, netCashFlow)

  // 月間追加投資可能額
  const monthlyAddableInvestment = annualAddableInvestment / 12

  return {
    totalIncome,
    totalExpense,
    netCashFlow,
    annualAddableInvestment,
    monthlyAddableInvestment,
  }
}

/**
 * キャッシュフロー収支内訳を取得
 */
export function getCashflowBreakdown(input: CashflowInput) {
  const result = calculateCashflow(input)

  return {
    income: {
      corporateProfit: input.corporateProfit || 0,
      executiveComp: input.executiveComp || 0,
      otherIncome: input.otherIncome || 0,
      total: result.totalIncome,
    },
    expense: {
      livingExpense: input.livingExpense || 0,
      fixedExpense: input.fixedExpense || 0,
      total: result.totalExpense,
    },
    result: result,
  }
}
