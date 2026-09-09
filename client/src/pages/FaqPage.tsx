import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

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
        <Link to="/privacy" className="text-primary-600 underline hover:text-primary-700">
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
    <div className="border-b border-gray-200 py-4">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => {
          setIsOpen((current) => !current)
        }}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="font-semibold text-gray-900">{entry.question}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <p id={contentId} className="mt-2 text-gray-600">
          {entry.answer}
        </p>
      )}
    </div>
  )
}

export const FaqPage = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Често задавани въпроси</h1>
      <p className="mt-2 text-gray-600">
        Отговори на най-честите въпроси на кандидатите за кредит.
      </p>

      <div className="mt-8">
        {faqEntries.map((entry) => (
          <FaqAccordionItem key={entry.question} entry={entry} />
        ))}
      </div>
    </div>
  )
}
