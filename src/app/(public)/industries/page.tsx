import { PageHero, Section, EmptyState } from "@/components/ui/primitives";
import { IndustryCard } from "@/components/cards";
import { getIndustries } from "@/lib/database/public";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;
export const metadata = buildMetadata({ title: "Industries", description: "Industry contexts we build technology solutions for.", path: "/industries" });

export default async function IndustriesPage() {
  const industries = await getIndustries();
  return (
    <>
      <PageHero eyebrow="Industries" title="Industries we serve" description="Solutions shaped by the realities of each sector." />
      <Section>
        {industries.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{industries.map((i) => <IndustryCard key={i.id} i={i} />)}</div> : <EmptyState title="No industries published yet" />}
      </Section>
    </>
  );
}
