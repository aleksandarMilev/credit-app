import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, HelpCircle } from 'lucide-react'

interface FaqEntry {
  question: string
  answer: ReactNode
}

const faqEntries: FaqEntry[] = [
  {
    question: 'Какви документи са необходими за кандидатстване?',
    answer: 'Необходимо е само сканирано изображение или снимка на личната ви карта (лице).',
  },
  {
    question: 'Трябва ли да си създам профил, за да кандидатствам?',
    answer:
      'Не. Кандидатстването става с еднократно попълване на форма, без регистрация и без парола.',
  },
  {
    question: 'Колко време отнема разглеждането на заявлението?',
    answer:
      'Нямаме фиксиран срок — заявленията се разглеждат от нашия екип възможно най-скоро след подаването им.',
  },
  {
    question: 'Как ще разбера дали заявлението ми е одобрено или отказано?',
    answer:
      'Ще получите имейл известие на посочения от вас адрес веднага след като бъде взето решение по заявлението.',
  },
  {
    question: 'Мога ли да проверя статуса на заявлението си онлайн?',
    answer:
      'В момента няма портал за проверка на статус — тъй като кандидатстването не изисква профил, ще бъдете уведомени само по имейл.',
  },
  {
    question: 'Мога ли да подам ново заявление, ако предишното е отказано?',
    answer:
      'Да. След като по текущото ви заявление има решение (одобрено или отказано), можете да подадете ново.',
  },
  {
    question: 'Безопасни ли са личните ми данни?',
    answer: (
      <>
        Да — данните ви се обработват отговорно, а ЕГН се съхранява в криптиран вид. Повече
        подробности ще намерите в{' '}
        <Link
          to="/privacy"
          className="font-semibold text-terracotta-600 underline decoration-terracotta-300 decoration-2 underline-offset-2 transition-colors hover:text-terracotta-700"
        >
          Политиката за поверителност
        </Link>
        .
      </>
    ),
  },
]

interface FaqAccordionItemProps {
  entry: FaqEntry
}

const FaqAccordionItem = ({ entry }: FaqAccordionItemProps) => {
  const contentId = useId()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="rounded-3xl bg-white shadow-lg ring-1 ring-stone-900/5">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => {
          setIsOpen((current) => !current)
        }}
        className="flex w-full items-center justify-between gap-4 rounded-3xl px-6 py-5 text-left transition-colors hover:bg-pine-50/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-pine-200"
      >
        <span className="text-base font-bold text-stone-900 sm:text-lg">{entry.question}</span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine-50 text-pine-700 ring-1 ring-pine-100 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p id={contentId} className="px-6 pb-5 text-base leading-relaxed text-stone-600">
            {entry.answer}
          </p>
        </div>
      </div>
    </div>
  )
}

export const FaqPage = () => {
  return (
    <div className="bg-cream px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-pine-50 px-4 py-1.5 text-sm font-semibold text-pine-700 ring-1 ring-pine-200">
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            Въпроси и отговори
          </span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Често задавани въпроси
          </h1>
          <p className="mt-3 text-base text-stone-600 sm:text-lg">
            Отговори на най-честите въпроси на кандидатите за кредит.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {faqEntries.map((entry) => (
            <FaqAccordionItem key={entry.question} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  )
}
