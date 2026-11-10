import Link from "next/link";
import { PageHero, Section, EmptyState, Badge } from "@/components/ui/primitives";
import { searchAll } from "@/lib/database/public";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Search", path: "/search", noindex: true });
const PATHS: Record<string, string> = { service: "/services", product: "/products", project: "/work", post: "/insights" };
const NAMES: Record<string, string> = { service: "Service", product: "Product", project: "Project", post: "Article" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const results = q.trim() ? await searchAll(q.trim()) : [];
  return (
    <>
      <PageHero eyebrow="Search" title="Search the site" />
      <Section>
        <form action="/search" method="get" role="search" className="flex max-w-xl gap-2">
          <label htmlFor="q" className="sr-only">Search</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Search services, projects, products, articles" className="w-full rounded-lg border border-line px-3 py-2.5 text-sm" />
          <button className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white">Search</button>
        </form>
        {q && <p className="mt-6 text-sm text-muted" role="status">{results.length} result{results.length === 1 ? "" : "s"} for “{q}”</p>}
        <ul className="mt-4 divide-y divide-line">{results.map((r) => (
          <li key={`${r.kind}-${r.slug}`} className="py-4"><Link href={`${PATHS[r.kind]}/${r.slug}`} className="font-semibold text-brand hover:underline">{r.title}</Link> <Badge className="ml-2">{NAMES[r.kind]}</Badge><p className="mt-1 text-sm text-muted">{r.summary}</p></li>
        ))}</ul>
        {q && results.length === 0 && <div className="mt-6"><EmptyState title="No results" description="Try different keywords." /></div>}
      </Section>
    </>
  );
}
