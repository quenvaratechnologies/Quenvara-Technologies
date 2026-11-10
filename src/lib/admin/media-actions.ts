"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { assertPermission, AuthorizationError } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import type { CrudState } from "@/lib/admin/crud";

const TYPES: Record<string, { ext: string; magic: (b: Uint8Array) => boolean }> = {
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 },
  "image/png": { ext: "png", magic: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  "image/webp": { ext: "webp", magic: (b) => b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45 },
  "image/avif": { ext: "avif", magic: (b) => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 },
};
const MAX = 5 * 1024 * 1024;
const fail = (e: unknown): CrudState => { if (e instanceof AuthorizationError) return { error: e.status === 401 ? "Your session has expired." : "You do not have permission to do that." }; throw e; };

export async function uploadMedia(_p: CrudState, fd: FormData): Promise<CrudState> {
  let staff;
  try { staff = await assertPermission("media", "create"); } catch (e) { return fail(e); }
  const file = fd.get("file");
  const alt = String(fd.get("alt_text") ?? "").trim().slice(0, 300);
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image to upload." };
  if (file.size > MAX) return { error: "Image must be 5 MB or smaller." };
  const spec = TYPES[file.type];
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!spec || !spec.magic(bytes)) return { error: "Only JPEG, PNG, WebP or AVIF images are allowed." };
  if (!alt) return { error: "Alt text is required so the image is accessible." };

  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
  const path = `${new Date().getUTCFullYear()}/${base}-${randomUUID().slice(0, 8)}.${spec.ext}`;
  const db = await createServerSupabase();
  const { error: upErr } = await db.storage.from("public-media").upload(path, bytes, { contentType: file.type, upsert: false });
  if (upErr) return { error: "Upload failed." };
  const w = Number(fd.get("width")) || null, h = Number(fd.get("height")) || null;
  const { error } = await db.from("media_assets").insert({ storage_path: path, bucket: "public-media", original_filename: file.name.slice(0, 200), mime_type: file.type, size_bytes: file.size, width: w, height: h, alt_text: alt, visibility: "public", uploaded_by: staff.id });
  if (error) { await db.storage.from("public-media").remove([path]); return { error: "Could not record the upload." }; }
  await logAudit("media.uploaded", "media", path);
  revalidatePath("/admin/media");
  return { ok: true, message: "Image uploaded." };
}

/** Inline upload used by image fields in forms: validates, stores, records in the media library and returns the public URL. */
export async function uploadImageForField(fd: FormData): Promise<{ url?: string; error?: string }> {
  let staff;
  try { staff = await assertPermission("media", "create"); } catch (e) { return fail(e) as { error: string }; }
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image to upload." };
  if (file.size > MAX) return { error: "Image must be 5 MB or smaller." };
  const spec = TYPES[file.type];
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!spec || !spec.magic(bytes)) return { error: "Only JPEG, PNG, WebP or AVIF images are allowed." };
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
  const path = `${new Date().getUTCFullYear()}/${base}-${randomUUID().slice(0, 8)}.${spec.ext}`;
  const db = await createServerSupabase();
  const { error: upErr } = await db.storage.from("public-media").upload(path, bytes, { contentType: file.type, upsert: false });
  if (upErr) return { error: "Upload failed." };
  const alt = base.replace(/-/g, " ").slice(0, 300);
  const { error } = await db.from("media_assets").insert({ storage_path: path, bucket: "public-media", original_filename: file.name.slice(0, 200), mime_type: file.type, size_bytes: file.size, alt_text: alt, visibility: "public", uploaded_by: staff.id });
  if (error) { await db.storage.from("public-media").remove([path]); return { error: "Could not record the upload." }; }
  await logAudit("media.uploaded", "media", path);
  revalidatePath("/admin/media");
  return { url: db.storage.from("public-media").getPublicUrl(path).data.publicUrl };
}

export async function updateMediaAlt(id: string, alt: string): Promise<CrudState> {
  try { await assertPermission("media", "update"); } catch (e) { return fail(e); }
  const a = alt.trim().slice(0, 300);
  if (!a) return { error: "Alt text is required." };
  const db = await createServerSupabase();
  const { error } = await db.from("media_assets").update({ alt_text: a }).eq("id", id);
  if (error) return { error: "Could not update alt text." };
  revalidatePath("/admin/media");
  return { ok: true, message: "Alt text saved." };
}

const REF_COLUMNS: [string, string][] = [
  ["services", "cover_image"], ["industries", "cover_image"], ["projects", "featured_image"], ["products", "logo_url"], ["products", "cover_image"],
  ["posts", "cover_image"], ["team_members", "avatar_url"], ["testimonials", "avatar_url"], ["posts", "content"], ["services", "description"], ["pages", "content"], ["projects", "gallery"],
];

/** Safe deletion: refuse while any content still references the asset's public URL. */
export async function deleteMedia(id: string): Promise<CrudState> {
  try { await assertPermission("media", "delete"); } catch (e) { return fail(e); }
  const db = await createServerSupabase();
  const { data: m } = await db.from("media_assets").select("storage_path, bucket").eq("id", id).maybeSingle();
  if (!m) return { error: "Asset not found." };
  const { data: pub } = db.storage.from(m.bucket).getPublicUrl(m.storage_path);
  const needle = m.storage_path.replace(/[%_,()]/g, "");
  for (const [table, col] of REF_COLUMNS) {
    const filter = col === "gallery" ? db.from(table).select("id", { count: "exact", head: true }).filter(`${col}::text`, "ilike", `%${needle}%`) : db.from(table).select("id", { count: "exact", head: true }).ilike(col, `%${needle}%`);
    const { count } = await filter;
    if (count) return { error: `Still in use by ${table}.${col}. Remove it from that content first.` };
  }
  void pub;
  await db.storage.from(m.bucket).remove([m.storage_path]);
  const { error } = await db.from("media_assets").delete().eq("id", id);
  if (error) return { error: "Could not delete the asset record." };
  await logAudit("media.deleted", "media", m.storage_path);
  revalidatePath("/admin/media");
  return { ok: true, message: "Asset deleted." };
}
