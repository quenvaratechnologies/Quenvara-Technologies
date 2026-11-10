import { NextResponse } from "next/server";
import { assertPermission, AuthorizationError } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Neutralise spreadsheet formula injection and quote CSV fields. */
function cell(v: unknown): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  try { await assertPermission("inquiries", "read"); } catch (e) {
    if (e instanceof AuthorizationError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const sp = new URL(req.url).searchParams;
  const db = await createServerSupabase();
  let q = db.from("inquiries").select("reference_code, name, email, company, phone, service_interest, budget_range, project_timeline, status, priority, created_at").order("created_at", { ascending: false }).limit(5000);
  if (sp.get("status")) q = q.eq("status", sp.get("status")!);
  if (sp.get("priority")) q = q.eq("priority", sp.get("priority")!);
  if (sp.get("service")) q = q.eq("service_interest", sp.get("service")!);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: "Export failed" }, { status: 500 });
  const cols = ["reference_code", "name", "email", "company", "phone", "service_interest", "budget_range", "project_timeline", "status", "priority", "created_at"];
  const csv = [cols.join(","), ...(data ?? []).map((r: any) => cols.map((c) => cell(r[c])).join(","))].join("\n");
  await logAudit("inquiry.exported", "inquiry", null, { rows: data?.length ?? 0 });
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="inquiries-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
}
