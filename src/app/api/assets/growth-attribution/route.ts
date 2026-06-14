import { prisma } from '@/lib/db'
import { getUsdJpy } from '@/lib/fx'
import { getAllHoldingValues } from '@/lib/pricing'
import { analyzeAssetGrowth, analyzeGrowthByPeriod } from '@/lib/asset-growth-attribution'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/assets/growth-attribution
 * 資産増加の要因分析（毎日、毎月、毎年）
 */
export async function GET(req: NextRequest) {
  try {
    // 最新のスナップショット取得
    const latestSnapshot = await prisma.assetSnapshot.findFirst({
      orderBy: { date: 'desc' },
    })

    if (!latestSnapshot) {
      return NextResponse.json(
        { error: 'No asset snapshot found' },
        { status: 404 }
      )
    }

    // 前日のスナップショット取得
    const previousDate = new Date(latestSnapshot.date)
    previousDate.setDate(previousDate.getDate() - 1)

    const previousSnapshot = await prisma.assetSnapshot.findFirst({
      where: {
        date: {
          lte: previousDate,
        },
      },
      orderBy: { date: 'desc' },
    })

    // 現在のホールディング取得
    const holdings = await prisma.holding.findMany()
    const usdJpy = await getUsdJpy()
    const currentHoldingValues = await getAllHoldingValues(holdings, usdJpy)

    // 前日のホールディング値を復元
    let previousHoldingValues = currentHoldingValues.map((h) => ({
      ...h,
      valueJpy: 0,
      previousValueJpy: 0,
    }))

    if (previousSnapshot) {
      try {
        const previousData = JSON.parse(previousSnapshot.holdingsJson)
        previousHoldingValues = previousData
      } catch (error) {
        console.warn('Failed to parse previous snapshot JSON')
      }
    }

    // 本日の成長分析
    const currentHoldingSnapshots = currentHoldingValues.map((h) => {
      const prevHolding = previousHoldingValues.find((p) => p.ticker === h.ticker)
      return {
        ticker: h.ticker,
        quantity: h.quantity,
        priceJpy: h.valueJpy / h.quantity,
        previousPriceJpy: prevHolding ? prevHolding.valueJpy / h.quantity : 0,
        valueJpy: h.valueJpy,
        previousValueJpy: prevHolding?.valueJpy || 0,
      }
    })

    const previousHoldingSnapshots = previousHoldingValues.map((h) => ({
      ticker: h.ticker,
      quantity: h.quantity,
      priceJpy: h.valueJpy / h.quantity,
      previousPriceJpy: 0,
      valueJpy: h.valueJpy,
      previousValueJpy: 0,
    }))

    // 本日の成長分析を実行
    const dailyAnalysis = analyzeAssetGrowth(
      currentHoldingSnapshots,
      previousHoldingSnapshots
    )

    // 過去30日、365日、累計のスナップショットを取得
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const yearAgoDate = new Date()
    yearAgoDate.setFullYear(yearAgoDate.getFullYear() - 1)

    const monthlySnapshots = await prisma.assetSnapshot.findMany({
      where: {
        date: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: { date: 'asc' },
    })

    const yearlySnapshots = await prisma.assetSnapshot.findMany({
      where: {
        date: {
          gte: yearAgoDate,
        },
      },
      orderBy: { date: 'asc' },
    })

    const allSnapshots = await prisma.assetSnapshot.findMany({
      orderBy: { date: 'asc' },
    })

    // 期間別の成長を計算（簡易版）
    const monthlyGrowth =
      monthlySnapshots.length > 1
        ? monthlySnapshots[monthlySnapshots.length - 1].totalAssetJpy -
          monthlySnapshots[0].totalAssetJpy
        : 0

    const yearlyGrowth =
      yearlySnapshots.length > 1
        ? yearlySnapshots[yearlySnapshots.length - 1].totalAssetJpy -
          yearlySnapshots[0].totalAssetJpy
        : 0

    const cumulativeGrowth =
      allSnapshots.length > 1
        ? allSnapshots[allSnapshots.length - 1].totalAssetJpy - allSnapshots[0].totalAssetJpy
        : 0

    return NextResponse.json({
      daily: dailyAnalysis,
      periods: {
        monthly: {
          totalGrowth: monthlyGrowth,
          period: 'monthly',
        },
        yearly: {
          totalGrowth: yearlyGrowth,
          period: 'yearly',
        },
        cumulative: {
          totalGrowth: cumulativeGrowth,
          period: 'cumulative',
        },
      },
      metadata: {
        analyzedAt: new Date().toISOString(),
        currentAsset: latestSnapshot.totalAssetJpy,
        holdingsCount: holdings.length,
      },
    })
  } catch (error) {
    console.error('Failed to analyze asset growth:', error)
    return NextResponse.json(
      { error: 'Failed to analyze asset growth' },
      { status: 500 }
    )
  }
}
