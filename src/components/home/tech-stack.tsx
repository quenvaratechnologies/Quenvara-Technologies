import { Reveal } from "@/components/ui/reveal";
import { TechCloud, type CloudItem } from "@/components/home/tech-cloud";
import { TECH_LOGOS } from "@/data/tech-logos";

type Tech = { id: string; name: string; slug?: string; category?: string | null };

/** The 8 technologies shown on the tilted board (left side), independent of the database list. */
const BOARD = [
  { name: "React", slug: "react" },
  { name: "Next.js", slug: "nextjs" },
  { name: "Ruby on Rails", slug: "ruby-on-rails" },
  { name: "HTML5", slug: "html5-and-css3" },
  { name: "AWS", slug: "aws" },
  { name: "Node.js", slug: "nodejs" },
  { name: "Docker", slug: "docker" },
  { name: "Figma", slug: "figma" },
];

export function TechStack({ techs, title, intro }: { techs: Tech[]; title?: string; intro?: string }) {
  if (!techs.length) return null;
  const items: CloudItem[] = techs.map((t) => ({ id: t.id, name: t.name, logo: (t.slug && TECH_LOGOS[t.slug]) || null }));
  return (
    <section aria-labelledby="techstack-h" className="relative overflow-hidden bg-white py-16 sm:py-24">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-3xl">
          <p className="t-label mb-3 text-brand">Tech Stack</p>
          <h2 id="techstack-h" className="t-section">{title || "The full spectrum of modern engineering"}</h2>
          <p className="mt-3 text-muted">{intro || "Our stack spans front-end and back-end frameworks, mobile, data and AI, cloud infrastructure and delivery automation, chosen for each project rather than by habit."}</p>
        </Reveal>
        <div className="mt-12 grid items-center gap-12 lg:grid-cols-2">
          <div className="ts-board mx-auto w-full max-w-md py-6" aria-hidden>
            <div className="ts-tilt">
              <ul className="ts-grid2">
                {BOARD.map((b, i) => {
                  const logo = TECH_LOGOS[b.slug];
                  return (
                    <li key={b.slug} className="ts-card flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-4 shadow-[var(--shadow-card)]" style={{ animationDelay: `${i * 450}ms` }}>
                      {logo && <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0"><path d={logo.path} fill={logo.hex} /></svg>}
                      <span className="text-sm font-semibold text-ink">{b.name}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <TechCloud items={items} />
        </div>
      </div>
    </section>
  );
}