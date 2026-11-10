"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { safeAdminRedirect } from "@/lib/auth/session";
import { siteUrl } from "@/lib/env";
import { clientIp } from "@/lib/security/request";

export type FormState = { ok?: boolean; error?: string; message?: string };

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
});

async function limited(key: string, max: number, windowSec: number) {
  try {
    const { data } = await createAdminSupabase().rpc("check_rate_limit", { p_key: key, p_max: max, p_window_seconds: windowSec });
    return data === false;
  } catch {
    return false; // fail open for auth rate limit only if DB is unreachable; Supabase Auth has its own limits
  }
}

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const ip = clientIp(await headers());
  if (await limited(`login:${ip}`, 10, 900)) return { error: "Too many attempts. Please try again later." };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: "Invalid email or password." };

  // Must be an active staff member; otherwise sign straight back out.
  const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", data.user.id).maybeSingle();
  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return { error: "This account does not have access to the administration area." };
  }
  redirect(safeAdminRedirect(String(formData.get("next") ?? "")));
}

export async function logoutAction() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function requestPasswordResetAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.string().trim().email().max(254).safeParse(formData.get("email"));
  const generic: FormState = { ok: true, message: "If an account exists for that email, a reset link has been sent." };
  if (!parsed.success) return generic;
  const ip = clientIp(await headers());
  if (await limited(`reset:${ip}`, 5, 3600)) return generic;
  const supabase = await createServerSupabase();
  await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${siteUrl()}/admin/auth/callback?next=/admin/update-password` });
  return generic; // never reveal whether the account exists
}

const passwordSchema = z.object({
  password: z.string().min(12, "Use at least 12 characters.").max(200),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { message: "Passwords do not match.", path: ["confirm"] });

export async function updatePasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = passwordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Could not update the password. Try a stronger one." };
  redirect("/admin");
}
