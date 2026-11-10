"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/forms/field";
import { BUDGET_RANGES, TIMELINES } from "@/lib/validation/forms";

export function ContactForm({ services, defaultService }: { services: string[]; defaultService?: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true); setErrors({}); setFormError(null);
    const fd = new FormData(e.currentTarget);
    const body = { ...Object.fromEntries(fd.entries()), consent: fd.get("consent") === "on" };
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) { setReference(json.reference); return; }
      setErrors(json.fieldErrors ?? {});
      setFormError(json.error ?? "Something went wrong. Please try again.");
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    } finally { setPending(false); }
  }

  if (reference) {
    return (
      <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-8">
        <h2 className="text-xl font-semibold text-green-900">Thank you — we have your enquiry.</h2>
        <p className="mt-2 text-green-900">Your reference is <strong className="font-mono">{reference}</strong>. Please quote it in any follow-up.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{formError}</div>}
      <div className="hidden" aria-hidden="true"><label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Name" required error={errors.name}>{(p) => <input {...p} name="name" autoComplete="name" className={inputCls} required />}</Field>
        <Field id="email" label="Business email" required error={errors.email}>{(p) => <input {...p} name="email" type="email" autoComplete="email" className={inputCls} required />}</Field>
        <Field id="company" label="Company" required error={errors.company}>{(p) => <input {...p} name="company" autoComplete="organization" className={inputCls} required />}</Field>
        <Field id="phone" label="Phone (optional)" error={errors.phone}>{(p) => <input {...p} name="phone" type="tel" autoComplete="tel" className={inputCls} />}</Field>
        <Field id="service_interest" label="Service of interest" error={errors.service_interest}>
          {(p) => <select {...p} name="service_interest" defaultValue={defaultService ?? ""} className={inputCls}><option value="">Select…</option>{services.map((s) => <option key={s} value={s}>{s}</option>)}{defaultService && !services.includes(defaultService) && <option value={defaultService}>{defaultService}</option>}</select>}
        </Field>
        <Field id="budget_range" label="Budget range" error={errors.budget_range}>{(p) => <select {...p} name="budget_range" className={inputCls}><option value="">Select…</option>{BUDGET_RANGES.map((b) => <option key={b}>{b}</option>)}</select>}</Field>
        <Field id="project_timeline" label="Timeline" error={errors.project_timeline}>{(p) => <select {...p} name="project_timeline" className={inputCls}><option value="">Select…</option>{TIMELINES.map((b) => <option key={b}>{b}</option>)}</select>}</Field>
      </div>
      <Field id="message" label="How can we help?" required error={errors.message} hint="Please do not include passwords or sensitive personal data.">{(p) => <textarea {...p} name="message" rows={6} className={inputCls} required />}</Field>
      <div>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="consent" className="mt-1 h-4 w-4" aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "consent-err" : undefined} /> <span>I agree that Quenvara may use these details to respond to my enquiry, as described in the <Link href="/legal/privacy-policy" className="text-brand underline">Privacy Policy</Link>.</span></label>
        {errors.consent && <p id="consent-err" className="mt-1 text-sm text-danger">{errors.consent}</p>}
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send enquiry"}</Button>
    </form>
  );
}
