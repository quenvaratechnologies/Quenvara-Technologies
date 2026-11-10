/** Server-rendered GET filter form: works without JavaScript and keeps URLs shareable. */
export function FilterBar({ action, q, selects, placeholder = "Search…" }: {
  action: string; q?: string; placeholder?: string;
  selects?: { name: string; label: string; value?: string; options: { value: string; label: string }[] }[];
}) {
  const field = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm";
  return (
    <form action={action} method="get" role="search" className="grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(var(--n),1fr)_auto]" style={{ ["--n" as string]: selects?.length ?? 0 }}>
      <div>
        <label htmlFor="q" className="sr-only">Search</label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder={placeholder} className={field} />
      </div>
      {selects?.map((s) => (
        <div key={s.name}>
          <label htmlFor={`f-${s.name}`} className="sr-only">{s.label}</label>
          <select id={`f-${s.name}`} name={s.name} defaultValue={s.value ?? ""} className={field}>
            <option value="">{s.label}: all</option>
            {s.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      ))}
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover">Apply</button>
        <a href={action} className="rounded-lg border border-line px-4 py-2 text-sm">Reset</a>
      </div>
    </form>
  );
}
