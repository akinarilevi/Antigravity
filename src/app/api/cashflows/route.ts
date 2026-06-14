import { prisma } from '@/lib/db'
import { calculateCashflow } from '@/lib/cashflow-calculator'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const userId = 'default-user'
const currentYear = new Date().getFullYear()

/**
 * GET /api/cashflows
 * 当年度のキャッシュフロー情報を取得
 */
export async function GET() {
  try {
    // 当年度のキャッシュフロー取得
    let cashflow = await prisma.cashflow.findUnique({
      where: {
        userId_year: {
          userId,
          year: currentYear,
        },
      },
    })

    // キャッシュフロー情報がない場合はデフォルト値で作成
    if (!cashflow) {
      cashflow = await prisma.cashflow.create({
        data: {
          userId,
          year: currentYear,
          corporateProfit: 0,
          executiveComp: 0,
          otherIncome: 0,
          livingExpense: 0,
          fixedExpense: 0,
        },
      })
    }

    // キャッシュフロー計算
    const result = calculateCashflow({
      corporateProfit: cashflow.corporateProfit || 0,
      executiveComp: cashflow.executiveComp || 0,
      otherIncome: cashflow.otherIncome || 0,
      livingExpense: cashflow.livingExpense || 0,
      fixedExpense: cashflow.fixedExpense || 0,
    })

    // 計算結果をデータベースに保存
    cashflow = await prisma.cashflow.update({
      where: { id: cashflow.id },
      data: {
        annualAddableInvestment: result.annualAddableInvestment,
        monthlyAddableInvestment: result.monthlyAddableInvestment,
      },
    })

    return NextResponse.json({
      cashflow,
      analysis: result,
      year: currentYear,
    })
  } catch (error) {
    console.error('Failed to fetch cashflows:', error)
    return NextResponse.json({ error: 'Failed to fetch cashflows' }, { status: 500 })
  }
}

/**
 * PUT /api/cashflows
 * キャッシュフロー情報を更新
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      corporateProfit,
      executiveComp,
      otherIncome,
      livingExpense,
      fixedExpense,
    } = body

    // 入力値の検証
    if (
      corporateProfit === undefined ||
      executiveComp === undefined ||
      otherIncome === undefined ||
      livingExpense === undefined ||
      fixedExpense === undefined
    ) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // キャッシュフロー計算
    const result = calculateCashflow({
      corporateProfit,
      executiveComp,
      otherIncome,
      livingExpense,
      fixedExpense,
    })

    // キャッシュフロー更新
    const cashflow = await prisma.cashflow.upsert({
      where: {
        userId_year: {
          userId,
          year: currentYear,
        },
      },
      update: {
        corporateProfit,
        executiveComp,
        otherIncome,
        livingExpense,
        fixedExpense,
        annualAddableInvestment: result.annualAddableInvestment,
        monthlyAddableInvestment: result.monthlyAddableInvestment,
      },
      create: {
        userId,
        year: currentYear,
        corporateProfit,
        executiveComp,
        otherIncome,
        livingExpense,
        fixedExpense,
        annualAddableInvestment: result.annualAddableInvestment,
        monthlyAddableInvestment: result.monthlyAddableInvestment,
      },
    })

    return NextResponse.json({
      cashflow,
      analysis: result,
    })
  } catch (error) {
    console.error('Failed to update cashflows:', error)
    return NextResponse.json({ error: 'Failed to update cashflows' }, { status: 500 })
  }
}
