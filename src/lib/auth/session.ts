import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { can, isRole, type Action, type Resource, type Role } from "@/lib/permissions";

export type Staff = { id: string; email: string; fullName: string; role: Role };

/**
 * Server-verified staff identity. The user is validated with Supabase Auth (getUser),
 * and the role is read from public.profiles — never from JWT metadata or client input.
 */
export const getStaff = cache(async (): Promise<Staff | null> => {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !profile.is_active || !isRole(profile.role)) return null;
  return { id: user.id, email: user.email ?? "", fullName: profile.full_name, role: profile.role };
});

/** For pages: redirect unauthenticated users to login, forbid insufficient roles. */
export async function requireStaff(resource?: Resource, action: Action = "read"): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  if (resource && !can(staff.role, resource, action)) redirect("/admin/forbidden");
  return staff;
}

export class AuthorizationError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
  }
}

/** For server actions / route handlers: throws instead of redirecting. */
export async function assertPermission(resource: Resource, action: Action): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) throw new AuthorizationError(401, "Not authenticated");
  if (!can(staff.role, resource, action)) throw new AuthorizationError(403, "Not permitted");
  return staff;
}

/** Only same-site /admin paths are valid post-login redirect targets (prevents open redirects). */
export function safeAdminRedirect(next: string | null | undefined): string {
  if (!next) return "/admin";
  if (!/^\/admin(\/[A-Za-z0-9\-_/]*)?$/.test(next) || next.startsWith("//")) return "/admin";
  if (next.startsWith("/admin/login")) return "/admin";
  return next;
}
