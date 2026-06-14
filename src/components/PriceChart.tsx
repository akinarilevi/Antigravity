'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PricePoint } from '@/lib/types';

interface Props {
  data: PricePoint[];
  loading: boolean;
}

function formatDate(ts: number, rangeMs: number): string {
  const d = new Date(ts);
  if (rangeMs <= 86_400_000) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  if (rangeMs <= 90 * 86_400_000) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function PriceChart({ data, loading }: Props) {
  if (loading) {
    return <div className="h-72 bg-gray-100 animate-pulse rounded-lg" />;
  }

  const rangeMs =
    data.length > 1 ? data[data.length - 1].timestamp - data[0].timestamp : 0;

  const chartData = data.map((p) => ({
    time: formatDate(p.timestamp, rangeMs),
    price: p.price,
  }));

  const prices = data.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const pad = (max - min) * 0.05;

  return (
    <ResponsiveContainer width="100%" height={288}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[min - pad, max + pad]}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `$${(v as number).toLocaleString()}`}
          width={80}
        />
        <Tooltip
          formatter={(v) => [`$${(v as number).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Price']}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#f97316"
          dot={false}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
