import { cn } from "@/lib/utils";

export const inputCls = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-slate-400 aria-[invalid=true]:border-danger";

export function Field({ id, label, error, hint, required, children }: { id: string; label: string; error?: string; hint?: string; required?: boolean; children: (a: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode }) {
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}{required && <span aria-hidden className="text-danger"> *</span>}</label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-err`} className={cn("mt-1 text-sm text-danger")}>{error}</p>}
    </div>
  );
}
