"use client";

import { ImageField } from "@/components/admin/image-field";
import { useActionState } from "react";
import { saveSettingGroup } from "@/lib/admin/settings-actions";
import type { SettingKey } from "@/lib/admin/settings-groups";
import type { CrudState } from "@/lib/admin/crud";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/forms/field";

export function SettingsForm({ groupKey, label, fields, values, canEdit }: { groupKey: SettingKey; label: string; fields: [string, string, string?][]; values: Record<string, any>; canEdit: boolean }) {
  const [state, action, pending] = useActionState<CrudState, FormData>(saveSettingGroup.bind(null, groupKey), {});
  const err = state.fieldErrors ?? {};
  return (
    <form id={groupKey} action={action} className="rounded-xl border border-line bg-surface p-6 scroll-mt-6">
      <h2 className="text-lg font-semibold">{label}</h2>
      <fieldset disabled={!canEdit} className="mt-4 grid gap-4 sm:grid-cols-2">
        {fields.map(([name, lbl, type]) => (
          <div key={name} className={type === "textarea" ? "sm:col-span-2" : ""}>
            {type === "checkbox"
              ? <label className="flex items-center gap-3 text-sm"><input type="checkbox" name={name} defaultChecked={Boolean(values[name])} className="h-4 w-4" />{lbl}</label>
              : <Field id={`${groupKey}-${name}`} label={lbl} error={err[name]}>{(p) => type === "textarea" ? <textarea {...p} name={name} rows={3} defaultValue={values[name] ?? ""} className={inputCls} /> : name === "logo" ? <ImageField name={name} defaultValue={values[name] ?? ""} inputProps={p as React.InputHTMLAttributes<HTMLInputElement>} /> : <input {...p} name={name} defaultValue={values[name] ?? ""} className={inputCls} />}</Field>}
          </div>
        ))}
      </fieldset>
      <div className="mt-5 flex items-center gap-4" aria-live="polite">
        {canEdit && <Button type="submit" disabled={pending}>{pending ? "Saving…" : `Save ${label.toLowerCase()}`}</Button>}
        {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}{state.ok && <p role="status" className="text-sm text-success">{state.message}</p>}
      </div>
    </form>
  );
}
