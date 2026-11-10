-- Quenvara Technology — DEVELOPMENT SEED
-- Every record here is SAMPLE content (is_sample = true where the table supports it).
-- It contains no real customers, staff biographies, testimonials, certifications or results.
-- Remove before production:  select public.remove_sample_content();   (see bottom of file)
-- LOCAL DEV ONLY: staff accounts (one per role) are created in the block at the bottom with a shared dev password.
-- Never run that block against production. Real accounts: docs/ADMIN_PROVISIONING.md.

-- Site settings (public) -----------------------------------------------------
insert into public.site_settings (key, value, is_public) values
 ('company', jsonb_build_object(
    'name','Quenvara Technology',
    'tagline','Engineering Digital Solutions. Building What Comes Next.',
    'description','Quenvara Technology is a proposed technology services and product engineering company.',
    'email', null, 'phone', null, 'offices', jsonb_build_array(),
    'social', jsonb_build_object()), true),
 ('hero', jsonb_build_object(
    'headline','Engineering Digital Solutions. Building What Comes Next.',
    'subheadline','Software engineering, AI, cybersecurity, cloud and data — designed and delivered with enterprise rigor.',
    'primary_cta','Discuss Your Project','secondary_cta','Explore Our Capabilities'), true),
 ('announcement', jsonb_build_object('enabled', false, 'text', '', 'href', ''), true),
 ('seo_defaults', jsonb_build_object(
    'title_template','%s | Quenvara Technology',
    'description','Enterprise software engineering, AI, cybersecurity, cloud and data services.'), true),
 ('contact_cta', jsonb_build_object(
    'heading','Tell us what you are building.',
    'body','Share a few details and we will respond with next steps.'), true),
 ('footer', jsonb_build_object('summary','Engineering partner for software, AI, security, cloud and data.'), true)
on conflict (key) do nothing;

-- Services (sample) ----------------------------------------------------------
insert into public.services (title, slug, summary, description, category, icon, status, featured, is_sample, sort_order, challenges, deliverables, process_steps) values
('Custom Software Engineering','custom-software-engineering','Bespoke business software designed around how your organisation actually works.','<p>We design and build custom applications that fit your processes instead of forcing your processes to fit a product. Delivery is iterative, documented and test-covered, so you can extend the system with confidence.</p>','Software Engineering','code','published',true,true,1,
  '["Legacy systems that slow the business", "Unclear requirements and shifting scope"]','["Architecture documentation", "Production-ready application", "Automated test suite"]','["Discover", "Design", "Build", "Release", "Support"]'),
('Web Application Development','web-application-development','Fast, accessible and secure web platforms, portals and dashboards.','<p>From customer portals to internal tools, we build modern full-stack web applications with a consistent design system, strong performance and accessibility from day one.</p>','Web Application Development','globe','published',true,true,2,
  '["Fragmented user journeys", "Performance and accessibility gaps"]','["Responsive web application", "Design system", "Deployment pipeline"]','["Discover", "Design", "Build", "Release", "Support"]'),
('Mobile Application Development','mobile-application-development','Native and cross-platform iOS and Android applications.','<p>We build reliable mobile experiences for iOS and Android, with offline-aware design, secure data handling and support through store release.</p>','Mobile Application Development','smartphone','published',false,true,3,
  '["Reaching users on mobile"]','["Mobile applications", "Store release support"]','["Discover", "Design", "Build", "Release", "Support"]'),
('Enterprise Software','enterprise-software','Integrations and internal platforms for larger organisations.','<p>We connect and modernise the systems large organisations depend on, with careful migration planning, role-based access and clear operational documentation.</p>','Enterprise Software','building','published',false,true,4,
  '["Disconnected internal tools"]','["Integrated platform", "Migration plan"]','["Discover", "Design", "Build", "Release", "Support"]'),
('AI & Generative AI','ai-generative-ai','Practical generative AI applications, retrieval and assistants.','<p>We turn AI ideas into evaluated, observable products: retrieval-based assistants, content and document workflows, and integrations that include guardrails and human review.</p>','AI & Generative AI','sparkles','published',true,true,5,
  '["Turning AI experiments into reliable products"]','["Prototype", "Evaluation harness", "Production deployment"]','["Discover", "Prototype", "Evaluate", "Deploy", "Monitor"]'),
('AI Agents and Workflow Automation','ai-agents-workflow-automation','Automating multi-step business workflows with human oversight.','<p>We automate repetitive, multi-step work with agents and workflow engines, adding monitoring, approvals and fallbacks so automation stays safe and auditable.</p>','AI Agents and Workflow Automation','workflow','published',false,true,6,
  '["Manual, repetitive processes"]','["Automated workflows", "Guardrails and monitoring"]','["Discover", "Prototype", "Evaluate", "Deploy", "Monitor"]'),
('Cybersecurity','cybersecurity','Security assessments and secure engineering practices.','<p>We help you find and fix weaknesses before they matter: application and infrastructure assessments, secure-by-design reviews and prioritised remediation roadmaps.</p>','Cybersecurity','shield','published',true,true,7,
  '["Unknown exposure", "Security as an afterthought"]','["Assessment report", "Remediation roadmap"]','["Assess", "Prioritise", "Remediate", "Verify"]'),
('Cloud Engineering','cloud-engineering','Cloud architecture, migration and cost-aware operations.','<p>We design, migrate and operate cloud workloads with infrastructure as code, observability and cost controls built in.</p>','Cloud Engineering','cloud','published',false,true,8,
  '["Cost and reliability of cloud workloads"]','["Reference architecture", "Migration runbook"]','["Discover", "Design", "Build", "Release", "Support"]'),
('Data Engineering and Analytics','data-engineering-analytics','Pipelines, warehouses and analytics you can trust.','<p>We unify scattered data into reliable pipelines and analytics layers, so decisions are made from numbers the whole organisation trusts.</p>','Data Engineering and Analytics','database','published',false,true,9,
  '["Data trapped in silos"]','["Data pipelines", "Analytics layer"]','["Discover", "Design", "Build", "Release", "Support"]'),
('IT Consulting','it-consulting','Technology strategy, architecture review and advisory.','<p>We provide independent advice on architecture, tooling and delivery, producing a clear roadmap your team can act on.</p>','IT Consulting','compass','published',false,true,10,
  '["Unclear technology direction"]','["Strategy document", "Roadmap"]','["Discover", "Design", "Build", "Release", "Support"]')
on conflict (slug) do nothing;

-- Industries (sample) --------------------------------------------------------
insert into public.industries (name, slug, summary, description, status, is_sample, sort_order, challenges, use_cases, cover_image) values
('Financial Services','financial-services','Secure, compliant-ready software and data platforms for financial organisations.','<p>We build customer portals, reporting automation and data platforms for financial teams, with security and auditability designed in. We make no regulatory-compliance claims on your behalf.</p>','published',true,1,'["Legacy core systems", "Data integration"]','["Customer portals", "Reporting automation"]','/images/industries/financial-services.svg'),
('Healthcare','healthcare','Digital tools that reduce friction for care teams and patients.','<p>We help healthcare organisations modernise scheduling, records access and data platforms with privacy-conscious engineering.</p>','published',true,2,'["Fragmented records"]','["Scheduling tools", "Data platforms"]','/images/industries/healthcare.svg'),
('Retail and E-commerce','retail-ecommerce','Commerce platforms and analytics for online and omnichannel retail.','<p>Storefronts, inventory integrations and analytics that help retailers sell consistently across channels.</p>','published',true,3,'["Omnichannel complexity"]','["Storefronts", "Inventory integrations"]','/images/industries/retail-ecommerce.svg'),
('Manufacturing','manufacturing','Operational software and data for modern manufacturers.','<p>Production dashboards, quality tracking and integrations that give operations teams real-time visibility.</p>','published',true,4,'["Visibility across operations"]','["Production dashboards"]','/images/industries/manufacturing.svg'),
('Logistics and Transportation','logistics-transportation','Tracking, routing and coordination tools for moving goods and people.','<p>Fleet, route and shipment tooling that improves visibility from dispatch to delivery.</p>','published',true,5,'["Real-time visibility"]','["Fleet tools"]','/images/industries/logistics-transportation.svg'),
('Technology Startups','technology-startups','Product engineering that helps early-stage teams ship faster.','<p>We help founders go from idea to a dependable MVP, then scale the platform as the product grows.</p>','published',true,6,'["Shipping an MVP quickly"]','["MVP builds"]','/images/industries/technology-startups.svg')
on conflict (slug) do nothing;

-- Technologies (sample; display only what can credibly be delivered) ----------
insert into public.technologies (name, slug, category, status, is_sample, display_order) values
('React','react','Frontend','published',true,1),
('Next.js','nextjs','Frontend','published',true,2),
('TypeScript','typescript','Frontend','published',true,3),
('JavaScript','javascript','Frontend','published',true,4),
('Vue.js','vuejs','Frontend','published',true,5),
('Angular','angular','Frontend','published',true,6),
('Tailwind CSS','tailwind-css','Frontend','published',true,7),
('HTML5 & CSS3','html5-and-css3','Frontend','published',true,8),
('Node.js','nodejs','Backend','published',true,1),
('Supabase','supabase','Backend','published',true,2),
('Express','express','Backend','published',true,3),
('NestJS','nestjs','Backend','published',true,4),
('Django','django','Backend','published',true,5),
('FastAPI','fastapi','Backend','published',true,6),
('Laravel','laravel','Backend','published',true,7),
('Ruby on Rails','ruby-on-rails','Backend','published',true,8),
('GraphQL','graphql','Backend','published',true,9),
('.NET','dotnet','Backend','published',true,10),
('Java','java','Backend','published',true,11),
('Go','go','Backend','published',true,12),
('React Native','react-native','Mobile','published',true,1),
('Flutter','flutter','Mobile','published',true,2),
('Swift','swift','Mobile','published',true,3),
('Kotlin','kotlin','Mobile','published',true,4),
('PostgreSQL','postgresql','Databases','published',true,1),
('MySQL','mysql','Databases','published',true,2),
('MongoDB','mongodb','Databases','published',true,3),
('Redis','redis','Databases','published',true,4),
('Firebase','firebase','Databases','published',true,5),
('Python','python','AI and ML','published',true,1),
('TensorFlow','tensorflow','AI and ML','published',true,2),
('PyTorch','pytorch','AI and ML','published',true,3),
('OpenAI API','openai-api','AI and ML','published',true,4),
('LangChain','langchain','AI and ML','published',true,5),
('Docker','docker','DevOps','published',true,1),
('Kubernetes','kubernetes','DevOps','published',true,2),
('AWS','aws','Cloud','published',true,3),
('Microsoft Azure','microsoft-azure','Cloud','published',true,4),
('Google Cloud','google-cloud','Cloud','published',true,5),
('Terraform','terraform','DevOps','published',true,6),
('GitHub Actions','github-actions','DevOps','published',true,7),
('Linux','linux','DevOps','published',true,8),
('Figma','figma','Frontend','published',true,1),
('Git','git','DevOps','published',true,1),
('Jira','jira','DevOps','published',true,2)
on conflict (slug) do nothing;

-- Projects: clearly labelled concept / internal demo, never client work ---------
insert into public.projects (title, slug, summary, challenge, solution, project_type, status, is_sample, industry_id)
select 'Concept: Operations Dashboard','concept-operations-dashboard',
       '[Concept project] An illustrative dashboard design. Not a client engagement.',
       'A hypothetical scenario used to illustrate our approach.','An illustrative approach, not a client engagement.',
       'concept','published',true,(select id from public.industries where slug='manufacturing')
where not exists (select 1 from public.projects where slug='concept-operations-dashboard');

insert into public.projects (title, slug, summary, challenge, solution, project_type, status, is_sample, industry_id)
select 'Internal Demo: Document Assistant','internal-demo-document-assistant',
       '[Internal demo] A prototype used to explore retrieval-based assistants. Not a client engagement.',
       'Sample content.','Sample content.','internal_demo','published',true,(select id from public.industries where slug='technology-startups')
where not exists (select 1 from public.projects where slug='internal-demo-document-assistant');

-- Products: product concepts only -----------------------------------------------
insert into public.products (name, slug, summary, description, features, benefits, target_audience, pricing_model, product_status, status, is_sample) values
('Sample Product Concept','sample-product-concept','[Concept] An illustrative product idea. Not available.','<p>Sample content. This product is a concept and has not been launched.</p>',
 '["Sample feature one","Sample feature two"]','["Sample benefit"]','Teams exploring the concept','not_announced','concept','published',true)
on conflict (slug) do nothing;

-- FAQs ----------------------------------------------------------------------------
insert into public.faqs (question, answer, category, status, is_sample, display_order) values
('How do we start a project?','Submit the contact form describing your goals and we will follow up.','general','published',true,1),
('Do you work with early-stage teams?','This is sample content. Edit or remove it in the admin panel.','general','published',true,2);

-- Navigation -----------------------------------------------------------------------
insert into public.navigation_items (label, url, location, display_order) values
('Services','/services','header',1),('Industries','/industries','header',2),('Work','/work','header',3),
('Products','/products','header',4),('Insights','/insights','header',5),('About','/about','header',6),
('Careers','/careers','footer_company',1),('Technology','/technology','footer_company',2),('Contact','/contact','footer_company',3),
('Privacy Policy','/legal/privacy-policy','footer_legal',1),('Terms of Use','/legal/terms-of-use','footer_legal',2),
('Cookie Policy','/legal/cookie-policy','footer_legal',3),('Accessibility','/legal/accessibility-statement','footer_legal',4),
('Security Disclosure','/legal/security-disclosure-policy','footer_legal',5);

-- Legal pages: DRAFTS for legal review (not claims of compliance) --------------------
insert into public.pages (title, slug, page_type, status, is_sample, content) values
('Privacy Policy','privacy-policy','legal','draft',true,'<p>DRAFT for legal review. Replace with a reviewed policy before publishing.</p>'),
('Terms of Use','terms-of-use','legal','draft',true,'<p>DRAFT for legal review.</p>'),
('Cookie Policy','cookie-policy','legal','draft',true,'<p>DRAFT for legal review.</p>'),
('Accessibility Statement','accessibility-statement','legal','draft',true,'<p>DRAFT for legal review.</p>'),
('Security Disclosure Policy','security-disclosure-policy','legal','draft',true,'<p>DRAFT for legal review.</p>')
on conflict (slug) do nothing;

-- Draft articles ---------------------------------------------------------------------
insert into public.categories (name, slug) values ('Engineering','engineering'),('AI','ai') on conflict (slug) do nothing;
insert into public.posts (title, slug, excerpt, content, status, is_sample, category_id)
select 'Sample draft: Designing reliable AI features','sample-draft-reliable-ai-features','Sample draft article.','<p>Sample draft content.</p>','draft',true,(select id from public.categories where slug='ai')
where not exists (select 1 from public.posts where slug='sample-draft-reliable-ai-features');

-- Link a couple of sample relations ------------------------------------------------------
insert into public.project_technologies (project_id, technology_id)
select p.id, t.id from public.projects p, public.technologies t
where p.slug='concept-operations-dashboard' and t.slug in ('react','postgresql') on conflict do nothing;
insert into public.service_technologies (service_id, technology_id)
select s.id, t.id from public.services s, public.technologies t
where s.slug='web-application-development' and t.slug in ('react','nextjs','typescript') on conflict do nothing;

-- Remove all sample content before production ------------------------------------------------
create or replace function public.remove_sample_content() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.projects where is_sample;
  delete from public.posts where is_sample;
  delete from public.products where is_sample;
  delete from public.services where is_sample;
  delete from public.industries where is_sample;
  delete from public.technologies where is_sample;
  delete from public.faqs where is_sample;
  delete from public.pages where is_sample;
end $$;
revoke all on function public.remove_sample_content() from public, anon, authenticated;


-- =====================================================================================
-- LOCAL DEVELOPMENT STAFF ACCOUNTS — one per role. DO NOT USE IN PRODUCTION.
-- Password for ALL of them:  Quenvara-Dev-2026!   (change it, or delete them with the function below)
--   owner@quenvara.test | admin@quenvara.test | editor@quenvara.test | sales@quenvara.test | recruiter@quenvara.test
-- Remove before any shared/staging/production use:  select public.remove_dev_staff();
-- =====================================================================================
create extension if not exists pgcrypto with schema extensions;

do $$
declare
  r record;
  uid uuid;
begin
  for r in select * from (values
    ('owner@quenvara.test',     'Dev Owner',         'owner'),
    ('admin@quenvara.test',     'Dev Administrator', 'administrator'),
    ('editor@quenvara.test',    'Dev Editor',        'editor'),
    ('sales@quenvara.test',     'Dev Sales',         'sales'),
    ('recruiter@quenvara.test', 'Dev Recruiter',     'recruiter')
  ) as v(email, full_name, role)
  loop
    select id into uid from auth.users where email = r.email;
    if uid is null then
      uid := gen_random_uuid();
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change, email_change_token_new)
      values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', r.email,
        extensions.crypt('Quenvara-Dev-2026!', extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', r.full_name), now(), now(),
        '', '', '', '');
      insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), uid, uid::text, 'email',
        jsonb_build_object('sub', uid::text, 'email', r.email, 'email_verified', true), now(), now(), now());
    end if;
    insert into public.profiles (id, full_name, role, is_active)
    values (uid, r.full_name, r.role, true)
    on conflict (id) do update set full_name = excluded.full_name, role = excluded.role, is_active = true;
  end loop;
end $$;

create or replace function public.remove_dev_staff() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  delete from auth.users where email like '%@quenvara.test';  -- profiles cascade
end $$;
revoke all on function public.remove_dev_staff() from public, anon, authenticated;
