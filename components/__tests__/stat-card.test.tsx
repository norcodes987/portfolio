/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { StatCard } from '../stat-card'

describe('StatCard', () => {
  it('renders the label and value', () => {
    render(<StatCard label="USD/SGD" value="1.350" />)
    expect(screen.getByText('USD/SGD')).toBeInTheDocument()
    expect(screen.getByText('1.350')).toBeInTheDocument()
  })

  it('renders an optional sub-line', () => {
    render(<StatCard label="Net worth" value="S$56,091" sub="SGD equivalent" />)
    expect(screen.getByText('SGD equivalent')).toBeInTheDocument()
  })

  it('renders a positive delta in emerald', () => {
    render(<StatCard label="P&L" value="$100" deltaLabel="+5.00%" deltaPositive />)
    expect(screen.getByText('+5.00%')).toHaveClass('text-emerald-600')
  })

  it('renders a negative delta in red', () => {
    render(<StatCard label="P&L" value="-$50" deltaLabel="-2.00%" deltaPositive={false} />)
    expect(screen.getByText('-2.00%')).toHaveClass('text-red-600')
  })
})
