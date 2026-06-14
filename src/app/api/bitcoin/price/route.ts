import { NextResponse } from 'next/server';
import { fetchCurrentPrice } from '@/lib/coingecko';

export async function GET() {
  try {
    const price = await fetchCurrentPrice();
    return NextResponse.json({ price });
  } catch (error) {
    console.error('Price fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 });
  }
}
