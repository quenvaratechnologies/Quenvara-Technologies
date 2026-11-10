import { NextResponse } from "next/server";
import { assertPermission, AuthorizationError } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Authorise → look up path with the caller's RLS-scoped client → issue a 60-second signed URL. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try { await assertPermission("applications", "read"); } catch (e) {
    if (e instanceof AuthorizationError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const db = await createServerSupabase();
  const { data: app } = await db.from("applications").select("resume_path").eq("id", id).maybeSingle();
  if (!app?.resume_path) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data, error } = await createAdminSupabase().storage.from("private-files").createSignedUrl(app.resume_path, 60, { download: true });
  if (error || !data) return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  await logAudit("application.resume_downloaded", "application", id);
  const res = NextResponse.redirect(data.signedUrl, 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
