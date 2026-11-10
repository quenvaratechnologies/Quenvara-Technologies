"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { addInquiryNote, deleteInquiry, updateInquiry } from "@/lib/admin/inquiry-actions";
import { INQUIRY_STATUSES, PRIORITIES } from "@/lib/admin/statuses";
import type { CrudState } from "@/lib/admin/crud";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/forms/field";

const Msg = ({ s }: { s: CrudState }) => s.error ? <p role="alert" className="text-sm text-danger">{s.error}</p> : s.message ? <p role="status" className="text-sm text-success">{s.message}</p> : null;

export function InquiryUpdateForm({ id, inquiry, staff, canUpdate }: { id: string; inquiry: any; staff: { value: string; label: string }[]; canUpdate: boolean }) {
  const [state, action, pending] = useActionState<CrudState, FormData>(updateInquiry.bind(null, id), {});
  return (
    <form action={action} className="space-y-4">
      <fieldset disabled={!canUpdate} className="space-y-4">
        <Field id="status" label="Status">{(p) => <select {...p} name="status" defaultValue={inquiry.status} className={inputCls}>{INQUIRY_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select>}</Field>
        <Field id="priority" label="Priority">{(p) => <select {...p} name="priority" defaultValue={inquiry.priority} className={inputCls}>{PRIORITIES.map((s) => <option key={s}>{s}</option>)}</select>}</Field>
        <Field id="assigned_to" label="Assigned to">{(p) => <select {...p} name="assigned_to" defaultValue={inquiry.assigned_to ?? ""} className={inputCls}><option value="">Unassigned</option>{staff.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>}</Field>
        <Field id="follow_up_at" label="Follow-up date">{(p) => <input {...p} name="follow_up_at" type="datetime-local" defaultValue={inquiry.follow_up_at ? new Date(inquiry.follow_up_at).toISOString().slice(0, 16) : ""} className={inputCls} />}</Field>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      </fieldset>
      <Msg s={state} />
    </form>
  );
}

export function NoteForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<CrudState, FormData>(addInquiryNote.bind(null, id), {});
  return (
    <form action={action} className="space-y-3" key={state.message ?? "n"}>
      <Field id="note" label="Add internal note">{(p) => <textarea {...p} name="note" rows={3} className={inputCls} maxLength={5000} />}</Field>
      <Button type="submit" variant="secondary" disabled={pending}>Add note</Button>
      <Msg s={state} />
    </form>
  );
}

export function DeleteInquiryButton({ id }: { id: string }) {
  const router = useRouter();
  return <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-danger" onClick={async () => { const c = window.prompt("This permanently deletes the inquiry and its notes. Type DELETE to confirm."); if (c === null) return; const r = await deleteInquiry(id, c); if (r.ok) router.push("/admin/inquiries"); else window.alert(r.error); }}>Delete inquiry</button>;
}
