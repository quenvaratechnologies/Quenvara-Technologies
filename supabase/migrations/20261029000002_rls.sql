-- Quenvara Technology — Row Level Security
-- Roles come ONLY from public.profiles (never from JWT user_metadata, which users can edit).

-- ---------------------------------------------------------------------------
-- Permission matrix (mirrors src/lib/permissions/index.ts; a unit test asserts parity)
-- ---------------------------------------------------------------------------
create table public.role_permissions (
  role text not null check (role in ('owner','administrator','editor','sales','recruiter')),
  resource text not null,
  action text not null check (action in ('read','create','update','publish','delete')),
  primary key (role, resource, action)
);
alter table public.role_permissions enable row level security;
-- no policies: only SECURITY DEFINER functions and service_role read it.

insert into public.role_permissions (role, resource, action)
select r.role, res.resource, a.action
from (values ('owner'),('administrator'),('editor')) as r(role)
cross join (values
  ('services'),('industries'),('projects'),('products'),('technologies'),('posts'),
  ('categories'),('tags'),('pages'),('navigation'),('team'),('testimonials'),
  ('faqs'),('media'),('seo')) as res(resource)
cross join (values ('read'),('create'),('update'),('publish'),('delete')) as a(action)
where not (r.role = 'editor' and a.action = 'delete');

-- Owner: everything else
insert into public.role_permissions (role, resource, action)
select 'owner', res.resource, a.action
from (values ('settings'),('inquiries'),('careers'),('applications'),('users'),('audit_logs')) as res(resource)
cross join (values ('read'),('create'),('update'),('publish'),('delete')) as a(action);

-- Administrator: operational resources (users/audit read-only)
insert into public.role_permissions (role, resource, action)
select 'administrator', res.resource, a.action
from (values ('settings'),('inquiries'),('careers'),('applications')) as res(resource)
cross join (values ('read'),('create'),('update'),('publish'),('delete')) as a(action);
insert into public.role_permissions values
  ('administrator','users','read'), ('administrator','audit_logs','read');

-- Sales
insert into public.role_permissions values
  ('sales','inquiries','read'), ('sales','inquiries','update'),
  ('sales','team','read'), ('sales','users','read');

-- Recruiter
insert into public.role_permissions values
  ('recruiter','careers','read'), ('recruiter','careers','create'),
  ('recruiter','careers','update'), ('recruiter','careers','publish'),
  ('recruiter','applications','read'), ('recruiter','applications','update'),
  ('recruiter','applications','delete'), ('recruiter','users','read');

-- ---------------------------------------------------------------------------
-- Auth helper functions (SECURITY DEFINER so they can read profiles regardless of RLS)
-- ---------------------------------------------------------------------------
create or replace function public.current_staff_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

create or replace function public.has_permission(p_resource text, p_action text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.profiles p
    join public.role_permissions rp on rp.role = p.role
    where p.id = auth.uid() and p.is_active
      and rp.resource = p_resource and rp.action = p_action
  )
$$;

revoke all on function public.current_staff_role() from public, anon;
revoke all on function public.has_permission(text, text) from public, anon;
grant execute on function public.current_staff_role() to authenticated, service_role;
grant execute on function public.has_permission(text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Enable RLS on every application table
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','categories','tags','services','industries','technologies','projects',
    'products','team_members','posts','post_tags','pages','testimonials','faqs',
    'service_industries','service_technologies','service_faqs','project_services',
    'project_technologies','product_technologies','post_services',
    'inquiries','inquiry_notes','job_openings','applications','application_notes',
    'site_settings','navigation_items','media_assets','audit_logs','redirects','rate_limits'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Standard content tables: public reads published; staff act by permission.
-- (table, resource, publish-flag column predicate)
-- ---------------------------------------------------------------------------
do $$
declare
  rec record;
begin
  for rec in
    select * from (values
      ('services','services',                'status = ''published'''),
      ('industries','industries',            'status = ''published'''),
      ('technologies','technologies',        'status = ''published'''),
      ('projects','projects',                'status = ''published'''),
      ('products','products',                'status = ''published'''),
      ('team_members','team',                'status = ''published'''),
      ('posts','posts',                      'status = ''published'' and (published_at is null or published_at <= now())'),
      ('pages','pages',                      'status = ''published'''),
      ('testimonials','testimonials',        'status = ''published'' and permission_confirmed'),
      ('faqs','faqs',                        'status = ''published'''),
      ('job_openings','careers',             'status = ''published'''),
      ('navigation_items','navigation',      'is_visible')
    ) as v(tbl, resource, pub)
  loop
    execute format('create policy "public read published" on public.%I for select to anon, authenticated using (%s)', rec.tbl, rec.pub);
    execute format('create policy "staff read all" on public.%I for select to authenticated using (public.has_permission(%L,''read''))', rec.tbl, rec.resource);
    execute format('create policy "staff insert" on public.%I for insert to authenticated with check (public.has_permission(%L,''create''))', rec.tbl, rec.resource);
    -- Updates: need update permission; flipping to/from published additionally needs publish permission.
    execute format('create policy "staff update" on public.%I for update to authenticated using (public.has_permission(%L,''update'')) with check (public.has_permission(%L,''update''))', rec.tbl, rec.resource, rec.resource);
    execute format('create policy "staff delete" on public.%I for delete to authenticated using (public.has_permission(%L,''delete''))', rec.tbl, rec.resource);
  end loop;
end $$;

-- Publishing requires the 'publish' permission (enforced for every table with a status column).
create or replace function public.enforce_publish_permission() returns trigger
language plpgsql security invoker as $$
declare res text := tg_argv[0];
begin
  -- service_role / SQL editor (no JWT) is trusted.
  if auth.uid() is null then return new; end if;
  if (tg_op = 'INSERT' and new.status = 'published')
     or (tg_op = 'UPDATE' and (new.status = 'published') is distinct from (old.status = 'published')) then
    if not public.has_permission(res, 'publish') then
      raise exception 'Not permitted to publish or unpublish %', res using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

do $$
declare rec record;
begin
  for rec in select * from (values
    ('services','services'),('industries','industries'),('technologies','technologies'),
    ('projects','projects'),('products','products'),('team_members','team'),
    ('posts','posts'),('pages','pages'),('testimonials','testimonials'),
    ('faqs','faqs'),('job_openings','careers')) as v(tbl, resource)
  loop
    execute format('create trigger trg_%1$s_publish_perm before insert or update on public.%1$s
                    for each row execute function public.enforce_publish_permission(%2$L)', rec.tbl, rec.resource);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Taxonomy (public readable; managed by posts-related permissions)
-- ---------------------------------------------------------------------------
create policy "public read categories" on public.categories for select to anon, authenticated using (true);
create policy "staff insert categories" on public.categories for insert to authenticated with check (public.has_permission('categories','create'));
create policy "staff update categories" on public.categories for update to authenticated using (public.has_permission('categories','update')) with check (public.has_permission('categories','update'));
create policy "staff delete categories" on public.categories for delete to authenticated using (public.has_permission('categories','delete'));

create policy "public read tags" on public.tags for select to anon, authenticated using (true);
create policy "staff insert tags" on public.tags for insert to authenticated with check (public.has_permission('tags','create'));
create policy "staff update tags" on public.tags for update to authenticated using (public.has_permission('tags','update')) with check (public.has_permission('tags','update'));
create policy "staff delete tags" on public.tags for delete to authenticated using (public.has_permission('tags','delete'));

-- ---------------------------------------------------------------------------
-- Junction tables: visible publicly only when the parent row is published.
-- Writable by staff who can update the owning resource.
-- ---------------------------------------------------------------------------
create policy "public read post_tags" on public.post_tags for select to anon, authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.status = 'published'));
create policy "staff read post_tags" on public.post_tags for select to authenticated using (public.has_permission('posts','read'));
create policy "staff write post_tags" on public.post_tags for all to authenticated
  using (public.has_permission('posts','update')) with check (public.has_permission('posts','update'));

create policy "public read post_services" on public.post_services for select to anon, authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.status = 'published'));
create policy "staff read post_services" on public.post_services for select to authenticated using (public.has_permission('posts','read'));
create policy "staff write post_services" on public.post_services for all to authenticated
  using (public.has_permission('posts','update')) with check (public.has_permission('posts','update'));

create policy "public read service_industries" on public.service_industries for select to anon, authenticated
  using (exists (select 1 from public.services s where s.id = service_id and s.status = 'published'));
create policy "staff read service_industries" on public.service_industries for select to authenticated using (public.has_permission('services','read'));
create policy "staff write service_industries" on public.service_industries for all to authenticated
  using (public.has_permission('services','update')) with check (public.has_permission('services','update'));

create policy "public read service_technologies" on public.service_technologies for select to anon, authenticated
  using (exists (select 1 from public.services s where s.id = service_id and s.status = 'published'));
create policy "staff read service_technologies" on public.service_technologies for select to authenticated using (public.has_permission('services','read'));
create policy "staff write service_technologies" on public.service_technologies for all to authenticated
  using (public.has_permission('services','update')) with check (public.has_permission('services','update'));

create policy "public read service_faqs" on public.service_faqs for select to anon, authenticated
  using (exists (select 1 from public.services s where s.id = service_id and s.status = 'published'));
create policy "staff read service_faqs" on public.service_faqs for select to authenticated using (public.has_permission('services','read'));
create policy "staff write service_faqs" on public.service_faqs for all to authenticated
  using (public.has_permission('services','update')) with check (public.has_permission('services','update'));

create policy "public read project_services" on public.project_services for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.status = 'published'));
create policy "staff read project_services" on public.project_services for select to authenticated using (public.has_permission('projects','read'));
create policy "staff write project_services" on public.project_services for all to authenticated
  using (public.has_permission('projects','update')) with check (public.has_permission('projects','update'));

create policy "public read project_technologies" on public.project_technologies for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.status = 'published'));
create policy "staff read project_technologies" on public.project_technologies for select to authenticated using (public.has_permission('projects','read'));
create policy "staff write project_technologies" on public.project_technologies for all to authenticated
  using (public.has_permission('projects','update')) with check (public.has_permission('projects','update'));

create policy "public read product_technologies" on public.product_technologies for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy "staff read product_technologies" on public.product_technologies for select to authenticated using (public.has_permission('products','read'));
create policy "staff write product_technologies" on public.product_technologies for all to authenticated
  using (public.has_permission('products','update')) with check (public.has_permission('products','update'));

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "staff read profiles" on public.profiles for select to authenticated using (public.has_permission('users','read'));
-- Users can edit their own display fields only; role/is_active are protected by trigger below.
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "owner manage profiles" on public.profiles for all to authenticated
  using (public.has_permission('users','update') and public.has_permission('users','delete'))
  with check (public.has_permission('users','update') and public.has_permission('users','delete'));

create or replace function public.guard_profile_changes() returns trigger
language plpgsql security definer set search_path = public as $$
declare actor_role text;
begin
  -- service_role / migrations (no JWT subject) may provision.
  if auth.uid() is null then
    return new;
  end if;
  select role into actor_role from public.profiles where id = auth.uid() and is_active;

  if tg_op = 'INSERT' then
    if actor_role is distinct from 'owner' then
      raise exception 'Only an owner can create staff profiles' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
    if actor_role is distinct from 'owner' then
      raise exception 'Only an owner can change roles or activation' using errcode = '42501';
    end if;
    if old.id = auth.uid() and (new.role <> 'owner' or not new.is_active) then
      raise exception 'Owners cannot demote or deactivate themselves' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger trg_profiles_guard before insert or update on public.profiles
  for each row execute function public.guard_profile_changes();

-- Role / activation changes are always audit-logged.
create or replace function public.audit_profile_role_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.role is distinct from old.role or new.is_active is distinct from old.is_active then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (auth.uid(),
            case when tg_op = 'INSERT' then 'profile.created' else 'profile.role_changed' end,
            'profile', new.id::text,
            jsonb_build_object('old_role', case when tg_op = 'UPDATE' then old.role end,
                               'new_role', new.role,
                               'old_active', case when tg_op = 'UPDATE' then old.is_active end,
                               'new_active', new.is_active));
  end if;
  return new;
end $$;
create trigger trg_profiles_audit after insert or update on public.profiles
  for each row execute function public.audit_profile_role_change();

-- ---------------------------------------------------------------------------
-- Inquiries & notes (staff only; public submissions go through the server route + service role)
-- ---------------------------------------------------------------------------
create policy "staff read inquiries" on public.inquiries for select to authenticated using (public.has_permission('inquiries','read'));
create policy "staff update inquiries" on public.inquiries for update to authenticated
  using (public.has_permission('inquiries','update')) with check (public.has_permission('inquiries','update'));
create policy "staff delete inquiries" on public.inquiries for delete to authenticated using (public.has_permission('inquiries','delete'));

create policy "staff read inquiry notes" on public.inquiry_notes for select to authenticated using (public.has_permission('inquiries','read'));
create policy "staff add inquiry notes" on public.inquiry_notes for insert to authenticated
  with check (public.has_permission('inquiries','update') and author_id = auth.uid());
create policy "staff delete inquiry notes" on public.inquiry_notes for delete to authenticated using (public.has_permission('inquiries','delete'));

-- ---------------------------------------------------------------------------
-- Applications & notes
-- ---------------------------------------------------------------------------
create policy "staff read applications" on public.applications for select to authenticated using (public.has_permission('applications','read'));
create policy "staff update applications" on public.applications for update to authenticated
  using (public.has_permission('applications','update')) with check (public.has_permission('applications','update'));
create policy "staff delete applications" on public.applications for delete to authenticated using (public.has_permission('applications','delete'));

create policy "staff read application notes" on public.application_notes for select to authenticated using (public.has_permission('applications','read'));
create policy "staff add application notes" on public.application_notes for insert to authenticated
  with check (public.has_permission('applications','update') and author_id = auth.uid());
create policy "staff delete application notes" on public.application_notes for delete to authenticated using (public.has_permission('applications','delete'));

-- ---------------------------------------------------------------------------
-- Site settings, media, audit logs, redirects
-- ---------------------------------------------------------------------------
create policy "public read public settings" on public.site_settings for select to anon, authenticated using (is_public);
create policy "staff read settings" on public.site_settings for select to authenticated using (public.has_permission('settings','read'));
create policy "staff insert settings" on public.site_settings for insert to authenticated with check (public.has_permission('settings','create'));
create policy "staff update settings" on public.site_settings for update to authenticated
  using (public.has_permission('settings','update')) with check (public.has_permission('settings','update'));
create policy "staff delete settings" on public.site_settings for delete to authenticated using (public.has_permission('settings','delete'));

create policy "public read public media" on public.media_assets for select to anon, authenticated using (visibility = 'public');
create policy "staff read media" on public.media_assets for select to authenticated using (public.has_permission('media','read'));
create policy "staff insert media" on public.media_assets for insert to authenticated
  with check (public.has_permission('media','create') and uploaded_by = auth.uid());
create policy "staff update media" on public.media_assets for update to authenticated
  using (public.has_permission('media','update')) with check (public.has_permission('media','update'));
create policy "staff delete media" on public.media_assets for delete to authenticated using (public.has_permission('media','delete'));

create policy "staff read audit logs" on public.audit_logs for select to authenticated using (public.has_permission('audit_logs','read'));
-- No insert/update/delete policies: logs are append-only through log_audit() / triggers.

create policy "public read redirects" on public.redirects for select to anon, authenticated using (true);
create policy "staff write redirects" on public.redirects for all to authenticated
  using (public.has_permission('seo','update')) with check (public.has_permission('seo','update'));

-- rate_limits: RLS enabled with no policies => only service_role can touch it.

-- ---------------------------------------------------------------------------
-- Audit RPC: actor is always auth.uid(); callers cannot spoof it.
-- ---------------------------------------------------------------------------
create or replace function public.log_audit(p_action text, p_entity_type text, p_entity_id text, p_metadata jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not exists (select 1 from public.profiles where id = auth.uid() and is_active) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), left(p_action, 100), left(p_entity_type, 100), left(p_entity_id, 200), coalesce(p_metadata, '{}'::jsonb));
end $$;
revoke all on function public.log_audit(text, text, text, jsonb) from public, anon;
grant execute on function public.log_audit(text, text, text, jsonb) to authenticated, service_role;

-- Redact sensitive columns: anon must never read these via PostgREST even if a policy changes.
revoke all on public.profiles, public.inquiries, public.inquiry_notes, public.applications,
  public.application_notes, public.audit_logs, public.rate_limits, public.role_permissions from anon;
