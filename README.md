# CreditApp

A loan application intake site: a public loan calculator, an application form
where applicants submit personal info and an ID document, and an authenticated
admin panel where staff review and manually approve/reject applications. There
is no automated credit scoring, payment processing, or disbursement — every
decision is made by a human.

---

## Tech stack

- **Server**: ASP.NET Core (.NET 10), PostgreSQL via EF Core/Npgsql, ASP.NET
  Core Identity + JWT auth, Serilog + Seq for logging.
- **Client**: React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand.
- **Deployment**: Docker Compose (separate dev/prod configurations).

---

## Prerequisites

- [Docker](https://www.docker.com/) with Docker Compose (recommended way to run
  everything — see below)
- [.NET SDK 10.0](https://dotnet.microsoft.com/download) — only needed for
  running the server outside Docker, or for EF Core migrations
- [Node.js](https://nodejs.org/) ≥ 22.13 and [pnpm](https://pnpm.io/) `11.21.0`
  (pinned via `packageManager` in `client/package.json`) — only needed for
  running the client outside Docker

---

## Getting started (Docker Compose)

### 1. Create your env file

```bash
cp .env.example .env.dev
```

Fill in `.env.dev`. At minimum, for a working local instance:

- `DB_USER` / `DB_PASSWORD` / `DB_NAME` — Postgres credentials
- `APP_SECRET` — JWT signing secret (any long random string in dev)
- `SEED_APPROVER_USERNAME` / `SEED_APPROVER_EMAIL` / `SEED_APPROVER_PASSWORD`
  — the one Approver account, provisioned automatically on startup (there is
  no sign-up flow — see [product-description.md](product-description.md))
- `SEED_VIEWER1_*` / `SEED_VIEWER2_*` — the two read-only Viewer accounts (also
  optional, but leaving them blank just means those accounts won't be seeded)
- `EGN_ENCRYPTION_KEY` — **must be a real, valid key, or the app will fail to
  encrypt applicants' EGN.** The placeholder value in `.env.example` is not
  valid. Generate one:

  ```powershell
  # PowerShell
  [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
  ```

  ```bash
  # openssl
  openssl rand -base64 32
  ```

  This produces a Base64-encoded 256-bit AES key, which is what
  `EgnEncryptor` (`server/CreditApp/Modules/Applications/Shared/EgnEncryptor.cs`)
  expects — paste the output as `EGN_ENCRYPTION_KEY`.

The rest of the variables (SMTP, CORS, retention windows, Seq URL, etc.) have
reasonable defaults in `.env.example` for local dev.

### 2. Start the stack

Docker Compose does **not** automatically load `.env.dev` (it only auto-loads
a file literally named `.env`), so pass it explicitly:

```bash
docker compose -f docker-compose.dev.yml --env-file .env.dev up
```

This starts four containers: `postgres`, `server`, `client`, and `seq`.

For a production-like run, same idea with `.env.prod`:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up
```

### 3. Access the app

- **Client**: [http://localhost:5173](http://localhost:5173) (dev) —
  built and served on port 80 in the prod compose file
- **Server API**: [http://localhost:8080](http://localhost:8080)
- **API reference (Scalar, dev only)**: [http://localhost:8080/scalar](http://localhost:8080/scalar)
- **Seq (log viewer)**: [http://localhost:5341](http://localhost:5341) — dev
  only. In prod, Seq's UI has **no published host port** (it's only reachable
  on the internal `backend` Docker network, at `http://seq:80`, to avoid
  exposing request data publicly); view it in prod via an SSH tunnel:
  `ssh -L 5341:localhost:5341 user@server`, then browse `localhost:5341`.

Log in to the admin panel at `/login` using the `SEED_APPROVER_*` /
`SEED_VIEWER*_*` credentials from your `.env.dev`. Seeding is idempotent and
runs on every startup, so these accounts are always available once the server
has started successfully.

---

## Running tests

**Server** (from `server/`):

```bash
dotnet test                                        # full suite
dotnet test --filter FullyQualifiedName~Unit        # unit tests only, no Docker needed
dotnet test --filter FullyQualifiedName~Integration  # integration tests only
```

Integration tests spin up a real Postgres instance via Testcontainers, so
**Docker must be running** for `dotnet test` (or the `Integration` filter) to
succeed.

**Client** (from `client/`):

```bash
pnpm test:run
```

---

## Running migrations

From `server/CreditApp/`:

```bash
dotnet ef migrations add <Name>
dotnet ef database update
```

---

## Project structure

```
credit-app/
├── client/src/
│   ├── pages/        # One file per route (public + admin)
│   ├── hooks/         # React Query hooks
│   ├── components/    # Shared UI components
│   └── store/          # Zustand stores
└── server/CreditApp/
    ├── Modules/
    │   ├── Identity/        # Auth: login, JWT issuance, staff accounts
    │   ├── Applications/     # Application intake, review, retention/deletion
    │   └── InterestRate/     # The single flat interest rate + its admin update
    └── Shared/               # Cross-cutting infra: DB context, settings, extensions
```

---

## Environment & secrets

- `.env.example` — committed template, lists every required variable
- `.env.dev` / `.env.prod` — real values, **gitignored**, never commit
- `server/appsettings.json` / `appsettings.Development.json` — also
  gitignored; used only for running the server locally outside Docker
