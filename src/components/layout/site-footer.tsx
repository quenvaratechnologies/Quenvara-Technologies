import Link from "next/link";
import { Container } from "@/components/ui/primitives";
import { Logo } from "@/components/layout/logo";
import { SOCIAL_LOGOS } from "@/data/social-logos";

type L = { label: string; url: string };
export function SiteFooter({ name, logo, logoOnly, summary, services, industries, products, company, legal, contact, social }: {
  name: string; logo?: string | null; logoOnly?: boolean; summary: string; services: L[]; industries: L[]; products: L[]; company: L[]; legal: L[];
  contact: { email?: string | null; phone?: string | null; offices?: { label?: string; address?: string }[] };
  social: { label: string; url: string }[];
}) {
  const col = (title: string, links: L[]) => links.length > 0 && (
    <div>
      <h2 className="t-label text-slate-300">{title}</h2>
      <ul className="mt-4 space-y-2">{links.map((l) => <li key={l.url}><Link href={l.url} className="inline-block text-sm text-slate-300 transition-all duration-200 hover:translate-x-0.5 hover:text-white">{l.label}</Link></li>)}</ul>
    </div>
  );
  return (
    <footer className="theme-dark relative mt-auto bg-navy text-slate-300">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-[image:var(--grad-brand)] opacity-60" />
      <Container className="py-14 pb-24 lg:pb-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" aria-label={`${name} home`} className="inline-block text-white"><Logo name={name} logo={logo} logoOnly={logoOnly} onDark /></Link>
            <p className="mt-3 max-w-sm text-sm">{summary}</p>
            <address className="mt-5 space-y-1 text-sm not-italic">
              {contact.email && <p><a className="hover:text-white" href={`mailto:${contact.email}`}>{contact.email}</a></p>}
              {contact.phone && <p><a className="hover:text-white" href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a></p>}
              {contact.offices?.map((o, i) => o.address ? <p key={i}>{o.label ? `${o.label}: ` : ""}{o.address}</p> : null)}
            </address>
            {social.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-3">
                {social.map((s) => {
                  const logo = SOCIAL_LOGOS[s.label.toLowerCase()];
                  return (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label} className="group grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-transparent hover:bg-white">
                        {logo ? <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white transition-colors duration-300 group-hover:fill-[var(--c)]" style={{ "--c": logo.hex } as React.CSSProperties} aria-hidden><path d={logo.path} /></svg> : <span className="text-xs text-white group-hover:text-ink">{s.label.slice(0, 2)}</span>}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {col("Services", services)}
          {col("Industries", industries)}
          {col("Company", company)}
          {col("Products", products)}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {name}. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">{legal.map((l) => <li key={l.url}><Link href={l.url} className="hover:text-white">{l.label}</Link></li>)}</ul>
        </div>
      </Container>
    </footer>
  );
}