import { Outlet, ScrollRestoration } from 'react-router-dom'

// Pathless root of the whole route tree — the one place that covers public,
// staff, login and 404 routes alike, so ScrollRestoration is rendered once.
export const AppLayout = () => (
  <>
    <ScrollRestoration />
    <Outlet />
  </>
)
