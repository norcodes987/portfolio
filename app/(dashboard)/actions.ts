'use server'

import { updateTag } from 'next/cache'

export async function refreshPortfolioData(): Promise<void> {
  updateTag('portfolio')
  updateTag('fx-rate')
}
