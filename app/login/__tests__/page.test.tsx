/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'

// Mock the server action
jest.mock('../actions', () => ({
  login: jest.fn(),
}))

import LoginPage from '../page'

describe('LoginPage', () => {
  it('renders a passcode input and submit button', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText('Passcode')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })
})
