# Database

Migrations (apply in order; they run on a fresh Supabase/PostgreSQL 15+ database):

| File | Contents |
|---|---|
| `20261029000001_schema.sql` | Tables, constraints, indexes, generated search vectors, triggers (`updated_at`, `published_at`), delete guards, rate-limit store, `search_content()` |
| `20261029000002_rls.sql` | `role_permissions`, `has_permission()`, RLS on every table, publish-permission trigger, profile-escalation guard, role-change auditing, `log_audit()` |
| `20261029000003_storage.sql` | `public-media` and `private-files` buckets, MIME/size limits, storage policies |

Tables: `profiles, services, industries, technologies, projects, products, posts, categories, tags, post_tags, pages, team_members, testimonials, faqs, inquiries, inquiry_notes, job_openings, applications, application_notes, site_settings, navigation_items, media_assets, audit_logs, redirects, rate_limits, role_permissions` plus junctions `service_industries, service_technologies, service_faqs, project_services, project_technologies, product_technologies, post_services`.

Integrity rules enforced in the database:
- Controlled vocabularies via `CHECK` constraints (statuses, roles, product status, project type…).
- A project's `client_display_name` requires `client_permission_confirmed` **and** `project_type = 'client'`; `outcomes` require `outcomes_verified`.
- A testimonial cannot be `published` without `permission_confirmed`.
- Services, technologies and industries referenced by *published* content cannot be deleted.
- Applications default to a 12-month `retention_until`.

## Applying migrations
```bash
supabase link --project-ref <ref>      # hosted project
supabase db push                       # applies supabase/migrations to the hosted DB
```
Creating a migration file does **not** change your hosted project; you must run `supabase db push` (or paste the SQL into the dashboard SQL editor in order).

## Seed and sample content
`supabase/seed.sql` loads clearly-labelled **sample** records (`is_sample = true`): services, industries, technologies, concept/demo projects, a product *concept*, FAQs, navigation, draft legal pages and a draft article. It contains no customers, staff, testimonials or metrics and creates no users. Local `supabase start` applies it automatically; do not run it in production unless you want a starter set.

Remove all sample content: `select public.remove_sample_content();` (SQL editor, service role only).
