// TEMPLATE CONTENT — pending review by qualified legal counsel before real
// launch. Generic, industry-standard placeholder terms for a lending/
// credit-intake site, written to match the facts actually implemented in
// this codebase (see product-description.md). Not legal advice.

import type { LucideIcon } from 'lucide-react'
import { Calculator, FileWarning, Gavel, Mail, ScrollText, ShieldOff, UserCheck } from 'lucide-react'

const LAST_UPDATED_PLACEHOLDER = 'предстои да се уточни при юридически преглед'

interface TermsSection {
  title: string
  icon: LucideIcon
  body: string
}

const sections: TermsSection[] = [
  {
    title: 'Какво представлява услугата',
    icon: Calculator,
    body: 'КредитApp е платформа за приемане на заявления за кредит. Сайтът предоставя ориентировъчен кредитен калкулатор и форма за кандидатстване. Услугата не извършва автоматизирано кредитно оценяване — решенията по всяко заявление се вземат ръчно от служители на компанията.',
  },
  {
    title: 'Точност на подадената информация',
    icon: UserCheck,
    body: 'Кандидатът е длъжен да предостави вярна, точна и актуална информация при попълване на заявлението, включително коректни лични данни и четливо изображение на личната карта. Подаването на невярна или подвеждаща информация може да доведе до отказ на заявлението.',
  },
  {
    title: 'Липса на гаранция за одобрение',
    icon: FileWarning,
    body: 'Резултатите от кредитния калкулатор са само ориентировъчни и не представляват обвързващо предложение. Подаването на заявление не гарантира неговото одобрение — решението се взема по преценка на екипа ни въз основа на предоставената информация.',
  },
  {
    title: 'Ограничение на отговорността',
    icon: ShieldOff,
    body: 'Доколкото е допустимо от приложимото законодателство, КредитApp не носи отговорност за евентуални вреди, произтичащи от използването или невъзможността за използване на сайта, включително временна недостъпност, технически грешки или забавяне при обработката на заявления.',
  },
  {
    title: 'Приложимо право',
    icon: Gavel,
    body: 'Настоящите Общи условия се уреждат от законодателството на Република България. Всеки спор, който не може да бъде разрешен по взаимно съгласие, подлежи на разглеждане от компетентния български съд.',
  },
]

export const TermsOfUsePage = () => {
  return (
    <div className="bg-cream px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-pine-50 px-4 py-1.5 text-sm font-semibold text-pine-700 ring-1 ring-pine-200">
            <ScrollText className="h-4 w-4" aria-hidden="true" />
            Условия за ползване
          </span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Общи условия
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Последна актуализация: {LAST_UPDATED_PLACEHOLDER}
          </p>
        </div>

        <div className="mt-10 rounded-3xl bg-white p-6 shadow-lg ring-1 ring-stone-900/5 sm:p-10">
          <p className="text-base leading-relaxed text-stone-600">
            Настоящите Общи условия са примерен шаблон, който урежда по общ начин използването на
            сайта на КредитApp. Те предстои да бъдат прегледани и допълнени от юрист преди
            реалното стартиране на услугата.
          </p>

          <div className="mt-8 space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="border-t border-stone-100 pt-8 first:border-t-0 first:pt-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pine-50 text-pine-700 ring-1 ring-pine-100">
                    <section.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 className="text-lg font-bold text-stone-900">{section.title}</h2>
                </div>
                <p className="mt-3 text-base leading-relaxed text-stone-600">{section.body}</p>
              </section>
            ))}

            <section className="border-t border-stone-100 pt-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta-50 text-terracotta-600 ring-1 ring-terracotta-100">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="text-lg font-bold text-stone-900">Контакт</h2>
              </div>
              <p className="mt-3 text-base leading-relaxed text-stone-600">
                За въпроси относно тези условия, свържете се с нас на: info@creditapp.bg · +359 000
                000 000.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
