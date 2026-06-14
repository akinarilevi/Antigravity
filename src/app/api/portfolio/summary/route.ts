import { prisma } from '@/lib/db'
import { getUsdJpy } from '@/lib/fx'
import { getAllHoldingValues } from '@/lib/pricing'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const holdings = await prisma.holding.findMany()
    const usdJpy = await getUsdJpy()
    const holdingValues = await getAllHoldingValues(holdings, usdJpy)

    const totalJpy = holdingValues.reduce((sum, h) => sum + h.valueJpy, 0)
    const purchaseCostJpy = holdingValues.reduce(
      (sum, h) => sum + (h.purchaseCostJpy || 0),
      0
    )

    const getPrevSnapshot = async (daysAgo: number) => {
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)
      date.setHours(0, 0, 0, 0)

      const snapshot = await prisma.portfolioSnapshot.findUnique({
        where: { date },
      })
      return snapshot?.totalValueJpy || null
    }

    const [prevDay, prevWeek, prevMonth, yearStart] = await Promise.all([
      getPrevSnapshot(1),
      getPrevSnapshot(7),
      getPrevSnapshot(30),
      (async () => {
        const date = new Date(new Date().getFullYear(), 0, 1)
        const snapshot = await prisma.portfolioSnapshot.findUnique({
          where: { date },
        })
        return snapshot?.totalValueJpy || null
      })(),
    ])

    return NextResponse.json({
      totalJpy,
      prevDayJpy: prevDay,
      prevWeekJpy: prevWeek,
      prevMonthJpy: prevMonth,
      yearStartJpy: yearStart,
      purchaseCostJpy,
      holdings: holdingValues,
      usdJpy,
      calculatedAt: Date.now(),
    })
  } catch (error) {
    console.error('Failed to calculate portfolio summary:', error)
    return NextResponse.json(
      { error: 'Failed to calculate portfolio summary' },
      { status: 500 }
    )
  }
}
