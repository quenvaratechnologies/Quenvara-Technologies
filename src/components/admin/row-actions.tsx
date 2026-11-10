"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteRecord, setRecordStatus } from "@/lib/admin/crud";

export function RowActions({ typeKey, id, status, statuses, canUpdate, canPublish, canDelete, label }: {
  typeKey: string; id: string; status?: string; statuses: string[]; canUpdate: boolean; canPublish: boolean; canDelete: boolean; label: string; previewHref?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [confirm, setConfirm] = useState("");

  const run = (fn: () => Promise<{ ok?: boolean; message?: string; error?: string }>) =>
    start(async () => { const r = await fn(); setMsg({ ok: !!r.ok, text: r.message ?? r.error ?? "" }); if (r.ok) router.refresh(); });
  const set = (s: string) => run(() => setRecordStatus(typeKey, id, s));
  const btn = "rounded border border-line px-2 py-1 text-xs hover:bg-surface-alt disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {canUpdate && <Link href={`/admin/${typeKey}/${id}`} className={btn}>Edit<span className="sr-only"> {label}</span></Link>}
      {statuses.length > 0 && canPublish && status !== "published" && status !== "archived" && <button className={btn} disabled={pending} onClick={() => set("published")}>Publish</button>}
      {statuses.length > 0 && canPublish && status === "published" && <button className={btn} disabled={pending} onClick={() => set("draft")}>Unpublish</button>}
      {statuses.includes("archived") && canUpdate && status !== "archived" && <button className={btn} disabled={pending} onClick={() => set("archived")}>Archive</button>}
      {statuses.includes("archived") && canUpdate && status === "archived" && <button className={btn} disabled={pending} onClick={() => set("draft")}>Restore</button>}
      {canDelete && <button className={`${btn} text-danger`} disabled={pending} onClick={() => { setConfirm(""); dialog.current?.showModal(); }}>Delete<span className="sr-only"> {label}</span></button>}
      <span role="status" className={`w-full text-right text-xs ${msg?.ok ? "text-success" : "text-danger"}`}>{msg?.text}</span>
      <dialog ref={dialog} aria-labelledby={`del-${id}`} className="m-auto w-full max-w-md rounded-xl border border-line bg-surface p-6 text-left backdrop:bg-black/40">
        <h2 id={`del-${id}`} className="text-lg font-semibold">Permanently delete?</h2>
        <p className="mt-2 text-sm text-muted">“{label}” will be removed forever. This cannot be undone. Archive it instead if you may need it later. Type <strong>DELETE</strong> to confirm.</p>
        <label htmlFor={`c-${id}`} className="sr-only">Type DELETE to confirm</label>
        <input id={`c-${id}`} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-4 w-full rounded-lg border border-line px-3 py-2 text-sm" autoComplete="off" />
        <div className="mt-5 flex justify-end gap-2">
          <button className={btn} onClick={() => dialog.current?.close()}>Cancel</button>
          <button className="rounded bg-danger px-3 py-1 text-xs text-white disabled:opacity-50" disabled={confirm !== "DELETE" || pending} onClick={() => { dialog.current?.close(); run(() => deleteRecord(typeKey, id, confirm)); }}>Delete permanently</button>
        </div>
      </dialog>
    </div>
  );
}
