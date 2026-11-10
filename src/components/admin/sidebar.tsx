"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminNavItem = { href: string; label: string };

export function AdminSidebar({ items, name, role, logout }: { items: AdminNavItem[]; name: string; role: string; logout: () => Promise<void> }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const nav = (
    <nav aria-label="Admin" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
      {items.map((i) => {
        const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return <Link key={i.href} href={i.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={cn("block rounded-md px-3 py-2 text-sm", active ? "bg-brand text-white" : "text-slate-300 hover:bg-white/10")}>{i.label}</Link>;
      })}
    </nav>
  );
  const footer = (
    <div className="border-t border-white/10 p-4 text-sm text-slate-300">
      <p className="truncate font-medium text-white">{name}</p>
      <p className="capitalize">{role}</p>
      <form action={logout} className="mt-3"><button className="rounded-md border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10">Sign out</button></form>
    </div>
  );
  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between bg-navy px-4 py-3 text-white lg:hidden">
        <span className="font-semibold">Quenvara Admin</span>
        <button aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? <X /> : <Menu />}</button>
      </div>
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-64 flex-col bg-navy pt-0 lg:flex", open ? "flex pt-12" : "hidden")}>
        <div className="hidden px-5 py-5 text-lg font-semibold text-white lg:block">Quenvara Admin</div>
        {nav}{footer}
      </aside>
    </>
  );
}
