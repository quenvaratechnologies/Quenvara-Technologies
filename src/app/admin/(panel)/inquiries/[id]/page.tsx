import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import { InquiryUpdateForm, NoteForm, DeleteInquiryButton } from "@/components/admin/inquiry-forms";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Inquiry" };
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const staff = await requireStaff("inquiries");
  const db = await createServerSupabase();
  const { data: inq } = await db.from("inquiries").select("*").eq("id", id).maybeSingle();
  if (!inq) notFound();
  if (!inq.is_read && can(staff.role, "inquiries", "update")) await db.from("inquiries").update({ is_read: true }).eq("id", id);
  const [{ data: notes }, { data: team }] = await Promise.all([
    db.from("inquiry_notes").select("id, note, created_at, profiles:author_id(full_name)").eq("inquiry_id", id).order("created_at"),
    db.from("profiles").select("id, full_name, role").eq("is_active", true).in("role", ["owner", "administrator", "sales"]),
  ]);
  const row = (l: string, v?: string | null) => <div><dt className="text-xs uppercase text-muted">{l}</dt><dd className="mt-0.5">{v || "—"}</dd></div>;
  return (
    <>
      <Link href="/admin/inquiries" className="text-sm text-brand hover:underline">← All inquiries</Link>
      <h1 className="mt-2 text-2xl font-semibold">Inquiry <span className="font-mono">{inq.reference_code}</span></h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-line bg-surface p-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              {row("Name", inq.name)}{row("Company", inq.company)}
              <div><dt className="text-xs uppercase text-muted">Email</dt><dd><a className="text-brand hover:underline" href={`mailto:${inq.email}`}>{inq.email}</a></dd></div>
              {row("Phone", inq.phone)}{row("Service interest", inq.service_interest)}{row("Budget", inq.budget_range)}{row("Timeline", inq.project_timeline)}{row("Received", formatDate(inq.created_at))}
            </dl>
            <h2 className="mt-6 text-sm font-semibold">Message</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm">{inq.message}</p>
          </section>
          <section className="rounded-xl border border-line bg-surface p-6" aria-labelledby="notes-h">
            <h2 id="notes-h" className="text-lg font-semibold">Internal notes</h2>
            <ul className="mt-4 space-y-3">{(notes ?? []).map((n: any) => <li key={n.id} className="rounded-lg bg-surface-alt p-3 text-sm"><p className="whitespace-pre-wrap">{n.note}</p><p className="t-meta mt-1">{n.profiles?.full_name ?? "Unknown"} · {formatDate(n.created_at)}</p></li>)}{!notes?.length && <li className="text-sm text-muted">No notes yet.</li>}</ul>
            {can(staff.role, "inquiries", "update") && <div className="mt-5"><NoteForm id={id} /></div>}
          </section>
        </div>
        <aside className="space-y-6">
          <section className="rounded-xl border border-line bg-surface p-6"><h2 className="mb-4 text-lg font-semibold">Workflow</h2><InquiryUpdateForm id={id} inquiry={inq} staff={(team ?? []).map((t: any) => ({ value: t.id, label: t.full_name || t.role }))} canUpdate={can(staff.role, "inquiries", "update")} /></section>
          {can(staff.role, "inquiries", "delete") && <DeleteInquiryButton id={id} />}
        </aside>
      </div>
    </>
  );
}
