import { cn } from "@/lib/utils";
import { QuenvaraMark } from "@/components/layout/brand-mark";

/** Company mark driven by Admin → Settings (name + optional logo). Falls back to a letter mark. */
export function Logo({ name, logo, logoOnly, onDark, className }: { name: string; logo?: string | null; logoOnly?: boolean; onDark?: boolean; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "•";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {logo ? (
        // Admin-supplied URL (any host) — a plain <img> avoids next/image host restrictions.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={logoOnly ? name : ""} className={cn("h-8 w-auto max-w-[168px] object-contain", onDark && "rounded-md bg-white px-2 py-1")} />
      ) : /^quenvara/i.test(name.trim()) ? (
        <QuenvaraMark className={cn(onDark && "[&_path]:stroke-white")} />
      ) : (
        <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--grad-brand)] text-sm font-bold text-white shadow-sm">{initial}</span>
      )}
      {(!logo || !logoOnly) && (() => {
  const words = name.trim().split(/\s+/);
  const sub = words.length > 1 ? words[words.length - 1] : "";
  const main = words.length > 1 ? words.slice(0, -1).join(" ") : name;
  return (
    <span className="flex flex-col leading-none">
      <span className="text-[1.35rem] font-bold tracking-tight">{main}</span>
      {sub && <span className={cn("mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.34em]", onDark ? "text-[#ff6b78]" : "text-brand")}>{sub}</span>}
    </span>
  );
})()}
    </span>
  );
}
