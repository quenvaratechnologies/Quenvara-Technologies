"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission, AuthorizationError } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { stripTags } from "@/lib/security/sanitize";
import type { CrudState } from "@/lib/admin/crud";

import { APP_STATUSES } from "@/lib/admin/statuses";
const fail = (e: unknown): CrudState => { if (e instanceof AuthorizationError) return { error: e.status === 401 ? "Your session has expired." : "You do not have permission to do that." }; throw e; };

export async function updateApplication(id: string, _p: CrudState, fd: FormData): Promise<CrudState> {
  try { await assertPermission("applications", "update"); } catch (e) { return fail(e); }
  const parsed = z.object({ status: z.enum(APP_STATUSES), extend_retention: z.string().optional() }).safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { error: "Invalid values." };
  const patch: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.extend_retention === "on") patch.retention_until = new Date(Date.now() + 365 * 86_400_000).toISOString();
  const db = await createServerSupabase();
  const { data, error } = await db.from("applications").update(patch).eq("id", id).select("id").maybeSingle();
  if (error || !data) return { error: "Could not update the application." };
  await logAudit("application.updated", "application", id, { status: parsed.data.status, extended: !!patch.retention_until });
  revalidatePath("/admin/applications");
  return { ok: true, message: "Application updated." };
}

export async function addApplicationNote(id: string, _p: CrudState, fd: FormData): Promise<CrudState> {
  let staff;
  try { staff = await assertPermission("applications", "update"); } catch (e) { return fail(e); }
  const note = stripTags(String(fd.get("note") ?? "")).slice(0, 5000);
  if (!note) return { error: "Enter a note." };
  const db = await createServerSupabase();
  const { error } = await db.from("application_notes").insert({ application_id: id, author_id: staff.id, note });
  if (error) return { error: "Could not save the note." };
  revalidatePath(`/admin/applications/${id}`);
  return { ok: true, message: "Note added." };
}

/** Deletes the application row and its private resume file. Used for requests and retention expiry. */
export async function deleteApplication(id: string, confirmation: string): Promise<CrudState> {
  if (confirmation !== "DELETE") return { error: "Type DELETE to confirm." };
  try { await assertPermission("applications", "delete"); } catch (e) { return fail(e); }
  const db = await createServerSupabase();
  const { data: app } = await db.from("applications").select("resume_path").eq("id", id).maybeSingle();
  if (!app) return { error: "Application not found." };
  if (app.resume_path) await createAdminSupabase().storage.from("private-files").remove([app.resume_path]);
  const { error, count } = await db.from("applications").delete({ count: "exact" }).eq("id", id);
  if (error || !count) return { error: "Could not delete the application." };
  await logAudit("application.deleted", "application", id);
  revalidatePath("/admin/applications");
  return { ok: true, message: "Application and resume deleted." };
}

/** Deletes every application past its retention date (and their resumes). */
export async function purgeExpiredApplications(): Promise<CrudState> {
  try { await assertPermission("applications", "delete"); } catch (e) { return fail(e); }
  const db = await createServerSupabase();
  const { data } = await db.from("applications").select("id, resume_path").lt("retention_until", new Date().toISOString()).limit(500);
  const rows = data ?? [];
  if (!rows.length) return { ok: true, message: "No applications are past their retention date." };
  const paths = rows.map((r) => r.resume_path).filter(Boolean) as string[];
  if (paths.length) await createAdminSupabase().storage.from("private-files").remove(paths);
  const { error } = await db.from("applications").delete().in("id", rows.map((r) => r.id));
  if (error) return { error: "Purge failed." };
  await logAudit("application.retention_purge", "application", null, { count: rows.length });
  revalidatePath("/admin/applications");
  return { ok: true, message: `Deleted ${rows.length} expired application(s).` };
}
