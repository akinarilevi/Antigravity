import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { PushSubscriptionData } from '@/lib/types';

const SUBS_FILE = path.join(process.cwd(), 'data', 'subscriptions.json');

function readSubs(): PushSubscriptionData[] {
  try {
    const dir = path.dirname(SUBS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(SUBS_FILE)) return [];
    return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeSubs(subs: PushSubscriptionData[]): void {
  fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sub: PushSubscriptionData = {
      endpoint: body.endpoint,
      keys: { p256dh: body.keys.p256dh, auth: body.keys.auth },
    };

    const subs = readSubs();
    const exists = subs.findIndex((s) => s.endpoint === sub.endpoint);
    if (exists === -1) subs.push(sub);
    writeSubs(subs);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json();
    const subs = readSubs().filter((s) => s.endpoint !== endpoint);
    writeSubs(subs);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
  }
}
