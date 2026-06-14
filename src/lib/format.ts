/**
 * 日本人向け数値フォーマット
 */

/**
 * JPY を「万円・億円」単位の読みやすい形式に変換
 * @param jpy 日本円
 * @returns フォーマット済み文字列
 *
 * @example
 * formatJpyReadable(82000000) => "8,200万円"
 * formatJpyReadable(1200000000) => "12億円"
 * formatJpyReadable(1250000000) => "12.5億円"
 */
export function formatJpyReadable(jpy: number): string {
  if (jpy >= 100000000) {
    // 1億以上は「億円」表記
    const oku = jpy / 100000000
    if (oku % 1 === 0) {
      return `${oku.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}億円`
    }
    return `${oku.toLocaleString('ja-JP', { maximumFractionDigits: 1 })}億円`
  } else if (jpy >= 10000) {
    // 1万以上は「万円」表記
    const man = jpy / 10000
    if (man % 1 === 0) {
      return `${man.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}万円`
    }
    return `${man.toLocaleString('ja-JP', { maximumFractionDigits: 1 })}万円`
  } else {
    // 1万未満は円表記
    return `¥${Math.round(jpy).toLocaleString('ja-JP')}`
  }
}

/**
 * JPY を基本表記（フルスケール）で表示
 * @example
 * formatJpyFull(82000000) => "¥82,000,000"
 */
export function formatJpyFull(jpy: number): string {
  return `¥${Math.round(jpy).toLocaleString('ja-JP')}`
}

/**
 * 金額差分を「+¥XXX」形式で表示（赤/緑色用）
 */
export function formatJpyDiff(diff: number): string {
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${formatJpyReadable(Math.abs(diff))}`
}

/**
 * パーセンテージ表示
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * 残り必要額を日本人向けに表示
 * 例: 118,000,000 => "1億1,800万円"
 */
export function formatRemainingAmount(jpy: number): string {
  return formatJpyReadable(jpy)
}
