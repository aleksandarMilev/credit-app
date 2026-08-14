import { Link } from 'react-router-dom'

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            {/* Placeholder contact info — pending real business contact details from Anton */}
            <p className="text-sm font-semibold text-gray-900">КредитApp</p>
            <p className="mt-1 text-sm text-gray-500">info@creditapp.bg · +359 000 000 000</p>
          </div>

          <nav>
            <Link
              to="/calculator"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Калкулатор
            </Link>
          </nav>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 sm:text-left">
          © {currentYear} КредитApp. Всички права запазени.
        </p>
      </div>
    </footer>
  )
}
