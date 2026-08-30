import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'

interface FrankfurterResponse {
  amount: number
  base: string
  rates: Record<string, number>
}

export async function getUsdSgdRate(): Promise<number> {
  'use cache'
  cacheTag('fx-rate')
  cacheLife('portfolioData')

  const response = await fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=SGD')

  if (!response.ok) {
    throw new Error(`FX rate request failed with status ${response.status}`)
  }

  const data = (await response.json()) as FrankfurterResponse
  return data.rates.SGD
}
