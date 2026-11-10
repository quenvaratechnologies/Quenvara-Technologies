"use client";

import { useEffect, useRef } from "react";

export type CloudItem = { id: string; name: string; logo?: { path: string; hex: string } | null };

function Glyph({ it }: { it: CloudItem }) {
  if (it.logo) {
    return <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden><path d={it.logo.path} fill={it.logo.hex} /></svg>;
  }
  const m = it.name.replace(/[^A-Za-z0-9 ]/g, "").split(" ").filter(Boolean);
  return <span className="grid h-full w-full place-items-center rounded-md bg-[image:var(--grad-brand)] text-[0.6em] font-bold text-white">{(m.length > 1 ? m[0][0] + m[1][0] : it.name.slice(0, 2)).toUpperCase()}</span>;
}

/** Rotating 3D sphere of real technology logos. Nearer logos are larger and fully coloured, farther ones recede. */
export function TechCloud({ items }: { items: CloudItem[] }) {
  const box = useRef<HTMLDivElement>(null);
  const nodes = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const el = box.current; if (!el) return;
    const n = items.length;
    const pts = items.map((_, i) => { // Fibonacci sphere
      const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
      return { x: Math.cos(th) * r, y, z: Math.sin(th) * r };
    });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ay = 0, ax = 0.35, vy = 0.004, vx = 0, raf = 0, hover = false, W = el.clientWidth;
    const ro = new ResizeObserver(() => { W = el.clientWidth; draw(); });
    ro.observe(el);
    function draw() {
      const R = W * 0.4, cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
      pts.forEach((p, i) => {
        const x1 = p.x * cy + p.z * sy, z1 = -p.x * sy + p.z * cy;
        const y2 = p.y * cx - z1 * sx, z2 = p.y * sx + z1 * cx;
        const depth = (z2 + 1) / 2; // 0 far → 1 near
        const node = nodes.current[i]; if (!node) return;
        node.style.transform = `translate3d(${x1 * R}px, ${y2 * R}px, 0) scale(${0.55 + depth * 0.75})`;
        node.style.opacity = String(0.28 + depth * 0.72);
        node.style.zIndex = String(Math.round(depth * 100));
        node.style.filter = depth < 0.35 ? `grayscale(${(0.35 - depth) * 2.4})` : "none";
      });
    }
    function tick() {
      ay += vy; ax += (0.35 - ax) * 0.02 + vx; vx *= 0.9;
      draw(); raf = requestAnimationFrame(tick);
    }
    const move = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      vy = ((e.clientX - b.left) / b.width - 0.5) * 0.02;
      vx = ((e.clientY - b.top) / b.height - 0.5) * -0.0015;
      hover = true;
    };
    const leave = () => { vy = 0.004; hover = false; };
    draw();
    if (!reduce) {
      raf = requestAnimationFrame(tick);
      el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
    }
    void hover;
    return () => { cancelAnimationFrame(raf); ro.disconnect(); el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, [items]);

  return (
    <div ref={box} className="relative mx-auto aspect-square w-full max-w-[560px]" role="img" aria-label={`Technologies we use: ${items.map((i) => i.name).join(", ")}`}>
      <ul className="absolute inset-0">
        {items.map((it, i) => (
          <li key={it.id} ref={(n) => { nodes.current[i] = n; }} className="group absolute left-1/2 top-1/2 -ml-[1.4rem] -mt-[1.4rem] h-[2.8rem] w-[2.8rem] will-change-transform sm:-ml-6 sm:-mt-6 sm:h-12 sm:w-12">
            <span className="block h-full w-full cursor-pointer transition-transform duration-300 group-hover:scale-125"><Glyph it={it} /></span>
            <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-0.5 text-[11px] font-medium text-white opacity-0 shadow transition-opacity group-hover:opacity-100">{it.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
