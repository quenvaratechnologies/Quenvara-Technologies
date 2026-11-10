"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission, AuthorizationError } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { stripTags } from "@/lib/security/sanitize";
import type { CrudState } from "@/lib/admin/crud";

import { SETTING_GROUPS, type SettingKey } from "@/lib/admin/settings-groups";

export async function saveSettingGroup(key: SettingKey, _p: CrudState, fd: FormData): Promise<CrudState> {
  const group = SETTING_GROUPS[key];
  if (!group) return { error: "Unknown setting group." };
  let staff;
  try { staff = await assertPermission("settings", "update"); } catch (e) {
    if (e instanceof AuthorizationError) return { error: "You do not have permission to do that." };
    throw e;
  }
  const raw: Record<string, unknown> = {};
  for (const [name, , type] of group.fields as readonly (readonly [string, string, string?])[]) raw[name] = type === "checkbox" ? (fd.get(name) === "on" ? "on" : "") : String(fd.get(name) ?? "");
  const parsed = (group.schema as z.ZodTypeAny).safeParse(raw);
  if (!parsed.success) { const fieldErrors: Record<string, string> = {}; for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message; return { error: "Please correct the highlighted fields.", fieldErrors }; }

  let value: Record<string, unknown> = parsed.data as Record<string, unknown>;
  const db = await createServerSupabase();
  if (key === "company") {
    const v = parsed.data as Record<string, string>;
    value = {
      name: v.name, tagline: v.tagline, description: v.description, email: v.email || null, phone: v.phone || null, logo: v.logo || null, logo_only: v.logo_only === "on",
      offices: v.offices.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 10).map((l) => { const [label, ...rest] = l.split("|"); return rest.length ? { label: stripTags(label), address: stripTags(rest.join("|")) } : { label: "", address: stripTags(label) }; }),
      social: Object.fromEntries(["linkedin", "x", "github", "youtube", "facebook", "instagram"].map((k) => [k, v[`social_${k}`]]).filter(([, u]) => u)),
    };
  } else if (key === "homepage_sections") {
    const v = parsed.data as Record<string, string>;
    value = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k.startsWith("hide_") ? x === "on" : x]));
  } else if (key === "announcement") {
    const v = parsed.data as Record<string, string>;
    value = { enabled: v.enabled === "on", text: v.text, href: v.href };
  }
  const { error } = await db.from("site_settings").upsert({ key, value, is_public: true, updated_by: staff.id }, { onConflict: "key" });
  if (error) return { error: "Could not save settings." };
  await logAudit("settings.updated", "settings", key);
  revalidatePath("/", "layout");
  return { ok: true, message: `${group.label} saved.` };
}
