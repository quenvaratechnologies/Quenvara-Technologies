"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/session";
import { stripTags } from "@/lib/security/sanitize";
import type { FormState } from "@/lib/auth/actions";

const nameSchema = z.string().trim().min(1, "Name is required.").max(120, "Name is too long.");

/** Staff can edit only their own display name; role/active flags are protected by RLS + guard trigger. */
export async function updateProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const parsed = nameSchema.safeParse(fd.get("full_name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const db = await createServerSupabase();
  const { error } = await db.from("profiles").update({ full_name: stripTags(parsed.data) }).eq("id", staff.id);
  if (error) return { error: "Could not save your profile." };
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Profile updated." };
}

const pwSchema = z.object({
  password: z.string().min(12, "Use at least 12 characters.").max(128),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { message: "Passwords do not match.", path: ["confirm"] });

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireStaff();
  const parsed = pwSchema.safeParse({ password: fd.get("password"), confirm: fd.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const db = await createServerSupabase();
  const { error } = await db.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Could not update the password. Try a stronger one." };
  return { ok: true, message: "Password changed." };
}
