import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { applicationSchema, RESUME_MAX_BYTES, RESUME_TYPES } from "@/lib/validation/forms";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { clientIp, sameOrigin } from "@/lib/security/request";
import { generateReferenceCode } from "@/lib/utils";
import { sendNotification } from "@/lib/email";
import { siteUrl } from "@/lib/env";

export const runtime = "nodejs";
const GENERIC_ERROR = "We could not submit your application right now. Please try again shortly.";

export async function POST(req: Request) {
  if (!sameOrigin(req.headers, siteUrl())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  if (form.get("website")) return NextResponse.json({ ok: true, reference: generateReferenceCode() });

  const parsed = applicationSchema.safeParse({
    job_id: form.get("job_id"), full_name: form.get("full_name"), email: form.get("email"),
    phone: form.get("phone") ?? "", cover_letter: form.get("cover_letter") ?? "", consent: form.get("consent") === "true" || form.get("consent") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return NextResponse.json({ error: "Please check the highlighted fields.", fieldErrors }, { status: 422 });
  }
  const d = parsed.data;

  // Resume validation: type allow-list, size cap, and magic-number check (never trust the client MIME).
  const file = form.get("resume");
  let bytes: Uint8Array | null = null;
  let spec: (typeof RESUME_TYPES)[string] | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > RESUME_MAX_BYTES) return NextResponse.json({ error: "Please check the highlighted fields.", fieldErrors: { resume: "Resume must be 5 MB or smaller." } }, { status: 422 });
    spec = RESUME_TYPES[file.type] ?? null;
    bytes = new Uint8Array(await file.arrayBuffer());
    if (!spec || !spec.magic(bytes)) return NextResponse.json({ error: "Please check the highlighted fields.", fieldErrors: { resume: "Upload a PDF or Word document." } }, { status: 422 });
  } else {
    return NextResponse.json({ error: "Please check the highlighted fields.", fieldErrors: { resume: "Please attach your resume." } }, { status: 422 });
  }

  try {
    const db = createAdminSupabase();
    const ipKey = createHash("sha256").update(clientIp(req.headers)).digest("hex").slice(0, 32);
    const { data: allowed } = await db.rpc("check_rate_limit", { p_key: `apply:${ipKey}`, p_max: 5, p_window_seconds: 3600 });
    if (allowed === false) return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });

    // Job must be currently published.
    const { data: job } = await db.from("job_openings").select("id, title").eq("id", d.job_id).eq("status", "published").maybeSingle();
    if (!job) return NextResponse.json({ error: "This position is no longer accepting applications." }, { status: 404 });

    const path = `resumes/${new Date().getUTCFullYear()}/${randomUUID()}.${spec.ext}`; // never user-controlled
    const { error: upErr } = await db.storage.from("private-files").upload(path, bytes!, { contentType: file.type, upsert: false });
    if (upErr) { console.error("resume upload failed", upErr.message); return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 }); }

    const { data: app, error } = await db.from("applications").insert({
      job_id: job.id, full_name: d.full_name, email: d.email, phone: d.phone, cover_letter: d.cover_letter, resume_path: path, consent_given: true,
    }).select("id").single();
    if (error || !app) {
      await db.storage.from("private-files").remove([path]); // avoid orphaned files
      console.error("application insert failed", error?.code);
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
    }
    const reference = `APP-${app.id.slice(0, 8).toUpperCase()}`;
    void sendNotification({ subject: `New application — ${job.title}`, replyTo: d.email, text: `${d.full_name} applied for ${job.title}.\nReview: ${siteUrl()}/admin/applications` });
    return NextResponse.json({ ok: true, reference });
  } catch (err) {
    console.error("application route error", (err as Error).message);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
