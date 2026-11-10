import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs, PageHero, RichText, Section, Badge } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { ProjectCard } from "@/components/cards";
import { getRelatedProjectsForService, getService } from "@/lib/database/public";
import { notFoundOrRedirect } from "@/lib/seo/redirect";
import { breadcrumbLd, buildMetadata, jsonLd } from "@/lib/seo";

export const revalidate = 300;
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const s = await getService(slug);
  if (!s) return { title: "Service not found", robots: { index: false } };
  return buildMetadata({ title: s.seo_title || s.title, description: s.seo_description || s.summary, path: `/services/${s.slug}`, image: s.cover_image });
}

export default async function ServicePage({ params }: P) {
  const { slug } = await params;
  const s = await getService(slug);
  if (!s) return notFoundOrRedirect(`/services/${slug}`);
  const projects = await getRelatedProjectsForService(s.id);
  const industries = (s.service_industries ?? []).map((x: any) => x.industries).filter(Boolean);
  const techs = (s.service_technologies ?? []).map((x: any) => x.technologies).filter(Boolean);
  const faqs = (s.service_faqs ?? []).map((x: any) => x.faqs).filter(Boolean).sort((a: any, b: any) => a.display_order - b.display_order);
  const list = (v: unknown): string[] => (Array.isArray(v) ? v : []);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbLd([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, { name: s.title, path: `/services/${s.slug}` }]) }} />
      {faqs.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@type": "FAQPage", mainEntity: faqs.map((f: any) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) }) }} />}
      <PageHero eyebrow={s.category} title={s.title} description={s.summary}>
        <ButtonLink href={`/contact?service=${encodeURIComponent(s.title)}`} className="mt-8">Discuss this service</ButtonLink>
      </PageHero>
      <Section>
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Services", href: "/services" }, { name: s.title }]} />
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-12">
            {s.description && <RichText html={s.description} />}
            {list(s.challenges).length > 0 && (<div><h2 className="t-section">Challenges we address</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-muted">{list(s.challenges).map((c) => <li key={c}>{c}</li>)}</ul></div>)}
            {list(s.deliverables).length > 0 && (<div><h2 className="t-section">Typical deliverables</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-muted">{list(s.deliverables).map((c) => <li key={c}>{c}</li>)}</ul></div>)}
            {list(s.process_steps).length > 0 && (<div><h2 className="t-section">Engagement process</h2><ol className="mt-4 grid gap-3 sm:grid-cols-2">{list(s.process_steps).map((c, i) => <li key={c} className="rounded-xl border border-line p-4"><span className="t-label text-brand">Step {i + 1}</span><p className="mt-1 font-medium">{c}</p></li>)}</ol></div>)}
            {faqs.length > 0 && (<div><h2 className="t-section">FAQs</h2><div className="mt-4 divide-y divide-line rounded-xl border border-line">{faqs.map((f: any) => <details key={f.id} className="group p-4"><summary className="cursor-pointer font-medium">{f.question}</summary><p className="mt-2 text-muted">{f.answer}</p></details>)}</div></div>)}
          </div>
          <aside className="space-y-8">
            {techs.length > 0 && <div><h2 className="t-label text-muted">Technologies</h2><div className="mt-3 flex flex-wrap gap-2">{techs.map((t: any) => <Badge key={t.slug}>{t.name}</Badge>)}</div></div>}
            {industries.length > 0 && <div><h2 className="t-label text-muted">Industries served</h2><ul className="mt-3 space-y-1 text-sm">{industries.map((i: any) => <li key={i.slug}><Link className="text-brand hover:underline" href={`/industries/${i.slug}`}>{i.name}</Link></li>)}</ul></div>}
          </aside>
        </div>
      </Section>
      {projects.length > 0 && <Section alt><h2 className="t-section">Related work</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{projects.map((p: any) => <ProjectCard key={p.slug} p={p} />)}</div></Section>}
      <Section dark><div className="text-center"><h2 className="t-section">Ready to talk about {s.title.toLowerCase()}?</h2><ButtonLink href={`/contact?service=${encodeURIComponent(s.title)}`} className="mt-6">Discuss Your Project</ButtonLink></div></Section>
    </>
  );
}
