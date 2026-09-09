// TEMPLATE CONTENT — pending review by qualified legal counsel before real
// launch. Generic, industry-standard placeholder terms for a lending/
// credit-intake site, written to match the facts actually implemented in
// this codebase (see product-description.md). Not legal advice.

const LAST_UPDATED_PLACEHOLDER = 'предстои да се уточни при юридически преглед'

export const TermsOfUsePage = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Общи условия</h1>
      <p className="mt-2 text-sm text-gray-500">
        Последна актуализация: {LAST_UPDATED_PLACEHOLDER}
      </p>

      <div className="mt-8 space-y-6 text-gray-700">
        <p>
          Настоящите Общи условия са примерен шаблон, който урежда по общ начин използването на
          сайта на КредитApp. Те предстои да бъдат прегледани и допълнени от юрист преди реалното
          стартиране на услугата.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Какво представлява услугата</h2>
          <p>
            КредитApp е платформа за приемане на заявления за кредит. Сайтът предоставя ориентировъчен
            кредитен калкулатор и форма за кандидатстване. Услугата не извършва автоматизирано
            кредитно оценяване — решенията по всяко заявление се вземат ръчно от служители на
            компанията.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            Точност на подадената информация
          </h2>
          <p>
            Кандидатът е длъжен да предостави вярна, точна и актуална информация при попълване на
            заявлението, включително коректни лични данни и четливо изображение на личната карта.
            Подаването на невярна или подвеждаща информация може да доведе до отказ на
            заявлението.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Липса на гаранция за одобрение</h2>
          <p>
            Резултатите от кредитния калкулатор са само ориентировъчни и не представляват
            обвързващо предложение. Подаването на заявление не гарантира неговото одобрение —
            решението се взема по преценка на екипа ни въз основа на предоставената информация.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Ограничение на отговорността</h2>
          <p>
            Доколкото е допустимо от приложимото законодателство, КредитApp не носи отговорност за
            евентуални вреди, произтичащи от използването или невъзможността за използване на
            сайта, включително временна недостъпност, технически грешки или забавяне при
            обработката на заявления.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Приложимо право</h2>
          <p>
            Настоящите Общи условия се уреждат от законодателството на Република България. Всеки
            спор, който не може да бъде разрешен по взаимно съгласие, подлежи на разглеждане от
            компетентния български съд.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Контакт</h2>
          <p>За въпроси относно тези условия, свържете се с нас на: info@creditapp.bg · +359 000 000 000.</p>
        </section>
      </div>
    </div>
  )
}
