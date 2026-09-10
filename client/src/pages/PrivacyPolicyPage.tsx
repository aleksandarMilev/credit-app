// TEMPLATE CONTENT — pending review by qualified legal counsel before real
// launch. This is generic, industry-standard placeholder language for a
// lending/credit-intake site, written to match the facts actually
// implemented in this codebase (see product-description.md). It is not a
// substitute for legal advice and must not be treated as a finished,
// compliant policy.

import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  Clock,
  Cookie,
  Fingerprint,
  Mail,
  Scale,
  ShieldCheck,
  Users,
} from 'lucide-react'

const LAST_UPDATED_PLACEHOLDER = 'предстои да се уточни при юридически преглед'

interface PolicySection {
  title: string
  icon: LucideIcon
  body: string
}

const sections: PolicySection[] = [
  {
    title: 'Какви данни събираме',
    icon: Fingerprint,
    body: 'При подаване на заявление за кредит събираме: име и фамилия, ЕГН, телефон, имейл адрес, параметри на заявения кредит и сканирано изображение на лична карта. Тези данни се събират единствено с цел обработка на заявлението за кредит и вземане на решение по него от нашия екип.',
  },
  {
    title: 'Как защитаваме данните',
    icon: ShieldCheck,
    body: 'ЕГН се съхранява в криптиран вид в базата данни. Изображението на личната карта не е публично достъпно и се преглежда само от оторизирани служители през защитена част от системата. Достъпът до тези данни е ограничен само до служители, на които им е необходим за целите на прегледа на заявлението.',
  },
  {
    title: 'Съхранение и изтриване на данни',
    icon: Clock,
    body: 'Данните от заявлението се съхраняват за ограничен период от време, след което се изтриват по вътрешна процедура на два етапа (временно и впоследствие окончателно изтриване). Конкретните срокове са настройваеми и подлежат на промяна, затова тук умишлено не посочваме точен брой дни.',
  },
  {
    title: 'Споделяне на данни с трети лица',
    icon: Users,
    body: 'Не продаваме личните данни на кандидатите и не ги споделяме с трети лица, освен доколкото е необходимо за самата обработка на заявлението (например доставчици на техническа инфраструктура, действащи по наши указания). Не използваме данните за маркетингови цели на трети страни.',
  },
  {
    title: 'Автоматизирано вземане на решения',
    icon: BadgeCheck,
    body: 'Решенията по заявленията за кредит се вземат от служители на компанията — системата не извършва автоматизирано кредитно оценяване или автоматично одобрение/отказ.',
  },
  {
    title: 'Данни в локалното хранилище на браузъра',
    icon: Cookie,
    body: 'Сайтът не задава бисквитки (cookies). Административният панел за служители съхранява единствено удостоверителен токен в локалното хранилище (localStorage) на браузъра, за да поддържа влизането в системата — този токен не се използва за проследяване на посетители и не се споделя с трети страни.',
  },
  {
    title: 'Вашите права',
    icon: Scale,
    body: 'Съгласно приложимото законодателство за защита на личните данни (ОРЗД/GDPR), имате право на достъп до личните си данни, право на корекция при неточност, както и право на възражение срещу обработката им. Тъй като кандидатстването не изисква регистрация на профил, в момента няма самообслужващ портал за упражняване на тези права по електронен път — те се упражняват чрез директна връзка с нас на контактите по-долу.',
  },
]

export const PrivacyPolicyPage = () => {
  return (
    <div className="bg-cream px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-pine-50 px-4 py-1.5 text-sm font-semibold text-pine-700 ring-1 ring-pine-200">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Поверителност
          </span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Политика за поверителност
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Последна актуализация: {LAST_UPDATED_PLACEHOLDER}
          </p>
        </div>

        <div className="mt-10 rounded-3xl bg-white p-6 shadow-lg ring-1 ring-stone-900/5 sm:p-10">
          <p className="text-base leading-relaxed text-stone-600">
            Настоящият документ е примерен шаблон и описва по общ начин как КредитApp обработва
            личните данни на кандидатите за кредит. Той предстои да бъде прегледан и допълнен от
            юрист преди реалното стартиране на услугата.
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
                За въпроси относно личните ви данни или за упражняване на правата ви, свържете се с
                нас на: info@creditapp.bg · +359 000 000 000.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
