import type { Metadata } from "next";
import { Breadcrumbs, PageHero, RichText, Section, EmptyState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { ProjectCard } from "@/components/cards";
import { getIndustry, getProjects } from "@/lib/database/public";
import { notFoundOrRedirect } from "@/lib/seo/redirect";
import { breadcrumbLd, buildMetadata } from "@/lib/seo";

export const revalidate = 300;
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const i = await getIndustry((await params).slug);
  if (!i) return { title: "Industry not found", robots: { index: false } };
  return buildMetadata({ title: i.seo_title || i.name, description: i.seo_description || i.summary, path: `/industries/${i.slug}`, image: i.cover_image });
}

export default async function IndustryPage({ params }: P) {
  const { slug } = await params;
  const i = await getIndustry(slug);
  if (!i) return notFoundOrRedirect(`/industries/${slug}`);
  const projects = await getProjects({ industry: i.slug });
  const list = (v: unknown): string[] => (Array.isArray(v) ? v : []);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbLd([{ name: "Home", path: "/" }, { name: "Industries", path: "/industries" }, { name: i.name, path: `/industries/${i.slug}` }]) }} />
      <PageHero eyebrow="Industry" title={i.name} description={i.summary} />
      <Section>
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Industries", href: "/industries" }, { name: i.name }]} />
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={i.cover_image || `/images/industries/${i.slug}.svg`} alt={`${i.name} illustration`} className="w-full rounded-2xl border border-line shadow-[var(--shadow-card)]" />
            {i.description && <RichText html={i.description} />}
          </div>
          <div className="space-y-8">
            {list(i.challenges).length > 0 && <div><h2 className="t-section">Common challenges</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-muted">{list(i.challenges).map((c) => <li key={c}>{c}</li>)}</ul></div>}
            {list(i.use_cases).length > 0 && <div><h2 className="t-section">Use cases</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-muted">{list(i.use_cases).map((c) => <li key={c}>{c}</li>)}</ul></div>}
          </div>
        </div>
      </Section>
      <Section alt>
        <h2 className="t-section">Related projects</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">{projects.length ? projects.map((p) => <ProjectCard key={p.id} p={p} />) : <div className="md:col-span-3"><EmptyState title="No published projects in this industry yet" /></div>}</div>
      </Section>
      <Section dark><div className="text-center"><h2 className="t-section">Building for {i.name.toLowerCase()}?</h2><ButtonLink href="/contact" className="mt-6">Discuss Your Project</ButtonLink></div></Section>
    </>
  );
}
