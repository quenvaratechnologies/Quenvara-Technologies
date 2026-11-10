"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addRedirect, deleteRedirect } from "@/lib/admin/redirect-actions";
import type { CrudState } from "@/lib/admin/crud";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/forms/field";

export function RedirectForm() {
  const [state, action, pending] = useActionState<CrudState, FormData>(addRedirect, {});
  return (
    <form action={action} key={state.message ?? "r"} className="grid gap-4 rounded-xl border border-line bg-surface p-5 sm:grid-cols-3 sm:items-end">
      <Field id="from_path" label="From path" required>{(p) => <input {...p} name="from_path" placeholder="/services/old-slug" className={inputCls} required />}</Field>
      <Field id="to_path" label="To path" required>{(p) => <input {...p} name="to_path" placeholder="/services/new-slug" className={inputCls} required />}</Field>
      <Button type="submit" disabled={pending}>Save redirect</Button>
      <div className="sm:col-span-3" aria-live="polite">{state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}{state.ok && <p role="status" className="text-sm text-success">{state.message}</p>}</div>
    </form>
  );
}

export function DeleteRedirect({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return <button disabled={pending} className="rounded border border-red-200 px-2 py-1 text-xs text-danger" onClick={() => start(async () => { await deleteRedirect(id); router.refresh(); })}>Remove</button>;
}
