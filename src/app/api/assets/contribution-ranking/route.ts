import { prisma } from '@/lib/db'
import { calculateContributionRanking } from '@/lib/asset-contribution-ranking'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface GrowthBreakdown {
  btcPrice?: number
  nasdaqPrice?: number
  sp500Price?: number
  goldPrice?: number
  businessProfit?: number
  fxGain?: number
  dividends?: number
}

/**
 * GET /api/assets/contribution-ranking
 * 資産別貢献度ランキング（月間、年間、累計）
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const period = (searchParams.get('period') || 'monthly') as 'monthly' | 'yearly' | 'cumulative'

    // スナップショット取得
    const snapshots = await prisma.assetSnapshot.findMany({
      orderBy: { date: 'desc' },
      take: 365, // 1年分まで取得
    })

    if (snapshots.length === 0) {
      return NextResponse.json(
        { error: 'No asset snapshot found' },
        { status: 404 }
      )
    }

    // 期間別に集計
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    // 月間（過去30日）
    const monthlySnapshots = snapshots.filter((s) => new Date(s.date) > thirtyDaysAgo)
    const monthlyGrowth = calculateGrowthFromSnapshots(monthlySnapshots)
    const monthlyRanking = calculateContributionRanking(monthlyGrowth, 'monthly')

    // 年間（過去365日）
    const yearlySnapshots = snapshots.filter((s) => new Date(s.date) > oneYearAgo)
    const yearlyGrowth = calculateGrowthFromSnapshots(yearlySnapshots)
    const yearlyRanking = calculateContributionRanking(yearlyGrowth, 'yearly')

    // 累計（全期間）
    const cumulativeGrowth = calculateGrowthFromSnapshots(snapshots)
    const cumulativeRanking = calculateContributionRanking(cumulativeGrowth, 'cumulative')

    // 要求されたピリオドのランキングを返却
    let requestedRanking = monthlyRanking
    if (period === 'yearly') {
      requestedRanking = yearlyRanking
    } else if (period === 'cumulative') {
      requestedRanking = cumulativeRanking
    }

    return NextResponse.json({
      requested: requestedRanking,
      allPeriods: {
        monthly: monthlyRanking,
        yearly: yearlyRanking,
        cumulative: cumulativeRanking,
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
        snapshotsAnalyzed: snapshots.length,
        periodStart: snapshots[snapshots.length - 1]?.date,
        periodEnd: snapshots[0]?.date,
      },
    })
  } catch (error) {
    console.error('Failed to calculate contribution ranking:', error)
    return NextResponse.json(
      { error: 'Failed to calculate contribution ranking' },
      { status: 500 }
    )
  }
}

/**
 * スナップショットの増加額を計算
 * （簡略版：開始と終了の差分から計算）
 */
function calculateGrowthFromSnapshots(snapshots: any[]): GrowthBreakdown {
  if (snapshots.length < 2) {
    return {}
  }

  // 最初と最後のスナップショット
  const startSnapshot = snapshots[snapshots.length - 1] // 古い方
  const endSnapshot = snapshots[0] // 新しい方

  const totalGrowth = endSnapshot.totalAssetJpy - startSnapshot.totalAssetJpy

  // 簡略版：全体の成長を資産クラス別に按分
  // 実際にはホールディング履歴から正確に計算する必要があります
  const breakdown: GrowthBreakdown = {}

  // ダミー値（本来はホールディング履歴から計算）
  if (totalGrowth > 0) {
    breakdown.btcPrice = totalGrowth * 0.4
    breakdown.nasdaqPrice = totalGrowth * 0.25
    breakdown.sp500Price = totalGrowth * 0.15
    breakdown.goldPrice = totalGrowth * 0.1
    breakdown.businessProfit = totalGrowth * 0.1
  }

  return breakdown
}
