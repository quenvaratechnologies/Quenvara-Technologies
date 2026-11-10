import { z } from "zod";

export const BUDGET_RANGES = ["Under $10k", "$10k–$50k", "$50k–$150k", "$150k–$500k", "$500k+", "Not sure yet"] as const;
export const TIMELINES = ["As soon as possible", "1–3 months", "3–6 months", "6+ months", "Just exploring"] as const;

const clean = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
const text = (max: number) => z.string().transform(clean).pipe(z.string().max(max));

export const contactSchema = z.object({
  name: text(120).pipe(z.string().min(2, "Enter your name")),
  email: z.string().trim().toLowerCase().email("Enter a valid business email").max(254),
  company: text(160).pipe(z.string().min(1, "Enter your company name")),
  phone: text(40).optional().transform((v) => (v ? v : null)).refine((v) => v === null || /^[+()\d\s.-]{6,40}$/.test(v), "Enter a valid phone number"),
  service_interest: text(120).optional().transform((v) => v || null),
  budget_range: z.enum(BUDGET_RANGES).optional().or(z.literal("").transform(() => undefined)),
  project_timeline: z.enum(TIMELINES).optional().or(z.literal("").transform(() => undefined)),
  message: text(5000).pipe(z.string().min(10, "Tell us a little more (at least 10 characters)")),
  consent: z.literal(true, { message: "Please accept the privacy notice to continue" }),
  // Honeypot: real users never fill this in.
  website: z.string().max(0).optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const applicationSchema = z.object({
  job_id: z.string().uuid(),
  full_name: text(120).pipe(z.string().min(2, "Enter your full name")),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  phone: text(40).optional().transform((v) => (v ? v : null)),
  cover_letter: text(5000).optional().transform((v) => v || null),
  consent: z.literal(true, { message: "Please accept the privacy notice to continue" }),
  website: z.string().max(0).optional(),
});

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const RESUME_TYPES: Record<string, { ext: string; magic: (b: Uint8Array) => boolean }> = {
  "application/pdf": { ext: "pdf", magic: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 },
  "application/msword": { ext: "doc", magic: (b) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { ext: "docx", magic: (b) => b[0] === 0x50 && b[1] === 0x4b },
};
