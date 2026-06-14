import { prisma } from '@/lib/db'
import { getUsdJpy } from '@/lib/fx'
import { getAllHoldingValues } from '@/lib/pricing'
import { analyzeGoalGap } from '@/lib/goal-gap-analyzer'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const userId = 'default-user'

/**
 * GET /api/goals/gap-analysis
 * 目標との差分分析を実行
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const targetAge = parseInt(searchParams.get('targetAge') || '35', 10)

    // ユーザープロフィール取得
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    })

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // 目標取得
    const goal = await prisma.goal.findUnique({
      where: {
        userId_targetAge: {
          userId,
          targetAge,
        },
      },
    })

    if (!goal) {
      return NextResponse.json(
        { error: `Goal for age ${targetAge} not found` },
        { status: 404 }
      )
    }

    // 現在資産を更新
    let currentAsset = userProfile.currentAsset
    try {
      const holdings = await prisma.holding.findMany()
      if (holdings.length > 0) {
        const usdJpy = await getUsdJpy()
        const holdingValues = await getAllHoldingValues(holdings, usdJpy)
        currentAsset = holdingValues.reduce((sum, h) => sum + h.valueJpy, 0)
      }
    } catch (error) {
      console.warn('Failed to update current asset, using stored value')
    }

    // キャッシュフロー情報を取得
    const currentYear = new Date().getFullYear()
    const cashflow = await prisma.cashflow.findUnique({
      where: {
        userId_year: {
          userId,
          year: currentYear,
        },
      },
    })

    const annualAddInvestment = cashflow?.annualAddableInvestment || 12000000
    const expectedReturn = 8

    // 目標との差分を分析
    const analysis = analyzeGoalGap(
      currentAsset,
      goal.targetAsset,
      userProfile.currentAge,
      targetAge,
      annualAddInvestment,
      expectedReturn,
      goal.successProbability || 0
    )

    return NextResponse.json({
      targetAge,
      analysis,
      metadata: {
        analyzedAt: new Date().toISOString(),
        userAge: userProfile.currentAge,
        yearsToTarget: targetAge - userProfile.currentAge,
      },
    })
  } catch (error) {
    console.error('Failed to analyze goal gap:', error)
    return NextResponse.json(
      { error: 'Failed to analyze goal gap' },
      { status: 500 }
    )
  }
}
