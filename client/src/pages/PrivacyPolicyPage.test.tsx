import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage'

describe('PrivacyPolicyPage', () => {
  it('renders the page heading', () => {
    renderWithProviders(<PrivacyPolicyPage />)

    expect(screen.getByRole('heading', { name: 'Политика за поверителност' })).toBeInTheDocument()
  })

  it('mentions the contact info for data requests', () => {
    renderWithProviders(<PrivacyPolicyPage />)

    expect(screen.getAllByText(/info@creditapp\.bg/).length).toBeGreaterThan(0)
  })
})
