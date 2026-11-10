import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/primitives";
import { APP_STATUSES } from "@/lib/admin/statuses";
import { PurgeButton } from "@/components/admin/application-forms";
import { can } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Applications" };
export const dynamic = "force-dynamic";
const PER = 20;

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const staff = await requireStaff("applications");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const db = await createServerSupabase();
  const { data: jobs } = await db.from("job_openings").select("id, title").order("title");
  let q = db.from("applications").select("id, full_name, email, status, created_at, retention_until, job_openings(title)", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PER, page * PER - 1);
  const term = (sp.q ?? "").trim().slice(0, 80).replace(/[%,()]/g, " ");
  if (term) q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  if (sp.status && (APP_STATUSES as readonly string[]).includes(sp.status)) q = q.eq("status", sp.status);
  if (sp.job && /^[0-9a-f-]{36}$/i.test(sp.job)) q = q.eq("job_id", sp.job);
  const { data, count } = await q;
  const rows = (data ?? []) as any[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER));
  const qs = (n: number) => { const p = new URLSearchParams(); Object.entries({ ...sp, page: String(n) }).forEach(([k, v]) => v && p.set(k, v)); return `/admin/applications?${p}`; };
  const sel = "rounded-lg border border-line bg-surface px-3 py-2 text-sm";
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Applications</h1>{can(staff.role, "applications", "delete") && <PurgeButton />}</div>
      <form method="get" role="search" className="mt-6 flex flex-wrap gap-2">
        <label htmlFor="q" className="sr-only">Search</label><input id="q" name="q" defaultValue={sp.q} placeholder="Search name or email" className={`${sel} min-w-56 flex-1`} />
        <select name="status" aria-label="Status" defaultValue={sp.status ?? ""} className={sel}><option value="">All statuses</option>{APP_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <select name="job" aria-label="Job" defaultValue={sp.job ?? ""} className={sel}><option value="">All jobs</option>{(jobs ?? []).map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select>
        <button className="rounded-lg bg-brand px-4 py-2 text-sm text-white">Filter</button>
      </form>
      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface"><table className="w-full min-w-[680px] text-left text-sm"><caption className="sr-only">Applications</caption>
        <thead className="border-b border-line bg-surface-alt text-xs uppercase text-muted"><tr>{["Applicant", "Job", "Status", "Applied", "Retain until"].map((h) => <th key={h} scope="col" className="px-4 py-3">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{rows.map((r) => <tr key={r.id}><td className="px-4 py-3"><Link className="font-medium text-brand hover:underline" href={`/admin/applications/${r.id}`}>{r.full_name}</Link><p className="text-xs text-muted">{r.email}</p></td><td className="px-4 py-3">{r.job_openings?.title}</td><td className="px-4 py-3"><Badge>{r.status}</Badge></td><td className="px-4 py-3">{formatDate(r.created_at)}</td><td className="px-4 py-3">{formatDate(r.retention_until)}</td></tr>)}{rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No applications found.</td></tr>}</tbody></table></div>
      <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm"><span className="text-muted">{count ?? 0} total · page {page} of {pages}</span><span className="flex gap-2">{page > 1 && <Link className="rounded border border-line px-3 py-1.5" href={qs(page - 1)}>Previous</Link>}{page < pages && <Link className="rounded border border-line px-3 py-1.5" href={qs(page + 1)}>Next</Link>}</span></nav>
    </>
  );
}
