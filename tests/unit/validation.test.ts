import { describe, expect, it } from "vitest";
import { applicationSchema, contactSchema, RESUME_TYPES } from "@/lib/validation/forms";

const valid = { name: "Ada Lovelace", email: "ADA@Example.com ", company: "Analytical Co", message: "We need a data platform built.", consent: true };

describe("contactSchema", () => {
  it("accepts and normalises valid input", () => {
    const r = contactSchema.parse(valid);
    expect(r.email).toBe("ada@example.com");
    expect(r.phone).toBeNull();
  });
  it("requires consent", () => expect(contactSchema.safeParse({ ...valid, consent: false }).success).toBe(false));
  it("rejects bad email, short message, missing company", () => {
    expect(contactSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: "short" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, company: "" }).success).toBe(false);
  });
  it("rejects invalid phone but allows empty", () => {
    expect(contactSchema.safeParse({ ...valid, phone: "abc" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, phone: "+1 (555) 123-4567" }).success).toBe(true);
    expect(contactSchema.safeParse({ ...valid, phone: "" }).success).toBe(true);
  });
  it("rejects values outside the controlled lists", () => {
    expect(contactSchema.safeParse({ ...valid, budget_range: "free lunch" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, budget_range: "$10k–$50k" }).success).toBe(true);
  });
  it("fails when the honeypot is filled", () => expect(contactSchema.safeParse({ ...valid, website: "http://spam" }).success).toBe(false));
  it("strips control characters and enforces max length", () => {
    expect(contactSchema.parse({ ...valid, name: "Ad\u0000a" }).name).toBe("Ada");
    expect(contactSchema.safeParse({ ...valid, message: "x".repeat(5001) }).success).toBe(false);
  });
});

describe("applicationSchema", () => {
  const app = { job_id: "11111111-1111-4111-8111-111111111111", full_name: "Grace Hopper", email: "g@h.com", consent: true };
  it("accepts valid applications", () => expect(applicationSchema.safeParse(app).success).toBe(true));
  it("requires a uuid job id", () => expect(applicationSchema.safeParse({ ...app, job_id: "1; drop table" }).success).toBe(false));
  it("requires consent", () => expect(applicationSchema.safeParse({ ...app, consent: false }).success).toBe(false));
});

describe("resume file signatures", () => {
  it("verifies magic bytes, not just the declared type", () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
    const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);
    expect(RESUME_TYPES["application/pdf"].magic(pdf)).toBe(true);
    expect(RESUME_TYPES["application/pdf"].magic(exe)).toBe(false);
    expect(RESUME_TYPES["application/vnd.openxmlformats-officedocument.wordprocessingml.document"].magic(exe)).toBe(false);
  });
});
