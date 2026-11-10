import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { ServiceIcon } from "@/components/ui/service-icon";
import { Badge, LABELS } from "@/components/ui/primitives";
import { formatDate, readingTime } from "@/lib/utils";
import type { Row } from "@/lib/database/public";

export { ServiceIcon };

function Cover({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) return null;
  return <Image src={src} alt={alt} width={800} height={450} className="aspect-video w-full rounded-t-xl object-cover" loading="lazy" unoptimized={!src.startsWith("/") || src.endsWith(".svg")} />;
}

const card = "group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[var(--shadow-lift)]";

export function ServiceCard({ s }: { s: Row }) {
  return (
    <Link href={`/services/${s.slug}`} className={`${card} p-6`}>
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-cyan ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"><ServiceIcon name={s.icon} className="h-5 w-5" /></span>
      <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
      <p className="mt-2 flex-1 text-sm text-muted">{s.summary}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">Learn more <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden /></span>
    </Link>
  );
}

export function IndustryCard({ i }: { i: Row }) {
  return (
    <Link href={`/industries/${i.slug}`} className={card}>
      <Cover src={i.cover_image || `/images/industries/${i.slug}.svg`} alt={i.name} />
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-semibold">{i.name}</h3>
        <p className="mt-2 flex-1 text-sm text-muted">{i.summary}</p>
        <span className="mt-4 text-sm font-medium text-brand">Explore →</span>
      </div>
    </Link>
  );
}

export function ProjectCard({ p }: { p: Row }) {
  const real = p.project_type === "client";
  return (
    <Link href={`/work/${p.slug}`} className={card}>
      <Cover src={p.featured_image} alt={p.title} />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap gap-2">
          <Badge tone={real ? "success" : "warning"}>{LABELS[p.project_type] ?? p.project_type}</Badge>
          {p.industries?.name && <Badge>{p.industries.name}</Badge>}
        </div>
        <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
        <p className="mt-2 flex-1 text-sm text-muted">{p.summary}</p>
        {real && p.client_permission_confirmed && p.client_display_name && <p className="t-meta mt-3">Client: {p.client_display_name}</p>}
      </div>
    </Link>
  );
}

export function ProductCard({ p }: { p: Row }) {
  return (
    <Link href={`/products/${p.slug}`} className={`${card} p-6`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{p.name}</h3>
        <Badge tone={p.product_status === "available" ? "success" : p.product_status === "beta" ? "brand" : "warning"}>{LABELS[p.product_status]}</Badge>
      </div>
      <p className="mt-2 flex-1 text-sm text-muted">{p.summary}</p>
      <span className="mt-4 text-sm font-medium text-brand">View product →</span>
    </Link>
  );
}

export function PostCard({ p }: { p: Row }) {
  return (
    <Link href={`/insights/${p.slug}`} className={card}>
      <Cover src={p.cover_image} alt={p.title} />
      <div className="flex flex-1 flex-col p-6">
        {p.categories?.name && <p className="t-label text-brand">{p.categories.name}</p>}
        <h3 className="mt-2 text-lg font-semibold">{p.title}</h3>
        <p className="mt-2 flex-1 text-sm text-muted">{p.excerpt}</p>
        <p className="t-meta mt-4">{formatDate(p.published_at)}{p.content ? ` · ${readingTime(p.content)} min read` : ""}</p>
      </div>
    </Link>
  );
}
