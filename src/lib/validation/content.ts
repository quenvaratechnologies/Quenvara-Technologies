import { z } from "zod";
import type { ContentType, Field } from "@/config/content-types";
import { slugify } from "@/lib/utils";
import { sanitizeRichText, stripTags } from "@/lib/security/sanitize";

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fieldSchema(f: Field): z.ZodTypeAny {
  const req = (msg = `${f.label} is required`) => z.string().trim().min(1, msg);
  switch (f.type) {
    case "text": {
      const s = z.string().trim().max(f.max ?? 255);
      return f.required ? req().pipe(s) : s.transform((v) => (v === "" ? null : v));
    }
    case "textarea": {
      const s = z.string().trim().max(f.max ?? 5000);
      return f.required ? req().pipe(s) : s.transform((v) => (v === "" ? null : v));
    }
    case "richtext":
      return z.string().max(200_000).transform((v) => sanitizeRichText(v));
    case "slug":
      return z.string().trim().toLowerCase().regex(SLUG_RE, "Use lowercase letters, numbers and single hyphens").max(96);
    case "select": {
      const values = (f.options ?? []).map((o) => o.value) as [string, ...string[]];
      return z.enum(values, { message: `Choose a valid ${f.label.toLowerCase()}` });
    }
    case "boolean":
      return z.boolean();
    case "number":
      return z.coerce.number().int().min(-100000).max(100000);
    case "url":
    case "image": {
      const u = z.string().trim().max(1000).refine((v) => v === "" || /^https?:\/\//i.test(v) || v.startsWith("/"), "Must be an http(s) URL or site path");
      return u.transform((v) => (v === "" ? null : v));
    }
    case "email":
      return z.string().trim().email().max(254);
    case "lines":
      return z.string().transform((v) => v.split("\n").map((l) => stripTags(l)).filter(Boolean).slice(0, 50));
    case "datetime":
      return z.string().trim().transform((v, ctx) => {
        if (!v) return null;
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) {
          ctx.addIssue({ code: "custom", message: "Invalid date" });
          return z.NEVER;
        }
        return d.toISOString();
      });
    case "relation":
      return z.string().trim().transform((v) => (v === "" ? null : v)).pipe(z.string().uuid().nullable());
  }
}

/** Reads a FormData into a plain object keyed by field name (booleans via checkbox presence). */
export function formDataToRaw(ct: ContentType, fd: FormData): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const f of ct.fields) {
    if (f.type === "boolean") raw[f.name] = fd.get(f.name) === "on" || fd.get(f.name) === "true";
    else raw[f.name] = (fd.get(f.name) ?? "").toString();
  }
  return raw;
}

export function buildSchema(ct: ContentType) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of ct.fields) shape[f.name] = fieldSchema(f);
  return z.object(shape);
}

/** Auto-fill slug from its source field before validation. */
export function withDerivedSlug(ct: ContentType, raw: Record<string, unknown>) {
  const slugField = ct.fields.find((f) => f.type === "slug");
  if (slugField && !String(raw[slugField.name] ?? "").trim() && slugField.slugFrom) {
    raw[slugField.name] = slugify(String(raw[slugField.slugFrom] ?? ""));
  }
  return raw;
}

/** Cross-field business rules that mirror DB CHECK constraints, so users get friendly errors. */
export function crossFieldErrors(ct: ContentType, v: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (ct.key === "projects") {
    if (v.client_display_name && !v.client_permission_confirmed)
      errors.client_display_name = "Confirm client permission before publishing a client name.";
    if (v.client_display_name && v.project_type !== "client")
      errors.client_display_name = "Only client engagements can display a client name.";
    if (v.outcomes && String(v.outcomes).replace(/<[^>]*>/g, "").trim() && !v.outcomes_verified)
      errors.outcomes = "Outcomes can only be saved when marked as verified.";
  }
  if (ct.key === "testimonials" && v.status === "published" && !v.permission_confirmed)
    errors.permission_confirmed = "Permission must be confirmed before a testimonial can be published.";
  if (ct.key === "navigation" && typeof v.url === "string" && !/^(\/|https?:\/\/|mailto:)/.test(v.url))
    errors.url = "Use a relative path, https:// URL or mailto: link.";
  return errors;
}
