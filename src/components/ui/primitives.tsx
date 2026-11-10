import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeRichText } from "@/lib/security/sanitize";
import { Reveal } from "@/components/ui/reveal";

export function Container({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8", className)} {...p} />;
}

export function Section({ className, alt, dark, children, id, ...p }: React.HTMLAttributes<HTMLElement> & { alt?: boolean; dark?: boolean }) {
  return (
    <section id={id} className={cn("py-16 sm:py-24", alt && "bg-surface-alt", dark && "theme-dark bg-navy text-ink", className)} {...p}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, description, className, as: Tag = "h2" }: { eyebrow?: string; title: string; description?: string; className?: string; as?: "h1" | "h2" }) {
  return (
    <Reveal className={cn("max-w-3xl", className)}>
      {eyebrow && <p className="t-label mb-3 text-brand">{eyebrow}</p>}
      <Tag className={Tag === "h1" ? "t-page" : "t-section"}>{title}</Tag>
      {description && <p className="mt-4 text-lg text-muted">{description}</p>}
    </Reveal>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "brand" | "success" | "warning" | "danger"; className?: string }) {
  const tones = {
    neutral: "bg-surface-alt text-muted border-line",
    brand: "bg-blue-50 text-blue-800 border-blue-200",
    success: "bg-green-50 text-green-800 border-green-200",
    warning: "bg-amber-50 text-amber-900 border-amber-200",
    danger: "bg-red-50 text-red-800 border-red-200",
  };
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div role="status" className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {it.href ? <Link href={it.href} className="hover:text-brand hover:underline">{it.name}</Link> : <span aria-current="page" className="text-ink">{it.name}</span>}
            {i < items.length - 1 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Renders CMS HTML. Always sanitised at render time, regardless of how it was stored. */
export function RichText({ html, className }: { html: string; className?: string }) {
  return <div className={cn("prose-av", className)} dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }} />;
}

export function PageHero({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="hero-light relative isolate overflow-hidden border-b border-line text-ink">
      <div className="bg-grid bg-grid-fade animate-drift absolute inset-0 -z-10 opacity-50" aria-hidden />
      <Container className="relative py-16 sm:py-24">
        <div className="animate-fade-up"><SectionHeading as="h1" eyebrow={eyebrow} title={title} description={description} /></div>
        {children && <div className="animate-fade-up" style={{ "--d": "140ms" } as React.CSSProperties}>{children}</div>}
      </Container>
    </div>
  );
}

export const LABELS: Record<string, string> = {
  concept: "Concept", in_development: "In development", beta: "Beta", available: "Available", discontinued: "Discontinued",
  client: "Client engagement", internal_demo: "Internal demo", open_source: "Open source",
  full_time: "Full-time", part_time: "Part-time", contract: "Contract", internship: "Internship",
  not_announced: "Pricing not announced", contact: "Contact for pricing", free: "Free", freemium: "Freemium", subscription: "Subscription", one_time: "One-time purchase",
};
