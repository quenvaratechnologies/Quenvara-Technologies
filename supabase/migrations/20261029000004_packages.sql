-- Quenvara Technology — Packages & pricing
-- Packages hold the company's own plans exactly as entered by staff. Nothing is seeded:
-- names, prices and features are never invented. `price_text` is stored verbatim (e.g. "PKR 150,000" / "From $2,500")
-- so existing pricing can be reproduced character-for-character.

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  tagline text,
  price_text text not null,
  billing_note text,
  description text,
  features jsonb not null default '[]'::jsonb,
  highlighted boolean not null default false,
  cta_label text,
  cta_url text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index packages_status_idx on public.packages (status, display_order);
create trigger trg_packages_updated before update on public.packages
  for each row execute function public.set_updated_at();

alter table public.packages enable row level security;
create policy "public read published" on public.packages for select to anon, authenticated using (status = 'published');
create policy "staff read all" on public.packages for select to authenticated using (public.has_permission('packages','read'));
create policy "staff insert" on public.packages for insert to authenticated with check (public.has_permission('packages','create'));
create policy "staff update" on public.packages for update to authenticated using (public.has_permission('packages','update')) with check (public.has_permission('packages','update'));
create policy "staff delete" on public.packages for delete to authenticated using (public.has_permission('packages','delete'));

create trigger trg_packages_publish_perm before insert or update on public.packages
  for each row execute function public.enforce_publish_permission('packages');

-- Same grants as other content resources: owner/administrator full, editor without delete.
insert into public.role_permissions (role, resource, action)
select r.role, 'packages', a.action
from (values ('owner'),('administrator'),('editor')) as r(role)
cross join (values ('read'),('create'),('update'),('publish'),('delete')) as a(action)
where not (r.role = 'editor' and a.action = 'delete')
on conflict do nothing;
