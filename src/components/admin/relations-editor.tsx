import { createServerSupabase } from "@/lib/supabase/server";
import { RELATIONS } from "@/config/relations";
import { RelationPicker } from "@/components/admin/relation-picker";

export async function RelationsEditor({ typeKey, id }: { typeKey: string; id: string }) {
  const defs = RELATIONS[typeKey];
  if (!defs) return null;
  const db = await createServerSupabase();
  const blocks = await Promise.all(defs.map(async (d) => {
    const [{ data: all }, { data: linked }] = await Promise.all([
      db.from(d.otherTable).select(`id, ${d.labelCol}`).order(d.labelCol).limit(500),
      db.from(d.junction).select(d.otherCol).eq(d.ownerCol, id),
    ]);
    return {
      key: d.key, label: d.label,
      options: ((all ?? []) as unknown as Record<string, string>[]).map((r) => ({ value: r.id, label: r[d.labelCol] })),
      selected: ((linked ?? []) as unknown as Record<string, string>[]).map((r) => r[d.otherCol]),
    };
  }));
  return (
    <section className="mt-8 rounded-xl border border-line bg-surface p-6" aria-labelledby="rel-h">
      <h2 id="rel-h" className="text-lg font-semibold">Links</h2>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        {blocks.map((b) => <RelationPicker key={b.key} typeKey={typeKey} id={id} relKey={b.key} label={b.label} options={b.options} selected={b.selected} />)}
      </div>
    </section>
  );
}
