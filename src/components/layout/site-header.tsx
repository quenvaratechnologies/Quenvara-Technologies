"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { ServiceIcon } from "@/components/ui/service-icon";

export type NavChild = { label: string; url: string; icon?: string | null; summary?: string | null };
export type NavItem = { label: string; url: string; children?: NavChild[] };

const isActive = (path: string, url: string) => (url === "/" ? path === "/" : path === url || path.startsWith(url + "/"));

export function SiteHeader({ name, logo, logoOnly, items, announcement }: {
  name: string; logo?: string | null; logoOnly?: boolean; items: NavItem[]; announcement?: { text: string; href?: string } | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [accordion, setAccordion] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusOnOpen = useRef(false);
  const baseId = useId();

  // Close menus on navigation (derived-state pattern; no effect needed).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) { setLastPath(pathname); setMobileOpen(false); setOpenMenu(null); }

  // Scroll effects update the DOM directly (no re-render): solid header + reading-progress bar.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      headerRef.current?.setAttribute("data-scrolled", String(y > 8));
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpenMenu(null); setMobileOpen(false); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Keyboard open: move focus to the first item once the menu has actually rendered open.
  useEffect(() => {
    if (!openMenu || !focusOnOpen.current) return;
    focusOnOpen.current = false;
    const raf = requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-menu-panel][data-open="true"] a`)?.focus());
    return () => cancelAnimationFrame(raf);
  }, [openMenu]);

  const openNow = (label: string) => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpenMenu(label); };
  const closeSoon = () => { if (closeTimer.current) clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setOpenMenu(null), 140); };
  const menuId = (i: number) => `${baseId}-menu-${i}`;

  return (
    <>
      <header ref={headerRef} data-scrolled="false" className="sticky top-0 z-40 bg-white/90 backdrop-blur-md transition-shadow duration-300">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded focus:bg-brand focus:px-3 focus:py-2 focus:text-white">Skip to content</a>
        {announcement?.text && (
          <div className="bg-navy px-4 py-2 text-center text-sm text-white">
            {announcement.href ? <Link href={announcement.href} className="underline underline-offset-2">{announcement.text}</Link> : announcement.text}
          </div>
        )}
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0 text-ink" aria-label={`${name} home`}>
            <Logo name={name} logo={logo} logoOnly={logoOnly} />
          </Link>

          <nav aria-label="Primary" className="hidden items-center lg:flex">
            {items.map((item, i) => {
              const active = isActive(pathname, item.url);
              if (!item.children?.length) {
                return (
                  <Link key={item.label} href={item.url} aria-current={active ? "page" : undefined}
                    className={cn("nav-link rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-brand", active ? "text-brand" : "text-ink")}>
                    {item.label}
                  </Link>
                );
              }
              const open = openMenu === item.label;
              return (
                <div key={item.label} className="relative" onMouseEnter={() => openNow(item.label)} onMouseLeave={closeSoon}
                  onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpenMenu(null); }}>
                  <button type="button" aria-expanded={open} aria-haspopup="true" aria-controls={menuId(i)} data-active={active}
                    onClick={() => setOpenMenu(open ? null : item.label)}
                    onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); focusOnOpen.current = true; setOpenMenu(item.label); } }}
                    className={cn("nav-link inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-brand", active ? "text-brand" : "text-ink")}>
                    {item.label}<ChevronDown className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")} aria-hidden />
                  </button>
                  <div id={menuId(i)} data-menu-panel data-open={open}
                    className="invisible absolute left-1/2 top-full w-[640px] -translate-x-1/2 translate-y-2 pt-3 opacity-0 [transition:opacity_200ms,transform_200ms,visibility_0s_linear_200ms] data-[open=true]:visible data-[open=true]:translate-y-0 data-[open=true]:opacity-100 data-[open=true]:[transition:opacity_200ms,transform_200ms,visibility_0s]">
                    <div className="rounded-2xl border border-line bg-white p-3 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35)]">
                      <ul className="grid grid-cols-2 gap-1">
                        {item.children.map((c) => (
                          <li key={c.url}>
                            <Link href={c.url} className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-brand-soft">
                              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy text-cyan transition-transform duration-200 group-hover:scale-105"><ServiceIcon name={c.icon} className="h-[18px] w-[18px]" /></span>
                              <span className="min-w-0"><span className="block text-sm font-medium text-ink">{c.label}</span>{c.summary && <span className="mt-0.5 line-clamp-1 block text-xs text-slate-500">{c.summary}</span>}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-alt px-4 py-3 text-sm">
                        <Link href={item.url} className="font-medium text-brand hover:underline">View all {item.label.toLowerCase()} →</Link>
                        <Link href="/contact" className="inline-flex items-center gap-1 font-medium text-ink hover:text-brand">Not sure what you need? Talk to us <ArrowRight className="h-4 w-4" aria-hidden /></Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <Link href="/search" aria-label="Search" className="rounded-md p-2 text-ink transition-colors hover:bg-surface-alt hover:text-brand"><Search className="h-5 w-5" aria-hidden /></Link>
            <Link href="/contact" className="btn-sheen group hidden items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-brand-hover hover:shadow-[var(--shadow-lift)] sm:inline-flex">
              Get In Touch<ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <button type="button" className="rounded-md p-2 text-ink hover:bg-surface-alt lg:hidden" aria-label="Open menu" aria-expanded={mobileOpen} aria-controls={`${baseId}-drawer`} onClick={() => setMobileOpen(true)}>
              <Menu className="h-6 w-6" aria-hidden />
            </button>
          </div>
        </div>
        <div className="h-0.5 w-full bg-transparent"><div ref={barRef} aria-hidden className="h-full origin-left bg-[image:var(--grad-brand)]" style={{ transform: "scaleX(0)" }} /></div>
      </header>

      {/* Mobile drawer lives outside <header> (backdrop-filter would otherwise trap position:fixed). */}
      <div id={`${baseId}-drawer`} role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!mobileOpen}
        className={cn("fixed inset-0 z-50 lg:hidden", mobileOpen ? "visible" : "pointer-events-none invisible delay-300")}>
        <button type="button" tabIndex={mobileOpen ? 0 : -1} aria-label="Close menu" onClick={() => setMobileOpen(false)}
          className={cn("absolute inset-0 bg-navy/60 backdrop-blur-sm transition-opacity duration-300", mobileOpen ? "opacity-100" : "opacity-0")} />
        <div className={cn("absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out", mobileOpen ? "translate-x-0" : "translate-x-full")}>
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
            <Logo name={name} logo={logo} logoOnly={logoOnly} />
            <button type="button" tabIndex={mobileOpen ? 0 : -1} aria-label="Close menu" onClick={() => setMobileOpen(false)} className="rounded-md p-2 hover:bg-surface-alt"><X className="h-6 w-6" aria-hidden /></button>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {items.map((item) => {
                const active = isActive(pathname, item.url);
                const expandable = Boolean(item.children?.length);
                return (
                  <li key={item.label}>
                    <div className="flex items-center">
                      <Link href={item.url} tabIndex={mobileOpen ? 0 : -1} aria-current={active ? "page" : undefined} className={cn("flex-1 rounded-lg px-3 py-3 text-base font-medium hover:bg-surface-alt", active ? "text-brand" : "text-ink")}>{item.label}</Link>
                      {expandable && (
                        <button type="button" tabIndex={mobileOpen ? 0 : -1} aria-label={`${accordion === item.label ? "Collapse" : "Expand"} ${item.label}`} aria-expanded={accordion === item.label} onClick={() => setAccordion(accordion === item.label ? null : item.label)} className="rounded-lg p-3 hover:bg-surface-alt">
                          <ChevronDown className={cn("h-5 w-5 transition-transform", accordion === item.label && "rotate-180")} aria-hidden />
                        </button>
                      )}
                    </div>
                    {expandable && accordion === item.label && (
                      <ul className="mb-2 ml-3 space-y-0.5 border-l border-line pl-3">
                        {item.children!.map((c) => <li key={c.url}><Link href={c.url} tabIndex={mobileOpen ? 0 : -1} className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-surface-alt hover:text-brand">{c.label}</Link></li>)}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="shrink-0 border-t border-line p-4">
            <Link href="/contact" tabIndex={mobileOpen ? 0 : -1} className="btn-sheen flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 font-medium text-white shadow-sm">Discuss Your Project<ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
        </div>
      </div>
    </>
  );
}
