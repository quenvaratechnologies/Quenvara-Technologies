"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMedia, updateMediaAlt, uploadMedia } from "@/lib/admin/media-actions";
import type { CrudState } from "@/lib/admin/crud";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/forms/field";

export function UploadForm() {
  const [state, action, pending] = useActionState<CrudState, FormData>(uploadMedia, {});
  const [dims, setDims] = useState({ w: "", h: "" });
  const onFile = (f?: File) => { if (!f) return; const img = new Image(); img.onload = () => { setDims({ w: String(img.naturalWidth), h: String(img.naturalHeight) }); URL.revokeObjectURL(img.src); }; img.src = URL.createObjectURL(f); };
  return (
    <form action={action} className="grid gap-4 rounded-xl border border-line bg-surface p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <Field id="file" label="Image (JPEG, PNG, WebP, AVIF · max 5 MB)" required>{(p) => <input {...p} name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => onFile(e.target.files?.[0])} className={inputCls} required />}</Field>
      <Field id="alt_text" label="Alt text (describe the image)" required>{(p) => <input {...p} name="alt_text" maxLength={300} className={inputCls} required />}</Field>
      <input type="hidden" name="width" value={dims.w} /><input type="hidden" name="height" value={dims.h} />
      <Button type="submit" disabled={pending}>{pending ? "Uploading…" : "Upload"}</Button>
      <div className="sm:col-span-3" aria-live="polite">{state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}{state.ok && <p role="status" className="text-sm text-success">{state.message}</p>}</div>
    </form>
  );
}

export function MediaCard({ a, url, canUpdate, canDelete }: { a: any; url: string; canUpdate: boolean; canDelete: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [alt, setAlt] = useState(a.alt_text ?? "");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  return (
    <li className="overflow-hidden rounded-xl border border-line bg-surface">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={a.alt_text ?? ""} loading="lazy" className="aspect-video w-full bg-surface-alt object-contain" />
      <div className="space-y-2 p-3 text-xs">
        <p className="truncate font-medium" title={a.original_filename}>{a.original_filename}</p>
        <p className="text-muted">{a.width && a.height ? `${a.width}×${a.height} · ` : ""}{(a.size_bytes / 1024).toFixed(0)} KB · {a.mime_type}</p>
        <label className="sr-only" htmlFor={`alt-${a.id}`}>Alt text</label>
        <input id={`alt-${a.id}`} value={alt} onChange={(e) => setAlt(e.target.value)} disabled={!canUpdate} className="w-full rounded border border-line px-2 py-1" />
        <div className="flex flex-wrap gap-1.5">
          <button className="rounded border border-line px-2 py-1" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Copied" : "Copy URL"}</button>
          {canUpdate && <button disabled={pending} className="rounded border border-line px-2 py-1" onClick={() => start(async () => { const r = await updateMediaAlt(a.id, alt); setMsg(r.message ?? r.error ?? ""); })}>Save alt</button>}
          {canDelete && <button disabled={pending} className="rounded border border-red-200 px-2 py-1 text-danger" onClick={() => { if (!window.confirm(`Delete “${a.original_filename}”? This cannot be undone.`)) return; start(async () => { const r = await deleteMedia(a.id); setMsg(r.message ?? r.error ?? ""); if (r.ok) router.refresh(); }); }}>Delete</button>}
        </div>
        <p role="status" className="text-muted">{msg}</p>
      </div>
    </li>
  );
}
