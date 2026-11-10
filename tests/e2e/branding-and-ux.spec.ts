import { expect, test } from "@playwright/test";

// Runs against the mock Supabase (tests/e2e/support/mock-supabase.mjs): company "Nexora Systems" with a logo.
// Proves that name/logo shown across the site come from settings, not from hard-coded markup.

test.describe("branding comes from Admin settings", () => {
  test("title, favicon and header/footer use the configured company name and logo", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Nexora Systems/);
    await expect(page).not.toHaveTitle(/Quenvara/);
    await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute("href", /\/logo\.svg$/);
    await expect(page.locator("header").getByRole("link", { name: /Nexora Systems home/i })).toBeVisible();
    await expect(page.locator("header img").first()).toHaveAttribute("src", /logo\.svg$/);
    await expect(page.locator("footer img").first()).toHaveAttribute("src", /logo\.svg$/);
    await expect(page.locator("footer")).toContainText("Nexora Systems");
    expect(await page.locator("body").innerText()).not.toMatch(/Quenvara/);
  });
  test("organization structured data uses the configured name", async ({ page }) => {
    await page.goto("/");
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(ld).toContain("Nexora Systems");
  });
  test("inner pages use the configured name in the title template", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveTitle(/\| Nexora Systems$/);
  });
});

test.describe("navigation", () => {
  test("desktop shows every primary link, with the current page marked", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop navigation");
    await page.goto("/work");
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const label of ["Services", "Industries", "Work", "Products", "Insights", "About"]) await expect(nav.getByText(label, { exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Work" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Industries" })).toHaveAttribute("href", "/industries");
  });
  test("Services menu opens with service links on hover and keyboard", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop navigation");
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await nav.getByRole("button", { name: "Services" }).hover();
    await expect(nav.getByRole("link", { name: /Cybersecurity/ })).toBeVisible();
    await page.mouse.move(600, 600);
    await expect(nav.getByRole("link", { name: /Cybersecurity/ })).toBeHidden();
    await nav.getByRole("button", { name: "Services" }).focus();
    await page.keyboard.press("ArrowDown");
    await expect(nav.getByRole("link", { name: /Custom Software Engineering/ })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(nav.getByRole("link", { name: /Cybersecurity/ })).toBeHidden();
  });
  test("mobile drawer opens, lists links, and closes after navigating", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile navigation");
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect(drawer.getByRole("link", { name: "Industries" })).toBeVisible();
    await drawer.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(drawer).toBeHidden();
  });
});

test.describe("Discuss Your Project calls-to-action", () => {
  test("is present in header, hero and above the footer, all pointing to /contact", async ({ page, isMobile }) => {
    await page.goto("/");
    const links = page.getByRole("link", { name: "Discuss Your Project" });
    expect(await links.count()).toBeGreaterThanOrEqual(isMobile ? 2 : 3);
    for (const l of await links.all()) await expect(l).toHaveAttribute("href", "/contact");
  });
  test("project-starter chips pre-fill the contact form's service", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /^Cybersecurity$/ }).first().click();
    await expect(page).toHaveURL(/\/contact\?service=Cybersecurity/);
    await expect(page.getByLabel("Service of interest")).toHaveValue("Cybersecurity");
  });
  test("the closing CTA is not repeated on the contact page", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("#prefooter-cta")).toHaveCount(0);
  });
});

test.describe("animations", () => {
  test("below-the-fold content reveals on scroll", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop viewport check");
    await page.goto("/", { waitUntil: "networkidle" });
    const armed = page.locator(".reveal").first();
    await expect(armed).toBeAttached();
    await expect(armed).not.toHaveClass(/is-in/);
    await armed.scrollIntoViewIfNeeded();
    await expect(armed).toHaveClass(/is-in/);
  });
  test("hero content animates in and ends fully visible", async ({ page }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCSS("animation-name", "fade-up");
    await expect.poll(async () => Number(await h1.evaluate((e) => getComputedStyle(e).opacity))).toBe(1);
  });
  test("reduced motion disables animations and keeps content visible", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", baseURL });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    expect(await page.locator(".reveal").count()).toBe(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("animation-name", "none");
    await ctx.close();
  });
  test("no horizontal overflow with animations and the marquee", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
});
