# Car Scrap Business

V1 foundation for managing car purchases, stock, car expenses, whole-car and
item recoveries, business expenses, cash flow, contacts and reports.

## Stack

- Next.js 16, React 19 and TypeScript
- Tailwind CSS and shadcn/ui
- Neon PostgreSQL with Prisma ORM
- Clerk authentication with database-backed application roles
- Vercel Private Blob for photos and documents
- ExcelJS and CSV Stringify for spreadsheet exports
- Vitest and Playwright for automated testing

## Requirements

- Node.js 22
- pnpm 10
- A Neon project
- A Clerk application
- A Vercel Blob store before file uploads are implemented

## Local setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create the local environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

   On macOS/Linux, use `cp .env.example .env`.

3. Replace the placeholder values in `.env`:

   - `DATABASE_URL`: Neon pooled connection string used by the application.
   - `DIRECT_URL`: Neon direct connection string used by Prisma migrations.
   - Clerk keys from the Clerk dashboard.
   - `BLOB_READ_WRITE_TOKEN` from Vercel Blob.

4. Validate and generate the database client:

   ```bash
   pnpm db:validate
   pnpm db:generate
   ```

5. Apply the initial migration after the Neon credentials are present:

   ```bash
   pnpm db:migrate:deploy
   ```

6. Start the development server:

   ```bash
   pnpm dev
   ```

   Open <http://localhost:3000>. The health endpoint is available at
   <http://localhost:3000/api/health>.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the local application |
| `pnpm build` | Create a production build |
| `pnpm check` | Validate schema, lint, type-check and unit-test |
| `pnpm test:e2e` | Run browser tests |
| `pnpm db:migrate` | Create/apply a development migration |
| `pnpm db:migrate:deploy` | Apply committed migrations in production |
| `pnpm db:studio` | Open Prisma Studio |

## Project structure

```text
prisma/                   Database schema and migrations
src/app/                  Next.js routes and layouts
src/components/ui/        Reusable shadcn/ui components
src/components/layout/    Application shell
src/features/             Business modules and domain rules
src/lib/                  Database, environment and auth infrastructure
tests/e2e/                Playwright workflows
docs/                     Architecture decisions
```

Generated Prisma Client files live in `src/generated/prisma` and are excluded
from version control. They are recreated by `pnpm install` and
`pnpm db:generate`.

## Financial rules

- Source transactions are authoritative; dashboard totals are derived.
- Car purchase, ledger entry and audit record must commit atomically.
- Active and partially recovered cars never report realized profit.
- Stock value and available cash remain separate.
- Financial records are voided with a reason instead of hard-deleted.
- Monetary database columns use `numeric(14,2)`; browser forms submit decimal
  strings rather than floating-point totals.

See [docs/architecture.md](docs/architecture.md) for implementation boundaries.
