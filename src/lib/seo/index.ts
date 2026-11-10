import type { Metadata } from "next";
import { siteUrl } from "@/lib/env";

export function buildMetadata(opts: { title: string; description?: string | null; path: string; image?: string | null; noindex?: boolean; type?: "website" | "article" }): Metadata {
  const url = `${siteUrl()}${opts.path}`;
  const description = opts.description?.slice(0, 200) || "Enterprise software engineering, AI, cybersecurity, cloud and data services.";
  return {
    title: opts.title,
    description,
    alternates: { canonical: url },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
    openGraph: { title: opts.title, description, url, type: opts.type ?? "website", images: opts.image ? [{ url: opts.image }] : undefined },
    twitter: { card: opts.image ? "summary_large_image" : "summary", title: opts.title, description },
  };
}

/** JSON-LD helpers — only verified, real data is passed in by callers. */
export function jsonLd(data: Record<string, unknown>) {
  return JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c");
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return jsonLd({
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${siteUrl()}${it.path}` })),
  });
}
