import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck, GitBranch, Eye, Handshake, Cloud, Brain, Shield, Code2, ArrowRight, Quote } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container, EmptyState, Section, SectionHeading } from "@/components/ui/primitives";
import { IndustryCard, PostCard, ProductCard, ProjectCard, ServiceCard } from "@/components/cards";
import { getIndustries, getPackages, getPosts, getProducts, getProjects, getServices, getSettings, getTechnologies, getTestimonials } from "@/lib/database/public";
import { TechStack } from "@/components/home/tech-stack";
import { PackagesGrid } from "@/components/home/packages-grid";
import { buildMetadata, jsonLd } from "@/lib/seo";
import { Reveal } from "@/components/ui/reveal";
import { getBranding } from "@/lib/branding";
import { splitHeadline } from "@/lib/text";
import { siteUrl } from "@/lib/env";

export const revalidate = 300;
export async function generateMetadata(): Promise<Metadata> {
  const b = await getBranding();
  const title = b.tagline ? `${b.name} — ${b.tagline.replace(/\.$/, "")}` : b.name;
  return { ...buildMetadata({ title, description: b.description, path: "/", image: b.logo }), title: { absolute: title } };
}

const PROCESS = [
  { t: "Discover", d: "Clarify goals, constraints and success measures with your stakeholders." },
  { t: "Design", d: "Shape architecture, UX and a delivery plan you can review before build starts." },
  { t: "Build", d: "Iterative engineering with automated testing and regular working demos." },
  { t: "Release", d: "Controlled rollout with documentation and handover." },
  { t: "Support", d: "Ongoing improvement, monitoring and maintenance as needed." },
];
const PRINCIPLES = [
  { i: ShieldCheck, t: "Security by default", d: "Threat-aware design and least-privilege access are part of delivery, not an add-on." },
  { i: Eye, t: "Transparent delivery", d: "You see plans, progress and trade-offs as work happens." },
  { i: GitBranch, t: "Maintainable engineering", d: "Readable code, tests and documentation so teams can own what we build." },
  { i: Handshake, t: "Honest scoping", d: "We state what we can deliver and what we cannot." },
];
const AI_ITEMS = ["Generative AI applications and retrieval-based assistants", "Machine learning model development and evaluation", "AI agents and workflow automation with human oversight", "Data foundations that make AI reliable"];

export default async function HomePage() {
  const [settings, branding, services, industries, projects, products, techs, posts, packages, testimonials] = await Promise.all([
    getSettings(), getBranding(), getServices({ limit: 6, featured: true }), getIndustries(6), getProjects({ limit: 3 }), getProducts({ limit: 3 }), getTechnologies(), getPosts({ limit: 3 }), getPackages(), getTestimonials(),
  ]);
  const hero = settings.hero ?? {};
  const hs = settings.homepage_sections ?? {};
  const show = (k: string) => !hs[`hide_${k}`];
  const featuredServices = services.length ? services : await getServices({ limit: 6 });
  const grouped = techs.reduce<Record<string, string[]>>((a, t) => { (a[t.category] ??= []).push(t.name); return a; }, {});
  const [h1, h2] = splitHeadline(hero.headline ?? "Engineering Digital Solutions. Building What Comes Next.");
  const starters = featuredServices.slice(0, 6);
  const intro = settings.company?.description || branding.description;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@type": "Organization", name: branding.name, url: siteUrl(), ...(branding.logo ? { logo: branding.logo.startsWith("/") ? siteUrl() + branding.logo : branding.logo } : {}), ...(branding.email ? { email: branding.email } : {}) }) }} />

      {/* Hero — light corporate */}
      <div className="hero-light relative isolate overflow-hidden border-b border-line">
        <div className="bg-grid bg-grid-fade absolute inset-0 -z-10 opacity-60" aria-hidden />
        <Container className="relative grid items-center gap-14 py-20 sm:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:py-32">
          <div>
            <p className="animate-fade-up t-label mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-brand shadow-sm">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />{branding.name}
            </p>
            <h1 className="t-hero animate-fade-up max-w-3xl text-ink" style={{ "--d": "100ms" } as React.CSSProperties}>
              {h2 ? <>{h1} <span className="text-grad">{h2}</span></> : h1}
            </h1>
            <p className="animate-fade-up mt-6 max-w-xl text-lg text-muted" style={{ "--d": "220ms" } as React.CSSProperties}>{hero.subheadline ?? "Software engineering, AI, cybersecurity, cloud and data."}</p>
            <div className="animate-fade-up mt-10 flex flex-wrap gap-3" style={{ "--d": "340ms" } as React.CSSProperties}>
              <ButtonLink href="/contact" arrow className="px-6 py-3 text-base">{hero.primary_cta ?? "Get in Touch"}</ButtonLink>
              <ButtonLink href="#capabilities" variant="secondary" className="px-6 py-3 text-base">{hero.secondary_cta ?? "Explore Our Capabilities"}</ButtonLink>
            </div>
          </div>
          <div className="animate-fade-in relative hidden lg:block" style={{ "--d": "300ms" } as React.CSSProperties} aria-hidden>
            <div className="rounded-2xl border border-line bg-white shadow-[0_30px_70px_-34px_rgba(200,16,46,0.45)]">
              <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-brand/70" /><span className="h-2.5 w-2.5 rounded-full bg-black/20" /><span className="h-2.5 w-2.5 rounded-full bg-black/10" />
                <span className="ml-3 text-xs text-muted">architecture.ts</span>
              </div>
              <div className="space-y-3 p-5">
                {[["w-2/5", "bg-brand/60"], ["w-4/5", ""], ["w-3/5", ""], ["w-1/2", "bg-brand/60"], ["w-4/6", ""], ["w-2/5", ""]].map(([w, c], i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-4 text-right text-[10px] text-slate-400">{i + 1}</span>
                    <span className={`shimmer h-2.5 rounded ${w} ${c}`} style={{ animationDelay: `${i * 220}ms` }} />
                  </div>
                ))}
              </div>
            </div>
            {[
              { I: Cloud, t: "Cloud", c: "-left-8 top-10", d: "0ms" },
              { I: Brain, t: "AI", c: "-right-4 top-24", d: "900ms" },
              { I: Shield, t: "Security", c: "-left-4 bottom-6", d: "1700ms" },
              { I: Code2, t: "Engineering", c: "right-8 -bottom-5", d: "400ms" },
            ].map(({ I, t, c, d }) => (
              <span key={t} className={`animate-float absolute ${c} inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink shadow-lg`} style={{ "--d": d } as React.CSSProperties}>
                <I className="h-4 w-4 text-brand" />{t}
              </span>
            ))}
          </div>
        </Container>
      </div>

      {show("intro") && (
        <Section>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <SectionHeading eyebrow="About us" title={`Meet ${branding.name}`} />
            <Reveal>
              <p className="text-lg text-muted">{intro}</p>
              <Link href="/about" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">Learn more about us <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </Reveal>
          </div>
        </Section>
      )}

      {show("services") && (
        <Section id="capabilities" alt>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Services" title="Services across the engineering lifecycle" description="From product engineering to cloud, data, AI and security." />
            <Link href="/services" className="text-sm font-medium text-brand hover:underline">All services →</Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.length ? featuredServices.map((s, i) => <Reveal key={s.id} delay={(i % 3) * 90} className="h-full"><ServiceCard s={s} /></Reveal>) : <div className="sm:col-span-2 lg:col-span-3"><EmptyState title="Services are being prepared" description="Published services will appear here." /></div>}
          </div>
          {starters.length > 0 && (
            <Reveal className="mt-10 flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-card)] lg:flex-row lg:items-center lg:justify-between">
              <div><h3 className="font-semibold">What would you like to build?</h3><p className="text-sm text-muted">Pick a starting point — we will pre-fill your enquiry.</p></div>
              <ul className="flex flex-wrap gap-2.5">
                {starters.map((s) => (
                  <li key={s.id}><Link href={`/contact?service=${encodeURIComponent(s.title)}`} className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-brand hover:text-brand">{s.title}<ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" aria-hidden /></Link></li>
                ))}
                <li><Link href="/contact" className="btn-grad inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 hover:brightness-110">Something else<ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link></li>
              </ul>
            </Reveal>
          )}
        </Section>
      )}

      {show("expertise") && (
        <Section dark>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionHeading eyebrow="Technology expertise" title="Practical AI and modern engineering, built to be reliable" description="We focus on evaluated, observable systems that fit into real workflows." />
              <ul className="mt-8 space-y-3 text-muted">{AI_ITEMS.map((a) => <li key={a} className="flex gap-3"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{a}</li>)}</ul>
              <ButtonLink href="/services" variant="onDark" className="mt-8">Explore services</ButtonLink>
            </div>
            {Object.keys(grouped).length > 0 && (
              <dl className="grid gap-5 sm:grid-cols-2">
                {Object.entries(grouped).map(([cat, names]) => (
                  <div key={cat} className="rounded-xl border border-line bg-surface p-5"><dt className="t-label text-brand">{cat}</dt><dd className="mt-2 text-sm text-muted">{names.join(" · ")}</dd></div>
                ))}
              </dl>
            )}
          </div>
        </Section>
      )}

      {show("techstack") && <TechStack techs={techs as never} title={hs.techstack_title} />}

      {show("industries") && industries.length > 0 && (
        <Section alt>
          <SectionHeading eyebrow="Industries" title="Context matters" description="Domain understanding shapes the right solution." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{industries.map((i, n) => <Reveal key={i.id} delay={(n % 3) * 90} className="h-full"><IndustryCard i={i} /></Reveal>)}</div>
        </Section>
      )}

      {show("projects") && (
        <Section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Work" title="Selected projects" description="Concept and demo projects are labelled clearly; only verified client work is presented as such." />
            <Link href="/work" className="text-sm font-medium text-brand hover:underline">All projects →</Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {projects.length ? projects.map((p, n) => <Reveal key={p.id} delay={n * 90} className="h-full"><ProjectCard p={p} /></Reveal>) : <div className="md:col-span-3"><EmptyState title="No published projects yet" /></div>}
          </div>
          {products.length > 0 && (
            <div className="mt-14">
              <div className="flex flex-wrap items-end justify-between gap-4"><h3 className="t-section">Our own software</h3><Link href="/products" className="text-sm font-medium text-brand hover:underline">All products →</Link></div>
              <div className="mt-6 grid gap-5 md:grid-cols-3">{products.map((p, n) => <Reveal key={p.id} delay={n * 90} className="h-full"><ProductCard p={p} /></Reveal>)}</div>
            </div>
          )}
        </Section>
      )}

      {show("packages") && packages.length > 0 && (
        <Section alt>
          <SectionHeading eyebrow="Packages" title="Packages & pricing" description="Clear packages for common engagements." />
          <PackagesGrid packages={packages as never} />
        </Section>
      )}

      {show("why") && (
        <Section>
          <SectionHeading eyebrow="Why choose us" title="Principles we commit to" description="Commitments about how we operate — not claims about size or track record." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRINCIPLES.map(({ i: I, t, d }, n) => (
              <Reveal key={t} delay={n * 90} className="h-full"><div className="group h-full rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-brand/40"><span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand transition-transform duration-300 group-hover:scale-110"><I className="h-5 w-5" aria-hidden /></span><h3 className="mt-4 font-semibold">{t}</h3><p className="mt-2 text-sm text-muted">{d}</p></div></Reveal>
            ))}
          </div>
        </Section>
      )}

      {show("process") && (
        <Section alt>
          <SectionHeading eyebrow="Development process" title="A clear path from idea to release" />
          <ol className="mt-10 grid gap-4 md:grid-cols-5">
            {PROCESS.map((p, i) => (
              <Reveal as="li" key={p.t} delay={i * 110} className="relative rounded-xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-brand/40">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[image:var(--grad-brand)] text-xs font-bold text-white">{i + 1}</span>
                <h3 className="mt-4 font-semibold">{p.t}</h3>
                <p className="mt-2 text-sm text-muted">{p.d}</p>
              </Reveal>
            ))}
          </ol>
        </Section>
      )}

      {show("testimonials") && testimonials.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Client testimonials" title="What clients say" description="Published only with written permission." />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.slice(0, 3).map((t, n) => (
              <Reveal key={t.id} delay={n * 90} className="h-full">
                <figure className="flex h-full flex-col rounded-xl border border-line bg-white p-6 shadow-[var(--shadow-card)]">
                  <Quote className="h-6 w-6 text-brand" aria-hidden />
                  <blockquote className="mt-3 flex-1 text-sm text-muted">{t.testimonial_text}</blockquote>
                  <figcaption className="mt-5 text-sm"><span className="font-semibold">{t.person_name}</span>{(t.job_title || t.company_name) && <span className="block text-muted">{[t.job_title, t.company_name].filter(Boolean).join(", ")}</span>}</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {show("insights") && posts.rows.length > 0 && (
        <Section alt>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Insights" title="Latest articles" />
            <Link href="/insights" className="text-sm font-medium text-brand hover:underline">All insights →</Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">{posts.rows.map((p, n) => <Reveal key={p.id} delay={n * 90} className="h-full"><PostCard p={p} /></Reveal>)}</div>
        </Section>
      )}
    </>
  );
}
