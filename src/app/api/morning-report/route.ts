import { prisma } from '@/lib/db'
import { getUsdJpy } from '@/lib/fx'
import { getAllHoldingValues } from '@/lib/pricing'
import { Anthropic } from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const cached = await prisma.morningReport.findUnique({
      where: { date: today },
    })

    if (cached) {
      return NextResponse.json(cached)
    }

    const holdings = await prisma.holding.findMany()
    const usdJpy = await getUsdJpy()
    const holdingValues = await getAllHoldingValues(holdings, usdJpy)
    const totalValueJpy = holdingValues.reduce((sum, h) => sum + h.valueJpy, 0)

    const prevDay = await (async () => {
      const date = new Date()
      date.setDate(date.getDate() - 1)
      date.setHours(0, 0, 0, 0)
      const snapshot = await prisma.portfolioSnapshot.findUnique({
        where: { date },
      })
      return snapshot?.totalValueJpy || 0
    })()

    const dailyChange = totalValueJpy - prevDay
    const dailyChangePercent = prevDay > 0 ? (dailyChange / prevDay) * 100 : 0

    const portfolioSummary = holdingValues
      .map((h) => `${h.name} (${h.ticker}): ¥${h.valueJpy.toLocaleString('ja-JP')}`)
      .join('\n')

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set')
    }

    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are a personal wealth advisor. Based on the user's portfolio data, provide a brief, encouraging morning report in Japanese.

Today's Portfolio Summary:
- Total Value: ¥${totalValueJpy.toLocaleString('ja-JP')}
- Change from yesterday: ¥${dailyChange.toLocaleString('ja-JP')} (${dailyChangePercent.toFixed(2)}%)
- Holdings:
${portfolioSummary}

Write a brief morning report (2-3 sentences) that:
1. Acknowledges the portfolio status
2. Provides encouragement if market is down
3. Suggests a simple action or mindset for the day

Respond in Japanese only.`,
        },
      ],
    })

    const content =
      message.content[0].type === 'text' ? message.content[0].text : 'Unable to generate report'

    const report = await prisma.morningReport.create({
      data: {
        date: today,
        content,
        marketScore: Math.max(0, Math.min(100, 50 + dailyChangePercent * 10)),
        totalValueJpy,
      },
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error('Failed to generate morning report:', error)
    return NextResponse.json(
      { error: 'Failed to generate morning report' },
      { status: 500 }
    )
  }
}
