/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { AllocationChart } from '../allocation-chart'

describe('AllocationChart', () => {
  it('renders a text-fallback percentage list alongside the chart', () => {
    render(
      <AllocationChart
        slices={[
          { sector: 'Mega-cap', value: 75 },
          { sector: 'Healthcare', value: 25 },
        ]}
      />
    )
    expect(screen.getByText('Mega-cap')).toBeInTheDocument()
    expect(screen.getByText('75.0%')).toBeInTheDocument()
    expect(screen.getByText('Healthcare')).toBeInTheDocument()
    expect(screen.getByText('25.0%')).toBeInTheDocument()
  })

  it('shows an empty state with no slices', () => {
    render(<AllocationChart slices={[]} />)
    expect(screen.getByText('No holdings to chart yet')).toBeInTheDocument()
  })
})
