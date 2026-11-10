# Architecture

## Stack
Next.js 16 (App Router, Server Components by default) · React 19 · TypeScript strict · Tailwind v4 design tokens in `src/app/globals.css` · Supabase (`@supabase/ssr`, `@supabase/supabase-js`) · Zod · Lucide icons · Vitest · Playwright.

## Layout
```
src/app/(public)/…        public routes (list pages under (list)/ route groups so detail 404s return HTTP 404)
src/app/admin/…           login, password reset, forbidden, and (panel)/ for the authenticated admin
src/app/api/contact|applications   controlled public form endpoints
src/lib/supabase/         browser, server (cookie session), public (anon, cookie-less), admin (service role, server-only)
src/lib/auth/             getStaff()/requireStaff()/assertPermission(); role read from public.profiles
src/lib/permissions/      single permission matrix (mirrored in SQL role_permissions)
src/lib/admin/            server actions: generic CRUD + inquiries, applications, media, settings, users, redirects
src/lib/database/public.ts  published-only read queries with graceful empty fallbacks
src/lib/security/         HTML allow-list sanitizer, IP/origin helpers
src/config/content-types.ts  declarative field/list config driving the generic admin CRUD screens
supabase/migrations|seed.sql|config.toml
```

## Data flow
- **Public reads**: Server Components call `lib/database/public.ts` with the anon client; RLS returns *published* rows only. Pages use ISR (`revalidate`) and are revalidated on admin mutations via `revalidatePath` (see `revalidateFor` in `lib/admin/crud.ts`).
- **Admin mutations**: Server Actions → `assertPermission()` (role from DB) → Zod validation → Supabase write with the *user's* session (RLS enforces again) → audit log → revalidation.
- **Public form submissions**: `/api/contact` and `/api/applications` validate (Zod), check same-origin, honeypot, per-IP rate limit (`check_rate_limit` RPC), de-duplicate, then write with the service role. Errors shown to visitors are generic.
- **Rich text**: stored as HTML, sanitized with an allow-list on save and again on render (`sanitizeRichText`).
- **Draft preview**: `/admin/<type>/<id>/preview` — staff-only, no-store, noindex.
- **Redirects**: slug changes can be recorded in `redirects` and are honoured by `notFoundOrRedirect`.
- **Proxy**: `src/proxy.ts` (Next 16 replacement for middleware) refreshes the session and redirects unauthenticated `/admin` requests to login; every action/query re-verifies independently.

## Routes
Public: `/`, `/about`, `/services`, `/services/[slug]`, `/industries`, `/industries/[slug]`, `/work`, `/work/[slug]`, `/products`, `/products/[slug]`, `/technology`, `/insights`, `/insights/[slug]`, `/careers`, `/careers/[slug]`, `/contact`, `/legal/[slug]`, `/search`, `/sitemap.xml`, `/robots.txt`, 404/error/loading states.

Admin: `/admin`, `/admin/login`, `/admin/reset-password`, `/admin/update-password`, `/admin/forbidden`, generic `/admin/[type]` (+ `/new`, `/[id]`, `/[id]/preview`) for services, industries, projects, products, technologies, posts, categories, tags, pages, navigation, team, testimonials, faqs, careers; dedicated `/admin/inquiries`, `/admin/applications`, `/admin/media`, `/admin/seo`, `/admin/settings`, `/admin/users`, `/admin/audit-logs`.
