import { analyzeMarketCycle, getStageDescription } from '@/lib/market-cycle-engine'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/market/cycle
 * 現在の市場サイクル段階を判定
 */
export async function GET(req: Request) {
  try {
    // 実際のマーケットデータ取得（簡略版：仮値を使用）
    // 本来はYahoo Finance、FRED APIから取得
    const marketData = {
      sp500Trend3m: 8.5, // 過去3ヶ月の S&P500 リターン
      vixLevel: 17.2, // VIX 指数
      gdpGrowth: 2.1, // GDP 成長率 %
      earningsGrowth: 6.5, // 企業利益成長率 %
      unemploymentRate: 3.9, // 失業率 %
      inflationRate: 2.8, // インフレ率 %
      perRatio: 21.5, // PER (Price Earnings Ratio)
      creditSpreadBps: 145, // クレジットスプレッド (bp)
    }

    // マーケットサイクル分析
    const cycleAnalysis = analyzeMarketCycle(marketData)
    const stageDescription = getStageDescription(cycleAnalysis.stage)

    return NextResponse.json({
      cycle: cycleAnalysis,
      stage: stageDescription,
      metadata: {
        analyzedAt: new Date().toISOString(),
        dataSource: 'simulated', // 本来は実際のデータソース
        nextUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to analyze market cycle:', error)
    return NextResponse.json(
      { error: 'Failed to analyze market cycle' },
      { status: 500 }
    )
  }
}
