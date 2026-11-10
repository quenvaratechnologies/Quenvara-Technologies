import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { getContentType } from "@/config/content-types";
import { can } from "@/lib/permissions";
import { loadRelationOptions } from "@/lib/admin/relations";
import { RecordForm } from "@/components/admin/record-form";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { RelationsEditor } from "@/components/admin/relations-editor";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const ct = getContentType(type);
  if (!ct || !UUID.test(id)) notFound();
  const staff = await requireStaff(ct.resource, "update");
  const db = await createServerSupabase();
  const { data } = await db.from(ct.table).select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const rec = data as Record<string, any>;
  const status = ct.statusColumn ? rec[ct.statusColumn] : undefined;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{String(rec[ct.titleField])}</h1>
        <div className="flex items-center gap-3">
          {status && <Badge tone={status === "published" ? "success" : "warning"}>{status}</Badge>}
          <ButtonLink href={`/admin/${ct.key}/${id}/preview`} variant="secondary">Preview</ButtonLink>
          {status === "published" && ct.publicPath && rec.slug && <ButtonLink href={`${ct.publicPath}/${rec.slug}`} variant="secondary" target="_blank">View live</ButtonLink>}
        </div>
      </div>
      {status && status !== "published" && <p className="mt-2 text-sm text-muted">Not public. Draft content is never visible to visitors; use “Publish” from the list or set status to Published and save.</p>}
      <div className="mt-6 rounded-xl border border-line bg-surface p-6">
        <RecordForm ct={ct} id={id} initial={rec} relations={await loadRelationOptions(ct)} canPublish={can(staff.role, ct.resource, "publish")} />
      </div>
      <RelationsEditor typeKey={ct.key} id={id} />
    </>
  );
}
