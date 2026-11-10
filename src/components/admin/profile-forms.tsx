"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { updateProfileAction, changePasswordAction } from "@/lib/admin/profile-actions";
import type { FormState } from "@/lib/auth/actions";

const input = "mt-1 block w-full rounded-lg border border-line bg-white px-3 py-2 text-sm";
function Msg({ s }: { s: FormState }) {
  return <>{s.error && <p role="alert" className="mt-3 text-sm text-danger">{s.error}</p>}{s.ok && <p role="status" className="mt-3 text-sm text-success">{s.message}</p>}</>;
}

export function ProfileForm({ fullName, email, role }: { fullName: string; email: string; role: string }) {
  const [s, action, pending] = useActionState(updateProfileAction, {} as FormState);
  return (
    <form action={action} className="rounded-xl border border-line bg-white p-6 shadow-[var(--shadow-card)]">
      <h2 className="font-semibold">Profile</h2>
      <label className="mt-4 block text-sm font-medium">Display name<input name="full_name" defaultValue={fullName} required maxLength={120} className={input} /></label>
      <p className="mt-4 text-sm text-muted">Email: {email} · Role: <span className="capitalize">{role}</span> (changed only by an owner in Users)</p>
      <Msg s={s} />
      <Button type="submit" disabled={pending} className="mt-4">{pending ? "Saving…" : "Save profile"}</Button>
    </form>
  );
}

export function PasswordForm() {
  const [s, action, pending] = useActionState(changePasswordAction, {} as FormState);
  return (
    <form action={action} className="rounded-xl border border-line bg-white p-6 shadow-[var(--shadow-card)]">
      <h2 className="font-semibold">Change password</h2>
      <label className="mt-4 block text-sm font-medium">New password<input name="password" type="password" autoComplete="new-password" required minLength={12} className={input} /></label>
      <label className="mt-3 block text-sm font-medium">Confirm password<input name="confirm" type="password" autoComplete="new-password" required className={input} /></label>
      <Msg s={s} />
      <Button type="submit" disabled={pending} className="mt-4">{pending ? "Updating…" : "Change password"}</Button>
    </form>
  );
}
