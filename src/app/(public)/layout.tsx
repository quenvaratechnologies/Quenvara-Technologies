import { SiteHeader, type NavItem } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileCta, PreFooterCta } from "@/components/layout/cta-bars";
import { getIndustries, getNavigation, getProducts, getServices, getSettings } from "@/lib/database/public";
import { getBranding } from "@/lib/branding";
import { DEFAULT_FOOTER_COMPANY, DEFAULT_HEADER_NAV } from "@/config/navigation";

export const revalidate = 300;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, branding, nav, services, industries, products] = await Promise.all([
    getSettings(), getBranding(), getNavigation(), getServices({ limit: 12 }), getIndustries(8), getProducts({ limit: 6 }),
  ]);
  const company = settings.company ?? {};
  const serviceChildren = services.map((s) => ({ label: s.title as string, url: `/services/${s.slug}`, icon: s.icon as string | null, summary: s.summary as string | null }));

  // Navigation comes from Admin → Navigation; sensible defaults apply until items are created there.
  const dbHeader = nav.filter((n) => n.location === "header" && !n.parent_id).map((n) => ({ label: n.label as string, url: n.url as string }));
  const header: NavItem[] = (dbHeader.length ? dbHeader : DEFAULT_HEADER_NAV).map((n) => ({
    ...n, children: n.url === "/services" && serviceChildren.length ? serviceChildren : undefined,
  }));
  const dbCompany = nav.filter((n) => n.location === "footer_company").map((n) => ({ label: n.label as string, url: n.url as string }));

  const social = Object.entries((company.social ?? {}) as Record<string, string>).filter(([, v]) => /^https?:\/\//.test(v)).map(([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), url: v }));
  const announcement = settings.announcement?.enabled ? { text: settings.announcement.text as string, href: settings.announcement.href as string } : null;
  const cta = settings.contact_cta ?? {};

  return (
    <>
      <SiteHeader name={branding.name} logo={branding.logo} logoOnly={branding.logoOnly} items={header} announcement={announcement} />
      <main id="main" className="flex-1">{children}</main>
      <PreFooterCta heading={cta.heading ?? "Tell us what you are building."} body={cta.body ?? "Share a few details and we will respond with next steps."} email={branding.email} />
      <SiteFooter
        name={branding.name}
        logo={branding.logo}
        logoOnly={branding.logoOnly}
        summary={settings.footer?.summary ?? branding.description}
        services={services.slice(0, 6).map((s) => ({ label: s.title, url: `/services/${s.slug}` }))}
        industries={industries.slice(0, 6).map((i) => ({ label: i.name, url: `/industries/${i.slug}` }))}
        products={products.map((p) => ({ label: p.name, url: `/products/${p.slug}` }))}
        company={dbCompany.length ? dbCompany : DEFAULT_FOOTER_COMPANY}
        legal={nav.filter((n) => n.location === "footer_legal").map((n) => ({ label: n.label, url: n.url }))}
        contact={{ email: company.email, phone: company.phone, offices: company.offices }}
        social={social}
      />
      <MobileCta />
    </>
  );
}
