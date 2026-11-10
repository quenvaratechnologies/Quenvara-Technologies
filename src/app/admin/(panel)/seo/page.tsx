import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import { RedirectForm, DeleteRedirect } from "@/components/admin/redirect-ui";

export const metadata = { title: "SEO & redirects" };
export const dynamic = "force-dynamic";

export default async function SeoPage() {
  const staff = await requireStaff("seo");
  const db = await createServerSupabase();
  const { data } = await db.from("redirects").select("*").order("created_at", { ascending: false }).limit(200);
  return (
    <>
      <h1 className="text-2xl font-semibold">SEO & redirects</h1>
      <p className="mt-1 text-sm text-muted">Page-level titles and descriptions are edited on each record. Site-wide defaults live in <Link href="/admin/settings" className="text-brand underline">Settings</Link>. Slug changes on published content create redirects automatically.</p>
      {can(staff.role, "seo", "update") && <div className="mt-6"><RedirectForm /></div>}
      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface"><table className="w-full text-left text-sm"><caption className="sr-only">Redirects</caption>
        <thead className="border-b border-line bg-surface-alt text-xs uppercase text-muted"><tr><th scope="col" className="px-4 py-3">From</th><th scope="col" className="px-4 py-3">To</th><th className="px-4 py-3" /></tr></thead>
        <tbody className="divide-y divide-line">{(data ?? []).map((r: any) => <tr key={r.id}><td className="px-4 py-3 font-mono text-xs">{r.from_path}</td><td className="px-4 py-3 font-mono text-xs">{r.to_path}</td><td className="px-4 py-3 text-right">{can(staff.role, "seo", "update") && <DeleteRedirect id={r.id} />}</td></tr>)}{!data?.length && <tr><td colSpan={3} className="px-4 py-10 text-center text-muted">No redirects.</td></tr>}</tbody></table></div>
    </>
  );
}
