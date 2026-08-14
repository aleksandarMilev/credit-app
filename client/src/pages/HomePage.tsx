import { Link } from 'react-router-dom'

interface HowItWorksStep {
  title: string
  description: string
}

interface Benefit {
  title: string
  description: string
}

// Confirmed application flow from product-description.md — not a placeholder
const steps: HowItWorksStep[] = [
  {
    title: 'Изчисли',
    description: 'Въведи сума и срок в калкулатора и виж прогнозна месечна вноска.',
  },
  {
    title: 'Кандидатствай',
    description: 'Попълни данните си и качи необходимите документи.',
  },
  {
    title: 'Преглед',
    description: 'Екипът ни преглежда заявлението и приложените документи.',
  },
  {
    title: 'Отговор',
    description: 'Получаваш решение по кандидатурата си.',
  },
]

// Placeholder benefit messaging — pending real trust/marketing copy from Anton
const benefits: Benefit[] = [
  {
    title: 'Бърз процес',
    description: 'Кандидатстването отнема само няколко минути.',
  },
  {
    title: 'Прозрачни условия',
    description: 'Виждаш точните параметри на кредита, преди да кандидатстваш.',
  },
  {
    title: 'Сигурност на данните',
    description: 'Данните ти се обработват отговорно и поверително.',
  },
]

export const HomePage = () => {
  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-b from-indigo-50 via-white to-white px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Placeholder hero headline/support text — pending final marketing copy from Anton */}
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Кредит, изчислен лесно и бързо
          </h1>
          <p className="mt-4 text-base text-gray-600 sm:text-lg">
            Провери условията си за кредит за няколко минути — без ангажимент.
          </p>
          <Link
            to="/calculator"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2"
          >
            Изчисли вноска
          </Link>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">Как работи</h2>
          <ol className="mt-10 grid list-none grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col items-center text-center sm:items-start sm:text-left"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-gray-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Защо да избереш нас
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5"
              >
                <h3 className="text-base font-semibold text-gray-900">{benefit.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
