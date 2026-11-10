# Quenvara Technology — Enterprise Website & CMS

A full-stack corporate website and content management system built with **Next.js (App Router, TypeScript strict)**, **Tailwind CSS v4**, and **Supabase** (PostgreSQL, Auth, Storage).

- Public marketing site (packages & pricing at /pricing when published; services, industries, work, products, technology, insights, careers, contact, legal, search).
- Secure admin panel at `/admin` with role-based access (Owner, Administrator, Editor, Sales, Recruiter).
- All editable content lives in Supabase and is protected by Row Level Security (RLS).
- Quenvara Technology is a **configurable placeholder brand**. No clients, offices, certifications, statistics or testimonials are invented; seed data is clearly marked as sample content.

## Quick start (local)

Prerequisites: Node 22+, npm, [Supabase CLI](https://supabase.com/docs/guides/cli), Docker (for `supabase start`).

```bash
npm install
cp .env.example .env.local            # fill in values (see docs/ENVIRONMENT below)
supabase start                         # local Postgres/Auth/Storage; applies migrations + seed.sql
supabase status                        # copy API URL, anon key, service_role key into .env.local
node --env-file=.env.local scripts/provision-owner.mjs you@company.com "Your Name"
npm run dev                            # http://localhost:3000   ·   admin: /admin/login
```

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Develop / production build / serve build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (errors fail; `any` on untyped Supabase rows is a warning) |
| `npm test` | Vitest unit + integration (TS↔SQL permission parity runs when `PARITY_PSQL` is set) |
| `npm run test:rls` | SQL RLS/authorization suite against a migrated DB (`RLS_TEST_DB_URL`) |
| `npm run test:e2e` | Playwright (desktop + mobile) against `next start` |
| `npm run verify` | typecheck + lint + tests + build |

Details: [docs/TESTING.md](docs/TESTING.md).

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — structure, data flow, caching, routes
- [Database](docs/DATABASE.md) — tables, migrations, seed and sample-content removal
- [Security & RLS](docs/SECURITY.md) — roles, policies, storage, abuse protection
- [Admin provisioning](docs/ADMIN_PROVISIONING.md) — creating the first owner and staff
- [Deployment](docs/DEPLOYMENT.md) — Supabase project, GitHub, Vercel, backups
- [Testing](docs/TESTING.md) · [Troubleshooting](docs/TROUBLESHOOTING.md)

## Environment variables

See `.env.example` (names only). Server-only secrets are never prefixed `NEXT_PUBLIC_`.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Anon/publishable key; all access is subject to RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | yes (server) | Used only for public form submissions, signed URLs, provisioning |
| `SITE_URL` | yes in prod | Canonical origin (metadata, sitemap, origin check) |
| `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`, `EMAIL_NOTIFY_TO` | optional | Resend HTTP API; notifications disabled unless all set |

## Branding & theme (Admin → Settings)
Company name, logo, tagline and brand colour live in settings. Changing them updates header, footer, page titles, favicon, structured data and button colour site-wide on save (cache is revalidated). With no logo, a letter mark and favicon are generated from the company name. Brand colours that make white button text unreadable are rejected.

## Before going live

1. Run `select public.remove_sample_content();` (or don't load `seed.sql` in production).
2. Replace draft legal pages with lawyer-reviewed text, then publish.
3. Add real company details in **Admin → Settings** (email, phone, public offices only if real).
4. Review [docs/SECURITY.md](docs/SECURITY.md) and configure Supabase Auth (SMTP, redirect URLs, MFA if desired).
