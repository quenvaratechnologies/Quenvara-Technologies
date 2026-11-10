"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission, AuthorizationError } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import type { CrudState } from "@/lib/admin/crud";

const path = z.string().trim().max(300).regex(/^\/[A-Za-z0-9\-_/]*$/, "Use a site path such as /services/old-name");
const fail = (e: unknown): CrudState => { if (e instanceof AuthorizationError) return { error: "You do not have permission to do that." }; throw e; };

export async function addRedirect(_p: CrudState, fd: FormData): Promise<CrudState> {
  try { await assertPermission("seo", "update"); } catch (e) { return fail(e); }
  const parsed = z.object({ from_path: path, to_path: path }).refine((v) => v.from_path !== v.to_path, "Source and target must differ").safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const db = await createServerSupabase();
  const { error } = await db.from("redirects").upsert(parsed.data, { onConflict: "from_path" });
  if (error) return { error: "Could not save the redirect." };
  await logAudit("redirect.saved", "redirect", parsed.data.from_path);
  revalidatePath("/admin/seo");
  return { ok: true, message: "Redirect saved." };
}

export async function deleteRedirect(id: string): Promise<CrudState> {
  try { await assertPermission("seo", "update"); } catch (e) { return fail(e); }
  const db = await createServerSupabase();
  const { error } = await db.from("redirects").delete().eq("id", id);
  if (error) return { error: "Could not delete the redirect." };
  await logAudit("redirect.deleted", "redirect", id);
  revalidatePath("/admin/seo");
  return { ok: true, message: "Redirect removed." };
}
