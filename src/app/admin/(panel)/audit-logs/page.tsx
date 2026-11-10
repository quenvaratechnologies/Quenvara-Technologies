import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Audit logs" };
export const dynamic = "force-dynamic";
const PER = 30;

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireStaff("audit_logs");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const db = await createServerSupabase();
  let q = db.from("audit_logs").select("id, action, entity_type, entity_id, metadata, created_at, profiles:actor_id(full_name)", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PER, page * PER - 1);
  const term = (sp.q ?? "").trim().slice(0, 60).replace(/[%,()]/g, " ");
  if (term) q = q.or(`action.ilike.%${term}%,entity_type.ilike.%${term}%`);
  const { data, count } = await q;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER));
  return (
    <>
      <h1 className="text-2xl font-semibold">Audit logs</h1>
      <form method="get" role="search" className="mt-6 flex gap-2"><label htmlFor="q" className="sr-only">Filter</label><input id="q" name="q" defaultValue={sp.q} placeholder="Filter by action or entity" className="min-w-64 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm" /><button className="rounded-lg bg-brand px-4 py-2 text-sm text-white">Filter</button></form>
      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface"><table className="w-full min-w-[640px] text-left text-sm"><caption className="sr-only">Audit log</caption>
        <thead className="border-b border-line bg-surface-alt text-xs uppercase text-muted"><tr>{["When", "Actor", "Action", "Entity", "Details"].map((h) => <th key={h} scope="col" className="px-4 py-3">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{(data ?? []).map((l: any) => <tr key={l.id}><td className="whitespace-nowrap px-4 py-3">{formatDate(l.created_at)}</td><td className="px-4 py-3">{l.profiles?.full_name ?? "system"}</td><td className="px-4 py-3 font-mono text-xs">{l.action}</td><td className="px-4 py-3">{l.entity_type}</td><td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-muted" title={JSON.stringify(l.metadata)}>{JSON.stringify(l.metadata)}</td></tr>)}{!data?.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No entries.</td></tr>}</tbody></table></div>
      <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm"><span className="text-muted">{count ?? 0} entries · page {page} of {pages}</span><span className="flex gap-2">{page > 1 && <Link className="rounded border border-line px-3 py-1.5" href={`?page=${page - 1}${term ? `&q=${term}` : ""}`}>Previous</Link>}{page < pages && <Link className="rounded border border-line px-3 py-1.5" href={`?page=${page + 1}${term ? `&q=${term}` : ""}`}>Next</Link>}</span></nav>
    </>
  );
}
