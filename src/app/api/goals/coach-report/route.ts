import { prisma } from '@/lib/db'
import { getUsdJpy } from '@/lib/fx'
import { getAllHoldingValues } from '@/lib/pricing'
import {
  generateGoalCoachReport,
  generateFallbackReport,
  GoalCoachInput,
} from '@/lib/goal-coach-generator'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const userId = 'default-user'

/**
 * GET /api/goals/coach-report?targetAge=35
 * 指定年齢の目標に対するAIコーチレポートを生成
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

    // 前日の達成確率を取得
    let previousSuccessProbability = goal.successProbability || 0
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdaySnapshot = await prisma.goalSnapshot
      .findFirst({
        where: {
          goalId: goal.id,
          createdAt: {
            gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
            lt: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1),
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => null)

    if (yesterdaySnapshot) {
      previousSuccessProbability = yesterdaySnapshot.successProbability || 0
    }

    // 年齢を計算
    const yearsToTarget = targetAge - userProfile.currentAge

    // 市場サイクル情報（簡略版）
    const marketCycle = 'Normal'

    // 主な増加要因（仮）
    const mainContributions = ['ポートフォリオのリバランス', '定期的な積立投資']

    // AI Goal Coach レポート生成用の入力データ
    const coachInput: GoalCoachInput = {
      targetAge,
      targetAsset: goal.targetAsset,
      currentAsset,
      successProbability: goal.successProbability || 0,
      previousSuccessProbability,
      projectedAssetAtTarget: goal.projectedAsset || 0,
      yearsToTarget,
      marketCycle,
      riskScore: 50,
      dailyChange: currentAsset - userProfile.currentAsset,
      mainContributions,
    }

    // Claude APIキーを確認
    const apiKey = process.env.ANTHROPIC_API_KEY
    let report

    if (apiKey) {
      try {
        report = await generateGoalCoachReport(coachInput, apiKey)
      } catch (error) {
        console.warn('Failed to generate Claude report, using fallback')
        report = generateFallbackReport(coachInput)
      }
    } else {
      console.warn('ANTHROPIC_API_KEY not set, using fallback')
      report = generateFallbackReport(coachInput)
    }

    // GoalCoachReport をDB に保存（将来の朝レポート履歴用）
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.goalCoachReport.upsert({
      where: {
        goalId_createdDate: {
          goalId: goal.id,
          createdDate: today,
        },
      },
      create: {
        goalId: goal.id,
        createdDate: today,
        content: report.content,
        successProbability: report.successProbability,
        probabilityChange: report.probabilityChange,
        emotionalTone: report.emotionalTone,
        recommendation: report.recommendation,
      },
      update: {
        content: report.content,
        successProbability: report.successProbability,
        probabilityChange: report.probabilityChange,
        emotionalTone: report.emotionalTone,
        recommendation: report.recommendation,
      },
    })

    return NextResponse.json({
      targetAge,
      report,
      metadata: {
        generatedAt: new Date().toISOString(),
        userAge: userProfile.currentAge,
        yearsToTarget,
        currentAsset,
      },
    })
  } catch (error) {
    console.error('Failed to generate Goal Coach report:', error)
    // エラーの詳細をログ出力
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      {
        error: 'Failed to generate Goal Coach report',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
