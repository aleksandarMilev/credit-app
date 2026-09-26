import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Coins,
  Eye,
  FileText,
  HandCoins,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react'

interface HowItWorksStep {
  title: string
  description: string
  icon: LucideIcon
}

interface Benefit {
  title: string
  description: string
  icon: LucideIcon
}

const steps: HowItWorksStep[] = [
  {
    title: 'Изчисли',
    description: 'Въведи сума и срок в калкулатора и виж прогнозна месечна вноска.',
    icon: Calculator,
  },
  {
    title: 'Кандидатствай',
    description: 'Попълни данните си и качи необходимите документи.',
    icon: FileText,
  },
  {
    title: 'Преглед',
    description: 'Екипът ни преглежда заявлението и приложените документи.',
    icon: Search,
  },
  {
    title: 'Отговор',
    description: 'Получаваш решение по кандидатурата си.',
    icon: CheckCircle2,
  },
]

const benefits: Benefit[] = [
  {
    title: 'Бърз процес',
    description: 'Кандидатстването отнема само няколко минути.',
    icon: Zap,
  },
  {
    title: 'Прозрачни условия',
    description: 'Виждаш точните параметри на кредита, преди да кандидатстваш.',
    icon: Eye,
  },
  {
    title: 'Сигурност на данните',
    description: 'Данните ти се обработват отговорно и поверително.',
    icon: ShieldCheck,
  },
]

// Organic blob radii, cycled per card so icon containers aren't uniform rounded squares.
const blobShapes = [
  'rounded-[60%_40%_55%_45%/45%_55%_45%_55%]',
  'rounded-[45%_55%_60%_40%/55%_45%_60%_40%]',
  'rounded-[55%_45%_40%_60%/40%_60%_45%_55%]',
  'rounded-[40%_60%_45%_55%/60%_35%_55%_45%]',
]

// Small, deliberate per-card offsets so the "how it works" row reads as a
// hand-placed sequence rather than a uniform grid.
const stepLayout = [
  'lg:translate-y-0',
  'lg:translate-y-7',
  'lg:-translate-y-4 lg:scale-105',
  'lg:translate-y-9',
]

export const HomePage = () => {
  const shouldReduceMotion = useReducedMotion()

  const fadeUp: Variants = shouldReduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 32 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
        },
      }

  const staggerContainer: Variants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : { hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } }

  const idleFloat = shouldReduceMotion
    ? undefined
    : { y: [0, -16, 0], transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const } }

  const idleFloatSlow = shouldReduceMotion
    ? undefined
    : { y: [0, 14, 0], transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' as const } }

  const idleSpin = shouldReduceMotion
    ? undefined
    : {
        rotate: [0, 6, 0, -6, 0],
        transition: { duration: 11, repeat: Infinity, ease: 'easeInOut' as const },
      }

  return (
    <div className="flex flex-col overflow-x-clip bg-cream">
      {/* HERO — asymmetric split: copy + CTA on the left, layered blob/icon
          composition on the right instead of a centered stack with floating
          decorative icons scattered around it. A full-bleed warm gradient plus
          soft blurred color washes carry color across the whole section so the
          left column isn't sitting on plain, unbroken cream. */}
      <section className="relative overflow-hidden px-4 pt-14 pb-20 sm:px-6 sm:pt-20 sm:pb-28 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-terracotta-100 via-cream to-pine-100"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-[-15%] left-[-10%] -z-10 h-96 w-96 rounded-[60%_40%_55%_45%/45%_55%_45%_55%] bg-sunny-200/60 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-[-20%] left-[8%] -z-10 h-80 w-80 rounded-[45%_55%_60%_40%/55%_45%_60%_40%] bg-terracotta-200/50 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] as const }}
            className="relative z-10 text-center lg:text-left"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-pine-50 px-4 py-1.5 text-sm font-semibold text-pine-700 ring-1 ring-pine-200">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Прозрачни условия, без изненади
            </span>

            {/* Placeholder hero headline/support text — pending final marketing copy from Anton */}
            <h1 className="mt-6 text-4xl leading-[1.05] font-extrabold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
              Кредит, изчислен{' '}
              <span className="relative inline-block whitespace-nowrap">
                <span className="relative z-10">лесно и бързо</span>
                <span
                  className="absolute inset-x-0 bottom-1 -z-0 h-3 -rotate-1 rounded-full bg-sunny-300 sm:h-4"
                  aria-hidden="true"
                />
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-md text-lg text-stone-600 lg:mx-0">
              Провери условията си за кредит за няколко минути — без ангажимент.
            </p>

            <div className="mt-9 flex justify-center lg:justify-start">
              <motion.span
                whileHover={shouldReduceMotion ? undefined : { scale: 1.04, rotate: -1.5 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                className="inline-block"
              >
                <Link
                  to="/calculator"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-terracotta-500 px-7 py-4 text-base font-bold text-white shadow-[0_6px_0_0_var(--color-terracotta-700)] transition-colors duration-200 hover:bg-terracotta-600 focus:outline-none focus:ring-4 focus:ring-terracotta-200"
                >
                  Изчисли вноска
                  <ArrowRight
                    className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </motion.span>
            </div>
          </motion.div>

          {/* Layered blob + icon composition — deliberate, not scattered confetti. */}
          <div
            className="relative mx-auto h-72 w-72 sm:h-96 sm:w-96 lg:mx-0 lg:h-[26rem] lg:w-full"
            aria-hidden="true"
          >
            <motion.div
              animate={idleSpin}
              className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-[60%_40%_55%_45%/45%_55%_45%_55%] bg-pine-600 sm:h-80 sm:w-80 lg:h-96 lg:w-96"
            />
            <motion.div
              animate={idleFloat}
              className="absolute top-[8%] right-[6%] h-24 w-24 rounded-[45%_55%_60%_40%/55%_45%_60%_40%] bg-terracotta-400/90 sm:h-32 sm:w-32"
            />
            <motion.div
              animate={idleFloatSlow}
              className="absolute bottom-[10%] left-[2%] h-20 w-20 rounded-full bg-sunny-400 sm:h-24 sm:w-24"
            />

            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.9, rotate: -6 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1, rotate: -3 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] as const }}
              className="absolute top-1/2 left-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 rotate-[-3deg] items-center justify-center rounded-3xl bg-cream shadow-xl ring-1 ring-stone-900/5 sm:h-40 sm:w-40"
            >
              <HandCoins className="h-14 w-14 text-terracotta-600 sm:h-16 sm:w-16" />
            </motion.div>

            <motion.div
              animate={idleFloat}
              className="absolute top-[4%] left-[10%] flex h-14 w-14 items-center justify-center rounded-full bg-cream shadow-md ring-1 ring-stone-900/5 sm:h-16 sm:w-16"
            >
              <Coins className="h-6 w-6 text-sunny-600 sm:h-7 sm:w-7" />
            </motion.div>
            <motion.div
              animate={idleFloatSlow}
              className="absolute right-[8%] bottom-[6%] flex h-14 w-14 items-center justify-center rounded-full bg-cream shadow-md ring-1 ring-stone-900/5 sm:h-16 sm:w-16"
            >
              <ShieldCheck className="h-6 w-6 text-pine-600 sm:h-7 sm:w-7" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — staggered offsets instead of a uniform card grid. A
          faint gradient + blurred wash keep this cream stretch from reading
          as flat, equally-dominant plain space between the two color-forward
          sections around it. */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-cream via-cream-200/60 to-cream"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-8 right-[-8%] -z-10 h-80 w-80 rounded-[55%_45%_40%_60%/40%_60%_45%_55%] bg-pine-100/70 blur-3xl"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-5xl">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.6 }}
            className="text-center text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl"
          >
            Как работи
          </motion.h2>

          <motion.ol
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="mt-14 grid list-none grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
          >
            {steps.map((step, index) => (
              <motion.li
                key={step.title}
                variants={fadeUp}
                whileHover={shouldReduceMotion ? undefined : { y: -6, rotate: index % 2 === 0 ? -1.5 : 1.5 }}
                className={`relative flex flex-col items-center rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-stone-900/5 transition-shadow duration-200 hover:shadow-lg sm:items-start sm:text-left ${stepLayout[index % stepLayout.length]}`}
              >
                <span
                  className="pointer-events-none absolute top-3 right-4 text-5xl font-black text-stone-900/5 select-none"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <motion.span
                  whileHover={shouldReduceMotion ? undefined : { rotate: [0, -12, 10, -6, 0] }}
                  transition={{ duration: 0.5 }}
                  className={`flex h-14 w-14 items-center justify-center bg-pine-50 text-pine-700 ring-1 ring-pine-100 ${blobShapes[index % blobShapes.length]}`}
                >
                  <step.icon className="h-6 w-6" aria-hidden="true" />
                </motion.span>
                <h3 className="mt-5 text-lg font-bold text-stone-900">{step.title}</h3>
                <p className="mt-1.5 text-sm text-stone-500">{step.description}</p>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* WHY US — bold dark color-block section, asymmetric card sizes. */}
      <section className="relative overflow-hidden bg-pine-900 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-[55%_45%_40%_60%/40%_60%_45%_55%] bg-pine-800/70 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-5xl">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.6 }}
            className="text-center text-3xl font-extrabold tracking-tight text-cream sm:text-4xl"
          >
            Защо да избереш нас
          </motion.h2>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-6"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                variants={fadeUp}
                whileHover={
                  shouldReduceMotion ? undefined : { y: -8, rotate: index === 1 ? 0 : index === 0 ? -1.5 : 1.5 }
                }
                className={`rounded-3xl bg-cream p-7 shadow-lg ${
                  index === 0
                    ? 'sm:col-span-4 sm:row-span-1 lg:rotate-[-1deg]'
                    : index === 1
                      ? 'sm:col-span-2 lg:translate-y-6'
                      : 'sm:col-span-6 lg:col-span-2 lg:-translate-y-3 lg:rotate-[1deg]'
                }`}
              >
                <motion.span
                  whileHover={shouldReduceMotion ? undefined : { rotate: [0, -12, 10, -6, 0] }}
                  transition={{ duration: 0.5 }}
                  className={`flex h-12 w-12 items-center justify-center bg-terracotta-50 text-terracotta-600 ring-1 ring-terracotta-100 ${blobShapes[(index + 2) % blobShapes.length]}`}
                >
                  <benefit.icon className="h-5 w-5" aria-hidden="true" />
                </motion.span>
                <h3 className="mt-5 text-lg font-bold text-stone-900">{benefit.title}</h3>
                <p className="mt-2 text-sm text-stone-600">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
