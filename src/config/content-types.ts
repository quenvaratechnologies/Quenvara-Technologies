import type { Resource } from "@/lib/permissions";

export type FieldType =
  | "text" | "textarea" | "richtext" | "slug" | "select" | "boolean"
  | "number" | "url" | "image" | "lines" | "datetime" | "relation" | "email";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  max?: number;
  options?: { value: string; label: string }[];
  /** relation: table + label column used to populate the select */
  relation?: { table: string; labelColumn: string };
  help?: string;
  /** slug fields derive from this field when empty */
  slugFrom?: string;
};

export type ContentType = {
  key: string;
  table: string;
  resource: Resource;
  singular: string;
  plural: string;
  titleField: string;
  /** Public path prefix used for cache revalidation + preview links. */
  publicPath?: string;
  statusColumn?: "status" | "product_status" | null;
  statuses: string[];
  searchColumns: string[];
  listColumns: { name: string; label: string }[];
  sortColumns: string[];
  defaultSort: { column: string; ascending: boolean };
  fields: Field[];
  /** Publishing helpers */
  publishable: boolean;
  /** Row has an is_sample flag */
  hasSampleFlag?: boolean;
};

const STATUS_OPTS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const SEO: Field[] = [
  { name: "seo_title", label: "SEO title", type: "text", max: 70, help: "Aim for under 60 characters." },
  { name: "seo_description", label: "SEO description", type: "textarea", max: 170, help: "Aim for under 160 characters." },
];

export const SERVICE_CATEGORIES = [
  "Software Engineering", "Web Application Development", "Mobile Application Development",
  "Enterprise Software", "AI & Generative AI", "Machine Learning", "AI Agents and Workflow Automation",
  "Cybersecurity", "Cloud Engineering", "DevOps and Infrastructure", "Data Engineering and Analytics",
  "IT Consulting", "Digital Transformation", "Quality Assurance and Testing", "Managed IT Services",
  "SaaS and Product Engineering", "API Development and Integration", "Emerging Technologies",
];

export const TECH_CATEGORIES = [
  "Frontend", "Backend", "Mobile", "AI and ML", "Cloud", "Databases",
  "DevOps", "Cybersecurity", "Data engineering", "Enterprise platforms",
];

export const CONTENT_TYPES: Record<string, ContentType> = {
  services: {
    key: "services", table: "services", resource: "services", singular: "Service", plural: "Services",
    titleField: "title", publicPath: "/services", statusColumn: "status", statuses: ["draft", "published", "archived"],
    searchColumns: ["title", "summary"], listColumns: [{ name: "title", label: "Title" }, { name: "category", label: "Category" }],
    sortColumns: ["title", "sort_order", "updated_at"], defaultSort: { column: "sort_order", ascending: true },
    publishable: true, hasSampleFlag: true,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 120 },
      { name: "slug", label: "Slug", type: "slug", required: true, slugFrom: "title" },
      { name: "category", label: "Category", type: "select", required: true, options: SERVICE_CATEGORIES.map((c) => ({ value: c, label: c })) },
      { name: "summary", label: "Summary", type: "textarea", required: true, max: 400 },
      { name: "description", label: "Description", type: "richtext" },
      { name: "challenges", label: "Business challenges addressed", type: "lines", help: "One per line." },
      { name: "deliverables", label: "Deliverables", type: "lines", help: "One per line." },
      { name: "process_steps", label: "Engagement process", type: "lines", help: "One step per line." },
      { name: "icon", label: "Icon name (Lucide)", type: "text", max: 40 },
      { name: "cover_image", label: "Cover image URL", type: "image" },
      { name: "featured", label: "Featured on homepage", type: "boolean" },
      { name: "sort_order", label: "Sort order", type: "number" },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTS },
      ...SEO,
    ],
  },
  industries: {
    key: "industries", table: "industries", resource: "industries", singular: "Industry", plural: "Industries",
    titleField: "name", publicPath: "/industries", statusColumn: "status", statuses: ["draft", "published", "archived"],
    searchColumns: ["name", "summary"], listColumns: [{ name: "name", label: "Name" }],
    sortColumns: ["name", "sort_order", "updated_at"], defaultSort: { column: "sort_order", ascending: true },
    publishable: true, hasSampleFlag: true,
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 120 },
      { name: "slug", label: "Slug", type: "slug", required: true, slugFrom: "name" },
      { name: "summary", label: "Summary", type: "textarea", required: true, max: 400 },
      { name: "description", label: "Description", type: "richtext" },
      { name: "challenges", label: "Challenges", type: "lines" },
      { name: "use_cases", label: "Use cases", type: "lines" },
      { name: "cover_image", label: "Cover image URL", type: "image" },
      { name: "sort_order", label: "Sort order", type: "number" },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTS },
      ...SEO,
    ],
  },
  projects: {
    key: "projects", table: "projects", resource: "projects", singular: "Project", plural: "Projects",
    titleField: "title", publicPath: "/work", statusColumn: "status", statuses: ["draft", "published", "archived"],
    searchColumns: ["title", "summary"], listColumns: [{ name: "title", label: "Title" }, { name: "project_type", label: "Type" }],
    sortColumns: ["title", "updated_at", "published_at"], defaultSort: { column: "updated_at", ascending: false },
    publishable: true, hasSampleFlag: true,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 120 },
      { name: "slug", label: "Slug", type: "slug", required: true, slugFrom: "title" },
      {
        name: "project_type", label: "Project type", type: "select", required: true,
        options: [
          { value: "client", label: "Client engagement" }, { value: "internal_demo", label: "Internal demo" },
          { value: "concept", label: "Concept project" }, { value: "open_source", label: "Open source" },
        ],
        help: "Concept and demo projects are labelled as such publicly. Never mark prototypes as client work.",
      },
      { name: "industry_id", label: "Industry", type: "relation", relation: { table: "industries", labelColumn: "name" } },
      { name: "summary", label: "Summary", type: "textarea", required: true, max: 400 },
      { name: "challenge", label: "Business problem", type: "richtext" },
      { name: "solution", label: "Solution", type: "richtext" },
      { name: "deliverables", label: "Deliverables", type: "lines" },
      { name: "client_permission_confirmed", label: "Client has authorised publication of their name", type: "boolean" },
      { name: "client_display_name", label: "Client name (only if authorised)", type: "text", max: 120 },
      { name: "outcomes_verified", label: "Outcomes have been verified", type: "boolean" },
      { name: "outcomes", label: "Verified outcomes", type: "richtext", help: "Stored only when outcomes are verified." },
      { name: "featured_image", label: "Featured image URL", type: "image" },
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTS },
      ...SEO,
    ],
  },
  products: {
    key: "products", table: "products", resource: "products", singular: "Product", plural: "Products",
    titleField: "name", publicPath: "/products", statusColumn: "status", statuses: ["draft", "published", "archived"],
    searchColumns: ["name", "summary"], listColumns: [{ name: "name", label: "Name" }, { name: "product_status", label: "Lifecycle" }],
    sortColumns: ["name", "sort_order", "updated_at"], defaultSort: { column: "sort_order", ascending: true },
    publishable: true, hasSampleFlag: true,
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 120 },
      { name: "slug", label: "Slug", type: "slug", required: true, slugFrom: "name" },
      {
        name: "product_status", label: "Product lifecycle", type: "select", required: true,
        options: [
          { value: "concept", label: "Concept" }, { value: "in_development", label: "In development" },
          { value: "beta", label: "Beta" }, { value: "available", label: "Available" }, { value: "discontinued", label: "Discontinued" },
        ],
        help: "Only mark 'Available' when the product is genuinely launched.",
      },
      { name: "summary", label: "Summary", type: "textarea", required: true, max: 400 },
      { name: "description", label: "Description", type: "richtext" },
      { name: "features", label: "Features", type: "lines" },
      { name: "benefits", label: "Benefits", type: "lines" },
      { name: "target_audience", label: "Target users", type: "textarea", max: 500 },
      {
        name: "pricing_model", label: "Pricing mode", type: "select",
        options: [
          { value: "not_announced", label: "Not announced" }, { value: "contact", label: "Contact us" }, { value: "free", label: "Free" },
          { value: "freemium", label: "Freemium" }, { value: "subscription", label: "Subscription" }, { value: "one_time", label: "One-time" },
        ],
      },
      { name: "logo_url", label: "Logo URL", type: "image" },
      { name: "cover_image", label: "Cover image URL", type: "image" },
      { name: "demo_url", label: "Demo URL", type: "url" },
      { name: "documentation_url", label: "Documentation URL", type: "url" },
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "sort_order", label: "Sort order", type: "number" },
      { name: "status", label: "Page status", type: "select", options: STATUS_OPTS },
      ...SEO,
    ],
  },
  technologies: {
    key: "technologies", table: "technologies", resource: "technologies", singular: "Technology", plural: "Technologies",
    titleField: "name", publicPath: "/technology", statusColumn: "status", statuses: ["draft", "published", "archived"],
    searchColumns: ["name"], listColumns: [{ name: "name", label: "Name" }, { name: "category", label: "Category" }],
    sortColumns: ["name", "category", "display_order"], defaultSort: { column: "category", ascending: true },
    publishable: true, hasSampleFlag: true,
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 80 },
      { name: "slug", label: "Slug", type: "slug", required: true, slugFrom: "name" },
      { name: "category", label: "Category", type: "select", required: true, options: TECH_CATEGORIES.map((c) => ({ value: c, label: c })) },
      { name: "description", label: "Description", type: "textarea", max: 300 },
      { name: "icon", label: "Icon name", type: "text", max: 40 },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTS },
    ],
  },
  posts: {
    key: "posts", table: "posts", resource: "posts", singular: "Article", plural: "Articles",
    titleField: "title", publicPath: "/insights", statusColumn: "status", statuses: ["draft", "published", "archived"],
    searchColumns: ["title", "excerpt"], listColumns: [{ name: "title", label: "Title" }, { name: "published_at", label: "Published" }],
    sortColumns: ["title", "updated_at", "published_at"], defaultSort: { column: "updated_at", ascending: false },
    publishable: true, hasSampleFlag: true,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 160 },
      { name: "slug", label: "Slug", type: "slug", required: true, slugFrom: "title" },
      { name: "excerpt", label: "Excerpt", type: "textarea", max: 400 },
      { name: "content", label: "Content", type: "richtext" },
      { name: "cover_image", label: "Cover image URL", type: "image" },
      { name: "category_id", label: "Category", type: "relation", relation: { table: "categories", labelColumn: "name" } },
      { name: "author_id", label: "Author", type: "relation", relation: { table: "team_members", labelColumn: "name" }, help: "Authors come from Team profiles." },
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "published_at", label: "Publish date", type: "datetime", help: "Future dates keep the article hidden until then." },
      { name: "canonical_url", label: "Canonical URL", type: "url" },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTS },
      ...SEO,
    ],
  },
  categories: {
    key: "categories", table: "categories", resource: "categories", singular: "Category", plural: "Categories",
    titleField: "name", statusColumn: null, statuses: [], searchColumns: ["name"], listColumns: [{ name: "name", label: "Name" }, { name: "slug", label: "Slug" }],
    sortColumns: ["name"], defaultSort: { column: "name", ascending: true }, publishable: false,
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 80 },
      { name: "slug", label: "Slug", type: "slug", required: true, slugFrom: "name" },
      { name: "description", label: "Description", type: "textarea", max: 300 },
    ],
  },
  tags: {
    key: "tags", table: "tags", resource: "tags", singular: "Tag", plural: "Tags",
    titleField: "name", statusColumn: null, statuses: [], searchColumns: ["name"], listColumns: [{ name: "name", label: "Name" }, { name: "slug", label: "Slug" }],
    sortColumns: ["name"], defaultSort: { column: "name", ascending: true }, publishable: false,
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 60 },
      { name: "slug", label: "Slug", type: "slug", required: true, slugFrom: "name" },
    ],
  },
  pages: {
    key: "pages", table: "pages", resource: "pages", singular: "Page", plural: "Pages",
    titleField: "title", publicPath: "/legal", statusColumn: "status", statuses: ["draft", "published", "archived"],
    searchColumns: ["title"], listColumns: [{ name: "title", label: "Title" }, { name: "page_type", label: "Type" }],
    sortColumns: ["title", "updated_at"], defaultSort: { column: "title", ascending: true }, publishable: true, hasSampleFlag: true,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 120 },
      { name: "slug", label: "Slug", type: "slug", required: true, slugFrom: "title" },
      { name: "page_type", label: "Page type", type: "select", required: true, options: [{ value: "standard", label: "Standard" }, { value: "legal", label: "Legal" }, { value: "about", label: "About" }] },
      { name: "content", label: "Content", type: "richtext", help: "Legal pages are drafts for legal review, not claims of compliance." },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTS },
      ...SEO,
    ],
  },
  team: {
    key: "team", table: "team_members", resource: "team", singular: "Team member", plural: "Team",
    titleField: "name", publicPath: "/about", statusColumn: "status", statuses: ["draft", "published", "archived"],
    searchColumns: ["name", "role_title"], listColumns: [{ name: "name", label: "Name" }, { name: "role_title", label: "Role" }],
    sortColumns: ["name", "display_order"], defaultSort: { column: "display_order", ascending: true }, publishable: true,
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 120 },
      { name: "role_title", label: "Role title", type: "text", max: 120 },
      { name: "bio", label: "Bio", type: "textarea", max: 1500 },
      { name: "avatar_url", label: "Photo URL", type: "image" },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTS },
    ],
  },
  testimonials: {
    key: "testimonials", table: "testimonials", resource: "testimonials", singular: "Testimonial", plural: "Testimonials",
    titleField: "person_name", statusColumn: "status", statuses: ["draft", "published", "archived"],
    searchColumns: ["person_name", "company_name"], listColumns: [{ name: "person_name", label: "Person" }, { name: "company_name", label: "Company" }],
    sortColumns: ["person_name", "display_order"], defaultSort: { column: "display_order", ascending: true }, publishable: true,
    fields: [
      { name: "person_name", label: "Person name", type: "text", required: true, max: 120 },
      { name: "job_title", label: "Job title", type: "text", max: 120 },
      { name: "company_name", label: "Company", type: "text", max: 120 },
      { name: "testimonial_text", label: "Testimonial", type: "textarea", required: true, max: 1200 },
      { name: "avatar_url", label: "Photo URL", type: "image" },
      { name: "permission_confirmed", label: "Written permission to publish confirmed", type: "boolean", help: "Required before publishing." },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTS },
    ],
  },
  packages: {
    key: "packages", table: "packages", resource: "packages", singular: "Package", plural: "Packages & pricing",
    titleField: "name", publicPath: "/pricing", statusColumn: "status", statuses: ["draft", "published", "archived"],
    searchColumns: ["name", "tagline"], listColumns: [{ name: "name", label: "Package" }, { name: "price_text", label: "Price" }],
    sortColumns: ["name", "display_order", "updated_at"], defaultSort: { column: "display_order", ascending: true }, publishable: true,
    fields: [
      { name: "name", label: "Package name", type: "text", required: true, max: 120 },
      { name: "slug", label: "Slug", type: "slug", required: true, slugFrom: "name" },
      { name: "tagline", label: "Tagline", type: "text", max: 200 },
      { name: "price_text", label: "Price (shown exactly as typed)", type: "text", required: true, max: 80 },
      { name: "billing_note", label: "Billing note (e.g. per month)", type: "text", max: 120 },
      { name: "description", label: "Description", type: "textarea", max: 1000 },
      { name: "features", label: "Features", type: "lines", help: "One per line." },
      { name: "highlighted", label: "Highlight this package", type: "boolean" },
      { name: "cta_label", label: "Button label", type: "text", max: 60 },
      { name: "cta_url", label: "Button link (path or https URL; defaults to contact)", type: "text", max: 300 },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTS },
    ],
  },
  faqs: {
    key: "faqs", table: "faqs", resource: "faqs", singular: "FAQ", plural: "FAQs",
    titleField: "question", statusColumn: "status", statuses: ["draft", "published", "archived"],
    searchColumns: ["question", "answer"], listColumns: [{ name: "question", label: "Question" }, { name: "category", label: "Category" }],
    sortColumns: ["display_order", "updated_at"], defaultSort: { column: "display_order", ascending: true }, publishable: true, hasSampleFlag: true,
    fields: [
      { name: "question", label: "Question", type: "text", required: true, max: 300 },
      { name: "answer", label: "Answer", type: "textarea", required: true, max: 3000 },
      { name: "category", label: "Category", type: "text", max: 60 },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTS },
    ],
  },
  careers: {
    key: "careers", table: "job_openings", resource: "careers", singular: "Job opening", plural: "Careers",
    titleField: "title", publicPath: "/careers", statusColumn: "status", statuses: ["draft", "published", "closed", "archived"],
    searchColumns: ["title", "department"], listColumns: [{ name: "title", label: "Title" }, { name: "department", label: "Department" }],
    sortColumns: ["title", "updated_at", "published_at"], defaultSort: { column: "updated_at", ascending: false }, publishable: true,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 120 },
      { name: "slug", label: "Slug", type: "slug", required: true, slugFrom: "title" },
      { name: "department", label: "Department", type: "text", max: 80 },
      { name: "location", label: "Location", type: "text", max: 120 },
      {
        name: "employment_type", label: "Employment type", type: "select", required: true,
        options: [{ value: "full_time", label: "Full-time" }, { value: "part_time", label: "Part-time" }, { value: "contract", label: "Contract" }, { value: "internship", label: "Internship" }],
      },
      { name: "description", label: "Description", type: "richtext" },
      { name: "requirements", label: "Requirements", type: "richtext" },
      { name: "status", label: "Status", type: "select", options: [...STATUS_OPTS, { value: "closed", label: "Closed" }] },
    ],
  },
  navigation: {
    key: "navigation", table: "navigation_items", resource: "navigation", singular: "Navigation item", plural: "Navigation",
    titleField: "label", statusColumn: null, statuses: [], searchColumns: ["label", "url"], listColumns: [{ name: "label", label: "Label" }, { name: "location", label: "Location" }, { name: "url", label: "URL" }],
    sortColumns: ["location", "display_order"], defaultSort: { column: "display_order", ascending: true }, publishable: false,
    fields: [
      { name: "label", label: "Label", type: "text", required: true, max: 60 },
      { name: "url", label: "URL", type: "text", required: true, max: 300, help: "Relative path (/about), https:// or mailto: only." },
      { name: "location", label: "Location", type: "select", required: true, options: [{ value: "header", label: "Header" }, { value: "footer_company", label: "Footer — company" }, { value: "footer_legal", label: "Footer — legal" }] },
      { name: "parent_id", label: "Parent item", type: "relation", relation: { table: "navigation_items", labelColumn: "label" } },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "is_visible", label: "Visible", type: "boolean" },
    ],
  },
};

export function getContentType(key: string): ContentType | undefined {
  return CONTENT_TYPES[key];
}
