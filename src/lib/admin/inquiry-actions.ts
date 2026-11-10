"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission, AuthorizationError } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { stripTags } from "@/lib/security/sanitize";
import type { CrudState } from "@/lib/admin/crud";

const fail = (e: unknown): CrudState => {
  if (e instanceof AuthorizationError) return { error: e.status === 401 ? "Your session has expired." : "You do not have permission to do that." };
  throw e;
};

import { INQUIRY_STATUSES, PRIORITIES } from "@/lib/admin/statuses";

const updateSchema = z.object({
  status: z.enum(INQUIRY_STATUSES),
  priority: z.enum(PRIORITIES),
  assigned_to: z.string().uuid().or(z.literal("")).transform((v) => v || null),
  follow_up_at: z.string().transform((v, ctx) => { if (!v) return null; const d = new Date(v); if (isNaN(d.getTime())) { ctx.addIssue({ code: "custom", message: "Invalid date" }); return z.NEVER; } return d.toISOString(); }),
});

export async function updateInquiry(id: string, _p: CrudState, fd: FormData): Promise<CrudState> {
  try { await assertPermission("inquiries", "update"); } catch (e) { return fail(e); }
  const parsed = updateSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { error: "Please check the values and try again." };
  const db = await createServerSupabase();
  const { data, error } = await db.from("inquiries").update(parsed.data).eq("id", id).select("id").maybeSingle();
  if (error || !data) return { error: "Could not update the inquiry." };
  await logAudit("inquiry.updated", "inquiry", id, parsed.data);
  revalidatePath("/admin/inquiries");
  return { ok: true, message: "Inquiry updated." };
}

export async function addInquiryNote(id: string, _p: CrudState, fd: FormData): Promise<CrudState> {
  let staff;
  try { staff = await assertPermission("inquiries", "update"); } catch (e) { return fail(e); }
  const note = stripTags(String(fd.get("note") ?? "")).slice(0, 5000);
  if (!note) return { error: "Enter a note." };
  const db = await createServerSupabase();
  const { error } = await db.from("inquiry_notes").insert({ inquiry_id: id, author_id: staff.id, note });
  if (error) return { error: "Could not save the note." };
  await logAudit("inquiry.note_added", "inquiry", id);
  revalidatePath(`/admin/inquiries/${id}`);
  return { ok: true, message: "Note added." };
}

export async function deleteInquiry(id: string, confirmation: string): Promise<CrudState> {
  if (confirmation !== "DELETE") return { error: "Type DELETE to confirm." };
  try { await assertPermission("inquiries", "delete"); } catch (e) { return fail(e); }
  const db = await createServerSupabase();
  const { error, count } = await db.from("inquiries").delete({ count: "exact" }).eq("id", id);
  if (error || !count) return { error: "Could not delete the inquiry." };
  await logAudit("inquiry.deleted", "inquiry", id);
  revalidatePath("/admin/inquiries");
  return { ok: true, message: "Inquiry deleted." };
}
