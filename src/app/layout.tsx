import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { siteUrl } from "@/lib/env";
import { getBranding } from "@/lib/branding";
import "./globals.css";

/** Title, description, favicon and social site name all follow Admin → Settings (company name/logo). */
export async function generateMetadata(): Promise<Metadata> {
  const b = await getBranding();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: b.tagline ? `${b.name} — ${b.tagline.replace(/\.$/, "")}` : b.name, template: `%s | ${b.name}` },
    description: b.description,
    applicationName: b.name,
    icons: { icon: b.logo ?? "/brand-icon", ...(b.logo ? { apple: b.logo } : {}) },
    openGraph: { siteName: b.name, type: "website" },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { brandColor } = await getBranding();
  // brandColor is validated as a 6-digit hex with sufficient contrast before it ever reaches here.
  const themeCss = brandColor ? `:root{--blue:${brandColor};--blue-hover:color-mix(in srgb,${brandColor} 82%,#000)}` : null;
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>{themeCss && <style dangerouslySetInnerHTML={{ __html: themeCss }} />}</head>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
