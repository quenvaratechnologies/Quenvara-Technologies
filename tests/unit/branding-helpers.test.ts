import { describe, expect, it } from "vitest";
import { contrastWithWhite, isReadableBrandColor } from "@/lib/color";
import { splitHeadline } from "@/lib/text";
import { SETTING_GROUPS } from "@/lib/admin/settings-groups";

describe("brand colour safety", () => {
  it("accepts dark, readable colours", () => {
    for (const c of ["#2563EB", "#4f46e5", "#0b1220", "#15803d"]) expect(isReadableBrandColor(c)).toBe(true);
  });
  it("rejects colours where white button text would be unreadable", () => {
    for (const c of ["#22d3ee", "#ffff00", "#f3f6fa"]) expect(isReadableBrandColor(c)).toBe(false);
  });
  it("rejects anything that is not a 6-digit hex (no CSS injection)", () => {
    for (const c of ["red", "#fff", "#2563eb;}body{display:none", "url(x)", ""]) expect(isReadableBrandColor(c)).toBe(false);
  });
  it("computes known contrast ratios", () => {
    expect(contrastWithWhite("#000000")).toBeCloseTo(21, 0);
    expect(contrastWithWhite("#ffffff")).toBeCloseTo(1, 1);
  });
  it("theme settings schema enforces the same rules", () => {
    const s = SETTING_GROUPS.theme.schema;
    expect(s.safeParse({ brand_color: "#2563EB" }).success).toBe(true);
    expect(s.safeParse({ brand_color: "" }).success).toBe(true);
    expect(s.safeParse({ brand_color: "#ffff00" }).success).toBe(false);
    expect(s.safeParse({ brand_color: "blue" }).success).toBe(false);
  });
});

describe("splitHeadline", () => {
  it("splits at the first sentence", () => expect(splitHeadline("Engineering Digital Solutions. Building What Comes Next.")).toEqual(["Engineering Digital Solutions.", "Building What Comes Next."]));
  it("keeps single sentences whole", () => expect(splitHeadline("Build better software")).toEqual(["Build better software", ""]));
  it("handles empty input", () => expect(splitHeadline("")).toEqual(["", ""]));
});
