# Security & RLS

## Roles
`owner`, `administrator`, `editor`, `sales`, `recruiter`. The role is stored in `public.profiles` and read server-side; it is never taken from JWT `user_metadata`, query strings or form fields. Deactivated users (`is_active = false`) have no access.

| Role | Can |
|---|---|
| owner | everything incl. users/roles, settings, audit log |
| administrator | all content, media, settings, inquiries, careers, applications; read-only users and audit log |
| editor | create/edit/publish content and media; **no delete**, no sensitive data |
| sales | read/update inquiries (notes, status, assignment) |
| recruiter | manage job openings; read/update/delete applications |

The matrix lives in `src/lib/permissions/index.ts` and `public.role_permissions`; `tests/integration/permissions-parity.test.ts` fails if they diverge.

## Enforcement layers
1. `proxy.ts` redirects unauthenticated `/admin/*`.
2. Server actions/routes call `requireStaff`/`assertPermission` (validates JWT with `auth.getUser()`).
3. RLS on **every** table, using `has_permission()` (SECURITY DEFINER, `search_path` pinned). Publishing/unpublishing needs the `publish` permission (trigger). Only an owner can change roles/activation; owners cannot demote themselves; role changes are audit-logged by trigger.
4. Storage policies per bucket.

## Public access
Anonymous users may read **published** content only. `inquiries`, `applications`, `profiles`, `audit_logs`, `rate_limits`, `role_permissions` are not readable by `anon` (privileges revoked, no policies). There is **no public INSERT** on business tables; submissions go through server routes.

## Form abuse protection
Server-side Zod validation, same-origin check, 50 KB body cap, honeypot, per-IP-hash rate limit (5/hour), duplicate suppression (10 min), generic error messages. Resumes: PDF/DOC/DOCX, ≤ 5 MB, **magic-byte verified**, stored in the private bucket under random names.

## Files
- `public-media`: public images only (JPEG/PNG/WebP/AVIF/SVG, 5 MB). Staff with `media` permission manage it.
- `private-files`: resumes. No client-side upload policy exists; only the server writes. Staff with `applications:read` receive a **60-second signed URL** after an authorization check. Retention: 12 months by default; admins can purge expired applications.

## Secrets
Service-role key is server-only (`import "server-only"`), never `NEXT_PUBLIC_`. Headers: HSTS, nosniff, frame deny, referrer policy, permissions policy; `/admin/*` is `no-store` + `noindex`.

## Rich text
All CMS HTML passes an allow-list sanitizer (no scripts, handlers, iframes, `javascript:`/`data:` URLs; external links get `rel="noopener noreferrer nofollow"`).

## Known limits / your responsibility
- Rate limiting is DB-backed per IP; add a WAF/CAPTCHA (e.g. Turnstile) if you see sustained abuse.
- Enable MFA and a custom SMTP in Supabase Auth for production; set the Auth Site URL and redirect URLs.
- Legal pages are drafts for legal review; no compliance claims are made.
