import { getUsdJpy } from '@/lib/fx'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface RateCache {
  current: number
  previous: number
  timestamp: number
}

let rateCache: RateCache | null = null

/**
 * GET /api/exchange-rate
 * 現在のUSD/JPYレートを取得（前日比も含む）
 */
export async function GET() {
  try {
    const currentRate = await getUsdJpy()

    // 前日のレート（簡略化: 前回取得時のレート）
    const previousRate = rateCache?.current || currentRate
    const now = Date.now()

    // キャッシュ更新
    if (!rateCache) {
      rateCache = {
        current: currentRate,
        previous: currentRate,
        timestamp: now,
      }
    } else {
      rateCache.previous = rateCache.current
      rateCache.current = currentRate
      rateCache.timestamp = now
    }

    return NextResponse.json({
      currentRate,
      previousRate,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error)
    return NextResponse.json({ error: 'Failed to fetch exchange rate' }, { status: 500 })
  }
}
