# DevOps Hub

A team-oriented hub for storing and organizing DevOps knowledge: links,
database connections, hosts, service endpoints and notes — with a group tree,
tags, full-text search, a command palette, and group sharing between users.

**Secrets are never stored.** Database entries hold only connection metadata
(engine, host, port, database, user) plus a *reference* to where the secret
lives (a Vault path, an env-var name, an AWS Secrets Manager ARN). The app
builds copy-paste commands that *retrieve* the secret at run time; it never
holds the value.

## Stack

- **Next.js (App Router) + React + TypeScript** — Server Components & Server Actions
- **Prisma** — ORM (SQLite for dev, Postgres for prod)
- **Auth.js v5 (NextAuth)** — credentials auth, database sessions
- **Tailwind CSS + Radix + cmdk** — UI, command palette
- **Zod + React Hook Form** — validation shared client/server
- **@dnd-kit** — drag & drop tree
- **Vitest** — tests

## Getting started

```bash
pnpm install
cp .env.example .env          # then set AUTH_SECRET (openssl rand -base64 32)
pnpm db:migrate               # create the SQLite dev database
pnpm db:seed                  # optional: demo user + sample data
pnpm dev                      # http://localhost:3000
```

Demo login after seeding: `demo@example.com` / `password123`.

### Switching to Postgres

Set `provider = "postgresql"` in `prisma/schema.prisma`, point `DATABASE_URL`
at your Postgres instance, set `DATABASE_PROVIDER=postgresql` in `.env`, then
run `pnpm db:migrate`. Full-text search uses Postgres `tsvector` when the
provider is Postgres and falls back to `LIKE` on SQLite.

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Run the dev server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Run Vitest |
| `pnpm db:migrate` | Create/apply a dev migration |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:reset` | Drop & recreate the dev database |

## Project layout

```
prisma/            schema.prisma, migrations, seed
src/lib/           prisma client, auth, authz, validation, domain helpers
src/lib/actions/   Server Actions grouped by domain
src/app/           App Router routes (auth pages + authenticated shell)
src/components/    UI primitives and feature components
```
