"use client";

import { useRef, useState, useTransition } from "react";
import { uploadImageForField } from "@/lib/admin/media-actions";
import { inputCls } from "@/components/forms/field";

/** URL input with an Upload button: pick a file, it is stored in the media library and the URL is filled in. */
export function ImageField({ name, defaultValue, inputProps }: { name: string; defaultValue?: string; inputProps?: React.InputHTMLAttributes<HTMLInputElement> }) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const file = useRef<HTMLInputElement>(null);
  const onPick = (f?: File) => {
    if (!f) return;
    const fd = new FormData(); fd.set("file", f);
    setMsg("");
    start(async () => { const r = await uploadImageForField(fd); if (r.url) { setUrl(r.url); setMsg("Uploaded."); } else setMsg(r.error ?? "Upload failed."); if (file.current) file.current.value = ""; });
  };
  return (
    <div>
      <div className="flex gap-2">
        <input {...inputProps} name={name} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Upload an image or paste a URL" className={inputCls} />
        <button type="button" disabled={pending} onClick={() => file.current?.click()} className="shrink-0 rounded-lg border border-line bg-white px-3 text-sm font-medium hover:bg-surface-alt disabled:opacity-50">{pending ? "Uploading…" : "Upload"}</button>
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" tabIndex={-1} aria-label="Choose image file" onChange={(e) => onPick(e.target.files?.[0])} />
      </div>
      {url && /^(https?:\/\/|\/)/.test(url) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Preview" className="mt-2 h-20 w-auto max-w-full rounded-md border border-line bg-surface-alt object-contain" />
      )}
      <p role="status" className="mt-1 text-xs text-muted">{msg}</p>
    </div>
  );
}
