import "server-only";
import { getSettings } from "@/lib/database/public";
import { isReadableBrandColor } from "@/lib/color";

export const DEFAULT_COMPANY_NAME = "Quenvara Technology";
const DEFAULT_DESCRIPTION = "Enterprise software engineering, AI, cybersecurity, cloud and data services.";

export type Branding = {
  name: string;
  tagline: string;
  description: string;
  logo: string | null;
  logoOnly: boolean;
  brandColor: string | null;
  email: string | null;
  phone: string | null;
};

const safeUrl = (v: unknown): string | null => (typeof v === "string" && /^(https?:\/\/|\/)/.test(v) ? v : null);

/**
 * Single source of truth for company identity. Everything visible (header, footer, page titles,
 * metadata, structured data, favicon, theme colour) derives from Admin → Settings, so a name or
 * logo change there updates the whole site after the next revalidation (triggered on save).
 */
export async function getBranding(): Promise<Branding> {
  const s = await getSettings();
  const c = s.company ?? {};
  const color = typeof s.theme?.brand_color === "string" ? s.theme.brand_color : "";
  return {
    name: (typeof c.name === "string" && c.name.trim()) || DEFAULT_COMPANY_NAME,
    tagline: typeof c.tagline === "string" ? c.tagline : "",
    description: (typeof c.description === "string" && c.description.trim()) || DEFAULT_DESCRIPTION,
    logo: safeUrl(c.logo),
    logoOnly: Boolean(c.logo_only),
    brandColor: isReadableBrandColor(color) ? color : null,
    email: typeof c.email === "string" && c.email ? c.email : null,
    phone: typeof c.phone === "string" && c.phone ? c.phone : null,
  };
}
