import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/layouts/RootLayout'
import { StaffLayout } from '@/layouts/StaffLayout'
import { AdminApplicationDetailPage } from '@/pages/AdminApplicationDetailPage'
import { AdminInterestRatePage } from '@/pages/AdminInterestRatePage'
import { AdminQueuePage } from '@/pages/AdminQueuePage'
import { ApplyPage } from '@/pages/ApplyPage'
import { CalculatorPage } from '@/pages/CalculatorPage'
import { FaqPage } from '@/pages/FaqPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage'
import { TermsOfUsePage } from '@/pages/TermsOfUsePage'
import { ProtectedRoute } from '@/router/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'calculator',
        element: <CalculatorPage />,
      },
      {
        path: 'apply',
        element: <ApplyPage />,
      },
      {
        path: 'privacy',
        element: <PrivacyPolicyPage />,
      },
      {
        path: 'terms',
        element: <TermsOfUsePage />,
      },
      {
        path: 'faq',
        element: <FaqPage />,
      },
    ],
  },
  {
    path: 'login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <StaffLayout />,
        children: [
          {
            path: 'admin',
            element: <AdminQueuePage />,
          },
          {
            path: 'admin/applications/:id',
            element: <AdminApplicationDetailPage />,
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute requiredRole="Approver" />,
    children: [
      {
        element: <StaffLayout />,
        children: [
          {
            path: 'admin/interest-rate',
            element: <AdminInterestRatePage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
