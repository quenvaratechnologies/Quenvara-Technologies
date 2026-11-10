import { getBranding } from "@/lib/branding";

// Default favicon when no logo is configured: the company's initial on the brand gradient.
// Follows Admin → Settings (name and brand colour). Cached briefly; refreshed when settings are saved.
export const revalidate = 300;

const QUENVARA_FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><linearGradient id="g" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff4d5e"/><stop offset=".55" stop-color="#c8102e"/><stop offset="1" stop-color="#7d0a1f"/></linearGradient></defs><rect width="48" height="48" rx="11" fill="#fff"/><circle cx="22" cy="22" r="14" fill="none" stroke="url(#g)" stroke-width="6" stroke-linecap="round"/><path d="M28 28 L40 40 M40 40 L40 32 M40 40 L32 40" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="22" cy="22" r="4" fill="url(#g)"/></svg>`;

export async function GET() {
  const b = await getBranding();
  if (/^quenvara/i.test(b.name.trim())) return new Response(QUENVARA_FAVICON, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=300, s-maxage=300" } });
  const initial = (b.name.trim().charAt(0) || "•").toUpperCase().replace(/[&<>"']/g, "");
  const from = b.brandColor ?? "#c8102e";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="#8f0a20"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#g)"/><text x="32" y="44" text-anchor="middle" font-family="system-ui,sans-serif" font-size="36" font-weight="700" fill="#fff">${initial}</text></svg>`;
  return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=300, s-maxage=300" } });
}