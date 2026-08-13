# react-skeleton

A production-ready React starter template with strict TypeScript, Tailwind CSS, React Router, Zustand, React Query, and a full testing setup.

## Stack

| Tool                  | Version | Purpose                               |
| --------------------- | ------- | ------------------------------------- |
| React                 | 19      | UI library                            |
| TypeScript            | 6       | Type safety                           |
| Vite                  | 8       | Dev server & bundler                  |
| Tailwind CSS          | 4       | Styling                               |
| React Router          | 7       | Client-side routing                   |
| Zustand               | 5       | Global state management               |
| TanStack Query        | 5       | Server state & data fetching          |
| Vitest                | 4       | Unit & integration tests              |
| React Testing Library | latest  | Component testing                     |
| Playwright            | latest  | E2e tests (Chromium, Firefox, WebKit) |
| ESLint                | 10      | Linting (type-aware, strict)          |
| Prettier              | 3       | Code formatting                       |

## Starting a New Project

1. Copy the skeleton folder (excluding build artifacts):

```powershell
Copy-Item -Recurse -Exclude 'node_modules', 'dist', '.git' react-skeleton my-new-project
cd my-new-project
pnpm install
```

2. Update the project name in `package.json`:

```json
{
  "name": "my-new-project"
}
```

3. Update the page title in `index.html`:

```html
<title>my-new-project</title>
```

4. Clear the placeholder pages — `src/pages/HomePage.tsx` and `src/pages/NotFoundPage.tsx` are yours to replace.

5. Verify everything works:

```powershell
pnpm test:run && pnpm build && pnpm lint
```

## Commands

```bash
pnpm dev            # Start dev server
pnpm build          # Type-check + production build
pnpm lint           # Run ESLint
pnpm preview        # Preview production build locally
pnpm test           # Vitest in watch mode
pnpm test:run       # Vitest single run
pnpm test:coverage  # Vitest with coverage report
pnpm test:e2e       # Playwright e2e across all browsers
```

## Project Structure

```
src/
├── assets/        # Static files (images, fonts, icons)
├── components/    # Shared, reusable UI components
├── hooks/         # Custom React hooks
├── layouts/       # Page wrapper layouts (RootLayout, etc.)
├── lib/           # Third-party client configuration
├── pages/         # Route-level page components
├── router/        # React Router configuration
├── store/         # Zustand stores
├── test/          # Vitest setup and shared test utilities
├── types/         # Shared TypeScript types and interfaces
├── index.css      # Global styles (Tailwind entry point)
└── main.tsx       # Application entry point
e2e/               # Playwright e2e specs
.claude/           # Claude Code configuration and slash commands
```

## Path Alias

`@/` maps to `src/`. Use it everywhere instead of relative imports:

```ts
import { Button } from '@/components/Button'
import { useAuthStore } from '@/store/useAuthStore'
```

## Testing

Unit and integration tests live under `src/test/`, mirroring the `src/` structure.
E2e specs live under `e2e/`, one file per page or flow.

All three must pass before any task is considered done:

```bash
pnpm test:run && pnpm build && pnpm lint
```
