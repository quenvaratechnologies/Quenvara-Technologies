"use client";

import { useState, useTransition } from "react";
import { saveRelation } from "@/lib/admin/relations-actions";

export function RelationPicker({ typeKey, id, relKey, label, options, selected }: { typeKey: string; id: string; relKey: string; label: string; options: { value: string; label: string }[]; selected: string[] }) {
  const [sel, setSel] = useState(new Set(selected));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const toggle = (v: string) => setSel((s) => { const n = new Set(s); if (n.has(v)) n.delete(v); else n.add(v); return n; });
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
        {options.length === 0 && <p className="p-2 text-sm text-muted">Nothing to link yet.</p>}
        {options.map((o) => <label key={o.value} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-surface-alt"><input type="checkbox" checked={sel.has(o.value)} onChange={() => toggle(o.value)} />{o.label}</label>)}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <button type="button" disabled={pending} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-surface-alt disabled:opacity-50"
          onClick={() => start(async () => { const r = await saveRelation(typeKey, id, relKey, [...sel]); setMsg({ ok: !!r.ok, text: r.message ?? r.error ?? "" }); })}>{pending ? "Saving…" : `Save ${label.toLowerCase()}`}</button>
        <span role="status" className={`text-sm ${msg?.ok ? "text-success" : "text-danger"}`}>{msg?.text}</span>
      </div>
    </fieldset>
  );
}
