import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Compass } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

export const NotFoundPage = () => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-4 py-12 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-terracotta-50 via-cream to-pine-50"
        aria-hidden="true"
      />

      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg ring-1 ring-stone-900/5 sm:p-10"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-terracotta-50 text-terracotta-600 ring-1 ring-terracotta-100">
          <Compass className="h-7 w-7" aria-hidden="true" />
        </span>

        <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-stone-900">404</h1>
        <p className="mt-3 text-base text-stone-600">Страницата не е намерена</p>

        <motion.span
          whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          className="mt-8 inline-block"
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-pine-600 px-6 py-3.5 text-base font-bold text-white shadow-[0_4px_0_0_var(--color-pine-800)] transition-colors duration-200 hover:bg-pine-700 focus:outline-none focus:ring-4 focus:ring-pine-200"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Обратно към началната страница
          </Link>
        </motion.span>
      </motion.div>
    </div>
  )
}
