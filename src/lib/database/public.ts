import { cache } from "react";
import "server-only";
import { createPublicSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

/* Public read layer. Uses the anon (cookie-less) client so RLS guarantees published-only results. */

export type Row = Record<string, any>;

function db() {
  return isSupabaseConfigured() ? createPublicSupabase() : null;
}

async function safe<T>(fn: () => PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<T> {
  try {
    const { data, error } = await fn();
    if (error) { console.error("public query failed", (error as { message?: string }).message); return fallback; }
    return data ?? fallback;
  } catch (e) {
    console.error("public query threw", (e as Error).message);
    return fallback;
  }
}

export const getSettings = cache(async (): Promise<Record<string, any>> => {
  const c = db(); if (!c) return {};
  const rows = await safe<Row[]>(() => c.from("site_settings").select("key, value"), []);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
});

export const getNavigation = async (): Promise<Row[]> => {
  const c = db(); if (!c) return [];
  return safe(() => c.from("navigation_items").select("*").order("display_order"), []);
};

export const getServices = async (opts: { q?: string; category?: string; limit?: number; featured?: boolean } = {}): Promise<Row[]> => {
  const c = db(); if (!c) return [];
  let q = c.from("services").select("id, title, slug, summary, category, icon, cover_image, featured, sort_order").order("sort_order").order("title");
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.featured) q = q.eq("featured", true);
  if (opts.q) q = q.textSearch("search_vector", opts.q, { type: "websearch", config: "english" });
  if (opts.limit) q = q.limit(opts.limit);
  return safe(() => q, []);
};

export const getService = async (slug: string): Promise<Row | null> => {
  const c = db(); if (!c) return null;
  const { data } = await c.from("services").select("*, service_industries(industries(name, slug)), service_technologies(technologies(name, slug, category)), service_faqs(faqs(id, question, answer, display_order))").eq("slug", slug).maybeSingle();
  return data;
};

export const getRelatedProjectsForService = async (serviceId: string): Promise<Row[]> => {
  const c = db(); if (!c) return [];
  const links = await safe<Row[]>(() => c.from("project_services").select("project_id").eq("service_id", serviceId), []);
  if (!links.length) return [];
  return safe(() => c.from("projects").select("title, slug, summary, project_type").in("id", links.map((l) => l.project_id)), []);
};

export const getIndustries = async (limit?: number): Promise<Row[]> => {
  const c = db(); if (!c) return [];
  let q = c.from("industries").select("id, name, slug, summary, cover_image").order("sort_order").order("name");
  if (limit) q = q.limit(limit);
  return safe(() => q, []);
};

export const getIndustry = async (slug: string): Promise<Row | null> => {
  const c = db(); if (!c) return null;
  const { data } = await c.from("industries").select("*").eq("slug", slug).maybeSingle();
  return data;
};

export const getProjects = async (opts: { q?: string; industry?: string; service?: string; technology?: string; type?: string; limit?: number; featured?: boolean } = {}): Promise<Row[]> => {
  const c = db(); if (!c) return [];
  let ids: string[] | null = null;
  const intersect = (list: string[]) => { ids = ids ? ids.filter((i) => list.includes(i)) : list; };
  if (opts.service) {
    const { data: s } = await c.from("services").select("id").eq("slug", opts.service).maybeSingle();
    const rows = s ? await safe<Row[]>(() => c.from("project_services").select("project_id").eq("service_id", s.id), []) : [];
    intersect(rows.map((r) => r.project_id));
  }
  if (opts.technology) {
    const { data: t } = await c.from("technologies").select("id").eq("slug", opts.technology).maybeSingle();
    const rows = t ? await safe<Row[]>(() => c.from("project_technologies").select("project_id").eq("technology_id", t.id), []) : [];
    intersect(rows.map((r) => r.project_id));
  }
  if (ids && (ids as string[]).length === 0) return [];
  let q = c.from("projects").select("id, title, slug, summary, project_type, featured_image, client_display_name, client_permission_confirmed, industries(name, slug)").order("published_at", { ascending: false });
  if (ids) q = q.in("id", ids);
  if (opts.type) q = q.eq("project_type", opts.type);
  if (opts.featured) q = q.eq("featured", true);
  if (opts.industry) {
    const { data: i } = await c.from("industries").select("id").eq("slug", opts.industry).maybeSingle();
    if (!i) return [];
    q = q.eq("industry_id", i.id);
  }
  if (opts.q) q = q.textSearch("search_vector", opts.q, { type: "websearch", config: "english" });
  if (opts.limit) q = q.limit(opts.limit);
  return safe(() => q, []);
};

export const getProject = async (slug: string): Promise<Row | null> => {
  const c = db(); if (!c) return null;
  const { data } = await c.from("projects").select("*, industries(name, slug), project_services(services(title, slug)), project_technologies(technologies(name, slug))").eq("slug", slug).maybeSingle();
  return data;
};

export const getProducts = async (opts: { limit?: number; featured?: boolean } = {}): Promise<Row[]> => {
  const c = db(); if (!c) return [];
  let q = c.from("products").select("id, name, slug, summary, logo_url, cover_image, product_status, pricing_model, featured").order("sort_order");
  if (opts.featured) q = q.eq("featured", true);
  if (opts.limit) q = q.limit(opts.limit);
  return safe(() => q, []);
};

export const getProduct = async (slug: string): Promise<Row | null> => {
  const c = db(); if (!c) return null;
  const { data } = await c.from("products").select("*, product_technologies(technologies(name, slug))").eq("slug", slug).maybeSingle();
  return data;
};

export const getTechnologies = async (): Promise<Row[]> => {
  const c = db(); if (!c) return [];
  return safe(() => c.from("technologies").select("id, name, slug, category, description, icon").order("category").order("display_order").order("name"), []);
};

export const getPosts = async (opts: { q?: string; category?: string; tag?: string; limit?: number; offset?: number; featured?: boolean } = {}): Promise<{ rows: Row[]; count: number }> => {
  const c = db(); if (!c) return { rows: [], count: 0 };
  let postIds: string[] | null = null;
  if (opts.tag) {
    const { data: t } = await c.from("tags").select("id").eq("slug", opts.tag).maybeSingle();
    const links = t ? await safe<Row[]>(() => c.from("post_tags").select("post_id").eq("tag_id", t.id), []) : [];
    postIds = links.map((l) => l.post_id);
    if (!postIds.length) return { rows: [], count: 0 };
  }
  let q = c.from("posts").select("id, title, slug, excerpt, cover_image, published_at, featured, content, categories(name, slug), team_members(name)", { count: "exact" }).order("published_at", { ascending: false });
  if (postIds) q = q.in("id", postIds);
  if (opts.featured) q = q.eq("featured", true);
  if (opts.category) {
    const { data: cat } = await c.from("categories").select("id").eq("slug", opts.category).maybeSingle();
    if (!cat) return { rows: [], count: 0 };
    q = q.eq("category_id", cat.id);
  }
  if (opts.q) q = q.textSearch("search_vector", opts.q, { type: "websearch", config: "english" });
  const limit = opts.limit ?? 9, offset = opts.offset ?? 0;
  q = q.range(offset, offset + limit - 1);
  try {
    const { data, count, error } = await q;
    if (error) throw error;
    return { rows: data ?? [], count: count ?? 0 };
  } catch (e) { console.error("posts query failed", (e as Error).message); return { rows: [], count: 0 }; }
};

export const getPost = async (slug: string): Promise<Row | null> => {
  const c = db(); if (!c) return null;
  const { data } = await c.from("posts").select("*, categories(name, slug), team_members(name, role_title, bio, avatar_url), post_tags(tags(name, slug))").eq("slug", slug).maybeSingle();
  return data;
};

export const getRelatedPosts = async (postId: string, categoryId: string | null): Promise<Row[]> => {
  const c = db(); if (!c) return [];
  let q = c.from("posts").select("title, slug, excerpt, published_at").neq("id", postId).order("published_at", { ascending: false }).limit(3);
  if (categoryId) q = q.eq("category_id", categoryId);
  return safe(() => q, []);
};

export const getCategories = async (): Promise<Row[]> => { const c = db(); return c ? safe(() => c.from("categories").select("*").order("name"), []) : []; };
export const getTags = async (): Promise<Row[]> => { const c = db(); return c ? safe(() => c.from("tags").select("*").order("name"), []) : []; };
export const getTeam = async (): Promise<Row[]> => { const c = db(); return c ? safe(() => c.from("team_members").select("*").order("display_order"), []) : []; };
export const getFaqs = async (category?: string): Promise<Row[]> => {
  const c = db(); if (!c) return [];
  let q = c.from("faqs").select("*").order("display_order"); if (category) q = q.eq("category", category);
  return safe(() => q, []);
};
export const getTestimonials = async (): Promise<Row[]> => { const c = db(); return c ? safe(() => c.from("testimonials").select("*").order("display_order"), []) : []; };
export const getPackages = async (): Promise<Row[]> => { const c = db(); return c ? safe(() => c.from("packages").select("*").order("display_order"), []) : []; };
export const getPage = async (slug: string): Promise<Row | null> => {
  const c = db(); if (!c) return null;
  const { data } = await c.from("pages").select("*").eq("slug", slug).maybeSingle();
  return data;
};
export const getJobs = async (): Promise<Row[]> => { const c = db(); return c ? safe(() => c.from("job_openings").select("id, title, slug, department, location, employment_type, published_at").order("published_at", { ascending: false }), []) : []; };
export const getJob = async (slug: string): Promise<Row | null> => {
  const c = db(); if (!c) return null;
  const { data } = await c.from("job_openings").select("*").eq("slug", slug).maybeSingle();
  return data;
};
export const getRedirect = async (path: string): Promise<string | null> => {
  const c = db(); if (!c) return null;
  const { data } = await c.from("redirects").select("to_path").eq("from_path", path).maybeSingle();
  return data?.to_path ?? null;
};

export const searchAll = async (q: string): Promise<Row[]> => {
  const c = db(); if (!c || !q.trim()) return [];
  return safe(() => c.rpc("search_content", { q: q.slice(0, 100), lim: 30 }), []);
};

export async function getSitemapEntries() {
  const c = db();
  if (!c) return { services: [], industries: [], projects: [], products: [], posts: [], jobs: [], pages: [] };
  const [services, industries, projects, products, posts, jobs, pages] = await Promise.all([
    safe<Row[]>(() => c.from("services").select("slug, updated_at"), []),
    safe<Row[]>(() => c.from("industries").select("slug, updated_at"), []),
    safe<Row[]>(() => c.from("projects").select("slug, updated_at"), []),
    safe<Row[]>(() => c.from("products").select("slug, updated_at"), []),
    safe<Row[]>(() => c.from("posts").select("slug, updated_at"), []),
    safe<Row[]>(() => c.from("job_openings").select("slug, updated_at"), []),
    safe<Row[]>(() => c.from("pages").select("slug, updated_at"), []),
  ]);
  return { services, industries, projects, products, posts, jobs, pages };
}
