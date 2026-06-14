import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30', 10)

    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)

    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: {
        date: {
          gte: since,
        },
      },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json(snapshots)
  } catch (error) {
    console.error('Failed to fetch portfolio history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio history' },
      { status: 500 }
    )
  }
}
