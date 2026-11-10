import { describe, expect, it } from "vitest";
import { sanitizeRichText, stripTags } from "@/lib/security/sanitize";

describe("sanitizeRichText", () => {
  it("removes scripts, handlers and iframes", () => {
    const out = sanitizeRichText('<p onclick="x()">Hi</p><script>alert(1)</script><iframe src="https://evil"></iframe>');
    expect(out).toBe("<p>Hi</p>");
  });
  it("blocks javascript: and data: URLs", () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
    expect(sanitizeRichText('<img src="data:text/html;base64,AAAA">')).not.toContain("data:");
  });
  it("hardens external links", () => {
    const out = sanitizeRichText('<a href="https://example.com">x</a>');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain('target="_blank"');
  });
  it("keeps supported formatting", () => {
    const html = "<h2>T</h2><ul><li>a</li></ul><blockquote>q</blockquote><pre><code>c</code></pre>";
    expect(sanitizeRichText(html)).toBe(html);
  });
  it("lazy-loads images and strips style attributes", () => {
    const out = sanitizeRichText('<img src="https://x/y.png" alt="a" style="position:fixed">');
    expect(out).toContain('loading="lazy"');
    expect(out).not.toContain("style");
  });
  it("handles empty input", () => expect(sanitizeRichText("")).toBe(""));
});

describe("stripTags", () => {
  it("returns plain text only", () => expect(stripTags("<b>Hello</b> <script>x</script>world")).toBe("Hello world"));
});
