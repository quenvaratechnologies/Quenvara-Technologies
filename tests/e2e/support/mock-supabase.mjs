#!/usr/bin/env node
/**
 * Tiny PostgREST stand-in used ONLY by the e2e suite so pages render with realistic content
 * (company settings, services, industries …) without a Supabase project.
 * It ignores filters and returns canned rows; it is not a database.
 */
import http from "node:http";

const PORT = Number(process.env.MOCK_PORT ?? 54399);
const ORIGIN = `http://127.0.0.1:${PORT}`;

const settings = [
  { key: "company", value: { name: "Nexora Systems", tagline: "Engineering Digital Solutions. Building What Comes Next.", description: "Nexora Systems builds software, AI and cloud platforms.", logo: `${ORIGIN}/logo.svg`, logo_only: false, email: "hello@nexora.example", phone: null, offices: [], social: {} } },
  { key: "hero", value: { headline: "Engineering Digital Solutions. Building What Comes Next.", subheadline: "Software engineering, AI, cybersecurity, cloud and data.", primary_cta: "Discuss Your Project", secondary_cta: "Explore Our Capabilities" } },
  { key: "contact_cta", value: { heading: "Tell us what you are building.", body: "Share a few details and we will respond with next steps." } },
  { key: "theme", value: { brand_color: process.env.MOCK_BRAND_COLOR ?? "" } },
  { key: "announcement", value: { enabled: false } },
];
const svc = (i, title, icon, category) => ({ id: `s${i}`, title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"), summary: `Sample summary for ${title}.`, category, icon, cover_image: null, featured: true, sort_order: i });
const services = [
  svc(1, "Custom Software Engineering", "code", "Software Engineering"), svc(2, "Web Application Development", "globe", "Web Application Development"),
  svc(3, "Mobile Application Development", "smartphone", "Mobile Application Development"), svc(4, "AI & Generative AI", "sparkles", "AI & Generative AI"),
  svc(5, "Cybersecurity", "shield", "Cybersecurity"), svc(6, "Cloud Engineering", "cloud", "Cloud Engineering"),
];
const industries = ["Financial Services", "Healthcare", "Retail and E-commerce", "Manufacturing"].map((name, i) => ({ id: `i${i}`, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), summary: `Sample summary for ${name}.`, cover_image: null, sort_order: i }));
const technologies = ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "Python", "Docker", "Supabase"].map((name, i) => ({ id: `t${i}`, name, slug: name.toLowerCase(), category: i < 3 ? "Frontend" : i < 5 ? "Backend" : "DevOps", display_order: i }));
const projects = [{ id: "p1", title: "Concept: Operations Dashboard", slug: "concept-operations-dashboard", summary: "[Concept project] Illustrative only.", project_type: "concept", featured_image: null, industries: { name: "Manufacturing" } }];
const products = [{ id: "pr1", name: "Sample Product Concept", slug: "sample-product-concept", summary: "[Concept] Not available.", product_status: "concept", pricing_model: "not_announced", logo_url: null, cover_image: null }];

const DATA = { site_settings: settings, services, industries, technologies, projects, products };
const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="32" viewBox="0 0 120 32"><rect width="32" height="32" rx="8" fill="#0b1220"/><path d="M8 22V10l16 12V10" stroke="#22d3ee" stroke-width="3" fill="none"/></svg>`;

http.createServer((req, res) => {
  const url = new URL(req.url, ORIGIN);
  const send = (code, body, type = "application/json", headers = {}) => { res.writeHead(code, { "content-type": type, ...headers }); res.end(typeof body === "string" ? body : JSON.stringify(body)); };
  if (url.pathname === "/logo.svg") return send(200, LOGO, "image/svg+xml");
  if (url.pathname === "/auth/v1/user") return send(401, { message: "no session" });
  if (url.pathname.startsWith("/rest/v1/rpc/")) return send(200, true);
  const m = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/);
  if (!m) return send(404, { message: "not found" });
  if (req.method !== "GET" && req.method !== "HEAD") return send(201, []);
  const rows = DATA[m[1]] ?? [];
  const range = rows.length ? `0-${rows.length - 1}/${rows.length}` : "*/0";
  if ((req.headers.accept ?? "").includes("pgrst.object+json")) return rows.length ? send(200, rows[0]) : send(406, { code: "PGRST116", message: "no rows" });
  send(200, rows, "application/json", { "content-range": range });
}).listen(PORT, "127.0.0.1", () => console.log(`mock supabase on ${ORIGIN}`));
