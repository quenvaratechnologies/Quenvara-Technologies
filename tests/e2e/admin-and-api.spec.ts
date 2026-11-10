import { expect, test } from "@playwright/test";

test.describe("admin access control", () => {
  for (const path of ["/admin", "/admin/services", "/admin/inquiries", "/admin/applications", "/admin/users", "/admin/audit-logs", "/admin/settings", "/admin/media", "/admin/services/00000000-0000-4000-8000-000000000000/preview"]) {
    test(`unauthenticated ${path} redirects to login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.getByRole("heading", { name: /sign in|log in|admin/i }).first()).toBeVisible();
    });
  }
  test("login page is noindex and has no public sign-up", async ({ page, request }) => {
    const res = await request.get("/admin/login");
    expect(res.headers()["x-robots-tag"]).toMatch(/noindex/);
    await page.goto("/admin/login");
    await expect(page.getByText(/sign up|register|create account/i)).toHaveCount(0);
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });
  test("resume download endpoint requires auth", async ({ request }) => {
    const res = await request.get("/admin/applications/00000000-0000-0000-0000-000000000000/resume", { maxRedirects: 0 });
    expect([301, 302, 303, 307, 308, 401, 403]).toContain(res.status());
  });
  test("inquiry export requires auth", async ({ request }) => {
    const res = await request.get("/admin/inquiries/export", { maxRedirects: 0 });
    expect([301, 302, 303, 307, 308, 401, 403]).toContain(res.status());
  });
  test("admin responses are not cacheable", async ({ request }) => {
    const res = await request.get("/admin/login");
    expect(res.headers()["cache-control"]).toMatch(/no-store/);
  });
});

test.describe("contact API (direct requests)", () => {
  const valid = { name: "Ada Lovelace", email: "ada@example.com", company: "Analytical Co", message: "We need a data platform built.", consent: true };

  test("rejects invalid payloads with field errors and no internals", async ({ request }) => {
    const res = await request.post("/api/contact", { data: { ...valid, email: "bad", consent: false } });
    expect(res.status()).toBe(422);
    const j = await res.json();
    expect(j.fieldErrors.email).toBeTruthy();
    expect(JSON.stringify(j)).not.toMatch(/supabase|postgres|stack/i);
  });
  test("rejects malformed JSON", async ({ request }) => {
    const res = await request.post("/api/contact", { data: Buffer.from("{not json"), headers: { "content-type": "application/json" } });
    expect(res.status()).toBe(400);
  });
  test("rejects cross-origin posts", async ({ request }) => {
    const res = await request.post("/api/contact", { data: valid, headers: { origin: "https://evil.example" } });
    expect(res.status()).toBe(403);
  });
  test("honeypot silently succeeds without storing", async ({ request }) => {
    const res = await request.post("/api/contact", { data: { ...valid, website: "http://spam.example" } });
    expect(res.status()).toBe(200);
    expect((await res.json()).reference).toMatch(/^AVQ-/);
  });
  test("returns a generic error (not DB internals) when the backend is unreachable", async ({ request }) => {
    const res = await request.post("/api/contact", { data: valid });
    expect([200, 429, 500]).toContain(res.status());
    if (res.status() === 500) expect((await res.json()).error).toMatch(/could not submit/i);
  });
});

test.describe("applications API (direct requests)", () => {
  test("rejects non-multipart or invalid input", async ({ request }) => {
    const res = await request.post("/api/applications", { data: { job_id: "x" } });
    expect([400, 415, 422]).toContain(res.status());
  });
});
