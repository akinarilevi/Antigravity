import { fetchCurrentPrice } from './coingecko'
import { fetchYahooRaw } from './yahoo'
import type { Holding } from '@prisma/client'

export interface HoldingValue {
  id: string
  ticker: string
  name: string
  quantity: number
  valueJpy: number
  purchaseCostJpy: number | null
  priceSource: string
  assetClass: string
}

export async function getHoldingValueJpy(
  holding: Holding,
  usdJpy: number
): Promise<HoldingValue> {
  let unitPriceJpy: number

  switch (holding.priceSource) {
    case 'COINGECKO': {
      const btcUsd = await fetchCurrentPrice()
      unitPriceJpy = btcUsd * usdJpy
      break
    }
    case 'YAHOO_USD': {
      const pairs = await fetchYahooRaw(holding.ticker, '1d', '5m')
      if (pairs.length === 0) throw new Error(`No Yahoo data for ${holding.ticker}`)
      const latestUsd = pairs[pairs.length - 1][1]
      unitPriceJpy = latestUsd * usdJpy
      break
    }
    case 'YAHOO_JPY': {
      const pairs = await fetchYahooRaw(holding.ticker, '1d', '5m')
      if (pairs.length === 0) throw new Error(`No Yahoo data for ${holding.ticker}`)
      unitPriceJpy = pairs[pairs.length - 1][1]
      break
    }
    case 'MANUAL_JPY':
    default:
      unitPriceJpy = 1
      break
  }

  const valueJpy = holding.quantity * unitPriceJpy
  const purchaseCostJpy =
    holding.purchasePrice != null ? holding.purchasePrice * holding.quantity : null

  return {
    id: holding.id,
    ticker: holding.ticker,
    name: holding.name,
    quantity: holding.quantity,
    valueJpy,
    purchaseCostJpy,
    priceSource: holding.priceSource,
    assetClass: holding.assetClass,
  }
}

export async function getAllHoldingValues(
  holdings: Holding[],
  usdJpy: number
): Promise<HoldingValue[]> {
  const btcPriceUsd = holdings.some((h) => h.priceSource === 'COINGECKO')
    ? await fetchCurrentPrice()
    : 0

  const yahooTickers = [
    ...new Set(
      holdings
        .filter((h) => h.priceSource === 'YAHOO_USD' || h.priceSource === 'YAHOO_JPY')
        .map((h) => h.ticker)
    ),
  ]

  const yahooData = new Map<string, number>()
  await Promise.all(
    yahooTickers.map(async (ticker) => {
      const holding = holdings.find((h) => h.ticker === ticker)!
      const pairs = await fetchYahooRaw(ticker, '1d', '5m')
      if (pairs.length > 0) {
        const latestPrice = pairs[pairs.length - 1][1]
        const priceJpy =
          holding.priceSource === 'YAHOO_USD' ? latestPrice * usdJpy : latestPrice
        yahooData.set(ticker, priceJpy)
      }
    })
  )

  return holdings.map((h) => {
    let unitPriceJpy: number
    if (h.priceSource === 'COINGECKO') {
      unitPriceJpy = btcPriceUsd * usdJpy
    } else if (h.priceSource === 'YAHOO_USD' || h.priceSource === 'YAHOO_JPY') {
      unitPriceJpy = yahooData.get(h.ticker) ?? 0
    } else {
      unitPriceJpy = 1
    }

    return {
      id: h.id,
      ticker: h.ticker,
      name: h.name,
      quantity: h.quantity,
      valueJpy: h.quantity * unitPriceJpy,
      purchaseCostJpy: h.purchasePrice != null ? h.purchasePrice * h.quantity : null,
      priceSource: h.priceSource,
      assetClass: h.assetClass,
    }
  })
}
