import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Breadcrumbs, LABELS, PageHero, RichText, Section } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { getProject } from "@/lib/database/public";
import { notFoundOrRedirect } from "@/lib/seo/redirect";
import { breadcrumbLd, buildMetadata } from "@/lib/seo";

export const revalidate = 300;
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getProject((await params).slug);
  if (!p) return { title: "Project not found", robots: { index: false } };
  return buildMetadata({ title: p.seo_title || p.title, description: p.seo_description || p.summary, path: `/work/${p.slug}`, image: p.featured_image });
}

export default async function ProjectPage({ params }: P) {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) return notFoundOrRedirect(`/work/${slug}`);
  const list = (v: unknown): string[] => (Array.isArray(v) ? v : []);
  const services = (p.project_services ?? []).map((x: any) => x.services).filter(Boolean);
  const techs = (p.project_technologies ?? []).map((x: any) => x.technologies).filter(Boolean);
  const isClient = p.project_type === "client";
  const gallery = list(p.gallery) as unknown as { url: string; alt?: string }[];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbLd([{ name: "Home", path: "/" }, { name: "Work", path: "/work" }, { name: p.title, path: `/work/${p.slug}` }]) }} />
      <PageHero eyebrow={LABELS[p.project_type]} title={p.title} description={p.summary} />
      <Section>
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Work", href: "/work" }, { name: p.title }]} />
        {!isClient && <div role="note" className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This is a {LABELS[p.project_type].toLowerCase()} — not a completed client engagement.</div>}
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-10">
            {p.featured_image && <Image src={p.featured_image} alt={p.title} width={1200} height={675} className="w-full rounded-xl" unoptimized={!p.featured_image.startsWith("/")} priority />}
            {p.challenge && <div><h2 className="t-section">Business problem</h2><RichText html={p.challenge} className="mt-4" /></div>}
            {p.solution && <div><h2 className="t-section">Solution</h2><RichText html={p.solution} className="mt-4" /></div>}
            {p.outcomes_verified && p.outcomes && <div><h2 className="t-section">Verified outcomes</h2><RichText html={p.outcomes} className="mt-4" /></div>}
            {list(p.deliverables).length > 0 && <div><h2 className="t-section">Deliverables</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-muted">{list(p.deliverables).map((d) => <li key={d}>{d}</li>)}</ul></div>}
            {gallery.length > 0 && <div className="grid gap-4 sm:grid-cols-2">{gallery.map((g, i) => <Image key={i} src={g.url} alt={g.alt ?? ""} width={800} height={450} className="rounded-xl" loading="lazy" unoptimized />)}</div>}
          </div>
          <aside className="space-y-8 text-sm">
            <div className="flex flex-wrap gap-2"><Badge tone={isClient ? "success" : "warning"}>{LABELS[p.project_type]}</Badge>{p.industries && <Link href={`/industries/${p.industries.slug}`}><Badge tone="brand">{p.industries.name}</Badge></Link>}</div>
            {isClient && p.client_permission_confirmed && p.client_display_name && <div><h2 className="t-label text-muted">Client</h2><p className="mt-2">{p.client_display_name}</p></div>}
            {techs.length > 0 && <div><h2 className="t-label text-muted">Technology stack</h2><div className="mt-2 flex flex-wrap gap-2">{techs.map((t: any) => <Badge key={t.slug}>{t.name}</Badge>)}</div></div>}
            {services.length > 0 && <div><h2 className="t-label text-muted">Related services</h2><ul className="mt-2 space-y-1">{services.map((s: any) => <li key={s.slug}><Link href={`/services/${s.slug}`} className="text-brand hover:underline">{s.title}</Link></li>)}</ul></div>}
          </aside>
        </div>
      </Section>
      <Section dark><div className="text-center"><h2 className="t-section">Have a similar challenge?</h2><ButtonLink href="/contact" className="mt-6">Discuss Your Project</ButtonLink></div></Section>
    </>
  );
}
