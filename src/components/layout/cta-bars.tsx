"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const HIDE = ["/contact", "/admin"];

/** Sticky mobile call-to-action: appears after the visitor scrolls, never on the contact page. */
export function MobileCta() {
  const path = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => ref.current?.setAttribute("data-show", String(window.scrollY > 520));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (HIDE.some((p) => path.startsWith(p))) return null;
  return (
    <div ref={ref} data-show="false" className="pointer-events-none fixed inset-x-0 bottom-0 z-30 translate-y-full p-3 transition-transform duration-300 data-[show=true]:pointer-events-auto data-[show=true]:translate-y-0 lg:hidden">
      <Link href="/contact" className="btn-sheen flex items-center justify-center gap-2 rounded-xl btn-grad px-4 py-3.5 text-sm font-semibold text-white shadow-[0_12px_32px_-8px_rgba(37,99,235,0.6)]">
        Discuss Your Project<ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

/** Site-wide closing call-to-action shown above the footer (hidden on /contact where the form is the CTA). */
export function PreFooterCta({ heading, body, email }: { heading: string; body: string; email?: string | null }) {
  const path = usePathname();
  if (HIDE.some((p) => path.startsWith(p))) return null;
  return (
    <section aria-labelledby="prefooter-cta" className="bg-surface-alt px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <Reveal className="mx-auto max-w-[1240px]">
        <div className="theme-dark relative isolate overflow-hidden rounded-3xl bg-navy px-6 py-14 text-center text-ink sm:px-14 sm:py-20">
          <div className="hero-glow absolute inset-0 -z-10" aria-hidden />
          <div className="bg-grid bg-grid-fade animate-drift absolute inset-0 -z-10 opacity-60" aria-hidden />
          <h2 id="prefooter-cta" className="t-section mx-auto max-w-2xl text-white">{heading}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">{body}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="btn-sheen group inline-flex items-center gap-2 rounded-lg btn-grad px-6 py-3 font-medium text-white shadow-[0_12px_32px_-10px_rgba(37,99,235,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-hover">
              Discuss Your Project<ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
            {email && <a href={`mailto:${email}`} className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10"><Mail className="h-4 w-4" aria-hidden />{email}</a>}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
