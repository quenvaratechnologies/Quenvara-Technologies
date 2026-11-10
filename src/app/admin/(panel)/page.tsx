import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const staff = await requireStaff();
  const db = await createServerSupabase();
  const count = async (table: string, f?: (q: any) => any, resource?: any) => {
    if (resource && !can(staff.role, resource, "read")) return null;
    let q = db.from(table).select("id", { count: "exact", head: true });
    if (f) q = f(q);
    const { count } = await q;
    return count ?? 0;
  };
  const [services, projects, products, drafts, inquiries, apps] = await Promise.all([
    count("services", (q) => q.eq("status", "published"), "services"),
    count("projects", undefined, "projects"),
    count("products", undefined, "products"),
    count("posts", (q) => q.eq("status", "draft"), "posts"),
    count("inquiries", (q) => q.eq("status", "new"), "inquiries"),
    count("applications", (q) => q.in("status", ["new", "reviewing", "interview"]), "applications"),
  ]);
  const activity = can(staff.role, "audit_logs", "read")
    ? (await db.from("audit_logs").select("id, action, entity_type, created_at, profiles(full_name)").order("created_at", { ascending: false }).limit(8)).data ?? []
    : [];
  const stats: [string, number | null, string][] = [
    ["Published services", services, "/admin/services"], ["Projects", projects, "/admin/projects"], ["Products", products, "/admin/products"],
    ["Draft articles", drafts, "/admin/posts"], ["Unread inquiries", inquiries, "/admin/inquiries"], ["Open applications", apps, "/admin/applications"],
  ];
  return (
    <>
      <h1 className="text-2xl font-semibold">Welcome{staff.fullName ? `, ${staff.fullName}` : ""}</h1>
      <p className="mt-1 text-muted">Live counts from your database.</p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.filter(([, n]) => n !== null).map(([label, n, href]) => (
          <Link key={label} href={href} className="rounded-xl border border-line bg-surface p-5 hover:shadow-md"><dt className="text-sm text-muted">{label}</dt><dd className="mt-1 text-3xl font-semibold">{n}</dd></Link>
        ))}
      </dl>
      {activity.length > 0 && (
        <section className="mt-10" aria-labelledby="act"><h2 id="act" className="text-lg font-semibold">Recent activity</h2>
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-surface">{activity.map((a: any) => <li key={a.id} className="flex flex-wrap justify-between gap-2 p-3 text-sm"><span><span className="font-mono">{a.action}</span> {a.profiles?.full_name ? `by ${a.profiles.full_name}` : ""}</span><span className="text-muted">{formatDate(a.created_at)}</span></li>)}</ul>
        </section>
      )}
    </>
  );
}
