import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/primitives";
import { INQUIRY_STATUSES, PRIORITIES } from "@/lib/admin/statuses";
import { formatDate } from "@/lib/utils";
import { can } from "@/lib/permissions";

export const metadata = { title: "Inquiries" };
export const dynamic = "force-dynamic";
const PER = 20;

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const staff = await requireStaff("inquiries");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const db = await createServerSupabase();
  let q = db.from("inquiries").select("id, reference_code, name, company, email, service_interest, status, priority, is_read, created_at, assigned_to, profiles:assigned_to(full_name)", { count: "exact" }).order("created_at", { ascending: sp.dir === "asc" }).range((page - 1) * PER, page * PER - 1);
  const term = (sp.q ?? "").trim().slice(0, 80).replace(/[%,()]/g, " ");
  if (term) q = q.or(`name.ilike.%${term}%,company.ilike.%${term}%,email.ilike.%${term}%,reference_code.ilike.%${term}%`);
  if (sp.status && (INQUIRY_STATUSES as readonly string[]).includes(sp.status)) q = q.eq("status", sp.status);
  if (sp.priority && (PRIORITIES as readonly string[]).includes(sp.priority)) q = q.eq("priority", sp.priority);
  if (sp.service) q = q.eq("service_interest", sp.service);
  if (sp.from && !isNaN(Date.parse(sp.from))) q = q.gte("created_at", new Date(sp.from).toISOString());
  if (sp.to && !isNaN(Date.parse(sp.to))) q = q.lte("created_at", new Date(new Date(sp.to).getTime() + 86_400_000).toISOString());
  const { data, count } = await q;
  const rows = (data ?? []) as any[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER));
  const qs = (n: number) => { const p = new URLSearchParams(); Object.entries({ ...sp, page: String(n) }).forEach(([k, v]) => v && p.set(k, v)); return `/admin/inquiries?${p}`; };
  const exportQs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "page") as [string, string][]).toString();
  const sel = "rounded-lg border border-line bg-surface px-3 py-2 text-sm";
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Inquiries</h1>
        {can(staff.role, "inquiries", "read") && <a href={`/admin/inquiries/export?${exportQs}`} className="rounded-lg border border-line bg-surface px-4 py-2 text-sm">Export CSV</a>}
      </div>
      <form method="get" role="search" className="mt-6 flex flex-wrap gap-2">
        <label htmlFor="q" className="sr-only">Search</label><input id="q" name="q" defaultValue={sp.q} placeholder="Search name, company, email, reference" className={`${sel} min-w-56 flex-1`} />
        <select name="status" aria-label="Status" defaultValue={sp.status ?? ""} className={sel}><option value="">All statuses</option>{INQUIRY_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select>
        <select name="priority" aria-label="Priority" defaultValue={sp.priority ?? ""} className={sel}><option value="">All priorities</option>{PRIORITIES.map((s) => <option key={s}>{s}</option>)}</select>
        <input name="service" aria-label="Service interest" defaultValue={sp.service} placeholder="Service" className={sel} />
        <input type="date" name="from" aria-label="From date" defaultValue={sp.from} className={sel} /><input type="date" name="to" aria-label="To date" defaultValue={sp.to} className={sel} />
        <select name="dir" aria-label="Order" defaultValue={sp.dir ?? "desc"} className={sel}><option value="desc">Newest first</option><option value="asc">Oldest first</option></select>
        <button className="rounded-lg bg-brand px-4 py-2 text-sm text-white">Filter</button>
      </form>
      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm"><caption className="sr-only">Inquiries</caption>
          <thead className="border-b border-line bg-surface-alt text-xs uppercase text-muted"><tr>{["Reference", "From", "Service", "Status", "Priority", "Assigned", "Received"].map((h) => <th key={h} scope="col" className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className={r.is_read ? "" : "bg-blue-50/50"}>
                <td className="px-4 py-3"><Link href={`/admin/inquiries/${r.id}`} className="font-mono text-brand hover:underline">{r.reference_code}</Link>{!r.is_read && <span className="ml-2"><Badge tone="brand">New</Badge></span>}</td>
                <td className="px-4 py-3"><p className="font-medium">{r.name}</p><p className="text-xs text-muted">{r.company}</p></td>
                <td className="px-4 py-3">{r.service_interest ?? "—"}</td>
                <td className="px-4 py-3"><Badge>{r.status.replace("_", " ")}</Badge></td>
                <td className="px-4 py-3">{r.priority}</td>
                <td className="px-4 py-3">{r.profiles?.full_name ?? "—"}</td>
                <td className="px-4 py-3">{formatDate(r.created_at)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">No inquiries found.</td></tr>}
          </tbody>
        </table>
      </div>
      <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm"><span className="text-muted">{count ?? 0} total · page {page} of {pages}</span><span className="flex gap-2">{page > 1 && <Link className="rounded border border-line px-3 py-1.5" href={qs(page - 1)}>Previous</Link>}{page < pages && <Link className="rounded border border-line px-3 py-1.5" href={qs(page + 1)}>Next</Link>}</span></nav>
    </>
  );
}
