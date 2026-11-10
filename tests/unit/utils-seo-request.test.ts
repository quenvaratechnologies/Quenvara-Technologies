import { describe, expect, it } from "vitest";
import { generateReferenceCode, readingTime, slugify } from "@/lib/utils";
import { breadcrumbLd, buildMetadata, jsonLd } from "@/lib/seo";
import { clientIp, sameOrigin } from "@/lib/security/request";

const h = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null });

describe("utils", () => {
  it("slugifies", () => {
    expect(slugify("AI & Generative AI!")).toBe("ai-generative-ai");
    expect(slugify("  Café  Déjà vu ")).toBe("cafe-deja-vu");
  });
  it("estimates reading time (min 1)", () => {
    expect(readingTime("<p>short</p>")).toBe(1);
    expect(readingTime("<p>" + "word ".repeat(660) + "</p>")).toBe(3);
  });
  it("generates unique-looking reference codes", () => {
    const a = generateReferenceCode(new Date("2026-03-01T00:00:00Z"));
    expect(a).toMatch(/^AVQ-2026-[0-9A-Z]{6}$/);
    expect(new Set(Array.from({ length: 50 }, () => generateReferenceCode())).size).toBeGreaterThan(45);
  });
});

describe("seo", () => {
  it("builds canonical + open graph metadata", () => {
    const m = buildMetadata({ title: "T", description: "D", path: "/services/x" });
    expect(String(m.alternates?.canonical)).toMatch(/\/services\/x$/);
    expect(m.openGraph?.title).toBe("T");
  });
  it("noindex is honoured", () => expect(buildMetadata({ title: "T", path: "/p", noindex: true }).robots).toEqual({ index: false, follow: false }));
  it("escapes < in JSON-LD to prevent script-tag breakout", () => {
    expect(jsonLd({ "@type": "Thing", name: "</script><script>alert(1)" })).not.toContain("</script>");
  });
  it("builds ordered breadcrumbs", () => {
    const b = JSON.parse(breadcrumbLd([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]));
    expect(b.itemListElement.map((i: { position: number }) => i.position)).toEqual([1, 2]);
  });
});

describe("request helpers", () => {
  it("extracts the first forwarded IP", () => expect(clientIp(h({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4"));
  it("falls back safely", () => expect(clientIp(h({}))).toBe("unknown"));
  it("rejects cross-origin posts", () => {
    expect(sameOrigin(h({ origin: "https://evil.example" }), "https://aveniq.example")).toBe(false);
    expect(sameOrigin(h({ origin: "https://aveniq.example" }), "https://aveniq.example")).toBe(true);
    expect(sameOrigin(h({ origin: "not a url" }), "https://aveniq.example")).toBe(false);
  });
});
