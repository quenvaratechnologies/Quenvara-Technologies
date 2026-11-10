import { cn } from "@/lib/utils";

/** Quenvara mark: a "Q" ring in red gradient whose tail doubles as a forward arrow, with a pulsing core. Animated on load and hover. */
export function QuenvaraMark({ className, id = "qm" }: { className?: string; id?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("qmark h-9 w-9", className)} aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-g`} x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff4d5e" /><stop offset="0.55" stopColor="#c8102e" /><stop offset="1" stopColor="#7d0a1f" />
        </linearGradient>
      </defs>
      <circle className="qmark-ring" cx="22" cy="22" r="15" fill="none" stroke={`url(#${id}-g)`} strokeWidth="6" strokeLinecap="round" pathLength="100" strokeDasharray="100" />
      <path className="qmark-tail" d="M28 28 L41 41 M41 41 L41 32 M41 41 L32 41" fill="none" stroke="#111" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle className="qmark-core" cx="22" cy="22" r="4.2" fill={`url(#${id}-g)`} />
    </svg>
  );
}
