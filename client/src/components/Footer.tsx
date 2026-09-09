import { Link } from 'react-router-dom'
import { Landmark } from 'lucide-react'

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-pine-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:text-left">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine-600 text-white">
              <Landmark className="h-4 w-4" aria-hidden="true" />
            </span>
            {/* Placeholder contact info — pending real business contact details from Anton */}
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-cream">КредитApp</p>
              <p className="mt-1 text-sm text-pine-200">info@creditapp.bg · +359 000 000 000</p>
            </div>
          </div>

          <nav className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
            <Link
              to="/calculator"
              className="text-sm font-medium text-pine-200 transition-colors hover:text-sunny-400"
            >
              Калкулатор
            </Link>

            <div className="flex flex-col items-center gap-2 sm:items-start">
              <span className="text-xs font-semibold tracking-wide text-pine-400 uppercase">
                Правна информация
              </span>
              <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-4">
                <Link
                  to="/terms"
                  className="text-sm font-medium text-pine-200 transition-colors hover:text-sunny-400"
                >
                  Общи условия
                </Link>
                <Link
                  to="/privacy"
                  className="text-sm font-medium text-pine-200 transition-colors hover:text-sunny-400"
                >
                  Политика за поверителност
                </Link>
                <Link
                  to="/faq"
                  className="text-sm font-medium text-pine-200 transition-colors hover:text-sunny-400"
                >
                  ЧЗВ
                </Link>
              </div>
            </div>
          </nav>
        </div>

        <p className="mt-6 border-t border-pine-800 pt-6 text-center text-xs text-pine-400 sm:text-left">
          © {currentYear} КредитApp. Всички права запазени.
        </p>
      </div>
    </footer>
  )
}
