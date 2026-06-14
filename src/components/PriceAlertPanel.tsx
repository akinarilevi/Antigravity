'use client';

import { useState, useEffect, useRef } from 'react';
import type { PriceAlert, AlertDirection } from '@/lib/types';

const ALERTS_KEY = 'btc_alerts';
const POLL_INTERVAL = 30_000;

function loadAlerts(): PriceAlert[] {
  try {
    return JSON.parse(localStorage.getItem(ALERTS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveAlerts(alerts: PriceAlert[]): void {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
}

interface Props {
  currentPrice: number | null;
}

export default function PriceAlertPanel({ currentPrice }: Props) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<AlertDirection>('above');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushStatus, setPushStatus] = useState<'idle' | 'requesting' | 'enabled' | 'denied'>('idle');
  const subRef = useRef<PushSubscription | null>(null);

  useEffect(() => {
    setAlerts(loadAlerts());
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        subRef.current = existing;
        setPushEnabled(true);
        setPushStatus('enabled');
      }
    });
  }, []);

  useEffect(() => {
    const activeAlerts = alerts.filter((a) => !a.triggered);
    if (activeAlerts.length === 0) return;

    const poll = async () => {
      try {
        const res = await fetch('/api/push/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alerts: activeAlerts }),
        });
        const data = await res.json();
        if (data.triggered?.length > 0) {
          setAlerts((prev) => {
            const updated = prev.map((a) =>
              data.triggered.includes(a.id) ? { ...a, triggered: true } : a
            );
            saveAlerts(updated);
            return updated;
          });
        }
      } catch {
        // Network error — silent fail
      }
    };

    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [alerts]);

  const enablePush = async () => {
    if (!('serviceWorker' in navigator)) {
      alert('Service Workers are not supported in this browser.');
      return;
    }

    setPushStatus('requesting');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setPushStatus('denied');
      return;
    }

    const reg = await navigator.serviceWorker.ready;
    const { publicKey } = await fetch('/api/push/vapid').then((r) => r.json());

    const appServerKey = urlBase64ToUint8Array(publicKey);
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: appServerKey as BufferSource,
    });

    subRef.current = sub;
    const json = sub.toJSON();

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(json),
    });

    setPushEnabled(true);
    setPushStatus('enabled');
  };

  const disablePush = async () => {
    if (subRef.current) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subRef.current.endpoint }),
      });
      await subRef.current.unsubscribe();
      subRef.current = null;
    }
    setPushEnabled(false);
    setPushStatus('idle');
  };

  const addAlert = () => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;

    const alert: PriceAlert = {
      id: crypto.randomUUID(),
      targetPrice: price,
      direction,
      createdAt: Date.now(),
      triggered: false,
    };

    const updated = [...alerts, alert];
    setAlerts(updated);
    saveAlerts(updated);
    setTargetPrice('');
  };

  const removeAlert = (id: string) => {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    saveAlerts(updated);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
      <h2 className="text-lg font-bold text-gray-800">Price Alerts</h2>

      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">Push Notifications</p>
          <p className="text-xs text-gray-500">
            {pushStatus === 'enabled' ? 'Active — alerts will appear even in background' :
             pushStatus === 'denied' ? 'Permission denied in browser settings' :
             'Enable to receive alerts on this device'}
          </p>
        </div>
        <button
          onClick={pushEnabled ? disablePush : enablePush}
          disabled={pushStatus === 'denied'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${pushEnabled
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : pushStatus === 'denied'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
        >
          {pushEnabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as AlertDirection)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="above">Above</option>
            <option value="below">Below</option>
          </select>
          <input
            type="number"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder={currentPrice ? `e.g. ${Math.round(currentPrice * 1.1).toLocaleString()}` : 'Target price (USD)'}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={addAlert}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {alerts.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No alerts set</p>
        )}
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-center justify-between p-3 rounded-lg border
              ${alert.triggered
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-gray-200'
              }`}
          >
            <div>
              <span className="text-sm font-medium text-gray-700">
                {alert.direction === 'above' ? '↑ Above' : '↓ Below'}{' '}
                ${alert.targetPrice.toLocaleString()}
              </span>
              {alert.triggered && (
                <span className="ml-2 text-xs text-green-600 font-medium">Triggered</span>
              )}
            </div>
            <button
              onClick={() => removeAlert(alert.id)}
              className="text-gray-400 hover:text-red-500 text-sm px-2"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
