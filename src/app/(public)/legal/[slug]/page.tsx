import type { Metadata } from "next";
import { Breadcrumbs, Container, RichText } from "@/components/ui/primitives";
import { getPage } from "@/lib/database/public";
import { notFoundOrRedirect } from "@/lib/seo/redirect";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getPage((await params).slug);
  if (!p) return { title: "Page not found", robots: { index: false } };
  return buildMetadata({ title: p.seo_title || p.title, description: p.seo_description, path: `/legal/${p.slug}` });
}

export default async function LegalPage({ params }: P) {
  const { slug } = await params;
  const p = await getPage(slug);
  if (!p) return notFoundOrRedirect(`/legal/${slug}`);
  return (
    <Container className="max-w-3xl py-14">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: p.title }]} />
      <h1 className="t-page">{p.title}</h1>
      <p className="t-meta mt-3">Last updated {formatDate(p.updated_at)}</p>
      <RichText html={p.content} className="mt-8" />
    </Container>
  );
}
