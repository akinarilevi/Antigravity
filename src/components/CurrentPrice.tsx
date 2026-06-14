'use client';

interface Props {
  price: number | null;
  loading: boolean;
}

export default function CurrentPrice({ price, loading }: Props) {
  return (
    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-100 shadow-sm">
      <p className="text-sm font-medium text-gray-500">Bitcoin (BTC)</p>
      {loading ? (
        <div className="h-12 w-48 bg-gray-200 animate-pulse rounded mt-2" />
      ) : (
        <p className="text-4xl font-bold text-orange-600 mt-1">
          ${price?.toLocaleString('en-US', { minimumFractionDigits: 2 }) ?? '—'}
        </p>
      )}
      <p className="text-xs text-gray-400 mt-2">Updates every 30 seconds</p>
    </div>
  );
}
