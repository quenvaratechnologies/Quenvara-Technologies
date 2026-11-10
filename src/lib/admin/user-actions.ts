"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission, AuthorizationError } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { ROLES } from "@/lib/permissions";
import { siteUrl } from "@/lib/env";
import type { CrudState } from "@/lib/admin/crud";

const fail = (e: unknown): CrudState => { if (e instanceof AuthorizationError) return { error: e.status === 401 ? "Your session has expired." : "Only an owner can manage users." }; throw e; };

/** Invite a new staff member by email. Public registration does not exist; this is the only path. */
export async function inviteUser(_p: CrudState, fd: FormData): Promise<CrudState> {
  try { await assertPermission("users", "create"); } catch (e) { return fail(e); }
  const parsed = z.object({ email: z.string().trim().email().max(254), full_name: z.string().trim().min(1).max(120), role: z.enum(ROLES) }).safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { error: "Enter a name, valid email and role." };
  const admin = createAdminSupabase();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, { redirectTo: `${siteUrl()}/admin/auth/callback?next=/admin/update-password` });
  if (error || !data.user) return { error: "Could not send the invitation. The user may already exist." };
  const { error: pErr } = await admin.from("profiles").upsert({ id: data.user.id, full_name: parsed.data.full_name, role: parsed.data.role, is_active: true });
  if (pErr) { await admin.auth.admin.deleteUser(data.user.id); return { error: "Could not create the profile." }; }
  await logAudit("user.invited", "profile", data.user.id, { role: parsed.data.role });
  revalidatePath("/admin/users");
  return { ok: true, message: "Invitation sent. The user sets their password from the emailed link." };
}

/** Role/activation changes go through the user's own session so the DB guard trigger + RLS enforce "owner only". */
export async function updateUserRole(id: string, role: string, isActive: boolean): Promise<CrudState> {
  try { await assertPermission("users", "update"); } catch (e) { return fail(e); }
  if (!(ROLES as readonly string[]).includes(role)) return { error: "Invalid role." };
  const db = await createServerSupabase();
  const { data, error } = await db.from("profiles").update({ role, is_active: isActive }).eq("id", id).select("id").maybeSingle();
  if (error) return { error: error.code === "42501" ? error.message : "Could not update the user." };
  if (!data) return { error: "User not found or not permitted." };
  revalidatePath("/admin/users");
  return { ok: true, message: "User updated." };
}
