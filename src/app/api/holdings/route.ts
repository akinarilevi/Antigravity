import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const holdings = await prisma.holding.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(holdings)
  } catch (error) {
    console.error('Failed to fetch holdings:', error)
    return NextResponse.json({ error: 'Failed to fetch holdings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ticker, name, quantity, purchasePrice, priceSource, assetClass } = body

    if (!ticker || !name || quantity === undefined || !priceSource) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const holding = await prisma.holding.create({
      data: {
        ticker,
        name,
        quantity,
        purchasePrice: purchasePrice || null,
        priceSource,
        assetClass: assetClass || 'OTHER',
      },
    })

    return NextResponse.json(holding, { status: 201 })
  } catch (error) {
    console.error('Failed to create holding:', error)
    return NextResponse.json({ error: 'Failed to create holding' }, { status: 500 })
  }
}
