import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ContentType } from "@/config/content-types";

export async function loadRelationOptions(ct: ContentType) {
  const db = await createServerSupabase();
  const out: Record<string, { value: string; label: string }[]> = {};
  for (const f of ct.fields) {
    if (f.type !== "relation" || !f.relation) continue;
    const { data } = await db.from(f.relation.table).select(`id, ${f.relation.labelColumn}`).order(f.relation.labelColumn).limit(500);
    out[f.name] = ((data ?? []) as unknown as Record<string, string>[]).map((r) => ({ value: r.id, label: r[f.relation!.labelColumn] }));
  }
  return out;
}
