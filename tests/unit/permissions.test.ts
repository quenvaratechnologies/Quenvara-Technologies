import { describe, expect, it } from "vitest";
import { can, isRole, readableResources, ROLES, RESOURCES } from "@/lib/permissions";

describe("permission matrix", () => {
  it("denies when role is missing or unknown", () => {
    expect(can(null, "services", "read")).toBe(false);
    expect(can(undefined, "services", "read")).toBe(false);
    expect(isRole("superuser")).toBe(false);
    expect(isRole("owner")).toBe(true);
  });
  it("owner can do everything", () => {
    for (const r of RESOURCES) for (const a of ["read", "create", "update", "publish", "delete"] as const) expect(can("owner", r, a)).toBe(true);
  });
  it("editor edits content but cannot delete or see sensitive data", () => {
    expect(can("editor", "posts", "publish")).toBe(true);
    expect(can("editor", "posts", "delete")).toBe(false);
    for (const r of ["inquiries", "applications", "users", "audit_logs", "settings"] as const) expect(can("editor", r, "read")).toBe(false);
  });
  it("sales is limited to inquiries", () => {
    expect(can("sales", "inquiries", "update")).toBe(true);
    expect(can("sales", "inquiries", "delete")).toBe(false);
    expect(can("sales", "applications", "read")).toBe(false);
    expect(can("sales", "services", "create")).toBe(false);
  });
  it("recruiter is limited to careers and applications", () => {
    expect(can("recruiter", "applications", "read")).toBe(true);
    expect(can("recruiter", "inquiries", "read")).toBe(false);
    expect(can("recruiter", "posts", "update")).toBe(false);
  });
  it("only owner manages users; administrator is read-only", () => {
    expect(can("administrator", "users", "read")).toBe(true);
    expect(can("administrator", "users", "update")).toBe(false);
    expect(can("owner", "users", "update")).toBe(true);
  });
  it("readableResources never exposes unauthorised areas", () => {
    expect(readableResources("sales")).not.toContain("settings");
    expect(readableResources("recruiter")).toContain("applications");
  });
  it("defines every role", () => expect(ROLES).toHaveLength(5));
});
