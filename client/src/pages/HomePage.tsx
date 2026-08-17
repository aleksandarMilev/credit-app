import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Eye,
  FileText,
  Search,
  ShieldCheck,
  TrendingUp,
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

// Confirmed application flow from product-description.md — not a placeholder
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

// Placeholder benefit messaging — pending real trust/marketing copy from Anton
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

export const HomePage = () => {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary-200/50 blur-3xl" />
          <div className="absolute top-1/3 -right-16 h-80 w-80 rounded-full bg-accent-200/40 blur-3xl" />
          <TrendingUp className="absolute top-16 left-[8%] hidden h-20 w-20 -rotate-12 text-primary-300/40 sm:block" />
          <ShieldCheck className="absolute right-[10%] bottom-10 hidden h-24 w-24 rotate-6 text-accent-300/40 sm:block" />
          <Zap className="absolute top-1/2 right-[20%] hidden h-14 w-14 rotate-12 text-primary-300/30 lg:block" />
        </div>

        <div className="relative mx-auto max-w-2xl">
          {/* Placeholder hero headline/support text — pending final marketing copy from Anton */}
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Кредит, изчислен лесно и бързо
          </h1>
          <p className="mt-4 text-base text-gray-600 sm:text-lg">
            Провери условията си за кредит за няколко минути — без ангажимент.
          </p>
          <Link
            to="/calculator"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-accent-500 px-6 py-3 text-base font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:ring-offset-2"
          >
            Изчисли вноска
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">Как работи</h2>
          <ol className="mt-10 grid list-none grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <li
                key={step.title}
                className="group flex flex-col items-center rounded-2xl p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:bg-primary-50/60 sm:items-start sm:text-left"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 ring-1 ring-primary-100 transition-colors duration-200 group-hover:bg-primary-600 group-hover:text-white">
                  <step.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-primary-50/40 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Защо да избереш нас
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600 ring-1 ring-accent-100">
                  <benefit.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-gray-900">{benefit.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
