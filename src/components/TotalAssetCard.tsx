'use client'

interface Props {
  totalJpy: number
  prevDayJpy: number | null
  prevWeekJpy: number | null
  prevMonthJpy: number | null
}

export function TotalAssetCard({
  totalJpy,
  prevDayJpy,
  prevWeekJpy,
  prevMonthJpy,
}: Props) {
  const formatJpy = (value: number | null) => {
    if (value === null) return 'N/A'
    return `¥${Math.round(value).toLocaleString('ja-JP')}`
  }

  const getDailyChange = () => {
    if (!prevDayJpy) return null
    const change = totalJpy - prevDayJpy
    const percent = (change / prevDayJpy) * 100
    return { change, percent }
  }

  const getWeeklyChange = () => {
    if (!prevWeekJpy) return null
    const change = totalJpy - prevWeekJpy
    const percent = (change / prevWeekJpy) * 100
    return { change, percent }
  }

  const getMonthlyChange = () => {
    if (!prevMonthJpy) return null
    const change = totalJpy - prevMonthJpy
    const percent = (change / prevMonthJpy) * 100
    return { change, percent }
  }

  const dailyChange = getDailyChange()
  const weeklyChange = getWeeklyChange()
  const monthlyChange = getMonthlyChange()

  const formatChange = (change: { change: number; percent: number }) => {
    const sign = change.change >= 0 ? '+' : ''
    const color = change.change >= 0 ? 'text-green-600' : 'text-red-600'
    return (
      <span className={color}>
        {sign}¥{Math.round(change.change).toLocaleString('ja-JP')} ({sign}
        {change.percent.toFixed(2)}%)
      </span>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-indigo-200 p-6 mb-6">
      <h2 className="text-sm font-semibold text-gray-600 mb-2">総資産額</h2>
      <div className="text-4xl font-bold text-gray-900 mb-6">{formatJpy(totalJpy)}</div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-2">前日比</p>
          <div className="text-sm font-semibold">
            {dailyChange ? formatChange(dailyChange) : <span className="text-gray-400">データなし</span>}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-2">前週比</p>
          <div className="text-sm font-semibold">
            {weeklyChange ? formatChange(weeklyChange) : <span className="text-gray-400">データなし</span>}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-2">前月比</p>
          <div className="text-sm font-semibold">
            {monthlyChange ? formatChange(monthlyChange) : <span className="text-gray-400">データなし</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
