"use server";

import { revalidatePath } from "next/cache";
import { assertPermission, AuthorizationError } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { getContentType, type ContentType } from "@/config/content-types";
import { buildSchema, crossFieldErrors, formDataToRaw, withDerivedSlug } from "@/lib/validation/content";
import { logAudit } from "@/lib/audit";

export type CrudState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
};

function pgMessage(err: { code?: string; message?: string }): string {
  if (err.code === "23505") return "That slug (or unique value) is already in use.";
  if (err.code === "23503") return err.message?.includes("referenced") ? err.message : "This record is referenced by other content.";
  if (err.code === "23514") return "A business rule was violated (e.g. permission or verification flags).";
  if (err.code === "42501") return "You do not have permission to perform this action.";
  return "The change could not be saved. Please try again.";
}

function revalidateFor(ct: ContentType, slug?: string) {
  revalidatePath("/", "page");
  revalidatePath("/sitemap.xml");
  revalidatePath("/search");
  if (ct.publicPath) {
    revalidatePath(ct.publicPath, "page");
    if (slug) revalidatePath(`${ct.publicPath}/${slug}`, "page");
  }
  if (ct.key === "navigation" || ct.key === "pages") revalidatePath("/", "layout");
  if (ct.key === "team" || ct.key === "testimonials" || ct.key === "faqs") revalidatePath("/about", "page");
}

function guard(typeKey: string): ContentType {
  const ct = getContentType(typeKey);
  if (!ct) throw new Error("Unknown content type");
  return ct;
}

function authFail(e: unknown): CrudState {
  if (e instanceof AuthorizationError) return { error: e.status === 401 ? "Your session has expired. Sign in again." : "You do not have permission to do that." };
  throw e;
}

export async function saveRecord(typeKey: string, id: string | null, _prev: CrudState, formData: FormData): Promise<CrudState> {
  const ct = guard(typeKey);
  let staff;
  try {
    staff = await assertPermission(ct.resource, id ? "update" : "create");
  } catch (e) {
    return authFail(e);
  }

  const raw = withDerivedSlug(ct, formDataToRaw(ct, formData));
  const parsed = buildSchema(ct).safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Please correct the highlighted fields.", fieldErrors };
  }
  const values = parsed.data as Record<string, unknown>;
  const cross = crossFieldErrors(ct, values);
  if (Object.keys(cross).length) return { error: "Please correct the highlighted fields.", fieldErrors: cross };

  const supabase = await createServerSupabase();

  // Publishing/unpublishing is a distinct permission, checked here and again by the DB trigger.
  let previous = null as { status?: string; slug?: string } | null;
  if (id) {
    const { data } = await supabase.from(ct.table).select(ct.statusColumn === "status" ? "status, slug" : "slug").eq("id", id).maybeSingle();
    previous = (data as unknown as { status?: string; slug?: string } | null) ?? null;
  }
  if (ct.publishable && "status" in values) {
    const wasPublished = previous?.status === "published";
    const willBePublished = values.status === "published";
    if (wasPublished !== willBePublished) {
      try { await assertPermission(ct.resource, "publish"); } catch (e) { return authFail(e); }
    }
  }
  if (ct.key === "projects" && !values.outcomes_verified) values.outcomes = null;
  if (ct.key === "projects" && !values.client_permission_confirmed) values.client_display_name = null;
  if (ct.key === "posts" && values.status === "published" && !values.published_at) values.published_at = new Date().toISOString();

  const query = id
    ? supabase.from(ct.table).update(values).eq("id", id).select("id").maybeSingle()
    : supabase.from(ct.table).insert({ ...values, ...(ct.table === "services" ? { created_by: staff.id } : {}) }).select("id").maybeSingle();
  const { data, error } = await query;
  if (error) {
    const fieldErrors = error.code === "23505" && "slug" in values ? { slug: "This slug is already in use." } : undefined;
    return { error: pgMessage(error), fieldErrors };
  }
  if (!data) return { error: "Record not found or you do not have access to it." };

  // Keep old public URLs working if a published slug changed.
  if (id && ct.publicPath && previous?.slug && values.slug && previous.slug !== values.slug && previous.status === "published") {
    await supabase.from("redirects").upsert({ from_path: `${ct.publicPath}/${previous.slug}`, to_path: `${ct.publicPath}/${values.slug}` }, { onConflict: "from_path" });
  }

  await logAudit(id ? `${ct.key}.updated` : `${ct.key}.created`, ct.key, data.id, { title: values[ct.titleField] });
  revalidateFor(ct, String(values.slug ?? ""));
  if (previous?.slug && previous.slug !== values.slug) revalidateFor(ct, previous.slug);
  return { ok: true, message: `${ct.singular} saved.`, id: data.id };
}

export async function setRecordStatus(typeKey: string, id: string, status: string): Promise<CrudState> {
  const ct = guard(typeKey);
  if (!ct.statusColumn || !ct.statuses.includes(status)) return { error: "Invalid status." };
  try {
    await assertPermission(ct.resource, status === "published" || status === "draft" ? "publish" : "update");
  } catch (e) {
    return authFail(e);
  }
  const supabase = await createServerSupabase();
  const patch: Record<string, unknown> = { [ct.statusColumn]: status };
  if (status === "published" && ct.table !== "team_members" && ct.table !== "testimonials" && ct.table !== "packages" && ct.table !== "faqs" && ct.table !== "technologies" && ct.table !== "industries") patch.published_at = new Date().toISOString();
  const { data, error } = await supabase.from(ct.table).update(patch).eq("id", id).select("id, slug").maybeSingle();
  if (error) return { error: pgMessage(error) };
  if (!data) return { error: "Record not found or you do not have access to it." };
  await logAudit(`${ct.key}.status_${status}`, ct.key, id);
  revalidateFor(ct, (data as { slug?: string }).slug);
  return { ok: true, message: `${ct.singular} ${status === "published" ? "published" : status === "archived" ? "archived" : "set to " + status}.` };
}

export async function deleteRecord(typeKey: string, id: string, confirmation: string): Promise<CrudState> {
  const ct = guard(typeKey);
  if (confirmation !== "DELETE") return { error: "Type DELETE to confirm permanent deletion." };
  try {
    await assertPermission(ct.resource, "delete");
  } catch (e) {
    return authFail(e);
  }
  const supabase = await createServerSupabase();
  const { data: before } = await supabase.from(ct.table).select("*").eq("id", id).maybeSingle();
  const { error, count } = await supabase.from(ct.table).delete({ count: "exact" }).eq("id", id);
  if (error) return { error: pgMessage(error) };
  if (!count) return { error: "Record not found or you do not have access to it." };
  await logAudit(`${ct.key}.deleted`, ct.key, id, { title: before ? (before as Record<string, unknown>)[ct.titleField] : undefined });
  revalidateFor(ct, (before as { slug?: string } | null)?.slug);
  return { ok: true, message: `${ct.singular} permanently deleted.` };
}
