import { prisma } from '@/lib/db'
import { getUsdJpy } from '@/lib/fx'
import { getAllHoldingValues } from '@/lib/pricing'
import { calculateGoalMetrics } from '@/lib/goal-calculator'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/goals
 * ユーザーのすべての目標を取得し、達成確率を計算
 */
export async function GET() {
  try {
    // 現在、シングルユーザーなので固定IDを使用
    // TODO: 将来的にマルチユーザー対応時は、認証から userId を取得
    const userId = 'default-user'

    // ユーザーが存在するか確認し、なければ作成
    let user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          name: 'Default User',
        },
      })
    }

    // ユーザープロフィール取得
    let userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    })

    // プロフィールが存在しない場合は、現在の保有資産から作成
    if (!userProfile) {
      // Phase 1 互換性: Holding テーブルから取得（新スキーマでは PortfolioHolding）
      let totalAsset = 0
      try {
        const holdings = await prisma.holding.findMany()
        const usdJpy = await getUsdJpy()
        const holdingValues = await getAllHoldingValues(holdings, usdJpy)
        totalAsset = holdingValues.reduce((sum, h) => sum + h.valueJpy, 0)
      } catch {
        // Holding テーブルがない場合はスキップ
        totalAsset = 0
      }

      userProfile = await prisma.userProfile.create({
        data: {
          userId,
          currentAge: 30,
          currentAsset: totalAsset,
          riskTolerance: 'MODERATE',
          investmentHorizon: 20,
        },
      })
    } else {
      // 現在資産を最新の保有資産から更新
      try {
        const holdings = await prisma.holding.findMany()
        const usdJpy = await getUsdJpy()
        const holdingValues = await getAllHoldingValues(holdings, usdJpy)
        const totalAsset = holdingValues.reduce((sum, h) => sum + h.valueJpy, 0)

        userProfile = await prisma.userProfile.update({
          where: { userId },
          data: { currentAsset: totalAsset },
        })
      } catch {
        // Holding テーブルがない場合はスキップ
      }
    }

    // 目標取得
    let goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { targetAge: 'asc' },
    })

    // デフォルト目標を作成（目標がない場合）
    if (goals.length === 0) {
      goals = await Promise.all([
        prisma.goal.create({
          data: {
            userId,
            targetAge: 35,
            targetAsset: 200000000, // 2億円
          },
        }),
        prisma.goal.create({
          data: {
            userId,
            targetAge: 40,
            targetAsset: 300000000, // 3億円
          },
        }),
      ])
    }

    // 各目標の達成確率を計算
    const goalsWithMetrics = goals.map((goal) => {
      const metrics = calculateGoalMetrics({
        currentAge: userProfile!.currentAge,
        currentAsset: userProfile!.currentAsset,
        targetAge: goal.targetAge,
        targetAsset: goal.targetAsset,
        annualAddInvestment: 12000000, // 仮定: 年間1200万円追加投資
        expectedAnnualReturn: 8, // 仮定: 8%利回り
      })

      return {
        ...goal,
        ...metrics,
      }
    })

    // データベースに計算結果を保存
    for (const goal of goalsWithMetrics) {
      await prisma.goal.update({
        where: { id: goal.id },
        data: {
          achievementRate: goal.achievementRate,
          remainingAmount: goal.remainingAmount,
          requiredReturn: goal.requiredReturn,
          successProbability: goal.successProbability,
        },
      })

      // GoalSnapshot に記録
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await prisma.goalSnapshot.upsert({
        where: { goalId_date: { goalId: goal.id, date: today } },
        update: {
          currentAsset: userProfile!.currentAsset,
          achievementRate: goal.achievementRate,
          successProbability: goal.successProbability,
          expectedAsset: goal.projectedAsset,
          requiredReturn: goal.requiredReturn,
        },
        create: {
          userId,
          goalId: goal.id,
          date: today,
          currentAsset: userProfile!.currentAsset,
          achievementRate: goal.achievementRate,
          successProbability: goal.successProbability,
          expectedAsset: goal.projectedAsset,
          requiredReturn: goal.requiredReturn,
        },
      })
    }

    return NextResponse.json({
      userProfile,
      goals: goalsWithMetrics,
    })
  } catch (error) {
    console.error('Failed to fetch goals:', error)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

/**
 * POST /api/goals
 * 新しい目標を作成
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { targetAge, targetAsset } = body

    if (!targetAge || !targetAsset) {
      return NextResponse.json(
        { error: 'Missing required fields: targetAge, targetAsset' },
        { status: 400 }
      )
    }

    const userId = 'default-user'

    const goal = await prisma.goal.create({
      data: {
        userId,
        targetAge,
        targetAsset,
      },
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error('Failed to create goal:', error)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}
