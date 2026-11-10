import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { getContentType } from "@/config/content-types";
import { can } from "@/lib/permissions";
import { RowActions } from "@/components/admin/row-actions";
import { Badge } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PER_PAGE = 20;
type P = { params: Promise<{ type: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: P) {
  const ct = getContentType((await params).type);
  return { title: ct?.plural ?? "Not found" };
}

export default async function ListPage({ params, searchParams }: P) {
  const { type } = await params;
  const ct = getContentType(type);
  if (!ct) notFound();
  const staff = await requireStaff(ct.resource, "read");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const sortCol = ct.sortColumns.includes(sp.sort ?? "") ? sp.sort! : ct.defaultSort.column;
  const asc = sp.dir ? sp.dir === "asc" : ct.defaultSort.ascending;

  const db = await createServerSupabase();
  const cols = ["id", ...new Set([ct.titleField, ...ct.listColumns.map((c) => c.name), ...(ct.statusColumn ? [ct.statusColumn] : []), "updated_at"].filter((c) => c !== "updated_at" || true))];
  let q = db.from(ct.table).select(cols.join(","), { count: "exact" }).order(sortCol, { ascending: asc }).range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  const term = (sp.q ?? "").trim().slice(0, 80).replace(/[%,()]/g, " ");
  if (term) q = q.or(ct.searchColumns.map((c) => `${c}.ilike.%${term}%`).join(","));
  if (sp.status && ct.statusColumn && ct.statuses.includes(sp.status)) q = q.eq(ct.statusColumn, sp.status);
  const { data, count, error } = await q;
  const rows = (data ?? []) as unknown as Record<string, any>[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER_PAGE));
  const qs = (o: Record<string, string | number | undefined>) => { const p = new URLSearchParams(); Object.entries({ ...sp, ...o }).forEach(([k, v]) => v !== undefined && v !== "" && p.set(k, String(v))); return `/admin/${ct.key}?${p}`; };
  const tone = (s: string) => (s === "published" ? "success" : s === "archived" ? "neutral" : "warning");

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{ct.plural}</h1>
        {can(staff.role, ct.resource, "create") && <ButtonLink href={`/admin/${ct.key}/new`}>New {ct.singular.toLowerCase()}</ButtonLink>}
      </div>
      <form method="get" role="search" className="mt-6 flex flex-wrap gap-2">
        <label htmlFor="q" className="sr-only">Search</label>
        <input id="q" name="q" defaultValue={sp.q} placeholder={`Search ${ct.plural.toLowerCase()}`} className="min-w-56 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm" />
        {ct.statusColumn && <><label htmlFor="status" className="sr-only">Status</label><select id="status" name="status" defaultValue={sp.status ?? ""} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"><option value="">All statuses</option>{ct.statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></>}
        <label htmlFor="sort" className="sr-only">Sort by</label>
        <select id="sort" name="sort" defaultValue={sortCol} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm">{ct.sortColumns.map((c) => <option key={c} value={c}>Sort: {c.replace(/_/g, " ")}</option>)}</select>
        <select name="dir" aria-label="Direction" defaultValue={asc ? "asc" : "desc"} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"><option value="asc">Asc</option><option value="desc">Desc</option></select>
        <button className="rounded-lg bg-brand px-4 py-2 text-sm text-white">Apply</button>
      </form>
      {error && <p role="alert" className="mt-4 text-sm text-danger">Could not load records.</p>}
      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">{ct.plural}</caption>
          <thead className="border-b border-line bg-surface-alt text-xs uppercase text-muted"><tr>
            {ct.listColumns.map((c) => <th key={c.name} scope="col" className="px-4 py-3">{c.label}</th>)}
            {ct.statusColumn && <th scope="col" className="px-4 py-3">Status</th>}
            <th scope="col" className="px-4 py-3 text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id}>
                {ct.listColumns.map((c, i) => <td key={c.name} className="px-4 py-3">{i === 0 && can(staff.role, ct.resource, "update") ? <Link href={`/admin/${ct.key}/${r.id}`} className="font-medium text-brand hover:underline">{String(r[c.name] ?? "—")}</Link> : c.name.endsWith("_at") ? formatDate(r[c.name]) : String(r[c.name] ?? "—")}</td>)}
                {ct.statusColumn && <td className="px-4 py-3"><Badge tone={tone(r[ct.statusColumn])}>{r[ct.statusColumn]}</Badge></td>}
                <td className="px-4 py-3"><RowActions typeKey={ct.key} id={r.id} status={ct.statusColumn ? r[ct.statusColumn] : undefined} statuses={ct.statuses} label={String(r[ct.titleField])} canUpdate={can(staff.role, ct.resource, "update")} canPublish={can(staff.role, ct.resource, "publish")} canDelete={can(staff.role, ct.resource, "delete")} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={ct.listColumns.length + 2} className="px-4 py-10 text-center text-muted">No records found.</td></tr>}
          </tbody>
        </table>
      </div>
      <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted">{count ?? 0} total · page {page} of {pages}</span>
        <span className="flex gap-2">{page > 1 && <Link className="rounded border border-line px-3 py-1.5" href={qs({ page: page - 1 })}>Previous</Link>}{page < pages && <Link className="rounded border border-line px-3 py-1.5" href={qs({ page: page + 1 })}>Next</Link>}</span>
      </nav>
    </>
  );
}
