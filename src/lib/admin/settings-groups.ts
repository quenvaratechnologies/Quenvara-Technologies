import { z } from "zod";
import { stripTags } from "@/lib/security/sanitize";
import { HEX6, isReadableBrandColor } from "@/lib/color";

const url = z.string().trim().max(500).refine((v) => v === "" || /^https?:\/\//i.test(v), "Must start with http:// or https://");
const optText = (n: number) => z.string().trim().max(n).transform((v) => stripTags(v));

export const SETTING_GROUPS = {
  company: {
    label: "Company",
    schema: z.object({
      name: optText(120).pipe(z.string().min(1, "Required")), tagline: optText(200), description: optText(500),
      email: z.string().trim().max(254).refine((v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Invalid email"),
      phone: optText(40), logo: url, logo_only: z.string().optional(),
      offices: z.string().max(2000),
      social_linkedin: url, social_x: url, social_github: url, social_youtube: url, social_facebook: url, social_instagram: url,
    }),
    fields: [
      ["name", "Company name"], ["tagline", "Tagline"], ["description", "Short description", "textarea"], ["email", "Main email"], ["phone", "Phone"], ["logo", "Logo (upload an image; leave empty for the default Quenvara mark)"], ["logo_only", "My logo already includes the company name (hide the text next to it)", "checkbox"],
      ["offices", "Public offices (one per line: Label | Address). Leave empty if none.", "textarea"],
      ["social_linkedin", "LinkedIn URL"], ["social_x", "X URL"], ["social_github", "GitHub URL"], ["social_youtube", "YouTube URL"], ["social_facebook", "Facebook URL"], ["social_instagram", "Instagram URL"],
    ],
  },
  hero: { label: "Homepage hero", schema: z.object({ headline: optText(160), subheadline: optText(300), primary_cta: optText(60), secondary_cta: optText(60) }), fields: [["headline", "Headline"], ["subheadline", "Subheadline", "textarea"], ["primary_cta", "Primary CTA label"], ["secondary_cta", "Secondary CTA label"]] },
  contact_cta: { label: "Contact CTA", schema: z.object({ heading: optText(160), body: optText(400) }), fields: [["heading", "Heading"], ["body", "Body", "textarea"]] },
  footer: { label: "Footer", schema: z.object({ summary: optText(300) }), fields: [["summary", "Brand summary", "textarea"]] },
  seo_defaults: { label: "SEO defaults", schema: z.object({ title_template: optText(100), description: optText(200) }), fields: [["title_template", "Title template (use %s)"], ["description", "Default meta description", "textarea"]] },
  theme: { label: "Theme", schema: z.object({ brand_color: z.string().trim().refine((v) => v === "" || HEX6.test(v), "Use a 6-digit hex colour such as #C8102E").refine((v) => v === "" || !HEX6.test(v) || isReadableBrandColor(v), "Too light: white button text would be hard to read. Choose a darker colour.") }), fields: [["brand_color", "Brand colour (hex, e.g. #C8102E). Leave empty for the default blue."]] },
  homepage_sections: {
    label: "Homepage sections (tick to hide)",
    schema: z.object({ hide_intro: z.string().optional(), hide_services: z.string().optional(), hide_expertise: z.string().optional(), hide_techstack: z.string().optional(), hide_industries: z.string().optional(), hide_projects: z.string().optional(), hide_packages: z.string().optional(), hide_why: z.string().optional(), hide_process: z.string().optional(), hide_testimonials: z.string().optional(), hide_insights: z.string().optional(), techstack_title: optText(120) }),
    fields: [["techstack_title", "Tech Stack heading"], ["hide_intro", "Hide company introduction", "checkbox"], ["hide_services", "Hide services", "checkbox"], ["hide_expertise", "Hide technology expertise", "checkbox"], ["hide_techstack", "Hide Tech Stack", "checkbox"], ["hide_industries", "Hide industries", "checkbox"], ["hide_projects", "Hide projects", "checkbox"], ["hide_packages", "Hide packages & pricing", "checkbox"], ["hide_why", "Hide Why choose us", "checkbox"], ["hide_process", "Hide process", "checkbox"], ["hide_testimonials", "Hide testimonials", "checkbox"], ["hide_insights", "Hide insights", "checkbox"]],
  },
  announcement: { label: "Announcement banner", schema: z.object({ enabled: z.string().optional(), text: optText(200), href: z.string().trim().max(300).refine((v) => v === "" || /^(\/|https?:\/\/)/.test(v), "Use a path or https:// URL") }), fields: [["enabled", "Show banner", "checkbox"], ["text", "Banner text"], ["href", "Link (optional)"]] },
} as const;
export type SettingKey = keyof typeof SETTING_GROUPS;
