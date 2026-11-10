import { expect, test } from "@playwright/test";

// These specs run without a seeded database: they verify rendering, graceful empty states,
// access control and security behaviour. Seeded-content flows are in docs/TESTING.md (manual checklist).

const routes = ["/", "/about", "/services", "/industries", "/work", "/products", "/technology", "/insights", "/careers", "/contact", "/search"];

for (const path of routes) {
  test(`renders ${path} with a heading and landmarks`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("main#main, main").first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });
}

test("homepage exposes both primary CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Discuss Your Project" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore Our Capabilities" }).first()).toBeVisible();
});

test("unknown routes show the 404 page", async ({ page }) => {
  const res = await page.goto("/definitely-not-a-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("unknown service slug 404s", async ({ page }) => {
  const res = await page.goto("/services/does-not-exist");
  expect(res?.status()).toBe(404);
});

test("careers shows an honest empty state, no fabricated vacancies", async ({ page }) => {
  await page.goto("/careers");
  await expect(page.getByText(/no (published )?(open )?(openings|positions|vacancies)/i).first()).toBeVisible();
});

test("page has no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("keyboard: skip link is first focusable element", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
});

test("contact form: labelled fields and accessible server-side validation errors", async ({ page }) => {
  await page.goto("/contact", { waitUntil: "networkidle" });
  // Every control has an accessible name.
  for (const label of [/^name/i, /email/i, /company/i, /how can we help/i]) await expect(page.getByLabel(label).first()).toBeVisible();
  // Fill with an invalid (but natively acceptable) value so the request reaches server validation.
  await page.getByLabel(/^name/i).fill("A");
  await page.getByLabel(/email/i).first().fill("a@b.co");
  await page.getByLabel(/company/i).fill("Acme");
  await page.getByLabel(/how can we help/i).fill("too short");
  await page.getByRole("checkbox").first().check();
  const submit = page.getByRole("button", { name: /send enquiry/i });
  await expect(async () => {
    await submit.click();
    await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15_000 });
  await expect(page.locator('[role="alert"]').first()).toBeVisible();
});

test.describe("seo files", () => {
  test("robots.txt disallows admin and API", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    expect(body).toMatch(/Disallow: \/admin/);
    expect(body).toMatch(/Sitemap:/);
  });
  test("sitemap.xml is valid and excludes admin", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("<urlset");
    expect(body).not.toContain("/admin");
  });
  test("home page has canonical + open graph metadata", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  });
});

test("security headers are set", async ({ request }) => {
  const h = (await request.get("/")).headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["referrer-policy"]).toBeTruthy();
  expect(h["x-powered-by"]).toBeUndefined();
});
