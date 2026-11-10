# Administrator provisioning

There is no public sign-up (`enable_signup = false`). Staff accounts are created deliberately.

## First owner
```bash
# env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (in .env.local)
node --env-file=.env.local scripts/provision-owner.mjs owner@your-company.com "Full Name"
# optional: OWNER_PASSWORD='…≥12 chars…'  (otherwise a random password is generated and printed once)
```
The script refuses to run if an active owner exists (use `--allow-additional` to override), and rolls back the auth user if the profile insert fails. No default credentials are ever seeded.

## Further staff
Sign in as owner → **Admin → Users** → invite/create user and assign a role. Role/activation changes are audit-logged and restricted to owners by a database trigger.

## Password reset
`/admin/reset-password` sends a Supabase reset email; configure the Auth redirect URL `https://<site>/admin/auth/callback`.

## Local development accounts (seed.sql)
`supabase db reset` also creates one account per role, password `Quenvara-Dev-2026!`:
`owner@`, `admin@` (administrator), `editor@`, `sales@`, `recruiter@` `quenvara.test`.
Local only. Remove with `select public.remove_dev_staff();` and create real accounts with `scripts/provision-owner.mjs`.
