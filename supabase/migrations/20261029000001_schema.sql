-- Quenvara Technology — core schema
-- Applies cleanly to a fresh Supabase (PostgreSQL 15+) database.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles (staff accounts). No public registration: rows are created by the
-- documented provisioning process (service role) only.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  role text not null default 'editor'
    check (role in ('owner','administrator','editor','sales','recruiter')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Taxonomy
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text not null default '',
  description text not null default '',
  category text not null default 'Software Engineering',
  icon text,
  cover_image text,
  challenges jsonb not null default '[]'::jsonb,
  deliverables jsonb not null default '[]'::jsonb,
  process_steps jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  is_sample boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(category,'')), 'C')
  ) stored
);
create index services_status_idx on public.services (status, sort_order);
create index services_category_idx on public.services (category);
create index services_search_idx on public.services using gin (search_vector);
create trigger trg_services_updated before update on public.services
  for each row execute function public.set_updated_at();

create table public.industries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  summary text not null default '',
  description text not null default '',
  challenges jsonb not null default '[]'::jsonb,
  use_cases jsonb not null default '[]'::jsonb,
  cover_image text,
  is_sample boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index industries_status_idx on public.industries (status, sort_order);
create trigger trg_industries_updated before update on public.industries
  for each row execute function public.set_updated_at();

create table public.technologies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null check (category in (
    'Frontend','Backend','Mobile','AI and ML','Cloud','Databases',
    'DevOps','Cybersecurity','Data engineering','Enterprise platforms')),
  icon text,
  description text,
  display_order int not null default 0,
  is_sample boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index technologies_status_idx on public.technologies (status, category, display_order);
create trigger trg_technologies_updated before update on public.technologies
  for each row execute function public.set_updated_at();

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text not null default '',
  challenge text not null default '',
  solution text not null default '',
  outcomes text,
  deliverables jsonb not null default '[]'::jsonb,
  industry_id uuid references public.industries (id) on delete restrict,
  project_type text not null default 'concept'
    check (project_type in ('client','internal_demo','concept','open_source')),
  client_display_name text,
  client_permission_confirmed boolean not null default false,
  outcomes_verified boolean not null default false,
  featured_image text,
  gallery jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  is_sample boolean not null default false,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A client name may only be stored when permission to publish it is confirmed.
  constraint projects_client_permission_chk
    check (client_display_name is null or client_permission_confirmed),
  -- Outcomes may only be stored for projects whose outcomes are verified.
  constraint projects_outcomes_verified_chk
    check (outcomes is null or outcomes_verified),
  -- Only genuine client work can carry a client name.
  constraint projects_client_type_chk
    check (client_display_name is null or project_type = 'client'),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary,'')), 'B')
  ) stored
);
create index projects_status_idx on public.projects (status, published_at desc);
create index projects_industry_idx on public.projects (industry_id);
create index projects_type_idx on public.projects (project_type);
create index projects_search_idx on public.projects using gin (search_vector);
create trigger trg_projects_updated before update on public.projects
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  summary text not null default '',
  description text not null default '',
  features jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  target_audience text,
  logo_url text,
  cover_image text,
  pricing_model text not null default 'contact'
    check (pricing_model in ('free','freemium','subscription','one_time','contact','not_announced')),
  demo_url text,
  documentation_url text,
  product_status text not null default 'concept'
    check (product_status in ('concept','in_development','beta','available','discontinued')),
  featured boolean not null default false,
  is_sample boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary,'')), 'B')
  ) stored
);
create index products_status_idx on public.products (status, sort_order);
create index products_search_idx on public.products using gin (search_vector);
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();

-- Public author / leadership profiles. Only real people supplied by the company; none seeded.
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_title text not null default '',
  bio text not null default '',
  avatar_url text,
  social_links jsonb not null default '{}'::jsonb,
  display_order int not null default 0,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index team_members_status_idx on public.team_members (status, display_order);
create trigger trg_team_members_updated before update on public.team_members
  for each row execute function public.set_updated_at();

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content text not null default '',
  cover_image text,
  author_id uuid references public.team_members (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  is_sample boolean not null default false,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  canonical_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.posts add column search_vector tsvector generated always as (
  setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
  setweight(to_tsvector('english', coalesce(excerpt,'')), 'B')
) stored;
create index posts_status_idx on public.posts (status, published_at desc);
create index posts_category_idx on public.posts (category_id);
create index posts_author_idx on public.posts (author_id);
create index posts_search_idx on public.posts using gin (search_vector);
create trigger trg_posts_updated before update on public.posts
  for each row execute function public.set_updated_at();

create table public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (post_id, tag_id)
);
create index post_tags_tag_idx on public.post_tags (tag_id);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null default '',
  page_type text not null default 'standard'
    check (page_type in ('standard','legal','about')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  is_sample boolean not null default false,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_pages_updated before update on public.pages
  for each row execute function public.set_updated_at();

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  person_name text not null,
  job_title text,
  company_name text,
  testimonial_text text not null,
  avatar_url text,
  permission_confirmed boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A testimonial cannot be published without confirmed permission.
  constraint testimonials_permission_chk check (status <> 'published' or permission_confirmed)
);
create trigger trg_testimonials_updated before update on public.testimonials
  for each row execute function public.set_updated_at();

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null default 'general',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  display_order int not null default 0,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index faqs_status_idx on public.faqs (status, category, display_order);
create trigger trg_faqs_updated before update on public.faqs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Junctions
-- ---------------------------------------------------------------------------
create table public.service_industries (
  service_id uuid not null references public.services (id) on delete cascade,
  industry_id uuid not null references public.industries (id) on delete cascade,
  primary key (service_id, industry_id)
);
create index service_industries_ind_idx on public.service_industries (industry_id);

create table public.service_technologies (
  service_id uuid not null references public.services (id) on delete cascade,
  technology_id uuid not null references public.technologies (id) on delete cascade,
  primary key (service_id, technology_id)
);
create index service_technologies_tech_idx on public.service_technologies (technology_id);

create table public.service_faqs (
  service_id uuid not null references public.services (id) on delete cascade,
  faq_id uuid not null references public.faqs (id) on delete cascade,
  primary key (service_id, faq_id)
);
create index service_faqs_faq_idx on public.service_faqs (faq_id);

create table public.project_services (
  project_id uuid not null references public.projects (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  primary key (project_id, service_id)
);
create index project_services_svc_idx on public.project_services (service_id);

create table public.project_technologies (
  project_id uuid not null references public.projects (id) on delete cascade,
  technology_id uuid not null references public.technologies (id) on delete cascade,
  primary key (project_id, technology_id)
);
create index project_technologies_tech_idx on public.project_technologies (technology_id);

create table public.product_technologies (
  product_id uuid not null references public.products (id) on delete cascade,
  technology_id uuid not null references public.technologies (id) on delete cascade,
  primary key (product_id, technology_id)
);
create index product_technologies_tech_idx on public.product_technologies (technology_id);

create table public.post_services (
  post_id uuid not null references public.posts (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  primary key (post_id, service_id)
);
create index post_services_svc_idx on public.post_services (service_id);

-- ---------------------------------------------------------------------------
-- Business operations
-- ---------------------------------------------------------------------------
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  name text not null,
  email text not null,
  company text,
  phone text,
  service_interest text,
  budget_range text,
  project_timeline text,
  message text not null,
  consent_given boolean not null default false,
  status text not null default 'new'
    check (status in ('new','contacted','qualified','proposal_sent','won','lost','archived')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  assigned_to uuid references public.profiles (id) on delete set null,
  follow_up_at timestamptz,
  is_read boolean not null default false,
  dedupe_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inquiries_status_idx on public.inquiries (status, created_at desc);
create index inquiries_assigned_idx on public.inquiries (assigned_to);
create index inquiries_service_idx on public.inquiries (service_interest);
create index inquiries_dedupe_idx on public.inquiries (dedupe_hash, created_at desc);
create trigger trg_inquiries_updated before update on public.inquiries
  for each row execute function public.set_updated_at();

create table public.inquiry_notes (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  note text not null check (length(note) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index inquiry_notes_inquiry_idx on public.inquiry_notes (inquiry_id, created_at);

create table public.job_openings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  department text not null default '',
  location text not null default '',
  employment_type text not null default 'full_time'
    check (employment_type in ('full_time','part_time','contract','internship')),
  description text not null default '',
  requirements text not null default '',
  status text not null default 'draft' check (status in ('draft','published','closed','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index job_openings_status_idx on public.job_openings (status, published_at desc);
create trigger trg_job_openings_updated before update on public.job_openings
  for each row execute function public.set_updated_at();

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_openings (id) on delete restrict,
  full_name text not null,
  email text not null,
  phone text,
  resume_path text,
  cover_letter text,
  consent_given boolean not null default false,
  status text not null default 'new'
    check (status in ('new','reviewing','interview','offer','hired','rejected','withdrawn')),
  -- Retention: applications are due for deletion after this date unless extended.
  retention_until timestamptz not null default (now() + interval '12 months'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applications_job_idx on public.applications (job_id, created_at desc);
create index applications_status_idx on public.applications (status);
create index applications_retention_idx on public.applications (retention_until);
create trigger trg_applications_updated before update on public.applications
  for each row execute function public.set_updated_at();

create table public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  note text not null check (length(note) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index application_notes_app_idx on public.application_notes (application_id, created_at);

-- ---------------------------------------------------------------------------
-- Configuration & governance
-- ---------------------------------------------------------------------------
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
create trigger trg_site_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null check (url ~ '^(/|https?://|mailto:)'),
  parent_id uuid references public.navigation_items (id) on delete cascade,
  location text not null default 'header' check (location in ('header','footer_company','footer_legal')),
  display_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);
create index navigation_location_idx on public.navigation_items (location, display_order);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  bucket text not null default 'public-media' check (bucket in ('public-media','private-files')),
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  width int,
  height int,
  alt_text text,
  visibility text not null default 'public' check (visibility in ('public','private')),
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index media_assets_created_idx on public.media_assets (created_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_actor_idx on public.audit_logs (actor_id);

-- Redirects when a published slug changes.
create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique check (from_path like '/%'),
  to_path text not null check (to_path like '/%'),
  created_at timestamptz not null default now()
);

-- Rate limiting store for public form endpoints (service-role access only).
create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits int not null default 0
);

create or replace function public.check_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  r public.rate_limits;
begin
  insert into public.rate_limits (key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
                        then now() else public.rate_limits.window_start end,
    hits = case when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
                then 1 else public.rate_limits.hits + 1 end
  returning * into r;
  return r.hits <= p_max;
end $$;
revoke all on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, int, int) to service_role;

-- ---------------------------------------------------------------------------
-- Delete guards: block deleting items referenced by published content.
-- ---------------------------------------------------------------------------
create or replace function public.guard_service_delete() returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.project_services ps join public.projects p on p.id = ps.project_id
             where ps.service_id = old.id and p.status = 'published') then
    raise exception 'Service is referenced by published projects. Unpublish or unlink them first.' using errcode = '23503';
  end if;
  return old;
end $$;
create trigger trg_services_delete_guard before delete on public.services
  for each row execute function public.guard_service_delete();

create or replace function public.guard_technology_delete() returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.project_technologies pt join public.projects p on p.id = pt.project_id
             where pt.technology_id = old.id and p.status = 'published')
     or exists (select 1 from public.service_technologies st join public.services s on s.id = st.service_id
             where st.technology_id = old.id and s.status = 'published')
     or exists (select 1 from public.product_technologies pr join public.products p on p.id = pr.product_id
             where pr.technology_id = old.id and p.status = 'published') then
    raise exception 'Technology is referenced by published content. Unlink it first.' using errcode = '23503';
  end if;
  return old;
end $$;
create trigger trg_technologies_delete_guard before delete on public.technologies
  for each row execute function public.guard_technology_delete();

create or replace function public.guard_industry_delete() returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.service_industries si join public.services s on s.id = si.service_id
             where si.industry_id = old.id and s.status = 'published') then
    raise exception 'Industry is referenced by published services. Unlink it first.' using errcode = '23503';
  end if;
  return old;
end $$;
create trigger trg_industries_delete_guard before delete on public.industries
  for each row execute function public.guard_industry_delete();

-- Published rows always carry a published_at timestamp.
create or replace function public.stamp_published_at() returns trigger language plpgsql as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end $$;
do $$
declare t text;
begin
  foreach t in array array['services','projects','products','posts','pages','job_openings'] loop
    execute format('create trigger trg_%1$s_published before insert or update on public.%1$s
                    for each row execute function public.stamp_published_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Public search across published content (SECURITY INVOKER: RLS applies).
-- ---------------------------------------------------------------------------
create or replace function public.search_content(q text, lim int default 20)
returns table (kind text, title text, slug text, summary text, rank real)
language sql stable security invoker set search_path = public as $$
  with query as (select websearch_to_tsquery('english', q) as tsq)
  select 'service', s.title, s.slug, s.summary, ts_rank(s.search_vector, query.tsq)
    from public.services s, query where s.status = 'published' and s.search_vector @@ query.tsq
  union all
  select 'product', p.name, p.slug, p.summary, ts_rank(p.search_vector, query.tsq)
    from public.products p, query where p.status = 'published' and p.search_vector @@ query.tsq
  union all
  select 'project', j.title, j.slug, j.summary, ts_rank(j.search_vector, query.tsq)
    from public.projects j, query where j.status = 'published' and j.search_vector @@ query.tsq
  union all
  select 'post', a.title, a.slug, a.excerpt, ts_rank(a.search_vector, query.tsq)
    from public.posts a, query where a.status = 'published' and a.search_vector @@ query.tsq
  order by 5 desc
  limit least(greatest(lim, 1), 50);
$$;
