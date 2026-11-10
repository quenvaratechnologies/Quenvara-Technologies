import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { contactSchema } from "@/lib/validation/forms";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { clientIp, sameOrigin } from "@/lib/security/request";
import { generateReferenceCode } from "@/lib/utils";
import { sendNotification } from "@/lib/email";
import { siteUrl } from "@/lib/env";

export const runtime = "nodejs";
const GENERIC_ERROR = "We could not submit your enquiry right now. Please try again shortly.";

export async function POST(req: Request) {
  if (!sameOrigin(req.headers, siteUrl())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (Number(req.headers.get("content-length") ?? 0) > 50_000) return NextResponse.json({ error: "Request too large" }, { status: 413 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  // Honeypot: pretend success so bots learn nothing.
  if (typeof body === "object" && body && (body as Record<string, unknown>).website) {
    return NextResponse.json({ ok: true, reference: generateReferenceCode() });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return NextResponse.json({ error: "Please check the highlighted fields.", fieldErrors }, { status: 422 });
  }
  const d = parsed.data;

  try {
    const db = createAdminSupabase();
    const ip = clientIp(req.headers);
    const ipKey = createHash("sha256").update(ip).digest("hex").slice(0, 32);
    const { data: allowed } = await db.rpc("check_rate_limit", { p_key: `contact:${ipKey}`, p_max: 5, p_window_seconds: 3600 });
    if (allowed === false) return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });

    // Duplicate mitigation: same email + message within 10 minutes returns the original reference.
    const dedupe = createHash("sha256").update(`${d.email}|${d.message}`).digest("hex");
    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    const { data: existing } = await db.from("inquiries").select("reference_code").eq("dedupe_hash", dedupe).gte("created_at", since).maybeSingle();
    if (existing) return NextResponse.json({ ok: true, reference: existing.reference_code });

    let reference = generateReferenceCode();
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await db.from("inquiries").insert({
        reference_code: reference, name: d.name, email: d.email, company: d.company, phone: d.phone,
        service_interest: d.service_interest, budget_range: d.budget_range ?? null, project_timeline: d.project_timeline ?? null,
        message: d.message, consent_given: true, dedupe_hash: dedupe,
      });
      if (!error) break;
      if (error.code === "23505" && attempt < 2) { reference = generateReferenceCode(); continue; }
      console.error("inquiry insert failed", error.code);
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
    }

    void sendNotification({
      subject: `New enquiry ${reference} — ${d.company}`,
      replyTo: d.email,
      text: `Reference: ${reference}\nName: ${d.name}\nCompany: ${d.company}\nEmail: ${d.email}\nService: ${d.service_interest ?? "-"}\nBudget: ${d.budget_range ?? "-"}\nTimeline: ${d.project_timeline ?? "-"}\n\n${d.message}\n\nView in admin: ${siteUrl()}/admin/inquiries`,
    });
    return NextResponse.json({ ok: true, reference });
  } catch (err) {
    console.error("contact route error", (err as Error).message);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
