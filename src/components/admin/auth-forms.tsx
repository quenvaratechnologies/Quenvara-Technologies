"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, requestPasswordResetAction, updatePasswordAction, type FormState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/forms/field";

const init: FormState = {};
function Msg({ s }: { s: FormState }) {
  if (s.error) return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{s.error}</div>;
  if (s.message) return <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{s.message}</div>;
  return null;
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, init);
  return (
    <form action={action} className="space-y-5">
      <Msg s={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field id="email" label="Email" required>{(p) => <input {...p} name="email" type="email" autoComplete="username" className={inputCls} required />}</Field>
      <Field id="password" label="Password" required>{(p) => <input {...p} name="password" type="password" autoComplete="current-password" className={inputCls} required />}</Field>
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
      <p className="text-center text-sm"><Link href="/admin/reset-password" className="text-brand hover:underline">Forgot your password?</Link></p>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, init);
  return (
    <form action={action} className="space-y-5">
      <Msg s={state} />
      <Field id="email" label="Email" required>{(p) => <input {...p} name="email" type="email" autoComplete="email" className={inputCls} required />}</Field>
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</Button>
      <p className="text-center text-sm"><Link href="/admin/login" className="text-brand hover:underline">Back to sign in</Link></p>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, init);
  return (
    <form action={action} className="space-y-5">
      <Msg s={state} />
      <Field id="password" label="New password" hint="At least 12 characters." required>{(p) => <input {...p} name="password" type="password" autoComplete="new-password" minLength={12} className={inputCls} required />}</Field>
      <Field id="confirm" label="Confirm password" required>{(p) => <input {...p} name="confirm" type="password" autoComplete="new-password" className={inputCls} required />}</Field>
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving…" : "Update password"}</Button>
    </form>
  );
}
