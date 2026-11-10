import { Check } from "lucide-react";
import { PageHero, Section } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import { ContactForm } from "@/components/forms/contact-form";
import { getServices, getSettings } from "@/lib/database/public";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Contact", description: "Tell us about your project.", path: "/contact" });

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  const [services, settings] = await Promise.all([getServices(), getSettings()]);
  const c = settings.company ?? {};
  const cta = settings.contact_cta ?? {};
  return (
    <>
      <PageHero eyebrow="Contact" title={cta.heading ?? "Tell us what you are building."} description={cta.body ?? "Share a few details and we will respond with next steps."} />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
          <Reveal><div className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8"><ContactForm services={services.map((s) => s.title)} defaultService={service?.slice(0, 120)} /></div></Reveal>
          <aside className="space-y-8 text-sm">
            <Reveal delay={100}><div><h2 className="font-semibold">What happens next</h2>
              <ol className="mt-4 space-y-4">
                {[["You send the details", "Tell us the goal, rough budget and timeline. Short is fine."], ["We review and reply", "We read every enquiry and respond by email with questions or next steps."], ["We agree a way forward", "If it is a fit, we set up a discovery conversation before any commitment."]].map(([t, d], i) => (
                  <li key={t} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[image:var(--grad-brand)] text-xs font-bold text-white">{i + 1}</span><span><strong className="block text-ink">{t}</strong><span className="text-muted">{d}</span></span></li>
                ))}
              </ol>
              <p className="mt-4 flex items-start gap-2 text-muted"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />No obligation. We never ask for passwords or sensitive data.</p>
            </div></Reveal>
            <div><h2 className="font-semibold">Contact details</h2>
              {c.email || c.phone || c.offices?.length ? (
                <ul className="mt-3 space-y-2 text-muted">
                  {c.email && <li><a className="text-brand hover:underline" href={`mailto:${c.email}`}>{c.email}</a></li>}
                  {c.phone && <li><a className="text-brand hover:underline" href={`tel:${String(c.phone).replace(/\s/g, "")}`}>{c.phone}</a></li>}
                  {c.offices?.map((o: any, i: number) => o.address && <li key={i}>{o.label ? `${o.label}: ` : ""}{o.address}</li>)}
                </ul>
              ) : <p className="mt-3 text-muted">Please use the form and we will reply by email.</p>}
            </div>
            <div><h2 className="font-semibold">Privacy</h2><p className="mt-3 text-muted">We use your details only to respond to your enquiry. We never ask for sensitive information.</p></div>
          </aside>
        </div>
      </Section>
    </>
  );
}
