import { prisma } from '@/lib/db'
import {
  getPreDefinedScenarios,
  compareScenarios,
  simulateScenario,
} from '@/lib/life-event-simulator'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const userId = 'default-user'

/**
 * GET /api/scenarios/life-event-simulation
 * 人生イベントシミュレーションを実行
 */
export async function GET(req: NextRequest) {
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

    const baseAnnualInvestment = cashflow?.annualAddableInvestment || 12000000
    const baseExpectedReturn = 8

    // 事前定義シナリオを取得
    const scenarios = getPreDefinedScenarios()

    // 各シナリオをシミュレート
    const results = compareScenarios(
      scenarios,
      userProfile.currentAsset,
      userProfile.currentAge,
      baseAnnualInvestment,
      baseExpectedReturn
    )

    // シナリオごとの詳細結果
    const scenarioDetails = scenarios.map((scenario, idx) => ({
      scenario: {
        name: scenario.name,
        description: scenario.description,
        eventCount: scenario.events.length,
      },
      result: results[idx],
    }))

    // ベストシナリオを特定
    const bestScenario = results.reduce((best, current) =>
      current.achievementProbability35 > best.achievementProbability35 ? current : best
    )

    // ワーストシナリオを特定
    const worstScenario = results.reduce((worst, current) =>
      current.achievementProbability35 < worst.achievementProbability35 ? current : worst
    )

    return NextResponse.json({
      allScenarios: scenarioDetails,
      bestScenario: {
        name: bestScenario.scenarioName,
        probability35: bestScenario.achievementProbability35,
        asset35: bestScenario.projectedAssetAt35,
      },
      worstScenario: {
        name: worstScenario.scenarioName,
        probability35: worstScenario.achievementProbability35,
        asset35: worstScenario.projectedAssetAt35,
      },
      recommendation: generateRecommendation(results),
      metadata: {
        analyzedAt: new Date().toISOString(),
        userAge: userProfile.currentAge,
        baseAnnualInvestment,
      },
    })
  } catch (error) {
    console.error('Failed to simulate life events:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return NextResponse.json(
      { error: 'Failed to simulate life events' },
      { status: 500 }
    )
  }
}

/**
 * 推奨を生成
 */
function generateRecommendation(results: any[]): string {
  const avgProbability =
    results.reduce((sum, r) => sum + r.achievementProbability35, 0) / results.length

  if (avgProbability >= 75) {
    return 'すべてのシナリオで目標達成が見込まれます。人生イベントが発生しても、堅実な目標達成が期待できます。'
  } else if (avgProbability >= 60) {
    return 'ほとんどのシナリオで目標達成が見込まれます。ただし、大きなイベント（転職、家族増加）の場合は注意が必要です。'
  } else if (avgProbability >= 40) {
    return '人生イベントの影響が大きい状態です。キャッシュフロー強化を優先してください。'
  } else {
    return '現在の資産形成ペースでは、人生イベント発生時に目標達成が困難になる可能性があります。早急な対策が必要です。'
  }
}
