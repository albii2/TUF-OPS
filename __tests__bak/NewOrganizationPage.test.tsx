import { render, screen } from '@testing-library/react'
import NewOrganizationPage from '../app/organizations/new/page'

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('NewOrganizationPage', () => {
  it('renders the create organization form', () => {
    render(<NewOrganizationPage />)

    expect(screen.getByRole('heading', { name: /create organization/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/zoho account id/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create organization/i })).toBeInTheDocument()
  })
})
