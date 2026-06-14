'use client';

import type { TimePeriod } from '@/lib/types';

const PERIODS: TimePeriod[] = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'];

interface Props {
  selected: TimePeriod;
  onChange: (p: TimePeriod) => void;
}

export default function PeriodSelector({ selected, onChange }: Props) {
  return (
    <div className="flex gap-1 flex-wrap">
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors
            ${selected === p
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
