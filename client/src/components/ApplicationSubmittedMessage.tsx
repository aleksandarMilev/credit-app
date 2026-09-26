import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

export const ApplicationSubmittedMessage = () => {
  const shouldReduceMotion = useReducedMotion()
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Replaces the form in place (no route change, so ScrollRestoration doesn't
  // apply) — reset the scroll position and move focus to the heading so the
  // confirmation is both visible and announced by screen readers.
  useEffect(() => {
    window.scrollTo(0, 0)
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-4 py-12 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-pine-100 via-cream to-sunny-100"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-[-15%] right-[-10%] -z-10 h-80 w-80 rounded-[55%_45%_40%_60%/40%_60%_45%_55%] bg-terracotta-100/60 blur-3xl"
        aria-hidden="true"
      />

      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24, scale: 0.96 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl ring-1 ring-stone-900/5 sm:p-10"
      >
        <motion.span
          initial={shouldReduceMotion ? undefined : { scale: 0.6, rotate: -8 }}
          animate={shouldReduceMotion ? undefined : { scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pine-600 text-white shadow-md"
        >
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </motion.span>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-6 text-2xl font-extrabold tracking-tight text-stone-900 focus:outline-none sm:text-3xl"
        >
          Кандидатурата е изпратена успешно!
        </h1>
        <p className="mt-3 text-base text-stone-600">
          Изпратихме потвърждение на посочения от вас имейл адрес. Нашият екип ще прегледа
          заявлението ви и ще се свърже с вас с решение.
        </p>
        <motion.span
          whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          className="mt-8 inline-block"
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-pine-600 px-6 py-3.5 text-base font-bold text-white shadow-[0_4px_0_0_var(--color-pine-800)] transition-colors duration-200 hover:bg-pine-700 focus:outline-none focus:ring-4 focus:ring-pine-200"
          >
            Обратно към началната страница
          </Link>
        </motion.span>
      </motion.div>
    </div>
  )
}
