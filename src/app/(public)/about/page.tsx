import Image from "next/image";
import { ShieldCheck, Eye, Handshake, GitBranch, Search, PenTool, Code2, Rocket, LifeBuoy } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PageHero, RichText, Section, SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import { getPage, getSettings, getTeam, getTestimonials } from "@/lib/database/public";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;
export const metadata = buildMetadata({ title: "About", description: "Who we are, what we believe and how we deliver software, AI, cloud and security engineering.", path: "/about" });

const PRINCIPLES = [
  { i: GitBranch, t: "Engineering rigor", d: "Decisions are explained, tested and documented so teams can own what we build." },
  { i: ShieldCheck, t: "Security first", d: "Threat-aware design and least-privilege access are part of delivery from the first sketch." },
  { i: Eye, t: "Clear communication", d: "Plain language, honest estimates and early visibility into risk." },
  { i: Handshake, t: "Long-term thinking", d: "We optimise for systems that stay maintainable long after launch." },
];
const WAY = [
  { i: Search, t: "Discover", d: "Goals, users and constraints." },
  { i: PenTool, t: "Design", d: "Architecture, UX and a reviewable plan." },
  { i: Code2, t: "Build", d: "Iterative delivery with working demos." },
  { i: Rocket, t: "Release", d: "Controlled rollout and handover." },
  { i: LifeBuoy, t: "Support", d: "Monitoring and continuous improvement." },
];

export default async function AboutPage() {
  const [settings, team, testimonials, page] = await Promise.all([getSettings(), getTeam(), getTestimonials(), getPage("about")]);
  const name = settings.company?.name ?? "Quenvara Technology";
  return (
    <>
      <PageHero eyebrow="About us" title={`About ${name}`} description={settings.company?.description ?? "A technology company building dependable software, AI and cloud systems."} />

      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow="Who we are" title="An engineering partner, not just a vendor" />
            <p className="mt-5 text-muted">{name} designs, builds and operates software for organisations that need it to work reliably. We combine product thinking with disciplined engineering across web and mobile applications, AI and automation, cloud infrastructure, data platforms and cybersecurity.</p>
            <p className="mt-4 text-muted">We keep scope honest, communicate early and document what we deliver, so that your team is never locked out of its own systems.</p>
          </Reveal>
          <Reveal delay={120}><Image src="/images/about/hero.svg" alt="Illustration of an engineering workspace with dashboards and code" width={800} height={500} className="w-full rounded-2xl border border-line shadow-[var(--shadow-card)]" unoptimized priority /></Reveal>
        </div>
      </Section>

      {page?.content && <Section alt><RichText html={page.content} /></Section>}

      <Section alt>
        <div className="grid gap-10 md:grid-cols-2">
          <Reveal className="rounded-2xl border border-line bg-white p-8 shadow-[var(--shadow-card)]"><h2 className="t-section">Mission</h2><p className="mt-4 text-muted">To help organisations design, build and operate dependable digital products and platforms.</p></Reveal>
          <Reveal delay={100} className="rounded-2xl border border-line bg-white p-8 shadow-[var(--shadow-card)]"><h2 className="t-section">Vision</h2><p className="mt-4 text-muted">To grow into a globally capable technology organisation offering engineering services and our own software products, earning trust one delivery at a time.</p></Reveal>
        </div>
      </Section>

      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1"><Image src="/images/about/team.svg" alt="Illustration of a collaborative team around a table" width={800} height={500} className="w-full rounded-2xl border border-line shadow-[var(--shadow-card)]" unoptimized /></Reveal>
          <div className="order-1 lg:order-2">
            <SectionHeading eyebrow="Principles" title="How we think about engineering" />
            <dl className="mt-8 grid gap-5 sm:grid-cols-2">
              {PRINCIPLES.map(({ i: I, t, d }, n) => (
                <Reveal key={t} delay={n * 80}><div className="h-full rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)]"><span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand"><I className="h-5 w-5" aria-hidden /></span><dt className="mt-3 font-semibold">{t}</dt><dd className="mt-1 text-sm text-muted">{d}</dd></div></Reveal>
              ))}
            </dl>
          </div>
        </div>
      </Section>

      <Section alt>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="How we work" title="A clear path from idea to release" />
            <ol className="mt-8 space-y-4">
              {WAY.map(({ i: I, t, d }, n) => (
                <Reveal as="li" key={t} delay={n * 70} className="flex items-start gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[image:var(--grad-brand)] text-white"><I className="h-5 w-5" aria-hidden /></span><div><p className="font-semibold">{t}</p><p className="text-sm text-muted">{d}</p></div></Reveal>
              ))}
            </ol>
          </div>
          <Reveal><Image src="/images/about/security.svg" alt="Shield illustration representing security and reliability" width={800} height={500} className="w-full rounded-2xl border border-line shadow-[var(--shadow-card)]" unoptimized /></Reveal>
        </div>
      </Section>

      {team.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Leadership" title="Team" />
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m) => (
              <li key={m.id} className="rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
                {m.avatar_url && <Image src={m.avatar_url} alt={m.name} width={96} height={96} className="mb-4 h-24 w-24 rounded-full object-cover" unoptimized />}
                <p className="font-semibold">{m.name}</p><p className="text-sm text-brand">{m.role_title}</p><p className="mt-3 text-sm text-muted">{m.bio}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {testimonials.length > 0 && (
        <Section alt>
          <SectionHeading eyebrow="Feedback" title="What people say" />
          <ul className="mt-10 grid gap-5 md:grid-cols-2">{testimonials.map((t) => <li key={t.id}><figure className="rounded-xl border border-line bg-white p-6 shadow-[var(--shadow-card)]"><blockquote className="text-muted">“{t.testimonial_text}”</blockquote><figcaption className="mt-4 text-sm font-semibold">{t.person_name}{(t.job_title || t.company_name) && <span className="block font-normal text-muted">{[t.job_title, t.company_name].filter(Boolean).join(", ")}</span>}</figcaption></figure></li>)}</ul>
        </Section>
      )}
      <Section dark><div className="text-center"><h2 className="t-section">Build with us</h2><p className="mt-3 text-muted">Tell us what you are working on, or see our current openings.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><ButtonLink href="/contact" arrow>Discuss Your Project</ButtonLink><ButtonLink href="/careers" variant="onDark">View careers</ButtonLink></div></div></Section>
    </>
  );
}
