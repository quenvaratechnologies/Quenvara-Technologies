# Testing

| Layer | Command | Covers |
|---|---|---|
| Unit | `npm test` | permission matrix, sanitizer (XSS), Zod schemas, resume magic bytes, SEO/JSON-LD, origin/IP helpers |
| TS↔SQL parity | `PARITY_PSQL="psql -h localhost -p 54322 -U postgres -d postgres" npm test` | permission matrix equals `role_permissions` |
| RLS / DB | `RLS_TEST_DB_URL=postgresql://postgres:postgres@localhost:54322/postgres npm run test:rls` | ~70 checks: anon vs each role, drafts hidden, no direct inserts, role-escalation blocked, audit trail, integrity constraints, delete guards, rate limit, storage bucket policies |
| E2E | `npm run test:e2e` (starts a mock Supabase, builds, runs Playwright; ~100 tests) | every public route (desktop + mobile), 404 status codes, admin redirects, direct API requests (validation, origin, honeypot), SEO files, headers, keyboard skip-link |

Notes
- E2E runs against `next start` with dummy Supabase env, so it verifies behaviour without a backend (empty states, graceful failure). Set real env vars to run against a seeded local stack.
- If Playwright's browser isn't installed: `npx playwright install chromium`, or set `PW_CHROMIUM_PATH` to an existing Chromium.
- The RLS suite uses `SET ROLE` + JWT-claim impersonation like PostgREST. On plain Postgres (no Supabase), first load `tests/integration/sql/00_supabase_shim.sql`.

## Manual checklist with seeded data
Publish/unpublish a service and confirm the public page and sitemap update; upload an image in Media; submit the contact form and a job application (needs a published job) and confirm resume download works only for authorized staff.

## Branding & UX tests
`tests/e2e/branding-and-ux.spec.ts` runs against a mock Supabase REST server (`tests/e2e/support/`, company "Nexora Systems" + logo) and proves the company name, logo, favicon, title template and structured data come from settings, not markup; plus nav links/active state/dropdown/drawer, CTA placement, scroll-reveal and reduced-motion behaviour.
