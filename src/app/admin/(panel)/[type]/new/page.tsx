import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { getContentType } from "@/config/content-types";
import { can } from "@/lib/permissions";
import { loadRelationOptions } from "@/lib/admin/relations";
import { RecordForm } from "@/components/admin/record-form";

export const dynamic = "force-dynamic";

export default async function NewPage({ params }: { params: Promise<{ type: string }> }) {
  const ct = getContentType((await params).type);
  if (!ct) notFound();
  const staff = await requireStaff(ct.resource, "create");
  const defaults: Record<string, unknown> = { status: "draft", is_visible: true };
  return (
    <>
      <h1 className="text-2xl font-semibold">New {ct.singular.toLowerCase()}</h1>
      <div className="mt-6 rounded-xl border border-line bg-surface p-6">
        <RecordForm ct={ct} id={null} initial={defaults} relations={await loadRelationOptions(ct)} canPublish={can(staff.role, ct.resource, "publish")} />
      </div>
    </>
  );
}
