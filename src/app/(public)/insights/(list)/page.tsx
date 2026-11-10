import Link from "next/link";
import { PageHero, Section, EmptyState } from "@/components/ui/primitives";
import { PostCard } from "@/components/cards";
import { FilterBar } from "@/components/forms/filter-bar";
import { getCategories, getPosts, getTags } from "@/lib/database/public";
import { buildMetadata } from "@/lib/seo";

const PER_PAGE = 9;
export const metadata = buildMetadata({ title: "Insights", description: "Articles and knowledge from Quenvara Technology.", path: "/insights" });

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; tag?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [{ rows, count }, categories, tags, featured] = await Promise.all([
    getPosts({ q: sp.q?.slice(0, 100), category: sp.category, tag: sp.tag, limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
    getCategories(), getTags(), page === 1 && !sp.q && !sp.category && !sp.tag ? getPosts({ featured: true, limit: 1 }) : Promise.resolve({ rows: [], count: 0 }),
  ]);
  const pages = Math.max(1, Math.ceil(count / PER_PAGE));
  const qs = (n: number) => { const p = new URLSearchParams(); if (sp.q) p.set("q", sp.q); if (sp.category) p.set("category", sp.category); if (sp.tag) p.set("tag", sp.tag); p.set("page", String(n)); return `/insights?${p}`; };
  return (
    <>
      <PageHero eyebrow="Insights" title="Insights & knowledge" description="Engineering perspectives and practical guidance." />
      <Section>
        <FilterBar action="/insights" q={sp.q} placeholder="Search articles" selects={[
          { name: "category", label: "Category", value: sp.category, options: categories.map((c) => ({ value: c.slug, label: c.name })) },
          { name: "tag", label: "Tag", value: sp.tag, options: tags.map((c) => ({ value: c.slug, label: c.name })) },
        ]} />
        {featured.rows[0] && <div className="mt-8"><p className="t-label mb-3 text-brand">Featured</p><PostCard p={featured.rows[0]} /></div>}
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{rows.map((p) => <PostCard key={p.id} p={p} />)}</div>
        {rows.length === 0 && <EmptyState title="No articles found" description="Published articles will appear here." />}
        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-10 flex items-center justify-between text-sm">
            {page > 1 ? <Link className="rounded-lg border border-line px-4 py-2" href={qs(page - 1)}>← Previous</Link> : <span />}
            <span className="text-muted">Page {page} of {pages}</span>
            {page < pages ? <Link className="rounded-lg border border-line px-4 py-2" href={qs(page + 1)}>Next →</Link> : <span />}
          </nav>
        )}
      </Section>
    </>
  );
}
