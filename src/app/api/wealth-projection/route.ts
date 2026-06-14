import { prisma } from '@/lib/db'
import { getUsdJpy } from '@/lib/fx'
import { getAllHoldingValues } from '@/lib/pricing'
import { calculateWealthProjection } from '@/lib/wealth-projection'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const userId = 'default-user'

/**
 * GET /api/wealth-projection
 * 将来資産予測を計算
 *
 * @query endAge 予測終了年齢（デフォルト: 50）
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const endAge = parseInt(searchParams.get('endAge') || '50', 10)

    // ユーザープロフィール取得
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    })

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // 現在資産を最新値に更新
    let totalAsset = userProfile.currentAsset
    try {
      const holdings = await prisma.holding.findMany()
      if (holdings.length > 0) {
        const usdJpy = await getUsdJpy()
        const holdingValues = await getAllHoldingValues(holdings, usdJpy)
        totalAsset = holdingValues.reduce((sum, h) => sum + h.valueJpy, 0)
      }
    } catch (error) {
      // API制限の場合は前回保存された値を使用
      console.warn('Failed to update current asset from holdings, using stored value')
    }

    // キャッシュフロー情報を取得（年間追加投資額）
    const currentYear = new Date().getFullYear()
    const cashflow = await prisma.cashflow.findUnique({
      where: {
        userId_year: {
          userId,
          year: currentYear,
        },
      },
    })

    const annualAddInvestment = cashflow?.annualAddableInvestment || 12000000 // デフォルト: 1200万
    const expectedAnnualReturn = 8 // デフォルト: 8%

    // 将来資産予測を計算
    const projections = calculateWealthProjection({
      currentAge: userProfile.currentAge,
      currentAsset: totalAsset,
      annualAddInvestment,
      expectedAnnualReturn,
      endAge,
    })

    // データベースに保存
    const today = new Date()
    for (const projection of projections) {
      await prisma.wealthProjection.upsert({
        where: {
          userId_calculationDate_targetAge_scenarioName: {
            userId,
            calculationDate: today,
            targetAge: projection.age,
            scenarioName: 'BASE',
          },
        },
        update: {
          expectedAsset: projection.projectedAsset,
          expectedReturn: projection.investmentGainPercent,
          assumptions: JSON.stringify({
            currentAsset: totalAsset,
            annualAddInvestment,
            expectedAnnualReturn,
          }),
        },
        create: {
          userId,
          calculationDate: today,
          targetAge: projection.age,
          expectedAsset: projection.projectedAsset,
          expectedReturn: projection.investmentGainPercent,
          scenarioName: 'BASE',
          assumptions: JSON.stringify({
            currentAsset: totalAsset,
            annualAddInvestment,
            expectedAnnualReturn,
          }),
        },
      })
    }

    return NextResponse.json({
      userProfile: {
        age: userProfile.currentAge,
        currentAsset: totalAsset,
      },
      parameters: {
        annualAddInvestment,
        expectedAnnualReturn,
      },
      projections,
    })
  } catch (error) {
    console.error('Failed to calculate wealth projection:', error)
    return NextResponse.json(
      { error: 'Failed to calculate wealth projection' },
      { status: 500 }
    )
  }
}
