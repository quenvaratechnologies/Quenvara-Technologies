import type { Metadata } from "next";
import { Breadcrumbs, LABELS, PageHero, RichText, Section } from "@/components/ui/primitives";
import { ApplyForm } from "@/components/forms/apply-form";
import { getJob } from "@/lib/database/public";
import { notFoundOrRedirect } from "@/lib/seo/redirect";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const j = await getJob((await params).slug);
  if (!j) return { title: "Role not found", robots: { index: false } };
  return buildMetadata({ title: j.title, description: `${j.title} — ${j.department}`, path: `/careers/${j.slug}` });
}

export default async function JobPage({ params }: P) {
  const { slug } = await params;
  const j = await getJob(slug);
  if (!j) return notFoundOrRedirect(`/careers/${slug}`);
  return (
    <>
      <PageHero eyebrow={[j.department, LABELS[j.employment_type]].filter(Boolean).join(" · ")} title={j.title} description={j.location} />
      <Section>
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Careers", href: "/careers" }, { name: j.title }]} />
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            {j.description && <div><h2 className="t-section">About the role</h2><RichText html={j.description} className="mt-4" /></div>}
            {j.requirements && <div><h2 className="t-section">Requirements</h2><RichText html={j.requirements} className="mt-4" /></div>}
          </div>
          <div><h2 className="t-section">Apply</h2><div className="mt-6"><ApplyForm jobId={j.id} /></div></div>
        </div>
      </Section>
    </>
  );
}
