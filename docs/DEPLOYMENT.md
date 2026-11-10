# Deployment

## 1. Supabase
1. Create a project at supabase.com.
2. `supabase link --project-ref <ref>` then `supabase db push` (applies the three migrations).
3. Optional starter content: run `supabase/seed.sql` in the SQL editor. Remove later with `select public.remove_sample_content();`.
4. **Auth → URL configuration**: Site URL `https://your-domain`; redirect URL `https://your-domain/admin/auth/callback`. Disable public sign-ups. Configure SMTP and (recommended) MFA.
5. **Storage**: buckets `public-media` (public) and `private-files` (private) are created by migration 3; verify in the dashboard.
6. Provision the first owner (see ADMIN_PROVISIONING.md).

## 2. GitHub → Vercel
```bash
git remote add origin git@github.com:<org>/aveniq.git
git push -u origin main
```
In Vercel: **Add New → Project → import the repo** (framework preset: Next.js). Set environment variables for Production/Preview: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_URL`, and optional email variables. Deploy, then add your domain and update `SITE_URL` + Supabase Auth URLs.

## 3. Post-deploy checks
- `/robots.txt` and `/sitemap.xml` respond; `/admin` redirects to login.
- Submit the contact form → row appears in **Admin → Inquiries**.
- Publish a draft service → it appears publicly within seconds (path revalidation).

## Backup & recovery
- Supabase Pro: daily backups + optional PITR (restore from dashboard).
- Any plan: scheduled `pg_dump` (`supabase db dump` / `pg_dump $DB_URL`) to encrypted storage. Storage objects are not in DB dumps — back up buckets separately (especially `private-files`).
- Test restores periodically. Migrations in `supabase/migrations` rebuild schema/policies on a fresh project.
