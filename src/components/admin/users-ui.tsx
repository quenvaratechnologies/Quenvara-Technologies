"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteUser, updateUserRole } from "@/lib/admin/user-actions";
import { ROLES } from "@/lib/permissions";
import type { CrudState } from "@/lib/admin/crud";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/forms/field";

export function InviteForm() {
  const [state, action, pending] = useActionState<CrudState, FormData>(inviteUser, {});
  return (
    <form action={action} key={state.message ?? "i"} className="grid gap-4 rounded-xl border border-line bg-surface p-5 sm:grid-cols-4 sm:items-end">
      <Field id="full_name" label="Full name" required>{(p) => <input {...p} name="full_name" className={inputCls} required />}</Field>
      <Field id="email" label="Email" required>{(p) => <input {...p} name="email" type="email" className={inputCls} required />}</Field>
      <Field id="role" label="Role">{(p) => <select {...p} name="role" defaultValue="editor" className={inputCls}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>}</Field>
      <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send invitation"}</Button>
      <div className="sm:col-span-4" aria-live="polite">{state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}{state.ok && <p role="status" className="text-sm text-success">{state.message}</p>}</div>
    </form>
  );
}

export function UserRow({ u, canEdit, isSelf }: { u: any; canEdit: boolean; isSelf: boolean }) {
  const router = useRouter();
  const [role, setRole] = useState(u.role);
  const [active, setActive] = useState(u.is_active);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <tr>
      <td className="px-4 py-3"><p className="font-medium">{u.full_name || "—"}</p>{isSelf && <p className="text-xs text-muted">You</p>}</td>
      <td className="px-4 py-3"><label className="sr-only" htmlFor={`r-${u.id}`}>Role for {u.full_name}</label><select id={`r-${u.id}`} disabled={!canEdit || isSelf} value={role} onChange={(e) => setRole(e.target.value)} className="rounded border border-line px-2 py-1 text-sm">{ROLES.map((r) => <option key={r}>{r}</option>)}</select></td>
      <td className="px-4 py-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={!canEdit || isSelf} checked={active} onChange={(e) => setActive(e.target.checked)} /> Active</label></td>
      <td className="px-4 py-3 text-right">{canEdit && !isSelf && <button disabled={pending || (role === u.role && active === u.is_active)} className="rounded border border-line px-3 py-1 text-sm disabled:opacity-40" onClick={() => start(async () => { const r = await updateUserRole(u.id, role, active); setMsg(r.message ?? r.error ?? ""); if (r.ok) router.refresh(); })}>Save</button>}<p role="status" className="mt-1 text-xs text-muted">{msg}</p></td>
    </tr>
  );
}
