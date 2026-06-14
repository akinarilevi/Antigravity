import { fetchYahooRaw } from './yahoo'

let cachedRate: number | null = null
let cacheExpiry = 0

export async function getUsdJpy(): Promise<number> {
  const now = Date.now()
  if (cachedRate && now < cacheExpiry) return cachedRate

  const pairs = await fetchYahooRaw('USDJPY=X', '1d', '5m')
  if (pairs.length === 0) throw new Error('No USDJPY data')

  cachedRate = pairs[pairs.length - 1][1]
  cacheExpiry = now + 5 * 60 * 1000
  return cachedRate
}
