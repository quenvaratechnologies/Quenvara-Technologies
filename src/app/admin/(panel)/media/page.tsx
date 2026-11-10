import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import { MediaCard, UploadForm } from "@/components/admin/media-ui";

export const metadata = { title: "Media" };
export const dynamic = "force-dynamic";
const PER = 24;

export default async function MediaPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const staff = await requireStaff("media");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const db = await createServerSupabase();
  let q = db.from("media_assets").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PER, page * PER - 1);
  const term = (sp.q ?? "").trim().slice(0, 80).replace(/[%,()]/g, " ");
  if (term) q = q.or(`original_filename.ilike.%${term}%,alt_text.ilike.%${term}%`);
  if (sp.type) q = q.eq("mime_type", sp.type);
  const { data, count } = await q;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER));
  const sel = "rounded-lg border border-line bg-surface px-3 py-2 text-sm";
  return (
    <>
      <h1 className="text-2xl font-semibold">Media library</h1>
      <p className="mt-1 text-sm text-muted">Public images only. Files uploaded here are publicly accessible. Resumes and private documents never belong here.</p>
      {can(staff.role, "media", "create") && <div className="mt-6"><UploadForm /></div>}
      <form method="get" role="search" className="mt-6 flex flex-wrap gap-2"><label htmlFor="q" className="sr-only">Search</label><input id="q" name="q" defaultValue={sp.q} placeholder="Search filename or alt text" className={`${sel} min-w-56 flex-1`} /><select name="type" aria-label="Type" defaultValue={sp.type ?? ""} className={sel}><option value="">All types</option>{["image/jpeg", "image/png", "image/webp", "image/avif"].map((t) => <option key={t}>{t}</option>)}</select><button className="rounded-lg bg-brand px-4 py-2 text-sm text-white">Filter</button></form>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(data ?? []).map((a: any) => <MediaCard key={a.id} a={a} url={db.storage.from(a.bucket).getPublicUrl(a.storage_path).data.publicUrl} canUpdate={can(staff.role, "media", "update")} canDelete={can(staff.role, "media", "delete")} />)}</ul>
      {!data?.length && <p className="mt-6 text-center text-muted">No media yet.</p>}
      <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm"><span className="text-muted">{count ?? 0} total · page {page} of {pages}</span><span className="flex gap-2">{page > 1 && <Link className="rounded border border-line px-3 py-1.5" href={`?page=${page - 1}`}>Previous</Link>}{page < pages && <Link className="rounded border border-line px-3 py-1.5" href={`?page=${page + 1}`}>Next</Link>}</span></nav>
    </>
  );
}
