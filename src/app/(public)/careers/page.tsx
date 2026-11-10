import Link from "next/link";
import { PageHero, Section, EmptyState, LABELS } from "@/components/ui/primitives";
import { getJobs } from "@/lib/database/public";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;
export const metadata = buildMetadata({ title: "Careers", description: "Current openings at Quenvara Technology.", path: "/careers" });

export default async function CareersPage() {
  const jobs = await getJobs();
  return (
    <>
      <PageHero eyebrow="Careers" title="Work with us" description="We publish roles only when we are genuinely hiring." />
      <Section>
        {jobs.length === 0 ? (
          <EmptyState title="There are no published openings right now" description="We are not currently advertising any roles. Check back soon or follow our updates." />
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {jobs.map((j) => (
              <li key={j.id}><Link href={`/careers/${j.slug}`} className="flex flex-wrap items-center justify-between gap-3 p-5 hover:bg-surface-alt">
                <div><p className="font-semibold">{j.title}</p><p className="text-sm text-muted">{[j.department, j.location, LABELS[j.employment_type]].filter(Boolean).join(" · ")}</p></div>
                <span className="text-sm font-medium text-brand">View role →</span>
              </Link></li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
