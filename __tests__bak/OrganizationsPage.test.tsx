import { render, screen } from '@testing-library/react'
import OrganizationsPage from '../app/organizations/page'

// Mock the fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ organizations: [], total: 0 }),
  })
) as jest.Mock

describe('OrganizationsPage', () => {
  it('has a button that links to the new organization page', () => {
    render(<OrganizationsPage />)

    const createButton = screen.getByRole('link', { name: /create organization/i })
    expect(createButton).toHaveAttribute('href', '/organizations/new')
  })
})
