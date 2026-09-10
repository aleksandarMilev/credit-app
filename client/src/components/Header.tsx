import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Landmark, Menu, X } from 'lucide-react'

export const Header = () => {
  const location = useLocation()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuTrackedPathname, setMenuTrackedPathname] = useState(location.pathname)

  if (location.pathname !== menuTrackedPathname) {
    setMenuTrackedPathname(location.pathname)
    setIsMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-cream/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Placeholder site name — pending Anton's confirmation of the real brand/business name */}
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine-600 text-white shadow-sm">
            <Landmark className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-xl font-bold tracking-tight text-stone-900">КредитApp</span>
        </Link>

        <nav className="hidden sm:block">
          <Link
            to="/calculator"
            className="rounded-lg px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-pine-50 hover:text-pine-700"
          >
            Калкулатор
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => {
            setIsMenuOpen((open) => !open)
          }}
          className="inline-flex items-center justify-center rounded-lg p-2 text-stone-700 transition-colors hover:bg-pine-50 hover:text-pine-700 sm:hidden"
          aria-label={isMenuOpen ? 'Затвори менюто' : 'Отвори менюто'}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {isMenuOpen && (
        <nav className="border-t border-stone-200 px-4 py-3 sm:hidden">
          <Link
            to="/calculator"
            className="block rounded-lg px-3 py-2 text-base font-medium text-stone-700 transition-colors hover:bg-pine-50 hover:text-pine-700"
          >
            Калкулатор
          </Link>
        </nav>
      )}
    </header>
  )
}
