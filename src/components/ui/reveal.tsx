"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-reveal wrapper. Content is fully visible on the server and without JS; the element is only
 * "armed" (hidden) on the client when it is below the fold, then fades up when it enters the viewport.
 * Uses direct class changes (no state) so there is no re-render and no layout shift. Honors reduced motion.
 */
export function Reveal({ children, delay = 0, className, as: Tag = "div" }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "li" | "section" }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already on screen
    el.classList.add("reveal");
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add("is-in"); io.disconnect(); }
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const style = delay ? ({ "--d": `${delay}ms` } as React.CSSProperties) : undefined;
  return <Tag ref={ref as never} className={cn(className)} style={style}>{children}</Tag>;
}
