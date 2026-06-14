import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fetchCurrentPrice } from '@/lib/coingecko';
import type { PriceAlert, PushSubscriptionData } from '@/lib/types';

const SUBS_FILE = path.join(process.cwd(), 'data', 'subscriptions.json');

function readSubs(): PushSubscriptionData[] {
  try {
    if (!fs.existsSync(SUBS_FILE)) return [];
    return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { alerts }: { alerts: PriceAlert[] } = await request.json();
    const price = await fetchCurrentPrice();

    const triggered: string[] = [];
    const subs = readSubs();

    for (const alert of alerts) {
      if (alert.triggered) continue;

      const hit =
        (alert.direction === 'above' && price >= alert.targetPrice) ||
        (alert.direction === 'below' && price <= alert.targetPrice);

      if (hit) {
        triggered.push(alert.id);
        const direction = alert.direction === 'above' ? 'exceeded' : 'dropped below';
        const payload = JSON.stringify({
          title: 'Bitcoin Price Alert',
          body: `BTC has ${direction} $${alert.targetPrice.toLocaleString()} (now $${price.toLocaleString()})`,
          url: '/',
        });

        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
              },
              payload
            );
          } catch (err: unknown) {
            console.error('Push send error:', err);
          }
        }
      }
    }

    return NextResponse.json({ price, triggered });
  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json({ error: 'Check failed' }, { status: 500 });
  }
}
