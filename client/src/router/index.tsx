import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/layouts/RootLayout'
import { CalculatorPage } from '@/pages/CalculatorPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

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
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
