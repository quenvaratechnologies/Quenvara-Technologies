import Link from "next/link";
import { Check } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

type Pkg = { id: string; name: string; tagline?: string | null; price_text: string; billing_note?: string | null; description?: string | null; features?: unknown; highlighted?: boolean; cta_label?: string | null; cta_url?: string | null };
const safeHref = (u?: string | null) => (u && /^(\/|https?:\/\/)/.test(u) ? u : "/contact");

export function PackagesGrid({ packages }: { packages: Pkg[] }) {
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {packages.map((p, i) => {
        const features = Array.isArray(p.features) ? (p.features as string[]) : [];
        return (
          <Reveal key={p.id} delay={(i % 3) * 90} className="h-full">
            <article className={cn("relative flex h-full flex-col rounded-2xl border bg-white p-7 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1", p.highlighted ? "border-brand shadow-[var(--shadow-lift)]" : "border-line")}>
              {p.highlighted && <span className="absolute -top-3 left-7 rounded-full bg-[image:var(--grad-brand)] px-3 py-1 text-xs font-semibold text-white">Recommended</span>}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              {p.tagline && <p className="mt-1 text-sm text-muted">{p.tagline}</p>}
              <p className="mt-5 text-3xl font-semibold tracking-tight">{p.price_text}</p>
              {p.billing_note && <p className="t-meta mt-1">{p.billing_note}</p>}
              {p.description && <p className="mt-4 text-sm text-muted">{p.description}</p>}
              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                {features.map((f) => <li key={f} className="flex gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />{f}</li>)}
              </ul>
              <Link href={safeHref(p.cta_url)} className="btn-sheen btn-grad mt-7 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition hover:brightness-110">{p.cta_label || "Discuss Your Project"}</Link>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
