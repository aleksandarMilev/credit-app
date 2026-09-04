import { Outlet } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const RootLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
