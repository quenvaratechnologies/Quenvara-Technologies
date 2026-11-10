import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/database/public";
import { siteUrl } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const e = await getSitemapEntries();
  const statics = ["", "/about", "/services", "/industries", "/work", "/products", "/technology", "/pricing", "/insights", "/careers", "/contact"];
  const dyn = (prefix: string, rows: Record<string, any>[]) => rows.filter((r) => r.slug).map((r) => {
    const d = new Date(r.updated_at);
    return { url: `${base}${prefix}/${r.slug}`, ...(Number.isNaN(d.getTime()) ? {} : { lastModified: d }) };
  });
  return [
    ...statics.map((p) => ({ url: `${base}${p}` })),
    ...dyn("/services", e.services), ...dyn("/industries", e.industries), ...dyn("/work", e.projects),
    ...dyn("/products", e.products), ...dyn("/insights", e.posts), ...dyn("/careers", e.jobs), ...dyn("/legal", e.pages),
  ];
}
