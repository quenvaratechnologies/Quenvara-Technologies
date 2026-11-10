"use server";

import { revalidatePath } from "next/cache";
import { assertPermission, AuthorizationError } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { getContentType } from "@/config/content-types";
import { RELATIONS } from "@/config/relations";
import { logAudit } from "@/lib/audit";
import type { CrudState } from "@/lib/admin/crud";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Replaces the set of linked records for one relation. Diff-based so a failure never wipes existing links. */
export async function saveRelation(typeKey: string, id: string, relKey: string, otherIds: string[]): Promise<CrudState> {
  const ct = getContentType(typeKey);
  const rel = RELATIONS[typeKey]?.find((r) => r.key === relKey);
  if (!ct || !rel || !UUID.test(id) || otherIds.some((o) => !UUID.test(o))) return { error: "Invalid request." };
  try { await assertPermission(ct.resource, "update"); } catch (e) {
    if (e instanceof AuthorizationError) return { error: "You do not have permission to do that." };
    throw e;
  }
  const db = await createServerSupabase();
  const { data: existing, error: readErr } = await db.from(rel.junction).select(rel.otherCol).eq(rel.ownerCol, id);
  if (readErr) return { error: "Could not load current links." };
  const current = new Set(((existing ?? []) as unknown as Record<string, string>[]).map((r) => r[rel.otherCol]));
  const next = new Set(otherIds);
  const toAdd = [...next].filter((x) => !current.has(x));
  const toRemove = [...current].filter((x) => !next.has(x));
  if (toAdd.length) {
    const { error } = await db.from(rel.junction).insert(toAdd.map((o) => ({ [rel.ownerCol]: id, [rel.otherCol]: o })));
    if (error) return { error: "Could not add links." };
  }
  if (toRemove.length) {
    const { error } = await db.from(rel.junction).delete().eq(rel.ownerCol, id).in(rel.otherCol, toRemove);
    if (error) return { error: "Could not remove links." };
  }
  await logAudit(`${ct.key}.relations_updated`, ct.key, id, { relation: relKey, added: toAdd.length, removed: toRemove.length });
  revalidatePath("/", "layout");
  if (ct.publicPath) revalidatePath(ct.publicPath, "layout");
  return { ok: true, message: `${rel.label} updated.` };
}
