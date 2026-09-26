# CreditApp client: UI/UX/design review

- **Date:** 2026-09-26
- **Scope:** `client/` working tree on `master`, running at http://localhost:5173 (Vite dev server) against the dev API.
- **Method:** read-only. I read the source listed in the brief and drove the running app with chrome-devtools at 320 / 375 / 768 / 1280 px, using accessibility snapshots, screenshots, DOM/contrast scripts, Lighthouse, and performance traces. The design yardstick was the `frontend-design` skill's SKILL.md, read from disk because the plugin isn't enabled in this session.

**Coverage limits:**

- **Approver views are code-only.** I verified the Viewer role in the browser. The tool permission layer blocked switching to the Approver session. So the Approver-only UI (Approve/Reject panel, delete dialog, `/admin/interest-rate`) was reviewed from code only and is marked "code-only" below.
- **Expired session is code-only.** It couldn't be simulated in the browser either.
- **Test data left behind.** One test application was submitted: "Тест Тестов-Преглед", EGN 7501010010, `ui-review-test@example.com`. It is still **Pending** in the dev DB.
- **Performance numbers come from the dev server.** They were taken on the unbundled Vite dev server and must be re-measured on a production build (`pnpm build && pnpm preview`).

---

## Context (Step 1)

**Routes** (`src/router/index.tsx`):

| Tier | Route | Page |
|---|---|---|
| Public (RootLayout) | `/` | HomePage |
| | `/calculator` | CalculatorPage |
| | `/apply` | ApplyPage |
| | `/privacy`, `/terms`, `/faq` | PrivacyPolicyPage, TermsOfUsePage, FaqPage |
| Public (no layout) | `/login` | LoginPage |
| Any staff (StaffLayout) | `/admin`, `/admin/applications/:id` | AdminQueuePage, AdminApplicationDetailPage |
| Approver only | `/admin/interest-rate` | AdminInterestRatePage |
| Catch-all (no layout) | `*` | NotFoundPage |
| Dev-only | `/styleguide` | **Does not exist.** It isn't registered in the router and there is no `StyleguidePage.tsx`. |

**Theme tokens vs legacy scales.** `client/CLAUDE.md` describes several things that are not in this working tree:

- a shadcn/ui setup: `components.json`, `src/components/ui/`, `src/components/styleguide/`
- three `data-theme` themes and `success`/`warning` tokens
- Inter via `@fontsource-variable/inter`
- a `/styleguide` route

None of these exist:

- `package.json` has no shadcn, Base UI, or Fontsource dependency.
- `index.css` contains only `@import 'tailwindcss'` plus raw scales: `primary-*`, `accent-*`, `cream`, `terracotta-*`, `pine-*`, `sunny-*`.
- `index.html` sets no `data-theme` on `<html>`.

As a result, **no page uses shadcn theme tokens. Every page uses the `cream`/`terracotta`/`pine`/`sunny` scales plus raw Tailwind `stone-*`**, with 162 occurrences in pages/components/layouts. The `primary-*`/`accent-*` scales are defined (`index.css:4-26`) but never used.

The comment at `index.css:28-30` says the warm palette is "scoped to the pages that opt into it until the direction is approved". In practice every public and staff page uses it.

---

## 1. Summary

The app works, is Bulgarian throughout, and doesn't break horizontally at any tested width. The form plumbing is also above average: labels are associated, `aria-invalid`/`aria-describedby` are wired up, inputs are 16px on mobile, and autocomplete attributes are correct.

For a consumer-credit product, though, it loses trust exactly where it matters most:

- The calculator never shows the interest rate or an APR (ГПР).
- There is no privacy notice where the EGN and the ID-card photo are collected.
- Placeholder contact details and "legal review pending" pages are live.

The biggest functional UX problems are:

- Scroll position isn't reset between routes, so users land mid-form and the success message is off-screen.
- Validation doesn't move focus or clear stale errors.
- The primary terracotta CTA fails WCAG AA contrast.
- Irreversible staff decisions (Approve/Reject) have no confirmation (code-only).

`client/CLAUDE.md` describes a shadcn/token design system that doesn't exist in the code, so the "use theme tokens" rules currently can't be followed.

**AI-generic rating: 2 / 5.** The home page works hard to look hand-made: organic blob radii, per-card rotations, staggered offsets. But it lands on the patterns the frontend-design guidance names as tells:

- a warm cream (`#fbf3e7`) + terracotta (`#e2593a`) palette, almost exactly the "cream + terracotta" default
- a pill eyebrow above the headline
- one highlighted phrase in the headline ("лесно и бързо" on a yellow marker)
- icon-in-blob card grids with ghost "01–04" numbers
- a generic "Защо да избереш нас" trio (Бърз процес / Прозрачни условия / Сигурност на данните)
- infinite floating decorations
- `rounded-3xl` + `shadow-lg` on nearly every surface

Nothing on the home page is specific to a Bulgarian loan product: no rate, no amounts, no EGN/лична карта requirements, no "a person reviews your application". The staff panel is calmer and more purposeful.

---

## 2. Top 10 issues (by user impact)

1. **The calculator hides the price of the loan.** It shows the monthly payment, total and interest, but never the annual rate, any APR (ГПР), or an "ориентировъчно" disclaimer (`LoanCalculator.tsx:117-161`). **Critical** (trust; verify legal requirements with the client/lawyer).
2. **No privacy/data-use notice or consent at the point of collecting EGN and the ID-card image.** The legal pages are templates with "Последна актуализация: предстои да се уточни…", and the footer shows `+359 000 000 000` (`ApplyPage.tsx:388-741`, `Footer.tsx:18`, `PrivacyPolicyPage.tsx:20`). **Critical before launch** (verify with lawyer).
3. **Scroll isn't reset on navigation.** "Кандидатствайте с тези условия" opens `/apply` at scrollY ≈ 534: the title and first fields are off-screen at 375px. After a successful submit the confirmation heading sits above the viewport (scrollY 430) and focus is on `<body>`. `RootLayout.tsx` has no `<ScrollRestoration />`. **High.**
4. **Apply-form validation is hard to recover from.**
   - A failed submit leaves focus on the button, with no scroll or error summary. On mobile the first five errors are off-screen.
   - Errors aren't announced.
   - Fixed fields keep their old error, e.g. "Името е задължително." under a filled name.
   - The messages are vague: "Невалидно ЕГН.", "Невалиден телефонен номер.".
   - The amount error says "…между 1 и 1000000 **лв.**" in an EUR product (`ApplyPage.tsx:158`, `:287-306`).

   **High.**
5. **The primary CTA fails contrast.** White on `terracotta-500` is **3.67:1** at 14–16px bold, on every public CTA: home, calculator, apply, login. Lighthouse flags it too. The "МЕСЕЧНА ВНОСКА" label is 3.31:1 and "ОБЩА ЛИХВА" is 3.94:1. **High.**
6. **Approve/Reject are final but fire on a single click, with no confirmation** (code-only, `AdminApplicationDetailPage.tsx:278-303`). Delete has a dialog, but the permanent decision doesn't. **High.**
7. **`/apply` is only reachable through the calculator button.** The header nav has only "Калкулатор", there's no "Кандидатствай" link anywhere, and the home page ends without a CTA (`Header.tsx:27-61`, `HomePage.tsx:290-341`). **Medium-High.**
8. **The design system doesn't exist, even though CLAUDE.md says it does.** There are no tokens, 162 raw `stone-*` uses, and no `/styleguide`. Every page hand-rolls its own buttons, inputs, cards and status blocks: `inputClassName` is duplicated in 4 files, and CTA classes are copy-pasted in 6 places. **Medium** (blocks consistent fixes).
9. **The custom delete dialog lacks dialog behaviour** (code-only). It has no focus trap, no initial focus, no Escape key, and doesn't return focus to the trigger (`DeleteApplicationDialog.tsx:27-76`). The FAQ also leaves collapsed answers focusable: keyboard focus lands on the invisible "Политиката за поверителност" link (`FaqPage.tsx:88-97`). **Medium.**
10. **Staff-queue friction:**
    - The filter/page reset to "Всички"/1 after returning from a detail page (verified), because state isn't in the URL.
    - There's no search by name/EGN.
    - A Viewer isn't told they're read-only: the decision panel simply vanishes.
    - A Viewer opening `/admin/interest-rate` is silently redirected.

    **Medium.**

---

## 3. Findings by category

### 3.1 Bad practices in UI code

**3.1.1 No semantic theme tokens; raw palette everywhere.** Severity: Medium
- **Location:** `src/index.css:3-68`; all pages/components.
- **Evidence:**
  - 162 raw `text|bg|border|ring-stone-*` classes.
  - Status colours are hard-coded as palette classes: `applicationStatus.ts:25-34` uses `bg-sunny-100 text-sunny-800` and similar.
  - Error text is `text-terracotta-600` in 12+ places.
- **Why it matters:** CLAUDE.md requires `bg-primary`, `text-muted-foreground` and `success`/`warning`/`destructive`. Without tokens, re-branding (the product still has no brand) means touching every file, and contrast fixes can't be made in one place.
- **Fix:** First decide whether the shadcn migration described in CLAUDE.md is going to land (it may live on another branch; I didn't check git). Then add semantic tokens: `--background`, `--foreground`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--destructive`, `--success`, `--warning`, `--border`, `--input`, `--ring`, and migrate page by page. Delete the unused `primary-*`/`accent-*` scales.

**3.1.2 CLAUDE.md describes code that isn't there.** Severity: Medium
- **Location:** `client/CLAUDE.md` sections "Stack", "UI/Design Standards", "shadcn/ui", "Tailwind Notes".
- **Evidence:**
  - No `components.json`, `src/components/ui/`, `styleguide/`, Inter, or `data-theme`.
  - The shadcn MCP reports no registries configured.
- **Why it matters:** Any future Claude/dev task following CLAUDE.md will import non-existent components or tokens.
- **Fix:** Either land the migration or update CLAUDE.md to describe the current reality. Don't leave them diverged.

**3.1.3 Duplicated hand-rolled primitives.** Severity: Medium
- **Evidence:**
  - `inputClassName` is copied in `LoanCalculator.tsx:17`, `ApplyPage.tsx:180`, `LoginPage.tsx:50` and `AdminInterestRatePage.tsx:23`, with drift: `rounded-xl` vs `rounded-lg`.
  - The terracotta 3D CTA (`shadow-[0_4px_0_0_var(--color-terracotta-700)]`) is copied in `HomePage.tsx:175`, `LoanCalculator.tsx:170`, `ApplyPage.tsx:721` and `LoginPage.tsx:203`, plus pine variants in `ApplyPage.tsx:378` and `NotFoundPage.tsx:37`.
  - The loading/error "status card" block is re-implemented in 4 pages.
  - The error-alert block is duplicated (`ApplyPage.tsx:704-713`, `LoginPage.tsx:185-196`).
- **Fix:** Extract `Button`, `Input` (+ `FieldError`), `Card`, `Alert` and `StatusCard` components. Use shadcn equivalents if the migration lands.

**3.1.4 Arbitrary values and an inline style.** Severity: Low
- **Evidence:**
  - 11 arbitrary `rounded-[60%_40%…]` blob radii (HomePage, ApplyPage, LoginPage, CalculatorPage).
  - Arbitrary `top-[8%]`, `rotate-[-3deg]` and similar in `HomePage.tsx:133-209`.
  - Arbitrary `shadow-[…]` in 6 places.
  - An inline `style={{ gridTemplateRows }}` in `FaqPage.tsx:90`.
- **Fix:** Most of these disappear with the home redesign (§3.3). For the FAQ, use `grid-rows-[0fr]`/`grid-rows-[1fr]` classes, or a shadcn Accordion.

**3.1.5 Invalid description-list markup.** Severity: Low
- **Location:** `AdminApplicationDetailPage.tsx:155-186`.
- **Evidence:** `<dt>`/`<dd>` sit inside a `<div>`, with no `<dl>` on the page (verified: `document.querySelectorAll('dl').length === 0` on a Pending application).
- **Fix:** Change the wrapper `div` to `dl`, matching the "Решение" block at `:222`.

**3.1.6 Template leftovers.** Severity: Low
- **Evidence:**
  - `public/favicon.svg` is the default Vite logo (purple `#863bff`).
  - `src/assets/hero.png`, `react.svg` and `vite.svg` are unused.
  - `index.html` has no meta description (Lighthouse SEO 82).
- **Fix:** Replace the favicon with a neutral placeholder mark, delete the unused assets, and add `<meta name="description">`.

### 3.2 Broken or inconvenient styles

**3.2.1 Scroll position carried across routes.** Severity: High
- **Location:** `layouts/RootLayout.tsx:5-15`; `ApplyPage.tsx:338-386`.
- **Evidence (375px):**
  - After "Кандидатствайте с тези условия", `/apply` opens at `scrollY = 534`.
  - After a successful submit, `scrollY = 430`, the h1 top is at −59px, and `document.activeElement` is `BODY`. The user sees the bottom half of the card and the "Обратно към началната страница" button, not "Кандидатурата е изпратена успешно!".
- **Fix:** Add `<ScrollRestoration />` to `RootLayout` (and `StaffLayout`). On the success state, `scrollTo(0,0)` and move focus to the h1 (`tabIndex={-1}`).

**3.2.2 The "Защо да избереш нас" grid breaks at ≥1024px.** Severity: Medium
- **Location:** `HomePage.tsx:311-327`.
- **Evidence (1280px screenshot):**
  - Cards 1 (`sm:col-span-4`) and 2 (`sm:col-span-2`) fill the row.
  - Card 3 (`lg:col-span-2`) wraps alone to the left of row 2, leaving two-thirds of the row empty.
  - The rotated cards 1 and 3 almost touch.
- **Fix:** Remove the section or rebuild it (§3.3). If kept, use an equal 3-column layout at `lg`.

**3.2.3 Content invisible until scrolled into view.** Severity: Medium
- **Location:** `HomePage.tsx:244-339` (`whileInView` with `hidden: {opacity: 0}`).
- **Evidence:** A full-page capture at 375px showed "Как работи" and "Защо…" as blank cream/green blocks until each section was scrolled past. Anything that doesn't trigger IntersectionObserver sees nothing: print, some crawlers, screenshot/preview tools, browser reader modes.
- **Fix:** Render content visible by default and animate only a transform. Better still, drop the per-section reveal (§3.3).

**3.2.4 Footer cramped at 768px.** Severity: Low
- **Location:** `Footer.tsx:10-55`.
- **Evidence (768px screenshot):**
  - The phone number wraps as "+359 000 000 / 000".
  - "Общи / условия" and "Политика за / поверителност" wrap mid-phrase.
  - "ЧЗВ" is pushed to the far edge.
- **Fix:** Keep the stacked layout until `md`/`lg`, or put the legal links on their own row. Add `whitespace-nowrap` to the phone number.

**3.2.5 Duplicated calculator heading.** Severity: Low
- **Location:** `CalculatorPage.tsx:35-40` + `LoanCalculator.tsx:60-61`.
- **Evidence:** h1 "Кредитен калкулатор" + subtitle, immediately followed by an h2 "Кредитен калкулатор" + a second subtitle saying the same thing.
- **Fix:** Drop the card's h2/subtitle when it's rendered on the calculator page (for example, a `showHeading` prop).

**3.2.6 Focus styles inconsistent.** Severity: Low
- **Evidence:**
  - CTAs use `focus:outline-none focus:ring-4` (so the ring also appears on mouse click).
  - The FAQ uses `focus-visible:ring-4`.
  - Header/footer links, filter pills, pagination and staff buttons rely on the browser default outline. On `pine-950` that outline is barely visible (unverified visually).
- **Fix:** Use one `focus-visible` ring token applied to every interactive element.

**3.2.7 The staff queue is a card list, not a table.** Severity: Low
- **Location:** `AdminQueuePage.tsx:129-148`.
- **Evidence (1280px):** Name, amount/term and status float in `w-1/4`/`w-2/5` columns with no headers. Amounts aren't right-aligned or tabular.
- **Fix:** Use a real `<table>` with headers at `md+` and keep cards on mobile, or keep the cards but right-align amounts with `tabular-nums`.

### 3.3 Generic "AI-made" design

All evidence here is from the 1280px and 375px screenshots of `/` plus `HomePage.tsx`. Severity: Medium overall. This is about trust and differentiation, not breakage.

| Pattern | Where | Deliberate, product-specific alternative |
|---|---|---|
| Cream + terracotta palette (the named #1 "generated" look) | `index.css:31-44`, all public pages | Pick a palette that means something for a lender, e.g. a sober ink/ivory base with one confident accent reserved for money figures. Decide once the client provides branding. |
| Pill eyebrow above the H1 ("Прозрачни условия, без изненади"), repeated as a pill on FAQ/Privacy/Terms | `HomePage.tsx:147-150`, `FaqPage.tsx:107`, `PrivacyPolicyPage.tsx:71`, `TermsOfUsePage.tsx:50` | Drop the eyebrows; the H1 carries the page. |
| One phrase highlighted with a marker ("лесно и бързо") | `HomePage.tsx:153-161` | Plain headline stating the offer: amount range, term range, "решение от служител, по имейл". |
| Vague slogan "Кредит, изчислен лесно и бързо" + "без ангажимент" | `HomePage.tsx:153-165` | Concrete copy: "Изчислете вноската си и кандидатствайте с лична карта. Решението се взема от служител и получавате отговор по имейл." |
| Hero with abstract blobs, a hand-coins icon tile and infinite floating/rotating decorations | `HomePage.tsx:105-118, 187-226` | Put the **live calculator in the hero**. It is the product's most characteristic object, and the home page currently makes users click away to see it. |
| Icon-in-blob 4-card "Как работи" with ghost "01–04" numerals and random rotations | `HomePage.tsx:254-285` | A real sequence, so numbering is justified. Render it as a simple ordered list/timeline with the facts that matter at each step: what you need (ЕГН, снимка на лична карта), who decides, how you're notified, that only one pending application per EGN is allowed. |
| "Защо да избереш нас" with 3 generic benefits (Бърз процес / Прозрачни условия / Сигурност на данните) | `HomePage.tsx:290-341` | Replace with verifiable specifics: current rate, max amount/term, "ЕГН се съхранява криптирано", "без регистрация". Or cut the section. |
| `rounded-3xl` + `shadow-lg` on every surface; cards on cards (white card inside cream/gradient panels, gradient cards inside the calculator card) | 16× `rounded-3xl`, 19× `rounded-2xl` | Use one radius scale by hierarchy. Flatten the calculator results into a plain definition list. |
| Gradient washes + blurred blobs behind every public page (home, calculator, apply, success, 404, login) | e.g. `CalculatorPage.tsx:20-27`, `ApplyPage.tsx:390-397`, `LoginPage.tsx:105-116` | Plain background; use colour only to encode meaning (money, status, errors). |
| Gradient "Месечна вноска" card | `LoanCalculator.tsx:118` | Big number on a plain surface, with the rate and total next to it. |
| Hover wiggle/rotate/scale on cards and icons, 3D "pressed" CTA shadow | `HomePage.tsx:169-171, 265, 275`, CTAs | Keep motion only for responses to actions, like the count-up of results. The frontend-design guidance calls per-card hover wiggles a generic tell. |
| Admin header "КредитApp · Административен панел" (middle-dot meta string) | `StaffHeader.tsx:24` | "КредитApp — служители", plus the signed-in user's name and role. |

What's missing entirely: anything that says *who* lends. There is no company name, no ЕИК, no BNB status, no address, and nothing about Bulgaria/EUR beyond the currency symbol.

### 3.4 Typography

**3.4.1 No deliberate typeface; system UI stack.** Severity: Medium
- **Evidence:**
  - Computed `font-family` on `/` is `ui-sans-serif, system-ui, …` for all 35 text nodes, and `document.fonts` is empty.
  - Headlines therefore render in Segoe UI Black on Windows, SF on Apple and Roboto on Android. The brand looks different on every platform.
  - `font-extrabold`/`font-black` (800/900) depend on the OS having those weights.
- **Fix:** Self-host one Cyrillic-complete variable family (e.g. the Inter that CLAUDE.md already names, or a more characterful Cyrillic face) with `font-display: swap`, and limit weights to 400/500/600/700.

**3.4.2 Too many sizes and weights.** Severity: Low
- **Evidence:**
  - The home page alone renders 8 distinct sizes (12/14/16/18/20/36/48/60px) and 6 weights (400–900).
  - Across the code there are 10 size utilities (`text-xs`…`text-6xl`) and 5 weight utilities, including one `font-black`, used only for the ghost numerals.
- **Fix:** Define a 5–6 step scale (e.g. 14/16/20/28/40) and 3 weights.

**3.4.3 All-caps Cyrillic labels.** Severity: Low
- **Location:** `LoanCalculator.tsx:123,138,152` ("МЕСЕЧНА ВНОСКА", "ОБЩА СУМА ЗА ВРЪЩАНЕ"); `Footer.tsx:31` ("ПРАВНА ИНФОРМАЦИЯ"); `AdminApplicationDetailPage.tsx:157-240`; `AdminInterestRatePage.tsx:106-113`.
- **Why it matters:** Uppercase Cyrillic at 12px is noticeably harder to read. Some screen readers spell short all-caps words letter by letter (ЕГН is fine as an acronym, but "СРОК" isn't).
- **Fix:** Use sentence-case labels at 14px `text-muted-foreground`.

**3.4.4 No tabular numerals; inconsistent grouping.** Severity: Low
- **Evidence:**
  - `grep tabular` → 0.
  - The calculator shows "11 531,86 €" next to "1531,86 €", and the queue shows "5000,00 €". bg-BG's `Intl` only groups numbers of 5+ digits, so amounts in the same list look misaligned.
  - The amount input shows "10000" with no grouping or unit.
- **Fix:** Add `tabular-nums` to all money/number cells. Consider `useGrouping: 'always'` in `formatCurrency.ts` (verify browser support). Show "€" as an input suffix.

**3.4.5 Line length.** Severity: OK. Body copy is capped (`max-w-md`, `max-w-2xl`, `max-w-3xl`), and privacy/terms paragraphs at 1280px sit within about 75 characters. Leading is `leading-relaxed` on long text, which suits Cyrillic. No change needed.

### 3.5 Accessibility

**3.5.1 Contrast failures** (measured with the canvas-resolved palette; WCAG 2.x). Severity: High for CTAs, Medium for the rest.

| Pair | Ratio | Where |
|---|---|---|
| white on `terracotta-500` (14–16px bold) | **3.67** | Every primary CTA; Lighthouse `color-contrast` fails on `/apply` |
| `terracotta-50` on `terracotta-500` (12px) | **3.31** | "МЕСЕЧНА ВНОСКА" label |
| `sunny-700` on `sunny-50` (12px) | **3.94** | "ОБЩА ЛИХВА" label |
| `stone-500` on `cream` | **4.35** | "Последна актуализация…" on privacy/terms; subtitles on cream |
| `stone-400` on white (icon) | **2.59** | Remove-file "×" (non-text 3:1 fails) |
| `stone-200` input border on white | **1.26** | All inputs (non-text 3:1 fails; the boundary is carried only by a faint shadow) |
| `sunny-600` icon on `sunny-50` | 2.63 | Upload icon (decorative, lower priority) |

Passing pairs, for reference: the status badges are 5.6–9.2, `pine-700` on `pine-50` is 8.5, and the footer links are 10.5.

- **Fix:** Use `terracotta-700`/`-800` for button backgrounds (or dark text on a lighter fill), darken the label colours, use `stone-600` on cream, and use a `stone-400`-or-darker input border.

**3.5.2 Form errors not announced; focus not managed.** Severity: High
- **Location:** `ApplyPage.tsx:301-306`; `LoginPage.tsx:77-82`.
- **Evidence:** After an invalid submit, `activeElement` is the submit button, the `[role=alert]` count is 0, and six errors are rendered off-screen (375px).
- **Fix:** On failed validation, focus the first invalid field, and render an error summary with `role="alert"` above the button listing the problems.

**3.5.3 Calculator results aren't a live region.** Severity: Medium
- **Location:** `LoanCalculator.tsx:117`.
- **Evidence:** `aria-live`/`role=status` count on `/calculator` is 0. Screen-reader users get no feedback when changing amount/term.
- **Fix:** Wrap the monthly-payment summary in `aria-live="polite"`. Debounce so the count-up animation doesn't spam announcements.

**3.5.4 FAQ collapsed content stays in the tab order and the accessibility tree.** Severity: Medium
- **Location:** `FaqPage.tsx:88-97`.
- **Evidence:** With every item collapsed, `link.focus()` on "Политиката за поверителност" succeeds. Keyboard focus lands on an invisible link inside a 0-height row.
- **Fix:** Add `inert`/`hidden` to the collapsed panel (toggle after the transition), or use a shadcn/Base UI Accordion.

**3.5.5 The delete dialog isn't a real modal** (code-only). Severity: Medium
- **Location:** `DeleteApplicationDialog.tsx:27-76`.
- **Evidence:** `role="dialog" aria-modal` is set, but there is no initial focus, no focus trap, no Escape handler, no backdrop close, and no focus return. It also isn't portalled, so it's rendered inside the page flow.
- **Fix:** Use a shadcn/Base UI `AlertDialog`, or add focus trap + Escape + initial focus on "Отказ".

**3.5.6 Touch targets under 44px.** Severity: Medium
- **Evidence (375px):**
  - Remove-file "×" is **16×16** (`ApplyPage.tsx:660-667`).
  - Footer links are about 20px tall.
  - The header "Калкулатор" is 34px tall.
  - Filter pills are about 32px (`py-1.5`).
  - Pagination is about 36px.
  - Staff header buttons are 32px.
- **Fix:** Use a minimum 44×44 hit area (padding or `min-h-11`), especially for the remove-file button.

**3.5.7 Landmarks, titles, skip link.** Severity: Low
- **Evidence:**
  - Every route has the same `<title>КредитApp</title>`, so screen-reader users and tabs can't tell pages apart.
  - Two unlabelled `<nav>`s on public pages.
  - No skip link.
  - `/login` and the 404 page have no `<main>` landmark (the snapshot shows no main).
- **Fix:** Set a per-route `document.title` (e.g. "Кандидатстване — КредитApp"), `aria-label` the navs ("Основна навигация" / "Долна навигация"), and add `<main>` to Login/404.

**3.5.8 File input keyboard focus is invisible.** Severity: Low
- **Location:** `ApplyPage.tsx:684-692`.
- **Evidence:** The real `<input type=file>` is `sr-only`. Tabbing focuses it, but no focus ring is shown on the visible label, and the "изберете" label disappears once a file is chosen.
- **Fix:** Style the dropzone with `:focus-within`, and keep a "Смени файла" action visible after selection.

**3.5.9 Reduced motion.** OK. Every `framer-motion` use checks `useReducedMotion()`, and the FAQ uses `motion-reduce:transition-none`. Keep this when refactoring.

### 3.6 Form UX (application form and calculator)

**3.6.1 Stale and vague validation messages.** Severity: High
- **Evidence (verified at 375px):**
  - After filling First name/Last name/Email, "Името е задължително.", "Фамилията е задължителна." and "Имейлът е задължителен." stay under the filled fields until the next submit. Errors are only recomputed on submit (`ApplyPage.tsx:301-302`), except for the file.
  - "Невалидно ЕГН." and "Невалиден телефонен номер." don't say what's expected.
  - "Желаната сума трябва да е между 1 и 1000000 лв." uses the wrong currency and an unformatted number (`ApplyPage.tsx:158`).
  - The calculator's "Моля, въведете валидна сума" doesn't give the range.
- **Fix:**
  - Re-validate a field on change once it has an error (or on blur).
  - Write specific messages: "ЕГН трябва да съдържа 10 цифри.", "Въведете телефон във формат 08XXXXXXXX или +359…".
  - Use `formatCurrency(MAX_LOAN_AMOUNT)` → "1 000 000,00 €".
  - Show the allowed range as helper text under the amount/term inputs.

**3.6.2 No required-field marking or helper text.** Severity: Medium
- **Evidence:** All inputs have `required=false` and no `aria-required`. No field says it's mandatory until you fail. There's no hint for ЕГН (10 digits) or phone format.
- **Fix:** Add a single line "Всички полета са задължителни." at the top, `aria-required="true"` on each input, and short helper text under ЕГН/Телефон.

**3.6.3 Input attributes.** Severity: Low
- **Good:** `given-name`, `family-name`, `tel`, `email`, `username`, `current-password`, `inputMode="numeric"` on ЕГН, 16px font on mobile (no iOS zoom).
- **Gaps:**
  - The amount uses `inputMode="decimal"` although it's whole euros.
  - `type="number"` allows `e`, `-`, and wheel-scroll changes on desktop.
  - The phone field has no `inputMode="tel"` hint text.
  - The ЕГН has `maxLength={10}` but accepts letters.
- **Fix:** Use `type="text" inputMode="numeric" pattern="[0-9]*"` for amount/term/ЕГН, and strip non-digits on input.

**3.6.4 File upload.** Severity: Medium
- **Good:**
  - Type and size are stated up front ("JPG или PNG, до 10 MB").
  - There's a client-side check and a preview image with alt text.
  - The drag state is styled.
- **Gaps:**
  - The copy says "изберете от **компютъра**", but most applicants will be on a phone. There's no hint that taking a photo works.
  - There is no file-size display and no upload progress. For a 10 MB photo on mobile data, the only feedback is the button's "Изпращане...".
  - The remove button is 16px.
  - After removing a file, re-selecting the *same* file won't fire `onChange`, because the input value isn't reset (code-only, `ApplyPage.tsx:283-285`).
- **Fix:**
  - Copy: "Снимайте или изберете файл".
  - Show "име · 2,4 MB".
  - Reset `input.value` on remove.
  - Consider upload progress via XHR if large photos are common.
  - Add guidance on a good photo (whole card, no glare, front side).

**3.6.5 Double-submit protection.** OK. The button is disabled with a spinner and "Изпращане..." (`ApplyPage.tsx:716-737`).

**3.6.6 Success state lacks substance.** Severity: Medium
- **Location:** `ApplyPage.tsx:338-386`.
- **Evidence:** The heading plus one paragraph. The server returns an `id`, but no reference number is shown. There's no summary of the amount/term submitted, no expected timeline, no "check your spam folder", and no mention that a second application can't be filed until this one is decided.
- **Fix:** Show a short reference (e.g. the first 8 characters of the id), the amount/term, the email it was sent to, the next steps, and the "една чакаща кандидатура" rule.

**3.6.7 Calculator shows "0,00 €" for invalid input.** Severity: Low
- **Location:** `LoanCalculator.tsx:44-46`.
- **Evidence:** An amount of 2000000 made all three results "0,00 €", and "Кандидатствайте с тези условия" became disabled with no explanation next to it.
- **Fix:** Show "—" and keep the last valid result greyed out. Explain the limits next to the disabled button.

**3.6.8 Calculator limits** (verify with client). The calculator and form accept up to 1 000 000 € over 360 months (`loanCalculations.ts:13-14`). If the real product is small consumer loans, these limits invite unrealistic applications.

### 3.7 Trust and clarity for a credit product

These are flagged as **verify with the client/lawyer**, not legal conclusions.

**3.7.1 Price of credit not disclosed.** Severity: Critical (verify)
- **Location:** `LoanCalculator.tsx`, `CalculatorPage.tsx`.
- **Evidence:** The annual interest rate is fetched (`annualRatePercent`) but never rendered. No APR (ГПР), no fees statement, no representative example, and no "резултатът е ориентировъчен". The disclaimer exists only in Terms (`TermsOfUsePage.tsx:31`).
- **Why it matters:** Bulgarian consumer-credit rules (ЗПК) generally expect the interest rate and ГПР, with a representative example, in credit advertising. Showing a monthly payment without the rate also undercuts the site's own "Прозрачни условия" claim.
- **Fix:** Show "Годишен лихвен процент: X%" (and ГПР if applicable) in the calculator, plus an "ориентировъчно" note and a link to terms. Confirm the exact wording and whether ГПР is required with a lawyer.

**3.7.2 No privacy notice or consent at collection.** Severity: Critical (verify)
- **Location:** `ApplyPage.tsx:388-741`.
- **Evidence:** The form collects ЕГН and an ID-card photo, with no text near those fields or the submit button about why the data is collected, who the controller is, how long it's kept, or a link to the privacy policy. There's no checkbox or statement like "С изпращането потвърждавам, че съм запознат с Политиката за поверителност".
- **Why it matters:** GDPR Art. 13 expects this information at the point of collection. Asking for a national ID number and an ID photo with no explanation is also a trust stopper.
- **Fix:** Add a short notice under the upload/submit (purpose, retention, link to `/privacy`). Have the lawyer decide between a consent checkbox and an information notice.

**3.7.3 Placeholder identity and legal content is live.** Severity: High (verify)
- **Evidence:**
  - Footer "info@creditapp.bg · +359 000 000 000" (`Footer.tsx:18`).
  - Privacy/Terms say "примерен шаблон… предстои да бъде прегледан от юрист" and "Последна актуализация: предстои да се уточни" (`PrivacyPolicyPage.tsx:20,79,84-88`).
  - No company name, ЕИК, registered address, data controller, or BNB register status anywhere.
- **Fix:** Before launch, add a company-identity block (footer + privacy page) and remove the template disclaimers once the legal text is final. Until then, gate production deployment on this.

**3.7.4 Unsupported marketing claims.** Severity: Medium
- **Evidence:** "Прозрачни условия, без изненади", "Виждаш точните параметри на кредита" and "Кандидатстването отнема само няколко минути" appear, while the rate isn't shown and the FAQ says there is no fixed review time.
- **Fix:** Replace them with verifiable statements (§3.3), or back them up by showing the rate.

**3.7.5 No dark patterns observed.** There are no pre-ticked boxes, fake urgency, or hidden costs in the UI. Keep it that way.

### 3.8 States

| State | Where | Status |
|---|---|---|
| Loading | Calculator rate, queue, detail, document, rate page | Handled, in Bulgarian, consistent spinner + text. OK. |
| Error | Same, via `query.error.message` | Handled, in Bulgarian, but **no retry button** anywhere (`CalculatorPage.tsx:51-58`, `AdminQueuePage.tsx:100-107`). Severity: Low. Add "Опитай отново" calling `refetch()`. |
| Network failure | `apiClient.ts:8,109-113` | Bulgarian "Възникна грешка при връзката със сървъра…". OK. Not exercised in the browser. |
| Empty | Queue: "Няма кандидатури, отговарящи на филтъра." | OK, but add a "Покажи всички" action when a filter is active. Low. |
| 404 | `NotFoundPage.tsx` | Exists, but it's outside `RootLayout` (no header/footer) and only offers "Обратно към началната страница". Same for unknown `/admin/*` URLs, which drop staff into the public-styled 404. Low. |
| Expired session (code-only) | `apiClient.ts:188-191` → store logout → `ProtectedRoute` → `/login` | The redirect happens with **no "Сесията Ви изтече" message**. `LoginPage.tsx:99-100` ignores `state.from` and always goes to `/admin`, and a note typed in the decision textarea is lost. Severity: Medium. |
| Forbidden role | `ProtectedRoute.tsx:19-21` | A Viewer on `/admin/interest-rate` is silently redirected to `/admin` (verified). Low. |
| Toasts | none | There is no toast system. After delete (code-only) the user lands on `/admin` with no confirmation, and approve/reject silently swaps the panel. Low–Medium: add a toast or inline "Кандидатурата е одобрена." status. |

### 3.9 Staff panel UX

**3.9.1 Approve/Reject without confirmation** (code-only). Severity: High
- **Location:** `AdminApplicationDetailPage.tsx:278-303`.
- **Evidence:** A single click calls `mutation.mutate`, and the product description says decisions are final. Approve (pine) and Reject (terracotta) sit side by side at equal weight, full-width stacked on mobile, so they are easy to mis-tap.
- **Fix:** Add a confirmation dialog that restates the name, amount and decision ("Одобряване на кандидатурата на … за 5 000,00 € / 36 месеца? Решението е окончателно.").

**3.9.2 Interest-rate change without confirmation** (code-only). Severity: Medium
- **Location:** `AdminInterestRatePage.tsx:121-173`.
- **Evidence:** "Запази" immediately changes the public rate. "Последна промяна" shows only the date plus a middle-dot and the username (`:116`), not the time, although changes are timestamped.
- **Fix:** Confirm with old → new ("7,5% → 8,0%"), show date and time, and label the field "Годишен лихвен процент".

**3.9.3 Role not visible.** Severity: Medium
- **Location:** `StaffHeader.tsx:16-48`; detail page.
- **Evidence:** The header shows no user or role. As a Viewer, a Pending application shows no decision section and no explanation.
- **Fix:** Show "Име · Преглеждащ/Одобряващ" in the header. On Pending applications, Viewers should see "Само служител с роля „Одобряващ“ може да вземе решение."

**3.9.4 Queue state lost; no search/sort.** Severity: Medium
- **Location:** `AdminQueuePage.tsx:39-40`.
- **Evidence:** Filter "Чакащи" → open detail → Back resets to "Всички" (verified). There's no search by name/EGN/email and no sort (e.g. oldest pending first). Pagination is shown even with 1 page.
- **Fix:** Store `status`/`page` in `useSearchParams`, add search and a default "oldest pending first" order (server support permitting), and hide pagination when `totalPages === 1`.

**3.9.5 Detail view conveniences.** Severity: Low
- **Evidence:**
  - Phone and email are plain text (0 `tel:`/`mailto:` links).
  - The ID image can't be opened full-size or zoomed. It's capped at `max-h-96`, while staff need to read small print.
  - "1 месеца" would render for a 1-month term (`AdminQueuePage.tsx:144`, `AdminApplicationDetailPage.tsx:183`).
- **Fix:** Add `tel:`/`mailto:` links, a click-to-enlarge/open-in-new-tab image, and pluralisation (месец/месеца).

**3.9.6 Status badges.** OK. Pending/Approved/Rejected map to sunny/pine/terracotta and pass contrast (5.6/9.2/7.7). Map them to `warning`/`success`/`destructive` once tokens exist.

### 3.10 Content and formatting

**3.10.1 Mixed ти/Вие.** Severity: Medium
- **Evidence:**
  - Home uses **ти**: "Изчисли", "Въведи сума…", "Провери условията си", "Защо да избереш нас", "Данните ти".
  - The apply page H1/intro uses **ти** ("Кандидатствай за кредит", "Попълни данните си"), while the same page's upload hint and success text use **Вие** ("Качете…", "от вас").
  - The calculator, FAQ, errors and legal pages use **Вие**.
  - The product description says emails are formal.
- **Fix:** Use formal **Вие** everywhere, since it's a credit product. In running text, capitalising "Вие/Ваш" is the formal-letter convention; pick one approach and apply it consistently.

**3.10.2 Terminology drift.** Severity: Low
- **Evidence:** "кандидатура" (success heading, admin), "заявление" (FAQ, success body, privacy) and "кандидатстване" are used interchangeably. The success message says "Кандидатурата е изпратена… прегледа заявлението ви" in one breath. "Опашка от кандидатури" is a calque of "queue".
- **Fix:** Pick one term ("заявление" reads most naturally for credit) and rename the admin heading to "Заявления".

**3.10.3 Currency and dates.** Severity: Low
- **Good:** `formatCurrency` (EUR, bg-BG) is used for every rendered amount, and dates render as "26.09.2026 г.".
- **Gaps:** the one hardcoded "лв." (`ApplyPage.tsx:158`), unformatted "1000000" in validation messages, and inconsistent 4-digit grouping (§3.4.4).

**3.10.4 English leftovers / typos.** None found in user-visible text. The HTTP `title` fallbacks in `apiClient.ts` are English, but only `detail` is shown.

### 3.11 Consistency

- There is **no `/styleguide`** to compare against (§3.1.2).
- The same pattern is built differently:
  - **Buttons:** three families. `rounded-2xl` 3D-shadow terracotta/pine CTAs on public pages, flat `rounded-lg` pine/terracotta on staff pages, and pill filters.
  - **Inputs:** `rounded-xl` on public pages, `rounded-lg` on staff.
  - **Error text:** always `text-terracotta-600`, but the alert block style differs between the page-level and dialog versions.
  - **Page heroes:** gradient + blob on public pages, flat on FAQ/Privacy/Terms.
- Header nav differs from footer nav (the footer has legal links and FAQ, the header only the calculator), and neither links to `/apply`.
- **Fix:** Settle on shared components (batch 6) before visual polish.

### 3.12 Perceived performance

These are lab numbers on the **Vite dev server**, with 4× CPU and Fast 4G, at 375px mobile. They are inflated by unbundled modules: re-measure on `pnpm build && pnpm preview`.

| Page | LCP | LCP element | CLS |
|---|---|---|---|
| `/` | 4.83 s (99.6 % render delay, TTFB 17 ms) | hero `<p>` (`HomePage.tsx:163`) | 0.00 |
| `/apply` | 4.96 s (render delay) | form content | 0.00 |

- **Fonts:** no web font is loaded, so there's no FOIT/FOUT cost today. That will change when a font is added: preload it and use `font-display: swap`.
- **Images:** none on public pages (the blobs are CSS).
- **LCP render delay** is partly structural. The hero text starts at `opacity: 0` and fades in over 650 ms (`HomePage.tsx:142-145`, `CalculatorPage.tsx:29-33`, `ApplyPage.tsx:399-403`), so LCP can't fire until the animation runs. The whole bundle, including `framer-motion`, must also execute before anything paints (client-rendered SPA).
- **Fix:**
  - Don't animate opacity on above-the-fold text.
  - Consider lazy-loading the admin routes (`React.lazy`) so the public bundle doesn't carry them.
  - Re-check LCP on the production build.
- **Lighthouse on `/apply` (mobile):** Accessibility 95 (fails `color-contrast`), Best Practices 100, SEO 82 (no meta description; `robots.txt` is a dev-server artefact).
- **Infinite animations:** three `repeat: Infinity` idle animations run on the home page (`HomePage.tsx:105-118`). They're respected under reduced motion, but they cost battery and main thread on low-end phones for no informational value.

---

## 4. What's already good (don't break it)

- `<html lang="bg">`. All visible UI text is Bulgarian, including API/network error messages (`apiClient.ts:7-8`).
- Labels are properly associated with inputs. `aria-invalid` + `aria-describedby` are wired on every form field. `role="alert"` is used on page-level errors.
- 16px inputs on mobile (`text-base sm:text-sm`), so there's no iOS zoom. Autocomplete tokens are correct, and `inputMode="numeric"` is set on ЕГН.
- Client-side EGN checksum validation. Client messages mirror the server's.
- Double-submit protection on apply, login, decisions and the rate change, with pending labels ("Изпращане...", "Одобряване...").
- The calculator → apply prefill of amount/term works.
- The ID preview has alt text, object URLs are revoked, and the document hook guards against stale responses.
- `useReducedMotion` is respected in every animated component.
- No horizontal overflow on any public route at 320/375/768/1280 (checked by script on all 8 routes), and CLS is 0.
- Status badge colours are distinct and pass AA. Currency and dates use `bg-BG` formatters.
- Delete requires confirmation. Viewers never see mutation controls. Role gating exists both in the UI and on the route.
- Privacy/Terms content is honest about what the system actually does (no automated scoring, encrypted ЕГН, localStorage token only).

---

## 5. Suggested fix order (batches to hand to Claude one at a time)

**Batch 1: Navigation, focus and page plumbing** (small, high impact)
- Add `<ScrollRestoration />` to `RootLayout` and `StaffLayout`.
- On the apply success state: scroll to top and focus the h1.
- Set a per-route `document.title`, and add a meta description in `index.html`.
- `aria-label` the two navs, and add `<main>` to Login and 404.
- Add "Кандидатствай" to the header nav (desktop + mobile menu) and a final CTA on home.
- Replace the Vite favicon and delete unused template assets.

**Batch 2: Apply-form UX**
- On invalid submit, focus the first invalid field and render a `role="alert"` summary.
- Re-validate a field on change after its first error (clear stale errors).
- Write specific messages and helper text for ЕГН and phone.
- Fix "лв." → `formatCurrency`, and show the allowed amount/term ranges.
- Add "Всички полета са задължителни." + `aria-required`.
- Change the upload copy to mobile-friendly wording, show the file size, make the remove button 44px, and reset the input value on remove.
- On the success screen: reference number, submitted amount/term, next steps, and the one-pending-application rule.

**Batch 3: Calculator clarity**
- Display the annual rate (already fetched) and an "ориентировъчно" note linking to terms.
- Show "—" instead of "0,00 €" for invalid input, and explain the disabled CTA.
- `aria-live` on the result, `tabular-nums`, a "€" suffix on the amount input, sentence-case labels.
- Remove the duplicate h2/subtitle on `/calculator`.

**Batch 4: Contrast and accessibility**
- CTA background ≥ 4.5:1 with white text.
- Fix the "МЕСЕЧНА ВНОСКА"/"ОБЩА ЛИХВА" labels, `stone-500`-on-cream text, the input border colour and the remove icon.
- Make one consistent `focus-visible` ring.
- Make collapsed FAQ panels `inert`.
- Fix the `<dl>` markup on the detail page.
- Make all touch targets ≥ 44px.

**Batch 5: Staff panel safety and flow** (verify Approver views in the browser after this batch)
- A confirmation dialog for Approve/Reject that restates the decision.
- Confirm the rate change (old → new), and show the change time.
- Make the delete dialog a proper modal (focus trap, Escape, initial focus, focus return), or swap it for AlertDialog.
- Put the queue filter/page in URL search params; add search by name/EGN/email if the API allows.
- Show the user and role in the header, add a Viewer explanation on Pending applications, and a message on the forbidden-route redirect.
- Show a "Сесията Ви изтече" message on login after a 401, and honour `state.from`.
- `tel:`/`mailto:` links, enlargeable ID image, месец/месеца pluralisation, retry buttons on error states.

**Batch 6: Design-system decision** (needs your call first)
- Either land the shadcn/token migration that `client/CLAUDE.md` describes, or rewrite CLAUDE.md to match the code.
- Either way: introduce semantic tokens, extract shared `Button`/`Input`/`FieldError`/`Card`/`Alert`/`StatusCard`, replace raw `stone-*` and palette classes page by page, and remove the unused `primary-*`/`accent-*` scales.
- Self-host one Cyrillic-complete font and reduce the type scale to 5–6 sizes and 3 weights.

**Batch 7: Home and visual direction** (needs client input on copy and brand)
- Put the calculator in the hero.
- Replace "Как работи" with a factual timeline (what you need, who decides, how you're notified).
- Replace "Защо да избереш нас" with verifiable facts, or cut it.
- Remove the blobs, gradient washes, infinite motion, marker highlight, ghost numerals, rotated cards and hover wiggles.
- Unify on formal **Вие** and one term ("заявление").
- Don't fade above-the-fold text in from opacity 0.

**Batch 8: Legal and identity content** (client + lawyer; not a code-only task)
- Company name, ЕИК, address and data-controller details in the footer and privacy page.
- BNB registration status.
- Whether ГПР/representative example and a consent checkbox are required, and the privacy notice text at the point of collection.
- Final retention periods; remove the template disclaimers.
- Then implement the texts.
