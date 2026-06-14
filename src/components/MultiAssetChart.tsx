'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { AssetId, AssetSeries } from '@/lib/types';
import { ASSET_CONFIGS } from '@/lib/yahoo';

interface Props {
  series: AssetSeries[];
  period: string;
  loading: boolean;
}

function formatDate(ts: number, rangeMs: number): string {
  const d = new Date(ts);
  if (rangeMs <= 86_400_000)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (rangeMs <= 90 * 86_400_000)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function buildChartData(
  series: AssetSeries[]
): Array<Record<string, number | string>> {
  if (series.length === 0) return [];

  const spine = [...series].sort((a, b) => b.points.length - a.points.length)[0];
  const rangeMs = spine.points.length > 1
    ? spine.points[spine.points.length - 1].timestamp - spine.points[0].timestamp
    : 0;

  const rows = spine.points.map((p) => ({
    time: formatDate(p.timestamp, rangeMs),
    _ts: p.timestamp,
  })) as Array<Record<string, number | string>>;

  for (const s of series) {
    const config = ASSET_CONFIGS[s.assetId];
    if (s.points.length === 0) continue;
    const firstPrice = s.points[0].price;
    if (firstPrice === 0) continue;

    const lookup = new Map<number, number>();
    for (const pt of s.points) {
      lookup.set(pt.timestamp, (pt.price / firstPrice - 1) * 100);
    }

    for (const row of rows) {
      const rowTs = row._ts as number;
      let bestDiff = Infinity;
      let bestVal: number | undefined;
      for (const [ts, val] of lookup) {
        const diff = Math.abs(ts - rowTs);
        if (diff < bestDiff) { bestDiff = diff; bestVal = val; }
      }
      const tolerance = rangeMs <= 86_400_000 ? 2 * 3600_000 : 2 * 86_400_000;
      if (bestVal !== undefined && bestDiff <= tolerance) {
        row[config.id] = bestVal;
      }
    }
  }

  return rows;
}

export default function MultiAssetChart({ series, period, loading }: Props) {
  if (loading) {
    return <div className="h-72 bg-gray-100 animate-pulse rounded-lg" />;
  }
  if (series.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
        Select at least one asset above
      </div>
    );
  }

  const chartData = buildChartData(series);

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
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${(v as number) >= 0 ? '+' : ''}${(v as number).toFixed(1)}%`}
          width={68}
        />
        <Tooltip
          formatter={(value, name) => [
            `${(value as number) >= 0 ? '+' : ''}${(value as number).toFixed(2)}%`,
            ASSET_CONFIGS[name as AssetId]?.label ?? name,
          ]}
        />
        <Legend
          formatter={(value) => ASSET_CONFIGS[value as AssetId]?.label ?? value}
          wrapperStyle={{ fontSize: 12 }}
        />
        {series.map((s) => {
          const config = ASSET_CONFIGS[s.assetId];
          return (
            <Line
              key={s.assetId}
              type="monotone"
              dataKey={s.assetId}
              stroke={config.color}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
              connectNulls
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}
