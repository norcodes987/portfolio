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

  it.each(['Research', 'Performance'])('marks %s as disabled (coming-soon stub)', (label) => {
    render(<Nav />)
    for (const link of screen.getAllByText(label)) {
      expect(link.closest('[aria-disabled="true"]')).not.toBeNull()
    }
  })

  it('keeps the data tabs enabled', () => {
    render(<Nav />)
    for (const label of ['Overview', 'Watchlist', 'Trade Log']) {
      for (const link of screen.getAllByText(label)) {
        expect(link.closest('[aria-disabled="true"]')).toBeNull()
      }
    }
  })
})
