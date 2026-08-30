/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

import { Nav } from '../nav'

describe('Nav', () => {
  it('renders all 5 tabs', () => {
    render(<Nav />)
    for (const label of ['Overview', 'Watchlist', 'Research', 'Trade Log', 'Performance']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
  })

  it('marks Performance as disabled', () => {
    render(<Nav />)
    const performanceLinks = screen.getAllByText('Performance')
    for (const link of performanceLinks) {
      expect(link.closest('[aria-disabled="true"]')).not.toBeNull()
    }
  })
})
