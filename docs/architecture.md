# Architecture

## Application boundary

V1 is a modular Next.js monolith. Server Components read through repositories;
Server Actions perform authenticated mutations; Route Handlers are reserved for
file downloads, uploads, health checks and integrations.

```text
UI -> Server Action / Server query -> Service -> Repository -> Prisma -> Neon
```

Business services must not import React, Next.js navigation APIs or HTTP types.
Repositories must not decide accounting rules. This keeps the service layer
portable if a dedicated API is introduced later.

## Transaction boundary

One user action is one PostgreSQL transaction. For example, buying a car writes:

1. the `cars` record;
2. the corresponding `cash_transactions` Money Out record; and
3. an `audit_logs` record.

All three commit or all three roll back. The
`cash_transactions(reference_type, reference_id)` unique constraint prevents a
second automatic ledger entry for the same source transaction.

## Derived values

Do not add editable total columns to `cars`. Queries or SQL views calculate:

- total car expenses;
- total investment;
- recovery to date;
- active stock value;
- completed-car realized profit; and
- available cash.

Monthly snapshots preserve closing figures, while source transactions remain
authoritative. An audited administrator action may recalculate a snapshot after
a permitted historical correction.

## Authorization

Clerk proves identity. `user_profiles` owns the application role and active
status. Every Server Action and protected Route Handler checks authorization on
the server; hiding a button is never considered sufficient authorization.

## Attachments

Private Blob stores the binary content. PostgreSQL stores the pathname, MIME
type, size, owner car and uploader. Uploads require server-issued authorization,
file type/size validation and unique immutable pathnames.

## Environments

- Production uses the Neon production branch and Vercel production deployment.
- Preview/staging uses an isolated Neon branch and separate Blob storage.
- Local development may use a Neon development branch or local PostgreSQL.
- Production migrations run with `prisma migrate deploy` in CI/release flow.
