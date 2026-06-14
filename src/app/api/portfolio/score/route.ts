import { prisma } from '@/lib/db'
import { getUsdJpy } from '@/lib/fx'
import { getAllHoldingValues } from '@/lib/pricing'
import { calculatePortfolioScore, PortfolioMetrics } from '@/lib/portfolio-score'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const userId = 'default-user'

/**
 * GET /api/portfolio/score
 * ポートフォリオスコア（0-100点）を計算
 */
export async function GET(req: Request) {
  try {
    // ユーザープロフィール取得
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    })

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // 目標取得
    const goals = await prisma.goal.findMany({
      where: { userId },
    })

    // ホールディング取得
    const holdings = await prisma.holding.findMany()
    let totalAsset = userProfile.currentAsset

    try {
      const usdJpy = await getUsdJpy()
      const holdingValues = await getAllHoldingValues(holdings, usdJpy)
      totalAsset = holdingValues.reduce((sum, h) => sum + h.valueJpy, 0)
    } catch (error) {
      console.warn('Failed to fetch current holding values, using stored asset:', error)
      // Use stored asset value
    }

    // 1年前の総資産を取得
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const yearAgoSnapshot = await prisma.assetSnapshot.findFirst({
      where: {
        date: {
          lte: oneYearAgo,
        },
      },
      orderBy: { date: 'desc' },
    })

    const previousYearAsset = yearAgoSnapshot?.totalAssetJpy || userProfile.currentAsset

    // キャッシュフロー取得
    const currentYear = new Date().getFullYear()
    const cashflow = await prisma.cashflow.findUnique({
      where: {
        userId_year: {
          userId,
          year: currentYear,
        },
      },
    })

    const annualAddableInvestment = cashflow?.annualAddableInvestment || 12000000

    // 資産クラスの分析
    const assetClasses = new Set(holdings.map((h) => h.assetClass))
    const assetClassCount = assetClasses.size

    // Herfindahl指数を計算（集中度）
    let herfindahlIndex = 0
    let holdingValues: any[] = []
    let cashPercentage = 5 // デフォルト値

    try {
      const usdJpy = await getUsdJpy()
      holdingValues = await getAllHoldingValues(holdings, usdJpy)
      holdingValues.forEach((holding) => {
        const weight = totalAsset > 0 ? holding.valueJpy / totalAsset : 0
        herfindahlIndex += weight * weight
      })

      // 流動性の計算（簡略版）
      const cashHolding = holdingValues.find((h) => h.ticker === 'CASH_JPY')
      cashPercentage = cashHolding && totalAsset > 0 ? (cashHolding.valueJpy / totalAsset) * 100 : 0
    } catch (error) {
      console.warn('Failed to calculate diversification metrics:', error)
    }

    // 最大ドローダウンを計算（過去1年）
    const yearAgoDate = new Date()
    yearAgoDate.setFullYear(yearAgoDate.getFullYear() - 1)

    const yearSnapshots = await prisma.assetSnapshot.findMany({
      where: {
        date: {
          gte: yearAgoDate,
        },
      },
      orderBy: { date: 'asc' },
    })

    let maxDrawdown = 0
    if (yearSnapshots.length > 0) {
      const peakAsset = Math.max(...yearSnapshots.map((s) => s.totalAssetJpy))
      maxDrawdown = (Math.min(...yearSnapshots.map((s) => s.totalAssetJpy)) - peakAsset) / peakAsset
    }

    // 目標達成確率を取得
    const primaryGoal = goals.find((g) => g.targetAge === 35)
    const successProbability = primaryGoal?.successProbability || 0

    // Portfolio メトリクス構築
    const metrics: PortfolioMetrics = {
      expectedAnnualReturn: 8, // デフォルト期待リターン
      assetClassCount,
      herfindahlIndex,
      cashPercentage,
      liquidAssetPercentage: cashPercentage,
      portfolioVolatility: 15, // 仮値（実際には過去データから計算が必要）
      riskFreeRate: 0.5,
      sharpeRatio: 0.8, // 仮値
      maxDrawdown: maxDrawdown * 100,
      successProbability,
      yearsToTarget: primaryGoal ? primaryGoal.targetAge - userProfile.currentAge : 5,
    }

    // スコア計算
    const scoreResult = calculatePortfolioScore(metrics)

    return NextResponse.json({
      score: scoreResult,
      metrics: {
        totalAsset,
        previousYearAsset,
        assetClassCount,
        cashPercentage: cashPercentage.toFixed(1),
        maxDrawdown: (maxDrawdown * 100).toFixed(2),
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
        holdingsCount: holdings.length,
      },
    })
  } catch (error) {
    console.error('Failed to calculate portfolio score:', error)
    // エラーの詳細をログ出力
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      {
        error: 'Failed to calculate portfolio score',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
