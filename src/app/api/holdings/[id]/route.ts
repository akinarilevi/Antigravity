import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { ticker, name, quantity, purchasePrice, priceSource, assetClass } = body

    const holding = await prisma.holding.update({
      where: { id },
      data: {
        ...(ticker && { ticker }),
        ...(name && { name }),
        ...(quantity !== undefined && { quantity }),
        ...(purchasePrice !== undefined && { purchasePrice }),
        ...(priceSource && { priceSource }),
        ...(assetClass && { assetClass }),
      },
    })

    return NextResponse.json(holding)
  } catch (error) {
    console.error('Failed to update holding:', error)
    return NextResponse.json({ error: 'Failed to update holding' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.holding.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete holding:', error)
    return NextResponse.json({ error: 'Failed to delete holding' }, { status: 500 })
  }
}
