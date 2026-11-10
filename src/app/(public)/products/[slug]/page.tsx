import type { Metadata } from "next";
import { Badge, Breadcrumbs, LABELS, PageHero, RichText, Section } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { getProduct } from "@/lib/database/public";
import { notFoundOrRedirect } from "@/lib/seo/redirect";
import { breadcrumbLd, buildMetadata } from "@/lib/seo";

export const revalidate = 300;
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return { title: "Product not found", robots: { index: false } };
  return buildMetadata({ title: p.seo_title || p.name, description: p.seo_description || p.summary, path: `/products/${p.slug}`, image: p.cover_image });
}

export default async function ProductPage({ params }: P) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return notFoundOrRedirect(`/products/${slug}`);
  const list = (v: unknown): string[] => (Array.isArray(v) ? v : []);
  const techs = (p.product_technologies ?? []).map((x: any) => x.technologies).filter(Boolean);
  const available = p.product_status === "available" || p.product_status === "beta";
  const safeUrl = (u?: string | null) => (u && /^https?:\/\//.test(u) ? u : null);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbLd([{ name: "Home", path: "/" }, { name: "Products", path: "/products" }, { name: p.name, path: `/products/${p.slug}` }]) }} />
      <PageHero eyebrow={`Product · ${LABELS[p.product_status]}`} title={p.name} description={p.summary}>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={`/contact?service=${encodeURIComponent(p.name)}`}>{available ? "Request access" : "Register interest"}</ButtonLink>
          {safeUrl(p.demo_url) && <ButtonLink href={safeUrl(p.demo_url)!} variant="onDark" target="_blank" rel="noopener noreferrer">View demo</ButtonLink>}
          {safeUrl(p.documentation_url) && <ButtonLink href={safeUrl(p.documentation_url)!} variant="onDark" target="_blank" rel="noopener noreferrer">Documentation</ButtonLink>}
        </div>
      </PageHero>
      <Section>
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Products", href: "/products" }, { name: p.name }]} />
        {!available && <div role="note" className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{p.name} is currently <strong>{LABELS[p.product_status].toLowerCase()}</strong> and is not yet commercially available.</div>}
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-10">
            {p.description && <RichText html={p.description} />}
            {list(p.features).length > 0 && <div><h2 className="t-section">Features</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-muted">{list(p.features).map((f) => <li key={f}>{f}</li>)}</ul></div>}
            {list(p.benefits).length > 0 && <div><h2 className="t-section">Benefits</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-muted">{list(p.benefits).map((f) => <li key={f}>{f}</li>)}</ul></div>}
          </div>
          <aside className="space-y-6 text-sm">
            <div><h2 className="t-label text-muted">Status</h2><p className="mt-2"><Badge tone={available ? "success" : "warning"}>{LABELS[p.product_status]}</Badge></p></div>
            <div><h2 className="t-label text-muted">Pricing</h2><p className="mt-2">{LABELS[p.pricing_model]}</p></div>
            {p.target_audience && <div><h2 className="t-label text-muted">Target users</h2><p className="mt-2 text-muted">{p.target_audience}</p></div>}
            {techs.length > 0 && <div><h2 className="t-label text-muted">Built with</h2><div className="mt-2 flex flex-wrap gap-2">{techs.map((t: any) => <Badge key={t.slug}>{t.name}</Badge>)}</div></div>}
          </aside>
        </div>
      </Section>
    </>
  );
}
