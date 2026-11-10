import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import { AppNoteForm, ApplicationUpdateForm, DeleteApplicationButton } from "@/components/admin/application-forms";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Application" };
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const staff = await requireStaff("applications");
  const db = await createServerSupabase();
  const { data: a } = await db.from("applications").select("*, job_openings(title)").eq("id", id).maybeSingle();
  if (!a) notFound();
  const { data: notes } = await db.from("application_notes").select("id, note, created_at, profiles:author_id(full_name)").eq("application_id", id).order("created_at");
  return (
    <>
      <Link href="/admin/applications" className="text-sm text-brand hover:underline">← All applications</Link>
      <h1 className="mt-2 text-2xl font-semibold">{a.full_name}</h1>
      <p className="text-muted">{a.job_openings?.title}</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-line bg-surface p-6 text-sm">
            <p><a className="text-brand hover:underline" href={`mailto:${a.email}`}>{a.email}</a>{a.phone ? ` · ${a.phone}` : ""}</p>
            <p className="mt-1 text-muted">Applied {formatDate(a.created_at)} · retained until {formatDate(a.retention_until)}</p>
            {a.resume_path && <p className="mt-4"><a className="rounded-lg bg-brand px-4 py-2 text-white" href={`/admin/applications/${id}/resume`}>Download resume</a><span className="ml-3 text-xs text-muted">Each download is logged.</span></p>}
            {a.cover_letter && <><h2 className="mt-6 font-semibold">Cover letter</h2><p className="mt-2 whitespace-pre-wrap">{a.cover_letter}</p></>}
          </section>
          <section className="rounded-xl border border-line bg-surface p-6"><h2 className="text-lg font-semibold">Internal notes</h2>
            <ul className="mt-4 space-y-3">{(notes ?? []).map((n: any) => <li key={n.id} className="rounded-lg bg-surface-alt p-3 text-sm"><p className="whitespace-pre-wrap">{n.note}</p><p className="t-meta mt-1">{n.profiles?.full_name ?? "Unknown"} · {formatDate(n.created_at)}</p></li>)}{!notes?.length && <li className="text-sm text-muted">No notes yet.</li>}</ul>
            {can(staff.role, "applications", "update") && <div className="mt-5"><AppNoteForm id={id} /></div>}
          </section>
        </div>
        <aside className="space-y-6"><section className="rounded-xl border border-line bg-surface p-6"><h2 className="mb-4 text-lg font-semibold">Workflow</h2><ApplicationUpdateForm id={id} status={a.status} canUpdate={can(staff.role, "applications", "update")} /></section>{can(staff.role, "applications", "delete") && <DeleteApplicationButton id={id} />}</aside>
      </div>
    </>
  );
}
