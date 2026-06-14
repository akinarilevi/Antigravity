import { prisma } from '@/lib/db'
import { calculateWealthScore, WealthMetrics } from '@/lib/portfolio-score'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const userId = 'default-user'

/**
 * GET /api/portfolio/wealth-score
 * Wealth Score（資産形成総合スコア）を計算
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

    const primaryGoal = goals.find((g) => g.targetAge === 35)

    // 1年前の資産を取得
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

    const targetAnnualInvestment = 30000000 // デフォルト：3000万円
    const annualAddableInvestment = cashflow?.annualAddableInvestment || 12000000

    // 資産成長率を計算
    const assetGrowth = userProfile.currentAsset - previousYearAsset

    // 複合年間成長率（CAGR）を計算（簡略版）
    const cagr = previousYearAsset > 0 ? ((userProfile.currentAsset / previousYearAsset) ** 1 - 1) * 100 : 0

    // インフレ率（仮値）
    const inflationRate = 2.5

    // Wealth メトリクス構築
    const metrics: WealthMetrics = {
      currentAsset: userProfile.currentAsset,
      previousYearAsset,
      annualAddableInvestment,
      targetAnnualInvestment,
      cagr,
      inflationRate,
      targetAsset: primaryGoal?.targetAsset || 200000000,
      achievementRate: primaryGoal
        ? (userProfile.currentAsset / primaryGoal.targetAsset) * 100
        : 0,
      totalInvested: annualAddableInvestment * 5, // 簡略版：過去5年分
      assetGrowth,
      diversificationStability: 85, // 仮値
    }

    // Wealth Score 計算
    const scoreResult = calculateWealthScore(metrics)

    return NextResponse.json({
      score: scoreResult,
      metrics: {
        currentAsset: userProfile.currentAsset,
        previousYearAsset,
        assetGrowth,
        cagr: cagr.toFixed(2),
        achievementRate: metrics.achievementRate.toFixed(1),
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
        userAge: userProfile.currentAge,
        targetAge: primaryGoal?.targetAge || 35,
      },
    })
  } catch (error) {
    console.error('Failed to calculate wealth score:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return NextResponse.json(
      { error: 'Failed to calculate wealth score' },
      { status: 500 }
    )
  }
}
