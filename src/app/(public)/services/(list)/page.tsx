import { PageHero, Section, EmptyState } from "@/components/ui/primitives";
import { ServiceCard } from "@/components/cards";
import { FilterBar } from "@/components/forms/filter-bar";
import { getServices } from "@/lib/database/public";
import { SERVICE_CATEGORIES } from "@/config/content-types";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Services", description: "Software engineering, AI, cybersecurity, cloud, data and consulting services.", path: "/services" });

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { q, category } = await searchParams;
  const services = await getServices({ q: q?.slice(0, 100), category });
  return (
    <>
      <PageHero eyebrow="Services" title="What we do" description="Engineering services across software, AI, security, cloud and data." />
      <Section>
        <FilterBar action="/services" q={q} placeholder="Search services" selects={[{ name: "category", label: "Category", value: category, options: SERVICE_CATEGORIES.map((c) => ({ value: c, label: c })) }]} />
        <p className="mt-4 text-sm text-muted" role="status">{services.length} service{services.length === 1 ? "" : "s"}</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{services.map((s) => <ServiceCard key={s.id} s={s} />)}</div>
        {services.length === 0 && <EmptyState title="No services found" description="Try a different search or clear the filters." />}
      </Section>
    </>
  );
}
