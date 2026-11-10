"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/forms/field";

export function ApplyForm({ jobId }: { jobId: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true); setErrors({}); setFormError(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("resume");
    if (file instanceof File && file.size > 5 * 1024 * 1024) { setErrors({ resume: "Resume must be 5 MB or smaller." }); setPending(false); return; }
    fd.set("consent", fd.get("consent") === "on" ? "true" : "false");
    try {
      const res = await fetch("/api/applications", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) { setReference(json.reference); return; }
      setErrors(json.fieldErrors ?? {}); setFormError(json.error ?? "Something went wrong. Please try again.");
    } catch { setFormError("Network error. Please try again."); } finally { setPending(false); }
  }

  if (reference) return <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-8"><h2 className="text-xl font-semibold text-green-900">Application received</h2><p className="mt-2 text-green-900">Your reference is <strong className="font-mono">{reference}</strong>. We will be in touch if your profile matches the role.</p></div>;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{formError}</div>}
      <input type="hidden" name="job_id" value={jobId} />
      <div className="hidden" aria-hidden="true"><label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="full_name" label="Full name" required error={errors.full_name}>{(p) => <input {...p} name="full_name" autoComplete="name" className={inputCls} required />}</Field>
        <Field id="email" label="Email" required error={errors.email}>{(p) => <input {...p} name="email" type="email" autoComplete="email" className={inputCls} required />}</Field>
        <Field id="phone" label="Phone (optional)" error={errors.phone}>{(p) => <input {...p} name="phone" type="tel" autoComplete="tel" className={inputCls} />}</Field>
        <Field id="resume" label="Resume" required error={errors.resume} hint="PDF or Word, up to 5 MB. Visible only to authorised recruiters.">{(p) => <input {...p} name="resume" type="file" accept=".pdf,.doc,.docx" className={inputCls} required />}</Field>
      </div>
      <Field id="cover_letter" label="Cover letter (optional)" error={errors.cover_letter}>{(p) => <textarea {...p} name="cover_letter" rows={5} className={inputCls} />}</Field>
      <div>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="consent" className="mt-1 h-4 w-4" /> <span>I agree to my application data being processed for recruitment and retained for up to 12 months, per the <Link href="/legal/privacy-policy" className="text-brand underline">Privacy Policy</Link>.</span></label>
        {errors.consent && <p className="mt-1 text-sm text-danger">{errors.consent}</p>}
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Submitting…" : "Submit application"}</Button>
    </form>
  );
}
