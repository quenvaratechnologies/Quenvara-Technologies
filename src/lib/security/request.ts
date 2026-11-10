/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for / x-real-ip). */
export function clientIp(h: Pick<Headers, "get">): string {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 64);
  return (h.get("x-real-ip") ?? "unknown").slice(0, 64);
}

/** Reject cross-site form posts to our JSON endpoints (defence in depth alongside SameSite cookies). */
export function sameOrigin(h: Pick<Headers, "get">, expectedOrigin: string): boolean {
  const origin = h.get("origin");
  if (!origin) return true; // non-browser clients: protected by validation + rate limiting
  try {
    return new URL(origin).origin === new URL(expectedOrigin).origin;
  } catch {
    return false;
  }
}
