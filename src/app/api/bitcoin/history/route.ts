import { NextRequest, NextResponse } from 'next/server';
import { fetchPriceHistory, periodToDays } from '@/lib/coingecko';
import type { TimePeriod } from '@/lib/types';

export async function GET(request: NextRequest) {
  const period = (request.nextUrl.searchParams.get('period') ?? '1M') as TimePeriod;
  try {
    const days = periodToDays(period);
    const prices = await fetchPriceHistory(days);
    return NextResponse.json({ prices });
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
