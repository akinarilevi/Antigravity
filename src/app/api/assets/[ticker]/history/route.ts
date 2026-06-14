import { NextRequest, NextResponse } from 'next/server';
import { fetchYahooHistory, ASSET_CONFIGS } from '@/lib/yahoo';
import type { TimePeriod } from '@/lib/types';

interface RouteContext {
  params: Promise<{ ticker: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { ticker } = await context.params;
  const period = (request.nextUrl.searchParams.get('period') ?? '1M') as TimePeriod;

  const validTickers = Object.values(ASSET_CONFIGS)
    .map((c) => c.ticker)
    .filter((t) => t !== 'BTC');

  if (!validTickers.includes(ticker.toUpperCase())) {
    return NextResponse.json({ error: 'Unknown ticker' }, { status: 400 });
  }

  try {
    const prices = await fetchYahooHistory(ticker.toUpperCase(), period);
    return NextResponse.json({ prices });
  } catch (error) {
    console.error(`Yahoo history error for ${ticker}:`, error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
