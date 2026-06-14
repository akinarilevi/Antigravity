import { prisma } from '@/lib/db'
import { getUsdJpy } from '@/lib/fx'
import { getAllHoldingValues } from '@/lib/pricing'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const holdings = await prisma.holding.findMany()
    const usdJpy = await getUsdJpy()
    const holdingValues = await getAllHoldingValues(holdings, usdJpy)

    const totalValueJpy = holdingValues.reduce((sum, h) => sum + h.valueJpy, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const snapshot = await prisma.portfolioSnapshot.upsert({
      where: { date: today },
      update: {
        totalValueJpy,
        holdingsJson: JSON.stringify(holdingValues),
      },
      create: {
        date: today,
        totalValueJpy,
        holdingsJson: JSON.stringify(holdingValues),
      },
    })

    return NextResponse.json(snapshot, { status: 201 })
  } catch (error) {
    console.error('Failed to create snapshot:', error)
    return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 })
  }
}
