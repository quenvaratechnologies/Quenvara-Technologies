import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { getContentType } from "@/config/content-types";
import { RichText } from "@/components/ui/primitives";

// Authenticated draft preview. Reads through the signed-in user's own RLS-scoped session, so a user
// can only preview what their role may read. Never cached, never indexed (also set by /admin headers).
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PreviewPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const ct = getContentType(type);
  if (!ct || !UUID.test(id)) notFound();
  await requireStaff(ct.resource, "read");
  const db = await createServerSupabase();
  const { data } = await db.from(ct.table).select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const rec = data as Record<string, unknown>;
  const status = ct.statusColumn ? String(rec[ct.statusColumn] ?? "") : "";

  return (
    <div>
      <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <span><strong>Preview.</strong> {status === "published" ? "This content is live." : "This content is not public."} Only signed-in staff can see this page.</span>
        <Link href={`/admin/${ct.key}/${id}`} className="font-medium underline">Back to editor</Link>
      </div>
      <article className="mx-auto max-w-3xl">
        <h1 className="t-page">{String(rec[ct.titleField] ?? "")}</h1>
        {ct.fields.filter((f) => f.name !== ct.titleField && f.name !== "slug" && !f.name.startsWith("seo_")).map((f) => {
          const v = rec[f.name];
          if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) return null;
          return (
            <section key={f.name} className="mt-8">
              <h2 className="t-label text-muted">{f.label}</h2>
              {f.type === "richtext" ? <RichText html={String(v)} className="mt-2" />
                : f.type === "image" ? <p className="mt-2 break-all text-sm text-muted">{String(v)}</p>
                : Array.isArray(v) ? <ul className="mt-2 list-disc pl-5 text-muted">{v.map((x, i) => <li key={i}>{String(x)}</li>)}</ul>
                : <p className="mt-2 whitespace-pre-line text-muted">{String(v)}</p>}
            </section>
          );
        })}
      </article>
    </div>
  );
}
