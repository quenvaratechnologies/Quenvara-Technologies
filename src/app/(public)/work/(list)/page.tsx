import { PageHero, Section, EmptyState } from "@/components/ui/primitives";
import { ProjectCard } from "@/components/cards";
import { FilterBar } from "@/components/forms/filter-bar";
import { getIndustries, getProjects, getServices, getTechnologies } from "@/lib/database/public";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Work & Case Studies", description: "Projects, demos and concept work.", path: "/work" });

export default async function WorkPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [projects, industries, services, techs] = await Promise.all([
    getProjects({ q: sp.q?.slice(0, 100), industry: sp.industry, service: sp.service, technology: sp.technology, type: sp.type }),
    getIndustries(), getServices(), getTechnologies(),
  ]);
  return (
    <>
      <PageHero eyebrow="Work" title="Projects and case studies" description="Every project is labelled: client engagement, internal demo or concept. Outcomes appear only when verified." />
      <Section>
        <FilterBar action="/work" q={sp.q} placeholder="Search projects" selects={[
          { name: "industry", label: "Industry", value: sp.industry, options: industries.map((i) => ({ value: i.slug, label: i.name })) },
          { name: "service", label: "Service", value: sp.service, options: services.map((i) => ({ value: i.slug, label: i.title })) },
          { name: "technology", label: "Technology", value: sp.technology, options: techs.map((i) => ({ value: i.slug, label: i.name })) },
          { name: "type", label: "Type", value: sp.type, options: [{ value: "client", label: "Client engagement" }, { value: "internal_demo", label: "Internal demo" }, { value: "concept", label: "Concept" }, { value: "open_source", label: "Open source" }] },
        ]} />
        <p className="mt-4 text-sm text-muted" role="status">{projects.length} project{projects.length === 1 ? "" : "s"}</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{projects.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
        {projects.length === 0 && <EmptyState title="No projects match" description="Try different filters." />}
      </Section>
    </>
  );
}
