"use client";

import { useActionState, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { addApplicationNote, deleteApplication, purgeExpiredApplications, updateApplication } from "@/lib/admin/application-actions";
import { APP_STATUSES } from "@/lib/admin/statuses";
import type { CrudState } from "@/lib/admin/crud";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/forms/field";

const Msg = ({ s }: { s: CrudState }) => s.error ? <p role="alert" className="text-sm text-danger">{s.error}</p> : s.message ? <p role="status" className="text-sm text-success">{s.message}</p> : null;

export function ApplicationUpdateForm({ id, status, canUpdate }: { id: string; status: string; canUpdate: boolean }) {
  const [state, action, pending] = useActionState<CrudState, FormData>(updateApplication.bind(null, id), {});
  return (
    <form action={action} className="space-y-4"><fieldset disabled={!canUpdate} className="space-y-4">
      <Field id="status" label="Status">{(p) => <select {...p} name="status" defaultValue={status} className={inputCls}>{APP_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>}</Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="extend_retention" /> Extend retention by 12 months</label>
      <Button type="submit" disabled={pending}>Save</Button></fieldset><Msg s={state} /></form>
  );
}

export function AppNoteForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<CrudState, FormData>(addApplicationNote.bind(null, id), {});
  return <form action={action} key={state.message ?? "n"} className="space-y-3"><Field id="note" label="Add internal note">{(p) => <textarea {...p} name="note" rows={3} className={inputCls} />}</Field><Button variant="secondary" type="submit" disabled={pending}>Add note</Button><Msg s={state} /></form>;
}

export function DeleteApplicationButton({ id }: { id: string }) {
  const router = useRouter();
  return <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-danger" onClick={async () => { const c = window.prompt("This permanently deletes the application and resume. Type DELETE to confirm."); if (c === null) return; const r = await deleteApplication(id, c); if (r.ok) router.push("/admin/applications"); else window.alert(r.error); }}>Delete application &amp; resume</button>;
}

export function PurgeButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const router = useRouter();
  return <span className="flex items-center gap-3"><button disabled={pending} className="rounded-lg border border-line bg-surface px-4 py-2 text-sm" onClick={() => { if (!window.confirm("Permanently delete all applications past their retention date, including resumes?")) return; start(async () => { const r = await purgeExpiredApplications(); setMsg(r.message ?? r.error ?? ""); router.refresh(); }); }}>Purge expired</button><span role="status" className="text-sm text-muted">{msg}</span></span>;
}
