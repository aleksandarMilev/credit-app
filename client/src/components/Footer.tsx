import { Link } from 'react-router-dom'
import { Landmark } from 'lucide-react'

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-primary-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:text-left">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-900 text-accent-400">
              <Landmark className="h-4 w-4" aria-hidden="true" />
            </span>
            {/* Placeholder contact info — pending real business contact details from Anton */}
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-white">КредитApp</p>
              <p className="mt-1 text-sm text-primary-200">info@creditapp.bg · +359 000 000 000</p>
            </div>
          </div>

          <nav>
            <Link
              to="/calculator"
              className="text-sm font-medium text-primary-200 transition-colors hover:text-accent-400"
            >
              Калкулатор
            </Link>
          </nav>
        </div>

        <p className="mt-6 border-t border-primary-900 pt-6 text-center text-xs text-primary-400 sm:text-left">
          © {currentYear} КредитApp. Всички права запазени.
        </p>
      </div>
    </footer>
  )
}
