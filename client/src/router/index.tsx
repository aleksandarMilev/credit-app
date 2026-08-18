import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/layouts/RootLayout'
import { AdminApplicationDetailPage } from '@/pages/AdminApplicationDetailPage'
import { AdminQueuePage } from '@/pages/AdminQueuePage'
import { ApplyPage } from '@/pages/ApplyPage'
import { ApproverOnlyPlaceholderPage } from '@/pages/ApproverOnlyPlaceholderPage'
import { CalculatorPage } from '@/pages/CalculatorPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
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
        path: 'admin',
        element: <AdminQueuePage />,
      },
      {
        path: 'admin/applications/:id',
        element: <AdminApplicationDetailPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute requiredRole="Approver" />,
    children: [
      {
        path: 'admin/test-approver-only',
        element: <ApproverOnlyPlaceholderPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
