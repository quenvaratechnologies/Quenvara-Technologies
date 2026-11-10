import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs, Container, RichText } from "@/components/ui/primitives";
import { PostCard } from "@/components/cards";
import { getPost, getRelatedPosts } from "@/lib/database/public";
import { notFoundOrRedirect } from "@/lib/seo/redirect";
import { breadcrumbLd, buildMetadata, jsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/env";
import { formatDate, readingTime } from "@/lib/utils";

export const revalidate = 300;
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getPost((await params).slug);
  if (!p) return { title: "Article not found", robots: { index: false } };
  const m = buildMetadata({ title: p.seo_title || p.title, description: p.seo_description || p.excerpt, path: `/insights/${p.slug}`, image: p.cover_image, type: "article" });
  if (p.canonical_url && /^https?:\/\//.test(p.canonical_url)) m.alternates = { canonical: p.canonical_url };
  return m;
}

export default async function PostPage({ params }: P) {
  const { slug } = await params;
  const p = await getPost(slug);
  if (!p) return notFoundOrRedirect(`/insights/${slug}`);
  const related = await getRelatedPosts(p.id, p.category_id);
  const tags = (p.post_tags ?? []).map((x: any) => x.tags).filter(Boolean);
  const url = `${siteUrl()}/insights/${p.slug}`;
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbLd([{ name: "Home", path: "/" }, { name: "Insights", path: "/insights" }, { name: p.title, path: `/insights/${p.slug}` }]) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@type": "Article", headline: p.title, datePublished: p.published_at, dateModified: p.updated_at, mainEntityOfPage: url, ...(p.team_members?.name ? { author: { "@type": "Person", name: p.team_members.name } } : {}), ...(p.cover_image ? { image: p.cover_image } : {}) }) }} />
      <Container className="max-w-3xl py-14">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Insights", href: "/insights" }, { name: p.title }]} />
        {p.categories && <p className="t-label text-brand">{p.categories.name}</p>}
        <h1 className="t-page mt-3">{p.title}</h1>
        <p className="t-meta mt-4">{formatDate(p.published_at)} · {readingTime(p.content)} min read{p.team_members?.name ? ` · ${p.team_members.name}` : ""}</p>
        {p.cover_image && <Image src={p.cover_image} alt={p.title} width={1200} height={630} className="mt-8 w-full rounded-xl" unoptimized priority />}
        <RichText html={p.content} className="mt-10" />
        {tags.length > 0 && <ul className="mt-10 flex flex-wrap gap-2">{tags.map((t: any) => <li key={t.slug}><Link href={`/insights?tag=${t.slug}`} className="rounded-full border border-line px-3 py-1 text-sm">#{t.name}</Link></li>)}</ul>}
        {p.team_members && <div className="mt-12 rounded-xl border border-line p-6"><p className="t-label text-muted">About the author</p><p className="mt-2 font-semibold">{p.team_members.name}</p><p className="text-sm text-muted">{p.team_members.role_title}</p><p className="mt-2 text-sm text-muted">{p.team_members.bio}</p></div>}
      </Container>
      {related.length > 0 && <div className="bg-surface-alt py-14"><Container><h2 className="t-section">Related articles</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{related.map((r: any) => <PostCard key={r.slug} p={r} />)}</div></Container></div>}
    </article>
  );
}
