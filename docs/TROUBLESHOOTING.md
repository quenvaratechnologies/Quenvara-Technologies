# Troubleshooting

| Symptom | Fix |
|---|---|
| Public pages are empty | Env vars missing/wrong, migrations not applied, or nothing is *published*. Check server logs for `public query failed`. |
| `Missing or invalid server environment variables` | Set `SUPABASE_SERVICE_ROLE_KEY` (server only). |
| Login works but admin says forbidden | User has no `profiles` row or `is_active=false`; run the provisioning script or add a profile as owner. |
| Reset email links fail | Add `https://<site>/admin/auth/callback` to Supabase Auth redirect URLs; set Site URL. |
| Contact form returns 429 | Rate limit (5/hour/IP). Wait, or clear the row in `rate_limits` while testing. |
| Contact form 403 | `SITE_URL` doesn't match the browser origin. |
| Resume upload rejected | Must be PDF/DOC/DOCX ≤ 5 MB and match the real file signature. |
| Images not loading from storage | Supabase host must be in `images.remotePatterns` (derived from `NEXT_PUBLIC_SUPABASE_URL` at build time — rebuild after changing it). |
| Published change not visible | Check the mutation succeeded; pages revalidate on save and every 5 min as a fallback. |
| Cannot delete a service/technology | It is referenced by published content; unpublish or unlink first. |
| `supabase db push` doesn't change the app | It only changes the linked database; deploy the app separately. |
