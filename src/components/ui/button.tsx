import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "onDark";
const variants: Record<Variant, string> = {
  primary: "btn-sheen btn-grad text-white shadow-sm hover:-translate-y-px hover:brightness-110 hover:shadow-[var(--shadow-lift)] active:translate-y-0",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-alt",
  ghost: "text-ink hover:bg-surface-alt",
  danger: "bg-danger text-white hover:opacity-90",
  onDark: "border border-white/25 text-white hover:border-white/50 hover:bg-white/10",
};
const base = "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none";

export function Button({ variant = "primary", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className, href, arrow, children, ...props }: React.ComponentProps<typeof Link> & { variant?: Variant; arrow?: boolean }) {
  return (
    <Link href={href} className={cn(base, "group", variants[variant], className)} {...props}>
      {children}
      {arrow && <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />}
    </Link>
  );
}
