import { Outlet } from 'react-router-dom'
import { StaffHeader } from '@/components/StaffHeader'

export const StaffLayout = () => (
  <div className="flex min-h-screen flex-col bg-gray-50">
    <StaffHeader />
    <main className="flex-1">
      <Outlet />
    </main>
  </div>
)
