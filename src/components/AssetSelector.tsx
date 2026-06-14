'use client';

import { ASSET_CONFIGS } from '@/lib/yahoo';
import type { AssetId } from '@/lib/types';

const ASSET_ORDER: AssetId[] = ['BTC', 'SPY', 'ACWI', 'GLD', 'QQQ', 'TLT', 'VNQ'];

interface Props {
  active: Set<AssetId>;
  onToggle: (id: AssetId) => void;
}

export default function AssetSelector({ active, onToggle }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {ASSET_ORDER.map((id) => {
        const config = ASSET_CONFIGS[id];
        const isActive = active.has(id);
        return (
          <button
            key={id}
            onClick={() => onToggle(id)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-all
              ${isActive ? 'text-white border-transparent' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
            style={isActive ? { backgroundColor: config.color, borderColor: config.color } : {}}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
