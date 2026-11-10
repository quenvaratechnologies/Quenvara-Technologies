-- RLS / authorization integration tests. Run via: npm run test:rls
-- Each check raises on failure. Roles are impersonated like PostgREST does (SET ROLE + jwt claim).
\set ON_ERROR_STOP on
\set QUIET on
\o /dev/null
begin;

-- fixtures ------------------------------------------------------------------
insert into auth.users (id, email) values
 ('00000000-0000-0000-0000-0000000000a1','owner@t'), ('00000000-0000-0000-0000-0000000000a2','editor@t'),
 ('00000000-0000-0000-0000-0000000000a3','sales@t'),  ('00000000-0000-0000-0000-0000000000a4','recruiter@t'),
 ('00000000-0000-0000-0000-0000000000a5','admin@t'),  ('00000000-0000-0000-0000-0000000000a6','inactive@t'),
 ('00000000-0000-0000-0000-0000000000a7','norole@t');
insert into public.profiles (id, full_name, role, is_active) values
 ('00000000-0000-0000-0000-0000000000a1','Owner','owner',true),
 ('00000000-0000-0000-0000-0000000000a2','Editor','editor',true),
 ('00000000-0000-0000-0000-0000000000a3','Sales','sales',true),
 ('00000000-0000-0000-0000-0000000000a4','Recruiter','recruiter',true),
 ('00000000-0000-0000-0000-0000000000a5','Admin','administrator',true),
 ('00000000-0000-0000-0000-0000000000a6','Inactive Owner','owner',false);

insert into public.inquiries (reference_code, name, email, message) values ('AVQ-T-1','x','x@x.com','hello');
insert into public.job_openings (title, slug, status) values ('Draft Job','draft-job','draft'), ('Open Job','open-job','published');
insert into public.applications (job_id, full_name, email) select id,'Applicant','a@a.com' from public.job_openings where slug='open-job';
insert into public.services (title, slug, status) values ('T Draft','t-draft','draft'), ('T Pub','t-pub','published');

create or replace function pg_temp.as_user(uid text, r text default 'authenticated') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid,''), true);
  execute format('set local role %I', r);
end $$;
create or replace function pg_temp.ok(name text, cond boolean) returns void language plpgsql as $$
begin
  if not coalesce(cond,false) then raise exception 'FAIL: %', name; end if;
  raise notice 'ok  - %', name;
end $$;
-- run a statement expecting an error (insufficient_privilege / rls / check); returns true if it raised
create or replace function pg_temp.fails(stmt text) returns boolean language plpgsql as $$
begin
  execute stmt; return false;
exception when others then return true;
end $$;
-- run a DML statement and return affected rows
create or replace function pg_temp.rows(stmt text) returns int language plpgsql as $$
declare n int;
begin execute stmt; get diagnostics n = row_count; return n; end $$;
grant execute on all functions in schema pg_temp to public;

-- ANON ------------------------------------------------------------------------
select pg_temp.as_user(null, 'anon');
select pg_temp.ok('anon reads published services only', (select count(*) from public.services where slug='t-pub')=1 and (select count(*) from public.services where slug='t-draft')=0);
select pg_temp.ok('anon cannot see draft pages (legal drafts)', (select count(*) from public.pages where status<>'published')=0);
select pg_temp.ok('anon cannot read inquiries', pg_temp.fails('select * from public.inquiries'));
select pg_temp.ok('anon cannot read applications', pg_temp.fails('select * from public.applications'));
select pg_temp.ok('anon cannot read profiles', pg_temp.fails('select * from public.profiles'));
select pg_temp.ok('anon cannot read audit logs', pg_temp.fails('select * from public.audit_logs'));
select pg_temp.ok('anon cannot read role_permissions', pg_temp.fails('select * from public.role_permissions'));
select pg_temp.ok('anon cannot insert inquiries directly', pg_temp.fails($$insert into public.inquiries (reference_code,name,email,message) values ('X','a','a@a.com','m')$$));
select pg_temp.ok('anon cannot insert applications directly', pg_temp.fails($$insert into public.applications (job_id,full_name,email) select id,'a','a@a.com' from public.job_openings limit 1$$));
select pg_temp.ok('anon cannot insert services', pg_temp.fails($$insert into public.services (title,slug) values ('x','anon-x')$$));
select pg_temp.ok('anon sees only published job openings', (select count(*) from public.job_openings where status<>'published')=0);
select pg_temp.ok('anon cannot call log_audit', pg_temp.fails($$select public.log_audit('a','b','c')$$));
select pg_temp.ok('anon cannot call check_rate_limit', pg_temp.fails($$select public.check_rate_limit('k',1,60)$$));
select pg_temp.ok('anon search only returns published', (select count(*) from public.search_content('Pub'))>=1 and (select count(*) from public.search_content('Draft'))=0);

-- EDITOR ----------------------------------------------------------------------
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a2');
select pg_temp.ok('editor reads drafts', (select count(*) from public.services where slug='t-draft')=1);
select pg_temp.ok('editor can create a draft service', pg_temp.rows($$insert into public.services (title,slug) values ('Ed','ed-1')$$)=1);
select pg_temp.ok('editor can update service', pg_temp.rows($$update public.services set summary='s' where slug='ed-1'$$)=1);
select pg_temp.ok('editor cannot delete services', pg_temp.rows($$delete from public.services where slug='ed-1'$$)=0);
select pg_temp.ok('editor cannot read inquiries', (select count(*) from public.inquiries)=0);
select pg_temp.ok('editor cannot read applications', (select count(*) from public.applications)=0);
select pg_temp.ok('editor cannot read audit logs', (select count(*) from public.audit_logs)=0);
select pg_temp.ok('editor cannot escalate own role', pg_temp.fails($$update public.profiles set role='owner' where id='00000000-0000-0000-0000-0000000000a2'$$));
select pg_temp.ok('editor cannot edit settings', pg_temp.rows($$update public.site_settings set value='{}'$$)=0);
select pg_temp.ok('editor cannot insert profiles', pg_temp.fails($$insert into public.profiles (id, role) values ('00000000-0000-0000-0000-0000000000a7','owner')$$));
select pg_temp.ok('editor audit RPC is callable by active staff', not pg_temp.fails($$select public.log_audit('t.test','svc','1')$$));

-- SALES -----------------------------------------------------------------------
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a3');
select pg_temp.ok('sales reads inquiries', (select count(*) from public.inquiries)=1);
select pg_temp.ok('sales updates inquiry status', pg_temp.rows($$update public.inquiries set status='contacted'$$)=1);
select pg_temp.ok('sales cannot delete inquiries', pg_temp.rows($$delete from public.inquiries$$)=0);
select pg_temp.ok('sales cannot read applications', (select count(*) from public.applications)=0);
select pg_temp.ok('sales cannot read drafts', (select count(*) from public.services where status='draft')=0);
select pg_temp.ok('sales cannot create services', pg_temp.fails($$insert into public.services (title,slug) values ('s','sales-s')$$));
select pg_temp.ok('sales may add notes as self', pg_temp.rows($$insert into public.inquiry_notes (inquiry_id, author_id, note) select id, '00000000-0000-0000-0000-0000000000a3','n' from public.inquiries$$)=1);
select pg_temp.ok('sales cannot forge note author', pg_temp.fails($$insert into public.inquiry_notes (inquiry_id, author_id, note) select id, '00000000-0000-0000-0000-0000000000a1','n' from public.inquiries$$));

-- RECRUITER -------------------------------------------------------------------
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a4');
select pg_temp.ok('recruiter reads applications', (select count(*) from public.applications)=1);
select pg_temp.ok('recruiter reads draft job openings', (select count(*) from public.job_openings where status='draft')=1);
select pg_temp.ok('recruiter cannot read inquiries', (select count(*) from public.inquiries)=0);
select pg_temp.ok('recruiter cannot edit services', pg_temp.rows($$update public.services set summary='x'$$)=0);
select pg_temp.ok('recruiter can publish jobs', pg_temp.rows($$update public.job_openings set status='published' where slug='draft-job'$$)=1);

-- ADMINISTRATOR -----------------------------------------------------------------
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a5');
select pg_temp.ok('admin reads inquiries', (select count(*) from public.inquiries)=1);
select pg_temp.ok('admin can delete content', pg_temp.rows($$delete from public.services where slug='t-draft'$$)=1);
select pg_temp.ok('admin cannot change roles', pg_temp.fails($$update public.profiles set role='owner' where id='00000000-0000-0000-0000-0000000000a5'$$));
select pg_temp.ok('admin cannot modify others roles', pg_temp.rows($$update public.profiles set role='sales' where id='00000000-0000-0000-0000-0000000000a2'$$)=0);

-- OWNER -------------------------------------------------------------------------
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
select pg_temp.ok('owner reads audit logs', (select count(*) from public.audit_logs)>=1);
select pg_temp.ok('owner can change roles', pg_temp.rows($$update public.profiles set role='editor' where id='00000000-0000-0000-0000-0000000000a3'$$)=1);
select pg_temp.ok('role change is audit-logged', (select count(*) from public.audit_logs where action='profile.role_changed' and entity_id='00000000-0000-0000-0000-0000000000a3')=1);
select pg_temp.ok('owner cannot demote self', pg_temp.fails($$update public.profiles set role='editor' where id='00000000-0000-0000-0000-0000000000a1'$$));
select pg_temp.ok('audit logs cannot be modified', pg_temp.rows($$update public.audit_logs set action='x'$$)=0 and pg_temp.rows($$delete from public.audit_logs$$)=0);

-- INACTIVE / NO-PROFILE USERS -------------------------------------------------------
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a6');
select pg_temp.ok('deactivated owner has no access', (select count(*) from public.inquiries)=0 and pg_temp.fails($$insert into public.services (title,slug) values ('z','z-inactive')$$));
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a7');
select pg_temp.ok('authenticated user without profile has no access', (select count(*) from public.inquiries)=0 and (select count(*) from public.audit_logs)=0 and pg_temp.fails($$select public.log_audit('a','b','c')$$));

-- DATA INTEGRITY ----------------------------------------------------------------------
reset role;
select set_config('request.jwt.claim.sub','',true);
select pg_temp.ok('slug must be unique', pg_temp.fails($$insert into public.services (title,slug) values ('dup','t-pub')$$));
select pg_temp.ok('client name requires permission', pg_temp.fails($$insert into public.projects (title,slug,project_type,client_display_name,client_permission_confirmed) values ('p','p-1','client','Acme',false)$$));
select pg_temp.ok('concept project cannot carry client name', pg_temp.fails($$insert into public.projects (title,slug,project_type,client_display_name,client_permission_confirmed) values ('p','p-2','concept','Acme',true)$$));
select pg_temp.ok('outcomes require verification', pg_temp.fails($$insert into public.projects (title,slug,outcomes,outcomes_verified) values ('p','p-3','+40% revenue',false)$$));
select pg_temp.ok('testimonial cannot publish without permission', pg_temp.fails($$insert into public.testimonials (person_name,testimonial_text,status,permission_confirmed) values ('a','b','published',false)$$));
select pg_temp.ok('published rows get published_at', (select published_at is not null from public.services where slug='t-pub'));
select pg_temp.ok('invalid status rejected', pg_temp.fails($$insert into public.services (title,slug,status) values ('s','bad-status','live')$$));
select pg_temp.ok('nav url scheme restricted', pg_temp.fails($$insert into public.navigation_items (label,url) values ('x','javascript:alert(1)')$$));
insert into public.services (title,slug,status) values ('g','guard-svc','published');
insert into public.projects (title,slug,status) values ('gp','guard-proj','published');
insert into public.project_services select p.id, s.id from public.projects p, public.services s where p.slug='guard-proj' and s.slug='guard-svc';
select pg_temp.ok('delete guard blocks service referenced by published project', pg_temp.fails($$delete from public.services where slug='guard-svc'$$));
select pg_temp.ok('rate limit allows then blocks', (
  select bool_and(case when n<=3 then r else not r end) from (
    select n, public.check_rate_limit('test-key',3,60) as r from generate_series(1,5) n) q));
select pg_temp.ok('application default retention is 12 months', (select retention_until > now()+interval '11 months' from public.applications limit 1));

-- STORAGE ------------------------------------------------------------------------------
select set_config('request.jwt.claim.sub','',true);
update public.profiles set role='sales' where id='00000000-0000-0000-0000-0000000000a3';
insert into storage.objects (bucket_id, name) values ('private-files','resume.pdf'), ('public-media','logo.png');
select pg_temp.as_user(null,'anon');
select pg_temp.ok('anon reads public-media only', (select count(*) from storage.objects where bucket_id='public-media')=1 and (select count(*) from storage.objects where bucket_id='private-files')=0);
select pg_temp.ok('anon cannot upload', pg_temp.fails($$insert into storage.objects (bucket_id,name) values ('public-media','evil.png')$$));
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a4');
select pg_temp.ok('recruiter reads private resumes', (select count(*) from storage.objects where bucket_id='private-files')=1);
select pg_temp.ok('recruiter cannot upload to private bucket', pg_temp.fails($$insert into storage.objects (bucket_id,name) values ('private-files','x.pdf')$$));
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a2');
select pg_temp.ok('editor cannot read private resumes', (select count(*) from storage.objects where bucket_id='private-files')=0);
select pg_temp.ok('editor uploads public media', pg_temp.rows($$insert into storage.objects (bucket_id,name) values ('public-media','ed.png')$$)=1);
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a3');
select pg_temp.ok('sales cannot upload media', pg_temp.fails($$insert into storage.objects (bucket_id,name) values ('public-media','s.png')$$));

reset role;
rollback;
\o
\echo ALL RLS TESTS PASSED
