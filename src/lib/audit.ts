import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";

/** Append an audit record. The actor is taken from the session inside the DB function (no spoofing). */
export async function logAudit(action: string, entityType: string, entityId?: string | null, metadata: Record<string, unknown> = {}) {
  try {
    const supabase = await createServerSupabase();
    await supabase.rpc("log_audit", {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId ?? null,
      p_metadata: metadata,
    });
  } catch (err) {
    console.error("audit log failed", err);
  }
}
