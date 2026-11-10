"use client";

import { ImageField } from "@/components/admin/image-field";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveRecord, type CrudState } from "@/lib/admin/crud";
import type { ContentType, Field as F } from "@/config/content-types";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, inputCls } from "@/components/forms/field";
import { RichEditor } from "@/components/admin/rich-editor";
import { slugify } from "@/lib/utils";

type Opt = { value: string; label: string };

export function RecordForm({ ct, id, initial, relations, canPublish }: { ct: ContentType; id: string | null; initial: Record<string, any>; relations: Record<string, Opt[]>; canPublish: boolean }) {
  const router = useRouter();
  const action = saveRecord.bind(null, ct.key, id);
  const [state, formAction, pending] = useActionState<CrudState, FormData>(action, {});
  const [slug, setSlug] = useState<string>(initial.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const errs = state.fieldErrors ?? {};

  useEffect(() => { if (state.ok && !id && state.id) router.replace(`/admin/${ct.key}/${state.id}`); }, [state, id, ct.key, router]);

  const value = (f: F) => {
    const v = initial[f.name];
    if (f.type === "lines") return Array.isArray(v) ? v.join("\n") : "";
    if (f.type === "datetime") return v ? new Date(v).toISOString().slice(0, 16) : "";
    return v ?? (f.type === "number" ? 0 : "");
  };

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div aria-live="polite">
        {state.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{state.error}</div>}
        {state.ok && <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{state.message}</div>}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {ct.fields.map((f) => {
          const wide = ["textarea", "richtext", "lines"].includes(f.type) || f.name.startsWith("seo_");
          const e = errs[f.name];
          const wrap = (child: React.ReactNode) => <div key={f.name} className={wide ? "sm:col-span-2" : ""}>{child}</div>;
          if (f.type === "boolean") {
            return wrap(<div><label className="flex items-center gap-3 text-sm"><input type="checkbox" name={f.name} defaultChecked={Boolean(initial[f.name] ?? (f.name === "is_visible"))} className="h-4 w-4" />{f.label}</label>{f.help && <p className="mt-1 text-xs text-muted">{f.help}</p>}{e && <p className="mt-1 text-sm text-danger">{e}</p>}</div>);
          }
          if (f.type === "richtext") {
            return wrap(<div><span className="mb-1.5 block text-sm font-medium">{f.label}</span><RichEditor name={f.name} defaultValue={String(initial[f.name] ?? "")} label={f.label} invalid={Boolean(e)} />{f.help && <p className="mt-1 text-xs text-muted">{f.help}</p>}{e && <p className="mt-1 text-sm text-danger">{e}</p>}</div>);
          }
          return wrap(
            <Field id={`f-${f.name}`} label={f.label} required={f.required} error={e} hint={f.help ?? (f.type === "lines" ? "One per line." : undefined)}>
              {(p) => {
                if (f.type === "image") return <ImageField name={f.name} defaultValue={value(f)} inputProps={p as React.InputHTMLAttributes<HTMLInputElement>} />;
                if (f.type === "textarea" || f.type === "lines") return <textarea {...p} name={f.name} rows={f.type === "lines" ? 5 : 3} defaultValue={value(f)} className={inputCls} maxLength={f.max} />;
                if (f.type === "select") {
                  const guard = f.name === "status" && !canPublish;
                  return <select {...p} name={f.name} defaultValue={String(initial[f.name] ?? (f.name === "status" ? "draft" : f.options?.[0]?.value ?? ""))} className={inputCls}>{f.options?.map((o) => <option key={o.value} value={o.value} disabled={guard && o.value === "published"}>{o.label}</option>)}</select>;
                }
                if (f.type === "relation") return <select {...p} name={f.name} defaultValue={initial[f.name] ?? ""} className={inputCls}><option value="">— None —</option>{(relations[f.name] ?? []).filter((o) => o.value !== id).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
                if (f.type === "slug") return <input {...p} name={f.name} value={slug} onChange={(ev) => { setSlug(ev.target.value); setSlugTouched(true); }} className={`${inputCls} font-mono`} />;
                if (f.type === "datetime") return <input {...p} name={f.name} type="datetime-local" defaultValue={value(f)} className={inputCls} />;
                if (f.type === "number") return <input {...p} name={f.name} type="number" defaultValue={value(f)} className={inputCls} />;
                const onChange = f.name === ct.fields.find((x) => x.type === "slug")?.slugFrom ? (ev: React.ChangeEvent<HTMLInputElement>) => { if (!slugTouched) setSlug(slugify(ev.target.value)); } : undefined;
                return <input {...p} name={f.name} type={f.type === "url" ? "url" : "text"} defaultValue={value(f)} onChange={onChange} className={inputCls} maxLength={f.max} />;
              }}
            </Field>,
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 border-t border-line pt-5">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : id ? "Save changes" : `Create ${ct.singular.toLowerCase()}`}</Button>
        <ButtonLink href={`/admin/${ct.key}`} variant="secondary">Back to list</ButtonLink>
      </div>
    </form>
  );
}
