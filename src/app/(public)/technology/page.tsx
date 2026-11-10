import { PageHero, Section, EmptyState } from "@/components/ui/primitives";
import { getTechnologies } from "@/lib/database/public";
import { TECH_CATEGORIES } from "@/config/content-types";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;
export const metadata = buildMetadata({ title: "Technology", description: "Technologies and capabilities we work with.", path: "/technology" });

export default async function TechnologyPage() {
  const techs = await getTechnologies();
  return (
    <>
      <PageHero eyebrow="Technology" title="Technology expertise" description="Only technologies we can credibly deliver with our team or verified partners." />
      <Section>
        {techs.length === 0 ? <EmptyState title="No technologies published yet" /> : (
          <div className="grid gap-10 md:grid-cols-2">
            {TECH_CATEGORIES.filter((c) => techs.some((t) => t.category === c)).map((cat) => (
              <section key={cat} aria-labelledby={`t-${cat}`}>
                <h2 id={`t-${cat}`} className="t-label text-brand">{cat}</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {techs.filter((t) => t.category === cat).map((t) => (
                    <li key={t.id} className="rounded-xl border border-line p-4"><p className="font-medium">{t.name}</p>{t.description && <p className="mt-1 text-sm text-muted">{t.description}</p>}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
