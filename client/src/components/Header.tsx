import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export const Header = () => {
  const location = useLocation()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuTrackedPathname, setMenuTrackedPathname] = useState(location.pathname)

  if (location.pathname !== menuTrackedPathname) {
    setMenuTrackedPathname(location.pathname)
    setIsMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Placeholder site name — pending Anton's confirmation of the real brand/business name */}
        <Link to="/" className="text-xl font-bold tracking-tight text-indigo-600">
          КредитApp
        </Link>

        <nav className="hidden sm:block">
          <Link
            to="/calculator"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            Калкулатор
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => {
            setIsMenuOpen((open) => !open)
          }}
          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 sm:hidden"
          aria-label={isMenuOpen ? 'Затвори менюто' : 'Отвори менюто'}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {isMenuOpen && (
        <nav className="border-t border-gray-200 px-4 py-3 sm:hidden">
          <Link
            to="/calculator"
            className="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            Калкулатор
          </Link>
        </nav>
      )}
    </header>
  )
}
